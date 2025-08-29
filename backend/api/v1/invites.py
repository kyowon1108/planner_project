from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import uuid4
from datetime import datetime, timedelta, timezone
from schemas.invite import InviteCreate, InviteRead
from models.invite import Invite
from models.team import Team, TeamMember
from models.user import User
from database import get_db
from api.v1.users import get_current_user
from services.invite_service import InviteService
from services.notification_service import NotificationService
from services.time_service import TimeService, KST

router = APIRouter(prefix="/invites", tags=["invites"])

@router.post("/", response_model=InviteRead)
async def create_invite(
    invite: InviteCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """초대 생성"""
    try:
        invite_service = InviteService(db)
        notification_service = NotificationService(db)
        
        # 이메일로 사용자 찾기
        target_user = None
        if invite.email is not None:
            from repositories.user_repository import UserRepository
            user_repo = UserRepository(db)
            target_user = user_repo.get_by_email(invite.email)
            if not target_user:
                raise HTTPException(status_code=404, detail="해당 이메일의 사용자를 찾을 수 없습니다.")
        
        # 초대 코드 생성
        code = str(uuid4())[:8]
        expires_at = invite.expires_at or (TimeService.now_kst() + timedelta(days=3))
        
        invite_data = {
            'code': code,
            'team_id': invite.team_id,
            'created_by': getattr(current_user, 'id', None),
            'role': invite.role,
            'email': invite.email,
            'expires_at': expires_at
        }
        
        # 이메일로 초대된 경우 사용자 ID 추가
        if target_user:
            invite_data['user_id'] = getattr(target_user, 'id', None)
        
        created_invite = invite_service.create_invite(invite_data, current_user)
        
        # 이메일로 초대된 경우 알림 생성
        if target_user and invite.email:
            team = db.query(Team).filter(Team.id == invite.team_id).first()
            if team:
                try:
                    notification_data = {
                        'title': '팀 초대',
                        'message': f"'{team.name}' 팀에 초대되었습니다. 역할: {invite.role}",
                        'type': 'team_invite',
                        'related_id': invite.team_id
                    }
                    notification_service.create_notification(notification_data, target_user)
                except Exception as e:
                    print(f"팀 초대 알림 생성 실패: {e}")
        
        return created_invite
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"초대 생성 중 오류가 발생했습니다: {str(e)}")

@router.get("/team/{team_id}", response_model=List[InviteRead])
def read_team_invites(
    team_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """팀의 초대 목록 조회"""
    try:
        invite_service = InviteService(db)
        invites = invite_service.get_team_invites(team_id, current_user)
        return invites
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"팀 초대 목록 조회 중 오류가 발생했습니다: {str(e)}")

@router.get("/pending", response_model=List[InviteRead])
def read_pending_invites(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """대기 중인 초대 목록 조회"""
    try:
        invite_service = InviteService(db)
        invites = invite_service.get_user_invites(current_user)
        
        # 대기 중인 초대만 필터링
        pending_invites = [invite for invite in invites if getattr(invite, 'status', '') == 'pending']
        return pending_invites
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"대기 중인 초대 목록 조회 중 오류가 발생했습니다: {str(e)}")

@router.get("/{invite_id}", response_model=InviteRead)
def read_invite(
    invite_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """특정 초대 조회"""
    try:
        invite_service = InviteService(db)
        invite = invite_service.get_invite_by_id(invite_id, current_user)
        
        if not invite:
            raise HTTPException(status_code=404, detail="초대를 찾을 수 없습니다.")
        
        return invite
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"초대 조회 중 오류가 발생했습니다: {str(e)}")

@router.post("/accept/{code}")
def accept_invite(code: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """초대 코드로 팀 참가"""
    try:
        invite_service = InviteService(db)
        
        # 초대 코드로 초대 찾기
        invite = db.query(Invite).filter(Invite.code == code).first()
        if not invite:
            raise HTTPException(status_code=404, detail="유효하지 않은 초대 코드입니다.")
        
        # 초대 만료 확인
        expires_at = getattr(invite, 'expires_at', None)
        if expires_at:
            from datetime import timezone
            # expires_at이 timezone-naive인 경우 timezone을 추가
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            current_time = TimeService.now_kst()
            if expires_at < current_time:
                raise HTTPException(status_code=400, detail="만료된 초대 코드입니다.")
        
        # 초대 ID로 서비스 메서드 호출
        invite_id = getattr(invite, 'id', None)
        if invite_id is None:
            raise HTTPException(status_code=400, detail="초대 ID가 없습니다.")
        
        success = invite_service.accept_invite(int(invite_id), current_user)
        
        if success:
            return {"message": "팀에 성공적으로 참가했습니다."}
        else:
            raise HTTPException(status_code=400, detail="팀 참가에 실패했습니다.")
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"팀 참가 중 오류가 발생했습니다: {str(e)}")

@router.post("/reject/{code}")
def reject_invite(code: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """초대 거절"""
    try:
        invite_service = InviteService(db)
        
        # 초대 코드로 초대 찾기
        invite = db.query(Invite).filter(Invite.code == code).first()
        if not invite:
            raise HTTPException(status_code=404, detail="유효하지 않은 초대 코드입니다.")
        
        # 초대 ID로 서비스 메서드 호출
        invite_id = getattr(invite, 'id', None)
        if invite_id is None:
            raise HTTPException(status_code=400, detail="초대 ID가 없습니다.")
        
        success = invite_service.decline_invite(int(invite_id), current_user)
        
        if success:
            return {"message": "초대를 거절했습니다."}
        else:
            raise HTTPException(status_code=400, detail="초대 거절에 실패했습니다.")
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"초대 거절 중 오류가 발생했습니다: {str(e)}")

@router.delete("/{invite_id}")
def cancel_invite(
    invite_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """초대 취소"""
    try:
        invite_service = InviteService(db)
        success = invite_service.cancel_invite(invite_id, current_user)
        
        if not success:
            raise HTTPException(status_code=404, detail="초대를 찾을 수 없습니다.")
        
        return {"message": "초대가 취소되었습니다."}
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"초대 취소 중 오류가 발생했습니다: {str(e)}") 