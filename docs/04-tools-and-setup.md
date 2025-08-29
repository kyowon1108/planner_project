# 도구 사용법 및 설정

## 개발 환경 설정

### 필수 요구사항
- **Node.js**: 18.x 이상
- **Python**: 3.9 이상
- **Docker**: 20.x 이상
- **Git**: 2.x 이상

### 초기 설정

#### 1. 저장소 클론
```bash
git clone <repository-url>
cd planner_project
```

#### 2. 환경 변수 설정
```bash
# Frontend 환경 변수
cp frontend/env.example frontend/.env

# Backend 환경 변수
cp backend/.env.example backend/.env
```

#### 3. Docker 컨테이너 실행
```bash
docker-compose up -d
```

## Frontend 개발

### 개발 서버 실행
```bash
cd frontend
npm install
npm start
```

### 빌드
```bash
npm run build
```

### 테스트 실행
```bash
# 단위 테스트
npm test

# E2E 테스트
npm run cypress:open
```

### 코드 품질 검사
```bash
# 린팅
npm run lint

# 타입 체크
npm run type-check

# 포맷팅
npm run format
```

## Backend 개발

### 가상환경 설정
```bash
cd backend
python -m venv venv
source venv/bin/activate  # macOS/Linux
# 또는
venv\Scripts\activate  # Windows
```

### 의존성 설치
```bash
pip install -r requirements.txt
```

### 개발 서버 실행
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 데이터베이스 마이그레이션
```bash
# 마이그레이션 생성
alembic revision --autogenerate -m "description"

# 마이그레이션 적용
alembic upgrade head
```

### 테스트 실행
```bash
# 단위 테스트
pytest

# 커버리지 포함 테스트
pytest --cov=.

# 특정 테스트 파일
pytest tests/test_api.py
```

## 데이터베이스 관리

### PostgreSQL 접속
```bash
# Docker 컨테이너 내부 접속
docker exec -it planner_project_postgres_1 psql -U postgres -d planner_db

# 로컬 PostgreSQL 접속
psql -h localhost -U postgres -d planner_db
```

### 데이터베이스 백업/복원
```bash
# 백업
pg_dump -h localhost -U postgres planner_db > backup.sql

# 복원
psql -h localhost -U postgres planner_db < backup.sql
```

## Docker 사용법

### 컨테이너 관리
```bash
# 모든 서비스 시작
docker-compose up -d

# 특정 서비스만 시작
docker-compose up -d backend

# 로그 확인
docker-compose logs -f

# 컨테이너 중지
docker-compose down

# 볼륨 포함 삭제
docker-compose down -v
```

### 이미지 빌드
```bash
# 전체 빌드
docker-compose build

# 특정 서비스만 빌드
docker-compose build frontend
```

## 개발 도구

### VS Code 설정

#### 추천 확장 프로그램
- **Python**: Python 언어 지원
- **ES7+ React/Redux/React-Native snippets**: React 코드 스니펫
- **Prettier**: 코드 포맷팅
- **ESLint**: JavaScript/TypeScript 린팅
- **GitLens**: Git 히스토리 관리
- **Docker**: Docker 컨테이너 관리

#### 설정 파일
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "python.defaultInterpreterPath": "./backend/venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true
}
```

### Git 설정

#### 커밋 메시지 템플릿
```bash
# .gitmessage 템플릿 설정
git config --global commit.template .gitmessage
```

#### 브랜치 전략
- **main**: 프로덕션 브랜치
- **develop**: 개발 브랜치
- **feature/***: 기능 개발 브랜치
- **hotfix/***: 긴급 수정 브랜치

## 디버깅 도구

### Frontend 디버깅
```bash
# React DevTools 설치
npm install -g react-devtools

# 개발자 도구 실행
react-devtools
```

### Backend 디버깅
```python
# VS Code launch.json 설정
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "program": "${workspaceFolder}/backend/main.py",
      "console": "integratedTerminal",
      "cwd": "${workspaceFolder}/backend"
    }
  ]
}
```

## 성능 모니터링

### Frontend 성능 분석
```bash
# 번들 분석
npm run build -- --analyze

# 성능 측정
npm run lighthouse
```

### Backend 성능 분석
```python
# 프로파일링
import cProfile
import pstats

def profile_function():
    profiler = cProfile.Profile()
    profiler.enable()
    # 함수 실행
    profiler.disable()
    stats = pstats.Stats(profiler)
    stats.sort_stats('cumulative')
    stats.print_stats()
```

## 로깅 설정

### Frontend 로깅
```javascript
// utils/logger.ts
import { logger } from './logger';

logger.info('User action', { action: 'login', userId: 123 });
logger.error('API error', { error: 'Network timeout' });
```

### Backend 로깅
```python
# core/logging_config.py
import logging

logger = logging.getLogger(__name__)
logger.info('Database query executed', extra={'query_time': 0.5})
logger.error('Authentication failed', extra={'user_id': 123})
```

## 배포 도구

### CI/CD 파이프라인
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: |
          cd frontend && npm test
          cd backend && pytest
```

### 환경별 설정
```bash
# 개발 환경
NODE_ENV=development
DATABASE_URL=postgresql://localhost/planner_dev

# 스테이징 환경
NODE_ENV=staging
DATABASE_URL=postgresql://staging-db/planner_staging

# 프로덕션 환경
NODE_ENV=production
DATABASE_URL=postgresql://prod-db/planner_prod
```

## 문제 해결

### 일반적인 문제들

#### 1. 포트 충돌
```bash
# 포트 사용 중인 프로세스 확인
lsof -i :3000
lsof -i :8000

# 프로세스 종료
kill -9 <PID>
```

#### 2. 데이터베이스 연결 실패
```bash
# PostgreSQL 상태 확인
docker-compose ps postgres

# 로그 확인
docker-compose logs postgres

# 컨테이너 재시작
docker-compose restart postgres
```

#### 3. 의존성 문제
```bash
# Frontend
rm -rf node_modules package-lock.json
npm install

# Backend
rm -rf venv
python -m venv venv
pip install -r requirements.txt
```

#### 4. 캐시 문제
```bash
# Docker 캐시 정리
docker system prune -a

# npm 캐시 정리
npm cache clean --force
```

## 유용한 명령어

### 개발 생산성 향상
```bash
# 모든 테스트 실행
npm run test:all

# 코드 품질 검사
npm run quality-check

# 개발 환경 전체 시작
npm run dev:start

# 로그 모니터링
npm run logs
```

### 데이터베이스 관리
```bash
# 마이그레이션 상태 확인
alembic current

# 마이그레이션 히스토리
alembic history

# 데이터베이스 초기화
alembic downgrade base
alembic upgrade head
``` 