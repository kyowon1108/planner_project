from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from enum import Enum

class TodoPriority(str, Enum):
    low = "낮음"
    medium = "보통"
    high = "높음"
    urgent = "긴급"
    
    @classmethod
    def from_frontend(cls, value: str):
        """프론트엔드에서 보내는 값으로부터 TodoPriority 생성"""
        mapping = {
            "낮음": cls.low,
            "보통": cls.medium,
            "높음": cls.high,
            "긴급": cls.urgent,
            "low": cls.low,
            "medium": cls.medium,
            "high": cls.high,
            "urgent": cls.urgent,
        }
        return mapping.get(value, cls.medium)

class TodoBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "보통"  # 문자열로 변경
    due_date: Optional[date] = None  # datetime에서 date로 변경
    status: str = "진행중"  # 상태 필드 추가
    assigned_to: Optional[List[int]] = None

class TodoCreate(TodoBase):
    planner_id: int

class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_completed: Optional[bool] = None
    priority: Optional[str] = None  # TodoPriority 대신 str 사용
    status: Optional[str] = None  # 상태 필드 추가
    assigned_to: Optional[List[int]] = None
    due_date: Optional[date] = None  # datetime에서 date로 변경

class TodoRead(TodoBase):
    id: int
    is_completed: bool
    planner_id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    creator_name: Optional[str] = None
    assignee_names: Optional[List[str]] = None

    model_config = {"from_attributes": True} 