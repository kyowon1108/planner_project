"""
AI 추천 시스템 관련 스키마 정의

Pydantic 모델을 사용하여 API 요청/응답 데이터 구조를 정의합니다.
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime


# ===== 기본 스키마 =====

class RecommendationItemBase(BaseModel):
    """기본 추천 아이템 스키마"""
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    category: Optional[str] = Field(None, max_length=100)
    priority: str = Field("medium", pattern="^(low|medium|high)$")
    estimated_time: Optional[int] = Field(None, ge=1, le=1440)  # 1분-24시간
    confidence: float = Field(..., ge=0.0, le=1.0)
    reasoning: Optional[str] = Field(None, max_length=500)
    optimal_time: Optional[str] = Field(None, max_length=20)


class RecommendationItem(RecommendationItemBase):
    """완전한 추천 아이템 스키마"""
    recommendation_id: str = Field(..., max_length=100)
    created_at: datetime
    
    class Config:
        from_attributes = True


# ===== 요청 스키마 =====

class PersonalizedRecommendationRequest(BaseModel):
    """개인화된 추천 요청"""
    context: Optional[Dict[str, Any]] = Field(
        None, 
        description="현재 컨텍스트 정보 (시간대, 에너지 레벨 등)"
    )
    limit: int = Field(10, ge=1, le=50, description="최대 추천 개수")
    categories: Optional[List[str]] = Field(
        None, 
        description="관심 카테고리 필터"
    )


class RecommendationFeedbackRequest(BaseModel):
    """추천 피드백 요청"""
    recommendation_id: str = Field(..., max_length=100)
    feedback_type: str = Field(..., pattern="^(accepted|rejected|modified)$")
    usefulness_score: Optional[int] = Field(None, ge=1, le=5)
    accuracy_score: Optional[int] = Field(None, ge=1, le=5)
    feedback_notes: Optional[str] = Field(None, max_length=1000)


class SmartTextAnalysisRequest(BaseModel):
    """스마트 텍스트 분석 요청"""
    text: str = Field(..., min_length=1, max_length=2000)
    analysis_type: str = Field(
        "comprehensive", 
        pattern="^(tags|priority|category|comprehensive)$"
    )
    context: Optional[Dict[str, Any]] = Field(None)


class TeamCollaborationRequest(BaseModel):
    """팀 협업 분석 요청"""
    team_id: Optional[int] = Field(None, ge=1)
    analysis_period: str = Field("week", pattern="^(day|week|month|quarter)$")
    include_suggestions: bool = Field(True)


# ===== 응답 스키마 =====

class PersonalizedRecommendationResponse(BaseModel):
    """개인화된 추천 응답"""
    recommendations: List[RecommendationItem]
    user_profile_summary: Dict[str, Any]
    analysis_timestamp: datetime
    algorithm_version: str = "1.0"
    
    class Config:
        from_attributes = True


class RecommendationFeedbackResponse(BaseModel):
    """추천 피드백 응답"""
    message: str
    status: str
    feedback_id: Optional[int] = None
    updated_profile: bool = False


class ProductivityInsightResponse(BaseModel):
    """생산성 인사이트 응답"""
    productivity_score: float = Field(..., ge=0.0, le=100.0)
    peak_hours: List[int] = Field(..., description="생산적인 시간대")
    preferred_task_types: List[str]
    avg_completion_times: Dict[str, float]
    collaboration_style: str
    work_patterns: Dict[str, Any]
    recommendations: List[str]
    weekly_trend: Dict[str, Union[int, float, str]]
    
    class Config:
        from_attributes = True


class SmartTextAnalysisResponse(BaseModel):
    """스마트 텍스트 분석 응답"""
    tags: List[str]
    priority: str
    category: str
    sentiment: str
    topics: List[str]
    confidence: float
    keywords: List[str]
    suggestions: Dict[str, Any]
    
    class Config:
        from_attributes = True


class TeamCollaborationResponse(BaseModel):
    """팀 협업 분석 응답"""
    workload_balance: Dict[str, Any]
    collaboration_patterns: Dict[str, Any]
    optimal_meeting_times: List[str]
    team_strengths: List[str]
    improvement_areas: List[str]
    productivity_metrics: Dict[str, float]
    
    class Config:
        from_attributes = True


class AIInsightSummary(BaseModel):
    """AI 인사이트 요약"""
    insight_date: datetime
    daily_productivity_score: Optional[float] = None
    completed_tasks: int = 0
    total_work_time: int = 0
    peak_productivity_hour: Optional[int] = None
    most_productive_categories: Optional[List[str]] = None
    key_insights: Optional[List[str]] = None
    improvement_suggestions: Optional[List[str]] = None
    
    @validator('most_productive_categories', pre=True)
    def parse_categories(cls, v):
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except:
                return []
        return v or []
    
    @validator('key_insights', pre=True)  
    def parse_insights(cls, v):
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except:
                return []
        return v or []
    
    @validator('improvement_suggestions', pre=True)
    def parse_suggestions(cls, v):
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except:
                return []
        return v or []
    
    class Config:
        from_attributes = True


# ===== 피드백 관련 스키마 =====

class RecommendationFeedbackCreate(BaseModel):
    """추천 피드백 생성"""
    user_id: int
    recommendation_id: str
    recommendation_type: str
    recommendation_title: str
    recommendation_category: Optional[str] = None
    feedback_type: str
    usefulness_score: Optional[int] = None
    accuracy_score: Optional[int] = None
    feedback_notes: Optional[str] = None
    recommendation_confidence: Optional[float] = None


class RecommendationHistoryCreate(BaseModel):
    """추천 이력 생성"""
    user_id: int
    recommendation_id: str
    recommendation_type: str
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    estimated_time: Optional[int] = None
    confidence_score: float = 0.0
    reasoning: Optional[str] = None
    optimal_time: Optional[str] = None
    context_data: Optional[Dict[str, Any]] = None


class RecommendationHistoryUpdate(BaseModel):
    """추천 이력 업데이트"""
    was_viewed: Optional[bool] = None
    was_accepted: Optional[bool] = None
    was_completed: Optional[bool] = None
    view_time: Optional[datetime] = None
    accept_time: Optional[datetime] = None
    complete_time: Optional[datetime] = None


# ===== 사용자 프로필 관련 스키마 =====

class UserAIProfileUpdate(BaseModel):
    """사용자 AI 프로필 업데이트"""
    ai_productivity_score: Optional[float] = Field(None, ge=0.0, le=100.0)
    ai_peak_hours: Optional[List[int]] = Field(None, max_items=24)
    ai_preferred_task_types: Optional[List[str]] = Field(None, max_items=10)
    ai_work_patterns: Optional[Dict[str, Any]] = None
    ai_collaboration_style: Optional[str] = Field(
        None, 
        pattern="^(independent|semi_collaborative|collaborative)$"
    )
    ai_recommendations_enabled: Optional[bool] = None
    
    @validator('ai_peak_hours')
    def validate_peak_hours(cls, v):
        if v is not None:
            for hour in v:
                if not (0 <= hour <= 23):
                    raise ValueError('Hour must be between 0 and 23')
        return v


class UserAIProfileResponse(BaseModel):
    """사용자 AI 프로필 응답"""
    ai_productivity_score: float
    ai_peak_hours: Optional[List[int]] = None
    ai_preferred_task_types: Optional[List[str]] = None
    ai_work_patterns: Optional[Dict[str, Any]] = None
    ai_collaboration_style: str
    ai_last_analysis: Optional[datetime] = None
    ai_recommendations_enabled: bool
    
    @validator('ai_peak_hours', pre=True)
    def parse_peak_hours(cls, v):
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except:
                return None
        return v
    
    @validator('ai_preferred_task_types', pre=True)
    def parse_task_types(cls, v):
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except:
                return None
        return v
    
    @validator('ai_work_patterns', pre=True)
    def parse_work_patterns(cls, v):
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except:
                return None
        return v
    
    class Config:
        from_attributes = True