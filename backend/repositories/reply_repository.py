from typing import List, Optional
from sqlalchemy.orm import Session
from repositories.base import BaseRepository
from models.reply import Reply

class ReplyRepository(BaseRepository[Reply]):
    """댓글 관련 데이터 접근을 처리하는 Repository"""
    
    def __init__(self, db: Session):
        super().__init__(db)
    
    def get_model(self):
        return Reply
    
    def get_by_post(self, post_id: int) -> List[Reply]:
        """게시글별 댓글을 조회합니다 (삭제된 댓글 포함, 최신순 정렬)."""
        return self.db.query(Reply).filter(Reply.post_id == post_id).order_by(Reply.created_at.desc()).all()
    
    def get_by_author(self, author_id: int) -> List[Reply]:
        """작성자별 댓글을 조회합니다."""
        return self.db.query(Reply).filter(Reply.author_id == author_id).all()
    
    def get_by_posts(self, post_ids: List[int]) -> List[Reply]:
        """여러 게시글의 댓글을 조회합니다."""
        return self.db.query(Reply).filter(Reply.post_id.in_(post_ids)).all()
    
    def search_replies(self, query: str, post_ids: List[int]) -> List[Reply]:
        """댓글을 검색합니다."""
        from sqlalchemy import or_
        return self.db.query(Reply).filter(
            Reply.post_id.in_(post_ids),
            or_(
                Reply.content.ilike(f"%{query}%")
            )
        ).all()
    
    def soft_delete(self, id: int) -> bool:
        """댓글을 소프트 삭제합니다 (is_deleted = True, deleted_at 설정)."""
        from services.time_service import TimeService
        
        reply = self.get(id)
        if reply:
            setattr(reply, 'is_deleted', True)
            setattr(reply, 'deleted_at', TimeService.now_kst())
            self.db.commit()
            return True
        return False 