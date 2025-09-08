"""
알림 스케줄링 서비스

할 일 마감 임박 알림, 정기적 알림 등을 스케줄링하여 자동 발송하는 서비스입니다.
"""

import asyncio
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import get_db
from models.todo import Todo
from models.user import User
from services.notification_service import NotificationService
from services.time_service import TimeService
import logging

logger = logging.getLogger(__name__)

class NotificationScheduler:
    def __init__(self):
        self.running = False
        self.tasks = []
    
    async def start_scheduler(self):
        """스케줄러를 시작합니다."""
        if self.running:
            logger.warning("스케줄러가 이미 실행 중입니다.")
            return
        
        self.running = True
        logger.info("알림 스케줄러 시작됨")
        
        # 백그라운드 태스크들 시작
        self.tasks = [
            asyncio.create_task(self._deadline_notification_loop()),
            asyncio.create_task(self._daily_summary_loop()),
        ]
        
        # 모든 태스크가 완료될 때까지 대기
        await asyncio.gather(*self.tasks)
    
    async def stop_scheduler(self):
        """스케줄러를 중지합니다."""
        self.running = False
        
        # 실행 중인 태스크들 취소
        for task in self.tasks:
            task.cancel()
        
        # 태스크들이 완전히 종료될 때까지 대기
        await asyncio.gather(*self.tasks, return_exceptions=True)
        logger.info("알림 스케줄러 중지됨")
    
    async def _deadline_notification_loop(self):
        """마감 임박 알림을 주기적으로 확인하고 발송합니다."""
        while self.running:
            try:
                await self._check_and_send_deadline_notifications()
                # 1시간마다 확인
                await asyncio.sleep(3600)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"마감 알림 루프 오류: {str(e)}")
                await asyncio.sleep(60)  # 오류 시 1분 후 재시도
    
    async def _daily_summary_loop(self):
        """일일 요약 알림을 발송합니다."""
        while self.running:
            try:
                now = TimeService.now_kst()
                # 매일 오후 6시에 일일 요약 발송
                if now.hour == 18 and now.minute == 0:
                    await self._send_daily_summary_notifications()
                
                # 1분마다 확인
                await asyncio.sleep(60)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"일일 요약 루프 오류: {str(e)}")
                await asyncio.sleep(60)
    
    async def _check_and_send_deadline_notifications(self):
        """마감 임박 할 일을 찾아서 알림을 발송합니다."""
        try:
            db = next(get_db())
            current_time = TimeService.now_kst()
            
            # 1일 후 마감 예정 할 일들
            one_day_later = current_time + timedelta(days=1)
            # 1시간 후 마감 예정 할 일들  
            one_hour_later = current_time + timedelta(hours=1)
            
            # 1일 후 마감 예정 할 일 조회
            todos_1day = db.query(Todo).filter(
                Todo.due_date >= current_time,
                Todo.due_date <= one_day_later,
                Todo.status != "completed"
            ).all()
            
            # 1시간 후 마감 예정 할 일 조회
            todos_1hour = db.query(Todo).filter(
                Todo.due_date >= current_time,
                Todo.due_date <= one_hour_later,
                Todo.status != "completed"
            ).all()
            
            # 1일 후 마감 알림 발송
            for todo in todos_1day:
                if todo.assigned_to:
                    await NotificationService.create_and_send_notification(
                        db=db,
                        user_id=todo.assigned_to,
                        title="⏰ 마감 임박 알림 (1일 후)",
                        message=f"'{todo.title}' 할 일이 내일 마감됩니다.",
                        notification_type="deadline_approaching",
                        related_id=todo.id
                    )
            
            # 1시간 후 마감 알림 발송
            for todo in todos_1hour:
                if todo.assigned_to:
                    await NotificationService.create_and_send_notification(
                        db=db,
                        user_id=todo.assigned_to,
                        title="🚨 긴급! 마감 임박 알림 (1시간 후)",
                        message=f"'{todo.title}' 할 일이 1시간 후 마감됩니다!",
                        notification_type="deadline_urgent",
                        related_id=todo.id
                    )
            
            logger.info(f"마감 알림 발송 완료: 1일 후 {len(todos_1day)}개, 1시간 후 {len(todos_1hour)}개")
            
        except Exception as e:
            logger.error(f"마감 알림 확인 중 오류: {str(e)}")
        finally:
            db.close()
    
    async def _send_daily_summary_notifications(self):
        """일일 요약 알림을 발송합니다."""
        try:
            db = next(get_db())
            
            # 모든 활성 사용자들 조회
            users = db.query(User).filter(User.is_active == True).all()
            
            for user in users:
                # 오늘 완료한 할 일 개수
                today_start = TimeService.now_kst().replace(hour=0, minute=0, second=0, microsecond=0)
                today_end = today_start + timedelta(days=1)
                
                completed_today = db.query(Todo).filter(
                    Todo.assigned_to == user.id,
                    Todo.status == "completed",
                    Todo.updated_at >= today_start,
                    Todo.updated_at < today_end
                ).count()
                
                # 내일 마감 예정 할 일 개수
                tomorrow_start = today_end
                tomorrow_end = tomorrow_start + timedelta(days=1)
                
                due_tomorrow = db.query(Todo).filter(
                    Todo.assigned_to == user.id,
                    Todo.status != "completed",
                    Todo.due_date >= tomorrow_start,
                    Todo.due_date < tomorrow_end
                ).count()
                
                # 일일 요약 알림 발송
                if completed_today > 0 or due_tomorrow > 0:
                    message = f"오늘 완료한 할 일: {completed_today}개"
                    if due_tomorrow > 0:
                        message += f"\n내일 마감 예정: {due_tomorrow}개"
                    
                    await NotificationService.create_and_send_notification(
                        db=db,
                        user_id=user.id,
                        title="📊 일일 요약",
                        message=message,
                        notification_type="daily_summary"
                    )
            
            logger.info("일일 요약 알림 발송 완료")
            
        except Exception as e:
            logger.error(f"일일 요약 알림 발송 중 오류: {str(e)}")
        finally:
            db.close()

# 전역 스케줄러 인스턴스
notification_scheduler = NotificationScheduler()

async def start_notification_scheduler():
    """알림 스케줄러를 시작하는 헬퍼 함수"""
    await notification_scheduler.start_scheduler()

async def stop_notification_scheduler():
    """알림 스케줄러를 중지하는 헬퍼 함수"""
    await notification_scheduler.stop_scheduler()