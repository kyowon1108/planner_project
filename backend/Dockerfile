# 백엔드 전용 Dockerfile
# 이 파일은 백엔드 API 서버만을 위한 Dockerfile입니다.

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
COPY requirements.txt .
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

# 애플리케이션 코드 복사
COPY . .

# 개발 서버 실행
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# 프로덕션 빌드
FROM python:3.11-slim as production

# 시스템 패키지 업데이트 및 필요한 패키지 설치
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
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY . .

# 소유권 변경
RUN chown -R app:app /app
USER app

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 포트 노출
EXPOSE 8000

# 프로덕션 서버 실행
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# 테스트 빌드
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
COPY requirements.txt .
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

# 애플리케이션 코드 복사
COPY . .

# 테스트 실행
CMD ["pytest", "tests/", "-v", "--cov=.", "--cov-report=xml", "--cov-report=html"] 