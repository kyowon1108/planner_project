#!/usr/bin/env python3
"""
실시간 알림 시스템 테스트 스크립트

이 스크립트는 백엔드 서버에 테스트 알림을 전송하여 
실시간 알림 시스템이 제대로 작동하는지 확인합니다.
"""
import asyncio
import aiohttp
import json
import sys
import time
from datetime import datetime

# 백엔드 서버 URL
BASE_URL = "http://localhost:8000"

# 테스트용 사용자 인증 정보 (실제 환경에 맞게 수정)
TEST_USER = {
    "username": "test@example.com",  # 실제 테스트 계정으로 변경
    "password": "testpassword123"    # 실제 비밀번호로 변경
}

class NotificationTester:
    def __init__(self):
        self.session = None
        self.auth_token = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def login(self):
        """사용자 인증"""
        login_data = {
            "username": TEST_USER["username"],
            "password": TEST_USER["password"]
        }
        
        async with self.session.post(f"{BASE_URL}/api/v1/auth/login", data=login_data) as resp:
            if resp.status == 200:
                result = await resp.json()
                self.auth_token = result.get("access_token")
                print(f"✅ 로그인 성공: {TEST_USER['username']}")
                return True
            else:
                print(f"❌ 로그인 실패: {resp.status} - {await resp.text()}")
                return False
    
    async def test_notification_endpoint(self):
        """테스트 알림 전송"""
        if not self.auth_token:
            print("❌ 인증이 필요합니다. 먼저 로그인하세요.")
            return False
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        async with self.session.post(f"{BASE_URL}/api/v1/notifications/test", headers=headers) as resp:
            if resp.status == 200:
                result = await resp.json()
                print(f"✅ 테스트 알림 전송 성공: {result.get('message', 'OK')}")
                return True
            else:
                print(f"❌ 테스트 알림 전송 실패: {resp.status} - {await resp.text()}")
                return False
    
    async def test_custom_notification(self, title: str, message: str, notification_type: str = "system_announcement"):
        """커스텀 알림 전송"""
        if not self.auth_token:
            print("❌ 인증이 필요합니다. 먼저 로그인하세요.")
            return False
        
        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
        
        data = {
            "title": title,
            "message": message,
            "type": notification_type
        }
        
        async with self.session.post(f"{BASE_URL}/api/v1/notifications/", headers=headers, json=data) as resp:
            if resp.status == 200:
                result = await resp.json()
                print(f"✅ 커스텀 알림 전송 성공: {title}")
                return True
            else:
                print(f"❌ 커스텀 알림 전송 실패: {resp.status} - {await resp.text()}")
                return False
    
    async def get_notifications(self):
        """알림 목록 조회"""
        if not self.auth_token:
            print("❌ 인증이 필요합니다. 먼저 로그인하세요.")
            return []
        
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        async with self.session.get(f"{BASE_URL}/api/v1/notifications/", headers=headers) as resp:
            if resp.status == 200:
                notifications = await resp.json()
                print(f"✅ 알림 목록 조회 성공: {len(notifications)}개")
                return notifications
            else:
                print(f"❌ 알림 목록 조회 실패: {resp.status} - {await resp.text()}")
                return []

async def main():
    print("🧪 실시간 알림 시스템 테스트 시작")
    print("=" * 50)
    
    async with NotificationTester() as tester:
        # 1. 사용자 로그인
        print("\n1. 사용자 인증 테스트")
        login_success = await tester.login()
        if not login_success:
            print("⚠️ 로그인에 실패했습니다. 테스트를 중단합니다.")
            return
        
        # 2. 테스트 알림 전송
        print("\n2. 테스트 알림 전송")
        await tester.test_notification_endpoint()
        
        # 3. 다양한 유형의 알림 테스트
        print("\n3. 다양한 알림 유형 테스트")
        
        test_cases = [
            ("🎉 환영 알림", "알림 시스템 테스트에 오신 것을 환영합니다!", "system_announcement"),
            ("📋 할 일 알림", "새로운 할 일이 할당되었습니다: 프로젝트 검토", "todo_assigned"),
            ("⏰ 마감 알림", "내일까지 완료해야 할 작업이 있습니다.", "deadline_approaching"),
            ("✅ 완료 알림", "작업이 성공적으로 완료되었습니다.", "todo_completed"),
            ("💬 댓글 알림", "게시글에 새로운 댓글이 추가되었습니다.", "post_comment")
        ]
        
        for title, message, type_name in test_cases:
            await tester.test_custom_notification(title, message, type_name)
            await asyncio.sleep(1)  # 1초 간격으로 전송
        
        # 4. 알림 목록 확인
        print("\n4. 알림 목록 확인")
        notifications = await tester.get_notifications()
        
        if notifications:
            print("\n📋 최근 알림 목록:")
            for i, notif in enumerate(notifications[:5], 1):  # 최근 5개만 표시
                print(f"  {i}. [{notif.get('type', 'unknown')}] {notif.get('title', 'No title')}")
                print(f"     {notif.get('message', 'No message')}")
                print(f"     생성: {notif.get('created_at', 'Unknown')}")
                print()
    
    print("🎉 테스트 완료!")
    print("\n📌 확인사항:")
    print("1. 프론트엔드에서 실시간으로 알림이 나타나는지 확인하세요")
    print("2. 알림의 우선순위별 색상과 지속시간이 올바른지 확인하세요")
    print("3. 알림 메뉴에서 알림 목록이 업데이트되는지 확인하세요")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n⚠️ 테스트가 중단되었습니다.")
    except Exception as e:
        print(f"❌ 테스트 중 오류 발생: {e}")
        sys.exit(1)