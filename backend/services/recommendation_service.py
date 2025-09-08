"""
고도화된 AI 추천 시스템 서비스

사용자 행동 패턴 분석과 머신러닝을 활용한 개인화 추천 시스템
"""

import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from collections import defaultdict, Counter
import numpy as np
from dataclasses import dataclass

from models.user import User
from models.todo import Todo
from models.activity import Activity
from models.team import Team, team_members
from services.ai_service import ai_service

logger = logging.getLogger(__name__)

@dataclass
class UserProfile:
    """사용자 생산성 프로필"""
    user_id: int
    peak_hours: List[int]  # 가장 생산적인 시간대
    preferred_task_types: List[str]  # 선호하는 작업 유형
    avg_completion_time: Dict[str, float]  # 작업 유형별 평균 완료 시간
    productivity_score: float  # 생산성 점수 (0-100)
    work_patterns: Dict[str, Any]  # 작업 패턴
    collaboration_style: str  # 협업 스타일

@dataclass 
class RecommendationItem:
    """추천 아이템"""
    title: str
    description: str
    priority: str
    category: str
    estimated_time: int  # 분 단위
    confidence: float  # 추천 신뢰도 (0-1)
    reasoning: str  # 추천 이유
    optimal_time: Optional[str] = None  # 최적 수행 시간

class RecommendationService:
    def __init__(self):
        self.ai_service = ai_service
        
        # 작업 유형별 기본 소요 시간 (분)
        self.default_durations = {
            "회의": 60,
            "개발": 120,
            "디자인": 90,
            "문서화": 45,
            "테스트": 75,
            "리뷰": 30,
            "기획": 60,
            "분석": 90
        }
        
        # 시간대별 생산성 가중치
        self.time_weights = {
            9: 0.9, 10: 1.0, 11: 0.95, 14: 0.85, 15: 0.9, 16: 0.8
        }
    
    async def get_personalized_todo_recommendations(
        self, 
        db: Session, 
        user: User, 
        context: Optional[Dict[str, Any]] = None
    ) -> List[RecommendationItem]:
        """개인화된 할 일 추천"""
        try:
            # 1. 사용자 프로필 분석
            user_profile = await self._analyze_user_profile(db, user)
            
            # 2. 현재 컨텍스트 분석
            current_context = self._analyze_current_context(context or {})
            
            # 3. 사용자 할 일 패턴 분석
            todo_patterns = await self._analyze_todo_patterns(db, user)
            
            # 4. 추천 생성
            recommendations = await self._generate_smart_recommendations(
                db, user, user_profile, current_context, todo_patterns
            )
            
            # 5. 추천 순위 정렬 및 필터링
            sorted_recommendations = self._rank_recommendations(
                recommendations, user_profile, current_context
            )
            
            logger.info(f"사용자 {user.id}에 대해 {len(sorted_recommendations)}개 추천 생성")
            return sorted_recommendations[:10]  # 상위 10개 반환
            
        except Exception as e:
            logger.error(f"개인화 추천 생성 실패: {str(e)}")
            return []
    
    async def _analyze_user_profile(self, db: Session, user: User) -> UserProfile:
        """사용자 생산성 프로필 분석"""
        try:
            # 최근 30일간 사용자 활동 분석
            thirty_days_ago = datetime.now() - timedelta(days=30)
            
            # 할 일 완료 기록 조회
            completed_todos = db.query(Todo).filter(
                and_(
                    Todo.assigned_to == user.id,
                    Todo.status == "completed",
                    Todo.updated_at >= thirty_days_ago
                )
            ).all()
            
            # 활동 로그 조회
            activities = db.query(Activity).filter(
                and_(
                    Activity.user_id == user.id,
                    Activity.created_at >= thirty_days_ago
                )
            ).all()
            
            # 생산적인 시간대 분석
            peak_hours = self._analyze_peak_hours(completed_todos, activities)
            
            # 선호 작업 유형 분석
            preferred_types = self._analyze_preferred_task_types(completed_todos)
            
            # 평균 완료 시간 분석
            avg_completion_time = self._analyze_completion_times(completed_todos)
            
            # 생산성 점수 계산
            productivity_score = self._calculate_productivity_score(
                completed_todos, activities
            )
            
            # 작업 패턴 분석
            work_patterns = self._analyze_work_patterns(completed_todos, activities)
            
            # 협업 스타일 분석
            collaboration_style = await self._analyze_collaboration_style(db, user)
            
            return UserProfile(
                user_id=user.id,
                peak_hours=peak_hours,
                preferred_task_types=preferred_types,
                avg_completion_time=avg_completion_time,
                productivity_score=productivity_score,
                work_patterns=work_patterns,
                collaboration_style=collaboration_style
            )
            
        except Exception as e:
            logger.error(f"사용자 프로필 분석 실패: {str(e)}")
            # 기본값 반환
            return UserProfile(
                user_id=user.id,
                peak_hours=[9, 10, 14, 15],
                preferred_task_types=["개발", "문서화"],
                avg_completion_time={},
                productivity_score=50.0,
                work_patterns={},
                collaboration_style="independent"
            )
    
    def _analyze_peak_hours(self, todos: List[Todo], activities: List[Activity]) -> List[int]:
        """생산적인 시간대 분석"""
        hour_counts = Counter()
        
        # 완료된 할 일의 시간대 분석
        for todo in todos:
            if todo.updated_at:
                hour = todo.updated_at.hour
                hour_counts[hour] += 2  # 완료는 높은 가중치
        
        # 활동 시간대 분석
        for activity in activities:
            if activity.created_at:
                hour = activity.created_at.hour
                hour_counts[hour] += 1
        
        # 상위 4개 시간대 반환
        return [hour for hour, _ in hour_counts.most_common(4)]
    
    def _analyze_preferred_task_types(self, todos: List[Todo]) -> List[str]:
        """선호 작업 유형 분석"""
        type_counts = Counter()
        
        for todo in todos:
            # 할 일 제목/설명에서 키워드 추출하여 유형 분류
            content = f"{todo.title} {todo.description or ''}"
            keywords = self.ai_service.extract_keywords(content)
            
            for keyword in keywords:
                for task_type in self.ai_service.todo_keywords.keys():
                    if keyword in task_type or task_type in keyword:
                        type_counts[task_type] += 1
        
        return [task_type for task_type, _ in type_counts.most_common(5)]
    
    def _analyze_completion_times(self, todos: List[Todo]) -> Dict[str, float]:
        """작업 유형별 평균 완료 시간 분석"""
        completion_times = defaultdict(list)
        
        for todo in todos:
            if todo.created_at and todo.updated_at:
                duration = (todo.updated_at - todo.created_at).total_seconds() / 3600  # 시간 단위
                
                # 작업 유형 추정
                content = f"{todo.title} {todo.description or ''}"
                keywords = self.ai_service.extract_keywords(content)
                
                for keyword in keywords:
                    for task_type in self.ai_service.todo_keywords.keys():
                        if keyword in task_type or task_type in keyword:
                            completion_times[task_type].append(duration)
                            break
        
        # 평균 계산
        avg_times = {}
        for task_type, times in completion_times.items():
            if times:
                avg_times[task_type] = sum(times) / len(times) * 60  # 분 단위로 변환
        
        return avg_times
    
    def _calculate_productivity_score(self, todos: List[Todo], activities: List[Activity]) -> float:
        """생산성 점수 계산 (0-100)"""
        if not todos:
            return 50.0
        
        # 완료율 기반 점수
        total_todos = len(todos)
        completion_rate = total_todos  # 이미 완료된 할 일들만 조회했으므로
        
        # 활동 빈도 기반 점수
        activity_score = min(len(activities) / 30.0 * 20, 20)  # 최대 20점
        
        # 할 일 복잡도 기반 점수 (길이, 우선순위 등)
        complexity_score = 0
        for todo in todos:
            if todo.priority == "high":
                complexity_score += 3
            elif todo.priority == "medium":
                complexity_score += 2
            else:
                complexity_score += 1
        
        complexity_score = min(complexity_score / len(todos) * 30, 30)  # 최대 30점
        
        # 최종 점수 계산
        base_score = 50
        final_score = base_score + activity_score + complexity_score
        
        return min(max(final_score, 0), 100)
    
    def _analyze_work_patterns(self, todos: List[Todo], activities: List[Activity]) -> Dict[str, Any]:
        """작업 패턴 분석"""
        patterns = {
            "daily_todo_count": len(todos) / 30.0 if todos else 0,
            "avg_session_length": 0,
            "preferred_weekdays": [],
            "task_switching_frequency": 0
        }
        
        # 요일별 활동 분석
        weekday_counts = Counter()
        for todo in todos:
            if todo.updated_at:
                weekday_counts[todo.updated_at.weekday()] += 1
        
        patterns["preferred_weekdays"] = [day for day, _ in weekday_counts.most_common(3)]
        
        return patterns
    
    async def _analyze_collaboration_style(self, db: Session, user: User) -> str:
        """협업 스타일 분석"""
        try:
            # 사용자가 속한 팀 수 확인
            team_count = db.query(Team).join(team_members).filter(
                team_members.c.user_id == user.id
            ).count()
            
            # 팀 활동 참여도 확인 (간단한 추정)
            if team_count >= 3:
                return "collaborative"
            elif team_count >= 1:
                return "semi_collaborative"
            else:
                return "independent"
                
        except Exception:
            return "independent"
    
    def _analyze_current_context(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """현재 컨텍스트 분석"""
        current_time = datetime.now()
        
        analyzed_context = {
            "current_hour": current_time.hour,
            "weekday": current_time.weekday(),
            "is_morning": 6 <= current_time.hour < 12,
            "is_afternoon": 12 <= current_time.hour < 18,
            "is_evening": 18 <= current_time.hour < 22,
            "productivity_weight": self.time_weights.get(current_time.hour, 0.7)
        }
        
        # 추가 컨텍스트 정보가 있으면 병합
        analyzed_context.update(context)
        
        return analyzed_context
    
    async def _analyze_todo_patterns(self, db: Session, user: User) -> Dict[str, Any]:
        """할 일 패턴 분석"""
        try:
            # 최근 할 일들 조회
            recent_todos = db.query(Todo).filter(
                and_(
                    Todo.assigned_to == user.id,
                    Todo.created_at >= datetime.now() - timedelta(days=14)
                )
            ).all()
            
            patterns = {
                "common_keywords": [],
                "typical_priorities": [],
                "recurring_themes": [],
                "average_description_length": 0
            }
            
            if recent_todos:
                # 공통 키워드 추출
                all_keywords = []
                priorities = []
                descriptions = []
                
                for todo in recent_todos:
                    content = f"{todo.title} {todo.description or ''}"
                    keywords = self.ai_service.extract_keywords(content)
                    all_keywords.extend(keywords)
                    priorities.append(todo.priority or "low")
                    descriptions.append(len(todo.description or ""))
                
                patterns["common_keywords"] = [k for k, _ in Counter(all_keywords).most_common(10)]
                patterns["typical_priorities"] = [p for p, _ in Counter(priorities).most_common(3)]
                patterns["average_description_length"] = sum(descriptions) / len(descriptions) if descriptions else 0
            
            return patterns
            
        except Exception as e:
            logger.error(f"할 일 패턴 분석 실패: {str(e)}")
            return {}
    
    async def _generate_smart_recommendations(
        self,
        db: Session,
        user: User,
        profile: UserProfile,
        context: Dict[str, Any],
        patterns: Dict[str, Any]
    ) -> List[RecommendationItem]:
        """스마트 추천 생성"""
        recommendations = []
        
        try:
            # 1. 시간 기반 추천
            time_based = self._generate_time_based_recommendations(profile, context)
            recommendations.extend(time_based)
            
            # 2. 패턴 기반 추천
            pattern_based = self._generate_pattern_based_recommendations(profile, patterns)
            recommendations.extend(pattern_based)
            
            # 3. 협업 기반 추천
            collab_based = await self._generate_collaboration_recommendations(db, user, profile)
            recommendations.extend(collab_based)
            
            # 4. 생산성 향상 추천
            productivity_based = self._generate_productivity_recommendations(profile, context)
            recommendations.extend(productivity_based)
            
        except Exception as e:
            logger.error(f"스마트 추천 생성 실패: {str(e)}")
        
        return recommendations
    
    def _generate_time_based_recommendations(
        self, 
        profile: UserProfile, 
        context: Dict[str, Any]
    ) -> List[RecommendationItem]:
        """시간 기반 추천"""
        recommendations = []
        current_hour = context.get("current_hour", 9)
        
        # 현재 시간이 사용자의 생산적 시간대인지 확인
        if current_hour in profile.peak_hours:
            # 중요하고 복잡한 작업 추천
            for task_type in profile.preferred_task_types[:3]:
                recommendations.append(RecommendationItem(
                    title=f"{task_type} 작업 수행",
                    description=f"현재 시간({current_hour}시)은 당신의 생산적인 시간대입니다. {task_type} 작업을 진행해보세요.",
                    priority="high",
                    category=task_type,
                    estimated_time=profile.avg_completion_time.get(task_type, self.default_durations.get(task_type, 60)),
                    confidence=0.85,
                    reasoning=f"생산적 시간대({current_hour}시)와 선호 작업 유형 매칭",
                    optimal_time=f"{current_hour}:00"
                ))
        else:
            # 간단한 작업 추천
            recommendations.append(RecommendationItem(
                title="간단한 정리 작업",
                description="현재 시간대는 간단한 정리나 검토 작업에 적합합니다.",
                priority="low",
                category="정리",
                estimated_time=30,
                confidence=0.6,
                reasoning="비생산적 시간대에 적합한 가벼운 작업"
            ))
        
        return recommendations
    
    def _generate_pattern_based_recommendations(
        self, 
        profile: UserProfile, 
        patterns: Dict[str, Any]
    ) -> List[RecommendationItem]:
        """패턴 기반 추천"""
        recommendations = []
        
        # 일반적인 키워드를 기반으로 추천
        common_keywords = patterns.get("common_keywords", [])
        
        for keyword in common_keywords[:3]:
            # 키워드를 카테고리로 매핑
            category = self._map_keyword_to_category(keyword)
            
            recommendations.append(RecommendationItem(
                title=f"{keyword} 관련 작업",
                description=f"최근 자주 다루는 '{keyword}' 관련 작업을 계속 진행해보세요.",
                priority="medium",
                category=category,
                estimated_time=self.default_durations.get(category, 60),
                confidence=0.75,
                reasoning=f"최근 활동 패턴에서 '{keyword}' 키워드 빈번 출현"
            ))
        
        return recommendations
    
    def _map_keyword_to_category(self, keyword: str) -> str:
        """키워드를 카테고리로 매핑"""
        for category, todos in self.ai_service.todo_keywords.items():
            for todo in todos:
                if keyword in todo or todo in keyword:
                    return category
        return "기타"
    
    async def _generate_collaboration_recommendations(
        self, 
        db: Session, 
        user: User, 
        profile: UserProfile
    ) -> List[RecommendationItem]:
        """협업 기반 추천"""
        recommendations = []
        
        if profile.collaboration_style == "collaborative":
            recommendations.append(RecommendationItem(
                title="팀 회의 준비",
                description="협업을 좋아하는 당신에게 팀 회의나 동료와의 소통 시간을 추천합니다.",
                priority="medium",
                category="협업",
                estimated_time=45,
                confidence=0.7,
                reasoning="협업 선호 성향 기반 추천"
            ))
            
            recommendations.append(RecommendationItem(
                title="코드 리뷰 참여",
                description="동료의 작업을 검토하고 피드백을 제공해보세요.",
                priority="medium",
                category="리뷰",
                estimated_time=30,
                confidence=0.65,
                reasoning="협업 활동 선호 패턴"
            ))
        
        return recommendations
    
    def _generate_productivity_recommendations(
        self, 
        profile: UserProfile, 
        context: Dict[str, Any]
    ) -> List[RecommendationItem]:
        """생산성 향상 추천"""
        recommendations = []
        
        # 생산성 점수가 낮으면 개선 제안
        if profile.productivity_score < 60:
            recommendations.append(RecommendationItem(
                title="작업 계획 수립",
                description="생산성 향상을 위해 오늘의 작업 계획을 세워보세요.",
                priority="high",
                category="기획",
                estimated_time=20,
                confidence=0.8,
                reasoning="낮은 생산성 점수 개선을 위한 계획 수립"
            ))
        
        # 휴식 시간 추천
        if context.get("is_afternoon", False):
            recommendations.append(RecommendationItem(
                title="짧은 휴식",
                description="오후 시간대입니다. 5-10분 휴식을 취해보세요.",
                priority="low",
                category="휴식",
                estimated_time=10,
                confidence=0.6,
                reasoning="오후 시간대 에너지 회복을 위한 휴식 권장"
            ))
        
        return recommendations
    
    def _rank_recommendations(
        self, 
        recommendations: List[RecommendationItem], 
        profile: UserProfile, 
        context: Dict[str, Any]
    ) -> List[RecommendationItem]:
        """추천 항목 순위 정렬"""
        
        def calculate_score(item: RecommendationItem) -> float:
            score = item.confidence * 100
            
            # 선호 작업 유형 가산점
            if item.category in profile.preferred_task_types:
                score += 20
            
            # 시간대 가산점
            productivity_weight = context.get("productivity_weight", 0.7)
            score *= productivity_weight
            
            # 우선순위 가산점
            priority_weights = {"high": 1.2, "medium": 1.0, "low": 0.8}
            score *= priority_weights.get(item.priority, 1.0)
            
            return score
        
        # 점수 기반 정렬
        recommendations.sort(key=calculate_score, reverse=True)
        
        return recommendations

# 전역 추천 서비스 인스턴스
recommendation_service = RecommendationService()