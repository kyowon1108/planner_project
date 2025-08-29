from typing import List, Optional
from sqlalchemy.orm import Session
from repositories.base import BaseRepository
from models.invite import Invite

class InviteRepository(BaseRepository[Invite]):
    """초대 관련 데이터 접근을 처리하는 Repository"""
    
    def __init__(self, db: Session):
        super().__init__(db)
    
    def get_model(self):
        return Invite
    
    def get_by_team(self, team_id: int) -> List[Invite]:
        """팀별 초대를 조회합니다."""
        return self.db.query(Invite).filter(Invite.team_id == team_id).all()
    
    def get_by_user(self, user_id: int) -> List[Invite]:
        """사용자별 초대를 조회합니다."""
        return self.db.query(Invite).filter(Invite.user_id == user_id).all()
    
    def get_by_team_and_user(self, team_id: int, user_id: int) -> Optional[Invite]:
        """팀과 사용자로 초대를 조회합니다."""
        return self.db.query(Invite).filter(
            Invite.team_id == team_id,
            Invite.user_id == user_id
        ).first()
    
    def get_pending_invites(self, user_id: int) -> List[Invite]:
        """사용자의 대기 중인 초대를 조회합니다."""
        return self.db.query(Invite).filter(
            Invite.user_id == user_id,
            Invite.status == "pending"
        ).all()
    
    def get_by_status(self, status: str) -> List[Invite]:
        """상태별 초대를 조회합니다."""
        return self.db.query(Invite).filter(Invite.status == status).all() 