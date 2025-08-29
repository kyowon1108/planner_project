from enum import Enum
from typing import Optional, Callable, Any, List, Dict
from functools import wraps
from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from models.team import TeamMember
from models.user import User
from database import get_db
from api.v1.users import get_current_user

class Role(str, Enum):
    OWNER = "owner"          # 소유자 (모든 권한)
    ADMIN = "admin"          # 관리자 (거의 모든 권한)
    MANAGER = "manager"      # 매니저 (팀 관리 + 콘텐츠 관리)
    EDITOR = "editor"        # 편집자 (콘텐츠 생성/수정)
    VIEWER = "viewer"        # 조회자 (읽기 전용)
    GUEST = "guest"          # 게스트 (제한적 접근)

class Permission(str, Enum):
    # 팀 관리 권한 (8개)
    TEAM_CREATE = "team_create"                    # 팀 생성
    TEAM_UPDATE = "team_update"                    # 팀 정보 수정
    TEAM_DELETE = "team_delete"                    # 팀 삭제
    TEAM_INVITE = "team_invite"                    # 멤버 초대
    TEAM_REMOVE_OWNER = "team_remove_owner"        # OWNER 제거
    TEAM_REMOVE_ADMIN = "team_remove_admin"        # ADMIN 제거
    TEAM_REMOVE_MEMBER = "team_remove_member"      # 일반 멤버 제거
    TEAM_VIEW_ANALYTICS = "team_view_analytics"    # 팀 분석 조회
    
    # 플래너 관리 권한 (6개)
    PLANNER_CREATE = "planner_create"              # 플래너 생성
    PLANNER_UPDATE = "planner_update"              # 플래너 수정
    PLANNER_DELETE = "planner_delete"              # 플래너 삭제
    PLANNER_ASSIGN = "planner_assign"              # 플래너 담당자 지정
    PLANNER_VIEW = "planner_view"                  # 플래너 조회
    PLANNER_APPROVE = "planner_approve"            # 플래너 승인
    
    # 할 일 관리 권한 (6개)
    TODO_CREATE = "todo_create"                    # 할 일 생성
    TODO_UPDATE = "todo_update"                    # 할 일 수정
    TODO_DELETE = "todo_delete"                    # 할 일 삭제
    TODO_ASSIGN = "todo_assign"                    # 할 일 담당자 지정
    TODO_VIEW = "todo_view"                        # 할 일 조회
    TODO_COMPLETE = "todo_complete"                # 할 일 완료 처리
    
    # 게시글 관리 권한 (5개)
    POST_CREATE = "post_create"                    # 게시글 작성
    POST_UPDATE = "post_update"                    # 게시글 수정
    POST_DELETE = "post_delete"                    # 게시글 삭제
    POST_VIEW = "post_view"                        # 게시글 조회
    POST_APPROVE = "post_approve"                  # 게시글 승인

# 역할별 권한 정의 (6개 역할)
ROLE_PERMISSIONS: Dict[Role, List[Permission]] = {
    Role.OWNER: [
        # 팀 관리 - 모든 권한
        Permission.TEAM_CREATE, Permission.TEAM_UPDATE, Permission.TEAM_DELETE,
        Permission.TEAM_INVITE, Permission.TEAM_REMOVE_OWNER, 
        Permission.TEAM_REMOVE_ADMIN, Permission.TEAM_REMOVE_MEMBER,
        Permission.TEAM_VIEW_ANALYTICS,
        
        # 플래너 관리 - 모든 권한
        Permission.PLANNER_CREATE, Permission.PLANNER_UPDATE, 
        Permission.PLANNER_DELETE, Permission.PLANNER_ASSIGN,
        Permission.PLANNER_VIEW, Permission.PLANNER_APPROVE,
        
        # 할 일 관리 - 모든 권한
        Permission.TODO_CREATE, Permission.TODO_UPDATE, 
        Permission.TODO_DELETE, Permission.TODO_ASSIGN,
        Permission.TODO_VIEW, Permission.TODO_COMPLETE,
        
        # 게시글 관리 - 모든 권한
        Permission.POST_CREATE, Permission.POST_UPDATE, Permission.POST_DELETE,
        Permission.POST_VIEW, Permission.POST_APPROVE
    ],
    
    Role.ADMIN: [
        # 팀 관리 - 제한적 권한
        Permission.TEAM_UPDATE, Permission.TEAM_INVITE, 
        Permission.TEAM_REMOVE_MEMBER, Permission.TEAM_VIEW_ANALYTICS,
        
        # 플래너 관리 - 모든 권한
        Permission.PLANNER_CREATE, Permission.PLANNER_UPDATE,
        Permission.PLANNER_DELETE, Permission.PLANNER_ASSIGN,
        Permission.PLANNER_VIEW, Permission.PLANNER_APPROVE,
        
        # 할 일 관리 - 모든 권한
        Permission.TODO_CREATE, Permission.TODO_UPDATE, 
        Permission.TODO_DELETE, Permission.TODO_ASSIGN,
        Permission.TODO_VIEW, Permission.TODO_COMPLETE,
        
        # 게시글 관리 - 모든 권한
        Permission.POST_CREATE, Permission.POST_UPDATE, Permission.POST_DELETE,
        Permission.POST_VIEW, Permission.POST_APPROVE
    ],
    
    Role.MANAGER: [
        # 팀 관리 - 제한적 권한
        Permission.TEAM_INVITE, Permission.TEAM_REMOVE_MEMBER,
        Permission.TEAM_VIEW_ANALYTICS,
        
        # 플래너 관리 - 생성/수정/조회
        Permission.PLANNER_CREATE, Permission.PLANNER_UPDATE,
        Permission.PLANNER_ASSIGN, Permission.PLANNER_VIEW,
        
        # 할 일 관리 - 모든 권한
        Permission.TODO_CREATE, Permission.TODO_UPDATE, 
        Permission.TODO_DELETE, Permission.TODO_ASSIGN,
        Permission.TODO_VIEW, Permission.TODO_COMPLETE,
        
        # 게시글 관리 - 생성/수정/조회
        Permission.POST_CREATE, Permission.POST_UPDATE,
        Permission.POST_VIEW
    ],
    
    Role.EDITOR: [
        # 팀 관리 - 권한 없음
        
        # 플래너 관리 - 생성/수정/조회
        Permission.PLANNER_CREATE, Permission.PLANNER_UPDATE,
        Permission.PLANNER_VIEW,
        
        # 할 일 관리 - 생성/수정/조회
        Permission.TODO_CREATE, Permission.TODO_UPDATE, 
        Permission.TODO_VIEW, Permission.TODO_COMPLETE,
        
        # 게시글 관리 - 생성/수정/조회
        Permission.POST_CREATE, Permission.POST_UPDATE,
        Permission.POST_VIEW
    ],
    
    Role.VIEWER: [
        # 팀 관리 - 권한 없음
        
        # 플래너 관리 - 조회만
        Permission.PLANNER_VIEW,
        
        # 할 일 관리 - 조회만
        Permission.TODO_VIEW,
        
        # 게시글 관리 - 조회만
        Permission.POST_VIEW
    ],
    
    Role.GUEST: [
        # 팀 관리 - 권한 없음
        
        # 플래너 관리 - 제한적 조회
        Permission.PLANNER_VIEW,
        
        # 할 일 관리 - 제한적 조회
        Permission.TODO_VIEW,
        
        # 게시글 관리 - 제한적 조회
        Permission.POST_VIEW
    ]
}

# 역할 우선순위 정의
ROLE_PRIORITY = {
    Role.OWNER: 6,
    Role.ADMIN: 5,
    Role.MANAGER: 4,
    Role.EDITOR: 3,
    Role.VIEWER: 2,
    Role.GUEST: 1
}

def get_user_role_in_team(db: Session, user_id: int, team_id: int) -> Role | None:
    """팀에서 사용자의 역할을 가져옵니다."""
    team_member = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == user_id
    ).first()
    
    if not team_member:
        return None  # 팀 멤버가 아님
    
    return Role(team_member.role)

def has_permission(user_role: Role | None, permission: Permission) -> bool:
    """사용자가 특정 권한을 가지고 있는지 확인합니다."""
    if not user_role:
        return False
    return permission in ROLE_PERMISSIONS.get(user_role, [])

def require_permission(permission: Permission):
    """특정 권한이 필요한 의존성을 생성합니다."""
    def permission_dependency(
        team_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        user_id = 0
        if hasattr(current_user, 'id') and current_user.id is not None:
            try:
                user_id = int(str(current_user.id))
            except (ValueError, TypeError):
                user_id = 0
        user_role = get_user_role_in_team(db, user_id, team_id)
        if not has_permission(user_role, permission):
            raise HTTPException(
                status_code=403,
                detail=f"권한이 없습니다. 필요한 권한: {permission}"
            )
        return user_role
    
    return permission_dependency

def require_role(minimum_role: Role):
    """최소 역할이 필요한 의존성을 생성합니다."""
    def role_dependency(
        team_id: int,
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        user_id = 0
        if hasattr(current_user, 'id') and current_user.id is not None:
            try:
                user_id = int(str(current_user.id))
            except (ValueError, TypeError):
                user_id = 0
        user_role = get_user_role_in_team(db, user_id, team_id)
        
        if not user_role or ROLE_PRIORITY.get(user_role, 0) < ROLE_PRIORITY.get(minimum_role, 0):
            raise HTTPException(
                status_code=403,
                detail=f"권한이 없습니다. 필요한 최소 역할: {minimum_role}"
            )
        return user_role
    
    return role_dependency 

def can_remove_member(current_user_id: int, target_user_id: int, current_user_role: Role, target_user_role: Role) -> bool:
    """멤버 제거 권한을 확인합니다."""
    # 자신을 제거할 수 없음
    if current_user_id == target_user_id:
        return False
    
    # OWNER는 모든 멤버 제거 가능 (자신 제외)
    if current_user_role == Role.OWNER:
        return True
    
    # ADMIN은 MANAGER 이하만 제거 가능
    if current_user_role == Role.ADMIN and ROLE_PRIORITY.get(target_user_role, 0) <= ROLE_PRIORITY.get(Role.MANAGER, 0):
        return True
    
    # MANAGER는 EDITOR 이하만 제거 가능
    if current_user_role == Role.MANAGER and ROLE_PRIORITY.get(target_user_role, 0) <= ROLE_PRIORITY.get(Role.EDITOR, 0):
        return True
    
    return False

def get_role_description(role: Role) -> str:
    """역할에 대한 설명을 반환합니다."""
    role_descriptions = {
        Role.OWNER: "소유자 - 모든 권한을 가집니다",
        Role.ADMIN: "관리자 - 거의 모든 권한을 가집니다",
        Role.MANAGER: "매니저 - 팀 관리와 콘텐츠 관리 권한을 가집니다",
        Role.EDITOR: "편집자 - 콘텐츠 생성과 수정 권한을 가집니다",
        Role.VIEWER: "조회자 - 읽기 전용 권한을 가집니다",
        Role.GUEST: "게스트 - 제한적인 읽기 권한을 가집니다"
    }
    return role_descriptions.get(role, "알 수 없는 역할")

def get_permission_description(permission: Permission) -> str:
    """권한에 대한 설명을 반환합니다."""
    permission_descriptions = {
        # 팀 관리 권한
        Permission.TEAM_CREATE: "팀을 생성할 수 있습니다",
        Permission.TEAM_UPDATE: "팀 정보를 수정할 수 있습니다",
        Permission.TEAM_DELETE: "팀을 삭제할 수 있습니다",
        Permission.TEAM_INVITE: "팀에 멤버를 초대할 수 있습니다",
        Permission.TEAM_REMOVE_OWNER: "소유자를 제거할 수 있습니다",
        Permission.TEAM_REMOVE_ADMIN: "관리자를 제거할 수 있습니다",
        Permission.TEAM_REMOVE_MEMBER: "일반 멤버를 제거할 수 있습니다",
        Permission.TEAM_VIEW_ANALYTICS: "팀 분석을 조회할 수 있습니다",
        
        # 플래너 관리 권한
        Permission.PLANNER_CREATE: "플래너를 생성할 수 있습니다",
        Permission.PLANNER_UPDATE: "플래너를 수정할 수 있습니다",
        Permission.PLANNER_DELETE: "플래너를 삭제할 수 있습니다",
        Permission.PLANNER_ASSIGN: "플래너 담당자를 지정할 수 있습니다",
        Permission.PLANNER_VIEW: "플래너를 조회할 수 있습니다",
        Permission.PLANNER_APPROVE: "플래너를 승인할 수 있습니다",
        
        # 할 일 관리 권한
        Permission.TODO_CREATE: "할 일을 생성할 수 있습니다",
        Permission.TODO_UPDATE: "할 일을 수정할 수 있습니다",
        Permission.TODO_DELETE: "할 일을 삭제할 수 있습니다",
        Permission.TODO_ASSIGN: "할 일 담당자를 지정할 수 있습니다",
        Permission.TODO_VIEW: "할 일을 조회할 수 있습니다",
        Permission.TODO_COMPLETE: "할 일을 완료 처리할 수 있습니다",
        
        # 게시글 관리 권한
        Permission.POST_CREATE: "게시글을 작성할 수 있습니다",
        Permission.POST_UPDATE: "게시글을 수정할 수 있습니다",
        Permission.POST_DELETE: "게시글을 삭제할 수 있습니다",
        Permission.POST_VIEW: "게시글을 조회할 수 있습니다",
        Permission.POST_APPROVE: "게시글을 승인할 수 있습니다"
    }
    return permission_descriptions.get(permission, "알 수 없는 권한") 