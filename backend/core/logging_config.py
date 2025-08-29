import logging
import logging.handlers
import os
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional
from core.config import settings

# 로그 디렉토리 생성
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)

class JSONFormatter(logging.Formatter):
    """JSON 형식 로그 포맷터"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        # 예외 정보가 있으면 추가
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        # 추가 필드가 있으면 추가
        if hasattr(record, 'extra_fields'):
            extra_fields = getattr(record, 'extra_fields', None)
            if extra_fields:
                log_entry.update(extra_fields)
        
        return json.dumps(log_entry, ensure_ascii=False)

class ColoredFormatter(logging.Formatter):
    """컬러 로그 포맷터"""
    
    COLORS = {
        'DEBUG': '\033[36m',    # Cyan
        'INFO': '\033[32m',     # Green
        'WARNING': '\033[33m',  # Yellow
        'ERROR': '\033[31m',    # Red
        'CRITICAL': '\033[35m', # Magenta
        'RESET': '\033[0m'      # Reset
    }
    
    def format(self, record):
        # 로그 레벨에 따른 색상 적용
        color = self.COLORS.get(record.levelname, self.COLORS['RESET'])
        record.levelname = f"{color}{record.levelname}{self.COLORS['RESET']}"
        return super().format(record)

class StructuredLogger:
    """구조화된 로거 클래스"""
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
    
    def _log_with_context(self, level: int, message: str, **kwargs):
        """컨텍스트 정보와 함께 로그 기록"""
        extra_fields = {
            "user_id": kwargs.get("user_id"),
            "request_id": kwargs.get("request_id"),
            "endpoint": kwargs.get("endpoint"),
            "method": kwargs.get("method"),
            "ip_address": kwargs.get("ip_address"),
            "execution_time": kwargs.get("execution_time"),
            "status_code": kwargs.get("status_code"),
            "error_code": kwargs.get("error_code")
        }
        
        # None 값 제거
        extra_fields = {k: v for k, v in extra_fields.items() if v is not None}
        
        record = self.logger.makeRecord(
            self.logger.name, level, "", 0, message, (), None
        )
        record.extra_fields = extra_fields
        self.logger.handle(record)
    
    def debug(self, message: str, **kwargs):
        self._log_with_context(logging.DEBUG, message, **kwargs)
    
    def info(self, message: str, **kwargs):
        self._log_with_context(logging.INFO, message, **kwargs)
    
    def warning(self, message: str, **kwargs):
        self._log_with_context(logging.WARNING, message, **kwargs)
    
    def error(self, message: str, **kwargs):
        self._log_with_context(logging.ERROR, message, **kwargs)
    
    def critical(self, message: str, **kwargs):
        self._log_with_context(logging.CRITICAL, message, **kwargs)

def setup_logging():
    """로깅 설정"""
    
    # 루트 로거 설정
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG if settings.debug else logging.INFO)
    
    # 기존 핸들러 제거
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # 콘솔 핸들러 (컬러)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG if settings.debug else logging.INFO)
    
    console_formatter = ColoredFormatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)
    
    # JSON 파일 핸들러 (구조화된 로그)
    json_handler = logging.handlers.RotatingFileHandler(
        log_dir / "app.json",
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    json_handler.setLevel(logging.INFO)
    json_handler.setFormatter(JSONFormatter())
    root_logger.addHandler(json_handler)
    
    # 일반 파일 핸들러
    file_handler = logging.handlers.RotatingFileHandler(
        log_dir / "app.log",
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    file_handler.setLevel(logging.INFO)
    
    file_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    file_handler.setFormatter(file_formatter)
    root_logger.addHandler(file_handler)
    
    # 에러 로그 파일 핸들러
    error_handler = logging.handlers.RotatingFileHandler(
        log_dir / "error.log",
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(file_formatter)
    root_logger.addHandler(error_handler)
    
    # 성능 로그 파일 핸들러
    performance_handler = logging.handlers.RotatingFileHandler(
        log_dir / "performance.log",
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding='utf-8'
    )
    performance_handler.setLevel(logging.INFO)
    performance_handler.setFormatter(JSONFormatter())
    root_logger.addHandler(performance_handler)
    
    # 특정 라이브러리 로그 레벨 조정
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    
    return root_logger

def get_logger(name: str) -> logging.Logger:
    """로거 인스턴스 반환"""
    return logging.getLogger(name)

def get_structured_logger(name: str) -> StructuredLogger:
    """구조화된 로거 인스턴스 반환"""
    return StructuredLogger(name) 