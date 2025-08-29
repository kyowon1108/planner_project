"""
로깅 미들웨어 모듈

이 파일은 FastAPI 애플리케이션의 모든 HTTP 요청과 응답을 로깅하는 미들웨어를 정의합니다.
구조화된 로깅을 통해 API 성능 모니터링과 디버깅을 지원합니다.

주요 기능:
- 모든 API 요청/응답 로깅
- 요청 처리 시간 측정
- 느린 요청 감지 및 경고
- 로그인 요청 특별 처리
- 성능 모니터링


"""

import time
import json
import uuid
from typing import Dict, Any, Optional
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import StreamingResponse
from core.logging_config import get_structured_logger

class LoggingMiddleware(BaseHTTPMiddleware):
    """
    요청/응답 로깅 미들웨어
    
    이 클래스는 모든 HTTP 요청과 응답을 구조화된 형태로 로깅합니다.
    요청 처리 시간, 상태 코드, 클라이언트 정보 등을 기록하여
    API 성능 모니터링과 디버깅을 지원합니다.
    
    주요 기능:
    - 모든 API 요청/응답 로깅
    - 요청 처리 시간 측정
    - 느린 요청 감지 (3초 이상)
    - 로그인 요청 특별 처리 (민감한 정보 제외)
    - 구조화된 로그 형식
    
    사용 예시:
        app.add_middleware(LoggingMiddleware)
    """
    
    def __init__(self, app):
        """
        LoggingMiddleware 초기화
        
        Args:
            app: FastAPI 애플리케이션 인스턴스
        """
        super().__init__(app)
        self.structured_logger = get_structured_logger("api.middleware")
    
    async def dispatch(self, request: Request, call_next):
        """
        HTTP 요청을 처리하고 로깅하는 메서드
        
        모든 HTTP 요청을 가로채서 요청 정보를 로깅하고,
        응답 처리 후 결과를 로깅합니다.
        
        Args:
            request (Request): FastAPI 요청 객체
            call_next: 다음 미들웨어 또는 엔드포인트를 호출하는 함수
            
        Returns:
            Response: HTTP 응답 객체
            
        로깅 정보:
        - 요청 ID (UUID)
        - HTTP 메서드 (GET, POST 등)
        - 엔드포인트 경로
        - 클라이언트 IP 주소
        - 요청 처리 시간
        - 응답 상태 코드
        - 오류 메시지 (실패 시)
        """
        # 로그인 요청은 최소한의 로깅만 (민감한 정보 보호)
        is_login_request = request.url.path.endswith("/login")
        
        if is_login_request:
            # 로그인 요청은 간단한 로깅만 (비밀번호 등 민감한 정보 제외)
            start_time = time.time()
            try:
                response = await call_next(request)
                process_time = time.time() - start_time
                
                # 로그인 성공/실패만 간단히 로깅
                if response.status_code == 200:
                    self.structured_logger.info("로그인 성공", execution_time=round(process_time, 3))
                else:
                    self.structured_logger.warning("로그인 실패", status_code=response.status_code, execution_time=round(process_time, 3))
                
                return response
            except Exception as e:
                process_time = time.time() - start_time
                self.structured_logger.error("로그인 오류", error_message=str(e), execution_time=round(process_time, 3))
                raise
        
        # 일반 요청은 상세한 로깅 수행
        request_id = str(uuid.uuid4())  # 고유 요청 ID 생성
        start_time = time.time()
        
        # 요청 정보 추출
        client_ip = request.client.host if request.client else "unknown"
        method = request.method
        path = request.url.path
        
        # 요청 시작 로깅
        self.structured_logger.info(
            "API 요청 시작",
            request_id=request_id,
            method=method,
            endpoint=path,
            ip_address=client_ip
        )
        
        try:
            # 다음 미들웨어 또는 엔드포인트 호출
            response = await call_next(request)
            process_time = time.time() - start_time
            
            # 요청 완료 로깅
            self.structured_logger.info(
                "API 요청 완료",
                request_id=request_id,
                method=method,
                endpoint=path,
                status_code=response.status_code,
                execution_time=round(process_time, 3)
            )
            
            # 느린 요청 감지 및 경고 (3초 이상)
            if process_time > 3.0:
                self.structured_logger.warning(
                    "느린 API 요청 감지",
                    request_id=request_id,
                    method=method,
                    endpoint=path,
                    execution_time=round(process_time, 3)
                )
            
            return response
            
        except Exception as e:
            # 요청 처리 중 오류 발생 시 로깅
            process_time = time.time() - start_time
            self.structured_logger.error(
                "API 요청 실패",
                request_id=request_id,
                method=method,
                endpoint=path,
                error_message=str(e),
                execution_time=round(process_time, 3)
            )
            raise

class PerformanceMiddleware(BaseHTTPMiddleware):
    """
    성능 모니터링 미들웨어
    
    이 클래스는 API 성능을 모니터링하고 느린 요청을 감지합니다.
    로그인 요청은 성능 모니터링에서 제외하여 보안을 유지합니다.
    
    주요 기능:
    - 요청 처리 시간 측정
    - 느린 요청 감지 및 경고
    - 성능 메트릭 수집
    - 로그인 요청 제외
    
    사용 예시:
        app.add_middleware(PerformanceMiddleware)
    """
    
    def __init__(self, app):
        """
        PerformanceMiddleware 초기화
        
        Args:
            app: FastAPI 애플리케이션 인스턴스
        """
        super().__init__(app)
        self.structured_logger = get_structured_logger("performance")
    
    async def dispatch(self, request: Request, call_next):
        """
        성능 모니터링을 수행하는 메서드
        
        요청 처리 시간을 측정하고, 느린 요청을 감지하여 경고를 로깅합니다.
        로그인 요청은 성능 모니터링에서 제외합니다.
        
        Args:
            request (Request): FastAPI 요청 객체
            call_next: 다음 미들웨어 또는 엔드포인트를 호출하는 함수
            
        Returns:
            Response: HTTP 응답 객체
        """
        # 로그인 요청은 성능 모니터링 제외 (보안상 민감한 정보 보호)
        if request.url.path.endswith("/login"):
            return await call_next(request)
        
        # 성능 측정 시작
        start_time = time.time()
        
        try:
            # 요청 처리
            response = await call_next(request)
            process_time = time.time() - start_time
            
            # 느린 요청 감지 (5초 이상)
            if process_time > 5.0:
                self.structured_logger.warning(
                    "느린 요청 감지",
                    method=request.method,
                    endpoint=request.url.path,
                    execution_time=round(process_time, 3),
                    status_code=response.status_code
                )
            
            # 매우 느린 요청 감지 (10초 이상)
            if process_time > 10.0:
                self.structured_logger.error(
                    "매우 느린 요청 감지",
                    method=request.method,
                    endpoint=request.url.path,
                    execution_time=round(process_time, 3),
                    status_code=response.status_code
                )
            
            return response
            
        except Exception as e:
            # 오류 발생 시 성능 정보와 함께 로깅
            process_time = time.time() - start_time
            self.structured_logger.error(
                "요청 처리 오류",
                method=request.method,
                endpoint=request.url.path,
                error_message=str(e),
                execution_time=round(process_time, 3)
            )
            raise 