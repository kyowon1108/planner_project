"""
애플리케이션 설정 관리 모듈

이 파일은 Pydantic Settings를 사용하여 애플리케이션의 모든 설정을 관리합니다.
환경 변수, .env 파일, 기본값을 통합하여 일관된 설정을 제공합니다.

주요 기능:
- 애플리케이션 기본 설정
- 데이터베이스 연결 설정
- 인증 및 보안 설정
- 이메일 서비스 설정
- 성능 최적화 설정
- API 제한 설정
- 파일 업로드 설정


"""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """
    애플리케이션 설정 클래스
    
    Pydantic Settings를 상속받아 환경 변수와 .env 파일에서 설정을 로드합니다.
    모든 설정은 타입 힌트를 통해 타입 안전성을 보장합니다.
    
    사용 예시:
        from core.config import settings
        print(settings.app_name)
        print(settings.database_url)
    """
    
    # 기본 애플리케이션 설정
    app_name: str = "Collaborative Planner API"  # 애플리케이션 이름
    debug: bool = True  # 디버그 모드 (개발 환경에서는 True)
    database_url: str = "sqlite:///./planner.db"  # 데이터베이스 연결 URL
    secret_key: str = "your-secret-key-here"  # JWT 토큰 서명용 시크릿 키
    algorithm: str = "HS256"  # JWT 토큰 암호화 알고리즘
    access_token_expire_minutes: int = 30  # 액세스 토큰 만료 시간 (분)
    
    # 이메일 서비스 설정
    # SMTP 서버를 통한 이메일 발송 설정
    environment: str = "development"  # 환경 설정 (development/production)
    smtp_server: str = "smtp.gmail.com"  # SMTP 서버 주소
    smtp_port: int = 587  # SMTP 포트 (587: TLS, 465: SSL)
    smtp_username: str = "your-email@gmail.com"  # SMTP 사용자명 (이메일 주소)
    smtp_password: str = "your-app-password"  # SMTP 비밀번호 (앱 비밀번호)
    from_email: str = "noreply@collaborativeplanner.com"  # 발신자 이메일 주소
    frontend_url: str = "http://localhost:3000"  # 프론트엔드 URL
    
    # 성능 최적화 설정
    # 데이터베이스 연결 풀 설정으로 성능과 안정성 향상
    db_pool_size: int = 10  # 연결 풀 크기 (동시 연결 수)
    db_max_overflow: int = 20  # 최대 오버플로우 연결 수
    db_pool_timeout: int = 30  # 연결 대기 시간 (초)
    db_pool_recycle: int = 1800  # 연결 재생성 주기 (30분)
    db_pool_pre_ping: bool = True  # 연결 전 상태 확인
    
    # 캐시 설정
    # Redis 또는 메모리 캐시 설정
    cache_ttl: int = 300  # 캐시 만료 시간 (5분)
    cache_max_size: int = 1000  # 최대 캐시 항목 수
    
    # API 요청 제한 설정
    # Rate Limiting을 통한 API 보호
    rate_limit_per_minute: int = 100  # 분당 최대 요청 수
    rate_limit_per_hour: int = 1000  # 시간당 최대 요청 수
    
    # 파일 업로드 설정
    # 사용자가 업로드할 수 있는 파일 제한
    max_file_size: int = 10 * 1024 * 1024  # 최대 파일 크기 (10MB)
    allowed_file_types: list = ["jpg", "jpeg", "png", "gif", "pdf", "doc", "docx"]  # 허용된 파일 확장자
    
    # WebSocket 설정
    # 실시간 통신을 위한 WebSocket 설정
    websocket_ping_interval: int = 20  # Ping 간격 (초)
    websocket_ping_timeout: int = 20  # Ping 타임아웃 (초)
    
    # Pydantic 설정
    # .env 파일에서 환경 변수 로드
    model_config = {"env_file": ".env"}

# 전역 설정 인스턴스
# 애플리케이션 전체에서 이 인스턴스를 사용하여 설정에 접근
settings = Settings() 