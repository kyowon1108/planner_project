from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from services.time_service import TimeService

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, nullable=False)  # team_invite, planner_deadline, post_comment, etc.
    is_read = Column(Boolean, default=False)
    related_id = Column(Integer)  # 팀 ID, 플래너 ID, 게시글 ID 등
    created_at = Column(DateTime(timezone=True), default=TimeService.now_kst)

    # 관계
    user = relationship("User", back_populates="notifications") 