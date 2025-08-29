from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from repositories.team_repository import TeamRepository
from repositories.user_repository import UserRepository
from models.team import Team, TeamMember
from models.user import User
from datetime import datetime

class TeamService:
    """팀 관련 비즈니스 로직을 처리하는 서비스 클래스"""
    
    def __init__(self, db: Session):
        self.db = db
        self.team_repo = TeamRepository(db)
        self.user_repo = UserRepository(db)
    
    def create_team(self, team_data: Dict[str, Any], current_user: User) -> Team:
        """새로운 팀을 생성합니다."""
        # 팀 생성
        team = self.team_repo.create(team_data)
        
        # 생성자를 팀 멤버로 추가 (OWNER 역할)
        team_id = getattr(team, 'id', None)
        user_id = getattr(current_user, 'id', None)
        if team_id is not None and user_id is not None:
            self.team_repo.add_member(int(team_id), int(user_id), "owner")
        
        return team
    
    def get_team_by_id(self, team_id: int, current_user: Optional[User] = None) -> Optional[Team]:
        """ID로 팀을 조회합니다."""
        team = self.team_repo.get_by_id(team_id)
        if not team:
            raise ValueError("팀을 찾을 수 없습니다.")
        
        # current_user가 제공된 경우 권한 확인
        if current_user:
            user_id = getattr(current_user, 'id', None)
            if user_id is not None:
                team_member = self.team_repo.get_member(team_id, int(user_id))
                if not team_member:
                    raise ValueError("팀 멤버가 아닙니다.")
        
        return team
    
    def get_all_teams(self) -> List[Team]:
        """모든 팀을 조회합니다."""
        return self.team_repo.get_all()
    
    def get_teams_by_user(self, user_id: int) -> List[Team]:
        """사용자가 속한 팀들을 조회합니다."""
        return self.team_repo.get_by_user(user_id)
    
    def update_team(self, team_id: int, team_data: Dict[str, Any], current_user: User) -> Optional[Team]:
        """팀을 업데이트합니다."""
        team = self.team_repo.get_by_id(team_id)
        if not team:
            raise ValueError("팀을 찾을 수 없습니다.")
        
        # 팀 멤버인지 확인
        user_id = getattr(current_user, 'id', None)
        if user_id is None:
            raise ValueError("사용자 ID가 없습니다.")
        
        team_member = self.team_repo.get_member(team_id, int(user_id))
        if not team_member:
            raise ValueError("권한이 없습니다.")
        
        # OWNER/ADMIN만 수정 가능
        member_role = getattr(team_member, 'role', None)
        if member_role not in ['owner', 'admin']:
            raise ValueError("팀 수정 권한이 없습니다.")
        
        return self.team_repo.update(team_id, team_data)
    
    def delete_team(self, team_id: int, current_user: User) -> bool:
        """팀을 삭제합니다."""
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"팀 삭제 시작: team_id={team_id}, user_id={current_user.id}")
        
        team = self.team_repo.get_by_id(team_id)
        if not team:
            logger.error(f"팀을 찾을 수 없음: team_id={team_id}")
            raise ValueError("팀을 찾을 수 없습니다.")
        
        # 팀 멤버인지 확인
        user_id = getattr(current_user, 'id', None)
        if user_id is None:
            logger.error(f"사용자 ID가 없음: current_user={current_user}")
            raise ValueError("사용자 ID가 없습니다.")
        
        team_member = self.team_repo.get_member(team_id, int(user_id))
        if not team_member:
            logger.error(f"팀 멤버가 아님: team_id={team_id}, user_id={user_id}")
            raise ValueError("권한이 없습니다.")
        
        # OWNER만 삭제 가능
        member_role = getattr(team_member, 'role', None)
        if member_role != 'owner':
            logger.error(f"팀 삭제 권한 없음: team_id={team_id}, user_id={user_id}, role={member_role}")
            raise ValueError("팀 삭제 권한이 없습니다.")
        
        logger.info(f"팀 삭제 권한 확인 완료: team_id={team_id}, user_id={user_id}, role={member_role}")
        
        try:
            result = self.team_repo.delete(team_id)
            logger.info(f"팀 삭제 결과: team_id={team_id}, success={result}")
            return result
        except Exception as e:
            logger.error(f"팀 삭제 중 오류: team_id={team_id}, error={str(e)}")
            raise
    
    def add_member(self, team_id: int, member_data: Dict[str, Any], current_user: User) -> TeamMember:
        """팀에 멤버를 추가합니다."""
        team = self.team_repo.get_by_id(team_id)
        if not team:
            raise ValueError("팀을 찾을 수 없습니다.")
        
        # 팀 멤버인지 확인
        current_user_id = getattr(current_user, 'id', None)
        if current_user_id is None:
            raise ValueError("사용자 ID가 없습니다.")
        
        team_member = self.team_repo.get_member(team_id, int(current_user_id))
        if not team_member:
            raise ValueError("권한이 없습니다.")
        
        # OWNER/ADMIN만 멤버 추가 가능
        member_role = getattr(team_member, 'role', None)
        if member_role not in ['owner', 'admin']:
            raise ValueError("멤버 추가 권한이 없습니다.")
        
        user_id = member_data.get('user_id')
        if user_id is None:
            raise ValueError("사용자 ID가 필요합니다.")
        
        role = member_data.get('role', 'editor')
        
        # 사용자가 존재하는지 확인
        user = self.user_repo.get_by_id(int(user_id))
        if not user:
            raise ValueError("사용자를 찾을 수 없습니다.")
        
        # 이미 멤버인지 확인
        existing_member = self.team_repo.get_member(team_id, int(user_id))
        if existing_member:
            raise ValueError("이미 팀 멤버입니다.")
        
        return self.team_repo.add_member(team_id, int(user_id), role)
    
    def remove_member(self, team_id: int, user_id: int, current_user: User) -> bool:
        """팀에서 멤버를 제거합니다."""
        team = self.team_repo.get_by_id(team_id)
        if not team:
            raise ValueError("팀을 찾을 수 없습니다.")
        
        # 팀 멤버인지 확인
        current_user_id = getattr(current_user, 'id', None)
        if current_user_id is None:
            raise ValueError("사용자 ID가 없습니다.")
        
        team_member = self.team_repo.get_member(team_id, int(current_user_id))
        if not team_member:
            raise ValueError("권한이 없습니다.")
        
        # 제거할 멤버 확인
        member_to_remove = self.team_repo.get_member(team_id, user_id)
        if not member_to_remove:
            raise ValueError("제거할 멤버를 찾을 수 없습니다.")
        
        # 권한 확인 (자신보다 높은 역할의 멤버는 제거 불가)
        from core.permissions import can_remove_member, Role
        current_role = Role(getattr(team_member, 'role', 'editor'))
        target_role = Role(getattr(member_to_remove, 'role', 'editor'))
        
        if not can_remove_member(current_user_id, user_id, current_role, target_role):
            raise ValueError("해당 멤버를 제거할 권한이 없습니다.")
        
        # 멤버 제거 전에 해당 팀의 할일에서 담당자 제거
        self._remove_user_from_team_todos(team_id, user_id)
        
        return self.team_repo.remove_member(team_id, user_id)
    
    def update_member_role(self, team_id: int, user_id: int, new_role: str, current_user: User) -> bool:
        """팀 멤버의 역할을 업데이트합니다."""
        team = self.team_repo.get_by_id(team_id)
        if not team:
            raise ValueError("팀을 찾을 수 없습니다.")
        
        # 팀 멤버인지 확인
        current_user_id = getattr(current_user, 'id', None)
        if current_user_id is None:
            raise ValueError("사용자 ID가 없습니다.")
        
        team_member = self.team_repo.get_member(team_id, int(current_user_id))
        if not team_member:
            raise ValueError("권한이 없습니다.")
        
        # 변경할 멤버 확인
        target_member = self.team_repo.get_member(team_id, user_id)
        if not target_member:
            raise ValueError("변경할 멤버를 찾을 수 없습니다.")
        
        # 자기 자신의 역할 변경 방지
        if user_id == current_user_id:
            raise ValueError("자기 자신의 역할을 변경할 수 없습니다.")
        
        # 소유자 역할 변경 방지
        if getattr(target_member, 'role', '') == "owner":
            raise ValueError("소유자의 역할을 변경할 수 없습니다.")
        
        # 역할 우선순위 확인
        role_priorities = {
            "owner": 6, "admin": 5, "manager": 4, 
            "editor": 3, "viewer": 2, "guest": 1
        }
        
        current_role_priority = role_priorities.get(getattr(team_member, 'role', 'editor'), 0)
        new_role_priority = role_priorities.get(new_role, 0)
        
        if new_role_priority >= current_role_priority:
            raise ValueError("자신보다 높거나 같은 역할로 변경할 수 없습니다.")
        
        return self.team_repo.update_member_role(team_id, user_id, new_role)
    
    def get_team_members(self, team_id: int, current_user: Optional[User] = None) -> Optional[List[TeamMember]]:
        """팀 멤버 목록을 조회합니다."""
        team = self.team_repo.get_by_id(team_id)
        if not team:
            return None

        # current_user가 제공된 경우 권한 확인
        if current_user:
            user_id = getattr(current_user, 'id', None)
            if user_id is not None:
                team_member = self.team_repo.get_member(team_id, int(user_id))
                if not team_member:
                    raise ValueError("팀 멤버가 아닙니다.")

        members = self.team_repo.get_members(team_id)
        for member in members:
            user_id = int(getattr(member, 'user_id'))
            user = self.user_repo.get_by_id(user_id)
            member.user_name = user.name if user else None
            member.user_email = user.email if user else None
        return members
    
    def leave_team(self, team_id: int, current_user: User) -> bool:
        """팀에서 탈퇴합니다."""
        team = self.team_repo.get_by_id(team_id)
        if not team:
            raise ValueError("팀을 찾을 수 없습니다.")
        
        user_id = getattr(current_user, 'id', None)
        if user_id is None:
            raise ValueError("사용자 ID가 없습니다.")
        
        team_member = self.team_repo.get_member(team_id, int(user_id))
        if not team_member:
            raise ValueError("팀 멤버가 아닙니다.")
        
        # 소유자는 탈퇴할 수 없음
        if getattr(team_member, 'role', '') == "owner":
            raise ValueError("소유자는 팀에서 탈퇴할 수 없습니다. 먼저 다른 멤버에게 소유자 권한을 이전하세요.")
        
        # 팀 탈퇴 전에 해당 팀의 할일에서 담당자 제거
        self._remove_user_from_team_todos(team_id, user_id)
        
        return self.team_repo.remove_member(team_id, user_id)
    
    def _remove_user_from_team_todos(self, team_id: int, user_id: int):
        """팀의 할일에서 사용자를 담당자로부터 제거합니다."""
        try:
            from models.todo import Todo, todo_assignments
            from models.planner import Planner
            
            # 팀의 플래너들 조회
            planners = self.db.query(Planner).filter(Planner.team_id == team_id).all()
            planner_ids = [p.id for p in planners]
            
            if planner_ids:
                # 해당 플래너들의 할일에서 사용자를 담당자로부터 제거
                from sqlalchemy import delete
                stmt = delete(todo_assignments).where(
                    todo_assignments.c.todo_id.in_(
                        self.db.query(Todo.id).filter(Todo.planner_id.in_(planner_ids))
                    ),
                    todo_assignments.c.user_id == user_id
                )
                self.db.execute(stmt)
                self.db.commit()
                
        except Exception as e:
            self.db.rollback()
            # 로깅만 하고 예외는 발생시키지 않음 (팀 탈퇴는 계속 진행)
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"팀 할일에서 사용자 제거 실패: team_id={team_id}, user_id={user_id}, error={str(e)}")
    
    def transfer_ownership(self, team_id: int, new_owner_id: int, current_user: User) -> bool:
        """팀 소유권을 이전합니다."""
        team = self.team_repo.get_by_id(team_id)
        if not team:
            raise ValueError("팀을 찾을 수 없습니다.")
        
        current_user_id = getattr(current_user, 'id', None)
        if current_user_id is None:
            raise ValueError("사용자 ID가 없습니다.")
        
        # 현재 사용자가 소유자인지 확인
        current_member = self.team_repo.get_member(team_id, int(current_user_id))
        if not current_member or getattr(current_member, 'role', '') != "owner":
            raise ValueError("소유자만 권한을 이전할 수 있습니다.")
        
        # 새로운 소유자 확인
        new_owner = self.team_repo.get_member(team_id, new_owner_id)
        if not new_owner:
            raise ValueError("새로운 소유자를 찾을 수 없습니다.")
        
        # 자신에게 이전할 수 없음
        if current_user_id == new_owner_id:
            raise ValueError("자신에게 권한을 이전할 수 없습니다.")
        
        # 권한 이전
        self.team_repo.update_member_role(team_id, new_owner_id, "owner")
        self.team_repo.update_member_role(team_id, int(current_user_id), "editor")
        
        return True
    
    def get_team_with_members(self, team_id: int) -> Optional[Team]:
        """멤버 정보와 함께 팀을 조회합니다."""
        return self.team_repo.get_with_members(team_id) 