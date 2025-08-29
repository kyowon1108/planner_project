from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from repositories.post_repository import PostRepository
from repositories.team_repository import TeamRepository
from repositories.user_repository import UserRepository
from models.post import Post
from models.user import User
from models.team import TeamMember
import logging

logger = logging.getLogger(__name__)

class PostService:
    """게시글 관련 비즈니스 로직을 처리하는 서비스 클래스"""
    
    def __init__(self, db: Session):
        self.db = db
        self.post_repo = PostRepository(db)
        self.team_repo = TeamRepository(db)
        self.user_repo = UserRepository(db)
    
    def create_post(self, post_data: Dict[str, Any], current_user: User) -> Post:
        """새로운 게시글을 생성합니다."""
        try:
            # 팀 멤버인지 확인
            team_id = post_data.get('team_id')
            if team_id is None:
                raise ValueError("팀 ID가 필요합니다.")
            
            user_id = getattr(current_user, 'id', None)
            if user_id is None:
                raise ValueError("사용자 ID가 없습니다.")
            
            team_member = self.team_repo.get_member(team_id, int(user_id))
            if not team_member:
                raise ValueError("팀 멤버가 아닙니다.")
            
            # 게시글 생성
            post_data['author_id'] = int(user_id)
            post = self.post_repo.create(post_data)
            
            logger.info(f"게시글 생성 성공: ID {post.id}, 작성자 {user_id}")
            return post
            
        except Exception as e:
            logger.error(f"게시글 생성 실패: {str(e)}")
            raise
    
    def get_post_by_id(self, post_id: int, current_user: User) -> Optional[Post]:
        """ID로 게시글을 조회합니다."""
        try:
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
            
            # author_name과 team_name 추가
            if hasattr(post, 'author') and post.author:
                setattr(post, 'author_name', getattr(post.author, 'name', 'Unknown'))
            else:
                setattr(post, 'author_name', 'Unknown')
            
            if hasattr(post, 'team') and post.team:
                setattr(post, 'team_name', getattr(post.team, 'name', 'Unknown'))
            else:
                setattr(post, 'team_name', 'Unknown')
            
            return post
            
        except Exception as e:
            logger.error(f"게시글 조회 실패 (ID: {post_id}): {str(e)}")
            raise
    
    def get_posts_by_user_teams(self, current_user: User) -> List[Post]:
        """사용자가 속한 팀들의 게시글을 조회합니다."""
        try:
            user_id = getattr(current_user, 'id', None)
            if user_id is None:
                raise ValueError("사용자 ID가 없습니다.")
            
            # 사용자가 속한 팀들 조회
            user_teams = self.team_repo.get_by_user(int(user_id))
            team_ids = []
            for team in user_teams:
                team_id = getattr(team, 'id', None)
                if team_id is not None:
                    team_ids.append(int(team_id))
            
            if not team_ids:
                return []
            
            posts = self.post_repo.get_by_teams(team_ids)
            
            # 각 게시글에 author_name과 team_name 추가
            for post in posts:
                if hasattr(post, 'author') and post.author:
                    setattr(post, 'author_name', getattr(post.author, 'name', 'Unknown'))
                else:
                    setattr(post, 'author_name', 'Unknown')
                
                if hasattr(post, 'team') and post.team:
                    setattr(post, 'team_name', getattr(post.team, 'name', 'Unknown'))
                else:
                    setattr(post, 'team_name', 'Unknown')
            
            return posts
            
        except Exception as e:
            logger.error(f"사용자 팀 게시글 조회 실패: {str(e)}")
            return []
    
    def update_post(self, post_id: int, post_data: Dict[str, Any], current_user: User) -> Optional[Post]:
        """게시글을 업데이트합니다."""
        try:
            post = self.post_repo.get(post_id)
            if not post:
                raise ValueError("게시글을 찾을 수 없습니다.")
            
            # 작성자인지 확인
            author_id = getattr(post, 'author_id', None)
            user_id = getattr(current_user, 'id', None)
            if user_id is None:
                raise ValueError("사용자 ID가 없습니다.")
            
            if author_id != int(user_id):
                raise ValueError("게시글 작성자만 수정할 수 있습니다.")
            
            updated_post = self.post_repo.update(post_id, post_data)
            
            # author_name과 team_name 추가
            if updated_post and hasattr(updated_post, 'author') and updated_post.author:
                setattr(updated_post, 'author_name', getattr(updated_post.author, 'name', 'Unknown'))
            else:
                setattr(updated_post, 'author_name', 'Unknown')
            
            if updated_post and hasattr(updated_post, 'team') and updated_post.team:
                setattr(updated_post, 'team_name', getattr(updated_post.team, 'name', 'Unknown'))
            else:
                setattr(updated_post, 'team_name', 'Unknown')
            
            logger.info(f"게시글 수정 성공: ID {post_id}")
            return updated_post
            
        except Exception as e:
            logger.error(f"게시글 수정 실패 (ID: {post_id}): {str(e)}")
            raise
    
    def delete_post(self, post_id: int, current_user: User) -> bool:
        """게시글을 삭제합니다."""
        try:
            post = self.post_repo.get(post_id)
            if not post:
                raise ValueError("게시글을 찾을 수 없습니다.")
            
            # 작성자인지 확인
            author_id = getattr(post, 'author_id', None)
            user_id = getattr(current_user, 'id', None)
            if user_id is None:
                raise ValueError("사용자 ID가 없습니다.")
            
            if author_id != int(user_id):
                raise ValueError("게시글 작성자만 삭제할 수 있습니다.")
            
            success = self.post_repo.delete(post_id)
            if success:
                logger.info(f"게시글 삭제 성공: ID {post_id}")
            return success
            
        except Exception as e:
            logger.error(f"게시글 삭제 실패 (ID: {post_id}): {str(e)}")
            raise
    
    def search_posts(self, query: str, current_user: User) -> List[Post]:
        """게시글을 검색합니다."""
        try:
            user_id = getattr(current_user, 'id', None)
            if user_id is None:
                raise ValueError("사용자 ID가 없습니다.")
            
            # 사용자가 속한 팀들 조회
            user_teams = self.team_repo.get_by_user(int(user_id))
            team_ids = []
            for team in user_teams:
                team_id = getattr(team, 'id', None)
                if team_id is not None:
                    team_ids.append(int(team_id))
            
            if not team_ids:
                return []
            
            return self.post_repo.search_posts(query, team_ids)
            
        except Exception as e:
            logger.error(f"게시글 검색 실패: {str(e)}")
            return [] 