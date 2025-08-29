from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
from services.time_service import TimeService

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    category = Column(String, default="일반")  # 카테고리 추가
    tags = Column(String)  # 태그 (쉼표로 구분된 문자열)
    created_at = Column(DateTime(timezone=True), default=TimeService.now_kst)
    updated_at = Column(DateTime(timezone=True), default=TimeService.now_kst, onupdate=TimeService.now_kst)

    # 관계
    author = relationship("User", back_populates="posts")
    team = relationship("Team", back_populates="posts")
    replies = relationship("Reply", back_populates="post", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="post", cascade="all, delete-orphan")
 