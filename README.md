# 플래너 프로젝트

팀 기반 할일 관리 및 협업 플랫폼

## 🚀 기술 스택

### 백엔드
- **FastAPI**: 현대적이고 빠른 웹 프레임워크
- **SQLAlchemy**: ORM 및 데이터베이스 관리
- **SQLite**: 개발용 데이터베이스 (프로덕션에서는 PostgreSQL 권장)
- **JWT**: 사용자 인증
- **Alembic**: 데이터베이스 마이그레이션
- **Pydantic**: 데이터 검증 및 직렬화

### 프론트엔드
- **React**: 사용자 인터페이스
- **TypeScript**: 타입 안전성
- **Material-UI (MUI)**: 컴포넌트 라이브러리
- **React Router**: 클라이언트 사이드 라우팅
- **Context API**: 전역 상태 관리 (인증, 테마)

### 아키텍처
- **Repository Pattern**: 데이터 접근 계층 추상화
- **Service Layer**: 비즈니스 로직 분리
- **Context API**: React 전역 상태 관리
- **Theme System**: 다크모드/라이트모드 지원

## 📁 프로젝트 구조

```
planner_project/
├── backend/                 # 백엔드 API 서버
│   ├── api/v1/             # API 엔드포인트
│   ├── core/               # 핵심 설정 및 유틸리티
│   ├── models/             # 데이터베이스 모델
│   ├── repositories/       # 데이터 접근 계층
│   ├── services/           # 비즈니스 로직
│   ├── schemas/            # Pydantic 스키마
│   ├── tests/              # 테스트 코드
│   ├── Dockerfile          # 백엔드 전용 Dockerfile
│   └── requirements.txt    # Python 의존성
├── frontend/               # 프론트엔드 애플리케이션
│   ├── src/                # 소스 코드
│   ├── public/             # 정적 파일
│   ├── Dockerfile          # 프론트엔드 전용 Dockerfile
│   └── package.json        # Node.js 의존성
├── Dockerfile              # 통합 빌드용 Dockerfile
├── docker-compose.yml      # 전체 서비스 오케스트레이션
└── README.md              # 프로젝트 문서
```

## 🎨 주요 기능

### 👥 팀 관리
- 팀 생성 및 관리
- 팀원 초대 및 권한 관리
- 팀별 할일 및 플래너 관리

### 📅 플래너 관리
- 개인/팀 플래너 생성
- 일정 관리 및 할일 연동
- 플래너 공유 및 협업

### ✅ 할일 관리
- 개인/팀 할일 생성
- 우선순위 및 상태 관리
- 마감일 알림 및 추적

### 📝 게시글 및 댓글
- 팀 내 게시글 작성
- 댓글 및 좋아요 기능
- 게시글 검색 및 필터링

### 🌙 다크모드 지원
- 전역 다크모드/라이트모드 전환
- 인증 페이지는 항상 라이트모드 유지
- 사용자 선호도 저장

### 📧 이메일 인증
- 회원가입 시 이메일 인증
- 인증 코드 자동 발송
- 보안 강화된 계정 관리

## 🐳 Docker 구조

### Docker Compose 사용법

#### 개발 환경
```bash
# 전체 개발 환경 시작
docker-compose up

# 백엔드만 시작
docker-compose up backend

# 프론트엔드만 시작
docker-compose up frontend
```

#### 개별 서비스 빌드
```bash
# 백엔드 빌드
docker build -f backend/Dockerfile -t planner-backend ./backend

# 프론트엔드 빌드
docker build -f frontend/Dockerfile -t planner-frontend ./frontend
```

## 🛠️ 환경 설정

### 1. 백엔드 설정

#### 필수 환경 변수
```bash
# backend/.env 파일 생성 (선택사항 - 기본값 사용 가능)
DATABASE_URL=sqlite:///./planner.db  # SQLite 사용 (기본값)
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=true
ENVIRONMENT=development
```

#### SMTP 설정 (이메일 인증용 - 선택사항)
```bash
# Gmail 사용 시
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Gmail 앱 비밀번호
FROM_EMAIL=noreply@yourdomain.com
```

### 2. 프론트엔드 설정

```bash
# frontend/.env 파일 생성 (선택사항 - 기본값 사용 가능)
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
```

## 🚀 빠른 시작

### 1. 개발 환경 설정

#### 백엔드 개발 서버 실행
```bash
# 저장소 클론
git clone <repository-url>
cd planner_project

# 백엔드 실행
cd backend
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 또는 Python 스크립트로 실행
python3 main.py
```

#### 프론트엔드 개발 서버 실행
```bash
cd frontend
npm install
npm start
```

### 2. Docker Compose로 전체 환경 시작
```bash
# 전체 서비스 시작
docker-compose up -d

# 서비스 확인
docker-compose ps
```

### 3. 데이터베이스 초기화
```bash
# Alembic을 사용한 마이그레이션 (백엔드 실행 시 자동으로 처리됨)
cd backend
alembic upgrade head
```

## 📧 이메일 인증

### Gmail 앱 비밀번호 생성
1. Google 계정 설정 → 보안
2. 2단계 인증 활성화
3. 앱 비밀번호 생성
4. 생성된 비밀번호를 `SMTP_PASSWORD`에 설정

### 이메일 인증 플로우
1. 사용자 회원가입
2. 이메일 인증 코드 자동 발송
3. 사용자가 이메일에서 인증 코드 확인
4. 인증 완료 후 서비스 이용 가능

## 🔧 최근 개선사항

### 🌙 다크모드 구현
- **전역 테마 시스템**: ThemeContext를 통한 다크모드/라이트모드 관리
- **인증 페이지 독립성**: 로그인/회원가입/이메일인증 페이지는 항상 라이트모드
- **사용자 선호도 저장**: localStorage를 통한 테마 설정 유지
- **Material-UI 테마 통합**: MUI 컴포넌트와 완벽 호환

### 🧹 코드 정리
- **불필요한 파일 제거**: UXAnalytics, LogViewer, TeamSelector 등 사용하지 않는 컴포넌트 삭제
- **백엔드 최적화**: query_optimizer.py 등 사용하지 않는 서비스 제거
- **테스트 파일 정리**: 사용하지 않는 테스트 파일들 제거

### 🎨 UI/UX 개선
- **격려 메시지 주기 조정**: 8초 → 30초로 변경하여 덜 방해적이도록 개선
- **일관된 디자인**: 모든 페이지에서 통일된 다크모드 스타일링
- **반응형 디자인**: 모바일과 데스크톱에서 모두 최적화된 레이아웃

### 🔒 보안 강화
- **JWT 토큰**: 안전한 사용자 인증
- **비밀번호 해싱**: bcrypt 알고리즘 사용
- **입력 검증**: Pydantic을 통한 데이터 검증
- **CORS 설정**: 프론트엔드-백엔드 통신 보안

## 🧪 테스트

### 백엔드 테스트
```bash
cd backend
pytest tests/ -v
```

### 프론트엔드 테스트
```bash
cd frontend
npm test
```

### 개발 서버 실행
```bash
# 백엔드 (포트 8000)
cd backend
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 프론트엔드 (포트 3000)
cd frontend
npm start
```

## 📊 API 문서

### Swagger UI
- API 문서: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 주요 엔드포인트
- **인증**: `/api/v1/auth/*`
- **팀 관리**: `/api/v1/teams/*`
- **플래너**: `/api/v1/planners/*`
- **할일**: `/api/v1/todos/*`
- **게시글**: `/api/v1/posts/*`
- **이메일 인증**: `/api/v1/email-verification/*`

## 🚀 배포

### Docker Compose 배포
```bash
# 프로덕션 환경으로 배포
docker-compose up -d

# 서비스 상태 확인
docker-compose ps
```

### 개별 서비스 배포
```bash
# 백엔드 배포
docker build -f backend/Dockerfile -t planner-backend ./backend
docker run -p 8000:8000 planner-backend

# 프론트엔드 배포
docker build -f frontend/Dockerfile -t planner-frontend ./frontend
docker run -p 3000:3000 planner-frontend
```

## 🤝 개발 가이드

### 코드 스타일
- **Python**: Black, isort, flake8 사용
- **TypeScript**: ESLint, Prettier 사용
- **커밋 메시지**: Conventional Commits 형식

### 브랜치 전략
- `main`: 프로덕션 브랜치
- `develop`: 개발 브랜치
- `feature/*`: 기능 개발 브랜치
- `hotfix/*`: 긴급 수정 브랜치

### 개발 팁
- **다크모드 개발**: ThemeContext를 통해 전역 테마 관리
- **인증 페이지**: 로그인/회원가입/이메일인증은 독립적인 라이트 테마 사용
- **환경 변수**: 선택사항이므로 기본값으로도 동작 가능
- **데이터베이스**: SQLite 사용으로 별도 설정 불필요

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.
