from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import User, Post, Reply, TeamMember
from schemas.reply import ReplyCreate, ReplyRead, ReplyUpdate
from api.v1.users import get_current_user
from services.reply_service import ReplyService
from services.time_service import TimeService

router = APIRouter()

@router.post("/posts/{post_id}/replies", response_model=ReplyRead)
def create_reply(
    post_id: int,
    reply: ReplyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """댓글 작성"""
    try:
        reply_service = ReplyService(db)
        
        reply_data = {
            'content': reply.content,
            'post_id': post_id
        }
        
        created_reply = reply_service.create_reply(reply_data, current_user)
        return created_reply
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"댓글 작성 중 오류가 발생했습니다: {str(e)}")

@router.get("/posts/{post_id}/replies", response_model=List[ReplyRead])
def read_replies(
    post_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """게시글의 댓글 목록 조회"""
    try:
        reply_service = ReplyService(db)
        replies = reply_service.get_replies_by_post(post_id, current_user)
        
        return replies[skip:skip + limit] if replies else []
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"댓글 목록 조회 중 오류가 발생했습니다: {str(e)}")

@router.get("/replies/{reply_id}", response_model=ReplyRead)
def read_reply(
    reply_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """특정 댓글 조회"""
    try:
        reply_service = ReplyService(db)
        reply = reply_service.get_reply_by_id(reply_id, current_user)
        
        if not reply:
            raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")
        
        return reply
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"댓글 조회 중 오류가 발생했습니다: {str(e)}")

@router.put("/replies/{reply_id}", response_model=ReplyRead)
def update_reply(
    reply_id: int,
    reply: ReplyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """댓글 수정"""
    try:
        reply_service = ReplyService(db)
        
        reply_data = {}
        if reply.content is not None:
            reply_data['content'] = reply.content
        
        updated_reply = reply_service.update_reply(reply_id, reply_data, current_user)
        
        if not updated_reply:
            raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")
        
        return updated_reply
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"댓글 수정 중 오류가 발생했습니다: {str(e)}")

@router.delete("/replies/{reply_id}")
def delete_reply(
    reply_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """댓글 삭제"""
    try:
        reply_service = ReplyService(db)
        success = reply_service.delete_reply(reply_id, current_user)
        
        if not success:
            raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")
        
        return {"message": "댓글이 삭제되었습니다."}
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"댓글 삭제 중 오류가 발생했습니다: {str(e)}")

@router.get("/replies/my", response_model=List[ReplyRead])
def read_my_replies(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """내가 작성한 댓글 목록 조회"""
    try:
        reply_service = ReplyService(db)
        replies = reply_service.get_replies_by_user_posts(current_user)
        
        return replies[skip:skip + limit] if replies else []
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"내 댓글 목록 조회 중 오류가 발생했습니다: {str(e)}") 