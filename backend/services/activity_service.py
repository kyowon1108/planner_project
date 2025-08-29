from sqlalchemy.orm import Session
from models.activity import Activity
from typing import Optional, Dict, Any, List
import json
import logging

logger = logging.getLogger(__name__)

class ActivityService:
    def __init__(self, db: Session):
        self.db = db

    def log_activity(
        self,
        user_id: int,
        action: str,
        resource_type: str,
        description: str,
        resource_id: Optional[int] = None,
        activity_metadata: Optional[Dict[str, Any]] = None
    ):
        """활동 로그를 기록합니다."""
        try:
            activity = Activity(
                user_id=user_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                description=description,
                activity_metadata=json.dumps(activity_metadata) if activity_metadata else None
            )
            self.db.add(activity)
            self.db.commit()
            self.db.refresh(activity)
            logger.info(f"활동 로그 기록: {action} - {resource_type} - {description}")
            return activity
        except Exception as e:
            self.db.rollback()
            logger.error(f"활동 로그 기록 실패: {str(e)}")
            raise

    def log_team_activity(
        self,
        user_id: int,
        action: str,
        team_id: int,
        description: str,
        activity_metadata: Optional[Dict[str, Any]] = None
    ):
        """팀 관련 활동을 기록합니다."""
        return self.log_activity(
            user_id, action, "team", description, team_id, activity_metadata
        )

    def log_planner_activity(
        self,
        user_id: int,
        action: str,
        planner_id: int,
        description: str,
        activity_metadata: Optional[Dict[str, Any]] = None
    ):
        """플래너 관련 활동을 기록합니다."""
        return self.log_activity(
            user_id, action, "planner", description, planner_id, activity_metadata
        )

    def log_post_activity(
        self,
        user_id: int,
        action: str,
        post_id: int,
        description: str,
        activity_metadata: Optional[Dict[str, Any]] = None
    ):
        """게시글 관련 활동을 기록합니다."""
        return self.log_activity(
            user_id, action, "post", description, post_id, activity_metadata
        )

    def get_activities(
        self,
        skip: int = 0,
        limit: int = 100,
        user_id: Optional[int] = None,
        action: Optional[str] = None,
        resource_type: Optional[str] = None
    ) -> List[Activity]:
        """활동 로그를 조회합니다."""
        try:
            query = self.db.query(Activity)
            
            # 필터링
            if user_id:
                query = query.filter(Activity.user_id == user_id)
            if action:
                query = query.filter(Activity.action == action)
            if resource_type:
                query = query.filter(Activity.resource_type == resource_type)
            
            # 최신순으로 정렬
            activities = query.order_by(Activity.created_at.desc()).offset(skip).limit(limit).all()
            logger.info(f"활동 로그 조회: {len(activities)}개")
            return activities
        except Exception as e:
            logger.error(f"활동 로그 조회 실패: {str(e)}")
            raise

    def get_user_activities(
        self,
        user_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Activity]:
        """특정 사용자의 활동 로그를 조회합니다."""
        try:
            activities = self.db.query(Activity).filter(
                Activity.user_id == user_id
            ).order_by(Activity.created_at.desc()).offset(skip).limit(limit).all()
            logger.info(f"사용자 활동 로그 조회: {user_id} - {len(activities)}개")
            return activities
        except Exception as e:
            logger.error(f"사용자 활동 로그 조회 실패: {str(e)}")
            raise

    def get_team_activities(
        self,
        team_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> List[Activity]:
        """팀 관련 활동 로그를 조회합니다."""
        try:
            activities = self.db.query(Activity).filter(
                Activity.resource_type == "team",
                Activity.resource_id == team_id
            ).order_by(Activity.created_at.desc()).offset(skip).limit(limit).all()
            logger.info(f"팀 활동 로그 조회: {team_id} - {len(activities)}개")
            return activities
        except Exception as e:
            logger.error(f"팀 활동 로그 조회 실패: {str(e)}")
            raise 