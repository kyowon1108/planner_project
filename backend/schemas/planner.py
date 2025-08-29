from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from enum import Enum

class PlannerStatus(str, Enum):
    ongoing = "진행중"
    completed = "완료"
    cancelled = "취소"

class PlannerBase(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: Optional[date] = None
    status: PlannerStatus = PlannerStatus.ongoing

class PlannerCreate(PlannerBase):
    team_id: int

class PlannerUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[date] = None
    status: Optional[PlannerStatus] = None

class PlannerRead(PlannerBase):
    id: int
    team_id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    creator_name: Optional[str] = None
    team_name: Optional[str] = None

    model_config = {"from_attributes": True} 