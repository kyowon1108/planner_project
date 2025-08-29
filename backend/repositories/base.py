"""
Repository 패턴 기본 인터페이스 모듈

이 파일은 Repository 패턴의 기본 인터페이스와 추상 클래스를 정의합니다.
모든 Repository 클래스는 이 기본 클래스를 상속받아 일관된 데이터 접근 인터페이스를 제공합니다.

주요 기능:
- CRUD 작업의 기본 구현
- 제네릭 타입을 통한 타입 안전성
- 의존성 주입을 위한 인터페이스 정의
- 공통 데이터베이스 작업 추상화
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Any, Dict, Type, TypeVar, Generic, Protocol
from sqlalchemy.orm import Session
from sqlalchemy import select, update, delete

class HasId(Protocol):
    """
    ID를 가진 객체를 위한 프로토콜
    
    이 프로토콜은 모든 데이터베이스 모델이 ID 필드를 가져야 함을 정의합니다.
    제네릭 타입의 바운드로 사용되어 타입 안전성을 보장합니다.
    """
    id: Any

# 제네릭 타입 변수 정의
# T는 HasId 프로토콜을 구현하는 모든 타입이 될 수 있음
T = TypeVar('T', bound=HasId)

class BaseRepository(ABC, Generic[T]):
    """
    Repository 패턴의 기본 추상 클래스
    
    이 클래스는 모든 Repository 클래스의 기본이 되는 추상 클래스입니다.
    공통적인 CRUD 작업을 제공하며, 각 구체적인 Repository는
    이 클래스를 상속받아 특정 모델에 맞는 기능을 구현합니다.
    
    주요 기능:
    - create: 새로운 객체 생성
    - get: ID로 객체 조회
    - get_all: 모든 객체 조회
    - update: 객체 업데이트
    - delete: 객체 삭제
    - exists: 객체 존재 여부 확인
    - count: 객체 개수 반환
    
    사용 예시:
        class UserRepository(BaseRepository[User]):
            def get_model(self) -> Type[User]:
                return User
                
        user_repo = UserRepository(db_session)
        user = user_repo.create({"name": "홍길동", "email": "hong@example.com"})
    """
    
    def __init__(self, db: Session):
        """
        BaseRepository 초기화
        
        Args:
            db (Session): SQLAlchemy 데이터베이스 세션
        """
        self.db = db
    
    @abstractmethod
    def get_model(self) -> Type[T]:
        """
        모델 클래스를 반환하는 추상 메서드
        
        각 Repository 클래스는 이 메서드를 구현하여
        해당 Repository가 다루는 모델 클래스를 반환해야 합니다.
        
        Returns:
            Type[T]: Repository가 관리하는 모델 클래스
            
        사용 예시:
            def get_model(self) -> Type[User]:
                return User
        """
        pass
    
    def create(self, obj_in: Dict[str, Any]) -> T:
        """
        새로운 객체를 생성합니다.
        
        Args:
            obj_in (Dict[str, Any]): 생성할 객체의 데이터
                - 키: 모델의 필드명
                - 값: 필드에 설정할 값
                
        Returns:
            T: 생성된 객체
            
        사용 예시:
            user_data = {"name": "홍길동", "email": "hong@example.com"}
            user = user_repo.create(user_data)
        """
        model_class = self.get_model()
        db_obj = model_class(**obj_in)  # 모델 인스턴스 생성
        self.db.add(db_obj)  # 세션에 추가
        self.db.commit()  # 데이터베이스에 커밋
        self.db.refresh(db_obj)  # 생성된 ID 등 최신 정보로 갱신
        return db_obj
    
    def get(self, id: int) -> Optional[T]:
        """
        ID로 객체를 조회합니다.
        
        Args:
            id (int): 조회할 객체의 ID
            
        Returns:
            Optional[T]: 조회된 객체 또는 None (존재하지 않는 경우)
            
        사용 예시:
            user = user_repo.get(1)
            if user:
                print(f"사용자: {user.name}")
        """
        model_class = self.get_model()
        return self.db.query(model_class).filter(model_class.id == id).first()
    
    def get_all(self) -> List[T]:
        """
        모든 객체를 조회합니다.
        
        Returns:
            List[T]: 모든 객체의 리스트
            
        사용 예시:
            users = user_repo.get_all()
            for user in users:
                print(f"사용자: {user.name}")
        """
        model_class = self.get_model()
        return self.db.query(model_class).all()
    
    def update(self, id: int, obj_in: Dict[str, Any]) -> Optional[T]:
        """
        객체를 업데이트합니다.
        
        Args:
            id (int): 업데이트할 객체의 ID
            obj_in (Dict[str, Any]): 업데이트할 필드와 값
                - 키: 업데이트할 필드명
                - 값: 새로운 값
                
        Returns:
            Optional[T]: 업데이트된 객체 또는 None (존재하지 않는 경우)
            
        사용 예시:
            update_data = {"name": "김철수"}
            updated_user = user_repo.update(1, update_data)
        """
        db_obj = self.get(id)
        if db_obj:
            # 제공된 필드만 업데이트
            for field, value in obj_in.items():
                if hasattr(db_obj, field):
                    setattr(db_obj, field, value)
            self.db.commit()  # 변경사항 커밋
            self.db.refresh(db_obj)  # 최신 정보로 갱신
        return db_obj
    
    def delete(self, id: int) -> bool:
        """
        객체를 삭제합니다.
        
        Args:
            id (int): 삭제할 객체의 ID
            
        Returns:
            bool: 삭제 성공 시 True, 실패 시 False
            
        사용 예시:
            success = user_repo.delete(1)
            if success:
                print("사용자 삭제 완료")
        """
        db_obj = self.get(id)
        if db_obj:
            self.db.delete(db_obj)  # 객체 삭제
            self.db.commit()  # 변경사항 커밋
            return True
        return False
    
    def exists(self, id: int) -> bool:
        """
        객체가 존재하는지 확인합니다.
        
        Args:
            id (int): 확인할 객체의 ID
            
        Returns:
            bool: 객체가 존재하면 True, 존재하지 않으면 False
            
        사용 예시:
            if user_repo.exists(1):
                print("사용자가 존재합니다")
        """
        model_class = self.get_model()
        return self.db.query(model_class).filter(model_class.id == id).first() is not None
    
    def count(self) -> int:
        """
        객체의 총 개수를 반환합니다.
        
        Returns:
            int: 객체의 총 개수
            
        사용 예시:
            total_users = user_repo.count()
            print(f"총 사용자 수: {total_users}")
        """
        model_class = self.get_model()
        return self.db.query(model_class).count()

class RepositoryInterface(ABC):
    """
    Repository 인터페이스 - 의존성 주입을 위한 추상 클래스
    
    이 클래스는 의존성 주입 시스템에서 사용하기 위한 인터페이스입니다.
    테스트나 모킹 시에 구체적인 구현 대신 이 인터페이스를 사용할 수 있습니다.
    
    주요 메서드:
    - create: 객체 생성
    - get: 객체 조회
    - get_all: 모든 객체 조회
    - update: 객체 업데이트
    - delete: 객체 삭제
    """
    
    @abstractmethod
    def create(self, obj_in: Dict[str, Any]) -> HasId:
        """객체를 생성합니다."""
        pass
    
    @abstractmethod
    def get(self, id: int) -> Optional[HasId]:
        """ID로 객체를 조회합니다."""
        pass
    
    @abstractmethod
    def get_all(self) -> List[HasId]:
        """모든 객체를 조회합니다."""
        pass
    
    @abstractmethod
    def update(self, id: int, obj_in: Dict[str, Any]) -> Optional[HasId]:
        """객체를 업데이트합니다."""
        pass
    
    @abstractmethod
    def delete(self, id: int) -> bool:
        """객체를 삭제합니다."""
        pass 