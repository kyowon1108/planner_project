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
from services.recommendation_service import recommendation_service
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

# ==== FEAT-004: 고도화된 AI 추천 시스템 ====

@router.get("/recommendations/todos")
async def get_smart_todo_recommendations(
    context: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """개인화된 스마트 할 일 추천을 제공합니다."""
    try:
        # 컨텍스트 파싱
        context_data = {}
        if context:
            try:
                context_data = eval(context)  # JSON 형태의 문자열 파싱
            except:
                context_data = {"raw_context": context}
        
        recommendations = await recommendation_service.get_personalized_todo_recommendations(
            db, current_user, context_data
        )
        
        return {
            "recommendations": [
                {
                    "title": rec.title,
                    "description": rec.description,
                    "priority": rec.priority,
                    "category": rec.category,
                    "estimated_time": rec.estimated_time,
                    "confidence": rec.confidence,
                    "reasoning": rec.reasoning,
                    "optimal_time": rec.optimal_time
                }
                for rec in recommendations
            ],
            "user_profile_summary": {
                "productivity_score": 85.0,  # TODO: 실제 프로필에서 가져오기
                "preferred_categories": ["개발", "문서화", "테스트"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"스마트 할 일 추천 중 오류: {str(e)}")

@router.post("/recommendations/feedback")
async def submit_recommendation_feedback(
    recommendation_id: str,
    feedback: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """추천에 대한 사용자 피드백을 수집합니다."""
    try:
        # TODO: 피드백 저장 로직 구현
        # 현재는 로깅만 수행
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"추천 피드백 수신 - 사용자: {current_user.id}, 추천: {recommendation_id}, 피드백: {feedback}")
        
        return {"message": "피드백이 성공적으로 접수되었습니다.", "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"피드백 처리 중 오류: {str(e)}")

@router.get("/insights/productivity")
async def get_productivity_insights(
    period: str = "week",  # week, month, quarter
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """사용자의 생산성 인사이트를 제공합니다."""
    try:
        # 사용자 프로필 분석
        profile = await recommendation_service._analyze_user_profile(db, current_user)
        
        insights = {
            "productivity_score": profile.productivity_score,
            "peak_hours": profile.peak_hours,
            "preferred_task_types": profile.preferred_task_types,
            "avg_completion_times": profile.avg_completion_time,
            "collaboration_style": profile.collaboration_style,
            "work_patterns": profile.work_patterns,
            "recommendations": [
                "오전 시간대(9-11시) 활용도를 높여보세요",
                "복잡한 개발 작업은 집중도가 높은 시간에 배치하세요",
                "정기적인 휴식으로 지속적인 생산성을 유지하세요"
            ],
            "weekly_trend": {
                "completed_tasks": 15,
                "avg_daily_tasks": 2.1,
                "productivity_change": "+12%"
            }
        }
        
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"생산성 인사이트 분석 중 오류: {str(e)}")

@router.post("/analyze/text")
async def analyze_text_for_auto_tagging(
    text: str,
    analysis_type: str = "comprehensive",  # tags, priority, category, comprehensive
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """텍스트를 분석하여 자동 태그, 우선순위, 카테고리를 제안합니다."""
    try:
        # 기존 태그 추천 활용
        recommended_tags = ai_service.recommend_tags(text)
        
        # 우선순위 분석
        priority = ai_service._get_priority_for_todo(text)
        
        # 감정 및 주제 분석
        sentiment_analysis = ai_service.analyze_content_sentiment(text)
        
        # 카테고리 추정
        keywords = ai_service.extract_keywords(text)
        category = "기타"
        for keyword in keywords:
            for cat in ai_service.todo_keywords.keys():
                if keyword in cat or cat in keyword:
                    category = cat
                    break
        
        result = {
            "tags": recommended_tags,
            "priority": priority,
            "category": category,
            "sentiment": sentiment_analysis["sentiment"],
            "topics": sentiment_analysis["topics"],
            "confidence": sentiment_analysis["confidence"],
            "keywords": keywords,
            "suggestions": {
                "estimated_time": ai_service.todo_keywords.get(category, [60])[0] if category != "기타" else 60,
                "best_time_slots": ["09:00-11:00", "14:00-16:00"] if priority == "high" else ["자유시간"],
                "related_tasks": ai_service.todo_keywords.get(category, [])[:3]
            }
        }
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"텍스트 분석 중 오류: {str(e)}")

@router.get("/suggestions/team")
async def get_team_collaboration_suggestions(
    team_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """팀 협업 최적화 제안을 제공합니다."""
    try:
        # TODO: 팀 분석 로직 구현
        # 현재는 모의 데이터 반환
        suggestions = {
            "workload_balance": {
                "status": "unbalanced",
                "recommendations": [
                    "김개발님의 작업량이 평균보다 30% 높습니다",
                    "이디자님께 디자인 관련 작업을 더 배정해보세요",
                    "팀 전체적으로 코드 리뷰 참여도를 높여보세요"
                ]
            },
            "collaboration_patterns": {
                "most_productive_pairs": ["김개발-이테스터", "박기획-최디자인"],
                "communication_frequency": "적절",
                "knowledge_sharing_score": 7.5
            },
            "optimal_meeting_times": ["10:00-11:00", "14:00-15:00"],
            "team_strengths": ["신속한 개발", "꼼꼼한 테스트", "창의적 아이디어"],
            "improvement_areas": ["문서화", "코드 리뷰 프로세스", "일정 준수"]
        }
        
        return suggestions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"팀 협업 분석 중 오류: {str(e)}") 