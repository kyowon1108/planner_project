"""
사용자 Pydantic 스키마 정의

이 파일은 사용자와 관련된 모든 Pydantic 스키마를 정의합니다.
API 요청/응답 데이터의 검증과 직렬화를 담당합니다.

주요 기능:
- 사용자 생성 데이터 검증 (UserCreate)
- 사용자 조회 데이터 직렬화 (UserRead)
- 이메일 형식 검증
- 데이터 타입 안전성 보장


"""

from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserBase(BaseModel):
    """
    사용자 기본 스키마
    
    모든 사용자 관련 스키마의 기본이 되는 클래스입니다.
    공통 필드들을 정의합니다.
    
    주요 필드:
    - name (str): 사용자 이름
    - email (EmailStr): 이메일 주소 (Pydantic이 자동으로 형식 검증)
    
    사용 예시:
        user_data = UserBase(name="홍길동", email="hong@example.com")
    """
    name: str  # 사용자 이름
    email: EmailStr  # 이메일 주소 (자동 형식 검증)

class UserCreate(UserBase):
    """
    사용자 생성 스키마
    
    새로운 사용자를 생성할 때 사용되는 스키마입니다.
    UserBase를 상속받아 비밀번호 필드를 추가합니다.
    
    주요 필드:
    - name (str): 사용자 이름 (UserBase에서 상속)
    - email (EmailStr): 이메일 주소 (UserBase에서 상속)
    - password (str): 비밀번호 (평문, 서버에서 해싱됨)
    
    검증 규칙:
    - name: 최대 50자
    - email: 유효한 이메일 형식
    - password: 최소 8자, 특수문자 포함 권장
    
    사용 예시:
        user_create = UserCreate(
            name="홍길동",
            email="hong@example.com",
            password="SecurePass123!"
        )
    """
    password: str  # 비밀번호 (평문, 서버에서 해싱 처리)

class UserRead(UserBase):
    """
    사용자 조회 스키마
    
    사용자 정보를 조회할 때 반환되는 스키마입니다.
    UserBase를 상속받아 데이터베이스에서 생성되는 필드들을 추가합니다.
    
    주요 필드:
    - name (str): 사용자 이름 (UserBase에서 상속)
    - email (EmailStr): 이메일 주소 (UserBase에서 상속)
    - id (int): 사용자 고유 식별자
    - created_at (datetime): 계정 생성 시간
    - updated_at (datetime): 정보 수정 시간
    
    보안 고려사항:
    - password 필드는 포함되지 않음 (보안상 민감한 정보)
    - 이메일 인증 상태는 별도 엔드포인트에서 확인
    
    사용 예시:
        user_read = UserRead(
            id=1,
            name="홍길동",
            email="hong@example.com",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    """
    id: int  # 사용자 고유 식별자
    created_at: datetime  # 계정 생성 시간
    updated_at: datetime  # 정보 수정 시간

    # Pydantic 설정
    # from_attributes=True: SQLAlchemy 모델의 속성을 자동으로 매핑
    model_config = {"from_attributes": True}

class UserUpdate(BaseModel):
    """
    사용자 정보 수정 스키마
    
    사용자 프로필 정보를 수정할 때 사용되는 스키마입니다.
    
    주요 필드:
    - name (str): 사용자 이름
    - email (EmailStr): 이메일 주소
    
    사용 예시:
        user_update = UserUpdate(
            name="홍길동",
            email="hong@example.com"
        )
    """
    name: str
    email: EmailStr

class PasswordChange(BaseModel):
    """
    비밀번호 변경 스키마
    
    사용자 비밀번호를 변경할 때 사용되는 스키마입니다.
    
    주요 필드:
    - current_password (str): 현재 비밀번호
    - new_password (str): 새 비밀번호
    
    사용 예시:
        password_change = PasswordChange(
            current_password="OldPass123!",
            new_password="NewSecurePass456!"
        )
    """
    current_password: str
    new_password: str

class AccountDelete(BaseModel):
    """
    회원탈퇴 스키마
    
    사용자 계정을 삭제할 때 사용되는 스키마입니다.
    
    주요 필드:
    - password (str): 계정 삭제 확인을 위한 비밀번호
    
    사용 예시:
        account_delete = AccountDelete(
            password="SecurePass123!"
        )
    """
    password: str 