# api v1 패키지 
from services.time_service import TimeService

def to_kst_safe(dt):
    from datetime import datetime as dtmod
    if not isinstance(dt, dtmod):
        return None
    
    # 이미 KST로 저장되어 있으므로 그대로 반환
    return dt 