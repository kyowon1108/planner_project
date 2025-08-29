from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone, timedelta
from database import Base
from services.time_service import TimeService

def korea_time():
    """한국 시간을 반환하는 함수"""
    return TimeService.now_kst()

class Reply(Base):
    __tablename__ = "replies"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=TimeService.now_kst)
    updated_at = Column(DateTime(timezone=True), default=TimeService.now_kst, onupdate=TimeService.now_kst)
    is_deleted = Column(Boolean, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # 관계
    author = relationship("User", back_populates="replies")
    post = relationship("Post", back_populates="replies") 