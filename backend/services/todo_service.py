from typing import List, Optional, Dict, Any, cast
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from repositories.todo_repository import TodoRepository
from repositories.planner_repository import PlannerRepository
from repositories.user_repository import UserRepository
from models.todo import Todo
from models.user import User
from models.planner import Planner
from models.team import TeamMember
from services.notification_service import NotificationService
from services.cache_service import cache_service
from core.permissions import get_user_role_in_team, Role
from datetime import date
import logging

logger = logging.getLogger(__name__)

class TodoService:
    """할일 관련 비즈니스 로직을 처리하는 서비스 클래스"""
    
    def __init__(self, db: Session):
        self.db = db
        self.todo_repo = TodoRepository(db)
        self.planner_repo = PlannerRepository(db)
        self.user_repo = UserRepository(db)
    
    def _validate_planner_access(self, planner_id: int, current_user: User) -> Planner:
        """플래너 접근 권한을 검증합니다."""
        planner = self.planner_repo.get_by_id(planner_id)
        if not planner:
            raise ValueError("플래너를 찾을 수 없습니다.")
        
        # 팀 멤버인지 확인
        team_member = self.db.query(TeamMember).filter(
            and_(
                TeamMember.user_id == current_user.id,
                TeamMember.team_id == planner.team_id
            )
        ).first()
        
        if not team_member:
            raise ValueError("해당 플래너에 접근할 권한이 없습니다.")
        
        return planner
    
    def _validate_todo_permissions(self, todo: Todo, current_user: User, action: str) -> bool:
        """할일 수정/삭제 권한을 검증합니다."""
        if not todo:
            raise ValueError("할일을 찾을 수 없습니다.")
        
        # 작성자인 경우 항상 허용
        todo_created_by = getattr(todo, 'created_by', None)
        current_user_id = getattr(current_user, 'id', None)
        
        if todo_created_by is not None and current_user_id is not None and todo_created_by == current_user_id:
            return True
        
        # 플래너를 통해 팀 권한 확인
        todo_planner_id = getattr(todo, 'planner_id', None)
        if todo_planner_id is None:
            raise ValueError("할일의 플래너 ID가 없습니다.")
            
        planner = self.planner_repo.get_by_id(int(todo_planner_id))
        if not planner:
            raise ValueError("플래너를 찾을 수 없습니다.")
        
        planner_team_id = getattr(planner, 'team_id', None)
        if planner_team_id is None:
            raise ValueError("플래너의 팀 ID가 없습니다.")
            
        user_role = get_user_role_in_team(self.db, int(current_user_id) if current_user_id is not None else 0, int(planner_team_id) if planner_team_id is not None else 0)
        
        # OWNER/ADMIN인 경우 허용
        if user_role in [Role.OWNER, Role.ADMIN]:
            return True
        
        # 담당자인 경우 수정만 허용
        if action == "update" and hasattr(todo, 'assignees') and todo.assignees and current_user in todo.assignees:
            return True
        
        raise ValueError(f"할일 {action} 권한이 없습니다.")
    
    def _process_assignees(self, assigned_user_ids: List[int], planner: Planner) -> List[User]:
        """담당자 할당을 처리합니다."""
        assigned_users = []
        
        if not assigned_user_ids:
            return assigned_users
        
        # 중복 제거
        unique_user_ids = list(set(assigned_user_ids))
        
        for user_id in unique_user_ids:
            user = self.user_repo.get_by_id(user_id)
            if not user:
                logger.warning(f"사용자 ID {user_id}를 찾을 수 없습니다.")
                continue
            
            # 팀 멤버인지 확인
            team_member = self.db.query(TeamMember).filter(
                and_(
                    TeamMember.user_id == user_id,
                    TeamMember.team_id == planner.team_id
                )
            ).first()
            
            if not team_member:
                logger.warning(f"사용자 {user.name}은 팀 멤버가 아닙니다.")
                continue
            
            assigned_users.append(user)
        
        return assigned_users
    
    def create_todo(self, todo_data: Dict[str, Any], current_user: User) -> Todo:
        """새로운 할일을 생성합니다."""
        try:
            # 필수 필드 검증
            if not todo_data.get('title'):
                raise ValueError("할일 제목이 필요합니다.")
            
            planner_id = todo_data.get('planner_id')
            if planner_id is None:
                raise ValueError("플래너 ID가 필요합니다.")
            
            planner = self._validate_planner_access(planner_id, current_user)
            
            # due_date를 date 객체로 변환
            if 'due_date' in todo_data and todo_data['due_date']:
                if isinstance(todo_data['due_date'], str):
                    from datetime import datetime
                    todo_data['due_date'] = datetime.strptime(todo_data['due_date'], '%Y-%m-%d').date()
            
            # created_by 필드 추가
            todo_data['created_by'] = current_user.id
            
            # assigned_to 필드 처리 (담당자 할당)
            assigned_user_ids = todo_data.pop('assigned_to', []) if 'assigned_to' in todo_data else []
            
            # 할일 생성
            todo = self.todo_repo.create(todo_data)
            
            # 담당자 할당
            if assigned_user_ids:
                assigned_users = self._process_assignees(assigned_user_ids, planner)
                todo.assignees = assigned_users
            
            self.db.commit()
            
            # 관련 캐시 무효화
            cache_service.delete(f"todos_planner_{planner_id}")
            
            logger.info(f"할일 '{todo.title}' 생성 완료 (생성자: {current_user.name})")
            return todo
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"할일 생성 실패: {e}")
            raise
    
    def get_todos_by_assignee(self, user_id: int) -> List[Todo]:
        """사용자가 담당자인 할일들을 조회합니다."""
        try:
            todos = self.todo_repo.get_by_assignee(user_id)
            logger.info(f"사용자 {user_id}의 담당 할일 {len(todos)}개 조회")
            return todos
        except Exception as e:
            logger.error(f"담당 할일 조회 실패: {e}")
            raise
    
    def get_todos_by_planner(self, planner_id: int, current_user: User) -> List[Todo]:
        """특정 플래너의 할일들을 조회합니다."""
        try:
            # 캐시 키 생성
            cache_key = f"todos_planner_{planner_id}"
            
            # 캐시에서 먼저 확인
            cached_todos = cache_service.get(cache_key)
            if cached_todos:
                logger.info(f"캐시에서 플래너 {planner_id}의 할일 조회")
                return cached_todos
            
            # 플래너 접근 권한 검증
            self._validate_planner_access(planner_id, current_user)
            
            todos = self.todo_repo.get_by_planner(planner_id)
            
            # 캐시에 저장 (5분 TTL)
            cache_service.set(cache_key, todos, ttl=300)
            
            logger.info(f"플래너 {planner_id}의 할일 {len(todos)}개 조회")
            return todos
        except Exception as e:
            logger.error(f"플래너 할일 조회 실패: {e}")
            raise
    
    def get_todos_by_user_teams(self, user_id: int) -> List[Todo]:
        """사용자가 속한 팀들의 할일들을 조회합니다."""
        try:
            todos = self.todo_repo.get_by_user_teams(user_id)
            logger.info(f"사용자 {user_id}의 팀 할일 {len(todos)}개 조회")
            return todos
        except Exception as e:
            logger.error(f"팀 할일 조회 실패: {e}")
            raise
    
    def update_todo(self, todo_id: int, todo_data: Dict[str, Any], current_user: User) -> Optional[Todo]:
        """할일을 업데이트합니다."""
        try:
            todo = self.todo_repo.get_by_id(todo_id)
            
            # 권한 검증
            self._validate_todo_permissions(todo, current_user, "update")
            
            # 담당자 변경이 있는 경우 검증
            if 'assigned_to' in todo_data:
                todo_planner_id = getattr(todo, 'planner_id', None)
                if todo_planner_id is None:
                    raise ValueError("할일의 플래너 ID가 없습니다.")
                    
                planner = self.planner_repo.get_by_id(int(todo_planner_id))
                assigned_users = self._process_assignees(todo_data['assigned_to'], planner)
                # 실제 할당할 사용자 ID 목록으로 업데이트
                todo_data['assigned_to'] = [getattr(user, 'id', None) for user in assigned_users if getattr(user, 'id', None) is not None]
            
            updated_todo = self.todo_repo.update(todo_id, todo_data)
            logger.info(f"할일 {todo_id} 업데이트 완료 (수정자: {current_user.name})")
            return updated_todo
            
        except Exception as e:
            logger.error(f"할일 업데이트 실패: {e}")
            raise
    
    def delete_todo(self, todo_id: int, current_user: User) -> bool:
        """할일을 삭제합니다."""
        try:
            todo = self.todo_repo.get_by_id(todo_id)
            
            # 권한 검증
            self._validate_todo_permissions(todo, current_user, "delete")
            
            result = self.todo_repo.delete(todo_id)
            if result:
                logger.info(f"할일 {todo_id} 삭제 완료 (삭제자: {current_user.name})")
            return result
            
        except Exception as e:
            logger.error(f"할일 삭제 실패: {e}")
            raise
    
    def toggle_todo_completion(self, todo_id: int, current_user: User) -> Dict[str, str]:
        """할일 완료 상태를 토글합니다."""
        try:
            todo = self.todo_repo.get_by_id(todo_id)
            
            # 권한 검증 (담당자 또는 작성자만 토글 가능)
            self._validate_todo_permissions(todo, current_user, "update")
            
            # 완료 상태 토글
            current_status = bool(getattr(todo, 'is_completed', False))
            new_status = not current_status
            
            update_data = {
                'is_completed': new_status,
                'status': '완료' if new_status else '진행중'
            }
            
            self.todo_repo.update(todo_id, update_data)
            
            status_text = '완료' if new_status else '미완료'
            logger.info(f"할일 {todo_id} 상태 변경: {status_text} (변경자: {current_user.name})")
            
            return {
                "message": f"할일이 {status_text} 상태로 변경되었습니다."
            }
            
        except Exception as e:
            logger.error(f"할일 상태 토글 실패: {e}")
            raise

    def update_todo_status(self, todo_id: int, status: str, current_user: User) -> Todo:
        """할일 상태를 업데이트합니다."""
        try:
            todo = self.todo_repo.get_by_id(todo_id)
            if not todo:
                raise ValueError("할일을 찾을 수 없습니다.")
            
            # 권한 검증
            self._validate_todo_permissions(todo, current_user, "update")
            
            # 상태 업데이트
            valid_statuses = ["대기중", "진행중", "완료", "취소"]
            if status not in valid_statuses:
                raise ValueError(f"유효하지 않은 상태입니다. 가능한 상태: {', '.join(valid_statuses)}")
            
            update_data = {'status': status}
            updated_todo = self.todo_repo.update(todo_id, update_data)
            
            logger.info(f"할일 {todo_id} 상태 업데이트 완료: {status} (사용자: {current_user.name})")
            
            return updated_todo
            
        except Exception as e:
            logger.error(f"할일 상태 업데이트 실패: {e}")
            raise 