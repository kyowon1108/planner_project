from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from schemas.email_verification import (
    EmailVerificationCreate,
    EmailVerificationVerify,
    EmailVerificationResponse,
    EmailVerificationStatus
)
from typing import List, Optional
from services.email_service import EmailService
from datetime import datetime, timedelta
import secrets
import logging
from services.time_service import TimeService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/email-verification", tags=["email-verification"])

@router.post("/send", response_model=EmailVerificationResponse)
def send_verification_email(
    data: EmailVerificationCreate,
    db: Session = Depends(get_db)
):
    """이메일 인증 코드 발송"""
    try:
        # 사용자 확인
        user = db.query(User).filter(User.email == data.email).first()
        if not user:
            raise HTTPException(status_code=404, detail="해당 이메일의 사용자를 찾을 수 없습니다.")
        
        # 이미 인증된 사용자인지 확인
        if getattr(user, 'is_email_verified', False):
            raise HTTPException(status_code=400, detail="이미 인증된 이메일입니다.")
        
        # 새로운 인증 코드 생성 (6자리 숫자)
        verification_code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
        expires_at = TimeService.now_kst() + timedelta(hours=24)
        
        # User 모델에 직접 저장
        db.query(User).filter(User.id == user.id).update({
            "email_verification_token": verification_code,
            "email_verification_expires": expires_at
        })
        db.commit()
        
        # 이메일 발송
        email_service = EmailService()
        user_name = str(user.name)
        if email_service.send_verification_email(data.email, verification_code, user_name):
            return EmailVerificationResponse(
                message="인증 코드가 이메일로 발송되었습니다.",
                email=data.email
            )
        else:
            raise HTTPException(status_code=500, detail="이메일 발송에 실패했습니다.")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"이메일 인증 코드 발송 실패: {str(e)}")
        raise HTTPException(status_code=500, detail="인증 코드 발송 중 오류가 발생했습니다.")

@router.post("/verify", response_model=EmailVerificationResponse)
def verify_email(
    data: EmailVerificationVerify,
    db: Session = Depends(get_db)
):
    """이메일 인증 코드 확인"""
    try:
        # 사용자 확인
        user = db.query(User).filter(User.email == data.email).first()
        if not user:
            raise HTTPException(status_code=404, detail="해당 이메일의 사용자를 찾을 수 없습니다.")
        
        # 인증 코드 확인
        if user.email_verification_token is None or str(user.email_verification_token) != data.verification_code:
            raise HTTPException(status_code=400, detail="잘못된 인증 코드입니다.")
        
        # 만료 확인
        if user.email_verification_expires is None:
            raise HTTPException(status_code=400, detail="인증 코드가 만료되었습니다.")
        
        current_time = TimeService.now_kst()
        
        # 데이터베이스에서 직접 만료 시간 확인
        expired_user = db.query(User).filter(
            User.id == user.id,
            User.email_verification_expires < current_time
        ).first()
        
        if expired_user:
            raise HTTPException(status_code=400, detail="인증 코드가 만료되었습니다.")
        
        # 인증 완료 처리
        db.query(User).filter(User.id == user.id).update({
            "is_email_verified": True,
            "email_verification_token": None,
            "email_verification_expires": None
        })
        db.commit()
        
        return EmailVerificationResponse(
            message="이메일 인증이 완료되었습니다.",
            email=data.email
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"이메일 인증 실패: {str(e)}")
        raise HTTPException(status_code=500, detail="인증 처리 중 오류가 발생했습니다.")

@router.post("/resend", response_model=EmailVerificationResponse)
def resend_verification_email(
    data: EmailVerificationCreate,
    db: Session = Depends(get_db)
):
    """인증 코드 재발송"""
    try:
        # 사용자 확인
        user = db.query(User).filter(User.email == data.email).first()
        if not user:
            raise HTTPException(status_code=404, detail="해당 이메일의 사용자를 찾을 수 없습니다.")
        
        # 이미 인증된 사용자인지 확인
        if str(user.is_email_verified) == "True":
            raise HTTPException(status_code=400, detail="이미 인증된 이메일입니다.")
        
        # 새로운 인증 코드 생성
        verification_code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
        expires_at = TimeService.now_kst() + timedelta(hours=24)
        
        # User 모델에 직접 저장
        db.query(User).filter(User.id == user.id).update({
            "email_verification_token": verification_code,
            "email_verification_expires": expires_at
        })
        db.commit()
        
        # 이메일 재발송
        email_service = EmailService()
        user_name = str(user.name)
        if email_service.send_verification_email(data.email, verification_code, user_name):
            return EmailVerificationResponse(
                message="인증 코드가 재발송되었습니다.",
                email=data.email
            )
        else:
            raise HTTPException(status_code=500, detail="이메일 발송에 실패했습니다.")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"이메일 인증 코드 재발송 실패: {str(e)}")
        raise HTTPException(status_code=500, detail="인증 코드 재발송 중 오류가 발생했습니다.")

@router.get("/status/{email}", response_model=EmailVerificationStatus)
def get_verification_status(
    email: str,
    db: Session = Depends(get_db)
):
    """이메일 인증 상태 확인"""
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="해당 이메일의 사용자를 찾을 수 없습니다.")
        
        return EmailVerificationStatus(
            is_verified=str(user.is_email_verified) == "True",
            email=email
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"인증 상태 확인 실패: {str(e)}")
        raise HTTPException(status_code=500, detail="인증 상태 확인 중 오류가 발생했습니다.") 