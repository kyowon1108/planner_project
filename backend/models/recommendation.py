"""
AI 추천 시스템 관련 모델 정의

이 파일은 AI 추천 시스템과 관련된 모든 데이터베이스 모델을 정의합니다.
- RecommendationFeedback: 사용자의 추천 피드백
- RecommendationHistory: 추천 이력 기록
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, Float, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from services.time_service import TimeService

class RecommendationFeedback(Base):
    """
    추천 피드백 모델
    
    사용자가 AI 추천에 대해 제공한 피드백을 저장합니다.
    이 데이터는 추천 시스템의 정확도를 향상시키는데 사용됩니다.
    """
    __tablename__ = "recommendation_feedbacks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    recommendation_id = Column(String(100), nullable=False, index=True)  # UUID 형태
    
    # 추천 내용
    recommendation_type = Column(String(50), nullable=False)  # "todo", "time_slot", "collaboration"
    recommendation_title = Column(String(200), nullable=False)
    recommendation_category = Column(String(100), nullable=True)
    
    # 피드백 내용
    feedback_type = Column(String(20), nullable=False)  # "accepted", "rejected", "modified"
    usefulness_score = Column(Integer, nullable=True)  # 1-5 점
    accuracy_score = Column(Integer, nullable=True)  # 1-5 점
    feedback_notes = Column(Text, nullable=True)
    
    # 메타데이터
    recommendation_confidence = Column(Float, nullable=True)  # 추천 시 신뢰도
    created_at = Column(DateTime(timezone=True), default=TimeService.now_kst)
    
    # 관계 정의
    user = relationship("User", back_populates="recommendation_feedbacks")

class RecommendationHistory(Base):
    """
    추천 이력 모델
    
    AI가 생성한 모든 추천의 이력을 기록합니다.
    사용자 행동 패턴 분석과 추천 성능 평가에 사용됩니다.
    """
    __tablename__ = "recommendation_histories"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    recommendation_id = Column(String(100), nullable=False, unique=True, index=True)
    
    # 추천 정보
    recommendation_type = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    priority = Column(String(20), nullable=True)
    estimated_time = Column(Integer, nullable=True)  # 분 단위
    
    # AI 분석 결과
    confidence_score = Column(Float, nullable=False, default=0.0)
    reasoning = Column(Text, nullable=True)
    optimal_time = Column(String(20), nullable=True)
    context_data = Column(JSON, nullable=True)  # 추천 시 컨텍스트
    
    # 사용자 반응
    was_viewed = Column(Boolean, default=False)
    was_accepted = Column(Boolean, default=False)
    was_completed = Column(Boolean, default=False)
    view_time = Column(DateTime(timezone=True), nullable=True)
    accept_time = Column(DateTime(timezone=True), nullable=True)
    complete_time = Column(DateTime(timezone=True), nullable=True)
    
    # 메타데이터
    algorithm_version = Column(String(20), default="1.0")
    created_at = Column(DateTime(timezone=True), default=TimeService.now_kst)
    
    # 관계 정의
    user = relationship("User", back_populates="recommendation_histories")

class AIInsight(Base):
    """
    AI 인사이트 모델
    
    사용자의 생산성 패턴과 AI 분석 결과를 저장합니다.
    개인화된 추천과 생산성 대시보드에 사용됩니다.
    """
    __tablename__ = "ai_insights"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    insight_date = Column(DateTime(timezone=True), nullable=False, index=True)
    
    # 생산성 분석
    daily_productivity_score = Column(Float, nullable=True)
    completed_tasks = Column(Integer, default=0)
    total_work_time = Column(Integer, default=0)  # 분 단위
    peak_productivity_hour = Column(Integer, nullable=True)
    
    # 패턴 분석
    most_productive_categories = Column(JSON, nullable=True)  # ["개발", "문서화"]
    collaboration_frequency = Column(Float, nullable=True)  # 0-1
    task_switching_frequency = Column(Float, nullable=True)  # 하루 작업 전환 횟수
    average_task_duration = Column(Float, nullable=True)  # 평균 작업 시간 (분)
    
    # 추천 성과
    recommendations_shown = Column(Integer, default=0)
    recommendations_accepted = Column(Integer, default=0)
    recommendation_accuracy = Column(Float, nullable=True)  # 수락률
    
    # 인사이트 텍스트
    key_insights = Column(JSON, nullable=True)  # 주요 인사이트 문구들
    improvement_suggestions = Column(JSON, nullable=True)  # 개선 제안들
    
    created_at = Column(DateTime(timezone=True), default=TimeService.now_kst)
    
    # 관계 정의
    user = relationship("User", back_populates="ai_insights")