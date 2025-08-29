# Planner Project

팀 기반 계획 관리 시스템

## 📋 프로젝트 개요

Planner Project는 팀원들이 함께 계획을 세우고, 할 일을 관리하며, 소통할 수 있는 통합 플랫폼입니다.

### 주요 기능
- 👥 **팀 관리**: 팀 생성, 멤버 초대, 권한 관리
- 📅 **계획 관리**: 일정별 계획 생성 및 공유
- ✅ **할 일 관리**: 개인/팀 할 일 생성 및 추적
- 💬 **게시판**: 팀별 소통 공간
- 🤖 **AI 기능**: 할 일 추천 및 스마트 검색
- 📊 **실시간 알림**: WebSocket 기반 실시간 업데이트

## 🏗️ 프로젝트 구조

```
planner_project/
├── docs/                    # 프로젝트 문서
│   ├── 01-project-overview.md      # 프로젝트 전체 개요
│   ├── 02-architecture.md          # 시스템 아키텍처
│   ├── 03-implementation-plan.md   # 구현 계획
│   ├── 04-tools-and-setup.md      # 도구 사용법 및 설정
│   ├── 05-coding-standards.md     # 코딩 표준 및 안전장치
│   └── features/                   # 개별 기능 상세 문서
│       ├── feature-001-auth.md    # 인증 시스템
│       └── ...
├── prompts/                 # AI 프롬프트 템플릿
│   ├── system-prompt.md           # 기본 시스템 프롬프트
│   ├── tdd-prompt.md             # TDD 전용 프롬프트
│   └── review-prompt.md          # 코드 리뷰 프롬프트
├── templates/               # 코드 템플릿
│   ├── feature-template.md       # 기능 문서 템플릿
│   ├── test-template.md          # 테스트 템플릿
│   └── commit-template.md        # 커밋 메시지 템플릿
├── frontend/               # React 프론트엔드
├── backend/                # FastAPI 백엔드
├── data/                   # 데이터 및 로그
└── venv/                   # Python 가상환경
```

## 🚀 빠른 시작

### 필수 요구사항
- Node.js 18.x 이상
- Python 3.9 이상
- Docker 20.x 이상
- Git 2.x 이상

### 설치 및 실행

1. **저장소 클론**
```bash
git clone <repository-url>
cd planner_project
```

2. **환경 변수 설정**
```bash
# Frontend 환경 변수
cp frontend/env.example frontend/.env

# Backend 환경 변수
cp backend/.env.example backend/.env
```

3. **Docker 컨테이너 실행**
```bash
docker-compose up -d
```

4. **개발 서버 실행**
```bash
# Frontend (새 터미널)
cd frontend
npm install
npm start

# Backend (새 터미널)
cd backend
python -m venv venv
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload
```

5. **브라우저에서 접속**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API 문서: http://localhost:8000/docs

## 📚 문서

### 개발 가이드
- [프로젝트 개요](docs/01-project-overview.md) - 프로젝트 전체 소개
- [시스템 아키텍처](docs/02-architecture.md) - 기술적 설계
- [구현 계획](docs/03-implementation-plan.md) - 개발 로드맵
- [도구 사용법](docs/04-tools-and-setup.md) - 개발 환경 설정
- [코딩 표준](docs/05-coding-standards.md) - 코드 품질 가이드
- [백엔드 리팩토링 가이드](docs/06-backend-refactoring-guide.md) - 백엔드 리팩토링 명령어
- [프론트엔드 리팩토링 가이드](docs/07-frontend-refactoring-guide.md) - 프론트엔드 리팩토링 명령어

### 기능 문서
- [인증 시스템](docs/features/feature-001-auth.md) - 사용자 인증
- [팀 관리](docs/features/feature-002-teams.md) - 팀 기능
- [할 일 관리](docs/features/feature-003-todos.md) - 할 일 기능
- [게시판](docs/features/feature-004-posts.md) - 게시판 기능

### AI 프롬프트
- [시스템 프롬프트](prompts/system-prompt.md) - 기본 개발 가이드
- [TDD 프롬프트](prompts/tdd-prompt.md) - 테스트 주도 개발
- [코드 리뷰 프롬프트](prompts/review-prompt.md) - 코드 검토
- [리팩토링 프롬프트](prompts/refactor-prompt.md) - 백엔드 리팩토링
- [프론트엔드 리팩토링 프롬프트](prompts/frontend-refactor-prompt.md) - 프론트엔드 리팩토링

## 🛠️ 기술 스택

### Frontend
- **Framework**: React 18 + TypeScript
- **State Management**: React Context API
- **UI Library**: Custom components with CSS modules
- **Testing**: Jest, React Testing Library, Cypress
- **Build Tool**: Create React App

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens
- **Real-time**: WebSocket support
- **Testing**: pytest
- **Documentation**: OpenAPI/Swagger

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database Migration**: Alembic
- **Logging**: Structured logging
- **Monitoring**: Custom analytics dashboard

## 🧪 테스트

### Frontend 테스트
```bash
cd frontend
npm test                    # 단위 테스트
npm run test:coverage      # 커버리지 포함 테스트
npm run cypress:open       # E2E 테스트
```

### Backend 테스트
```bash
cd backend
pytest                     # 단위 테스트
pytest --cov=.            # 커버리지 포함 테스트
pytest tests/test_api.py  # 특정 테스트 파일
```

## 📦 배포

### 개발 환경
```bash
docker-compose up -d
```

### 프로덕션 환경
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 기여하기

### 개발 워크플로우
1. 이슈 생성 또는 기존 이슈 확인
2. 기능 브랜치 생성 (`feature/기능명`)
3. 개발 및 테스트
4. 코드 리뷰 요청
5. 메인 브랜치로 병합

### 커밋 메시지 규칙
```
<type>(<scope>): <subject>

<body>

<footer>
```

**타입**: feat, fix, docs, style, refactor, test, chore
**스코프**: frontend, backend, api, db, auth, ui, test, docs, ci

### 코드 품질
- TypeScript/ESLint 규칙 준수
- Python PEP 8 규칙 준수
- 테스트 커버리지 80% 이상
- 코드 리뷰 필수

## 📊 프로젝트 상태

### 완료된 기능 ✅
- 사용자 인증 시스템
- 팀 관리 기능
- 할 일 관리 시스템
- 게시판 기능
- 실시간 알림 시스템
- AI 추천 시스템

### 진행 중인 기능 🔄
- UX 분석 대시보드
- 성능 최적화
- 모바일 반응형 개선

### 계획된 기능 📋
- 소셜 로그인
- 2단계 인증
- 고급 AI 기능
- 모바일 앱

## 🐛 문제 해결

### 일반적인 문제들

#### 포트 충돌
```bash
lsof -i :3000  # Frontend 포트 확인
lsof -i :8000  # Backend 포트 확인
kill -9 <PID>  # 프로세스 종료
```

#### 데이터베이스 연결 실패
```bash
docker-compose ps postgres  # PostgreSQL 상태 확인
docker-compose logs postgres # 로그 확인
docker-compose restart postgres # 재시작
```

#### 의존성 문제
```bash
# Frontend
rm -rf node_modules package-lock.json
npm install

# Backend
rm -rf venv
python -m venv venv
pip install -r requirements.txt
```

## 📞 지원

### 문서
- [개발 가이드](docs/04-tools-and-setup.md)
- [문제 해결](docs/04-tools-and-setup.md#문제-해결)
- [FAQ](docs/01-project-overview.md#faq)

### 이슈 보고
- [GitHub Issues](https://github.com/your-repo/issues)
- [기능 요청](https://github.com/your-repo/issues/new?template=feature_request.md)
- [버그 리포트](https://github.com/your-repo/issues/new?template=bug_report.md)

## 📄 라이선스

이 프로젝트는 [MIT 라이선스](LICENSE) 하에 배포됩니다.

## 🙏 감사의 말

- React 팀 - 훌륭한 프론트엔드 프레임워크
- FastAPI 팀 - 현대적인 Python 웹 프레임워크
- PostgreSQL 팀 - 안정적인 데이터베이스
- 모든 기여자들 - 프로젝트 발전에 기여

---

**Planner Project** - 팀과 함께 성장하는 계획 관리 플랫폼
