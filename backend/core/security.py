"""
보안 관련 유틸리티 모듈

이 파일은 애플리케이션의 보안과 관련된 모든 유틸리티 함수를 정의합니다.
비밀번호 해싱, JWT 토큰 생성 및 검증을 담당합니다.

주요 기능:
- 비밀번호 해싱 및 검증 (bcrypt)
- JWT 액세스 토큰 생성
- JWT 토큰 검증 및 디코딩
- 보안 설정 관리


"""

from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional, Union, Any
from jose import JWTError, jwt
from core.config import settings
from services.time_service import TimeService

# 비밀번호 해싱 컨텍스트 설정
# bcrypt 알고리즘 사용, 자동으로 최신 보안 설정 적용
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """
    비밀번호를 해싱하는 함수
    
    bcrypt 알고리즘을 사용하여 비밀번호를 안전하게 해싱합니다.
    해싱된 비밀번호는 데이터베이스에 저장됩니다.
    
    Args:
        password (str): 평문 비밀번호
        
    Returns:
        str: 해싱된 비밀번호
        
    보안 특징:
    - bcrypt는 salt를 자동으로 생성하여 rainbow table 공격 방지
    - 계산 비용이 높아 brute force 공격에 저항
    - deprecated="auto"로 자동으로 최신 보안 설정 적용
        
    사용 예시:
        hashed_password = get_password_hash("my_password")
        # 결과: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/..."
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    비밀번호를 검증하는 함수
    
    평문 비밀번호와 해싱된 비밀번호를 비교하여 일치하는지 확인합니다.
    
    Args:
        plain_password (str): 사용자가 입력한 평문 비밀번호
        hashed_password (str): 데이터베이스에 저장된 해싱된 비밀번호
        
    Returns:
        bool: 비밀번호가 일치하면 True, 일치하지 않으면 False
        
    사용 예시:
        is_valid = verify_password("my_password", hashed_password)
        if is_valid:
            print("로그인 성공")
        else:
            print("비밀번호가 올바르지 않습니다")
    """
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    JWT 액세스 토큰을 생성하는 함수
    
    사용자 정보를 포함한 JWT 토큰을 생성합니다.
    토큰에는 만료 시간이 포함되어 자동으로 만료됩니다.
    
    Args:
        data (dict): 토큰에 포함할 데이터
            - sub: 사용자 ID (필수)
            - 기타 사용자 정의 데이터
        expires_delta (timedelta | None): 토큰 만료 시간 (기본값: 설정 파일의 값)
            
    Returns:
        str: 생성된 JWT 토큰
        
    토큰 구조:
    - Header: 알고리즘 정보 (HS256)
    - Payload: 사용자 데이터 + 만료 시간
    - Signature: 서명 (settings.secret_key로 생성)
        
    사용 예시:
        token_data = {"sub": str(user.id), "email": user.email}
        access_token = create_access_token(token_data)
        # 결과: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    """
    to_encode = data.copy()  # 원본 데이터 보호를 위해 복사
    
    # 만료 시간 설정
    expire = TimeService.now_kst() + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    to_encode.update({"exp": expire})  # JWT 표준 필드
    
    # JWT 토큰 생성
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    """
    JWT 액세스 토큰을 검증하고 디코딩하는 함수
    
    토큰의 서명을 검증하고 만료 시간을 확인한 후,
    토큰에 포함된 데이터를 반환합니다.
    
    Args:
        token (str): 검증할 JWT 토큰
        
    Returns:
        Optional[dict]: 토큰이 유효하면 페이로드 데이터, 유효하지 않으면 None
        
    검증 항목:
    - 서명 검증 (settings.secret_key로 생성된 서명 확인)
    - 만료 시간 확인 (exp 필드)
    - 알고리즘 확인 (settings.algorithm)
        
    사용 예시:
        payload = decode_access_token(access_token)
        if payload:
            user_id = payload.get("sub")
            print(f"사용자 ID: {user_id}")
        else:
            print("토큰이 유효하지 않습니다")
    """
    try:
        # JWT 토큰 디코딩 및 검증
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        # 토큰이 유효하지 않은 경우 (만료, 잘못된 서명 등)
        return None 