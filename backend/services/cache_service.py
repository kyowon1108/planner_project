"""
캐시 서비스 모듈

이 파일은 인메모리 캐시 서비스를 구현합니다.
자주 사용되는 데이터를 메모리에 저장하여 데이터베이스 조회를 줄이고 성능을 향상시킵니다.

주요 기능:
- 키-값 기반 캐시 저장 및 조회
- TTL (Time To Live) 기반 자동 만료
- LRU (Least Recently Used) 기반 캐시 크기 관리
- 캐시 통계 제공
- 싱글톤 패턴으로 전역 캐시 서비스 제공


"""

from typing import Any, Optional, Dict
import time
from core.config import settings

class CacheService:
    """
    인메모리 캐시 서비스 클래스
    
    이 클래스는 애플리케이션 전체에서 사용되는 인메모리 캐시를 관리합니다.
    자주 조회되는 데이터를 메모리에 저장하여 성능을 향상시키고,
    데이터베이스 부하를 줄입니다.
    
    주요 특징:
    - TTL 기반 자동 만료
    - LRU 기반 캐시 크기 관리
    - 스레드 안전하지 않음 (단일 프로세스 환경용)
    - 메모리 기반 (Redis 대신)
    
    사용 예시:
        cache_service.set("user:1", user_data, ttl=300)
        user_data = cache_service.get("user:1")
        cache_service.delete("user:1")
    """
    
    def __init__(self):
        """
        CacheService 초기화
        
        설정 파일에서 캐시 관련 설정을 읽어와 초기화합니다.
        """
        self._cache: Dict[str, Dict[str, Any]] = {}  # 캐시 저장소
        self._max_size = settings.cache_max_size  # 최대 캐시 크기
        self._ttl = settings.cache_ttl  # 기본 TTL (초)

    def get(self, key: str) -> Optional[Any]:
        """
        캐시에서 값을 가져옵니다.
        
        키에 해당하는 값을 반환합니다. TTL이 만료된 경우 None을 반환하고
        해당 항목을 캐시에서 제거합니다.
        
        Args:
            key (str): 조회할 캐시 키
            
        Returns:
            Optional[Any]: 캐시된 값 또는 None (존재하지 않거나 만료된 경우)
            
        사용 예시:
            user_data = cache_service.get("user:123")
            if user_data:
                print("캐시에서 사용자 정보 조회")
            else:
                print("캐시에 없음, 데이터베이스에서 조회 필요")
        """
        if key not in self._cache:
            return None
        
        cache_item = self._cache[key]
        current_time = time.time()
        
        # TTL 만료 확인
        if current_time - cache_item["timestamp"] > cache_item["ttl"]:
            # 만료된 항목 제거
            del self._cache[key]
            return None
        
        return cache_item["value"]

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """
        캐시에 값을 저장합니다.
        
        키-값 쌍을 캐시에 저장합니다. 캐시가 가득 찬 경우
        가장 오래된 항목을 제거합니다 (LRU 방식).
        
        Args:
            key (str): 캐시 키
            value (Any): 저장할 값
            ttl (Optional[int]): TTL (초), None이면 기본 TTL 사용
            
        사용 예시:
            cache_service.set("user:123", user_data, ttl=600)  # 10분
            cache_service.set("config:app", config_data)  # 기본 TTL 사용
        """
        # 캐시 크기 제한 확인
        if len(self._cache) >= self._max_size:
            # 가장 오래된 항목 제거 (LRU)
            oldest_key = min(self._cache.keys(), 
                           key=lambda k: self._cache[k]["timestamp"])
            del self._cache[oldest_key]
        
        # 새 항목 저장
        self._cache[key] = {
            "value": value,
            "timestamp": time.time(),
            "ttl": ttl or self._ttl  # 개별 TTL 또는 기본 TTL
        }

    def delete(self, key: str) -> None:
        """
        캐시에서 키를 삭제합니다.
        
        Args:
            key (str): 삭제할 캐시 키
            
        사용 예시:
            cache_service.delete("user:123")  # 특정 사용자 캐시 삭제
        """
        if key in self._cache:
            del self._cache[key]

    def clear(self) -> None:
        """
        모든 캐시를 삭제합니다.
        
        캐시의 모든 항목을 제거합니다. 메모리 부족이나
        캐시 무효화가 필요한 경우 사용합니다.
        
        사용 예시:
            cache_service.clear()  # 모든 캐시 삭제
        """
        self._cache.clear()

    def exists(self, key: str) -> bool:
        """
        키가 캐시에 존재하는지 확인합니다.
        
        Args:
            key (str): 확인할 캐시 키
            
        Returns:
            bool: 키가 존재하고 만료되지 않았으면 True, 그렇지 않으면 False
            
        사용 예시:
            if cache_service.exists("user:123"):
                print("사용자 정보가 캐시에 있습니다")
        """
        return self.get(key) is not None

    def get_stats(self) -> Dict[str, Any]:
        """
        캐시 통계를 반환합니다.
        
        캐시의 현재 상태를 모니터링하기 위한 통계 정보를 반환합니다.
        
        Returns:
            Dict[str, Any]: 캐시 통계
                - size: 현재 캐시 항목 수
                - max_size: 최대 캐시 크기
                - ttl: 기본 TTL (초)
                
        사용 예시:
            stats = cache_service.get_stats()
            print(f"캐시 사용률: {stats['size']}/{stats['max_size']}")
        """
        return {
            "size": len(self._cache),
            "max_size": self._max_size,
            "ttl": self._ttl
        }

# 싱글톤 인스턴스
# 애플리케이션 전체에서 하나의 캐시 서비스 인스턴스를 공유
cache_service = CacheService() 