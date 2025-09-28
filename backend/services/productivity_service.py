"""
생산성 분석 서비스

사용자의 시간 추적 데이터를 분석하여 생산성 인사이트를 제공합니다.
개인 및 팀 생산성 패턴 분석, 예측, 개선 제안 등의 기능을 포함합니다.
"""

from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, extract, desc, asc
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional, Tuple
import json
import statistics
from collections import defaultdict, Counter
from dataclasses import dataclass

from models.time_entry import TimeEntry, ProductivityMetrics
from models.user import User
from models.todo import Todo
from models.planner import Planner
from schemas.time_entry import (
    ProductivityInsights, CategoryAnalysis, TimePatternAnalysis,
    WeeklyTrend, TeamProductivityComparison
)
from services.time_service import TimeService


@dataclass
class ProductivityTrend:
    """생산성 트렌드 분석 결과"""
    period: str
    value: float
    change_rate: float
    trend_direction: str  # "increasing", "decreasing", "stable"


class ProductivityAnalyticsService:
    """생산성 분석 서비스 클래스"""
    
    def __init__(self):
        self.logger = None
    
    # === 기본 생산성 분석 ===
    
    async def get_user_productivity_insights(
        self, 
        db: Session, 
        user_id: int, 
        start_date: Optional[date] = None, 
        end_date: Optional[date] = None
    ) -> ProductivityInsights:
        """사용자의 종합 생산성 인사이트를 생성합니다."""
        
        # 기본 날짜 범위 설정 (최근 30일)
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=29)
        
        # 기본 통계 계산
        time_entries = db.query(TimeEntry).filter(
            and_(
                TimeEntry.user_id == user_id,
                func.date(TimeEntry.start_time) >= start_date,
                func.date(TimeEntry.start_time) <= end_date
            )
        ).all()
        
        if not time_entries:
            return self._create_empty_insights(user_id, start_date, end_date)
        
        # 기본 메트릭 계산
        total_minutes = sum(entry.actual_duration_minutes for entry in time_entries)
        total_hours = total_minutes / 60.0
        total_tasks = len([e for e in time_entries if not e.is_active])
        days_in_period = (end_date - start_date).days + 1
        avg_daily_hours = total_hours / days_in_period
        
        # 생산성 점수 계산
        productivity_scores = [e.productivity_score for e in time_entries if e.productivity_score is not None]
        focus_scores = [e.focus_score for e in time_entries if e.focus_score is not None]
        
        overall_productivity = statistics.mean(productivity_scores) if productivity_scores else None
        overall_focus = statistics.mean(focus_scores) if focus_scores else None
        
        # 효율성 비율 계산
        total_work_time = sum(entry.duration_minutes or 0 for entry in time_entries)
        total_focused_time = sum(entry.actual_duration_minutes for entry in time_entries)
        efficiency_ratio = total_focused_time / total_work_time if total_work_time > 0 else 0
        
        # 패턴 분석
        peak_hours = self._analyze_peak_productivity_hours(time_entries)
        category_analysis = self._analyze_categories(time_entries)
        time_patterns = self._analyze_hourly_patterns(time_entries)
        weekly_trends = self._analyze_weekly_trends(db, user_id, start_date, end_date)
        
        # 개선 제안 생성
        recommendations = self._generate_recommendations(
            time_entries, overall_productivity, efficiency_ratio, peak_hours
        )
        
        # 목표 대비 성과 (기본값: 주 40시간)
        weekly_goal_hours = 40.0
        weeks_in_period = days_in_period / 7.0
        expected_hours = weekly_goal_hours * weeks_in_period
        goal_achievement_rate = (total_hours / expected_hours) * 100 if expected_hours > 0 else 0
        
        return ProductivityInsights(
            user_id=user_id,
            analysis_period={"start": start_date, "end": end_date},
            total_tracked_hours=round(total_hours, 2),
            total_tasks_completed=total_tasks,
            average_daily_hours=round(avg_daily_hours, 2),
            overall_productivity_score=round(overall_productivity, 2) if overall_productivity else None,
            overall_focus_score=round(overall_focus, 2) if overall_focus else None,
            efficiency_ratio=round(efficiency_ratio, 3),
            peak_productivity_hours=peak_hours,
            most_productive_categories=category_analysis,
            time_patterns=time_patterns,
            weekly_trends=weekly_trends,
            recommendations=recommendations,
            weekly_goal_hours=weekly_goal_hours,
            goal_achievement_rate=round(goal_achievement_rate, 1) if goal_achievement_rate else None
        )
    
    def _analyze_peak_productivity_hours(self, time_entries: List[TimeEntry]) -> List[int]:
        """최고 생산성 시간대를 분석합니다."""
        hour_productivity = defaultdict(list)
        
        for entry in time_entries:
            if entry.productivity_score is not None:
                hour = entry.start_time.hour
                hour_productivity[hour].append(entry.productivity_score)
        
        # 시간대별 평균 생산성 계산
        hour_averages = {
            hour: statistics.mean(scores) 
            for hour, scores in hour_productivity.items()
        }
        
        # 상위 3개 시간대 반환
        top_hours = sorted(hour_averages.items(), key=lambda x: x[1], reverse=True)[:3]
        return [hour for hour, _ in top_hours]
    
    def _analyze_categories(self, time_entries: List[TimeEntry]) -> List[CategoryAnalysis]:
        """카테고리별 생산성 분석을 수행합니다."""
        category_data = defaultdict(lambda: {
            'total_minutes': 0, 
            'task_count': 0, 
            'productivity_scores': []
        })
        
        for entry in time_entries:
            category = entry.category or "기타"
            category_data[category]['total_minutes'] += entry.actual_duration_minutes
            category_data[category]['task_count'] += 1
            if entry.productivity_score is not None:
                category_data[category]['productivity_scores'].append(entry.productivity_score)
        
        # CategoryAnalysis 객체 생성
        analyses = []
        for category, data in category_data.items():
            avg_duration = data['total_minutes'] / data['task_count'] if data['task_count'] > 0 else 0
            avg_productivity = statistics.mean(data['productivity_scores']) if data['productivity_scores'] else None
            
            analyses.append(CategoryAnalysis(
                category=category,
                total_minutes=data['total_minutes'],
                task_count=data['task_count'],
                average_duration=round(avg_duration, 1),
                productivity_score=round(avg_productivity, 2) if avg_productivity else None
            ))
        
        # 총 작업 시간 기준으로 정렬
        return sorted(analyses, key=lambda x: x.total_minutes, reverse=True)
    
    def _analyze_hourly_patterns(self, time_entries: List[TimeEntry]) -> List[TimePatternAnalysis]:
        """시간대별 패턴을 분석합니다."""
        hourly_data = defaultdict(lambda: {
            'total_minutes': 0,
            'productivity_scores': [],
            'focus_scores': []
        })
        
        for entry in time_entries:
            hour = entry.start_time.hour
            hourly_data[hour]['total_minutes'] += entry.actual_duration_minutes
            if entry.productivity_score is not None:
                hourly_data[hour]['productivity_scores'].append(entry.productivity_score)
            if entry.focus_score is not None:
                hourly_data[hour]['focus_scores'].append(entry.focus_score)
        
        patterns = []
        for hour in range(24):
            if hour in hourly_data:
                data = hourly_data[hour]
                patterns.append(TimePatternAnalysis(
                    hour=hour,
                    total_minutes=data['total_minutes'],
                    productivity_score=round(statistics.mean(data['productivity_scores']), 2) 
                                     if data['productivity_scores'] else None,
                    focus_score=round(statistics.mean(data['focus_scores']), 2) 
                                if data['focus_scores'] else None
                ))
        
        return sorted(patterns, key=lambda x: x.hour)
    
    def _analyze_weekly_trends(
        self, 
        db: Session, 
        user_id: int, 
        start_date: date, 
        end_date: date
    ) -> List[WeeklyTrend]:
        """주별 트렌드를 분석합니다."""
        trends = []
        current_date = start_date
        
        while current_date <= end_date:
            # 주의 시작일 (월요일)
            week_start = current_date - timedelta(days=current_date.weekday())
            week_end = week_start + timedelta(days=6)
            
            # 해당 주의 시간 기록 조회
            week_entries = db.query(TimeEntry).filter(
                and_(
                    TimeEntry.user_id == user_id,
                    func.date(TimeEntry.start_time) >= week_start,
                    func.date(TimeEntry.start_time) <= week_end
                )
            ).all()
            
            if week_entries:
                total_minutes = sum(entry.actual_duration_minutes for entry in week_entries)
                tasks_completed = len([e for e in week_entries if not e.is_active])
                
                productivity_scores = [e.productivity_score for e in week_entries if e.productivity_score is not None]
                avg_productivity = statistics.mean(productivity_scores) if productivity_scores else None
                
                # 효율성 계산
                total_work_time = sum(entry.duration_minutes or 0 for entry in week_entries)
                efficiency = (sum(entry.actual_duration_minutes for entry in week_entries) / total_work_time) if total_work_time > 0 else 0
                
                trends.append(WeeklyTrend(
                    week_start=week_start,
                    total_minutes=total_minutes,
                    tasks_completed=tasks_completed,
                    average_productivity=round(avg_productivity, 2) if avg_productivity else None,
                    efficiency_ratio=round(efficiency, 3)
                ))
            
            current_date = week_end + timedelta(days=1)
        
        return trends
    
    def _generate_recommendations(
        self, 
        time_entries: List[TimeEntry], 
        avg_productivity: Optional[float], 
        efficiency_ratio: float, 
        peak_hours: List[int]
    ) -> List[str]:
        """개인화된 개선 제안을 생성합니다."""
        recommendations = []
        
        # 생산성 점수 기반 제안
        if avg_productivity is not None:
            if avg_productivity < 6.0:
                recommendations.append("전반적인 생산성 향상을 위해 작업 환경을 개선해보세요")
                recommendations.append("집중을 방해하는 요소들을 제거하고 포모도로 기법을 시도해보세요")
            elif avg_productivity >= 8.0:
                recommendations.append("높은 생산성을 유지하고 계세요! 현재 패턴을 지속하세요")
        
        # 효율성 비율 기반 제안
        if efficiency_ratio < 0.7:
            recommendations.append("작업 중단 시간이 많습니다. 연속 작업 시간을 늘려보세요")
            recommendations.append("알림을 끄고 Deep Work 시간을 설정해보세요")
        
        # 최고 생산성 시간대 활용 제안
        if peak_hours:
            peak_hours_str = ", ".join([f"{h}시" for h in sorted(peak_hours)])
            recommendations.append(f"가장 생산적인 시간대({peak_hours_str})에 중요한 작업을 배치하세요")
        
        # 작업 패턴 기반 제안
        total_tasks = len(time_entries)
        completed_tasks = len([e for e in time_entries if not e.is_active])
        
        if total_tasks > 0:
            completion_rate = completed_tasks / total_tasks
            if completion_rate < 0.8:
                recommendations.append("작업 완료율을 높이기 위해 작은 단위로 작업을 나누어보세요")
        
        # 카테고리별 시간 분배 분석
        category_minutes = defaultdict(int)
        for entry in time_entries:
            category = entry.category or "기타"
            category_minutes[category] += entry.actual_duration_minutes
        
        if len(category_minutes) > 1:
            total_minutes = sum(category_minutes.values())
            dominant_category = max(category_minutes.items(), key=lambda x: x[1])
            if dominant_category[1] / total_minutes > 0.7:
                recommendations.append("작업 다양성을 높이기 위해 다른 카테고리의 작업도 균형있게 진행해보세요")
        
        # 기본 제안사항
        if len(recommendations) < 3:
            recommendations.extend([
                "정기적인 휴식을 통해 지속적인 집중력을 유지하세요",
                "작업 전 명확한 목표를 설정하면 생산성이 향상됩니다",
                "하루 종료 시 성과를 기록하고 다음날을 계획하세요"
            ])
        
        return recommendations[:5]  # 최대 5개 제안
    
    def _create_empty_insights(self, user_id: int, start_date: date, end_date: date) -> ProductivityInsights:
        """데이터가 없을 때 기본 인사이트를 생성합니다."""
        return ProductivityInsights(
            user_id=user_id,
            analysis_period={"start": start_date, "end": end_date},
            total_tracked_hours=0.0,
            total_tasks_completed=0,
            average_daily_hours=0.0,
            overall_productivity_score=None,
            overall_focus_score=None,
            efficiency_ratio=0.0,
            peak_productivity_hours=[],
            most_productive_categories=[],
            time_patterns=[],
            weekly_trends=[],
            recommendations=[
                "시간 추적을 시작하여 생산성 패턴을 파악해보세요",
                "작은 작업부터 시작하여 꾸준히 기록을 축적하세요",
                "목표를 설정하고 달성 과정을 추적해보세요"
            ],
            weekly_goal_hours=40.0,
            goal_achievement_rate=0.0
        )
    
    # === 팀 생산성 분석 ===
    
    async def get_team_productivity_insights(
        self, 
        db: Session, 
        team_id: int, 
        start_date: Optional[date] = None, 
        end_date: Optional[date] = None
    ) -> TeamProductivityComparison:
        """팀 생산성 비교 분석을 수행합니다."""
        
        if not end_date:
            end_date = date.today()
        if not start_date:
            start_date = end_date - timedelta(days=29)
        
        # 팀 멤버들의 시간 기록 조회
        team_entries = db.query(TimeEntry).join(User).filter(
            and_(
                TimeEntry.start_time >= start_date,
                TimeEntry.start_time <= end_date + timedelta(days=1),
                # TODO: 실제 팀 멤버십 조건 추가 필요
            )
        ).all()
        
        # 팀 전체 통계 계산
        team_total_minutes = sum(entry.actual_duration_minutes for entry in team_entries)
        team_total_hours = team_total_minutes / 60.0
        team_total_tasks = len([e for e in team_entries if not e.is_active])
        
        productivity_scores = [e.productivity_score for e in team_entries if e.productivity_score is not None]
        team_avg_productivity = statistics.mean(productivity_scores) if productivity_scores else None
        
        # 개인별 기여도 분석
        member_stats = defaultdict(lambda: {
            'user_id': 0,
            'name': '',
            'total_hours': 0,
            'tasks_completed': 0,
            'productivity_score': None,
            'contribution_percentage': 0
        })
        
        for entry in team_entries:
            user_id = entry.user_id
            member_stats[user_id]['user_id'] = user_id
            member_stats[user_id]['name'] = entry.user.name if entry.user else f"User {user_id}"
            member_stats[user_id]['total_hours'] += entry.actual_duration_minutes / 60.0
            if not entry.is_active:
                member_stats[user_id]['tasks_completed'] += 1
        
        # 기여도 퍼센티지 계산
        for user_id, stats in member_stats.items():
            if team_total_hours > 0:
                stats['contribution_percentage'] = (stats['total_hours'] / team_total_hours) * 100
        
        member_contributions = list(member_stats.values())
        
        # 워크로드 밸런스 분석
        if member_contributions:
            hours_list = [m['total_hours'] for m in member_contributions]
            avg_hours = statistics.mean(hours_list)
            std_hours = statistics.stdev(hours_list) if len(hours_list) > 1 else 0
            
            # 워크로드 밸런스 점수 (낮을수록 불균형)
            workload_balance_score = max(0, 100 - (std_hours / avg_hours * 100)) if avg_hours > 0 else 100
            
            # 과로/저활용 멤버 식별 (평균 대비 30% 이상 차이)
            threshold = avg_hours * 0.3
            overworked = [m for m in member_contributions if m['total_hours'] > avg_hours + threshold]
            underutilized = [m for m in member_contributions if m['total_hours'] < avg_hours - threshold]
        else:
            workload_balance_score = 100
            overworked = []
            underutilized = []
        
        return TeamProductivityComparison(
            team_id=team_id,
            analysis_period={"start": start_date, "end": end_date},
            team_total_hours=round(team_total_hours, 2),
            team_total_tasks=team_total_tasks,
            team_average_productivity=round(team_avg_productivity, 2) if team_avg_productivity else None,
            member_contributions=member_contributions,
            collaboration_score=None,  # TODO: 협업 점수 계산 로직 추가
            communication_frequency="적절",  # TODO: 실제 소통 빈도 분석
            knowledge_sharing_index=None,  # TODO: 지식 공유 지수 계산
            workload_balance_score=round(workload_balance_score, 1),
            overworked_members=overworked,
            underutilized_members=underutilized
        )
    
    # === 예측 및 목표 설정 ===
    
    def predict_task_completion_time(
        self, 
        db: Session, 
        user_id: int, 
        category: Optional[str] = None,
        complexity: str = "medium"
    ) -> Dict[str, Any]:
        """작업 완료 시간을 예측합니다."""
        
        # 유사한 카테고리의 과거 데이터 조회
        query = db.query(TimeEntry).filter(
            and_(
                TimeEntry.user_id == user_id,
                TimeEntry.is_active == False,  # 완료된 작업만
                TimeEntry.duration_minutes.isnot(None)
            )
        )
        
        if category:
            query = query.filter(TimeEntry.category == category)
        
        historical_entries = query.order_by(desc(TimeEntry.created_at)).limit(50).all()
        
        if not historical_entries:
            # 기본 예측값 반환
            base_times = {"low": 30, "medium": 60, "high": 120}
            return {
                "predicted_minutes": base_times.get(complexity, 60),
                "confidence": 0.3,
                "range": {
                    "min": int(base_times.get(complexity, 60) * 0.7),
                    "max": int(base_times.get(complexity, 60) * 1.5)
                },
                "data_points": 0
            }
        
        # 과거 데이터 기반 예측
        durations = [entry.actual_duration_minutes for entry in historical_entries]
        
        # 복잡도별 가중치 적용
        complexity_multipliers = {"low": 0.8, "medium": 1.0, "high": 1.3}
        multiplier = complexity_multipliers.get(complexity, 1.0)
        
        avg_duration = statistics.mean(durations) * multiplier
        std_duration = statistics.stdev(durations) if len(durations) > 1 else avg_duration * 0.3
        
        # 신뢰도 계산 (데이터 포인트 수와 일관성 기반)
        confidence = min(0.9, len(durations) / 20.0)  # 최대 20개 데이터로 90% 신뢰도
        
        return {
            "predicted_minutes": int(avg_duration),
            "confidence": round(confidence, 2),
            "range": {
                "min": max(15, int(avg_duration - std_duration)),
                "max": int(avg_duration + std_duration)
            },
            "data_points": len(durations),
            "category": category,
            "complexity": complexity
        }
    
    def generate_productivity_goals(
        self, 
        db: Session, 
        user_id: int, 
        target_period_days: int = 30
    ) -> Dict[str, Any]:
        """개인화된 생산성 목표를 생성합니다."""
        
        # 최근 30일 데이터를 기반으로 현재 성과 분석
        end_date = date.today()
        start_date = end_date - timedelta(days=29)
        
        recent_entries = db.query(TimeEntry).filter(
            and_(
                TimeEntry.user_id == user_id,
                func.date(TimeEntry.start_time) >= start_date,
                func.date(TimeEntry.start_time) <= end_date
            )
        ).all()
        
        if not recent_entries:
            # 기본 목표 설정
            return {
                "daily_hours_goal": 6.0,
                "weekly_tasks_goal": 15,
                "productivity_score_goal": 7.5,
                "focus_improvement_target": 0.1,
                "recommendations": [
                    "시간 추적을 시작하여 기준점을 설정하세요",
                    "하루 6시간의 집중 작업을 목표로 하세요",
                    "주간 15개 작업 완료를 목표로 하세요"
                ],
                "target_period_days": target_period_days
            }
        
        # 현재 성과 계산
        total_hours = sum(entry.actual_duration_minutes for entry in recent_entries) / 60.0
        total_tasks = len([e for e in recent_entries if not e.is_active])
        avg_daily_hours = total_hours / 30
        avg_weekly_tasks = total_tasks / 4.3  # 30일 ÷ 7일
        
        productivity_scores = [e.productivity_score for e in recent_entries if e.productivity_score is not None]
        current_productivity = statistics.mean(productivity_scores) if productivity_scores else 5.0
        
        # 목표 설정 (현재 성과 대비 10-20% 향상)
        daily_hours_goal = min(8.0, avg_daily_hours * 1.15)
        weekly_tasks_goal = int(avg_weekly_tasks * 1.2)
        productivity_score_goal = min(10.0, current_productivity + 0.5)
        
        # 집중력 개선 목표
        focus_scores = [e.focus_score for e in recent_entries if e.focus_score is not None]
        current_focus = statistics.mean(focus_scores) if focus_scores else 5.0
        focus_improvement_target = min(10.0, current_focus + 0.3) - current_focus
        
        return {
            "daily_hours_goal": round(daily_hours_goal, 1),
            "weekly_tasks_goal": weekly_tasks_goal,
            "productivity_score_goal": round(productivity_score_goal, 1),
            "focus_improvement_target": round(focus_improvement_target, 1),
            "current_performance": {
                "daily_hours": round(avg_daily_hours, 1),
                "weekly_tasks": round(avg_weekly_tasks, 1),
                "productivity_score": round(current_productivity, 1),
                "focus_score": round(current_focus, 1)
            },
            "recommendations": self._generate_goal_recommendations(
                avg_daily_hours, avg_weekly_tasks, current_productivity
            ),
            "target_period_days": target_period_days
        }
    
    def _generate_goal_recommendations(
        self, 
        daily_hours: float, 
        weekly_tasks: float, 
        productivity_score: float
    ) -> List[str]:
        """목표 달성을 위한 맞춤 제안을 생성합니다."""
        recommendations = []
        
        if daily_hours < 4:
            recommendations.append("하루 최소 4시간의 집중 작업 시간을 확보하세요")
        elif daily_hours > 7:
            recommendations.append("과로를 방지하기 위해 적절한 휴식을 취하세요")
        
        if weekly_tasks < 10:
            recommendations.append("작업을 더 작은 단위로 나누어 완료 빈도를 높이세요")
        elif weekly_tasks > 30:
            recommendations.append("작업 우선순위를 정하고 중요한 것에 집중하세요")
        
        if productivity_score < 6:
            recommendations.append("작업 환경을 개선하고 집중을 방해하는 요소를 제거하세요")
        
        # 일반적인 제안
        recommendations.extend([
            "목표를 주간 단위로 세분화하여 실행 가능성을 높이세요",
            "매일 진행상황을 기록하고 피드백을 통해 개선하세요",
            "목표 달성 시 자신에게 보상을 주어 동기를 유지하세요"
        ])
        
        return recommendations[:5]


# 서비스 인스턴스 생성
productivity_service = ProductivityAnalyticsService()