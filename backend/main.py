"""
플래너 프로젝트 백엔드 메인 애플리케이션

이 파일은 FastAPI 기반의 웹 API 서버의 진입점입니다.
팀 기반 할일 관리 및 협업 플랫폼의 모든 API 엔드포인트를 관리합니다.

주요 기능:
- FastAPI 애플리케이션 초기화 및 설정
- 미들웨어 등록 (CORS, 로깅, 보안)
- API 라우터 등록
- 헬스체크 및 상태 확인 엔드포인트
- 애플리케이션 생명주기 관리
"""

import os
import sys
from pathlib import Path

# 백엔드 디렉토리를 Python 경로에 추가
# 이는 상대 경로 임포트 문제를 해결하기 위함
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# FastAPI 및 관련 라이브러리 임포트
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import uvicorn
from datetime import datetime, timedelta
import logging
from typing import List, Optional, Dict, Any
import json
import asyncio
from collections import defaultdict
import time
import traceback

# 백엔드 모듈들 임포트
from database import engine, get_db, init_db
from models import Base
from api.v1 import users, teams, planners, todos, posts, replies, likes, invites, notifications, activities, search, ai, email_verification, websocket, time_tracking, productivity
from core.config import settings
from core.logging_config import setup_logging
from middleware.logging_middleware import LoggingMiddleware
from middleware.security_middleware import SecurityMiddleware
from services.monitoring_service import MonitoringService

# 로깅 설정 초기화
setup_logging()
logger = logging.getLogger(__name__)

# 보안 설정 - JWT 토큰 인증을 위한 Bearer 토큰 스키마
security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    애플리케이션 생명주기 관리 함수
    
    이 함수는 FastAPI 애플리케이션이 시작될 때와 종료될 때 실행됩니다.
    
    Args:
        app (FastAPI): FastAPI 애플리케이션 인스턴스
        
    Yields:
        None: 애플리케이션 실행 중
        
    시작 시 실행되는 작업:
    - 데이터베이스 초기화
    - 모니터링 서비스 시작
    
    종료 시 실행되는 작업:
    - 리소스 정리
    - 서비스 종료
    """
    # 애플리케이션 시작 시 실행
    logger.info("🚀 플래너 프로젝트 백엔드 서버 시작 중...")
    
    # 데이터베이스 초기화
    try:
        await init_db()
        logger.info("✅ 데이터베이스 초기화 완료")
    except Exception as e:
        logger.error(f"❌ 데이터베이스 초기화 실패: {e}")
        raise
    
    # 모니터링 서비스 시작
    monitoring_service = MonitoringService()
    app.state.monitoring_service = monitoring_service
    logger.info("✅ 모니터링 서비스 시작")
    
    # 애플리케이션 실행 중
    yield
    
    # 애플리케이션 종료 시 실행
    logger.info("🛑 서버 종료 중...")
    # 모니터링 서비스 종료 (현재 주석 처리됨)
    # if hasattr(app.state, 'monitoring_service'):
    #     await app.state.monitoring_service.shutdown()
    logger.info("✅ 서버 종료 완료")

# FastAPI 애플리케이션 생성
# title: API 문서에 표시될 제목
# description: API에 대한 설명
# version: API 버전
# docs_url: Swagger UI 문서 URL
# redoc_url: ReDoc 문서 URL
# lifespan: 애플리케이션 생명주기 관리 함수
app = FastAPI(
    title="플래너 프로젝트 API",
    description="팀 기반 할일 관리 및 협업 플랫폼",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS (Cross-Origin Resource Sharing) 설정
# 프론트엔드에서 백엔드 API에 접근할 수 있도록 허용
# 프로덕션에서는 특정 도메인만 허용해야 함
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 도메인 허용 (개발 환경용)
    allow_credentials=True,  # 쿠키 및 인증 헤더 허용
    allow_methods=["*"],  # 모든 HTTP 메서드 허용
    allow_headers=["*"],  # 모든 헤더 허용
)

# 커스텀 미들웨어 추가
# 로깅 미들웨어: 모든 요청/응답을 로깅
app.add_middleware(LoggingMiddleware)
# 보안 미들웨어: 보안 관련 헤더 추가 및 요청 검증
app.add_middleware(SecurityMiddleware)

# API 라우터 등록
# 각 기능별로 분리된 라우터들을 메인 앱에 등록
# prefix: 모든 엔드포인트에 공통으로 적용될 경로 접두사
# tags: API 문서에서 그룹화를 위한 태그
app.include_router(users.router, prefix="/api/v1", tags=["users"])
app.include_router(teams.router, prefix="/api/v1", tags=["teams"])
app.include_router(planners.router, prefix="/api/v1", tags=["planners"])
app.include_router(todos.router, prefix="/api/v1", tags=["todos"])
app.include_router(posts.router, prefix="/api/v1", tags=["posts"])
app.include_router(replies.router, prefix="/api/v1", tags=["replies"])
app.include_router(likes.router, prefix="/api/v1", tags=["likes"])
app.include_router(invites.router, prefix="/api/v1", tags=["invites"])
app.include_router(notifications.router, prefix="/api/v1", tags=["notifications"])
app.include_router(activities.router, prefix="/api/v1", tags=["activities"])
app.include_router(search.router, prefix="/api/v1", tags=["search"])
app.include_router(ai.router, prefix="/api/v1", tags=["ai"])
app.include_router(time_tracking.router, prefix="/api/v1", tags=["time-tracking"])
app.include_router(productivity.router, prefix="/api/v1", tags=["productivity"])
app.include_router(email_verification.router, prefix="/api/v1", tags=["email-verification"])
app.include_router(websocket.router, prefix="/api/v1", tags=["websocket"])

@app.get("/")
async def root():
    """
    루트 엔드포인트
    
    API 서버의 기본 정보를 반환합니다.
    
    Returns:
        Dict[str, Any]: 서버 정보를 포함한 딕셔너리
            - message: 서버 설명 메시지
            - version: API 버전
            - status: 서버 상태
            - timestamp: 현재 시간
    """
    return {
        "message": "플래너 프로젝트 API 서버",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """
    헬스 체크 엔드포인트
    
    서버의 상태를 확인하기 위한 엔드포인트입니다.
    Docker 컨테이너의 헬스체크나 로드밸런서에서 사용됩니다.
    
    Returns:
        Dict[str, Any]: 서버 상태 정보
            - status: 서버 상태 ("healthy")
            - timestamp: 현재 시간
            - uptime: 서버 시작 후 경과 시간
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "uptime": time.time()
    }

@app.get("/api")
async def api_info():
    """
    API 정보 엔드포인트
    
    API의 기본 정보와 사용 가능한 엔드포인트를 반환합니다.
    
    Returns:
        Dict[str, Any]: API 정보
            - name: API 이름
            - version: API 버전
            - endpoints: 주요 엔드포인트 목록
    """
    return {
        "name": "플래너 프로젝트 API",
        "version": "1.0.0",
        "endpoints": {
            "docs": "/docs",
            "redoc": "/redoc",
            "health": "/health"
        }
    }

if __name__ == "__main__":
    """
    개발 서버 실행
    
    이 파일을 직접 실행할 때 호출되는 부분입니다.
    개발 환경에서 사용됩니다.
    """
    # 데이터베이스 파일 경로 설정
    # 상대 경로로 SQLite 데이터베이스 파일 위치 지정
    db_path = Path("../data/planner.db")
    os.environ["DATABASE_URL"] = f"sqlite:///{db_path.absolute()}"
    
    # uvicorn 서버 실행
    # host: 모든 IP에서 접근 허용
    # port: 서버 포트
    # reload: 코드 변경 시 자동 재시작 (개발 환경용)
    # log_level: 로그 레벨 설정
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

 