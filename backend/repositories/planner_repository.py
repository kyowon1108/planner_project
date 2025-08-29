from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Dict, Any, Type
from models.planner import Planner
from models.user import User
from models.team import TeamMember
from repositories.base import BaseRepository

class PlannerRepository(BaseRepository[Planner]):
    """Planner 모델을 위한 Repository 클래스"""
    
    def __init__(self, db: Session):
        super().__init__(db)
    
    def get_model(self) -> Type[Planner]:
        """Planner 모델 클래스를 반환합니다."""
        return Planner
    

    
    def get_by_id(self, planner_id: int) -> Optional[Planner]:
        """ID로 플래너를 조회합니다."""
        return self.get(planner_id)
    

    

    
    def get_by_team(self, team_id: int) -> List[Planner]:
        """특정 팀의 플래너들을 조회합니다."""
        return self.db.query(Planner).filter(Planner.team_id == team_id).all()
    
    def get_by_user_teams(self, user_id: int) -> List[Planner]:
        """사용자가 속한 팀들의 플래너들을 조회합니다."""
        # 사용자가 속한 팀들 조회
        user_teams = self.db.query(TeamMember.team_id).filter(TeamMember.user_id == user_id).all()
        user_team_ids = [team.team_id for team in user_teams]
        
        # 해당 팀들의 플래너들 조회 (N+1 쿼리 방지)
        return self.db.query(Planner).options(
            joinedload(Planner.team)
        ).filter(Planner.team_id.in_(user_team_ids)).all()
    

    

    
    def get_with_team(self, planner_id: int) -> Optional[Planner]:
        """팀 정보와 함께 플래너를 조회합니다."""
        return self.db.query(Planner).options(
            joinedload(Planner.team)
        ).filter(Planner.id == planner_id).first()
    
    def get_by_status(self, status: str) -> List[Planner]:
        """상태별로 플래너를 조회합니다."""
        return self.db.query(Planner).filter(Planner.status == status).all() 