"""
실시간 알림 전용 WebSocket 매니저

알림 유형별 메시지 포맷팅, 알림 우선순위 관리, 사용자 설정 기반 알림 필터링을 담당합니다.
"""

from fastapi import WebSocket
from typing import Dict, List, Optional, Any
from enum import Enum
import json
import logging
from datetime import datetime
from websocket.manager import manager

logger = logging.getLogger(__name__)

class NotificationPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class NotificationType(str, Enum):
    TEAM_INVITE = "team_invite"
    TODO_ASSIGNED = "todo_assigned"
    TODO_COMPLETED = "todo_completed"
    TODO_COMMENT = "todo_comment"
    POST_COMMENT = "post_comment"
    POST_LIKE = "post_like"
    DEADLINE_APPROACHING = "deadline_approaching"
    DEADLINE_URGENT = "deadline_urgent"
    DAILY_SUMMARY = "daily_summary"
    SYSTEM_ANNOUNCEMENT = "system_announcement"

class NotificationManager:
    def __init__(self):
        self.user_settings: Dict[int, Dict[str, bool]] = {}
        self.notification_templates = {
            NotificationType.TEAM_INVITE: {
                "icon": "👥",
                "color": "#2196F3",
                "priority": NotificationPriority.HIGH,
                "sound": "notification"
            },
            NotificationType.TODO_ASSIGNED: {
                "icon": "📋",
                "color": "#FF9800",
                "priority": NotificationPriority.MEDIUM,
                "sound": "assignment"
            },
            NotificationType.TODO_COMPLETED: {
                "icon": "✅",
                "color": "#4CAF50",
                "priority": NotificationPriority.LOW,
                "sound": "success"
            },
            NotificationType.TODO_COMMENT: {
                "icon": "💬",
                "color": "#9C27B0",
                "priority": NotificationPriority.MEDIUM,
                "sound": "message"
            },
            NotificationType.POST_COMMENT: {
                "icon": "💬",
                "color": "#607D8B",
                "priority": NotificationPriority.LOW,
                "sound": "message"
            },
            NotificationType.POST_LIKE: {
                "icon": "❤️",
                "color": "#E91E63",
                "priority": NotificationPriority.LOW,
                "sound": "like"
            },
            NotificationType.DEADLINE_APPROACHING: {
                "icon": "⏰",
                "color": "#FF5722",
                "priority": NotificationPriority.HIGH,
                "sound": "alert"
            },
            NotificationType.DEADLINE_URGENT: {
                "icon": "🚨",
                "color": "#F44336",
                "priority": NotificationPriority.URGENT,
                "sound": "urgent"
            },
            NotificationType.DAILY_SUMMARY: {
                "icon": "📊",
                "color": "#00BCD4",
                "priority": NotificationPriority.LOW,
                "sound": "gentle"
            },
            NotificationType.SYSTEM_ANNOUNCEMENT: {
                "icon": "📢",
                "color": "#3F51B5",
                "priority": NotificationPriority.MEDIUM,
                "sound": "announcement"
            }
        }
    
    async def send_notification(
        self, 
        user_id: int,
        notification_type: NotificationType,
        title: str,
        message: str,
        related_id: Optional[int] = None,
        custom_data: Optional[Dict[str, Any]] = None
    ):
        """
        실시간 알림을 전송합니다.
        
        Args:
            user_id: 알림 수신자 ID
            notification_type: 알림 유형
            title: 알림 제목
            message: 알림 내용
            related_id: 관련 객체 ID (할 일, 게시글 등)
            custom_data: 추가 커스텀 데이터
        """
        try:
            # 사용자 알림 설정 확인
            if not self._is_notification_enabled(user_id, notification_type):
                logger.info(f"사용자 {user_id}의 {notification_type} 알림이 비활성화됨")
                return
            
            # 알림 메시지 포맷팅
            formatted_notification = self._format_notification(
                notification_type, title, message, related_id, custom_data
            )
            
            # WebSocket으로 실시간 전송
            await manager.send_personal_message(formatted_notification, user_id)
            
            logger.info(f"실시간 알림 전송 완료: 사용자 {user_id}, 유형 {notification_type}")
            
        except Exception as e:
            logger.error(f"실시간 알림 전송 실패: {str(e)}")
    
    async def send_team_notification(
        self,
        team_member_ids: List[int],
        notification_type: NotificationType,
        title: str,
        message: str,
        related_id: Optional[int] = None,
        exclude_user_id: Optional[int] = None
    ):
        """
        팀 멤버들에게 실시간 알림을 전송합니다.
        
        Args:
            team_member_ids: 팀 멤버 ID 목록
            notification_type: 알림 유형
            title: 알림 제목
            message: 알림 내용
            related_id: 관련 객체 ID
            exclude_user_id: 제외할 사용자 ID (알림을 발생시킨 사용자)
        """
        for user_id in team_member_ids:
            if exclude_user_id and user_id == exclude_user_id:
                continue
                
            await self.send_notification(
                user_id, notification_type, title, message, related_id
            )
    
    def _format_notification(
        self,
        notification_type: NotificationType,
        title: str,
        message: str,
        related_id: Optional[int] = None,
        custom_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """알림 메시지를 포맷팅합니다."""
        template = self.notification_templates.get(notification_type, {})
        
        formatted = {
            "type": "realtime_notification",
            "data": {
                "notification_type": notification_type.value,
                "title": title,
                "message": message,
                "icon": template.get("icon", "🔔"),
                "color": template.get("color", "#757575"),
                "priority": template.get("priority", NotificationPriority.MEDIUM).value,
                "sound": template.get("sound", "default"),
                "timestamp": datetime.now().isoformat(),
                "related_id": related_id,
                "custom_data": custom_data or {}
            }
        }
        
        return formatted
    
    def _is_notification_enabled(self, user_id: int, notification_type: NotificationType) -> bool:
        """사용자의 알림 설정을 확인합니다."""
        user_settings = self.user_settings.get(user_id, {})
        
        # 기본값은 모든 알림 활성화
        return user_settings.get(notification_type.value, True)
    
    def update_user_notification_settings(self, user_id: int, settings: Dict[str, bool]):
        """사용자의 알림 설정을 업데이트합니다."""
        self.user_settings[user_id] = settings
        logger.info(f"사용자 {user_id}의 알림 설정 업데이트됨: {settings}")
    
    def get_user_notification_settings(self, user_id: int) -> Dict[str, bool]:
        """사용자의 알림 설정을 조회합니다."""
        default_settings = {
            notification_type.value: True 
            for notification_type in NotificationType
        }
        
        return self.user_settings.get(user_id, default_settings)
    
    async def send_system_announcement(self, title: str, message: str, target_user_ids: Optional[List[int]] = None):
        """
        시스템 공지사항을 전송합니다.
        
        Args:
            title: 공지사항 제목
            message: 공지사항 내용
            target_user_ids: 대상 사용자 ID 목록 (None이면 모든 연결된 사용자)
        """
        if target_user_ids:
            # 특정 사용자들에게만 전송
            for user_id in target_user_ids:
                await self.send_notification(
                    user_id, 
                    NotificationType.SYSTEM_ANNOUNCEMENT, 
                    title, 
                    message
                )
        else:
            # 모든 연결된 사용자에게 전송
            announcement = self._format_notification(
                NotificationType.SYSTEM_ANNOUNCEMENT,
                title,
                message
            )
            
            # 모든 활성 연결에 브로드캐스트
            active_user_ids = list(manager.active_connections.keys())
            await manager.broadcast(announcement, active_user_ids)
    
    async def send_todo_notification(
        self,
        notification_type: NotificationType,
        todo_title: str,
        assignee_id: int,
        actor_name: str,
        todo_id: int,
        additional_message: str = ""
    ):
        """할 일 관련 알림을 전송합니다."""
        if notification_type == NotificationType.TODO_ASSIGNED:
            title = "📋 새 할 일이 할당되었습니다"
            message = f"{actor_name}님이 '{todo_title}' 할 일을 할당했습니다."
        elif notification_type == NotificationType.TODO_COMPLETED:
            title = "✅ 할 일이 완료되었습니다"
            message = f"'{todo_title}' 할 일이 완료되었습니다."
        elif notification_type == NotificationType.TODO_COMMENT:
            title = "💬 할 일에 댓글이 추가되었습니다"
            message = f"{actor_name}님이 '{todo_title}' 할 일에 댓글을 남겼습니다."
        else:
            title = "할 일 알림"
            message = additional_message or f"'{todo_title}' 할 일에 업데이트가 있습니다."
        
        if additional_message:
            message += f" {additional_message}"
        
        await self.send_notification(
            assignee_id,
            notification_type,
            title,
            message,
            related_id=todo_id
        )

# 전역 알림 매니저 인스턴스
notification_manager = NotificationManager()