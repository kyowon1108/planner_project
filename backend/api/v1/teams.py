from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging
from schemas.team import TeamCreate, TeamRead, TeamUpdate, TeamMemberCreate, TeamMemberUpdate, TeamMemberRead, RoleUpdate
from models.team import Team, TeamMember
from models.user import User
from database import get_db
from api.v1.users import get_current_user
from services.team_service import TeamService
from core.permissions import require_permission, require_role, Permission, Role

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/teams", tags=["teams"])

# 의존성 주입 함수들
def get_team_service(db: Session = Depends(get_db)) -> TeamService:
    """TeamService 의존성 주입"""
    return TeamService(db)

@router.post("/", response_model=TeamRead)
def create_team(team: TeamCreate, team_service: TeamService = Depends(get_team_service), current_user: User = Depends(get_current_user)):
    """팀 생성"""
    try:
        team_data = {
            'name': team.name,
            'description': team.description
        }
        
        created_team = team_service.create_team(team_data, current_user)
        return created_team
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"팀 생성 중 오류가 발생했습니다: {str(e)}")

@router.get("/", response_model=List[TeamRead])
def read_teams(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """사용자가 속한 팀 목록 조회"""
    try:
        team_service = TeamService(db)
        user_id = getattr(current_user, 'id', None)
        teams = team_service.get_teams_by_user(int(user_id) if user_id is not None else 0)
        
        return teams[skip:skip + limit] if teams else []
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"팀 목록 조회 중 오류가 발생했습니다: {str(e)}")

@router.get("/{team_id}", response_model=TeamRead)
def read_team(team_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """특정 팀 조회"""
    try:
        team_service = TeamService(db)
        team = team_service.get_team_by_id(team_id, current_user)
        
        if not team:
            raise HTTPException(status_code=404, detail="팀을 찾을 수 없습니다.")
        
        return team
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"팀 조회 중 오류가 발생했습니다: {str(e)}")

@router.get("/{team_id}/members", response_model=List[TeamMemberRead])
def read_team_members(team_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """팀 멤버 목록 조회"""
    try:
        team_service = TeamService(db)
        members = team_service.get_team_members(team_id, current_user)
        
        if members is None:
            raise HTTPException(status_code=404, detail="팀을 찾을 수 없습니다.")
        
        return members
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"팀 멤버 조회 중 오류가 발생했습니다: {str(e)}")

@router.put("/{team_id}", response_model=TeamRead)
def update_team(
    team_id: int, 
    team: TeamUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """팀 정보 수정"""
    try:
        team_service = TeamService(db)
        
        team_data = {}
        if team.name is not None:
            team_data['name'] = team.name
        if team.description is not None:
            team_data['description'] = team.description
        
        updated_team = team_service.update_team(team_id, team_data, current_user)
        
        if not updated_team:
            raise HTTPException(status_code=404, detail="팀을 찾을 수 없습니다.")
        
        return updated_team
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"팀 수정 중 오류가 발생했습니다: {str(e)}")

@router.delete("/{team_id}")
def delete_team(
    team_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """팀 삭제"""
    try:
        logger.info(f"팀 삭제 시도: team_id={team_id}, user_id={current_user.id}")
        team_service = TeamService(db)
        success = team_service.delete_team(team_id, current_user)
        
        if not success:
            raise HTTPException(status_code=404, detail="팀을 찾을 수 없습니다.")
        
        logger.info(f"팀 삭제 성공: team_id={team_id}")
        return {"message": "팀이 삭제되었습니다."}
        
    except ValueError as e:
        logger.error(f"팀 삭제 실패 (ValueError): team_id={team_id}, error={str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"팀 삭제 실패 (Exception): team_id={team_id}, error={str(e)}")
        raise HTTPException(status_code=500, detail=f"팀 삭제 중 오류가 발생했습니다: {str(e)}")

@router.post("/{team_id}/members", response_model=TeamMemberRead)
def add_team_member(
    team_id: int, 
    member: TeamMemberCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """팀 멤버 추가"""
    try:
        team_service = TeamService(db)
        
        member_data = {
            'user_id': member.user_id,
            'role': member.role
        }
        
        added_member = team_service.add_member(team_id, member_data, current_user)
        return added_member
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"팀 멤버 추가 중 오류가 발생했습니다: {str(e)}")

@router.delete("/{team_id}/members/{user_id}")
def remove_team_member(
    team_id: int, 
    user_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """팀 멤버 제거"""
    try:
        team_service = TeamService(db)
        success = team_service.remove_member(team_id, user_id, current_user)
        
        if not success:
            raise HTTPException(status_code=404, detail="팀 멤버를 찾을 수 없습니다.")
        
        return {"message": "팀 멤버가 제거되었습니다."}
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"팀 멤버 제거 중 오류가 발생했습니다: {str(e)}")

@router.put("/{team_id}/members/{user_id}/role")
def update_team_member_role(
    team_id: int, 
    user_id: int, 
    role_update: RoleUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """팀 멤버 역할 수정"""
    try:
        team_service = TeamService(db)
        success = team_service.update_member_role(team_id, user_id, role_update.role, current_user)
        
        if not success:
            raise HTTPException(status_code=404, detail="팀 멤버를 찾을 수 없습니다.")
        
        return {"message": "팀 멤버 역할이 수정되었습니다."}
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"팀 멤버 역할 수정 중 오류가 발생했습니다: {str(e)}")

@router.post("/{team_id}/leave")
def leave_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """팀 탈퇴"""
    try:
        team_service = TeamService(db)
        success = team_service.leave_team(team_id, current_user)
        
        if not success:
            raise HTTPException(status_code=404, detail="팀을 찾을 수 없습니다.")
        
        return {"message": "팀에서 탈퇴했습니다."}
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"팀 탈퇴 중 오류가 발생했습니다: {str(e)}")

@router.post("/{team_id}/transfer-ownership/{new_owner_id}")
def transfer_ownership(
    team_id: int,
    new_owner_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """팀 소유권 이전"""
    try:
        team_service = TeamService(db)
        success = team_service.transfer_ownership(team_id, new_owner_id, current_user)
        
        if not success:
            raise HTTPException(status_code=404, detail="팀 또는 새 소유자를 찾을 수 없습니다.")
        
        return {"message": "팀 소유권이 이전되었습니다."}
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"팀 소유권 이전 중 오류가 발생했습니다: {str(e)}")