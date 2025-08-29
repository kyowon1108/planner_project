"""
팀 모델 정의

이 파일은 팀(Team)과 팀 멤버(TeamMember) 엔티티의 SQLAlchemy 모델을 정의합니다.
팀 기반 협업을 위한 데이터베이스 스키마와 관계를 포함합니다.

주요 기능:
- 팀 기본 정보 관리 (이름, 설명)
- 팀 멤버 관리 (역할 기반)
- 팀과 다른 엔티티와의 관계 정의
- 생성/수정 시간 자동 관리


"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base
from services.time_service import TimeService

class Team(Base):
    """
    팀 엔티티 모델
    
    이 클래스는 팀과 관련된 모든 정보를 데이터베이스에 저장합니다.
    팀 기반 협업의 핵심 엔티티로, 멤버들과 플래너, 게시물을 관리합니다.
    
    주요 필드:
    - id: 팀 고유 식별자 (자동 증가)
    - name: 팀 이름
    - description: 팀 설명
    - created_at: 팀 생성 시간
    - updated_at: 팀 정보 수정 시간
    
    API 응답용 필드 (데이터베이스 컬럼 아님):
    - member_count: 팀 멤버 수
    - owner_id: 팀 소유자 ID
    - owner_name: 팀 소유자 이름
    
    관계:
    - members: 팀에 속한 멤버들 (TeamMember를 통한 일대다)
    - planners: 팀에서 생성한 플래너들
    - posts: 팀에서 작성한 게시물들
    
    사용 예시:
        team = Team(
            name="개발팀",
            description="웹 개발 프로젝트 팀"
        )
        db.add(team)
        db.commit()
    """
    
    # 테이블명 정의
    __tablename__ = "teams"

    # 기본 정보 필드
    id = Column(Integer, primary_key=True, index=True)  # 기본 키, 자동 증가, 인덱스
    name = Column(String, nullable=False)  # 팀 이름 (필수)
    description = Column(Text)  # 팀 설명 (선택)
    
    # 시간 정보 필드 (자동 관리)
    created_at = Column(DateTime(timezone=True), default=TimeService.now_kst)  # 생성 시간 (한국 시간)
    updated_at = Column(DateTime(timezone=True), default=TimeService.now_kst, onupdate=TimeService.now_kst)  # 수정 시간 (자동 업데이트)

    # API 응답용 추가 필드 (데이터베이스 컬럼 아님)
    # 이 필드들은 API 응답 시 동적으로 계산되어 설정됨
    member_count = None  # 팀 멤버 수
    owner_id = None  # 팀 소유자 ID
    owner_name = None  # 팀 소유자 이름

    # 관계 정의
    # 팀에 속한 멤버들 (TeamMember를 통한 일대다 관계)
    members = relationship("TeamMember", back_populates="team")
    
    # 팀에서 생성한 플래너들 (일대다 관계)
    planners = relationship("Planner", back_populates="team")
    
    # 팀에서 작성한 게시물들 (일대다 관계)
    posts = relationship("Post", back_populates="team")

class TeamMember(Base):
    """
    팀 멤버 엔티티 모델
    
    이 클래스는 사용자와 팀 간의 관계를 관리합니다.
    다대다 관계를 구현하며, 각 멤버의 역할을 정의합니다.
    
    주요 필드:
    - id: 팀 멤버 고유 식별자 (자동 증가)
    - team_id: 소속 팀 ID (외래 키)
    - user_id: 사용자 ID (외래 키)
    - role: 팀 내 역할 (owner, admin, member)
    - joined_at: 팀 가입 시간
    
    역할 정의:
    - owner: 팀 소유자 (팀 삭제, 멤버 관리 가능)
    - admin: 팀 관리자 (멤버 초대, 플래너 관리 가능)
    - member: 일반 멤버 (기본 권한)
    
    관계:
    - team: 소속 팀
    - user: 팀 멤버 사용자
    
    사용 예시:
        team_member = TeamMember(
            team_id=1,
            user_id=1,
            role="admin"
        )
        db.add(team_member)
        db.commit()
    """
    
    # 테이블명 정의
    __tablename__ = "team_members"

    # 기본 정보 필드
    id = Column(Integer, primary_key=True, index=True)  # 기본 키, 자동 증가, 인덱스
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)  # 팀 ID (외래 키, 필수)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # 사용자 ID (외래 키, 필수)
    role = Column(String, default="editor")  # 팀 내 역할 (기본값: editor)
    joined_at = Column(DateTime(timezone=True), default=TimeService.now_kst)  # 가입 시간 (한국 시간)

    # 관계 정의
    team = relationship("Team", back_populates="members")  # 소속 팀
    user = relationship("User", back_populates="teams")  # 팀 멤버 사용자 