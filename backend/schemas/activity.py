from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ActivityBase(BaseModel):
    action: str
    resource_type: str
    resource_id: Optional[int] = None
    description: str
    activity_metadata: Optional[str] = None

class ActivityCreate(ActivityBase):
    user_id: int

class ActivityRead(ActivityBase):
    id: int
    user_id: int
    created_at: datetime
    user_name: Optional[str] = None

    model_config = {"from_attributes": True} 