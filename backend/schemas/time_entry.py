from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum


class PriorityEnum(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class PauseReasonEnum(str, Enum):
    meeting = "meeting"
    break_time = "break"
    interruption = "interruption"
    other = "other"


# === 시간 추적 시작/중지 요청 ===

class StartTimeTrackingRequest(BaseModel):
    title: str = Field(..., description="작업 제목")
    description: Optional[str] = Field(None, description="작업 설명")
    todo_id: Optional[int] = Field(None, description="연관된 할 일 ID")
    planner_id: Optional[int] = Field(None, description="연관된 플래너 ID")
    category: Optional[str] = Field(None, description="작업 카테고리")
    priority: Optional[PriorityEnum] = Field(PriorityEnum.medium, description="우선순위")
    environment_tags: Optional[List[str]] = Field(None, description="작업 환경 태그")


class StopTimeTrackingRequest(BaseModel):
    notes: Optional[str] = Field(None, description="작업 완료 메모")
    productivity_score: Optional[float] = Field(None, ge=1.0, le=10.0, description="생산성 점수 (1-10)")
    focus_score: Optional[float] = Field(None, ge=1.0, le=10.0, description="집중도 점수 (1-10)")
    mood_rating: Optional[int] = Field(None, ge=1, le=5, description="기분 점수 (1-5)")


# === 시간 기록 생성/수정 ===

class TimeEntryCreate(BaseModel):
    title: str = Field(..., description="작업 제목")
    description: Optional[str] = Field(None, description="작업 설명")
    start_time: datetime = Field(..., description="시작 시간")
    end_time: datetime = Field(..., description="종료 시간")
    todo_id: Optional[int] = Field(None, description="연관된 할 일 ID")
    planner_id: Optional[int] = Field(None, description="연관된 플래너 ID")
    category: Optional[str] = Field(None, description="작업 카테고리")
    priority: Optional[PriorityEnum] = Field(PriorityEnum.medium, description="우선순위")
    productivity_score: Optional[float] = Field(None, ge=1.0, le=10.0, description="생산성 점수")
    focus_score: Optional[float] = Field(None, ge=1.0, le=10.0, description="집중도 점수")
    mood_rating: Optional[int] = Field(None, ge=1, le=5, description="기분 점수")
    environment_tags: Optional[List[str]] = Field(None, description="작업 환경 태그")
    notes: Optional[str] = Field(None, description="작업 메모")

    @validator('end_time')
    def end_time_after_start_time(cls, v, values):
        if 'start_time' in values and v <= values['start_time']:
            raise ValueError('종료 시간은 시작 시간보다 늦어야 합니다')
        return v


class TimeEntryUpdate(BaseModel):
    title: Optional[str] = Field(None, description="작업 제목")
    description: Optional[str] = Field(None, description="작업 설명")
    start_time: Optional[datetime] = Field(None, description="시작 시간")
    end_time: Optional[datetime] = Field(None, description="종료 시간")
    category: Optional[str] = Field(None, description="작업 카테고리")
    priority: Optional[PriorityEnum] = Field(None, description="우선순위")
    productivity_score: Optional[float] = Field(None, ge=1.0, le=10.0, description="생산성 점수")
    focus_score: Optional[float] = Field(None, ge=1.0, le=10.0, description="집중도 점수")
    mood_rating: Optional[int] = Field(None, ge=1, le=5, description="기분 점수")
    notes: Optional[str] = Field(None, description="작업 메모")


# === 중단/재시작 ===

class TimeEntryPauseCreate(BaseModel):
    reason: Optional[PauseReasonEnum] = Field(PauseReasonEnum.other, description="중단 사유")
    notes: Optional[str] = Field(None, description="중단 메모")


class TimeEntryPauseResponse(BaseModel):
    id: int
    time_entry_id: int
    pause_start: datetime
    pause_end: Optional[datetime]
    pause_duration_minutes: Optional[int]
    reason: Optional[str]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# === 응답 스키마 ===

class TimeEntryResponse(BaseModel):
    id: int
    user_id: int
    todo_id: Optional[int]
    planner_id: Optional[int]
    title: str
    description: Optional[str]
    category: Optional[str]
    priority: str
    start_time: datetime
    end_time: Optional[datetime]
    duration_minutes: Optional[int]
    actual_duration_minutes: int
    is_active: bool
    is_manual: bool
    pause_count: int
    pause_duration_minutes: int
    interruption_reason: Optional[str]
    productivity_score: Optional[float]
    focus_score: Optional[float]
    mood_rating: Optional[int]
    environment_tags: Optional[str]  # JSON 문자열
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    # 관련 객체 정보 (선택적)
    todo_title: Optional[str] = Field(None, description="연관된 할 일 제목")
    planner_title: Optional[str] = Field(None, description="연관된 플래너 제목")
    pauses: Optional[List[TimeEntryPauseResponse]] = Field(None, description="중단 기록")

    class Config:
        from_attributes = True


class ProductivityMetricsResponse(BaseModel):
    id: int
    user_id: int
    date: datetime
    total_work_minutes: int
    focused_work_minutes: int
    break_minutes: int
    interruption_count: int
    tasks_completed: int
    tasks_started: int
    productivity_score: Optional[float]
    focus_score: Optional[float]
    efficiency_ratio: Optional[float]
    category_time_distribution: Optional[str]  # JSON 문자열
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class TimeTrackingSummary(BaseModel):
    period_start: date
    period_end: date
    total_entries: int
    total_minutes: int
    completed_tasks: int
    active_tasks: int
    category_distribution: Dict[str, int]
    daily_minutes: Dict[str, int]  # 날짜별 작업 시간
    average_productivity_score: Optional[float]


# === 고급 분석 응답 ===

class CategoryAnalysis(BaseModel):
    category: str
    total_minutes: int
    task_count: int
    average_duration: float
    productivity_score: Optional[float]


class TimePatternAnalysis(BaseModel):
    hour: int
    total_minutes: int
    productivity_score: Optional[float]
    focus_score: Optional[float]


class WeeklyTrend(BaseModel):
    week_start: date
    total_minutes: int
    tasks_completed: int
    average_productivity: Optional[float]
    efficiency_ratio: Optional[float]


class ProductivityInsights(BaseModel):
    """생산성 인사이트 종합 분석"""
    user_id: int
    analysis_period: Dict[str, date]  # start, end
    
    # 기본 통계
    total_tracked_hours: float
    total_tasks_completed: int
    average_daily_hours: float
    
    # 생산성 지표
    overall_productivity_score: Optional[float]
    overall_focus_score: Optional[float]
    efficiency_ratio: float
    
    # 패턴 분석
    peak_productivity_hours: List[int]
    most_productive_categories: List[CategoryAnalysis]
    time_patterns: List[TimePatternAnalysis]
    weekly_trends: List[WeeklyTrend]
    
    # 개선 제안
    recommendations: List[str]
    
    # 목표 대비 성과
    weekly_goal_hours: Optional[float]
    goal_achievement_rate: Optional[float]


class TeamProductivityComparison(BaseModel):
    """팀 생산성 비교 분석"""
    team_id: int
    analysis_period: Dict[str, date]
    
    # 팀 전체 통계
    team_total_hours: float
    team_total_tasks: int
    team_average_productivity: Optional[float]
    
    # 개인별 기여도
    member_contributions: List[Dict[str, Any]]
    
    # 협업 효율성
    collaboration_score: Optional[float]
    communication_frequency: str
    knowledge_sharing_index: Optional[float]
    
    # 워크로드 밸런스
    workload_balance_score: float
    overworked_members: List[Dict[str, Any]]
    underutilized_members: List[Dict[str, Any]]