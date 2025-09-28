from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from datetime import datetime

class TimeEntry(Base):
    __tablename__ = "time_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    todo_id = Column(Integer, ForeignKey("todos.id"), nullable=True, index=True)
    planner_id = Column(Integer, ForeignKey("planners.id"), nullable=True, index=True)
    
    # 시간 추적 정보
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    duration_minutes = Column(Integer, nullable=True)  # 총 작업 시간 (분)
    
    # 작업 정보
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=True)  # 작업 카테고리
    priority = Column(String(20), default="medium")  # high, medium, low
    
    # 추적 상태
    is_active = Column(Boolean, default=False)  # 현재 진행 중인지
    is_manual = Column(Boolean, default=False)  # 수동으로 입력된 시간인지
    
    # 중단/재시작 정보
    pause_count = Column(Integer, default=0)  # 중단 횟수
    pause_duration_minutes = Column(Integer, default=0)  # 총 중단 시간
    interruption_reason = Column(String(100), nullable=True)  # 중단 사유
    
    # 생산성 관련
    productivity_score = Column(Float, nullable=True)  # 생산성 점수 (1-10)
    focus_score = Column(Float, nullable=True)  # 집중도 점수 (1-10)
    mood_rating = Column(Integer, nullable=True)  # 기분 점수 (1-5)
    
    # 컨텍스트 정보
    environment_tags = Column(String(500), nullable=True)  # 작업 환경 태그 (JSON 문자열)
    notes = Column(Text, nullable=True)  # 작업 메모
    
    # 메타데이터
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 관계 설정
    user = relationship("User", back_populates="time_entries")
    todo = relationship("Todo", back_populates="time_entries")
    planner = relationship("Planner", back_populates="time_entries")
    
    def __repr__(self):
        return f"<TimeEntry(id={self.id}, title='{self.title}', duration={self.duration_minutes}min)>"
    
    @property
    def is_running(self) -> bool:
        """현재 시간 추적이 진행 중인지 확인"""
        return self.is_active and self.end_time is None
    
    @property
    def actual_duration_minutes(self) -> int:
        """실제 작업 시간 (중단 시간 제외)"""
        if self.duration_minutes is None:
            return 0
        return max(0, self.duration_minutes - (self.pause_duration_minutes or 0))
    
    def calculate_duration(self) -> int:
        """시작-종료 시간을 기반으로 총 소요 시간 계산 (분 단위)"""
        if not self.start_time:
            return 0
        
        end = self.end_time or datetime.utcnow()
        duration_seconds = (end - self.start_time).total_seconds()
        return int(duration_seconds / 60)
    
    def update_duration(self):
        """duration_minutes 필드를 실제 계산된 시간으로 업데이트"""
        self.duration_minutes = self.calculate_duration()


class TimeEntryPause(Base):
    """시간 추적 중단 기록"""
    __tablename__ = "time_entry_pauses"
    
    id = Column(Integer, primary_key=True, index=True)
    time_entry_id = Column(Integer, ForeignKey("time_entries.id"), nullable=False)
    
    # 중단 시간 정보
    pause_start = Column(DateTime(timezone=True), nullable=False)
    pause_end = Column(DateTime(timezone=True), nullable=True)
    pause_duration_minutes = Column(Integer, nullable=True)
    
    # 중단 사유
    reason = Column(String(100), nullable=True)  # meeting, break, interruption, other
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계 설정
    time_entry = relationship("TimeEntry", backref="pauses")
    
    def calculate_pause_duration(self) -> int:
        """중단 시간 계산 (분 단위)"""
        if not self.pause_start:
            return 0
        
        end = self.pause_end or datetime.utcnow()
        duration_seconds = (end - self.pause_start).total_seconds()
        return int(duration_seconds / 60)
    
    def update_duration(self):
        """pause_duration_minutes 필드 업데이트"""
        self.pause_duration_minutes = self.calculate_pause_duration()


class ProductivityMetrics(Base):
    """일별 생산성 메트릭 집계"""
    __tablename__ = "productivity_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # 날짜 정보
    date = Column(DateTime(timezone=True), nullable=False, index=True)
    
    # 시간 메트릭
    total_work_minutes = Column(Integer, default=0)  # 총 작업 시간
    focused_work_minutes = Column(Integer, default=0)  # 집중 작업 시간
    break_minutes = Column(Integer, default=0)  # 휴식 시간
    interruption_count = Column(Integer, default=0)  # 중단 횟수
    
    # 작업 메트릭
    tasks_completed = Column(Integer, default=0)  # 완료한 작업 수
    tasks_started = Column(Integer, default=0)  # 시작한 작업 수
    
    # 생산성 지표
    productivity_score = Column(Float, nullable=True)  # 일일 생산성 점수
    focus_score = Column(Float, nullable=True)  # 일일 집중도 점수
    efficiency_ratio = Column(Float, nullable=True)  # 효율성 비율 (실제작업시간/총시간)
    
    # 카테고리별 시간 분배 (JSON 문자열로 저장)
    category_time_distribution = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 관계 설정
    user = relationship("User", back_populates="productivity_metrics")
    
    def __repr__(self):
        return f"<ProductivityMetrics(user_id={self.user_id}, date={self.date}, score={self.productivity_score})>"