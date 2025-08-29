from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from repositories.base import BaseRepository
from models.post import Post
from models.user import User
from models.team import TeamMember

class PostRepository(BaseRepository[Post]):
    """게시글 관련 데이터 접근을 처리하는 Repository"""
    
    def __init__(self, db: Session):
        super().__init__(db)
    
    def get_model(self):
        return Post
    
    def get_by_team(self, team_id: int) -> List[Post]:
        """팀별 게시글을 조회합니다."""
        return self.db.query(Post).filter(Post.team_id == team_id).all()
    
    def get_by_author(self, author_id: int) -> List[Post]:
        """작성자별 게시글을 조회합니다."""
        return self.db.query(Post).filter(Post.author_id == author_id).all()
    
    def get_by_teams(self, team_ids: List[int]) -> List[Post]:
        """여러 팀의 게시글을 조회합니다."""
        return self.db.query(Post).filter(Post.team_id.in_(team_ids)).all()
    
    def search_posts(self, query: str, team_ids: List[int]) -> List[Post]:
        """게시글을 검색합니다."""
        from sqlalchemy import or_
        return self.db.query(Post).filter(
            Post.team_id.in_(team_ids),
            or_(
                Post.title.ilike(f"%{query}%"),
                Post.content.ilike(f"%{query}%")
            )
        ).all() 