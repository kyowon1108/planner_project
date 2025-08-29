"""
사용자 모델 정의

이 파일은 사용자(User) 엔티티의 SQLAlchemy 모델을 정의합니다.
사용자와 관련된 모든 데이터베이스 스키마와 관계를 포함합니다.

주요 기능:
- 사용자 기본 정보 관리 (이름, 이메일, 비밀번호)
- 이메일 인증 상태 관리
- 다른 엔티티와의 관계 정의 (팀, 플래너, 게시물 등)
- 생성/수정 시간 자동 관리


"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
from services.time_service import TimeService

class User(Base):
    """
    사용자 엔티티 모델
    
    이 클래스는 사용자와 관련된 모든 정보를 데이터베이스에 저장합니다.
    SQLAlchemy ORM을 사용하여 객체-관계 매핑을 제공합니다.
    
    주요 필드:
    - id: 사용자 고유 식별자 (자동 증가)
    - name: 사용자 이름
    - email: 이메일 주소 (고유값, 인덱스)
    - password: 해시된 비밀번호
    - is_email_verified: 이메일 인증 완료 여부
    - email_verification_token: 이메일 인증 토큰
    - email_verification_expires: 토큰 만료 시간
    - created_at: 계정 생성 시간
    - updated_at: 정보 수정 시간
    
    관계:
    - teams: 사용자가 속한 팀들 (TeamMember를 통한 다대다)
    - planners: 사용자가 생성한 플래너들
    - posts: 사용자가 작성한 게시물들
    - notifications: 사용자에게 온 알림들
    - activities: 사용자의 활동 기록들
    - todos: 사용자가 생성한 할일들
    - assigned_todos: 사용자에게 할당된 할일들
    - email_verifications: 사용자의 이메일 인증 기록들
    - likes: 사용자가 좋아요한 게시물들
    - replies: 사용자가 작성한 댓글들
    
    사용 예시:
        user = User(
            name="홍길동",
            email="hong@example.com",
            password="hashed_password"
        )
        db.add(user)
        db.commit()
    """
    
    # 테이블명 정의
    __tablename__ = "users"

    # 기본 정보 필드
    id = Column(Integer, primary_key=True, index=True)  # 기본 키, 자동 증가, 인덱스
    name = Column(String, nullable=False)  # 사용자 이름 (필수)
    email = Column(String, unique=True, index=True, nullable=False)  # 이메일 (고유, 인덱스, 필수)
    password = Column(String, nullable=False)  # 해시된 비밀번호 (필수)
    
    # 이메일 인증 관련 필드
    is_email_verified = Column(Boolean, default=False)  # 이메일 인증 완료 여부 (기본값: False)
    email_verification_token = Column(String, nullable=True)  # 이메일 인증 토큰 (선택)
    email_verification_expires = Column(DateTime(timezone=True), nullable=True)  # 토큰 만료 시간 (선택)
    
    # 시간 정보 필드 (자동 관리)
    created_at = Column(DateTime(timezone=True), default=TimeService.now_kst)  # 생성 시간 (한국 시간)
    updated_at = Column(DateTime(timezone=True), default=TimeService.now_kst, onupdate=TimeService.now_kst)  # 수정 시간 (자동 업데이트)

    # 관계 정의
    # 사용자가 속한 팀들 (TeamMember를 통한 다대다 관계)
    teams = relationship("TeamMember", back_populates="user")
    
    # 사용자가 생성한 플래너들 (일대다 관계)
    planners = relationship("Planner", back_populates="creator")
    
    # 사용자가 작성한 게시물들 (일대다 관계)
    posts = relationship("Post", back_populates="author")
    
    # 사용자에게 온 알림들 (일대다 관계)
    notifications = relationship("Notification", back_populates="user")
    
    # 사용자의 활동 기록들 (일대다 관계)
    activities = relationship("Activity", back_populates="user")
    
    # 사용자가 생성한 할일들 (일대다 관계)
    todos = relationship("Todo", foreign_keys="[Todo.created_by]", back_populates="creator")
    
    # 사용자에게 할당된 할일들 (다대다 관계, todo_assignments 테이블을 통함)
    assigned_todos = relationship("Todo", secondary="todo_assignments", back_populates="assignees")
    
    # 사용자의 이메일 인증 기록들 (일대다 관계)
    email_verifications = relationship("EmailVerification", back_populates="user")
    
    # 사용자가 좋아요한 게시물들 (일대다 관계)
    likes = relationship("Like", back_populates="user")
    
    # 사용자가 작성한 댓글들 (일대다 관계)
    replies = relationship("Reply", back_populates="author")
 