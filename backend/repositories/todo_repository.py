from typing import List, Optional, Dict, Any, Type
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, asc
from models.todo import Todo
from models.user import User
from models.planner import Planner
from models.team import TeamMember
from repositories.base import BaseRepository
import logging
from datetime import date, datetime, timedelta

logger = logging.getLogger(__name__)

class TodoRepository(BaseRepository[Todo]):
    """Todo 모델을 위한 Repository 클래스"""
    
    def __init__(self, db: Session):
        super().__init__(db)
    
    def get_model(self) -> Type[Todo]:
        """Todo 모델 클래스를 반환합니다."""
        return Todo
    

    
    def get_by_id(self, todo_id: int) -> Optional[Todo]:
        """ID로 할일을 조회합니다."""
        return self.get(todo_id)
    

    
    def get_all(self) -> List[Todo]:
        """모든 할일을 조회합니다."""
        return self.db.query(Todo).all()
    
    def get_by_planner(self, planner_id: int) -> List[Todo]:
        """특정 플래너의 할일들을 조회합니다."""
        return self.db.query(Todo).filter(Todo.planner_id == planner_id).all()
    

    
    def get_by_assignee(self, user_id: int) -> List[Todo]:
        """특정 사용자가 담당자인 할일들을 조회합니다."""
        return self.db.query(Todo).options(
            joinedload(Todo.assignees),
            joinedload(Todo.planner)
        ).join(Todo.assignees).filter(User.id == user_id).all()
    

    
    def get_by_creator(self, user_id: int) -> List[Todo]:
        """특정 사용자가 생성한 할일들을 조회합니다."""
        return self.db.query(Todo).filter(Todo.created_by == user_id).all()
    
    def get_by_team(self, team_id: int) -> List[Todo]:
        """특정 팀의 할일들을 조회합니다."""
        return self.db.query(Todo).options(
            joinedload(Todo.assignees),
            joinedload(Todo.planner)
        ).join(Planner).filter(Planner.team_id == team_id).all()
    

    
    def get_by_user_teams(self, user_id: int) -> List[Todo]:
        """사용자가 속한 팀들의 할일들을 조회합니다."""
        # 사용자가 속한 팀들의 플래너들 조회
        user_teams = self.db.query(TeamMember.team_id).filter(TeamMember.user_id == user_id).all()
        user_team_ids = [team.team_id for team in user_teams]
        
        # 해당 팀들의 플래너들 조회
        user_planners = self.db.query(Planner).filter(Planner.team_id.in_(user_team_ids)).all()
        user_planner_ids = [planner.id for planner in user_planners]
        
        # 해당 플래너들의 할일들 조회 (N+1 쿼리 방지)
        return self.db.query(Todo).options(
            joinedload(Todo.assignees),
            joinedload(Todo.planner)
        ).filter(Todo.planner_id.in_(user_planner_ids)).all()
    

    
    def get_by_status(self, status: str) -> List[Todo]:
        """상태별로 할일들을 조회합니다."""
        return self.db.query(Todo).filter(Todo.status == status).all()
    
    def get_by_priority(self, priority: str) -> List[Todo]:
        """우선순위별로 할일들을 조회합니다."""
        return self.db.query(Todo).filter(Todo.priority == priority).all()
    
    def get_overdue_todos(self) -> List[Todo]:
        """마감일이 지난 할일들을 조회합니다."""
        today = date.today()
        return self.db.query(Todo).filter(
            Todo.due_date < today,
            Todo.is_completed == False
        ).all()
    
    def get_upcoming_todos(self, days: int = 7) -> List[Todo]:
        """앞으로 N일 내 마감인 할일들을 조회합니다."""
        today = date.today()
        end_date = today + timedelta(days=days)
        return self.db.query(Todo).filter(
            Todo.due_date >= today,
            Todo.due_date <= end_date,
            Todo.is_completed == False
        ).all()
    
    def search_todos(self, user_id: Optional[int] = None, search_term: Optional[str] = None) -> List[Todo]:
        """할일을 검색합니다."""
        query = self.db.query(Todo)
        
        if user_id is not None:
            query = query.join(Todo.assignees).filter(User.id == user_id)
        
        if search_term:
            query = query.filter(
                Todo.title.ilike(f"%{search_term}%") | 
                Todo.description.ilike(f"%{search_term}%")
            )
        
        return query.all()
    
    def update(self, todo_id: int, todo_data: Dict[str, Any]) -> Optional[Todo]:
        """할일을 업데이트합니다."""
        try:
            todo = self.get_by_id(todo_id)
            if todo:
                for field, value in todo_data.items():
                    if hasattr(todo, field):
                        setattr(todo, field, value)
                self.db.commit()
                self.db.refresh(todo)
                logger.info(f"할일 {todo_id} 업데이트 완료")
            return todo
        except Exception as e:
            self.db.rollback()
            logger.error(f"할일 업데이트 실패: {e}")
            raise
    
    def delete(self, todo_id: int) -> bool:
        """할일을 삭제합니다."""
        try:
            todo = self.get_by_id(todo_id)
            if todo:
                self.db.delete(todo)
                self.db.commit()
                logger.info(f"할일 {todo_id} 삭제 완료")
                return True
            return False
        except Exception as e:
            self.db.rollback()
            logger.error(f"할일 삭제 실패: {e}")
            raise
    
    def exists(self, todo_id: int) -> bool:
        """할일이 존재하는지 확인합니다."""
        return self.db.query(Todo).filter(Todo.id == todo_id).first() is not None
    
    def count(self) -> int:
        """할일의 총 개수를 반환합니다."""
        return self.db.query(Todo).count()
    
    def count_by_status(self, status: str) -> int:
        """상태별 할일 개수를 반환합니다."""
        return self.db.query(Todo).filter(Todo.status == status).count()
    
    def count_by_planner(self, planner_id: int) -> int:
        """플래너별 할일 개수를 반환합니다."""
        return self.db.query(Todo).filter(Todo.planner_id == planner_id).count()
    
    def get_with_assignees(self, todo_id: int) -> Optional[Todo]:
        """담당자 정보와 함께 할일을 조회합니다."""
        return self.db.query(Todo).join(Todo.assignees).filter(Todo.id == todo_id).first()
    
    def get_with_planner_and_team(self, todo_id: int) -> Optional[Todo]:
        """플래너와 팀 정보와 함께 할일을 조회합니다."""
        return self.db.query(Todo).join(Planner).filter(Todo.id == todo_id).first()
    
    def get_todos_with_pagination(self, page: int = 1, per_page: int = 20, 
                                 sort_by: str = 'created_at', sort_order: str = 'desc') -> Dict[str, Any]:
        """페이지네이션과 정렬을 적용하여 할일들을 조회합니다."""
        query = self.db.query(Todo)
        
        # 정렬
        if sort_order == 'desc':
            query = query.order_by(desc(getattr(Todo, sort_by)))
        else:
            query = query.order_by(asc(getattr(Todo, sort_by)))
        
        # 전체 개수 (최적화된 카운트 쿼리)
        total = query.count()
        
        # 페이지네이션 (N+1 쿼리 방지)
        offset = (page - 1) * per_page
        todos = query.options(
            joinedload(Todo.assignees),
            joinedload(Todo.planner)
        ).offset(offset).limit(per_page).all()
        
        return {
            'todos': todos,
            'total': total,
            'page': page,
            'per_page': per_page,
            'pages': (total + per_page - 1) // per_page
        } 

    def toggle_completion(self, todo_id: int) -> Optional[Todo]:
        """할일 완료 상태를 토글합니다."""
        todo = self.get_by_id(todo_id)
        if todo:
            current_status = getattr(todo, 'is_completed', False)
            setattr(todo, 'is_completed', not current_status)
            self.db.commit()
            self.db.refresh(todo)
        return todo 