from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from schemas.post import PostCreate, PostRead, PostUpdate
from models.post import Post
from models.team import Team, TeamMember
from models.user import User
from database import get_db
from api.v1.users import get_current_user
from services.post_service import PostService
from core.permissions import require_permission, Permission, Role, get_user_role_in_team

router = APIRouter(prefix="/posts", tags=["posts"])

@router.post("/", response_model=PostRead)
def create_post(
    post: PostCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """게시글 생성"""
    try:
        post_service = PostService(db)
        
        post_data = {
            'title': post.title,
            'content': post.content,
            'team_id': post.team_id
        }
        
        created_post = post_service.create_post(post_data, current_user)
        return created_post
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"게시글 생성 중 오류가 발생했습니다: {str(e)}")

@router.get("/", response_model=List[PostRead])
def read_posts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """사용자가 속한 팀의 게시글 목록 조회"""
    try:
        post_service = PostService(db)
        posts = post_service.get_posts_by_user_teams(current_user)
        
        return posts[skip:skip + limit] if posts else []
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"게시글 목록 조회 중 오류가 발생했습니다: {str(e)}")

@router.get("/{post_id}", response_model=PostRead)
def read_post(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """특정 게시글 조회"""
    try:
        post_service = PostService(db)
        post = post_service.get_post_by_id(post_id, current_user)
        
        if not post:
            raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
        
        return post
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"게시글 조회 중 오류가 발생했습니다: {str(e)}")

@router.put("/{post_id}", response_model=PostRead)
def update_post(
    post_id: int, 
    post: PostUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """게시글 수정"""
    try:
        post_service = PostService(db)
        
        post_data = {}
        if post.title is not None:
            post_data['title'] = post.title
        if post.content is not None:
            post_data['content'] = post.content
        if post.category is not None:
            post_data['category'] = post.category
        if post.tags is not None:
            post_data['tags'] = post.tags
        
        updated_post = post_service.update_post(post_id, post_data, current_user)
        
        if not updated_post:
            raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
        
        return updated_post
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"게시글 수정 중 오류가 발생했습니다: {str(e)}")

@router.delete("/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """게시글 삭제"""
    try:
        post_service = PostService(db)
        success = post_service.delete_post(post_id, current_user)
        
        if not success:
            raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
        
        return {"message": "게시글이 삭제되었습니다."}
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"게시글 삭제 중 오류가 발생했습니다: {str(e)}")

@router.get("/search/{query}")
def search_posts(query: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """게시글 검색"""
    try:
        post_service = PostService(db)
        posts = post_service.search_posts(query, current_user)
        
        return posts
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"게시글 검색 중 오류가 발생했습니다: {str(e)}") 