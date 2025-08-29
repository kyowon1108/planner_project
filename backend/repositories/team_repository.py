from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any, Type
from models.team import Team, TeamMember
from models.user import User
from repositories.base import BaseRepository

class TeamRepository(BaseRepository[Team]):
    """Team 모델을 위한 Repository 클래스"""
    
    def __init__(self, db: Session):
        super().__init__(db)
    
    def get_model(self) -> Type[Team]:
        """Team 모델 클래스를 반환합니다."""
        return Team
    
    def get_by_id(self, team_id: int) -> Optional[Team]:
        """ID로 팀을 조회합니다."""
        return self.get(team_id)
    
    def get_with_members(self, team_id: int) -> Optional[Team]:
        """멤버 정보와 함께 팀을 조회합니다."""
        return self.db.query(Team).filter(Team.id == team_id).first()
    
    def get_by_user(self, user_id: int) -> List[Team]:
        """사용자가 속한 팀들을 조회합니다."""
        return self.db.query(Team).join(TeamMember).filter(TeamMember.user_id == user_id).all()
    
    def add_member(self, team_id: int, user_id: int, role: str = "editor") -> TeamMember:
        """팀에 멤버를 추가합니다."""
        member = TeamMember(
            team_id=team_id,
            user_id=user_id,
            role=role
        )
        self.db.add(member)
        self.db.commit()
        self.db.refresh(member)
        return member
    
    def remove_member(self, team_id: int, user_id: int) -> bool:
        """팀에서 멤버를 제거합니다."""
        member = self.db.query(TeamMember).filter(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id
        ).first()
        if member:
            self.db.delete(member)
            self.db.commit()
            return True
        return False
    
    def update_member_role(self, team_id: int, user_id: int, new_role: str) -> bool:
        """팀 멤버의 역할을 업데이트합니다."""
        member = self.db.query(TeamMember).filter(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id
        ).first()
        if member:
            setattr(member, 'role', new_role)
            self.db.commit()
            return True
        return False
    
    def get_members(self, team_id: int) -> List[TeamMember]:
        """팀의 멤버들을 조회합니다."""
        return self.db.query(TeamMember).filter(TeamMember.team_id == team_id).all()
    
    def get_member(self, team_id: int, user_id: int) -> Optional[TeamMember]:
        """특정 팀의 특정 멤버를 조회합니다."""
        return self.db.query(TeamMember).filter(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id
        ).first()
    
    def delete_team_members(self, team_id: int) -> bool:
        """팀의 모든 멤버를 삭제합니다."""
        try:
            members = self.db.query(TeamMember).filter(TeamMember.team_id == team_id).all()
            for member in members:
                self.db.delete(member)
            self.db.commit()
            return True
        except Exception as e:
            self.db.rollback()
            return False
    
    def delete(self, team_id: int) -> bool:
        """팀을 삭제합니다. 먼저 팀 멤버들을 삭제한 후 팀을 삭제합니다."""
        try:
            # 먼저 팀 멤버들을 삭제
            self.delete_team_members(team_id)
            
            # 그 다음 팀을 삭제
            team = self.get_by_id(team_id)
            if team:
                self.db.delete(team)
                self.db.commit()
                return True
            return False
        except Exception as e:
            self.db.rollback()
            return False 