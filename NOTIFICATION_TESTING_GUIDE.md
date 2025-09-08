# 🔔 실시간 알림 시스템 테스트 가이드

## 📋 개요
FEAT-003로 구현된 실시간 알림 시스템의 테스트 및 사용 방법을 안내합니다.

## 🛠 수정된 문제 사항
### ✅ 해결됨: 알림 API 무한 루프 문제
- **문제**: 알림 조회 API가 무한 반복 호출되어 서버에 과부하 발생
- **해결책**:
  1. **로딩 상태 관리**: `isLoadingNotifications` 상태로 중복 요청 방지
  2. **스로틀링 적용**: 1초 간격으로 요청 제한 (`LOAD_THROTTLE_MS`)
  3. **useCallback 최적화**: 함수 메모이제이션으로 불필요한 재렌더링 방지
  4. **조건부 호출**: 메뉴가 닫혀있을 때만 알림 로드

## 🚀 테스트 방법

### 1. 백엔드 서버 시작
```bash
# 프로젝트 루트에서
source venv/bin/activate  # 가상환경 활성화
cd backend
python main.py
```

### 2. 프론트엔드 서버 시작
```bash
# 새 터미널에서
cd frontend
npm start
```

### 3. 자동 테스트 스크립트 실행 (선택사항)
```bash
# 프로젝트 루트에서
python test_notification.py
```

## 🔧 수동 테스트 방법

### 테스트 알림 API 호출
```bash
# 1. 로그인 (토큰 획득)
curl -X POST "http://localhost:8000/api/v1/auth/login" \
     -d "username=your_email@example.com" \
     -d "password=your_password"

# 2. 테스트 알림 전송 (토큰을 YOUR_TOKEN으로 대체)
curl -X POST "http://localhost:8000/api/v1/notifications/test" \
     -H "Authorization: Bearer YOUR_TOKEN"

# 3. 커스텀 알림 생성
curl -X POST "http://localhost:8000/api/v1/notifications/" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "테스트 알림",
       "message": "실시간 알림 테스트입니다",
       "type": "system_announcement"
     }'
```

## 📝 확인 사항

### ✅ 프론트엔드에서 확인할 것
1. **실시간 토스트 알림**
   - 알림이 오른쪽 상단에 나타나는지
   - 우선순위별 색상이 올바른지 (urgent=빨강, high=주황, medium=파랑, low=초록)
   - 자동 숨김 시간이 우선순위별로 다른지 (urgent=10초, high=8초, medium=6초, low=4초)

2. **알림 메뉴**
   - 알림 아이콘 옆에 배지 숫자가 표시되는지
   - 메뉴 클릭 시 알림 목록이 나타나는지
   - "모두 읽음" 버튼이 작동하는지

3. **WebSocket 연결**
   - 브라우저 개발자 도구 > Network 탭에서 WebSocket 연결 확인
   - 실시간으로 알림이 수신되는지

### ✅ 백엔드에서 확인할 것
1. **API 응답**
   - `/api/v1/notifications/test` 엔드포인트가 200 응답하는지
   - 알림 생성/조회/삭제 API가 정상 작동하는지

2. **WebSocket 연결**
   - 사용자 연결 시 WebSocket 세션이 생성되는지
   - 알림 전송 시 실시간으로 메시지가 전달되는지

## 🎯 알림 유형별 테스트

### 시스템 알림
- `system_announcement`: 📢 시스템 공지
- `daily_summary`: 📊 일일 요약

### 팀 관련 알림
- `team_invite`: 👥 팀 초대 (수락/거절 버튼 포함)

### 할 일 관련 알림
- `todo_assigned`: 📋 할 일 할당
- `todo_completed`: ✅ 할 일 완료
- `todo_comment`: 💬 할 일 댓글
- `deadline_approaching`: ⏰ 마감 임박 (1일 전)
- `deadline_urgent`: 🚨 긴급 마감 (1시간 전)

### 게시글 관련 알림
- `post_comment`: 💬 게시글 댓글
- `post_like`: ❤️ 게시글 좋아요

## 🐛 문제 해결

### API 무한 루프가 다시 발생하는 경우
1. 브라우저 개발자 도구 > Network 탭 확인
2. `/api/v1/notifications/` 요청이 1초 간격으로 제한되는지 확인
3. 콘솔에 "알림 로딩을 건너뜁니다" 메시지가 나타나는지 확인

### WebSocket 연결 문제
1. 백엔드 로그에서 WebSocket 연결 메시지 확인
2. 프론트엔드에서 연결 상태 확인 (`useWebSocket` 훅)
3. CORS 설정 확인

### 알림이 표시되지 않는 경우
1. 사용자 로그인 상태 확인
2. 알림 권한 설정 확인 (`/api/v1/notifications/settings`)
3. 브라우저 콘솔에서 JavaScript 에러 확인

## 📚 참고 자료
- **백엔드 구현**: `backend/services/notification_scheduler.py`, `backend/websocket/notification_manager.py`
- **프론트엔드 구현**: `frontend/src/components/NotificationToast.tsx`, `frontend/src/components/NotificationBar.tsx`
- **API 문서**: `backend/api/v1/notifications.py`

---

**📅 테스트 완료 체크리스트**
- [ ] 백엔드 서버 정상 실행
- [ ] 프론트엔드 서버 정상 실행  
- [ ] 테스트 알림 API 호출 성공
- [ ] 실시간 토스트 알림 표시 확인
- [ ] 알림 메뉴 기능 확인
- [ ] WebSocket 연결 확인
- [ ] 우선순위별 알림 동작 확인
- [ ] API 무한 루프 문제 해결 확인