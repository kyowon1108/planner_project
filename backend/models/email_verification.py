from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime, timedelta
import secrets
from services.time_service import TimeService

class EmailVerification(Base):
    __tablename__ = "email_verifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    email = Column(String, nullable=False)
    verification_code = Column(String, nullable=False, unique=True, index=True)
    is_used = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=TimeService.now_kst)
    
    # 관계
    user = relationship("User", back_populates="email_verifications")
    
    @classmethod
    def create_verification(cls, user_id: int, email: str, expires_in_hours: int = 24):
        """인증 코드 생성"""
        verification_code = secrets.token_urlsafe(32)
        expires_at = TimeService.now_kst() + timedelta(hours=expires_in_hours)
        
        return cls(
            user_id=user_id,
            email=email,
            verification_code=verification_code,
            expires_at=expires_at
        )
    
    def is_expired(self) -> bool:
        """토큰 만료 여부 확인"""
        return bool(TimeService.now_kst() > self.expires_at) 