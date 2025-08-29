from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Optional, Dict, Any
from models.team import Team, TeamMember
from models.planner import Planner
from models.post import Post
from models.todo import Todo
from models.user import User
from database import get_db
from api.v1.users import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/search", tags=["search"])

class SearchResult(BaseModel):
    type: str
    id: int
    title: str
    description: Optional[str] = None
    created_at: str

def safe_get_attr(obj: Any, attr: str, default: Any = None) -> Any:
    """안전하게 객체의 속성을 가져옵니다."""
    try:
        value = getattr(obj, attr, default)
        return value if value is not None else default
    except:
        return default

class SearchResponse(BaseModel):
    results: List[SearchResult]
    total: int
    query: str

@router.get("/", response_model=SearchResponse)
def search_all(
    q: str = Query(..., description="검색어"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """통합 검색 API"""
    results = []
    
    # 사용자가 접근 가능한 팀들
    user_teams = db.query(TeamMember.team_id).filter(TeamMember.user_id == current_user.id).all()
    user_team_ids = [tm.team_id for tm in user_teams]
    
    if not user_team_ids:
        return SearchResponse(
            results=[],
            total=0,
            query=q
        )
    
    # 팀 검색
    teams = db.query(Team).filter(
        and_(
            Team.id.in_(user_team_ids),
            or_(
                Team.name.ilike(f"%{q}%"),
                Team.description.ilike(f"%{q}%")
            )
        )
    ).limit(limit).all()
    
    for team in teams:
        results.append(SearchResult(
            type="team",
            id=safe_get_attr(team, 'id', 0),
            title=safe_get_attr(team, 'name', ''),
            description=safe_get_attr(team, 'description'),
            created_at=safe_get_attr(team, 'created_at').isoformat() if safe_get_attr(team, 'created_at') else ''
        ))
    
    # 플래너 검색
    planners = db.query(Planner).filter(
        and_(
            Planner.team_id.in_(user_team_ids),
            or_(
                Planner.title.ilike(f"%{q}%"),
                Planner.description.ilike(f"%{q}%")
            )
        )
    ).limit(limit).all()
    
    for planner in planners:
        results.append(SearchResult(
            type="planner",
            id=safe_get_attr(planner, 'id', 0),
            title=safe_get_attr(planner, 'title', ''),
            description=safe_get_attr(planner, 'description'),
            created_at=safe_get_attr(planner, 'created_at').isoformat() if safe_get_attr(planner, 'created_at') else ''
        ))
    
    # 게시글 검색
    posts = db.query(Post).filter(
        and_(
            Post.team_id.in_(user_team_ids),
            or_(
                Post.title.ilike(f"%{q}%"),
                Post.content.ilike(f"%{q}%")
            )
        )
    ).limit(limit).all()
    
    for post in posts:
        content = safe_get_attr(post, 'content', '')
        content_preview = content[:100] + "..." if len(content) > 100 else content
        
        results.append(SearchResult(
            type="post",
            id=safe_get_attr(post, 'id', 0),
            title=safe_get_attr(post, 'title', ''),
            description=content_preview,
            created_at=safe_get_attr(post, 'created_at').isoformat() if safe_get_attr(post, 'created_at') else ''
        ))
    
    # 할일 검색
    todos = db.query(Todo).join(Planner).filter(
        and_(
            Planner.team_id.in_(user_team_ids),
            or_(
                Todo.title.ilike(f"%{q}%"),
                Todo.description.ilike(f"%{q}%")
            )
        )
    ).limit(limit).all()
    
    for todo in todos:
        results.append(SearchResult(
            type="todo",
            id=safe_get_attr(todo, 'id', 0),
            title=safe_get_attr(todo, 'title', ''),
            description=safe_get_attr(todo, 'description'),
            created_at=safe_get_attr(todo, 'created_at').isoformat() if safe_get_attr(todo, 'created_at') else ''
        ))
    
    return SearchResponse(
        results=results[:limit],
        total=len(results),
        query=q
    ) 