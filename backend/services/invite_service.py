from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from repositories.invite_repository import InviteRepository
from repositories.team_repository import TeamRepository
from repositories.user_repository import UserRepository
from models.invite import Invite
from models.user import User
import logging

logger = logging.getLogger(__name__)

class InviteService:
    """초대 관련 비즈니스 로직을 처리하는 서비스 클래스"""
    
    def __init__(self, db: Session):
        self.db = db
        self.invite_repo = InviteRepository(db)
        self.team_repo = TeamRepository(db)
        self.user_repo = UserRepository(db)
    
    def create_invite(self, invite_data: Dict[str, Any], current_user: User) -> Invite:
        """새로운 초대를 생성합니다."""
        try:
            team_id = invite_data.get('team_id')
            user_id = invite_data.get('user_id')
            email = invite_data.get('email')
            
            if team_id is None:
                raise ValueError("팀 ID가 필요합니다.")
            
            # user_id가 없고 email이 있는 경우, 이메일로 사용자 찾기
            if user_id is None and email:
                target_user = self.user_repo.get_by_email(email)
                if target_user:
                    user_id = getattr(target_user, 'id', None)
                    invite_data['user_id'] = user_id
                else:
                    raise ValueError("해당 이메일의 사용자를 찾을 수 없습니다.")
            
            if user_id is None:
                raise ValueError("사용자 ID가 필요합니다.")
            
            # 팀 존재 확인
            team = self.team_repo.get_by_id(team_id)
            if not team:
                raise ValueError("팀을 찾을 수 없습니다.")
            
            # 사용자 존재 확인
            user = self.user_repo.get_by_id(user_id)
            if not user:
                raise ValueError("사용자를 찾을 수 없습니다.")
            
            # 초대하는 사람이 팀 멤버인지 확인
            current_user_id = getattr(current_user, 'id', None)
            if current_user_id is None:
                raise ValueError("사용자 ID가 없습니다.")
            
            team_member = self.team_repo.get_member(team_id, int(current_user_id))
            if not team_member:
                raise ValueError("팀 멤버가 아닙니다.")
            
            # OWNER/ADMIN만 초대 가능
            member_role = getattr(team_member, 'role', None)
            if member_role not in ['owner', 'admin']:
                raise ValueError("초대 권한이 없습니다.")
            
            # 자기 자신을 초대하는지 확인
            if int(user_id) == int(current_user_id):
                raise ValueError("자기 자신을 초대할 수 없습니다.")
            
            # 이미 팀 멤버인지 확인
            existing_member = self.team_repo.get_member(team_id, user_id)
            if existing_member:
                raise ValueError("이미 팀 멤버입니다.")
            
            # 이미 초대가 있는지 확인
            existing_invite = self.invite_repo.get_by_team_and_user(team_id, user_id)
            if existing_invite:
                raise ValueError("이미 초대가 존재합니다.")
            
            # 초대 생성
            invite_data['status'] = 'pending'
            invite = self.invite_repo.create(invite_data)
            
            logger.info(f"초대 생성 성공: 팀 {team_id}, 사용자 {user_id}")
            return invite
            
        except Exception as e:
            logger.error(f"초대 생성 실패: {str(e)}")
            raise
    
    def get_invite_by_id(self, invite_id: int, current_user: User) -> Optional[Invite]:
        """ID로 초대를 조회합니다."""
        try:
            invite = self.invite_repo.get(invite_id)
            if not invite:
                raise ValueError("초대를 찾을 수 없습니다.")
            
            # 초대 대상자이거나 팀 관리자인지 확인
            invite_user_id = getattr(invite, 'user_id', None)
            invite_team_id = getattr(invite, 'team_id', None)
            
            current_user_id = getattr(current_user, 'id', None)
            if current_user_id is None:
                raise ValueError("사용자 ID가 없습니다.")
            
            # 초대 대상자인 경우
            if invite_user_id == int(current_user_id):
                return invite
            
            # 팀 관리자인 경우
            if invite_team_id is not None:
                team_member = self.team_repo.get_member(invite_team_id, int(current_user_id))
                if team_member:
                    member_role = getattr(team_member, 'role', None)
                    if member_role in ['owner', 'admin']:
                        return invite
            
            raise ValueError("초대를 조회할 권한이 없습니다.")
            
        except Exception as e:
            logger.error(f"초대 조회 실패 (ID: {invite_id}): {str(e)}")
            raise
    
    def get_user_invites(self, current_user: User) -> List[Invite]:
        """사용자의 초대 목록을 조회합니다."""
        try:
            user_id = getattr(current_user, 'id', None)
            if user_id is None:
                raise ValueError("사용자 ID가 없습니다.")
            
            return self.invite_repo.get_by_user(int(user_id))
            
        except Exception as e:
            logger.error(f"사용자 초대 조회 실패: {str(e)}")
            return []
    
    def get_team_invites(self, team_id: int, current_user: User) -> List[Invite]:
        """팀의 초대 목록을 조회합니다."""
        try:
            # 팀 멤버인지 확인
            current_user_id = getattr(current_user, 'id', None)
            if current_user_id is None:
                raise ValueError("사용자 ID가 없습니다.")
            
            team_member = self.team_repo.get_member(team_id, int(current_user_id))
            if not team_member:
                raise ValueError("팀 멤버가 아닙니다.")
            
            # 팀 멤버라면 누구나 초대 목록 조회 가능
            return self.invite_repo.get_by_team(team_id)
            
        except Exception as e:
            logger.error(f"팀 초대 조회 실패 (팀 ID: {team_id}): {str(e)}")
            return []
    
    def accept_invite(self, invite_id: int, current_user: User) -> bool:
        """초대를 수락합니다."""
        try:
            invite = self.invite_repo.get(invite_id)
            if not invite:
                raise ValueError("초대를 찾을 수 없습니다.")
            
            # 초대 대상자인지 확인
            invite_user_id = getattr(invite, 'user_id', None)
            current_user_id = getattr(current_user, 'id', None)
            if current_user_id is None:
                raise ValueError("사용자 ID가 없습니다.")
            
            if invite_user_id != int(current_user_id):
                raise ValueError("초대 대상자가 아닙니다.")
            
            # 초대 상태 확인
            invite_status = getattr(invite, 'status', None)
            if invite_status != 'pending':
                raise ValueError("대기 중인 초대가 아닙니다.")
            
            # 팀에 멤버 추가
            team_id = getattr(invite, 'team_id', None)
            if team_id is None:
                raise ValueError("팀 ID가 없습니다.")
            
            self.team_repo.add_member(team_id, int(current_user_id), 'editor')
            
            # 초대 삭제
            success = self.invite_repo.delete(invite_id)
            
            if success:
                logger.info(f"초대 수락 성공: ID {invite_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"초대 수락 실패 (ID: {invite_id}): {str(e)}")
            raise
    
    def decline_invite(self, invite_id: int, current_user: User) -> bool:
        """초대를 거절합니다."""
        try:
            invite = self.invite_repo.get(invite_id)
            if not invite:
                raise ValueError("초대를 찾을 수 없습니다.")
            
            # 초대 대상자인지 확인
            invite_user_id = getattr(invite, 'user_id', None)
            current_user_id = getattr(current_user, 'id', None)
            if current_user_id is None:
                raise ValueError("사용자 ID가 없습니다.")
            
            if invite_user_id != int(current_user_id):
                raise ValueError("초대 대상자가 아닙니다.")
            
            # 초대 삭제
            success = self.invite_repo.delete(invite_id)
            
            if success:
                logger.info(f"초대 거절 성공: ID {invite_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"초대 거절 실패 (ID: {invite_id}): {str(e)}")
            raise
    
    def cancel_invite(self, invite_id: int, current_user: User) -> bool:
        """초대를 취소합니다."""
        try:
            invite = self.invite_repo.get(invite_id)
            if not invite:
                raise ValueError("초대를 찾을 수 없습니다.")
            
            # 팀 관리자인지 확인
            invite_team_id = getattr(invite, 'team_id', None)
            current_user_id = getattr(current_user, 'id', None)
            if current_user_id is None:
                raise ValueError("사용자 ID가 없습니다.")
            
            if invite_team_id is not None:
                team_member = self.team_repo.get_member(invite_team_id, int(current_user_id))
                if not team_member:
                    raise ValueError("팀 멤버가 아닙니다.")
                
                # OWNER/ADMIN만 취소 가능
                member_role = getattr(team_member, 'role', None)
                if member_role not in ['owner', 'admin']:
                    raise ValueError("초대를 취소할 권한이 없습니다.")
            
            # 초대 삭제
            success = self.invite_repo.delete(invite_id)
            
            if success:
                logger.info(f"초대 취소 성공: ID {invite_id}")
            
            return success
            
        except Exception as e:
            logger.error(f"초대 취소 실패 (ID: {invite_id}): {str(e)}")
            raise 
    
    def update_invite(self, invite_id: int, invite_data: Dict[str, Any], current_user: User) -> Optional[Invite]:
        """초대를 업데이트합니다."""
        try:
            invite = self.invite_repo.get(invite_id)
            if not invite:
                raise ValueError("초대를 찾을 수 없습니다.")
            
            # 초대 대상자이거나 팀 관리자인지 확인
            invite_user_id = getattr(invite, 'user_id', None)
            invite_team_id = getattr(invite, 'team_id', None)
            
            current_user_id = getattr(current_user, 'id', None)
            if current_user_id is None:
                raise ValueError("사용자 ID가 없습니다.")
            
            # 초대 대상자인 경우
            if invite_user_id == int(current_user_id):
                pass  # 수락/거절 가능
            # 팀 관리자인 경우
            elif invite_team_id is not None:
                team_member = self.team_repo.get_member(invite_team_id, int(current_user_id))
                if not team_member:
                    raise ValueError("초대를 수정할 권한이 없습니다.")
                
                member_role = getattr(team_member, 'role', None)
                if member_role not in ['owner', 'admin']:
                    raise ValueError("초대를 수정할 권한이 없습니다.")
            else:
                raise ValueError("초대를 수정할 권한이 없습니다.")
            
            # 업데이트할 필드들
            for field, value in invite_data.items():
                if hasattr(invite, field):
                    setattr(invite, field, value)
            
            self.db.commit()
            self.db.refresh(invite)
            
            logger.info(f"초대 수정 성공: ID {invite_id}")
            return invite
            
        except Exception as e:
            logger.error(f"초대 수정 실패 (ID: {invite_id}): {str(e)}")
            raise 