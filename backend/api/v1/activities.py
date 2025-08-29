from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from schemas.activity import ActivityRead
from models.activity import Activity
from models.user import User
from database import get_db
from api.v1.users import get_current_user
from services.activity_service import ActivityService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/activities", tags=["activities"])

@router.get("/", response_model=List[ActivityRead])
def read_activities(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[ActivityRead]:
    """활동 로그를 조회합니다."""
    try:
        activity_service = ActivityService(db)
        activities = activity_service.get_activities(skip, limit, user_id, action, resource_type)
        return [ActivityRead.model_validate(activity) for activity in activities]
    except Exception as e:
        logger.error(f"활동 로그 조회 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"활동 로그 조회 오류: {str(e)}")

@router.get("/user/{user_id}", response_model=List[ActivityRead])
def read_user_activities(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[ActivityRead]:
    """특정 사용자의 활동 로그를 조회합니다."""
    try:
        activity_service = ActivityService(db)
        activities = activity_service.get_user_activities(user_id, skip, limit)
        return [ActivityRead.model_validate(activity) for activity in activities]
    except Exception as e:
        logger.error(f"사용자 활동 로그 조회 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"사용자 활동 로그 조회 오류: {str(e)}")

@router.get("/team/{team_id}", response_model=List[ActivityRead])
def read_team_activities(
    team_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[ActivityRead]:
    """팀 관련 활동 로그를 조회합니다."""
    try:
        activity_service = ActivityService(db)
        activities = activity_service.get_team_activities(team_id, skip, limit)
        return [ActivityRead.model_validate(activity) for activity in activities]
    except Exception as e:
        logger.error(f"팀 활동 로그 조회 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"팀 활동 로그 조회 오류: {str(e)}") 