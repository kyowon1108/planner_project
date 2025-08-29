from sqlalchemy.orm import Session
from models.notification import Notification
from models.user import User
from websocket.manager import manager
from typing import List, Optional, Dict, Any
import json
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_notification(self, notification_data: Dict[str, Any], current_user: User) -> Notification:
        """새로운 알림을 생성합니다."""
        try:
            user_id = getattr(current_user, 'id', None)
            if user_id is None:
                raise ValueError("사용자 ID가 없습니다.")
            
            notification = Notification(
                user_id=int(user_id),
                title=notification_data.get('title', ''),
                message=notification_data.get('message', ''),
                type=notification_data.get('type', 'general'),
                related_id=notification_data.get('related_id')
            )
            
            self.db.add(notification)
            self.db.commit()
            self.db.refresh(notification)
            
            logger.info(f"알림 생성 성공: ID {notification.id}, 사용자 {user_id}")
            return notification
            
        except Exception as e:
            logger.error(f"알림 생성 실패: {str(e)}")
            raise
    
    def get_user_notifications(self, current_user: User, skip: int = 0, limit: int = 100) -> List[Notification]:
        """사용자의 알림 목록을 조회합니다."""
        try:
            user_id = getattr(current_user, 'id', None)
            if user_id is None:
                raise ValueError("사용자 ID가 없습니다.")
            
            notifications = self.db.query(Notification).filter(
                Notification.user_id == int(user_id)
            ).offset(skip).limit(limit).all()
            
            return notifications
            
        except Exception as e:
            logger.error(f"사용자 알림 조회 실패: {str(e)}")
            return []
    
    def get_notification_by_id(self, notification_id: int, current_user: User) -> Optional[Notification]:
        """ID로 알림을 조회합니다."""
        try:
            user_id = getattr(current_user, 'id', None)
            if user_id is None:
                raise ValueError("사용자 ID가 없습니다.")
            
            notification = self.db.query(Notification).filter(
                Notification.id == notification_id,
                Notification.user_id == int(user_id)
            ).first()
            
            return notification
            
        except Exception as e:
            logger.error(f"알림 조회 실패 (ID: {notification_id}): {str(e)}")
            return None
    
    def update_notification(self, notification_id: int, notification_data: Dict[str, Any], current_user: User) -> Optional[Notification]:
        """알림을 업데이트합니다."""
        try:
            user_id = getattr(current_user, 'id', None)
            if user_id is None:
                raise ValueError("사용자 ID가 없습니다.")
            
            notification = self.db.query(Notification).filter(
                Notification.id == notification_id,
                Notification.user_id == int(user_id)
            ).first()
            
            if not notification:
                raise ValueError("알림을 찾을 수 없습니다.")
            
            # 업데이트할 필드들
            for field, value in notification_data.items():
                if hasattr(notification, field):
                    setattr(notification, field, value)
            
            self.db.commit()
            self.db.refresh(notification)
            
            logger.info(f"알림 수정 성공: ID {notification_id}")
            return notification
            
        except Exception as e:
            logger.error(f"알림 수정 실패 (ID: {notification_id}): {str(e)}")
            raise
    
    def delete_notification(self, notification_id: int, current_user: User) -> bool:
        """알림을 삭제합니다."""
        try:
            user_id = getattr(current_user, 'id', None)
            if user_id is None:
                raise ValueError("사용자 ID가 없습니다.")
            
            notification = self.db.query(Notification).filter(
                Notification.id == notification_id,
                Notification.user_id == int(user_id)
            ).first()
            
            if not notification:
                raise ValueError("알림을 찾을 수 없습니다.")
            
            self.db.delete(notification)
            self.db.commit()
            
            logger.info(f"알림 삭제 성공: ID {notification_id}")
            return True
            
        except Exception as e:
            logger.error(f"알림 삭제 실패 (ID: {notification_id}): {str(e)}")
            raise
    
    def mark_as_read(self, notification_id: int, current_user: User) -> bool:
        """알림을 읽음으로 표시합니다."""
        try:
            user_id = getattr(current_user, 'id', None)
            if user_id is None:
                raise ValueError("사용자 ID가 없습니다.")
            
            notification = self.db.query(Notification).filter(
                Notification.id == notification_id,
                Notification.user_id == int(user_id)
            ).first()
            
            if not notification:
                raise ValueError("알림을 찾을 수 없습니다.")
            
            # 초대 알림은 버튼을 누르기 전까지는 읽음 처리하지 않음
            if getattr(notification, 'type', '') in ["team_invite"]:
                logger.info(f"초대 알림은 버튼을 누르기 전까지 유지: ID {notification_id}")
                return True
            
            # 초대 알림이 아닌 경우 삭제
            self.db.delete(notification)
            self.db.commit()
            
            logger.info(f"알림 읽음 처리 성공: ID {notification_id}")
            return True
            
        except Exception as e:
            logger.error(f"알림 읽음 처리 실패 (ID: {notification_id}): {str(e)}")
            raise
    
    def mark_all_as_read(self, current_user: User) -> bool:
        """모든 알림을 읽음으로 표시합니다."""
        try:
            user_id = getattr(current_user, 'id', None)
            if user_id is None:
                raise ValueError("사용자 ID가 없습니다.")
            
            # 초대 알림을 제외하고 삭제
            deleted_count = self.db.query(Notification).filter(
                Notification.user_id == int(user_id),
                Notification.type != "team_invite"
            ).delete()
            
            self.db.commit()
            
            logger.info(f"모든 알림 읽음 처리 성공: {deleted_count}개 삭제")
            return True
            
        except Exception as e:
            logger.error(f"모든 알림 읽음 처리 실패: {str(e)}")
            raise

    @staticmethod
    async def create_and_send_notification(
        db: Session,
        user_id: int,
        title: str,
        message: str,
        notification_type: str,
        related_id: Optional[int] = None
    ):
        """알림을 생성하고 WebSocket으로 전송합니다."""
        # DB에 알림 저장
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=notification_type,
            related_id=related_id
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        
        # WebSocket으로 실시간 알림 전송
        await manager.send_personal_message({
            "type": "notification",
            "data": {
                "id": notification.id,
                "title": notification.title,
                "message": notification.message,
                "type": notification.type,
                "created_at": notification.created_at.isoformat()
            }
        }, user_id)
        
        return notification

    @staticmethod
    async def send_team_notification(
        db: Session,
        team_member_ids: List[int],
        title: str,
        message: str,
        notification_type: str,
        related_id: Optional[int] = None
    ):
        """팀 멤버들에게 알림을 전송합니다."""
        notifications = []
        for user_id in team_member_ids:
            notification = await NotificationService.create_and_send_notification(
                db, user_id, title, message, notification_type, related_id
            )
            notifications.append(notification)
        return notifications 