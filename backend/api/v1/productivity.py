"""
생산성 분석 API 엔드포인트

시간 추적 데이터를 기반으로 한 고급 생산성 분석 기능을 제공합니다.
개인 및 팀 생산성 인사이트, 예측, 목표 설정 등의 API를 포함합니다.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from datetime import date, datetime, timedelta

from database import get_db
from models.user import User
from api.v1.users import get_current_user
from services.productivity_service import productivity_service
from schemas.time_entry import ProductivityInsights, TeamProductivityComparison

router = APIRouter(prefix="/productivity", tags=["productivity"])


# === 개인 생산성 분석 ===

@router.get("/insights", response_model=ProductivityInsights)
async def get_productivity_insights(
    start_date: Optional[date] = Query(None, description="분석 시작 날짜"),
    end_date: Optional[date] = Query(None, description="분석 종료 날짜"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    사용자의 종합 생산성 인사이트를 제공합니다.
    
    - **start_date**: 분석 시작 날짜 (기본값: 30일 전)
    - **end_date**: 분석 종료 날짜 (기본값: 오늘)
    
    반환되는 인사이트:
    - 기본 통계 (총 작업시간, 완료 작업 수 등)
    - 생산성 및 집중도 점수
    - 최고 생산성 시간대
    - 카테고리별 분석
    - 주별 트렌드
    - 개선 제안
    """
    try:
        insights = await productivity_service.get_user_productivity_insights(
            db=db,
            user_id=current_user.id,
            start_date=start_date,
            end_date=end_date
        )
        return insights
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"생산성 인사이트 분석 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/prediction/task-duration")
async def predict_task_duration(
    category: Optional[str] = Query(None, description="작업 카테고리"),
    complexity: str = Query("medium", regex="^(low|medium|high)$", description="작업 복잡도"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    과거 데이터를 기반으로 작업 완료 예상 시간을 예측합니다.
    
    - **category**: 작업 카테고리 (선택사항)
    - **complexity**: 작업 복잡도 (low/medium/high)
    
    반환 정보:
    - 예상 소요 시간 (분)
    - 예측 신뢰도
    - 시간 범위 (최소~최대)
    - 기반 데이터 포인트 수
    """
    try:
        prediction = productivity_service.predict_task_completion_time(
            db=db,
            user_id=current_user.id,
            category=category,
            complexity=complexity
        )
        return prediction
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"작업 시간 예측 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/goals/suggestions")
async def get_productivity_goal_suggestions(
    target_period_days: int = Query(30, ge=7, le=365, description="목표 기간 (일)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    사용자의 과거 성과를 기반으로 개인화된 생산성 목표를 제안합니다.
    
    - **target_period_days**: 목표 설정 기간 (7-365일)
    
    제안되는 목표:
    - 일일 작업 시간 목표
    - 주간 작업 완료 목표
    - 생산성 점수 목표
    - 집중력 개선 목표
    - 목표 달성을 위한 제안사항
    """
    try:
        goals = productivity_service.generate_productivity_goals(
            db=db,
            user_id=current_user.id,
            target_period_days=target_period_days
        )
        return goals
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"생산성 목표 생성 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/analysis/categories")
async def get_category_analysis(
    start_date: Optional[date] = Query(None, description="분석 시작 날짜"),
    end_date: Optional[date] = Query(None, description="분석 종료 날짜"),
    min_hours: float = Query(0.5, ge=0, description="최소 작업 시간 (시간 단위)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    카테고리별 상세 생산성 분석을 제공합니다.
    
    - **start_date**: 분석 시작 날짜
    - **end_date**: 분석 종료 날짜  
    - **min_hours**: 분석에 포함할 최소 작업 시간
    
    분석 내용:
    - 카테고리별 총 시간 및 작업 수
    - 평균 작업 시간
    - 생산성 점수
    - 효율성 지표
    """
    try:
        # 전체 인사이트를 가져와서 카테고리 분석만 추출
        insights = await productivity_service.get_user_productivity_insights(
            db=db,
            user_id=current_user.id,
            start_date=start_date,
            end_date=end_date
        )
        
        # 최소 시간 조건 적용
        min_minutes = min_hours * 60
        filtered_categories = [
            cat for cat in insights.most_productive_categories 
            if cat.total_minutes >= min_minutes
        ]
        
        return {
            "analysis_period": insights.analysis_period,
            "total_categories": len(insights.most_productive_categories),
            "filtered_categories": len(filtered_categories),
            "categories": filtered_categories,
            "summary": {
                "total_hours": sum(cat.total_minutes for cat in filtered_categories) / 60,
                "total_tasks": sum(cat.task_count for cat in filtered_categories),
                "most_time_consuming": filtered_categories[0].category if filtered_categories else None,
                "most_productive": max(
                    filtered_categories, 
                    key=lambda x: x.productivity_score or 0
                ).category if filtered_categories and any(cat.productivity_score for cat in filtered_categories) else None
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"카테고리 분석 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/analysis/time-patterns")
async def get_time_pattern_analysis(
    start_date: Optional[date] = Query(None, description="분석 시작 날짜"),
    end_date: Optional[date] = Query(None, description="분석 종료 날짜"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    시간대별 생산성 패턴을 분석합니다.
    
    분석 내용:
    - 시간대별 작업 시간
    - 시간대별 생산성 점수
    - 최고/최저 생산성 시간대
    - 집중도 패턴
    """
    try:
        insights = await productivity_service.get_user_productivity_insights(
            db=db,
            user_id=current_user.id,
            start_date=start_date,
            end_date=end_date
        )
        
        # 시간 패턴 데이터 정리
        patterns_with_data = [p for p in insights.time_patterns if p.total_minutes > 0]
        
        if not patterns_with_data:
            return {
                "message": "분석할 시간 데이터가 없습니다",
                "analysis_period": insights.analysis_period,
                "patterns": []
            }
        
        # 최고/최저 생산성 시간대 찾기
        productive_patterns = [p for p in patterns_with_data if p.productivity_score is not None]
        
        peak_productivity_hour = None
        lowest_productivity_hour = None
        
        if productive_patterns:
            peak_pattern = max(productive_patterns, key=lambda x: x.productivity_score)
            lowest_pattern = min(productive_patterns, key=lambda x: x.productivity_score)
            peak_productivity_hour = peak_pattern.hour
            lowest_productivity_hour = lowest_pattern.hour
        
        return {
            "analysis_period": insights.analysis_period,
            "total_tracked_hours": len(patterns_with_data),
            "peak_productivity_hours": insights.peak_productivity_hours,
            "peak_hour": peak_productivity_hour,
            "lowest_productivity_hour": lowest_productivity_hour,
            "patterns": insights.time_patterns,
            "recommendations": [
                f"가장 생산적인 시간대는 {peak_productivity_hour}시입니다" if peak_productivity_hour else "더 많은 데이터가 필요합니다",
                f"{lowest_productivity_hour}시는 생산성이 낮은 시간대입니다" if lowest_productivity_hour else "패턴 분석을 위해 꾸준한 기록이 필요합니다"
            ] if productive_patterns else ["시간대별 패턴 분석을 위해 생산성 점수를 기록해보세요"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"시간 패턴 분석 중 오류가 발생했습니다: {str(e)}"
        )


# === 팀 생산성 분석 ===

@router.get("/team/{team_id}/insights", response_model=TeamProductivityComparison)
async def get_team_productivity_insights(
    team_id: int,
    start_date: Optional[date] = Query(None, description="분석 시작 날짜"),
    end_date: Optional[date] = Query(None, description="분석 종료 날짜"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    팀 생산성 비교 분석을 제공합니다.
    
    분석 내용:
    - 팀 전체 통계
    - 개인별 기여도
    - 워크로드 밸런스
    - 협업 효율성 지표
    - 과로/저활용 멤버 식별
    """
    try:
        # TODO: 팀 멤버 권한 확인 로직 추가
        
        team_insights = await productivity_service.get_team_productivity_insights(
            db=db,
            team_id=team_id,
            start_date=start_date,
            end_date=end_date
        )
        
        return team_insights
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"팀 생산성 분석 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/team/{team_id}/balance-report")
async def get_team_workload_balance_report(
    team_id: int,
    start_date: Optional[date] = Query(None, description="분석 시작 날짜"),
    end_date: Optional[date] = Query(None, description="분석 종료 날짜"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    팀의 워크로드 밸런스 상세 리포트를 제공합니다.
    
    리포트 내용:
    - 워크로드 분배 현황
    - 균형도 점수
    - 리밸런싱 제안
    - 리스크 요소 식별
    """
    try:
        team_insights = await productivity_service.get_team_productivity_insights(
            db=db,
            team_id=team_id,
            start_date=start_date,
            end_date=end_date
        )
        
        # 워크로드 밸런스 상세 분석
        members = team_insights.member_contributions
        if not members:
            return {
                "message": "분석할 팀 데이터가 없습니다",
                "balance_score": 0,
                "recommendations": ["팀원들의 시간 추적 활동이 필요합니다"]
            }
        
        # 통계 계산
        hours_list = [m['total_hours'] for m in members]
        total_hours = sum(hours_list)
        avg_hours = total_hours / len(members)
        
        # 불균형 수준 분류
        balance_level = "양호"
        if team_insights.workload_balance_score < 70:
            balance_level = "위험"
        elif team_insights.workload_balance_score < 85:
            balance_level = "주의"
        
        # 리밸런싱 제안 생성
        recommendations = []
        
        if team_insights.overworked_members:
            overworked_names = [m['name'] for m in team_insights.overworked_members]
            recommendations.append(f"{', '.join(overworked_names)}님의 작업량을 재분배하는 것을 고려해보세요")
        
        if team_insights.underutilized_members:
            underutilized_names = [m['name'] for m in team_insights.underutilized_members]
            recommendations.append(f"{', '.join(underutilized_names)}님에게 추가 작업을 배정할 수 있습니다")
        
        if not recommendations:
            recommendations.append("현재 워크로드가 적절히 분배되어 있습니다")
        
        return {
            "analysis_period": team_insights.analysis_period,
            "team_summary": {
                "total_members": len(members),
                "total_hours": total_hours,
                "average_hours_per_member": round(avg_hours, 1),
                "balance_score": team_insights.workload_balance_score,
                "balance_level": balance_level
            },
            "workload_distribution": {
                "highest_contributor": max(members, key=lambda x: x['total_hours']) if members else None,
                "lowest_contributor": min(members, key=lambda x: x['total_hours']) if members else None,
                "standard_deviation": round(
                    (sum((h - avg_hours) ** 2 for h in hours_list) / len(hours_list)) ** 0.5, 2
                ) if len(hours_list) > 1 else 0
            },
            "risk_factors": {
                "overworked_count": len(team_insights.overworked_members),
                "underutilized_count": len(team_insights.underutilized_members),
                "burnout_risk": "높음" if len(team_insights.overworked_members) > len(members) * 0.3 else "낮음"
            },
            "recommendations": recommendations
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"팀 워크로드 밸런스 분석 중 오류가 발생했습니다: {str(e)}"
        )


# === 대시보드 데이터 API ===

@router.get("/dashboard/summary")
async def get_productivity_dashboard_summary(
    period: str = Query("week", regex="^(today|week|month|quarter)$", description="조회 기간"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    생산성 대시보드용 요약 데이터를 제공합니다.
    
    - **period**: 조회 기간 (today/week/month/quarter)
    
    요약 데이터:
    - 핵심 지표 (KPI)
    - 트렌드 정보
    - 최근 성과
    - 개선 영역
    """
    try:
        # 기간별 날짜 설정
        end_date = date.today()
        
        if period == "today":
            start_date = end_date
        elif period == "week":
            start_date = end_date - timedelta(days=6)
        elif period == "month":
            start_date = end_date - timedelta(days=29)
        elif period == "quarter":
            start_date = end_date - timedelta(days=89)
        
        # 생산성 인사이트 조회
        insights = await productivity_service.get_user_productivity_insights(
            db=db,
            user_id=current_user.id,
            start_date=start_date,
            end_date=end_date
        )
        
        # 이전 기간과 비교를 위한 데이터
        prev_period_days = (end_date - start_date).days + 1
        prev_start = start_date - timedelta(days=prev_period_days)
        prev_end = start_date - timedelta(days=1)
        
        prev_insights = await productivity_service.get_user_productivity_insights(
            db=db,
            user_id=current_user.id,
            start_date=prev_start,
            end_date=prev_end
        )
        
        # 변화율 계산
        def calculate_change_rate(current, previous):
            if previous == 0:
                return 100 if current > 0 else 0
            return ((current - previous) / previous) * 100
        
        hours_change = calculate_change_rate(
            insights.total_tracked_hours, 
            prev_insights.total_tracked_hours
        )
        
        tasks_change = calculate_change_rate(
            insights.total_tasks_completed, 
            prev_insights.total_tasks_completed
        )
        
        productivity_change = 0
        if insights.overall_productivity_score and prev_insights.overall_productivity_score:
            productivity_change = calculate_change_rate(
                insights.overall_productivity_score,
                prev_insights.overall_productivity_score
            )
        
        return {
            "period": period,
            "analysis_period": insights.analysis_period,
            "kpi_summary": {
                "total_hours": {
                    "value": insights.total_tracked_hours,
                    "change_rate": round(hours_change, 1),
                    "trend": "up" if hours_change > 0 else "down" if hours_change < 0 else "stable"
                },
                "tasks_completed": {
                    "value": insights.total_tasks_completed,
                    "change_rate": round(tasks_change, 1),
                    "trend": "up" if tasks_change > 0 else "down" if tasks_change < 0 else "stable"
                },
                "productivity_score": {
                    "value": insights.overall_productivity_score,
                    "change_rate": round(productivity_change, 1) if insights.overall_productivity_score else None,
                    "trend": "up" if productivity_change > 0 else "down" if productivity_change < 0 else "stable"
                },
                "efficiency_ratio": {
                    "value": insights.efficiency_ratio,
                    "status": "excellent" if insights.efficiency_ratio > 0.8 else "good" if insights.efficiency_ratio > 0.6 else "needs_improvement"
                }
            },
            "quick_insights": {
                "peak_hours": insights.peak_productivity_hours[:3],
                "top_categories": [cat.category for cat in insights.most_productive_categories[:3]],
                "weekly_trend": "improving" if len(insights.weekly_trends) > 1 and 
                             insights.weekly_trends[-1].average_productivity and
                             insights.weekly_trends[-2].average_productivity and
                             insights.weekly_trends[-1].average_productivity > insights.weekly_trends[-2].average_productivity
                             else "stable",
                "goal_progress": round(insights.goal_achievement_rate, 1) if insights.goal_achievement_rate else None
            },
            "recommendations": insights.recommendations[:3],
            "next_actions": [
                "다음 최고 생산성 시간대를 활용하세요" if insights.peak_productivity_hours else "시간대별 패턴을 파악해보세요",
                "효율성 개선을 위한 작업 방식을 점검해보세요" if insights.efficiency_ratio < 0.7 else "현재 작업 효율성을 유지하세요",
                "목표 달성을 위해 일일 작업량을 조정해보세요" if insights.goal_achievement_rate and insights.goal_achievement_rate < 80 else "목표 달성이 순조롭습니다"
            ]
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"대시보드 요약 데이터 조회 중 오류가 발생했습니다: {str(e)}"
        )