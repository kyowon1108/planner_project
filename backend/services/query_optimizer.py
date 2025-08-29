"""
쿼리 최적화 서비스
데이터베이스 쿼리 성능을 최적화하는 유틸리티 함수들을 제공합니다.
"""

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, asc, func
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timedelta
import logging
from collections import defaultdict
from models.user import User
from models.team import Team, TeamMember
from models.planner import Planner
from models.todo import Todo
from models.post import Post
from models.notification import Notification
from models.activity import Activity
from core.logging_config import get_logger
from services.time_service import TimeService

logger = get_logger(__name__)

class QueryOptimizer:
    """쿼리 최적화 클래스"""
    
    @staticmethod
    def get_user_with_teams(db: Session, user_id: int) -> Optional[User]:
        """사용자와 팀 정보를 함께 조회 (N+1 문제 해결)"""
        return db.query(User).options(
            joinedload(User.teams).joinedload(TeamMember.team)
        ).filter(User.id == user_id).first()
    
    @staticmethod
    def get_team_with_members(db: Session, team_id: int) -> Optional[Team]:
        """팀과 멤버 정보를 함께 조회"""
        return db.query(Team).options(
            joinedload(Team.members).joinedload(TeamMember.user)
        ).filter(Team.id == team_id).first()
    
    @staticmethod
    def get_planner_with_todos(db: Session, planner_id: int) -> Optional[Planner]:
        """플래너와 할일 정보를 함께 조회"""
        return db.query(Planner).options(
            joinedload(Planner.todos).joinedload(Todo.assignees),
            joinedload(Planner.creator)
        ).filter(Planner.id == planner_id).first()
    
    @staticmethod
    def get_user_todos_optimized(db: Session, user_id: int, limit: int = 50) -> List[Todo]:
        """사용자의 할일을 최적화된 쿼리로 조회"""
        return db.query(Todo).options(
            joinedload(Todo.planner),
            joinedload(Todo.creator),
            joinedload(Todo.assignees)
        ).filter(
            or_(
                Todo.created_by == user_id,
                Todo.assignees.any(user_id=user_id)
            )
        ).order_by(Todo.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def get_team_posts_optimized(db: Session, team_id: int, limit: int = 20) -> List[Post]:
        """팀의 게시글을 최적화된 쿼리로 조회"""
        return db.query(Post).options(
            joinedload(Post.author),
            joinedload(Post.likes)
        ).filter(Post.team_id == team_id).order_by(
            Post.created_at.desc()
        ).limit(limit).all()
    
    @staticmethod
    def get_user_notifications_optimized(db: Session, user_id: int, limit: int = 20) -> List[Notification]:
        """사용자의 알림을 최적화된 쿼리로 조회"""
        return db.query(Notification).filter(
            Notification.user_id == user_id
        ).order_by(Notification.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def get_user_activities_optimized(db: Session, user_id: int, limit: int = 50) -> List[Activity]:
        """사용자의 활동을 최적화된 쿼리로 조회"""
        return db.query(Activity).filter(
            Activity.user_id == user_id
        ).order_by(Activity.created_at.desc()).limit(limit).all()
    
    @staticmethod
    def get_todos_by_status(db: Session, planner_id: int, status: str) -> List[Todo]:
        """상태별 할일 조회 (인덱스 활용)"""
        return db.query(Todo).options(
            joinedload(Todo.assignees),
            joinedload(Todo.creator)
        ).filter(
            and_(
                Todo.planner_id == planner_id,
                Todo.status == status
            )
        ).order_by(Todo.due_date.asc()).all()
    
    @staticmethod
    def get_todos_by_priority(db: Session, planner_id: int, priority: str) -> List[Todo]:
        """우선순위별 할일 조회"""
        return db.query(Todo).options(
            joinedload(Todo.assignees),
            joinedload(Todo.creator)
        ).filter(
            and_(
                Todo.planner_id == planner_id,
                Todo.priority == priority
            )
        ).order_by(Todo.due_date.asc()).all()
    
    @staticmethod
    def get_overdue_todos(db: Session, user_id: int) -> List[Todo]:
        """지연된 할일 조회"""
        now = TimeService.now_kst()
        
        return db.query(Todo).options(
            joinedload(Todo.planner),
            joinedload(Todo.assignees)
        ).filter(
            and_(
                or_(
                    Todo.created_by == user_id,
                    Todo.assignees.any(user_id=user_id)
                ),
                Todo.due_date < now,
                Todo.status != 'completed'
            )
        ).order_by(Todo.due_date.asc()).all()
    
    @staticmethod
    def get_todo_statistics(db: Session, planner_id: int) -> Dict[str, Any]:
        """할일 통계 조회"""
        stats = db.query(
            func.count(Todo.id).label('total'),
            func.sum(func.case([(Todo.status == 'pending', 1)], else_=0)).label('pending'),
            func.sum(func.case([(Todo.status == 'in_progress', 1)], else_=0)).label('in_progress'),
            func.sum(func.case([(Todo.status == 'completed', 1)], else_=0)).label('completed'),
            func.sum(func.case([(Todo.priority == 'high', 1)], else_=0)).label('high_priority')
        ).filter(Todo.planner_id == planner_id).first()
        
        return {
            'total': getattr(stats, 'total', 0) or 0,
            'pending': getattr(stats, 'pending', 0) or 0,
            'in_progress': getattr(stats, 'in_progress', 0) or 0,
            'completed': getattr(stats, 'completed', 0) or 0,
            'high_priority': getattr(stats, 'high_priority', 0) or 0
        }
    
    @staticmethod
    def get_team_members_optimized(db: Session, team_id: int) -> List[TeamMember]:
        """팀 멤버를 최적화된 쿼리로 조회"""
        return db.query(TeamMember).options(
            joinedload(TeamMember.user)
        ).filter(TeamMember.team_id == team_id).all()
    
    @staticmethod
    def bulk_update_todo_status(db: Session, todo_ids: List[int], status: str) -> int:
        """할일 상태 일괄 업데이트"""
        try:
            result = db.query(Todo).filter(Todo.id.in_(todo_ids)).update(
                {"status": status}, synchronize_session=False
            )
            db.commit()
            logger.info(f"할일 상태 일괄 업데이트: {result}개 항목")
            return result
        except Exception as e:
            db.rollback()
            logger.error(f"할일 상태 일괄 업데이트 실패: {e}")
            raise
    
    @staticmethod
    def get_recent_activities(db: Session, user_id: int, days: int = 7) -> List[Activity]:
        """최근 활동 조회"""
        start_date = TimeService.now_kst() - timedelta(days=days)
        
        return db.query(Activity).filter(
            and_(
                Activity.user_id == user_id,
                Activity.created_at >= start_date
            )
        ).order_by(Activity.created_at.desc()).all()

# 싱글톤 인스턴스
query_optimizer = QueryOptimizer() 