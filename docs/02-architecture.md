# 시스템 아키텍처

## 전체 아키텍처 개요

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React)       │◄──►│   (FastAPI)     │◄──►│  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WebSocket     │    │   Redis Cache   │    │   File Storage  │
│   (실시간 통신)    │    │   (세션/캐시)     │    │   (업로드 파일)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Frontend 아키텍처

### 컴포넌트 구조
```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── common/         # 공통 컴포넌트
│   └── [feature]/      # 기능별 컴포넌트
├── pages/              # 페이지 컴포넌트
├── contexts/           # React Context
├── hooks/              # Custom Hooks
├── services/           # API 서비스
├── types/              # TypeScript 타입 정의
└── utils/              # 유틸리티 함수
```

### 상태 관리
- **React Context API**: 전역 상태 관리
- **Local State**: 컴포넌트별 로컬 상태
- **Server State**: API 응답 데이터

### 라우팅
- **React Router**: SPA 라우팅
- **Protected Routes**: 인증 필요 페이지 보호

## Backend 아키텍처

### API 구조
```
api/
├── v1/                 # API 버전 관리
│   ├── auth.py         # 인증 관련
│   ├── users.py        # 사용자 관리
│   ├── teams.py        # 팀 관리
│   ├── planners.py     # 계획 관리
│   ├── todos.py        # 할 일 관리
│   ├── posts.py        # 게시판
│   └── ai.py          # AI 기능
```

### 서비스 레이어
```
services/
├── user_service.py     # 사용자 비즈니스 로직
├── team_service.py     # 팀 비즈니스 로직
├── planner_service.py  # 계획 비즈니스 로직
├── todo_service.py     # 할 일 비즈니스 로직
├── post_service.py     # 게시판 비즈니스 로직
└── ai_service.py      # AI 비즈니스 로직
```

### 데이터 액세스 레이어
```
repositories/
├── base.py            # 기본 리포지토리 클래스
├── user_repository.py # 사용자 데이터 액세스
├── team_repository.py # 팀 데이터 액세스
└── ...
```

## 데이터베이스 설계

### 주요 엔티티
1. **User**: 사용자 정보
2. **Team**: 팀 정보
3. **Planner**: 계획 정보
4. **Todo**: 할 일 정보
5. **Post**: 게시글 정보
6. **Notification**: 알림 정보

### 관계 구조
```
User (1) ─── (N) Team (N) ─── (1) User
User (1) ─── (N) Planner
User (1) ─── (N) Todo
User (1) ─── (N) Post
Team (1) ─── (N) Planner
Team (1) ─── (N) Todo
Team (1) ─── (N) Post
```

## 보안 아키텍처

### 인증 시스템
- **JWT Token**: Access Token + Refresh Token
- **이메일 인증**: 회원가입 시 이메일 확인
- **권한 관리**: Role-based Access Control (RBAC)

### 보안 계층
1. **Rate Limiting**: API 요청 제한
2. **Input Validation**: 입력 데이터 검증
3. **SQL Injection 방지**: ORM 사용
4. **XSS 방지**: 입력 데이터 이스케이프
5. **CSRF 방지**: 토큰 기반 보호

## 실시간 통신

### WebSocket 구조
```
WebSocket Manager
├── Connection Pool
├── Message Router
├── Event Handlers
└── Broadcasting
```

### 이벤트 타입
- **User Events**: 로그인/로그아웃
- **Team Events**: 팀 변경사항
- **Todo Events**: 할 일 상태 변경
- **Notification Events**: 새로운 알림

## 성능 최적화

### Frontend 최적화
- **Code Splitting**: 라우트별 코드 분할
- **Lazy Loading**: 컴포넌트 지연 로딩
- **Memoization**: React.memo, useMemo, useCallback
- **Bundle Optimization**: 웹팩 최적화

### Backend 최적화
- **Database Indexing**: 쿼리 성능 최적화
- **Caching**: Redis 캐시 활용
- **Connection Pooling**: DB 연결 풀링
- **Async Processing**: 비동기 작업 처리

## 모니터링 및 로깅

### 로깅 시스템
- **Structured Logging**: JSON 형태 로그
- **Log Levels**: DEBUG, INFO, WARNING, ERROR
- **Log Aggregation**: 중앙화된 로그 수집

### 모니터링
- **Health Checks**: 서비스 상태 확인
- **Performance Metrics**: 성능 지표 수집
- **Error Tracking**: 에러 추적 및 알림

## 배포 아키텍처

### Docker 컨테이너
```
┌─────────────────┐
│   Nginx         │ (Reverse Proxy)
├─────────────────┤
│   Frontend      │ (React App)
├─────────────────┤
│   Backend       │ (FastAPI)
├─────────────────┤
│   PostgreSQL    │ (Database)
└─────────────────┘
```

### 환경별 설정
- **Development**: 로컬 개발 환경
- **Staging**: 테스트 환경
- **Production**: 운영 환경

## 확장성 고려사항

### 수평 확장
- **Load Balancer**: 트래픽 분산
- **Database Sharding**: 데이터베이스 분할
- **Microservices**: 서비스 분리

### 수직 확장
- **Resource Scaling**: CPU/메모리 증가
- **Database Optimization**: 쿼리 최적화
- **Caching Strategy**: 캐시 전략 