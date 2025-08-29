from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ReplyBase(BaseModel):
    content: str

class ReplyCreate(ReplyBase):
    pass

class ReplyUpdate(BaseModel):
    content: str

class ReplyRead(ReplyBase):
    id: int
    author_id: int
    author_name: Optional[str] = None  # 선택적 필드로 변경
    post_id: int
    created_at: datetime
    updated_at: datetime
    is_deleted: bool
    deleted_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
    
    @property
    def content(self) -> str:
        """삭제된 댓글의 경우 내용을 완전히 숨깁니다."""
        if self.is_deleted:
            return ""
        return self._content
    
    def __init__(self, **data):
        super().__init__(**data)
        self._content = data.get('content', '') 