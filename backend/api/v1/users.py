"""
사용자 API 엔드포인트 모듈

이 파일은 사용자와 관련된 모든 REST API 엔드포인트를 정의합니다.
사용자 생성, 로그인, 조회, 수정 등의 기능을 제공합니다.

주요 기능:
- 사용자 회원가입
- 사용자 로그인 및 JWT 토큰 발급
- 사용자 정보 조회 및 수정
- 이메일로 사용자 검색
- 현재 로그인한 사용자 정보 조회
"""

from fastapi import APIRouter, Depends, HTTPException, status, Form
from schemas.user import UserCreate, UserRead, UserUpdate, PasswordChange, AccountDelete
from database import get_db
from models.user import User
from services.user_service import UserService
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
import logging

# 인증 관련 임포트
from core.config import settings
from core.exceptions import AuthenticationError, NotFoundError, ConflictError, ValidationError
from core.logging_config import get_logger
from core.validators import input_validator
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from core.security import decode_access_token
from fastapi.security import OAuth2PasswordRequestForm

# 로거 및 라우터 초기화
logger = get_logger(__name__)
router = APIRouter(prefix="/users", tags=["users"])

# OAuth2 Password Bearer 스키마 설정
# Authorization 헤더에서 Bearer 토큰을 자동으로 추출
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/users/login")

# 의존성 주입 함수들
def get_user_service(db: Session = Depends(get_db)) -> UserService:
    """
    UserService 의존성 주입 함수
    
    FastAPI의 의존성 주입 시스템에서 사용됩니다.
    각 요청마다 새로운 UserService 인스턴스를 생성하여 제공합니다.
    
    Args:
        db (Session): SQLAlchemy 데이터베이스 세션
        
    Returns:
        UserService: 사용자 서비스 인스턴스
    """
    return UserService(db)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """
    현재 로그인한 사용자 정보를 가져오는 함수
    
    JWT 토큰을 검증하여 현재 로그인한 사용자 정보를 반환합니다.
    API 엔드포인트에서 @Depends(get_current_user)를 사용하여
    인증이 필요한 엔드포인트를 구현할 수 있습니다.
    
    Args:
        token (str): Authorization 헤더에서 추출된 Bearer 토큰
        db (Session): SQLAlchemy 데이터베이스 세션
        
    Returns:
        User: 현재 로그인한 사용자 객체
        
    Raises:
        HTTPException: 토큰이 유효하지 않거나 사용자를 찾을 수 없는 경우
            - status_code: 401 (Unauthorized)
            - detail: "Could not validate credentials"
    """
    credentials_exception = HTTPException(status_code=401, detail="Could not validate credentials")
    
    # JWT 토큰 디코딩
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    # 토큰에서 사용자 ID 추출
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    # 데이터베이스에서 사용자 조회
    user_service = UserService(db)
    user = user_service.get_user_by_id(int(user_id))
    if user is None:
        raise credentials_exception
    
    return user

@router.post("/", response_model=UserRead)
def create_user(user: UserCreate, user_service: UserService = Depends(get_user_service)):
    """
    사용자 생성 엔드포인트
    
    새로운 사용자를 생성하고 이메일 인증 코드를 발송합니다.
    
    Args:
        user (UserCreate): 사용자 생성 데이터
            - name (str): 사용자 이름 (최대 50자)
            - email (str): 이메일 주소 (고유해야 함)
            - password (str): 비밀번호 (최소 8자, 특수문자 포함)
        user_service (UserService): 사용자 서비스 (의존성 주입)
        
    Returns:
        UserRead: 생성된 사용자 정보
            - id: 사용자 ID
            - email: 이메일 주소
            - name: 사용자 이름
            - created_at: 생성 시간
            - updated_at: 수정 시간
            
    Raises:
        HTTPException: 
            - 400: 입력 데이터가 유효하지 않은 경우
            - 409: 이메일이 이미 존재하는 경우
            - 500: 서버 내부 오류
            
    사용 예시:
        POST /api/v1/users/
        {
            "name": "홍길동",
            "email": "hong@example.com",
            "password": "SecurePass123!"
        }
    """
    try:
        # 사용자 생성 데이터 준비
        user_data = {
            'name': user.name,
            'email': user.email,
            'password': user.password
        }
        
        # 사용자 생성 (서비스 레이어에서 검증 및 처리)
        created_user = user_service.create_user(user_data)
        
        # 응답 데이터 구성
        return {
            "id": created_user.id,
            "email": created_user.email,
            "name": created_user.name,
            "created_at": created_user.created_at,
            "updated_at": created_user.updated_at
        }
        
    except ValueError as e:
        # 입력 데이터 검증 오류
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # 기타 예상치 못한 오류
        logger.error(f"사용자 생성 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"사용자 생성 중 오류가 발생했습니다: {str(e)}")

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), user_service: UserService = Depends(get_user_service)):
    """
    사용자 로그인 엔드포인트
    
    이메일과 비밀번호를 확인하여 사용자를 인증하고 JWT 액세스 토큰을 발급합니다.
    
    Args:
        form_data (OAuth2PasswordRequestForm): 로그인 폼 데이터
            - username (str): 이메일 주소
            - password (str): 비밀번호
        user_service (UserService): 사용자 서비스 (의존성 주입)
        
    Returns:
        Dict: 로그인 성공 응답
            - access_token (str): JWT 액세스 토큰
            - token_type (str): 토큰 타입 ("bearer")
            - user (Dict): 사용자 정보
                - id: 사용자 ID
                - email: 이메일 주소
                - name: 사용자 이름
                
    Raises:
        HTTPException:
            - 400: 이메일 또는 비밀번호가 올바르지 않은 경우
            - 500: 서버 내부 오류
            
    사용 예시:
        POST /api/v1/users/login
        Content-Type: application/x-www-form-urlencoded
        username=hong@example.com&password=SecurePass123!
    """
    try:
        # 사용자 인증 (이메일과 비밀번호 확인)
        user = user_service.authenticate_user(form_data.username, form_data.password)
        if not user:
            raise HTTPException(status_code=400, detail="이메일 또는 비밀번호가 올바르지 않습니다.")
        
        # JWT 액세스 토큰 생성
        access_token = user_service.create_access_token_for_user(user)
        
        # 로그인 성공 응답
        return {
            "access_token": access_token, 
            "token_type": "bearer", 
            "user": {
                "id": user.id,
                "email": user.email,
                "name": user.name
            }
        }
        
    except HTTPException:
        # 이미 발생한 HTTP 예외는 그대로 전파
        raise
    except Exception as e:
        # 기타 예상치 못한 오류
        logger.error(f"로그인 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"로그인 중 오류가 발생했습니다: {str(e)}")

@router.get("/me", response_model=UserRead)
def read_me(current_user: User = Depends(get_current_user)):
    """현재 로그인한 사용자 정보 조회"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at
    }

@router.get("/search", response_model=UserRead)
def search_user_by_email(email: str, user_service: UserService = Depends(get_user_service)):
    """이메일로 사용자 검색"""
    try:
        user = user_service.get_user_by_email(email)
        
        if not user:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
        
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "created_at": user.created_at,
            "updated_at": user.updated_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"사용자 검색 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"사용자 검색 중 오류가 발생했습니다: {str(e)}")

@router.get("/{user_id}", response_model=UserRead)
def read_user(user_id: int, user_service: UserService = Depends(get_user_service), current_user: User = Depends(get_current_user)):
    """특정 사용자 정보 조회"""
    try:
        user = user_service.get_user_by_id(user_id)
        
        if not user:
            raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
        
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "created_at": user.created_at,
            "updated_at": user.updated_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"사용자 조회 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"사용자 조회 중 오류가 발생했습니다: {str(e)}")

@router.put("/me", response_model=UserRead)
def update_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    현재 사용자 프로필 정보 수정
    
    현재 로그인한 사용자의 이름과 이메일을 수정합니다.
    
    Args:
        user_update (UserUpdate): 수정할 사용자 정보
        current_user (User): 현재 로그인한 사용자
        user_service (UserService): 사용자 서비스
        
    Returns:
        UserRead: 수정된 사용자 정보
        
    Raises:
        HTTPException:
            - 400: 이메일이 이미 사용 중인 경우
            - 500: 서버 내부 오류
    """
    try:
        current_user_id = int(current_user.id)  # type: ignore
        
        # 이메일 중복 확인 (자신의 이메일은 제외)
        existing_user = user_service.get_user_by_email(user_update.email)
        if existing_user and existing_user.id != current_user_id:  # type: ignore
            raise HTTPException(status_code=400, detail="이미 사용 중인 이메일입니다.")
        
        # 사용자 정보 업데이트
        updated_user = user_service.update_user_profile(
            current_user_id,
            user_update.name,
            user_update.email
        )
        
        if updated_user:
            return {
                "id": updated_user.id,
                "email": updated_user.email,
                "name": updated_user.name,
                "created_at": updated_user.created_at,
                "updated_at": updated_user.updated_at
            }
        else:
            raise HTTPException(status_code=500, detail="사용자 정보 업데이트에 실패했습니다.")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"프로필 수정 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"프로필 수정 중 오류가 발생했습니다: {str(e)}")

@router.put("/me/password")
def change_password(
    password_change: PasswordChange,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    현재 사용자 비밀번호 변경
    
    현재 로그인한 사용자의 비밀번호를 변경합니다.
    
    Args:
        password_change (PasswordChange): 비밀번호 변경 정보
        current_user (User): 현재 로그인한 사용자
        user_service (UserService): 사용자 서비스
        
    Returns:
        dict: 성공 메시지
        
    Raises:
        HTTPException:
            - 400: 현재 비밀번호가 올바르지 않은 경우
            - 500: 서버 내부 오류
    """
    try:
        # 현재 비밀번호 확인
        if not user_service.verify_password(password_change.current_password, str(current_user.password)):
            raise HTTPException(status_code=400, detail="현재 비밀번호가 올바르지 않습니다.")
        
        # 새 비밀번호로 변경
        user_service.change_user_password(int(current_user.id), password_change.new_password)  # type: ignore
        
        return {"message": "비밀번호가 성공적으로 변경되었습니다."}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"비밀번호 변경 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"비밀번호 변경 중 오류가 발생했습니다: {str(e)}")

@router.delete("/me")
def delete_account(
    account_delete: AccountDelete,
    current_user: User = Depends(get_current_user),
    user_service: UserService = Depends(get_user_service)
):
    """
    현재 사용자 계정 삭제
    
    현재 로그인한 사용자의 계정을 삭제합니다.
    
    Args:
        account_delete (AccountDelete): 계정 삭제 확인 정보
        current_user (User): 현재 로그인한 사용자
        user_service (UserService): 사용자 서비스
        
    Returns:
        dict: 성공 메시지
        
    Raises:
        HTTPException:
            - 400: 비밀번호가 올바르지 않은 경우
            - 500: 서버 내부 오류
    """
    try:
        # 비밀번호 확인
        if not user_service.verify_password(account_delete.password, str(current_user.password)):
            raise HTTPException(status_code=400, detail="비밀번호가 올바르지 않습니다.")
        
        # 팀 탈퇴 조건 확인
        team_memberships = user_service.get_user_team_memberships(int(current_user.id))  # type: ignore
        if team_memberships:
            team_names = [team.name for team in team_memberships]
            raise HTTPException(
                status_code=400, 
                detail=f"회원탈퇴를 위해서는 모든 팀에서 탈퇴해야 합니다. 현재 속한 팀: {', '.join(team_names)}"
            )
        
        # 계정 삭제
        user_service.delete_user(int(current_user.id))  # type: ignore
        
        return {"message": "계정이 성공적으로 삭제되었습니다."}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"계정 삭제 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"계정 삭제 중 오류가 발생했습니다: {str(e)}") 