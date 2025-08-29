from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from repositories.reply_repository import ReplyRepository
from repositories.post_repository import PostRepository
from repositories.team_repository import TeamRepository
from models.reply import Reply
from models.user import User
import logging

logger = logging.getLogger(__name__)

class ReplyService:
    """댓글 관련 비즈니스 로직을 처리하는 서비스 클래스"""
    
    def __init__(self, db: Session):
        self.db = db
        self.reply_repo = ReplyRepository(db)
        self.post_repo = PostRepository(db)
        self.team_repo = TeamRepository(db)
    
    def create_reply(self, reply_data: Dict[str, Any], current_user: User) -> Reply:
        """새로운 댓글을 생성합니다."""
        try:
            # 게시글 존재 확인
            post_id = reply_data.get('post_id')
            if post_id is None:
                raise ValueError("게시글 ID가 필요합니다.")
            
            post = self.post_repo.get(post_id)
            if not post:
                raise ValueError("게시글을 찾을 수 없습니다.")
            
            # 팀 멤버인지 확인
            team_id = getattr(post, 'team_id', None)
            if team_id is None:
                raise ValueError("게시글의 팀 ID가 없습니다.")
            
            user_id = getattr(current_user, 'id', None)
            if user_id is None:
                raise ValueError("사용자 ID가 없습니다.")
            
            team_member = self.team_repo.get_member(team_id, int(user_id))
            if not team_member:
                raise ValueError("팀 멤버가 아닙니다.")
            
            # 댓글 생성
            reply_data['author_id'] = int(user_id)
            reply = self.reply_repo.create(reply_data)
            
            # author_name 동적으로 추가
            reply.author_name = getattr(current_user, 'name', 'Unknown')
            
            logger.info(f"댓글 생성 성공: ID {reply.id}, 작성자 {user_id}")
            return reply
            
        except Exception as e:
            logger.error(f"댓글 생성 실패: {str(e)}")
            raise
    
    def get_reply_by_id(self, reply_id: int, current_user: User) -> Optional[Reply]:
        """ID로 댓글을 조회합니다."""
        try:
            reply = self.reply_repo.get(reply_id)
            if not reply:
                raise ValueError("댓글을 찾을 수 없습니다.")
            
            # 게시글을 통해 팀 멤버인지 확인
            post_id = getattr(reply, 'post_id', None)
            if post_id is None:
                raise ValueError("댓글의 게시글 ID가 없습니다.")
            
            post = self.post_repo.get(post_id)
            if not post:
                raise ValueError("게시글을 찾을 수 없습니다.")
            
            team_id = getattr(post, 'team_id', None)
            if team_id is None:
                raise ValueError("게시글의 팀 ID가 없습니다.")
            
            user_id = getattr(current_user, 'id', None)
            if user_id is None:
                raise ValueError("사용자 ID가 없습니다.")
            
            team_member = self.team_repo.get_member(team_id, int(user_id))
            if not team_member:
                raise ValueError("팀 멤버가 아닙니다.")
            
            return reply
            
        except Exception as e:
            logger.error(f"댓글 조회 실패 (ID: {reply_id}): {str(e)}")
            raise
    
    def get_replies_by_post(self, post_id: int, current_user: User) -> List[Reply]:
        """게시글의 댓글들을 조회합니다."""
        try:
            # 게시글 존재 확인
            post = self.post_repo.get(post_id)
            if not post:
                raise ValueError("게시글을 찾을 수 없습니다.")
            
            # 팀 멤버인지 확인
            team_id = getattr(post, 'team_id', None)
            if team_id is None:
                raise ValueError("게시글의 팀 ID가 없습니다.")
            
            user_id = getattr(current_user, 'id', None)
            if user_id is None:
                raise ValueError("사용자 ID가 없습니다.")
            
            team_member = self.team_repo.get_member(team_id, int(user_id))
            if not team_member:
                raise ValueError("팀 멤버가 아닙니다.")
            
            replies = self.reply_repo.get_by_post(post_id)
            
            # 각 댓글에 author_name 추가
            for reply in replies:
                if hasattr(reply, 'author') and reply.author:
                    reply.author_name = getattr(reply.author, 'name', 'Unknown')
                else:
                    reply.author_name = 'Unknown'
            
            return replies
            
        except Exception as e:
            logger.error(f"게시글 댓글 조회 실패 (게시글 ID: {post_id}): {str(e)}")
            return []
    
    def update_reply(self, reply_id: int, reply_data: Dict[str, Any], current_user: User) -> Optional[Reply]:
        """댓글을 업데이트합니다."""
        try:
            reply = self.reply_repo.get(reply_id)
            if not reply:
                raise ValueError("댓글을 찾을 수 없습니다.")
            
            # 작성자인지 확인
            author_id = getattr(reply, 'author_id', None)
            user_id = getattr(current_user, 'id', None)
            if user_id is None:
                raise ValueError("사용자 ID가 없습니다.")
            
            if author_id != int(user_id):
                raise ValueError("댓글 작성자만 수정할 수 있습니다.")
            
            updated_reply = self.reply_repo.update(reply_id, reply_data)
            logger.info(f"댓글 수정 성공: ID {reply_id}")
            return updated_reply
            
        except Exception as e:
            logger.error(f"댓글 수정 실패 (ID: {reply_id}): {str(e)}")
            raise
    
    def delete_reply(self, reply_id: int, current_user: User) -> bool:
        """댓글을 소프트 삭제합니다."""
        try:
            reply = self.reply_repo.get(reply_id)
            if not reply:
                raise ValueError("댓글을 찾을 수 없습니다.")
            
            # 작성자인지 확인
            author_id = getattr(reply, 'author_id', None)
            user_id = getattr(current_user, 'id', None)
            if user_id is None:
                raise ValueError("사용자 ID가 없습니다.")
            
            if author_id != int(user_id):
                raise ValueError("댓글 작성자만 삭제할 수 있습니다.")
            
            success = self.reply_repo.soft_delete(reply_id)
            if success:
                logger.info(f"댓글 소프트 삭제 성공: ID {reply_id}")
            return success
            
        except Exception as e:
            logger.error(f"댓글 삭제 실패 (ID: {reply_id}): {str(e)}")
            raise
    
    def get_replies_by_user_posts(self, current_user: User) -> List[Reply]:
        """사용자가 속한 팀들의 게시글 댓글을 조회합니다."""
        try:
            user_id = getattr(current_user, 'id', None)
            if user_id is None:
                raise ValueError("사용자 ID가 없습니다.")
            
            # 사용자가 속한 팀들의 게시글 조회
            user_teams = self.team_repo.get_by_user(int(user_id))
            team_ids = []
            for team in user_teams:
                team_id = getattr(team, 'id', None)
                if team_id is not None:
                    team_ids.append(int(team_id))
            
            if not team_ids:
                return []
            
            # 팀들의 게시글 조회
            posts = self.post_repo.get_by_teams(team_ids)
            post_ids = []
            for post in posts:
                post_id = getattr(post, 'id', None)
                if post_id is not None:
                    post_ids.append(int(post_id))
            
            if not post_ids:
                return []
            
            return self.reply_repo.get_by_posts(post_ids)
            
        except Exception as e:
            logger.error(f"사용자 팀 댓글 조회 실패: {str(e)}")
            return [] 