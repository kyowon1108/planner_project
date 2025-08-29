from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
from services.time_service import TimeService

class Like(Base):
    __tablename__ = "likes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=TimeService.now_kst)

    # 관계
    user = relationship("User", back_populates="likes")
    post = relationship("Post", back_populates="likes")

    # 한 사용자가 한 게시글에 좋아요를 한 번만 할 수 있도록 제약
    __table_args__ = (UniqueConstraint('user_id', 'post_id', name='unique_user_post_like'),) 