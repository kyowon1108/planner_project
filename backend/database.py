"""
데이터베이스 설정 및 연결 관리 모듈

이 파일은 SQLAlchemy를 사용한 데이터베이스 연결과 세션 관리를 담당합니다.
SQLite 데이터베이스를 사용하며, 개발 및 프로덕션 환경에서 안정적인 데이터베이스 연결을 제공합니다.

주요 기능:
- 데이터베이스 엔진 설정 및 최적화
- 데이터베이스 세션 생성 및 관리
- 데이터베이스 초기화 및 테이블 생성
- 연결 풀 관리


"""

import os
from pathlib import Path
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import logging

# 데이터베이스 파일 경로 설정
# 프로젝트 루트의 data 디렉토리에 SQLite 파일 저장
data_dir = Path(__file__).parent.parent / "data"
data_dir.mkdir(exist_ok=True)  # data 디렉토리가 없으면 생성
db_path = data_dir / "planner.db"

# 데이터베이스 URL 설정
# SQLite 데이터베이스 파일의 절대 경로를 사용
DATABASE_URL = f"sqlite:///{db_path.absolute()}"

# SQLite 엔진 생성 및 성능 최적화 설정
# StaticPool: 단일 연결을 재사용하여 메모리 사용량 최적화
engine = create_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False,  # 멀티스레드 환경에서 사용 가능
        "timeout": 30,  # 연결 타임아웃 (30초)
        "isolation_level": "IMMEDIATE"  # 트랜잭션 격리 수준 (즉시 커밋)
    },
    poolclass=StaticPool,  # 정적 연결 풀 사용
    echo=False,  # SQL 쿼리 로그 비활성화 (성능 향상)
    pool_pre_ping=True,  # 연결 전 상태 확인 (안정성 향상)
    pool_recycle=3600,  # 1시간마다 연결 재생성 (메모리 누수 방지)
)

# 데이터베이스 세션 팩토리 생성
# autocommit=False: 자동 커밋 비활성화 (트랜잭션 제어)
# autoflush=False: 자동 플러시 비활성화 (성능 향상)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# SQLAlchemy 모델의 기본 클래스
# 모든 모델 클래스는 이 Base를 상속받아야 함
Base = declarative_base()

def get_db():
    """
    데이터베이스 세션 생성 및 관리 함수
    
    FastAPI의 의존성 주입 시스템에서 사용됩니다.
    각 요청마다 새로운 데이터베이스 세션을 생성하고,
    요청 완료 후 자동으로 세션을 닫습니다.
    
    Yields:
        Session: SQLAlchemy 데이터베이스 세션
        
    사용 예시:
        @app.get("/users")
        def get_users(db: Session = Depends(get_db)):
            return db.query(User).all()
    """
    db = SessionLocal()
    try:
        yield db  # 세션을 요청 핸들러에 제공
    finally:
        db.close()  # 요청 완료 후 세션 닫기

async def init_db():
    """
    데이터베이스 초기화 함수
    
    애플리케이션 시작 시 호출되어 데이터베이스와 테이블을 초기화합니다.
    
    주요 작업:
    1. 데이터베이스 파일 존재 확인 및 생성
    2. 모든 모델의 테이블 생성
    3. 초기 데이터 설정 (필요시)
    
    Raises:
        Exception: 데이터베이스 초기화 실패 시 예외 발생
        
    사용 예시:
        # main.py의 lifespan 함수에서 호출
        await init_db()
    """
    try:
        # 데이터베이스 파일이 없으면 생성
        if not db_path.exists():
            db_path.parent.mkdir(exist_ok=True)  # 상위 디렉토리 생성
            db_path.touch()  # 빈 파일 생성
        
        # 모든 모델 임포트 (테이블 생성에 필요)
        # 각 모델은 Base를 상속받아야 하며, 여기서 임포트해야 테이블이 생성됨
        from models import user, team, planner, todo, post, reply, like, invite, notification, activity, email_verification
        
        # 모든 테이블 생성
        # Base.metadata.create_all()은 모든 등록된 모델의 테이블을 생성
        Base.metadata.create_all(bind=engine)
        logging.info("✅ 데이터베이스 초기화 완료")
    except Exception as e:
        logging.error(f"❌ 데이터베이스 초기화 실패: {e}")
        raise  # 예외를 상위로 전파하여 애플리케이션 시작 실패 처리 