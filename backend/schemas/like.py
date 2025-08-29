from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class LikeCreate(BaseModel):
    post_id: int

class LikeResponse(BaseModel):
    id: int
    user_id: int
    post_id: int
    created_at: datetime
    action: Optional[str] = None  # "added" 또는 "removed"

    model_config = {"from_attributes": True} 