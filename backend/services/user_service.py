"""
사용자 관리 서비스 모듈

이 파일은 사용자와 관련된 모든 비즈니스 로직을 처리하는 서비스 클래스를 포함합니다.
Repository 패턴을 사용하여 데이터 접근 계층과 분리되어 있으며,
캐싱, 이메일 발송, 로깅 등의 기능을 통합합니다.

주요 기능:
- 사용자 생성, 조회, 수정, 삭제
- 사용자 인증 및 JWT 토큰 생성
- 이메일 인증 처리
- 팀 멤버 관리
- 캐싱을 통한 성능 최적화
- 비동기 이메일 발송


"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from repositories.user_repository import UserRepository
from repositories.team_repository import TeamRepository
from models.user import User
from models.team import TeamMember
from core.security import get_password_hash, verify_password, create_access_token
from core.validators import input_validator
from core.exceptions import (
    UserNotFoundError, UserAlreadyExistsError, InvalidCredentialsError,
    InternalServerError, ValidationError
)
from datetime import datetime
from core.logging_config import get_structured_logger
from services.cache_service import cache_service
from services.email_service import EmailService
import random
import string

# 구조화된 로거 초기화
# 사용자 서비스 전용 로거로 모든 사용자 관련 작업을 추적
structured_logger = get_structured_logger("user.service")

class UserService:
    """
    사용자 관련 비즈니스 로직을 처리하는 서비스 클래스
    
    이 클래스는 사용자와 관련된 모든 비즈니스 로직을 캡슐화합니다.
    Repository 패턴을 사용하여 데이터 접근 계층과 분리되어 있으며,
    캐싱, 이메일 발송, 로깅 등의 기능을 통합합니다.
    
    주요 기능:
    - 사용자 CRUD 작업
    - 사용자 인증 및 JWT 토큰 생성
    - 이메일 인증 처리
    - 팀 멤버 관리
    - 캐싱을 통한 성능 최적화
    
    사용 예시:
        user_service = UserService(db_session)
        user = user_service.create_user({"name": "홍길동", "email": "hong@example.com", "password": "password123"})
        authenticated_user = user_service.authenticate_user("hong@example.com", "password123")
    """
    
    def __init__(self, db: Session):
        """
        UserService 초기화
        
        Args:
            db (Session): SQLAlchemy 데이터베이스 세션
        """
        self.db = db
        self.user_repo = UserRepository(db)  # 사용자 데이터 접근 계층
        self.team_repo = TeamRepository(db)  # 팀 데이터 접근 계층
        self.cache = cache_service  # 캐싱 서비스
        self.email_service = EmailService()  # 이메일 발송 서비스
    
    def create_user(self, user_data: Dict[str, Any]) -> User:
        """
        새로운 사용자를 생성합니다.
        
        사용자 생성 시 다음 작업을 수행합니다:
        1. 입력 데이터 검증 및 정제
        2. 이메일 중복 확인
        3. 비밀번호 해싱
        4. 사용자 데이터베이스 저장
        5. 이메일 인증 코드 생성 및 비동기 발송
        6. 캐시 무효화
        
        Args:
            user_data (Dict[str, Any]): 사용자 생성 데이터
                - name (str): 사용자 이름 (최대 50자)
                - email (str): 이메일 주소 (고유해야 함)
                - password (str): 비밀번호 (최소 8자, 특수문자 포함)
                
        Returns:
            User: 생성된 사용자 객체
            
        Raises:
            UserAlreadyExistsError: 이메일이 이미 존재하는 경우
            ValidationError: 입력 데이터가 유효하지 않은 경우
            InternalServerError: 데이터베이스 오류 또는 기타 시스템 오류
            
        사용 예시:
            user_data = {
                "name": "홍길동",
                "email": "hong@example.com",
                "password": "SecurePass123!"
            }
            user = user_service.create_user(user_data)
        """
        try:
            # 입력 데이터 검증 및 정제
            validated_name = input_validator.sanitize_string(user_data.get('name', ''), max_length=50)
            validated_email = input_validator.validate_email(user_data.get('email', ''))
            validated_password = input_validator.validate_password(user_data.get('password', ''))
            
            # 이메일 중복 확인
            existing_user = self.user_repo.get_by_email(validated_email)
            if existing_user:
                structured_logger.warning("이메일 중복 시도", email=validated_email)
                raise UserAlreadyExistsError(validated_email)
            
            # 비밀번호 해싱 및 데이터 준비
            user_data['password'] = get_password_hash(validated_password)
            user_data['name'] = validated_name
            user_data['email'] = validated_email
            
            # 사용자 생성 및 데이터베이스 저장
            user = self.user_repo.create(user_data)
            self.db.commit()
            structured_logger.info("사용자 생성 성공", email=validated_email, user_id=user.id)
            
            # 이메일 인증 코드 생성 및 비동기 발송
            verification_code = self._generate_verification_code()
            self.email_service.send_verification_email_async(
                str(user.email), 
                verification_code, 
                str(user.name)
            )
            structured_logger.info("이메일 인증 코드 비동기 발송 시작", email=user.email)
            
            return user
            
        except UserAlreadyExistsError:
            # 이미 존재하는 사용자 오류 - 롤백 후 재발생
            self.db.rollback()
            raise
        except IntegrityError as e:
            # 데이터베이스 무결성 오류 (중복 키 등)
            self.db.rollback()
            structured_logger.error("데이터베이스 무결성 오류", error_message=str(e), email=validated_email)
            raise UserAlreadyExistsError(validated_email)
        except SQLAlchemyError as e:
            # 일반적인 데이터베이스 오류
            self.db.rollback()
            structured_logger.error("데이터베이스 오류", error_message=str(e))
            raise InternalServerError("사용자 생성 중 데이터베이스 오류가 발생했습니다")
        except Exception as e:
            # 기타 예상치 못한 오류
            self.db.rollback()
            structured_logger.error("사용자 생성 실패", error_message=str(e))
            raise InternalServerError("사용자 생성 중 오류가 발생했습니다")
    
    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """
        사용자 인증을 처리합니다.
        
        이메일과 비밀번호를 확인하여 사용자를 인증합니다.
        성능 모니터링을 위해 인증 시간을 측정하고 로깅합니다.
        
        Args:
            email (str): 사용자 이메일 주소
            password (str): 사용자 비밀번호 (평문)
            
        Returns:
            Optional[User]: 인증 성공 시 사용자 객체, 실패 시 None
            
        사용 예시:
            user = user_service.authenticate_user("hong@example.com", "password123")
            if user:
                print(f"인증 성공: {user.name}")
            else:
                print("인증 실패")
        """
        import time
        start_time = time.time()
        
        try:
            # 이메일로 사용자 조회
            user = self.user_repo.get_by_email(email)
            if not user:
                structured_logger.warning("로그인 실패 - 존재하지 않는 이메일", email=email)
                return None
            
            # 비밀번호 검증
            user_password = getattr(user, 'password', None)
            if not user_password or not verify_password(password, user_password):
                structured_logger.warning("로그인 실패 - 잘못된 비밀번호", email=email)
                return None
            
            # 인증 성공 - 성능 측정 및 로깅
            elapsed_time = time.time() - start_time
            structured_logger.info("사용자 인증 성공", email=email, elapsed_time=f"{elapsed_time:.3f}s")
            return user
            
        except SQLAlchemyError as e:
            structured_logger.error("데이터베이스 오류", error_message=str(e))
            return None
        except Exception as e:
            structured_logger.error("사용자 인증 실패", error_message=str(e))
            return None
    
    def create_access_token_for_user(self, user: User) -> str:
        """사용자를 위한 액세스 토큰을 생성합니다."""
        try:
            user_id = getattr(user, 'id', None)
            if user_id is None:
                raise ValidationError("사용자 ID가 없습니다.")
            
            token_data = {"sub": str(user_id)}
            access_token = create_access_token(token_data)
            structured_logger.info("액세스 토큰 생성 성공", user_id=user_id)
            return access_token
            
        except Exception as e:
            structured_logger.error("액세스 토큰 생성 실패", error_message=str(e))
            raise InternalServerError("토큰 생성 중 오류가 발생했습니다")
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """ID로 사용자를 조회합니다."""
        try:
            # 캐시에서 먼저 확인
            cache_key = f"user:{user_id}"
            cached_user = self.cache.get(cache_key)
            if cached_user:
                structured_logger.info("캐시에서 사용자 조회", user_id=user_id)
                return cached_user
            
            # DB에서 조회
            user = self.user_repo.get_by_id(user_id)
            if not user:
                raise UserNotFoundError(user_id)
            
            # 캐시에 저장 (5분간)
            self.cache.set(cache_key, user, ttl=300)
            structured_logger.info("사용자 조회 및 캐시 저장", user_id=user_id)
            return user
            
        except UserNotFoundError:
            raise
        except SQLAlchemyError as e:
            structured_logger.error("데이터베이스 오류", error_message=str(e))
            raise InternalServerError("사용자 조회 중 데이터베이스 오류가 발생했습니다")
        except Exception as e:
            structured_logger.error("사용자 조회 실패", user_id=user_id, error_message=str(e))
            raise InternalServerError("사용자 조회 중 오류가 발생했습니다")
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """이메일로 사용자를 조회합니다."""
        try:
            user = self.user_repo.get_by_email(email)
            if not user:
                raise UserNotFoundError()
            return user
        except UserNotFoundError:
            raise
        except SQLAlchemyError as e:
            structured_logger.error("데이터베이스 오류", error_message=str(e))
            raise InternalServerError("사용자 조회 중 데이터베이스 오류가 발생했습니다")
        except Exception as e:
            structured_logger.error("사용자 조회 실패", email=email, error_message=str(e))
            raise InternalServerError("사용자 조회 중 오류가 발생했습니다")
    
    def get_all_users(self) -> List[User]:
        """모든 사용자를 조회합니다."""
        try:
            return self.user_repo.get_all()
        except Exception as e:
            structured_logger.error("전체 사용자 조회 실패", error_message=str(e))
            return []
    
    def update_user(self, user_id: int, user_data: Dict[str, Any]) -> Optional[User]:
        """사용자를 업데이트합니다."""
        try:
            user = self.user_repo.get_by_id(user_id)
            if not user:
                raise ValueError("사용자를 찾을 수 없습니다.")
            
            # 비밀번호가 포함된 경우 해싱
            if 'password' in user_data and user_data['password']:
                user_data['password'] = get_password_hash(user_data['password'])
            
            updated_user = self.user_repo.update(user_id, user_data)
            
            # 캐시 무효화
            cache_key = f"user:{user_id}"
            self.cache.delete(cache_key)
            structured_logger.info("사용자 업데이트 및 캐시 무효화", user_id=user_id)
            
            return updated_user
            
        except Exception as e:
            structured_logger.error("사용자 업데이트 실패", user_id=user_id, error_message=str(e))
            raise
    
    def delete_user(self, user_id: int) -> bool:
        """사용자를 삭제합니다."""
        try:
            user = self.user_repo.get_by_id(user_id)
            if not user:
                raise ValueError("사용자를 찾을 수 없습니다.")
            
            # 사용자와 관련된 모든 데이터를 먼저 삭제
            self._delete_user_related_data(user_id)
            
            # 마지막에 사용자 삭제
            success = self.user_repo.delete(user_id)
            if success:
                structured_logger.info("사용자 삭제 성공", user_id=user_id)
            return success
            
        except Exception as e:
            structured_logger.error("사용자 삭제 실패", user_id=user_id, error_message=str(e))
            raise
    
    def _delete_user_related_data(self, user_id: int):
        """사용자와 관련된 모든 데이터를 삭제합니다."""
        try:
            # 플래너 삭제
            from models.planner import Planner
            planners = self.db.query(Planner).filter(Planner.created_by == user_id).all()
            for planner in planners:
                self.db.delete(planner)
            
            # 할일 삭제
            from models.todo import Todo
            todos = self.db.query(Todo).filter(Todo.created_by == user_id).all()
            for todo in todos:
                self.db.delete(todo)
            
            # 게시물 삭제
            from models.post import Post
            posts = self.db.query(Post).filter(Post.author_id == user_id).all()
            for post in posts:
                self.db.delete(post)
            
            # 댓글 삭제
            from models.reply import Reply
            replies = self.db.query(Reply).filter(Reply.author_id == user_id).all()
            for reply in replies:
                self.db.delete(reply)
            
            # 좋아요 삭제
            from models.like import Like
            likes = self.db.query(Like).filter(Like.user_id == user_id).all()
            for like in likes:
                self.db.delete(like)
            
            # 알림 삭제
            from models.notification import Notification
            notifications = self.db.query(Notification).filter(Notification.user_id == user_id).all()
            for notification in notifications:
                self.db.delete(notification)
            
            # 활동 기록 삭제
            from models.activity import Activity
            activities = self.db.query(Activity).filter(Activity.user_id == user_id).all()
            for activity in activities:
                self.db.delete(activity)
            
            # 이메일 인증 기록 삭제
            from models.email_verification import EmailVerification
            email_verifications = self.db.query(EmailVerification).filter(EmailVerification.user_id == user_id).all()
            for email_verification in email_verifications:
                self.db.delete(email_verification)
            
            # 팀 멤버십 삭제
            from models.team import TeamMember
            team_members = self.db.query(TeamMember).filter(TeamMember.user_id == user_id).all()
            for team_member in team_members:
                self.db.delete(team_member)
            
            # 초대 삭제 (사용자가 보낸 초대)
            from models.invite import Invite
            invites = self.db.query(Invite).filter(Invite.created_by == user_id).all()
            for invite in invites:
                self.db.delete(invite)
            
            # 캐시 무효화
            self.cache.delete(f"user:{user_id}")
            
            structured_logger.info("사용자 관련 데이터 삭제 완료", user_id=user_id)
            
        except Exception as e:
            self.db.rollback()
            structured_logger.error("사용자 관련 데이터 삭제 실패", user_id=user_id, error=str(e))
            raise
    
    def verify_email(self, user_id: int) -> bool:
        """사용자의 이메일을 인증합니다."""
        try:
            success = self.user_repo.verify_email(user_id)
            if success:
                structured_logger.info("이메일 인증 성공", user_id=user_id)
            return success
            
        except Exception as e:
            structured_logger.error("이메일 인증 실패", user_id=user_id, error_message=str(e))
            return False
    
    def get_users_by_team(self, team_id: int) -> List[User]:
        """특정 팀의 멤버들을 조회합니다."""
        try:
            return self.user_repo.get_by_team(team_id)
        except Exception as e:
            structured_logger.error("팀 멤버 조회 실패", team_id=team_id, error_message=str(e))
            return []
    
    def get_team_members(self, team_id: int) -> List[User]:
        """팀 멤버 정보와 함께 사용자들을 조회합니다."""
        try:
            return self.user_repo.get_team_members(team_id)
        except Exception as e:
            structured_logger.error("팀 멤버 상세 조회 실패", team_id=team_id, error_message=str(e))
            return []
    
    def _generate_verification_code(self) -> str:
        """6자리 인증 코드를 생성합니다."""
        return ''.join(random.choices(string.digits, k=6))

    def update_user_profile(self, user_id: int, name: str, email: str) -> Optional[User]:
        """
        사용자 프로필 정보를 업데이트합니다.
        
        Args:
            user_id (int): 사용자 ID
            name (str): 새로운 이름
            email (str): 새로운 이메일
            
        Returns:
            Optional[User]: 업데이트된 사용자 객체 또는 None
        """
        try:
            user = self.user_repo.get_by_id(user_id)
            if not user:
                return None
            
            # 사용자 정보 업데이트
            setattr(user, 'name', name)
            setattr(user, 'email', email)
            setattr(user, 'updated_at', datetime.utcnow())
            
            self.db.commit()
            self.db.refresh(user)
            
            # 캐시 무효화
            self.cache.delete(f"user:{user_id}")
            self.cache.delete(f"user_email:{email}")
            
            structured_logger.info(f"사용자 프로필 업데이트 완료", user_id=user_id)
            return user
            
        except Exception as e:
            self.db.rollback()
            structured_logger.error(f"사용자 프로필 업데이트 실패", user_id=user_id, error=str(e))
            raise InternalServerError(f"프로필 업데이트 중 오류가 발생했습니다: {str(e)}")

    def change_user_password(self, user_id: int, new_password: str) -> bool:
        """
        사용자 비밀번호를 변경합니다.
        
        Args:
            user_id (int): 사용자 ID
            new_password (str): 새로운 비밀번호
            
        Returns:
            bool: 성공 여부
        """
        try:
            user = self.user_repo.get_by_id(user_id)
            if not user:
                return False
            
            # 새 비밀번호 해싱
            hashed_password = get_password_hash(new_password)
            setattr(user, 'password', hashed_password)
            setattr(user, 'updated_at', datetime.utcnow())
            
            self.db.commit()
            
            # 캐시 무효화
            self.cache.delete(f"user:{user_id}")
            
            structured_logger.info(f"사용자 비밀번호 변경 완료", user_id=user_id)
            return True
            
        except Exception as e:
            self.db.rollback()
            structured_logger.error(f"사용자 비밀번호 변경 실패", user_id=user_id, error=str(e))
            raise InternalServerError(f"비밀번호 변경 중 오류가 발생했습니다: {str(e)}")

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """
        평문 비밀번호와 해시된 비밀번호를 비교합니다.
        
        Args:
            plain_password (str): 평문 비밀번호
            hashed_password (str): 해시된 비밀번호
            
        Returns:
            bool: 비밀번호 일치 여부
        """
        return verify_password(plain_password, hashed_password)

    def get_user_team_memberships(self, user_id: int) -> List[Any]:
        """
        사용자가 속한 팀 멤버십을 조회합니다.
        
        Args:
            user_id (int): 사용자 ID
            
        Returns:
            List[Any]: 사용자가 속한 팀 목록
        """
        try:
            from models.team import TeamMember, Team
            from sqlalchemy.orm import joinedload
            
            # 사용자가 속한 팀 멤버십 조회
            team_memberships = self.db.query(TeamMember).filter(
                TeamMember.user_id == user_id
            ).all()
            
            if not team_memberships:
                return []
            
            # 팀 정보와 함께 조회
            team_ids = [tm.team_id for tm in team_memberships]
            teams = self.db.query(Team).filter(Team.id.in_(team_ids)).all()
            
            return teams
            
        except Exception as e:
            structured_logger.error(f"사용자 팀 멤버십 조회 실패", user_id=user_id, error=str(e))
            return [] 