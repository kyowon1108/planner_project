from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InviteBase(BaseModel):
    team_id: int
    role: str = "editor"
    email: Optional[str] = None
    expires_at: Optional[datetime] = None

class InviteCreate(InviteBase):
    pass

class InviteRead(InviteBase):
    id: int
    code: str
    created_by: int
    is_used: bool
    created_at: datetime

    model_config = {"from_attributes": True} 