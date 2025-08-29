from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import User, Post, Like
from schemas.like import LikeCreate, LikeResponse
from core.auth import get_current_user

router = APIRouter()

@router.post("/posts/{post_id}/like", response_model=LikeResponse)
def toggle_like(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """게시글 좋아요 토글 (좋아요 추가/제거)"""
    # 게시글 존재 확인
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="게시글을 찾을 수 없습니다."
        )
    
    # 이미 좋아요를 눌렀는지 확인
    existing_like = db.query(Like).filter(
        Like.user_id == current_user.id,
        Like.post_id == post_id
    ).first()
    
    if existing_like:
        # 좋아요 제거
        db.delete(existing_like)
        db.commit()
        return {
            "id": existing_like.id,
            "user_id": current_user.id,
            "post_id": post_id,
            "created_at": existing_like.created_at,
            "action": "removed"
        }
    else:
        # 좋아요 추가
        new_like = Like(
            user_id=current_user.id,
            post_id=post_id
        )
        db.add(new_like)
        db.commit()
        db.refresh(new_like)
        return {
            "id": new_like.id,
            "user_id": current_user.id,
            "post_id": post_id,
            "created_at": new_like.created_at,
            "action": "added"
        }

@router.post("/posts/{post_id}/toggle", response_model=LikeResponse)
def toggle_like_toggle(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """게시글 좋아요 토글 (좋아요 추가/제거) - 프론트엔드 호환용"""
    # 게시글 존재 확인
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="게시글을 찾을 수 없습니다."
        )
    
    # 이미 좋아요를 눌렀는지 확인
    existing_like = db.query(Like).filter(
        Like.user_id == current_user.id,
        Like.post_id == post_id
    ).first()
    
    if existing_like:
        # 좋아요 제거
        db.delete(existing_like)
        db.commit()
        return {
            "id": existing_like.id,
            "user_id": current_user.id,
            "post_id": post_id,
            "created_at": existing_like.created_at,
            "action": "removed"
        }
    else:
        # 좋아요 추가
        new_like = Like(
            user_id=current_user.id,
            post_id=post_id
        )
        db.add(new_like)
        db.commit()
        db.refresh(new_like)
        return {
            "id": new_like.id,
            "user_id": current_user.id,
            "post_id": post_id,
            "created_at": new_like.created_at,
            "action": "added"
        }

@router.get("/posts/{post_id}/likes", response_model=List[LikeResponse])
def get_post_likes(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """게시글의 좋아요 목록 조회"""
    # 게시글 존재 확인
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="게시글을 찾을 수 없습니다."
        )
    
    likes = db.query(Like).filter(Like.post_id == post_id).all()
    return [
        {
            "id": like.id,
            "user_id": like.user_id,
            "post_id": like.post_id,
            "created_at": like.created_at,
            "action": None
        }
        for like in likes
    ]

@router.get("/posts/{post_id}/like/status")
def get_like_status(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """현재 사용자가 해당 게시글에 좋아요를 눌렀는지 확인"""
    # 게시글 존재 확인
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="게시글을 찾을 수 없습니다."
        )
    
    # 좋아요 상태 확인
    like = db.query(Like).filter(
        Like.user_id == current_user.id,
        Like.post_id == post_id
    ).first()
    
    return {
        "is_liked": like is not None,
        "like_count": db.query(Like).filter(Like.post_id == post_id).count()
    } 