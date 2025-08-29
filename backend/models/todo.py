from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Table, Enum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
from services.time_service import TimeService
import enum
from typing import List, Optional, Any, ClassVar

class TodoPriority(str, enum.Enum):
    low = "낮음"
    medium = "보통"
    high = "높음"
    urgent = "긴급"

# 할일 담당자 중간 테이블
todo_assignments = Table(
    'todo_assignments',
    Base.metadata,
    Column('todo_id', Integer, ForeignKey('todos.id', ondelete='CASCADE'), primary_key=True),
    Column('user_id', Integer, ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('assigned_at', DateTime(timezone=True), default=TimeService.now_kst)
)

class Todo(Base):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    is_completed = Column(Boolean, default=False)
    priority = Column(Enum(TodoPriority), default=TodoPriority.medium)
    planner_id = Column(Integer, ForeignKey("planners.id", ondelete="CASCADE"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    due_date = Column(DateTime, nullable=True)  # DateTime에서 Date로 변경
    status = Column(String, default="진행중")  # 상태 필드 추가
    created_at = Column(DateTime(timezone=True), default=TimeService.now_kst)
    updated_at = Column(DateTime(timezone=True), default=TimeService.now_kst, onupdate=TimeService.now_kst)

    # 관계
    planner = relationship("Planner", back_populates="todos")
    creator = relationship("User", foreign_keys=[created_by], back_populates="todos")
    assignees = relationship("User", secondary=todo_assignments, back_populates="assigned_todos")
    
    # 추가 필드 (API 응답용) - ClassVar로 표시하여 ORM 매핑 제외
    planner_name: ClassVar[Optional[str]] = None
    assignee_names: ClassVar[List[str]] = []
    creator_name: ClassVar[Optional[str]] = None 