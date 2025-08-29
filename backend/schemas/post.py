from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class PostBase(BaseModel):
    title: str
    content: str
    team_id: int
    category: Optional[str] = "일반"
    tags: Optional[str] = None

class PostCreate(PostBase):
    pass

class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None

class PostRead(PostBase):
    id: int
    author_id: int
    created_at: datetime
    updated_at: datetime
    author_name: Optional[str] = None
    team_name: Optional[str] = None

    model_config = {"from_attributes": True} 