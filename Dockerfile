# 통합 빌드 Dockerfile
# 이 파일은 전체 애플리케이션을 빌드하기 위한 통합 Dockerfile입니다.
# 각 서비스는 독립적으로 빌드되지만, 하나의 명령으로 전체를 관리할 수 있습니다.

# 백엔드 빌드 스테이지
FROM python:3.11-slim as backend-build

# 시스템 패키지 업데이트 및 필요한 패키지 설치
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /app

# Python 의존성 설치
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 백엔드 코드 복사
COPY backend/ .

# 프론트엔드 빌드 스테이지
FROM node:18-alpine as frontend-build

# 작업 디렉토리 설정
WORKDIR /app

# package.json과 package-lock.json 복사
COPY frontend/package*.json ./

# 의존성 설치
RUN npm ci

# 프론트엔드 소스 코드 복사
COPY frontend/ .

# 빌드
RUN npm run build

# 최종 프로덕션 이미지
FROM nginx:alpine

# nginx 설정 복사
COPY frontend/nginx.conf /etc/nginx/nginx.conf

# 빌드된 프론트엔드 파일 복사
COPY --from=frontend-build /app/build /usr/share/nginx/html

# 백엔드 실행을 위한 Python 환경 설정
FROM python:3.11-slim as backend-runtime

# 시스템 패키지 설치
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 비root 사용자 생성
RUN useradd --create-home --shell /bin/bash app

# 작업 디렉토리 설정
WORKDIR /app

# Python 의존성 설치
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 백엔드 코드 복사
COPY --from=backend-build /app .

# 소유권 변경
RUN chown -R app:app /app
USER app

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 포트 노출
EXPOSE 8000

# 백엔드 서버 실행
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# 개발 환경
FROM python:3.11-slim as development

# 시스템 패키지 업데이트 및 필요한 패키지 설치
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /app

# Python 의존성 설치
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 개발 도구 설치
RUN pip install --no-cache-dir \
    pytest \
    pytest-cov \
    pytest-asyncio \
    black \
    isort \
    flake8 \
    mypy \
    bandit

# 백엔드 코드 복사
COPY backend/ .

# 개발 서버 실행
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# 테스트 환경
FROM python:3.11-slim as test

# 시스템 패키지 업데이트 및 필요한 패키지 설치
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /app

# Python 의존성 설치
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 테스트 도구 설치
RUN pip install --no-cache-dir \
    pytest \
    pytest-cov \
    pytest-asyncio \
    pytest-xdist \
    pytest-mock \
    pytest-env \
    pytest-benchmark

# 백엔드 코드 복사
COPY backend/ .

# 테스트 실행
CMD ["pytest", "tests/", "-v", "--cov=.", "--cov-report=xml", "--cov-report=html"] 