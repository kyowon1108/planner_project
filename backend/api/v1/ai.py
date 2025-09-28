from fastapi import APIRouter, Depends, HTTPException, status
from schemas.ai import (
    TagRecommendationRequest, 
    TagRecommendationResponse,
    TodoRecommendationRequest,
    TodoRecommendationResponse,
    ContentAnalysisRequest,
    ContentAnalysisResponse
)
from schemas.recommendation import (
    PersonalizedRecommendationRequest,
    PersonalizedRecommendationResponse,
    RecommendationFeedbackRequest,
    RecommendationFeedbackResponse,
    ProductivityInsightResponse,
    SmartTextAnalysisRequest,
    SmartTextAnalysisResponse,
    TeamCollaborationRequest,
    TeamCollaborationResponse,
    UserAIProfileUpdate,
    UserAIProfileResponse
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

@router.post("/recommendations/personalized", response_model=PersonalizedRecommendationResponse)
async def get_personalized_recommendations(
    request: PersonalizedRecommendationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """고도화된 개인화 추천 시스템 - 사용자 패턴 분석 기반"""
    try:
        from datetime import datetime
        import uuid
        
        # 사용자 AI 프로필 업데이트 (24시간마다)
        profile = await recommendation_service.update_user_ai_profile(db, current_user)
        
        # 개인화된 추천 생성
        recommendations = await recommendation_service.get_personalized_todo_recommendations(
            db, current_user, request.context or {}
        )
        
        # 카테고리 필터링 적용
        if request.categories:
            recommendations = [
                rec for rec in recommendations 
                if rec.category in request.categories
            ]
        
        # 개수 제한
        recommendations = recommendations[:request.limit]
        
        # 추천 이력 저장
        await recommendation_service.save_recommendation_history(
            db, current_user.id, recommendations, request.context or {}
        )
        
        # 응답 데이터 구성
        recommendation_items = []
        for rec in recommendations:
            recommendation_items.append({
                "title": rec.title,
                "description": rec.description,
                "priority": rec.priority,
                "category": rec.category,
                "estimated_time": rec.estimated_time,
                "confidence": rec.confidence,
                "reasoning": rec.reasoning,
                "optimal_time": rec.optimal_time,
                "recommendation_id": str(uuid.uuid4()),
                "created_at": datetime.now()
            })
        
        return PersonalizedRecommendationResponse(
            recommendations=recommendation_items,
            user_profile_summary={
                "productivity_score": profile.productivity_score,
                "preferred_categories": profile.preferred_task_types,
                "peak_hours": profile.peak_hours,
                "collaboration_style": profile.collaboration_style,
                "last_analysis": current_user.ai_last_analysis
            },
            analysis_timestamp=datetime.now(),
            algorithm_version="2.0"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"개인화 추천 생성 중 오류: {str(e)}")

@router.get("/recommendations/todos")
async def get_smart_todo_recommendations(
    context: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """기존 호환성을 위한 간단한 할 일 추천 (deprecated)"""
    try:
        # 컨텍스트 파싱
        context_data = {}
        if context:
            try:
                import json
                context_data = json.loads(context)
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
                for rec in recommendations[:10]
            ],
            "user_profile_summary": {
                "productivity_score": current_user.ai_productivity_score or 50.0,
                "preferred_categories": current_user.ai_preferred_task_types or ["기타"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"스마트 할 일 추천 중 오류: {str(e)}")

@router.post("/recommendations/feedback", response_model=RecommendationFeedbackResponse)
async def submit_recommendation_feedback(
    request: RecommendationFeedbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """향상된 추천 피드백 시스템 - 학습 기능 포함"""
    try:
        # 피드백 데이터 준비
        feedback_data = {
            "recommendation_id": request.recommendation_id,
            "feedback_type": request.feedback_type,
            "usefulness_score": request.usefulness_score,
            "accuracy_score": request.accuracy_score,
            "feedback_notes": request.feedback_notes
        }
        
        # 피드백 처리 및 학습
        result = await recommendation_service.process_recommendation_feedback(
            db, current_user.id, request.recommendation_id, feedback_data
        )
        
        return RecommendationFeedbackResponse(
            message=result.get("message", "피드백 처리 완료"),
            status=result.get("status", "success"),
            feedback_id=result.get("feedback_id"),
            updated_profile=result.get("learning_applied", False)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"피드백 처리 중 오류: {str(e)}")

@router.get("/insights/productivity", response_model=ProductivityInsightResponse)
async def get_advanced_productivity_insights(
    period: str = "week",  # week, month, quarter
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """고도화된 생산성 인사이트 - AI 분석 및 개선 제안"""
    try:
        # 고도화된 생산성 인사이트 생성
        insights = await recommendation_service.generate_productivity_insights(
            db, current_user, period
        )
        
        return ProductivityInsightResponse(
            productivity_score=insights.get("productivity_score", 50.0),
            peak_hours=insights.get("peak_hours", [9, 14]),
            preferred_task_types=insights.get("preferred_task_types", ["기타"]),
            avg_completion_times=insights.get("avg_completion_times", {}),
            collaboration_style=insights.get("collaboration_style", "independent"),
            work_patterns=insights.get("work_patterns", {}),
            recommendations=insights.get("recommendations", []),
            weekly_trend=insights.get("weekly_trend", {
                "completed_tasks": 0,
                "avg_daily_tasks": 0.0,
                "productivity_change": "0%"
            })
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"생산성 인사이트 분석 중 오류: {str(e)}")

@router.post("/analyze/smart-text", response_model=SmartTextAnalysisResponse)
async def analyze_smart_text(
    request: SmartTextAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """고도화된 스마트 텍스트 분석 - AI 기반 자동 분류 및 제안"""
    try:
        # 기존 태그 추천 활용
        recommended_tags = ai_service.recommend_tags(request.text)
        
        # 우선순위 분석
        priority = ai_service._get_priority_for_todo(request.text)
        
        # 감정 및 주제 분석
        sentiment_analysis = ai_service.analyze_content_sentiment(request.text)
        
        # 카테고리 추정 (사용자 프로필 고려)
        keywords = ai_service.extract_keywords(request.text)
        
        # 사용자 선호 카테고리 기반 개선된 분류
        user_preferred = current_user.ai_preferred_task_types or []
        if isinstance(user_preferred, str):
            import json
            try:
                user_preferred = json.loads(user_preferred)
            except:
                user_preferred = []
        
        category = "기타"
        best_match_score = 0
        
        for keyword in keywords:
            for cat in ai_service.todo_keywords.keys():
                if keyword in cat or cat in keyword:
                    score = 1
                    if cat in user_preferred:
                        score += 0.5  # 사용자 선호도 보너스
                    if score > best_match_score:
                        category = cat
                        best_match_score = score
        
        # 사용자의 생산적 시간대 기반 제안
        peak_hours = current_user.ai_peak_hours or []
        if isinstance(peak_hours, str):
            try:
                peak_hours = json.loads(peak_hours)
            except:
                peak_hours = [9, 10, 14, 15]
        
        best_time_slots = []
        if priority == "high" and peak_hours:
            best_time_slots = [f"{h:02d}:00-{(h+1):02d}:00" for h in peak_hours[:2]]
        else:
            best_time_slots = ["자유시간"]
        
        # 예상 소요시간 계산 (사용자 이력 기반)
        default_time = 60
        if category in ai_service.todo_keywords:
            default_time = len(ai_service.todo_keywords[category]) * 15  # 대략적 추정
        
        return SmartTextAnalysisResponse(
            tags=recommended_tags,
            priority=priority,
            category=category,
            sentiment=sentiment_analysis["sentiment"],
            topics=sentiment_analysis["topics"],
            confidence=sentiment_analysis["confidence"],
            keywords=keywords,
            suggestions={
                "estimated_time": default_time,
                "best_time_slots": best_time_slots,
                "related_tasks": ai_service.todo_keywords.get(category, [])[:3],
                "user_context": {
                    "matches_preference": category in user_preferred,
                    "productivity_score": current_user.ai_productivity_score or 50.0,
                    "collaboration_style": current_user.ai_collaboration_style or "independent"
                }
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"스마트 텍스트 분석 중 오류: {str(e)}")

@router.post("/analyze/text")
async def analyze_text_for_auto_tagging(
    text: str,
    analysis_type: str = "comprehensive",  # tags, priority, category, comprehensive
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """기존 호환성을 위한 텍스트 분석 (deprecated)"""
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
                "estimated_time": 60,
                "best_time_slots": ["09:00-11:00", "14:00-16:00"] if priority == "high" else ["자유시간"],
                "related_tasks": ai_service.todo_keywords.get(category, [])[:3]
            }
        }
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"텍스트 분석 중 오류: {str(e)}")

@router.post("/analyze/team-collaboration", response_model=TeamCollaborationResponse)
async def analyze_team_collaboration(
    request: TeamCollaborationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """고도화된 팀 협업 패턴 분석 및 최적화 제안"""
    try:
        # 팀 협업 패턴 분석
        analysis = await recommendation_service.analyze_team_collaboration_patterns(
            db, request.team_id, current_user
        )
        
        return TeamCollaborationResponse(
            workload_balance=analysis.get("workload_balance", {}),
            collaboration_patterns=analysis.get("collaboration_patterns", {}),
            optimal_meeting_times=analysis.get("optimal_meeting_times", []),
            team_strengths=analysis.get("team_strengths", []),
            improvement_areas=analysis.get("improvement_areas", []),
            productivity_metrics=analysis.get("productivity_metrics", {})
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"팀 협업 분석 중 오류: {str(e)}")

@router.get("/suggestions/team")
async def get_team_collaboration_suggestions(
    team_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """기존 호환성을 위한 팀 협업 제안 (deprecated)"""
    try:
        suggestions = {
            "workload_balance": {
                "status": "balanced",
                "recommendations": [
                    "현재 팀 워크로드가 적절히 분산되어 있습니다",
                    "정기적인 작업량 점검을 통해 균형을 유지하세요"
                ]
            },
            "collaboration_patterns": {
                "most_productive_pairs": ["개발자A-디자이너B"],
                "communication_frequency": "적절",
                "knowledge_sharing_score": 8.0
            },
            "optimal_meeting_times": ["10:00-11:00", "14:00-15:00"],
            "team_strengths": ["효율적인 커뮤니케이션", "빠른 의사결정"],
            "improvement_areas": ["문서화 프로세스", "코드 리뷰"]
        }
        
        return suggestions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"팀 협업 분석 중 오류: {str(e)}")

# ===== 사용자 AI 프로필 관리 =====

@router.get("/profile", response_model=UserAIProfileResponse)
async def get_user_ai_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """사용자의 AI 프로필 조회"""
    try:
        return UserAIProfileResponse(
            ai_productivity_score=current_user.ai_productivity_score or 50.0,
            ai_peak_hours=current_user.ai_peak_hours,
            ai_preferred_task_types=current_user.ai_preferred_task_types,
            ai_work_patterns=current_user.ai_work_patterns,
            ai_collaboration_style=current_user.ai_collaboration_style or "independent",
            ai_last_analysis=current_user.ai_last_analysis,
            ai_recommendations_enabled=current_user.ai_recommendations_enabled
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 프로필 조회 중 오류: {str(e)}")

@router.put("/profile", response_model=UserAIProfileResponse)
async def update_user_ai_profile(
    request: UserAIProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """사용자의 AI 프로필 수동 업데이트"""
    try:
        import json
        
        # 제공된 필드만 업데이트
        update_data = request.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            if field in ['ai_peak_hours', 'ai_preferred_task_types', 'ai_work_patterns'] and value is not None:
                setattr(current_user, field, json.dumps(value))
            elif hasattr(current_user, field):
                setattr(current_user, field, value)
        
        db.commit()
        db.refresh(current_user)
        
        return UserAIProfileResponse(
            ai_productivity_score=current_user.ai_productivity_score or 50.0,
            ai_peak_hours=current_user.ai_peak_hours,
            ai_preferred_task_types=current_user.ai_preferred_task_types,
            ai_work_patterns=current_user.ai_work_patterns,
            ai_collaboration_style=current_user.ai_collaboration_style or "independent",
            ai_last_analysis=current_user.ai_last_analysis,
            ai_recommendations_enabled=current_user.ai_recommendations_enabled
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"AI 프로필 업데이트 중 오류: {str(e)}")

@router.post("/profile/analyze")
async def force_analyze_user_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """사용자 프로필 강제 재분석"""
    try:
        # 강제 프로필 업데이트
        profile = await recommendation_service.update_user_ai_profile(
            db, current_user, force_update=True
        )
        
        return {
            "message": "사용자 프로필 분석이 완료되었습니다",
            "analysis_completed": True,
            "productivity_score": profile.productivity_score,
            "peak_hours": profile.peak_hours,
            "preferred_task_types": profile.preferred_task_types,
            "collaboration_style": profile.collaboration_style
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"프로필 분석 중 오류: {str(e)}") 