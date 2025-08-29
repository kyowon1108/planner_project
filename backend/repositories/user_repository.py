from typing import List, Optional, Dict, Any, Type
from sqlalchemy.orm import Session
from models.user import User
from models.team import TeamMember
from repositories.base import BaseRepository

class UserRepository(BaseRepository[User]):
    """User 모델을 위한 Repository 클래스"""
    
    def __init__(self, db: Session):
        super().__init__(db)
    
    def get_model(self) -> Type[User]:
        """User 모델 클래스를 반환합니다."""
        return User
    
    def get_by_id(self, user_id: int) -> Optional[User]:
        """ID로 사용자를 조회합니다."""
        return self.get(user_id)
    
    def get_by_email(self, email: str) -> Optional[User]:
        """이메일로 사용자를 조회합니다."""
        return self.db.query(User).filter(User.email == email).first()
    
    def get_by_team(self, team_id: int) -> List[User]:
        """특정 팀의 멤버들을 조회합니다."""
        return self.db.query(User).join(TeamMember).filter(TeamMember.team_id == team_id).all()
    
    def get_team_members(self, team_id: int) -> List[User]:
        """팀 멤버 정보와 함께 사용자들을 조회합니다."""
        return self.db.query(User).join(TeamMember).filter(TeamMember.team_id == team_id).all()
    
    def verify_email(self, user_id: int) -> bool:
        """사용자의 이메일을 인증합니다."""
        user = self.get_by_id(user_id)
        if user:
            setattr(user, 'is_email_verified', True)
            self.db.commit()
            return True
        return False 