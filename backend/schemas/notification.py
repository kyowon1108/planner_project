from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class NotificationBase(BaseModel):
    title: str
    message: str
    type: str
    is_read: bool = False
    related_id: Optional[int] = None

class NotificationCreate(NotificationBase):
    pass

class NotificationRead(NotificationBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = {"from_attributes": True}

class NotificationUpdate(BaseModel):
    title: Optional[str] = None
    message: Optional[str] = None
    type: Optional[str] = None
    is_read: Optional[bool] = None
    related_id: Optional[int] = None 