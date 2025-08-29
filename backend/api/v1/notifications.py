from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from schemas.notification import NotificationRead, NotificationUpdate, NotificationCreate
from models.notification import Notification
from models.user import User
from database import get_db
from api.v1.users import get_current_user
from services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.post("/", response_model=NotificationRead)
def create_notification_endpoint(
    notification: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> NotificationRead:
    """알림 생성"""
    try:
        notification_service = NotificationService(db)
        notification_data = {
            'title': notification.title,
            'message': notification.message,
            'type': notification.type,
            'related_id': notification.related_id
        }
        created_notification = notification_service.create_notification(notification_data, current_user)
        return created_notification
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"알림 생성 중 오류: {str(e)}")

@router.get("/", response_model=List[NotificationRead])
def read_notifications(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[NotificationRead]:
    """사용자의 알림 목록 조회"""
    try:
        notification_service = NotificationService(db)
        return [NotificationRead.model_validate(n) for n in notification_service.get_user_notifications(current_user, skip, limit)]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"알림 목록 조회 오류: {str(e)}")

@router.get("/{notification_id}", response_model=NotificationRead)
def read_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> NotificationRead:
    """특정 알림 조회"""
    try:
        notification_service = NotificationService(db)
        notification = notification_service.get_notification_by_id(notification_id, current_user)
        if not notification:
            raise HTTPException(status_code=404, detail="알림을 찾을 수 없습니다.")
        return notification
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"알림 조회 오류: {str(e)}")

@router.put("/{notification_id}", response_model=NotificationRead)
def update_notification(
    notification_id: int,
    notification: NotificationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> NotificationRead:
    """알림 수정"""
    try:
        notification_service = NotificationService(db)
        notification_data: Dict[str, Any] = {}
        for field in ['title', 'message', 'type', 'related_id']:
            value = getattr(notification, field, None)
            if value is not None:
                notification_data[field] = value
        updated_notification = notification_service.update_notification(notification_id, notification_data, current_user)
        if not updated_notification:
            raise HTTPException(status_code=404, detail="알림을 찾을 수 없습니다.")
        return updated_notification
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"알림 수정 오류: {str(e)}")

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, str]:
    """알림 삭제"""
    try:
        notification_service = NotificationService(db)
        success = notification_service.delete_notification(notification_id, current_user)
        if not success:
            raise HTTPException(status_code=404, detail="알림을 찾을 수 없습니다.")
        return {"message": "알림이 삭제되었습니다."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"알림 삭제 오류: {str(e)}")

@router.put("/mark-all-read")
def mark_all_as_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, str]:
    """모든 알림을 읽음으로 표시"""
    try:
        notification_service = NotificationService(db)
        success = notification_service.mark_all_as_read(current_user)
        if success:
            return {"message": "모든 알림이 읽음으로 표시되었습니다."}
        else:
            raise HTTPException(status_code=500, detail="알림 상태 업데이트에 실패했습니다.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"알림 상태 업데이트 오류: {str(e)}")

@router.put("/{notification_id}/mark-read")
def mark_notification_as_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, str]:
    """특정 알림을 읽음으로 표시"""
    try:
        notification_service = NotificationService(db)
        success = notification_service.mark_as_read(notification_id, current_user)
        if not success:
            raise HTTPException(status_code=404, detail="알림을 찾을 수 없습니다.")
        return {"message": "알림이 읽음으로 표시되었습니다."}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"알림 상태 업데이트 오류: {str(e)}") 