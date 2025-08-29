import asyncio
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from collections import defaultdict, deque
import psutil
import logging
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)

@dataclass
class PerformanceMetric:
    timestamp: float
    endpoint: str
    method: str
    response_time: float
    status_code: int
    user_id: Optional[str] = None
    error_message: Optional[str] = None

@dataclass
class SystemMetric:
    timestamp: float
    cpu_percent: float
    memory_percent: float
    disk_usage_percent: float
    network_io: Dict[str, float]

@dataclass
class UserFeedback:
    user_id: str
    session_id: str
    rating: int  # 1-5
    comment: str
    category: str  # 'bug', 'feature', 'ui', 'performance'
    timestamp: float

class MonitoringService:
    def __init__(self):
        self.performance_metrics: deque = deque(maxlen=10000)
        self.system_metrics: deque = deque(maxlen=1000)
        self.user_feedback: List[UserFeedback] = []
        self.error_alerts: List[Dict] = []
        self.anomaly_detection_enabled = True
        
        # 성능 임계값
        self.thresholds = {
            'response_time': 2000,  # 2초
            'error_rate': 5.0,      # 5%
            'cpu_usage': 80.0,      # 80%
            'memory_usage': 85.0,   # 85%
        }
        
        # 통계 계산용
        self.endpoint_stats = defaultdict(lambda: {
            'count': 0,
            'total_time': 0,
            'errors': 0,
            'last_updated': time.time()
        })

    async def start_monitoring(self):
        """모니터링 시작"""
        logger.info("시스템 모니터링 시작")
        asyncio.create_task(self._system_monitoring_loop())
        asyncio.create_task(self._anomaly_detection_loop())
        asyncio.create_task(self._cleanup_old_metrics())

    async def _system_monitoring_loop(self):
        """시스템 메트릭 수집 루프"""
        while True:
            try:
                metric = self._collect_system_metrics()
                self.system_metrics.append(metric)
                
                # 임계값 체크
                await self._check_system_thresholds(metric)
                
                await asyncio.sleep(30)  # 30초마다 수집
            except Exception as e:
                logger.error(f"시스템 모니터링 오류: {e}")
                await asyncio.sleep(60)

    def _collect_system_metrics(self) -> SystemMetric:
        """시스템 메트릭 수집"""
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        network = psutil.net_io_counters()
        
        return SystemMetric(
            timestamp=time.time(),
            cpu_percent=cpu_percent,
            memory_percent=memory.percent,
            disk_usage_percent=disk.percent,
            network_io={
                'bytes_sent': network.bytes_sent,
                'bytes_recv': network.bytes_recv,
                'packets_sent': network.packets_sent,
                'packets_recv': network.packets_recv
            }
        )

    async def _check_system_thresholds(self, metric: SystemMetric):
        """시스템 임계값 체크"""
        alerts = []
        
        if metric.cpu_percent > self.thresholds['cpu_usage']:
            alerts.append(f"CPU 사용률이 높습니다: {metric.cpu_percent}%")
        
        if metric.memory_percent > self.thresholds['memory_usage']:
            alerts.append(f"메모리 사용률이 높습니다: {metric.memory_percent}%")
        
        if alerts:
            await self._send_alerts(alerts, 'system')

    async def _anomaly_detection_loop(self):
        """이상 징후 탐지 루프"""
        while True:
            try:
                await self._detect_anomalies()
                await asyncio.sleep(60)  # 1분마다 체크
            except Exception as e:
                logger.error(f"이상 징후 탐지 오류: {e}")
                await asyncio.sleep(120)

    async def _detect_anomalies(self):
        """이상 징후 탐지"""
        if not self.anomaly_detection_enabled:
            return
        
        # 응답 시간 이상 징후 탐지
        recent_metrics = [m for m in self.performance_metrics 
                         if time.time() - m.timestamp < 300]  # 최근 5분
        
        if recent_metrics:
            avg_response_time = sum(m.response_time for m in recent_metrics) / len(recent_metrics)
            error_rate = sum(1 for m in recent_metrics if m.status_code >= 400) / len(recent_metrics) * 100
            
            anomalies = []
            if avg_response_time > self.thresholds['response_time']:
                anomalies.append(f"평균 응답 시간이 임계값을 초과했습니다: {avg_response_time:.2f}ms")
            
            if error_rate > self.thresholds['error_rate']:
                anomalies.append(f"에러율이 임계값을 초과했습니다: {error_rate:.2f}%")
            
            if anomalies:
                await self._send_alerts(anomalies, 'performance')

    async def _send_alerts(self, messages: List[str], alert_type: str):
        """알림 전송"""
        alert = {
            'type': alert_type,
            'messages': messages,
            'timestamp': time.time(),
            'severity': 'high' if alert_type == 'system' else 'medium'
        }
        
        self.error_alerts.append(alert)
        logger.warning(f"알림 발생: {alert}")
        
        # 여기에 실제 알림 전송 로직 추가 (Slack, Discord, 이메일 등)
        # await self._send_to_slack(alert)
        # await self._send_to_discord(alert)

    def record_performance_metric(self, metric: PerformanceMetric):
        """성능 메트릭 기록"""
        self.performance_metrics.append(metric)
        
        # 엔드포인트별 통계 업데이트
        endpoint_key = f"{metric.method} {metric.endpoint}"
        stats = self.endpoint_stats[endpoint_key]
        stats['count'] += 1
        stats['total_time'] += metric.response_time
        stats['last_updated'] = time.time()
        
        if metric.status_code >= 400:
            stats['errors'] += 1

    def record_user_feedback(self, feedback: UserFeedback):
        """사용자 피드백 기록"""
        self.user_feedback.append(feedback)
        logger.info(f"사용자 피드백 수집: {feedback.rating}/5 - {feedback.category}")

    def get_performance_summary(self, hours: int = 24) -> Dict[str, Any]:
        """성능 요약 통계"""
        cutoff_time = time.time() - (hours * 3600)
        recent_metrics = [m for m in self.performance_metrics 
                         if m.timestamp > cutoff_time]
        
        if not recent_metrics:
            return {}
        
        total_requests = len(recent_metrics)
        avg_response_time = sum(m.response_time for m in recent_metrics) / total_requests
        error_count = sum(1 for m in recent_metrics if m.status_code >= 400)
        error_rate = (error_count / total_requests) * 100
        
        # 엔드포인트별 통계
        endpoint_stats = {}
        for endpoint, stats in self.endpoint_stats.items():
            if stats['last_updated'] > cutoff_time:
                endpoint_stats[endpoint] = {
                    'request_count': stats['count'],
                    'avg_response_time': stats['total_time'] / stats['count'] if stats['count'] > 0 else 0,
                    'error_rate': (stats['errors'] / stats['count']) * 100 if stats['count'] > 0 else 0
                }
        
        return {
            'total_requests': total_requests,
            'avg_response_time': avg_response_time,
            'error_rate': error_rate,
            'endpoint_stats': endpoint_stats,
            'time_period_hours': hours
        }

    def get_system_summary(self, hours: int = 24) -> Dict[str, Any]:
        """시스템 요약 통계"""
        cutoff_time = time.time() - (hours * 3600)
        recent_metrics = [m for m in self.system_metrics 
                         if m.timestamp > cutoff_time]
        
        if not recent_metrics:
            return {}
        
        avg_cpu = sum(m.cpu_percent for m in recent_metrics) / len(recent_metrics)
        avg_memory = sum(m.memory_percent for m in recent_metrics) / len(recent_metrics)
        avg_disk = sum(m.disk_usage_percent for m in recent_metrics) / len(recent_metrics)
        
        return {
            'avg_cpu_percent': avg_cpu,
            'avg_memory_percent': avg_memory,
            'avg_disk_percent': avg_disk,
            'time_period_hours': hours
        }

    def get_user_feedback_summary(self, days: int = 7) -> Dict[str, Any]:
        """사용자 피드백 요약"""
        cutoff_time = time.time() - (days * 24 * 3600)
        recent_feedback = [f for f in self.user_feedback 
                          if f.timestamp > cutoff_time]
        
        if not recent_feedback:
            return {}
        
        avg_rating = sum(f.rating for f in recent_feedback) / len(recent_feedback)
        
        # 카테고리별 분류
        category_counts = defaultdict(int)
        for feedback in recent_feedback:
            category_counts[feedback.category] += 1
        
        return {
            'total_feedback': len(recent_feedback),
            'avg_rating': avg_rating,
            'category_distribution': dict(category_counts),
            'time_period_days': days
        }

    async def _cleanup_old_metrics(self):
        """오래된 메트릭 정리"""
        while True:
            try:
                # 7일 이상 된 메트릭 삭제
                cutoff_time = time.time() - (7 * 24 * 3600)
                
                # 성능 메트릭 정리
                self.performance_metrics = deque(
                    [m for m in self.performance_metrics if m.timestamp > cutoff_time],
                    maxlen=10000
                )
                
                # 시스템 메트릭 정리
                self.system_metrics = deque(
                    [m for m in self.system_metrics if m.timestamp > cutoff_time],
                    maxlen=1000
                )
                
                # 사용자 피드백 정리 (30일 보관)
                feedback_cutoff = time.time() - (30 * 24 * 3600)
                self.user_feedback = [f for f in self.user_feedback 
                                    if f.timestamp > feedback_cutoff]
                
                # 알림 정리 (24시간 보관)
                alert_cutoff = time.time() - (24 * 3600)
                self.error_alerts = [a for a in self.error_alerts 
                                   if a['timestamp'] > alert_cutoff]
                
                await asyncio.sleep(3600)  # 1시간마다 정리
            except Exception as e:
                logger.error(f"메트릭 정리 오류: {e}")
                await asyncio.sleep(7200)  # 오류 시 2시간 후 재시도

    def export_metrics(self, format: str = 'json') -> str:
        """메트릭 내보내기"""
        data = {
            'performance_metrics': [asdict(m) for m in self.performance_metrics],
            'system_metrics': [asdict(m) for m in self.system_metrics],
            'user_feedback': [asdict(f) for f in self.user_feedback],
            'error_alerts': self.error_alerts,
            'export_timestamp': time.time()
        }
        
        if format == 'json':
            return json.dumps(data, indent=2, default=str)
        else:
            raise ValueError(f"지원하지 않는 형식: {format}")

# 싱글톤 인스턴스
monitoring_service = MonitoringService() 