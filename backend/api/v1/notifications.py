from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from schemas.notification import NotificationRead, NotificationUpdate, NotificationCreate
from models.notification import Notification
from models.user import User
from database import get_db
from api.v1.users import get_current_user
from services.notification_service import NotificationService
from websocket.notification_manager import notification_manager, NotificationType

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

# 실시간 알림 설정 관리 엔드포인트들

@router.get("/settings")
def get_notification_settings(
    current_user: User = Depends(get_current_user)
) -> Dict[str, bool]:
    """사용자의 알림 설정 조회"""
    try:
        user_id = getattr(current_user, 'id', None)
        if user_id is None:
            raise HTTPException(status_code=400, detail="사용자 ID가 없습니다.")
        
        settings = notification_manager.get_user_notification_settings(int(user_id))
        return settings
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"알림 설정 조회 오류: {str(e)}")

@router.put("/settings")
def update_notification_settings(
    settings: Dict[str, bool],
    current_user: User = Depends(get_current_user)
) -> Dict[str, str]:
    """사용자의 알림 설정 업데이트"""
    try:
        user_id = getattr(current_user, 'id', None)
        if user_id is None:
            raise HTTPException(status_code=400, detail="사용자 ID가 없습니다.")
        
        # 유효한 알림 유형만 필터링
        valid_types = [notification_type.value for notification_type in NotificationType]
        filtered_settings = {
            key: value for key, value in settings.items() 
            if key in valid_types and isinstance(value, bool)
        }
        
        notification_manager.update_user_notification_settings(int(user_id), filtered_settings)
        return {"message": "알림 설정이 업데이트되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"알림 설정 업데이트 오류: {str(e)}")

@router.post("/test")
async def send_test_notification(
    current_user: User = Depends(get_current_user)
) -> Dict[str, str]:
    """테스트 알림 발송"""
    try:
        user_id = getattr(current_user, 'id', None)
        if user_id is None:
            raise HTTPException(status_code=400, detail="사용자 ID가 없습니다.")
        
        await notification_manager.send_notification(
            user_id=int(user_id),
            notification_type=NotificationType.SYSTEM_ANNOUNCEMENT,
            title="🧪 테스트 알림",
            message="실시간 알림 시스템이 정상적으로 작동중입니다!"
        )
        
        return {"message": "테스트 알림이 발송되었습니다."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"테스트 알림 발송 오류: {str(e)}")

@router.get("/types")
def get_notification_types() -> Dict[str, List[Dict[str, Any]]]:
    """사용 가능한 알림 유형 목록 조회"""
    try:
        types = []
        for notification_type in NotificationType:
            template = notification_manager.notification_templates.get(notification_type, {})
            types.append({
                "type": notification_type.value,
                "name": notification_type.value.replace('_', ' ').title(),
                "icon": template.get("icon", "🔔"),
                "color": template.get("color", "#757575"),
                "priority": template.get("priority", "medium").value,
                "description": _get_notification_type_description(notification_type)
            })
        
        return {"notification_types": types}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"알림 유형 조회 오류: {str(e)}")

def _get_notification_type_description(notification_type: NotificationType) -> str:
    """알림 유형별 설명 반환"""
    descriptions = {
        NotificationType.TEAM_INVITE: "팀 초대 알림",
        NotificationType.TODO_ASSIGNED: "할 일 할당 알림", 
        NotificationType.TODO_COMPLETED: "할 일 완료 알림",
        NotificationType.TODO_COMMENT: "할 일 댓글 알림",
        NotificationType.POST_COMMENT: "게시글 댓글 알림",
        NotificationType.POST_LIKE: "게시글 좋아요 알림",
        NotificationType.DEADLINE_APPROACHING: "마감 임박 알림",
        NotificationType.DEADLINE_URGENT: "긴급 마감 알림",
        NotificationType.DAILY_SUMMARY: "일일 요약 알림",
        NotificationType.SYSTEM_ANNOUNCEMENT: "시스템 공지 알림"
    }
    
    return descriptions.get(notification_type, "일반 알림")