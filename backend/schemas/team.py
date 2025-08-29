from pydantic import BaseModel
from typing import List, Optional, ForwardRef
from datetime import datetime

class TeamBase(BaseModel):
    name: str
    description: Optional[str] = None

class TeamCreate(TeamBase):
    pass

class TeamUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class TeamMemberBase(BaseModel):
    role: str

class TeamMemberCreate(TeamMemberBase):
    user_id: int

class TeamMemberRead(TeamMemberBase):
    id: int
    team_id: int
    user_id: int
    joined_at: datetime
    user_name: Optional[str] = None
    user_email: Optional[str] = None

    model_config = {"from_attributes": True}

class TeamMemberUpdate(BaseModel):
    role: Optional[str] = None

class RoleUpdate(BaseModel):
    role: str

class TeamRead(TeamBase):
    id: int
    created_at: datetime
    updated_at: datetime
    members: List[TeamMemberRead]
    member_count: Optional[int] = None
    owner_id: Optional[int] = None
    owner_name: Optional[str] = None

    model_config = {"from_attributes": True} 