from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Date, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, date
import enum
from services.time_service import TimeService

class PlannerStatus(str, enum.Enum):
    ongoing = "진행중"
    completed = "완료"
    cancelled = "취소"

class Planner(Base):
    __tablename__ = "planners"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    deadline = Column(Date, nullable=True)  # DateTime에서 Date로 변경
    status = Column(Enum(PlannerStatus), default=PlannerStatus.ongoing)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=TimeService.now_kst)
    updated_at = Column(DateTime(timezone=True), default=TimeService.now_kst, onupdate=TimeService.now_kst)

    # 관계
    team = relationship("Team", back_populates="planners")
    creator = relationship("User", back_populates="planners")
    todos = relationship("Todo", back_populates="planner", cascade="all, delete-orphan")
 