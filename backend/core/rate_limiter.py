from fastapi import HTTPException, Request
from typing import Dict, Tuple
import time
from core.config import settings

class RateLimiter:
    def __init__(self):
        self._requests: Dict[str, list] = {}
        self._max_requests_per_minute = settings.rate_limit_per_minute
        self._max_requests_per_hour = settings.rate_limit_per_hour

    def _get_client_ip(self, request: Request) -> str:
        """클라이언트 IP를 가져옵니다."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _clean_old_requests(self, client_ip: str, window_seconds: int):
        """오래된 요청을 정리합니다."""
        current_time = time.time()
        if client_ip in self._requests:
            self._requests[client_ip] = [
                req_time for req_time in self._requests[client_ip]
                if current_time - req_time < window_seconds
            ]

    def check_rate_limit(self, request: Request, window_seconds: int = 60):
        """Rate limit을 확인합니다."""
        client_ip = self._get_client_ip(request)
        current_time = time.time()
        
        # 오래된 요청 정리
        self._clean_old_requests(client_ip, window_seconds)
        
        # 현재 요청 수 확인
        if client_ip not in self._requests:
            self._requests[client_ip] = []
        
        request_count = len(self._requests[client_ip])
        max_requests = self._max_requests_per_minute if window_seconds == 60 else self._max_requests_per_hour
        
        if request_count >= max_requests:
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Maximum {max_requests} requests per {window_seconds} seconds."
            )
        
        # 현재 요청 시간 추가
        self._requests[client_ip].append(current_time)

    def get_remaining_requests(self, request: Request, window_seconds: int = 60) -> Tuple[int, int]:
        """남은 요청 수를 반환합니다."""
        client_ip = self._get_client_ip(request)
        self._clean_old_requests(client_ip, window_seconds)
        
        if client_ip not in self._requests:
            return self._max_requests_per_minute if window_seconds == 60 else self._max_requests_per_hour, 0
        
        current_requests = len(self._requests[client_ip])
        max_requests = self._max_requests_per_minute if window_seconds == 60 else self._max_requests_per_hour
        remaining = max(0, max_requests - current_requests)
        
        return remaining, current_requests

# 싱글톤 인스턴스
rate_limiter = RateLimiter() 