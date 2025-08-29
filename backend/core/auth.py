"""
JWT 인증 및 사용자 인증 관리 모듈

이 파일은 JWT (JSON Web Token) 기반의 사용자 인증을 처리합니다.
FastAPI의 의존성 주입 시스템을 활용하여 API 엔드포인트에서 사용자 인증을 수행합니다.

주요 기능:
- JWT 토큰 검증
- 현재 사용자 정보 추출
- 인증 실패 시 적절한 HTTP 예외 발생


"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from database import get_db
from models import User
from core.config import settings
from datetime import datetime

# OAuth2 Password Bearer 스키마 설정
# tokenUrl: 토큰을 발급받는 엔드포인트 URL
# Authorization 헤더에서 Bearer 토큰을 자동으로 추출
security = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(
    credentials: str = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    JWT 토큰에서 현재 사용자 정보를 추출하는 함수
    
    이 함수는 FastAPI의 의존성 주입 시스템에서 사용됩니다.
    API 엔드포인트에서 @Depends(get_current_user)를 사용하여
    현재 로그인한 사용자 정보를 자동으로 가져올 수 있습니다.
    
    Args:
        credentials (str): Authorization 헤더에서 추출된 Bearer 토큰
        db (Session): 데이터베이스 세션
        
    Returns:
        User: 현재 로그인한 사용자 객체
        
    Raises:
        HTTPException: 토큰이 유효하지 않거나 사용자를 찾을 수 없는 경우
            - status_code: 401 (Unauthorized)
            - detail: "Could not validate credentials"
            - headers: WWW-Authenticate 헤더 포함
            
    사용 예시:
        @app.get("/profile")
        def get_profile(current_user: User = Depends(get_current_user)):
            return {"user_id": current_user.id, "email": current_user.email}
    """
    # 인증 실패 시 발생할 예외 정의
    # 401 Unauthorized 상태 코드와 적절한 헤더 설정
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},  # 클라이언트에게 Bearer 인증 필요함을 알림
    )
    
    try:
        # JWT 토큰 디코딩 및 검증
        token = credentials
        # settings.secret_key로 토큰 서명 검증
        # settings.algorithm으로 암호화 알고리즘 확인
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        
        # 토큰 페이로드에서 사용자 ID 추출
        user_id = payload.get("sub")  # JWT 표준에서 사용자 ID는 "sub" 필드에 저장
        if user_id is None:
            raise credentials_exception  # 사용자 ID가 없으면 인증 실패
        
        # 문자열을 정수로 변환 (JWT는 모든 값을 문자열로 저장)
        user_id = int(user_id)
        
    except JWTError:
        # JWT 디코딩 실패 시 인증 실패
        raise credentials_exception
    
    # 데이터베이스에서 사용자 조회
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        # 사용자가 존재하지 않으면 인증 실패
        raise credentials_exception
    
    # 인증된 사용자 객체 반환
    return user 