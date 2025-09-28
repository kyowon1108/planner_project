from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
import json

from database import get_db
from models.time_entry import TimeEntry, TimeEntryPause, ProductivityMetrics
from models.user import User
from models.todo import Todo
from models.planner import Planner
from schemas.time_entry import (
    TimeEntryCreate, TimeEntryUpdate, TimeEntryResponse,
    TimeEntryPauseCreate, TimeEntryPauseResponse,
    ProductivityMetricsResponse, TimeTrackingSummary,
    StartTimeTrackingRequest, StopTimeTrackingRequest
)
from api.v1.users import get_current_user
from services.time_service import TimeService

router = APIRouter(prefix="/time-tracking", tags=["time-tracking"])


# === 시간 추적 시작/중지 ===

@router.post("/start", response_model=TimeEntryResponse)
async def start_time_tracking(
    request: StartTimeTrackingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """새로운 작업의 시간 추적을 시작합니다."""
    try:
        # 진행 중인 다른 작업이 있는지 확인
        active_entry = db.query(TimeEntry).filter(
            and_(
                TimeEntry.user_id == current_user.id,
                TimeEntry.is_active == True,
                TimeEntry.end_time.is_(None)
            )
        ).first()
        
        if active_entry:
            raise HTTPException(
                status_code=400, 
                detail=f"이미 진행 중인 작업이 있습니다: {active_entry.title}"
            )
        
        # 연관된 Todo/Planner 검증
        todo = None
        planner = None
        if request.todo_id:
            todo = db.query(Todo).filter(Todo.id == request.todo_id).first()
            if not todo:
                raise HTTPException(status_code=404, detail="해당 할 일을 찾을 수 없습니다")
        
        if request.planner_id:
            planner = db.query(Planner).filter(Planner.id == request.planner_id).first()
            if not planner:
                raise HTTPException(status_code=404, detail="해당 플래너를 찾을 수 없습니다")
        
        # 새 시간 기록 생성
        time_entry = TimeEntry(
            user_id=current_user.id,
            todo_id=request.todo_id,
            planner_id=request.planner_id,
            title=request.title,
            description=request.description,
            category=request.category,
            priority=request.priority or "medium",
            start_time=TimeService.now_kst(),
            is_active=True,
            environment_tags=json.dumps(request.environment_tags) if request.environment_tags else None
        )
        
        db.add(time_entry)
        db.commit()
        db.refresh(time_entry)
        
        return time_entry
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"시간 추적 시작 실패: {str(e)}")


@router.post("/stop/{time_entry_id}", response_model=TimeEntryResponse)
async def stop_time_tracking(
    time_entry_id: int,
    request: StopTimeTrackingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """진행 중인 작업의 시간 추적을 중지합니다."""
    try:
        time_entry = db.query(TimeEntry).filter(
            and_(
                TimeEntry.id == time_entry_id,
                TimeEntry.user_id == current_user.id,
                TimeEntry.is_active == True
            )
        ).first()
        
        if not time_entry:
            raise HTTPException(
                status_code=404, 
                detail="진행 중인 시간 추적을 찾을 수 없습니다"
            )
        
        # 시간 추적 종료
        time_entry.end_time = TimeService.now_kst()
        time_entry.is_active = False
        time_entry.update_duration()
        
        # 추가 정보 업데이트
        if request.notes:
            time_entry.notes = request.notes
        if request.productivity_score is not None:
            time_entry.productivity_score = request.productivity_score
        if request.focus_score is not None:
            time_entry.focus_score = request.focus_score
        if request.mood_rating is not None:
            time_entry.mood_rating = request.mood_rating
        
        db.commit()
        db.refresh(time_entry)
        
        # 일별 생산성 메트릭 업데이트
        await _update_daily_productivity_metrics(db, current_user.id, time_entry.start_time.date())
        
        return time_entry
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"시간 추적 중지 실패: {str(e)}")


@router.post("/{time_entry_id}/pause", response_model=TimeEntryPauseResponse)
async def pause_time_tracking(
    time_entry_id: int,
    request: TimeEntryPauseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """작업을 일시 중단합니다."""
    try:
        time_entry = db.query(TimeEntry).filter(
            and_(
                TimeEntry.id == time_entry_id,
                TimeEntry.user_id == current_user.id,
                TimeEntry.is_active == True
            )
        ).first()
        
        if not time_entry:
            raise HTTPException(status_code=404, detail="진행 중인 시간 추적을 찾을 수 없습니다")
        
        # 중단 기록 생성
        pause_entry = TimeEntryPause(
            time_entry_id=time_entry_id,
            pause_start=TimeService.now_kst(),
            reason=request.reason,
            notes=request.notes
        )
        
        db.add(pause_entry)
        time_entry.pause_count += 1
        
        db.commit()
        db.refresh(pause_entry)
        
        return pause_entry
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"작업 중단 실패: {str(e)}")


@router.post("/pause/{pause_id}/resume", response_model=TimeEntryPauseResponse)
async def resume_time_tracking(
    pause_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """중단된 작업을 재시작합니다."""
    try:
        pause_entry = db.query(TimeEntryPause).join(TimeEntry).filter(
            and_(
                TimeEntryPause.id == pause_id,
                TimeEntry.user_id == current_user.id,
                TimeEntryPause.pause_end.is_(None)
            )
        ).first()
        
        if not pause_entry:
            raise HTTPException(status_code=404, detail="중단 기록을 찾을 수 없습니다")
        
        # 중단 종료
        pause_entry.pause_end = TimeService.now_kst()
        pause_entry.update_duration()
        
        # 총 중단 시간 업데이트
        time_entry = pause_entry.time_entry
        time_entry.pause_duration_minutes = (time_entry.pause_duration_minutes or 0) + pause_entry.pause_duration_minutes
        
        db.commit()
        db.refresh(pause_entry)
        
        return pause_entry
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"작업 재시작 실패: {str(e)}")


# === 시간 기록 조회 및 관리 ===

@router.get("/entries", response_model=List[TimeEntryResponse])
async def get_time_entries(
    start_date: Optional[date] = Query(None, description="조회 시작 날짜"),
    end_date: Optional[date] = Query(None, description="조회 종료 날짜"),
    category: Optional[str] = Query(None, description="카테고리 필터"),
    todo_id: Optional[int] = Query(None, description="특정 할 일의 시간 기록"),
    planner_id: Optional[int] = Query(None, description="특정 플래너의 시간 기록"),
    is_active: Optional[bool] = Query(None, description="진행 중인 작업만 조회"),
    limit: int = Query(100, le=500, description="조회 개수 제한"),
    offset: int = Query(0, description="조회 시작 위치"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """시간 기록 목록을 조회합니다."""
    
    query = db.query(TimeEntry).filter(TimeEntry.user_id == current_user.id)
    
    # 필터 적용
    if start_date:
        query = query.filter(TimeEntry.start_time >= start_date)
    if end_date:
        query = query.filter(TimeEntry.start_time <= end_date + timedelta(days=1))
    if category:
        query = query.filter(TimeEntry.category == category)
    if todo_id:
        query = query.filter(TimeEntry.todo_id == todo_id)
    if planner_id:
        query = query.filter(TimeEntry.planner_id == planner_id)
    if is_active is not None:
        query = query.filter(TimeEntry.is_active == is_active)
    
    # 정렬 및 페이징
    query = query.order_by(desc(TimeEntry.start_time))
    entries = query.offset(offset).limit(limit).all()
    
    return entries


@router.get("/entries/{entry_id}", response_model=TimeEntryResponse)
async def get_time_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """특정 시간 기록의 상세 정보를 조회합니다."""
    
    entry = db.query(TimeEntry).filter(
        and_(
            TimeEntry.id == entry_id,
            TimeEntry.user_id == current_user.id
        )
    ).first()
    
    if not entry:
        raise HTTPException(status_code=404, detail="시간 기록을 찾을 수 없습니다")
    
    return entry


@router.put("/entries/{entry_id}", response_model=TimeEntryResponse)
async def update_time_entry(
    entry_id: int,
    request: TimeEntryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """시간 기록을 수정합니다."""
    try:
        entry = db.query(TimeEntry).filter(
            and_(
                TimeEntry.id == entry_id,
                TimeEntry.user_id == current_user.id
            )
        ).first()
        
        if not entry:
            raise HTTPException(status_code=404, detail="시간 기록을 찾을 수 없습니다")
        
        # 수정 가능한 필드 업데이트
        update_data = request.dict(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(entry, field):
                setattr(entry, field, value)
        
        # 수동 시간 수정인 경우 표시
        if 'start_time' in update_data or 'end_time' in update_data or 'duration_minutes' in update_data:
            entry.is_manual = True
        
        # duration 재계산
        if 'start_time' in update_data or 'end_time' in update_data:
            entry.update_duration()
        
        db.commit()
        db.refresh(entry)
        
        return entry
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"시간 기록 수정 실패: {str(e)}")


@router.delete("/entries/{entry_id}")
async def delete_time_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """시간 기록을 삭제합니다."""
    try:
        entry = db.query(TimeEntry).filter(
            and_(
                TimeEntry.id == entry_id,
                TimeEntry.user_id == current_user.id
            )
        ).first()
        
        if not entry:
            raise HTTPException(status_code=404, detail="시간 기록을 찾을 수 없습니다")
        
        db.delete(entry)
        db.commit()
        
        return {"message": "시간 기록이 삭제되었습니다"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"시간 기록 삭제 실패: {str(e)}")


# === 통계 및 분석 ===

@router.get("/summary", response_model=TimeTrackingSummary)
async def get_time_tracking_summary(
    start_date: Optional[date] = Query(None, description="조회 시작 날짜"),
    end_date: Optional[date] = Query(None, description="조회 종료 날짜"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """시간 추적 요약 통계를 조회합니다."""
    
    # 기본 날짜 범위 설정 (최근 7일)
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=6)
    
    query = db.query(TimeEntry).filter(
        and_(
            TimeEntry.user_id == current_user.id,
            TimeEntry.start_time >= start_date,
            TimeEntry.start_time <= end_date + timedelta(days=1)
        )
    )
    
    entries = query.all()
    
    # 통계 계산
    total_entries = len(entries)
    total_minutes = sum(entry.actual_duration_minutes for entry in entries)
    completed_tasks = len([e for e in entries if not e.is_active])
    
    # 카테고리별 시간 분배
    category_distribution = {}
    for entry in entries:
        category = entry.category or "기타"
        category_distribution[category] = category_distribution.get(category, 0) + entry.actual_duration_minutes
    
    # 일별 작업 시간
    daily_minutes = {}
    for entry in entries:
        day = entry.start_time.date().isoformat()
        daily_minutes[day] = daily_minutes.get(day, 0) + entry.actual_duration_minutes
    
    # 평균 생산성 점수
    productivity_scores = [e.productivity_score for e in entries if e.productivity_score is not None]
    avg_productivity = sum(productivity_scores) / len(productivity_scores) if productivity_scores else None
    
    return TimeTrackingSummary(
        period_start=start_date,
        period_end=end_date,
        total_entries=total_entries,
        total_minutes=total_minutes,
        completed_tasks=completed_tasks,
        active_tasks=total_entries - completed_tasks,
        category_distribution=category_distribution,
        daily_minutes=daily_minutes,
        average_productivity_score=avg_productivity
    )


@router.get("/productivity/daily", response_model=List[ProductivityMetricsResponse])
async def get_daily_productivity_metrics(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """일별 생산성 메트릭을 조회합니다."""
    
    if not end_date:
        end_date = date.today()
    if not start_date:
        start_date = end_date - timedelta(days=29)  # 최근 30일
    
    metrics = db.query(ProductivityMetrics).filter(
        and_(
            ProductivityMetrics.user_id == current_user.id,
            ProductivityMetrics.date >= start_date,
            ProductivityMetrics.date <= end_date
        )
    ).order_by(ProductivityMetrics.date).all()
    
    return metrics


# === 헬퍼 함수 ===

async def _update_daily_productivity_metrics(db: Session, user_id: int, target_date: date):
    """특정 날짜의 일별 생산성 메트릭을 업데이트합니다."""
    try:
        # 해당 날짜의 모든 시간 기록 조회
        entries = db.query(TimeEntry).filter(
            and_(
                TimeEntry.user_id == user_id,
                func.date(TimeEntry.start_time) == target_date
            )
        ).all()
        
        if not entries:
            return
        
        # 메트릭 계산
        total_work_minutes = sum(entry.actual_duration_minutes for entry in entries)
        focused_work_minutes = sum(entry.actual_duration_minutes for entry in entries if entry.focus_score and entry.focus_score >= 7)
        break_minutes = sum(entry.pause_duration_minutes or 0 for entry in entries)
        interruption_count = sum(entry.pause_count for entry in entries)
        
        tasks_completed = len([e for e in entries if not e.is_active])
        tasks_started = len(entries)
        
        # 생산성 점수 계산 (가중 평균)
        productivity_scores = [e.productivity_score for e in entries if e.productivity_score is not None]
        productivity_score = sum(productivity_scores) / len(productivity_scores) if productivity_scores else None
        
        focus_scores = [e.focus_score for e in entries if e.focus_score is not None]
        focus_score = sum(focus_scores) / len(focus_scores) if focus_scores else None
        
        efficiency_ratio = focused_work_minutes / total_work_minutes if total_work_minutes > 0 else 0
        
        # 카테고리별 시간 분배
        category_distribution = {}
        for entry in entries:
            category = entry.category or "기타"
            category_distribution[category] = category_distribution.get(category, 0) + entry.actual_duration_minutes
        
        # 기존 메트릭 찾기 또는 새로 생성
        metric = db.query(ProductivityMetrics).filter(
            and_(
                ProductivityMetrics.user_id == user_id,
                ProductivityMetrics.date == target_date
            )
        ).first()
        
        if not metric:
            metric = ProductivityMetrics(user_id=user_id, date=target_date)
            db.add(metric)
        
        # 메트릭 업데이트
        metric.total_work_minutes = total_work_minutes
        metric.focused_work_minutes = focused_work_minutes
        metric.break_minutes = break_minutes
        metric.interruption_count = interruption_count
        metric.tasks_completed = tasks_completed
        metric.tasks_started = tasks_started
        metric.productivity_score = productivity_score
        metric.focus_score = focus_score
        metric.efficiency_ratio = efficiency_ratio
        metric.category_time_distribution = json.dumps(category_distribution, ensure_ascii=False)
        
        db.commit()
        
    except Exception as e:
        db.rollback()
        print(f"일별 생산성 메트릭 업데이트 실패: {e}")


@router.post("/manual-entry", response_model=TimeEntryResponse)
async def create_manual_time_entry(
    request: TimeEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """수동으로 시간 기록을 생성합니다."""
    try:
        # 시간 검증
        if request.start_time >= request.end_time:
            raise HTTPException(status_code=400, detail="종료 시간은 시작 시간보다 늦어야 합니다")
        
        # 수동 시간 기록 생성
        time_entry = TimeEntry(
            user_id=current_user.id,
            todo_id=request.todo_id,
            planner_id=request.planner_id,
            title=request.title,
            description=request.description,
            category=request.category,
            priority=request.priority or "medium",
            start_time=request.start_time,
            end_time=request.end_time,
            is_active=False,
            is_manual=True,
            productivity_score=request.productivity_score,
            focus_score=request.focus_score,
            mood_rating=request.mood_rating,
            environment_tags=json.dumps(request.environment_tags) if request.environment_tags else None,
            notes=request.notes
        )
        
        time_entry.update_duration()
        
        db.add(time_entry)
        db.commit()
        db.refresh(time_entry)
        
        # 일별 메트릭 업데이트
        await _update_daily_productivity_metrics(db, current_user.id, time_entry.start_time.date())
        
        return time_entry
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"수동 시간 기록 생성 실패: {str(e)}")