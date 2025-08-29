from fastapi import HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import SQLAlchemyError
import logging
from typing import Union, Dict, Any, Optional
from enum import Enum

logger = logging.getLogger(__name__)

class ErrorCode(Enum):
    """에러 코드 열거형"""
    # 일반 에러
    VALIDATION_ERROR = "VALIDATION_ERROR"
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR"
    AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR"
    NOT_FOUND_ERROR = "NOT_FOUND_ERROR"
    CONFLICT_ERROR = "CONFLICT_ERROR"
    RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR"
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
    DATABASE_ERROR = "DATABASE_ERROR"
    
    # 도메인별 에러
    USER_NOT_FOUND = "USER_NOT_FOUND"
    USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS"
    INVALID_CREDENTIALS = "INVALID_CREDENTIALS"
    EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED"
    
    TEAM_NOT_FOUND = "TEAM_NOT_FOUND"
    TEAM_ACCESS_DENIED = "TEAM_ACCESS_DENIED"
    TEAM_MEMBER_EXISTS = "TEAM_MEMBER_EXISTS"
    TEAM_INVITE_EXISTS = "TEAM_INVITE_EXISTS"
    
    PLANNER_NOT_FOUND = "PLANNER_NOT_FOUND"
    PLANNER_ACCESS_DENIED = "PLANNER_ACCESS_DENIED"
    PLANNER_ALREADY_EXISTS = "PLANNER_ALREADY_EXISTS"
    
    TODO_NOT_FOUND = "TODO_NOT_FOUND"
    TODO_ACCESS_DENIED = "TODO_ACCESS_DENIED"
    TODO_ASSIGNMENT_FAILED = "TODO_ASSIGNMENT_FAILED"
    
    POST_NOT_FOUND = "POST_NOT_FOUND"
    POST_ACCESS_DENIED = "POST_ACCESS_DENIED"
    
    REPLY_NOT_FOUND = "REPLY_NOT_FOUND"
    REPLY_ACCESS_DENIED = "REPLY_ACCESS_DENIED"
    
    NOTIFICATION_NOT_FOUND = "NOTIFICATION_NOT_FOUND"
    NOTIFICATION_ACCESS_DENIED = "NOTIFICATION_ACCESS_DENIED"

class CustomHTTPException(HTTPException):
    """커스텀 HTTP 예외 클래스"""
    def __init__(self, status_code: int, detail: str, error_code: str = "HTTP_ERROR", metadata: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code
        self.metadata = metadata or {}

class ValidationError(CustomHTTPException):
    """검증 에러"""
    def __init__(self, detail: str, metadata: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=422, detail=detail, error_code=ErrorCode.VALIDATION_ERROR.value, metadata=metadata)

class AuthenticationError(CustomHTTPException):
    """인증 에러"""
    def __init__(self, detail: str = "인증이 필요합니다", metadata: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=401, detail=detail, error_code=ErrorCode.AUTHENTICATION_ERROR.value, metadata=metadata)

class AuthorizationError(CustomHTTPException):
    """권한 에러"""
    def __init__(self, detail: str = "권한이 없습니다", metadata: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=403, detail=detail, error_code=ErrorCode.AUTHORIZATION_ERROR.value, metadata=metadata)

class NotFoundError(CustomHTTPException):
    """리소스 없음 에러"""
    def __init__(self, detail: str = "리소스를 찾을 수 없습니다", metadata: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=404, detail=detail, error_code=ErrorCode.NOT_FOUND_ERROR.value, metadata=metadata)

class ConflictError(CustomHTTPException):
    """충돌 에러"""
    def __init__(self, detail: str = "리소스가 이미 존재합니다", metadata: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=409, detail=detail, error_code=ErrorCode.CONFLICT_ERROR.value, metadata=metadata)

class RateLimitError(CustomHTTPException):
    """Rate Limit 에러"""
    def __init__(self, detail: str = "요청이 너무 많습니다", metadata: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=429, detail=detail, error_code=ErrorCode.RATE_LIMIT_ERROR.value, metadata=metadata)

class InternalServerError(CustomHTTPException):
    """내부 서버 에러"""
    def __init__(self, detail: str = "내부 서버 오류가 발생했습니다", metadata: Optional[Dict[str, Any]] = None):
        super().__init__(status_code=500, detail=detail, error_code=ErrorCode.INTERNAL_SERVER_ERROR.value, metadata=metadata)

# 도메인별 예외 클래스들

class UserNotFoundError(NotFoundError):
    """사용자를 찾을 수 없음"""
    def __init__(self, user_id: Optional[Union[int, str]] = None):
        detail = f"사용자를 찾을 수 없습니다: {user_id}" if user_id else "사용자를 찾을 수 없습니다"
        super().__init__(detail=detail)

class UserAlreadyExistsError(ConflictError):
    """사용자가 이미 존재함"""
    def __init__(self, email: Optional[str] = None):
        detail = f"이미 존재하는 사용자입니다: {email}" if email else "이미 존재하는 사용자입니다"
        super().__init__(detail=detail)

class InvalidCredentialsError(AuthenticationError):
    """잘못된 인증 정보"""
    def __init__(self):
        super().__init__(detail="이메일 또는 비밀번호가 올바르지 않습니다")

class EmailNotVerifiedError(AuthenticationError):
    """이메일 미인증"""
    def __init__(self):
        super().__init__(detail="이메일 인증이 필요합니다")

class TeamNotFoundError(NotFoundError):
    """팀을 찾을 수 없음"""
    def __init__(self, team_id: Optional[Union[int, str]] = None):
        detail = f"팀을 찾을 수 없습니다: {team_id}" if team_id else "팀을 찾을 수 없습니다"
        super().__init__(detail=detail)

class TeamAccessDeniedError(AuthorizationError):
    """팀 접근 권한 없음"""
    def __init__(self, team_id: Optional[Union[int, str]] = None):
        detail = f"팀에 대한 접근 권한이 없습니다: {team_id}" if team_id else "팀에 대한 접근 권한이 없습니다"
        super().__init__(detail=detail)

class TeamMemberExistsError(ConflictError):
    """팀 멤버가 이미 존재함"""
    def __init__(self, user_id: Optional[Union[int, str]] = None):
        detail = f"이미 팀 멤버입니다: {user_id}" if user_id else "이미 팀 멤버입니다"
        super().__init__(detail=detail)

class TeamInviteExistsError(ConflictError):
    """팀 초대가 이미 존재함"""
    def __init__(self, email: Optional[str] = None):
        detail = f"이미 초대된 이메일입니다: {email}" if email else "이미 초대된 이메일입니다"
        super().__init__(detail=detail)

class PlannerNotFoundError(NotFoundError):
    """플래너를 찾을 수 없음"""
    def __init__(self, planner_id: Optional[Union[int, str]] = None):
        detail = f"플래너를 찾을 수 없습니다: {planner_id}" if planner_id else "플래너를 찾을 수 없습니다"
        super().__init__(detail=detail)

class PlannerAccessDeniedError(AuthorizationError):
    """플래너 접근 권한 없음"""
    def __init__(self, planner_id: Optional[Union[int, str]] = None):
        detail = f"플래너에 대한 접근 권한이 없습니다: {planner_id}" if planner_id else "플래너에 대한 접근 권한이 없습니다"
        super().__init__(detail=detail)

class PlannerAlreadyExistsError(ConflictError):
    """플래너가 이미 존재함"""
    def __init__(self, title: Optional[str] = None):
        detail = f"이미 존재하는 플래너입니다: {title}" if title else "이미 존재하는 플래너입니다"
        super().__init__(detail=detail)

class TodoNotFoundError(NotFoundError):
    """할일을 찾을 수 없음"""
    def __init__(self, todo_id: Optional[Union[int, str]] = None):
        detail = f"할일을 찾을 수 없습니다: {todo_id}" if todo_id else "할일을 찾을 수 없습니다"
        super().__init__(detail=detail)

class TodoAccessDeniedError(AuthorizationError):
    """할일 접근 권한 없음"""
    def __init__(self, todo_id: Optional[Union[int, str]] = None):
        detail = f"할일에 대한 접근 권한이 없습니다: {todo_id}" if todo_id else "할일에 대한 접근 권한이 없습니다"
        super().__init__(detail=detail)

class TodoAssignmentFailedError(ConflictError):
    """할일 할당 실패"""
    def __init__(self, user_id: Optional[Union[int, str]] = None):
        detail = f"할일 할당에 실패했습니다: {user_id}" if user_id else "할일 할당에 실패했습니다"
        super().__init__(detail=detail)

class PostNotFoundError(NotFoundError):
    """게시글을 찾을 수 없음"""
    def __init__(self, post_id: Optional[Union[int, str]] = None):
        detail = f"게시글을 찾을 수 없습니다: {post_id}" if post_id else "게시글을 찾을 수 없습니다"
        super().__init__(detail=detail)

class PostAccessDeniedError(AuthorizationError):
    """게시글 접근 권한 없음"""
    def __init__(self, post_id: Optional[Union[int, str]] = None):
        detail = f"게시글에 대한 접근 권한이 없습니다: {post_id}" if post_id else "게시글에 대한 접근 권한이 없습니다"
        super().__init__(detail=detail)

class ReplyNotFoundError(NotFoundError):
    """댓글을 찾을 수 없음"""
    def __init__(self, reply_id: Optional[Union[int, str]] = None):
        detail = f"댓글을 찾을 수 없습니다: {reply_id}" if reply_id else "댓글을 찾을 수 없습니다"
        super().__init__(detail=detail)

class ReplyAccessDeniedError(AuthorizationError):
    """댓글 접근 권한 없음"""
    def __init__(self, reply_id: Optional[Union[int, str]] = None):
        detail = f"댓글에 대한 접근 권한이 없습니다: {reply_id}" if reply_id else "댓글에 대한 접근 권한이 없습니다"
        super().__init__(detail=detail)

class NotificationNotFoundError(NotFoundError):
    """알림을 찾을 수 없음"""
    def __init__(self, notification_id: Optional[Union[int, str]] = None):
        detail = f"알림을 찾을 수 없습니다: {notification_id}" if notification_id else "알림을 찾을 수 없습니다"
        super().__init__(detail=detail)

class NotificationAccessDeniedError(AuthorizationError):
    """알림 접근 권한 없음"""
    def __init__(self, notification_id: Optional[Union[int, str]] = None):
        detail = f"알림에 대한 접근 권한이 없습니다: {notification_id}" if notification_id else "알림에 대한 접근 권한이 없습니다"
        super().__init__(detail=detail)

# 에러 핸들러들

async def http_exception_handler(request, exc: CustomHTTPException):
    """커스텀 HTTP 예외 핸들러"""
    logger.error(f"HTTP Exception: {exc.status_code} - {exc.detail} - {exc.error_code}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.detail,
                "status_code": exc.status_code,
                "metadata": exc.metadata
            }
        }
    )

async def validation_exception_handler(request, exc: RequestValidationError):
    """검증 에러 핸들러"""
    logger.error(f"Validation Error: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": ErrorCode.VALIDATION_ERROR.value,
                "message": "입력 데이터가 올바르지 않습니다",
                "details": exc.errors(),
                "status_code": 422
            }
        }
    )

async def sqlalchemy_exception_handler(request, exc: SQLAlchemyError):
    """SQLAlchemy 에러 핸들러"""
    logger.error(f"Database Error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": ErrorCode.DATABASE_ERROR.value,
                "message": "데이터베이스 오류가 발생했습니다",
                "details": str(exc) if request.app.debug else "내부 오류",
                "status_code": 500
            }
        }
    )

async def general_exception_handler(request, exc: Exception):
    """일반 예외 핸들러"""
    logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": ErrorCode.INTERNAL_SERVER_ERROR.value,
                "message": "예상치 못한 오류가 발생했습니다",
                "details": str(exc) if request.app.debug else "내부 오류",
                "status_code": 500
            }
        }
    ) 