from fastapi import APIRouter, Depends, HTTPException, status
from schemas.ai import (
    TagRecommendationRequest, 
    TagRecommendationResponse,
    TodoRecommendationRequest,
    TodoRecommendationResponse,
    ContentAnalysisRequest,
    ContentAnalysisResponse
)
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from services.ai_service import ai_service
from database import get_db
from api.v1.users import get_current_user
from models.user import User

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/recommend-tags", response_model=TagRecommendationResponse)
def recommend_tags(
    request: TagRecommendationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """게시글 내용을 기반으로 태그를 추천합니다."""
    try:
        recommended_tags = ai_service.recommend_tags(
            content=request.content,
            existing_tags=request.existing_tags or []
        )
        return TagRecommendationResponse(recommended_tags=recommended_tags)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"태그 추천 중 오류가 발생했습니다: {str(e)}")

@router.post("/recommend-todos", response_model=TodoRecommendationResponse)
def recommend_todos_from_planner(
    request: TodoRecommendationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """플래너 설명을 기반으로 할일을 추천합니다."""
    try:
        recommended_todos = ai_service.recommend_todos_from_planner(
            planner_description=request.planner_description,
            existing_todos=request.existing_todos or []
        )
        
        # Dict를 TodoRecommendationItem으로 변환
        todo_items = []
        for todo in recommended_todos:
            todo_items.append({
                "title": todo["title"],
                "description": todo["description"],
                "priority": todo["priority"],
                "category": todo["category"]
            })
        
        return TodoRecommendationResponse(recommended_todos=todo_items)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"할일 추천 중 오류가 발생했습니다: {str(e)}")

@router.post("/analyze-content", response_model=ContentAnalysisResponse)
def analyze_content(
    request: ContentAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """내용의 감정과 주제를 분석합니다."""
    try:
        analysis = ai_service.analyze_content_sentiment(request.content)
        return ContentAnalysisResponse(
            sentiment=analysis["sentiment"],
            topics=analysis["topics"],
            confidence=analysis["confidence"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"내용 분석 중 오류가 발생했습니다: {str(e)}") 