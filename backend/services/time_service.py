from datetime import datetime, timedelta, timezone
from typing import Optional

KST = timezone(timedelta(hours=9))

class TimeService:
    @staticmethod
    def now_kst() -> datetime:
        """현재 KST 시간 반환 (timezone-aware)"""
        return datetime.now(KST)

    @staticmethod
    def now_utc() -> datetime:
        """현재 UTC 시간 반환 (timezone-aware)"""
        return datetime.now(timezone.utc)

    @staticmethod
    def utc_to_kst(dt: datetime) -> datetime:
        """UTC datetime을 KST로 변환 (aware만 지원)"""
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(KST)

    @staticmethod
    def kst_to_utc(dt: datetime) -> datetime:
        """KST datetime을 UTC로 변환 (aware만 지원)"""
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=KST)
        return dt.astimezone(timezone.utc)

    @staticmethod
    def to_isoformat_kst(dt: datetime) -> str:
        """datetime을 KST ISO 포맷 문자열로 변환"""
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=KST)
        return dt.astimezone(KST).isoformat()

    @staticmethod
    def parse_isoformat_kst(s: str) -> datetime:
        """KST ISO 포맷 문자열을 datetime으로 변환"""
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            # naive datetime인 경우 KST로 가정
            return dt.replace(tzinfo=KST)
        else:
            # 이미 timezone이 있는 경우 KST로 변환
            return dt.astimezone(KST)

    @staticmethod
    def naive_to_kst(dt: datetime) -> datetime:
        """naive datetime을 KST aware로 변환"""
        return dt.replace(tzinfo=KST)

    @staticmethod
    def naive_to_utc(dt: datetime) -> datetime:
        """naive datetime을 UTC aware로 변환"""
        return dt.replace(tzinfo=timezone.utc) 