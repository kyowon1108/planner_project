from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
from database import Base
from services.time_service import TimeService

class Invite(Base):
    __tablename__ = "invites"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False, index=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # 초대받은 사용자 ID (이메일로 초대하는 경우 null)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, default="editor")  # 초대받은 사용자의 팀 내 권한
    email = Column(String, nullable=True)  # 초대받은 사용자의 이메일
    status = Column(String, default="pending")  # 초대 상태 (pending, accepted, declined, cancelled)
    is_used = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=TimeService.now_kst)

    # 관계
    team = relationship("Team")
    creator = relationship("User", foreign_keys=[created_by])
    user = relationship("User", foreign_keys=[user_id]) 