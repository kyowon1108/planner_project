from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
from services.time_service import TimeService

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)  # create, update, delete, join, etc.
    resource_type = Column(String, nullable=False)  # team, planner, post, todo, etc.
    resource_id = Column(Integer, nullable=True)  # 관련 리소스 ID
    description = Column(Text, nullable=False)  # 활동 설명
    activity_metadata = Column(Text, nullable=True)  # 추가 정보 (JSON 형태)
    created_at = Column(DateTime(timezone=True), default=TimeService.now_kst)

    # 관계
    user = relationship("User", back_populates="activities") 