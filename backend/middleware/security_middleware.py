"""
보안 미들웨어
보안 관련 헤더와 기능을 제공하는 미들웨어입니다.
"""

import time
import hashlib
import secrets
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import StreamingResponse
from typing import Optional, Dict, Any
import json
from datetime import datetime, timedelta
from core.logging_config import get_logger

logger = get_logger(__name__)

class SecurityMiddleware(BaseHTTPMiddleware):
    """보안 미들웨어"""
    
    def __init__(self, app, enable_csrf: bool = True, enable_rate_limit: bool = True):
        super().__init__(app)
        self.enable_csrf = enable_csrf
        self.enable_rate_limit = enable_rate_limit
        self.rate_limit_store = {}  # 간단한 메모리 기반 저장소
    
    async def dispatch(self, request: Request, call_next):
        # 요청 시작 시간
        start_time = time.time()
        
        # 클라이언트 IP 추출
        client_ip = self._get_client_ip(request)
        
        # API 요청과 로그인은 보안 검증 제외
        is_api_request = request.url.path.startswith("/api/")
        is_login_request = request.url.path.endswith("/login")
        is_docs_request = request.url.path.startswith("/docs") or request.url.path.startswith("/redoc")
        
        # Rate Limiting 체크 (API, 로그인, 문서는 제외)
        if self.enable_rate_limit and not (is_api_request or is_login_request or is_docs_request):
            rate_limit_result = self._check_rate_limit(client_ip)
            if not rate_limit_result:
                logger.warning(f"Rate limit exceeded for IP: {client_ip}")
                return Response(
                    content="요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
                    status_code=429,
                    media_type="text/plain"
                )
        
        # CSRF 토큰 검증 (API 요청은 제외)
        if self.enable_csrf and request.method in ["POST", "PUT", "DELETE", "PATCH"] and not is_api_request:
            if not self._validate_csrf_token(request):
                logger.warning(f"CSRF validation failed for IP: {client_ip}")
                return Response(
                    content="CSRF 토큰이 유효하지 않습니다.",
                    status_code=403,
                    media_type="text/plain"
                )
        
        # 응답 생성
        response = await call_next(request)
        
        # 보안 헤더 추가 (API 요청은 제외)
        if not is_api_request:
            self._add_security_headers(response)
        
        # 처리 시간 로깅
        process_time = time.time() - start_time
        if process_time > 1.0:  # 1초 이상 걸린 요청 로깅
            logger.warning(f"Slow request: {request.method} {request.url} - {process_time:.3f}s")
        
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """클라이언트 IP 주소 추출"""
        # 프록시 헤더 확인
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # 기본 클라이언트 IP
        return request.client.host if request.client else "unknown"
    
    def _check_rate_limit(self, client_ip: str) -> bool:
        """Rate Limiting 체크"""
        current_time = time.time()
        window_size = 60  # 1분 윈도우
        max_requests = 1000  # 최대 요청 수 (개발 환경에서는 더 관대하게)
        
        # 클라이언트 IP의 요청 기록 가져오기
        if client_ip not in self.rate_limit_store:
            self.rate_limit_store[client_ip] = []
        
        requests = self.rate_limit_store[client_ip]
        
        # 윈도우 밖의 요청 제거
        requests = [req_time for req_time in requests if current_time - req_time < window_size]
        self.rate_limit_store[client_ip] = requests
        
        # 요청 수 체크
        if len(requests) >= max_requests:
            return False
        
        # 현재 요청 추가
        requests.append(current_time)
        return True
    
    def _validate_csrf_token(self, request: Request) -> bool:
        """CSRF 토큰 검증"""
        # API 요청은 CSRF 검증 제외 (JWT 토큰 사용)
        if request.url.path.startswith("/api/"):
            return True
        
        # CSRF 토큰 확인
        csrf_token = request.headers.get("X-CSRF-Token")
        if not csrf_token:
            return False
        
        # 세션에서 토큰 확인 (실제 구현에서는 세션 사용)
        # 여기서는 간단한 검증만 수행
        return len(csrf_token) >= 32
    
    def _add_security_headers(self, response: Response):
        """보안 헤더 추가"""
        # XSS 방지
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Content Security Policy
        csp_policy = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://fastapi.tiangolo.com; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "img-src 'self' data: https: https://fastapi.tiangolo.com; "
            "font-src 'self'; "
            "connect-src 'self'; "
            "frame-ancestors 'none';"
        )
        response.headers["Content-Security-Policy"] = csp_policy
        
        # HSTS (HTTPS에서만)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Permissions Policy
        permissions_policy = (
            "geolocation=(), "
            "microphone=(), "
            "camera=(), "
            "payment=(), "
            "usb=()"
        )
        response.headers["Permissions-Policy"] = permissions_policy

class ContentSecurityPolicyMiddleware(BaseHTTPMiddleware):
    """Content Security Policy 미들웨어"""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # CSP 헤더 추가
        csp_policy = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://fastapi.tiangolo.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https: https://fastapi.tiangolo.com; "
            "connect-src 'self' ws: wss:; "
            "frame-ancestors 'none';"
        )
        
        response.headers["Content-Security-Policy"] = csp_policy
        return response

class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """요청 로깅 미들웨어"""
    
    async def dispatch(self, request: Request, call_next):
        # 요청 정보 로깅
        client_ip = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent", "unknown")
        
        logger.info(f"요청 시작 - {request.method} {request.url} (IP: {client_ip}, UA: {user_agent[:100]})")
        
        try:
            response = await call_next(request)
            logger.info(f"요청 완료 - {request.method} {request.url} -> {response.status_code}")
            return response
        except Exception as e:
            logger.error(f"요청 실패 - {request.method} {request.url} -> {str(e)}")
            raise
    
    def _get_client_ip(self, request: Request) -> str:
        """클라이언트 IP 주소 추출"""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown" 