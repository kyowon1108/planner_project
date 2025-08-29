# 코딩 표준 및 안전장치

## 코딩 원칙

### 1. 가독성 우선
- 코드는 읽기 쉬워야 한다
- 명확한 변수명과 함수명 사용
- 복잡한 로직은 주석으로 설명

### 2. 단일 책임 원칙
- 각 함수/클래스는 하나의 책임만 가진다
- 함수는 20줄 이내로 작성
- 클래스는 200줄 이내로 작성

### 3. DRY (Don't Repeat Yourself)
- 중복 코드 제거
- 공통 로직은 유틸리티 함수로 분리
- 재사용 가능한 컴포넌트 작성

## Frontend 코딩 표준

### TypeScript 사용
```typescript
// ✅ 좋은 예
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

const getUser = async (id: number): Promise<User | null> => {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return null;
  }
};

// ❌ 나쁜 예
const getUser = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};
```

### React 컴포넌트 작성
```typescript
// ✅ 함수형 컴포넌트 사용
interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onEdit, onDelete }) => {
  const handleEdit = () => {
    onEdit(user);
  };

  const handleDelete = () => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      onDelete(user.id);
    }
  };

  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <div className="actions">
        <button onClick={handleEdit}>수정</button>
        <button onClick={handleDelete}>삭제</button>
      </div>
    </div>
  );
};
```

### 상태 관리
```typescript
// ✅ Context API 사용
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      setUser(response.data.user);
    } catch (error) {
      throw new Error('로그인에 실패했습니다.');
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## Backend 코딩 표준

### Python 스타일 가이드
```python
# ✅ PEP 8 준수
from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session

class UserService:
    """사용자 관련 비즈니스 로직을 처리하는 서비스 클래스"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """
        사용자 ID로 사용자 정보를 조회합니다.
        
        Args:
            user_id: 조회할 사용자 ID
            
        Returns:
            User 객체 또는 None
        """
        try:
            return self.db.query(User).filter(User.id == user_id).first()
        except Exception as e:
            logger.error(f"Failed to get user {user_id}: {e}")
            return None
    
    def create_user(self, user_data: UserCreate) -> Optional[User]:
        """새로운 사용자를 생성합니다."""
        try:
            user = User(**user_data.dict())
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
            return user
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to create user: {e}")
            return None
```

### FastAPI 엔드포인트 작성
```python
# ✅ 타입 힌트와 검증 사용
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> UserResponse:
    """
    사용자 정보를 조회합니다.
    
    Args:
        user_id: 조회할 사용자 ID
        db: 데이터베이스 세션
        current_user: 현재 인증된 사용자
        
    Returns:
        사용자 정보
        
    Raises:
        HTTPException: 사용자를 찾을 수 없는 경우
    """
    user = user_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다."
        )
    
    return UserResponse.from_orm(user)

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
) -> UserResponse:
    """새로운 사용자를 생성합니다."""
    # 이메일 중복 확인
    existing_user = user_service.get_user_by_email(db, user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 존재하는 이메일입니다."
        )
    
    user = user_service.create_user(db, user_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="사용자 생성에 실패했습니다."
        )
    
    return UserResponse.from_orm(user)
```

## 데이터베이스 표준

### 모델 정의
```python
# ✅ SQLAlchemy 모델
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 관계 정의
    todos = relationship("Todo", back_populates="user")
    teams = relationship("TeamMember", back_populates="user")
    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}')>"
```

### 쿼리 최적화
```python
# ✅ 효율적인 쿼리
def get_user_with_todos(user_id: int, db: Session) -> Optional[User]:
    """사용자와 할 일 목록을 함께 조회합니다."""
    return db.query(User)\
        .options(joinedload(User.todos))\
        .filter(User.id == user_id)\
        .first()

# ❌ N+1 문제 발생
def get_user_with_todos_bad(user_id: int, db: Session) -> Optional[User]:
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        # 각 할 일마다 별도 쿼리 실행 (N+1 문제)
        todos = db.query(Todo).filter(Todo.user_id == user_id).all()
        user.todos = todos
    return user
```

## 보안 표준

### 입력 검증
```python
# ✅ Pydantic 모델로 검증
from pydantic import BaseModel, EmailStr, validator
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    
    @validator('username')
    def validate_username(cls, v):
        if len(v) < 3:
            raise ValueError('사용자명은 3자 이상이어야 합니다.')
        if not v.isalnum():
            raise ValueError('사용자명은 영문자와 숫자만 사용 가능합니다.')
        return v
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('비밀번호는 8자 이상이어야 합니다.')
        return v
```

### 인증 및 권한
```python
# ✅ JWT 토큰 검증
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """현재 인증된 사용자를 반환합니다."""
    try:
        payload = jwt.decode(
            credentials.credentials, 
            SECRET_KEY, 
            algorithms=[ALGORITHM]
        )
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="유효하지 않은 토큰입니다."
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="토큰 검증에 실패했습니다."
        )
    
    user = user_service.get_user_by_id(db, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자를 찾을 수 없습니다."
        )
    
    return user
```

## 테스트 표준

### Frontend 테스트
```typescript
// ✅ React Testing Library 사용
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';
import LoginPage from '../pages/LoginPage';

describe('LoginPage', () => {
  const mockLogin = jest.fn();
  
  beforeEach(() => {
    mockLogin.mockClear();
  });
  
  it('로그인 폼이 올바르게 렌더링됩니다', () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );
    
    expect(screen.getByLabelText('이메일')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });
  
  it('유효한 입력으로 로그인을 시도합니다', async () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );
    
    fireEvent.change(screen.getByLabelText('이메일'), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByLabelText('비밀번호'), {
      target: { value: 'password123' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: '로그인' }));
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });
});
```

### Backend 테스트
```python
# ✅ pytest 사용
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from main import app

# 테스트 데이터베이스 설정
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture
def test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_create_user(test_db):
    """사용자 생성 테스트"""
    user_data = {
        "email": "test@example.com",
        "username": "testuser",
        "password": "password123"
    }
    
    response = client.post("/users/", json=user_data)
    assert response.status_code == 201
    
    data = response.json()
    assert data["email"] == user_data["email"]
    assert data["username"] == user_data["username"]
    assert "id" in data

def test_create_user_duplicate_email(test_db):
    """중복 이메일로 사용자 생성 시도 테스트"""
    user_data = {
        "email": "test@example.com",
        "username": "testuser",
        "password": "password123"
    }
    
    # 첫 번째 사용자 생성
    client.post("/users/", json=user_data)
    
    # 중복 이메일로 두 번째 사용자 생성 시도
    response = client.post("/users/", json=user_data)
    assert response.status_code == 400
    assert "이미 존재하는 이메일입니다" in response.json()["detail"]
```

## 에러 처리 표준

### Frontend 에러 처리
```typescript
// ✅ 통합된 에러 처리
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const api = {
  async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new ApiError(
          error.response?.data?.detail || '알 수 없는 오류가 발생했습니다.',
          error.response?.status || 500,
          error.response?.data?.code
        );
      }
      throw new ApiError('네트워크 오류가 발생했습니다.', 0);
    }
  }
};

// 에러 바운더리
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // 에러 로깅 서비스에 전송
  }

  render() {
    if (this.state.hasError) {
      return <ErrorDisplay error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

### Backend 에러 처리
```python
# ✅ 커스텀 예외 클래스
class PlannerException(Exception):
    """플래너 프로젝트 기본 예외 클래스"""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class UserNotFoundException(PlannerException):
    """사용자를 찾을 수 없는 경우"""
    def __init__(self, user_id: int):
        super().__init__(f"사용자 ID {user_id}를 찾을 수 없습니다.", 404)

class ValidationException(PlannerException):
    """입력 검증 실패"""
    def __init__(self, message: str):
        super().__init__(message, 400)

# 전역 예외 핸들러
@app.exception_handler(PlannerException)
async def planner_exception_handler(request: Request, exc: PlannerException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.message,
            "type": exc.__class__.__name__
        }
    )

@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "detail": "입력 데이터 검증에 실패했습니다.",
            "errors": exc.errors()
        }
    )
```

## 성능 최적화 표준

### Frontend 최적화
```typescript
// ✅ React.memo 사용
const UserList = React.memo<{ users: User[]; onSelect: (user: User) => void }>(
  ({ users, onSelect }) => {
    return (
      <div className="user-list">
        {users.map(user => (
          <UserCard key={user.id} user={user} onSelect={onSelect} />
        ))}
      </div>
    );
  }
);

// ✅ useMemo, useCallback 사용
const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState('all');

  const filteredTodos = useMemo(() => {
    switch (filter) {
      case 'active':
        return todos.filter(todo => !todo.completed);
      case 'completed':
        return todos.filter(todo => todo.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

  const handleToggle = useCallback((id: number) => {
    setTodos(prev => 
      prev.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }, []);

  return (
    <div>
      <FilterSelect value={filter} onChange={setFilter} />
      <TodoItems todos={filteredTodos} onToggle={handleToggle} />
    </div>
  );
};
```

### Backend 최적화
```python
# ✅ 데이터베이스 쿼리 최적화
from sqlalchemy.orm import joinedload, selectinload

def get_team_with_members(team_id: int, db: Session) -> Optional[Team]:
    """팀과 멤버 정보를 효율적으로 조회"""
    return db.query(Team)\
        .options(
            joinedload(Team.members).joinedload(TeamMember.user),
            joinedload(Team.todos),
            joinedload(Team.posts)
        )\
        .filter(Team.id == team_id)\
        .first()

# ✅ 캐싱 사용
from functools import lru_cache
import redis

redis_client = redis.Redis(host='localhost', port=6379, db=0)

@lru_cache(maxsize=128)
def get_user_by_id_cached(user_id: int) -> Optional[User]:
    """사용자 정보를 캐시와 함께 조회"""
    # Redis에서 먼저 확인
    cached_user = redis_client.get(f"user:{user_id}")
    if cached_user:
        return User.parse_raw(cached_user)
    
    # 데이터베이스에서 조회
    user = user_service.get_user_by_id(user_id)
    if user:
        # Redis에 캐시 (TTL: 1시간)
        redis_client.setex(
            f"user:{user_id}", 
            3600, 
            user.json()
        )
    
    return user
```

## 문서화 표준

### 코드 주석
```python
# ✅ 함수 문서화
def calculate_user_statistics(user_id: int, db: Session) -> Dict[str, Any]:
    """
    사용자의 통계 정보를 계산합니다.
    
    Args:
        user_id: 사용자 ID
        db: 데이터베이스 세션
        
    Returns:
        사용자 통계 정보 딕셔너리:
        - total_todos: 전체 할 일 수
        - completed_todos: 완료된 할 일 수
        - completion_rate: 완료율 (0-100)
        - average_completion_time: 평균 완료 시간 (시간)
        
    Raises:
        UserNotFoundException: 사용자를 찾을 수 없는 경우
        DatabaseException: 데이터베이스 오류 발생 시
    """
    # 구현 내용...
```

### API 문서화
```python
# ✅ OpenAPI 스키마 정의
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class TodoResponse(BaseModel):
    id: int = Field(..., description="할 일 ID")
    title: str = Field(..., description="할 일 제목", max_length=100)
    description: Optional[str] = Field(None, description="할 일 설명")
    completed: bool = Field(False, description="완료 여부")
    priority: int = Field(1, description="우선순위 (1-5)", ge=1, le=5)
    due_date: Optional[datetime] = Field(None, description="마감일")
    created_at: datetime = Field(..., description="생성일")
    updated_at: datetime = Field(..., description="수정일")
    
    class Config:
        schema_extra = {
            "example": {
                "id": 1,
                "title": "프로젝트 계획 수립",
                "description": "새로운 프로젝트의 계획을 수립합니다.",
                "completed": False,
                "priority": 3,
                "due_date": "2024-01-15T09:00:00",
                "created_at": "2024-01-01T10:00:00",
                "updated_at": "2024-01-01T10:00:00"
            }
        }
```

## 코드 리뷰 체크리스트

### 기능적 검토
- [ ] 요구사항을 정확히 구현했는가?
- [ ] 에러 처리가 적절한가?
- [ ] 보안 취약점은 없는가?
- [ ] 성능에 문제는 없는가?

### 코드 품질 검토
- [ ] 코드가 읽기 쉬운가?
- [ ] 중복 코드는 없는가?
- [ ] 적절한 네이밍을 사용했는가?
- [ ] 주석이 필요한 곳에 작성되었는가?

### 테스트 검토
- [ ] 테스트가 충분한가?
- [ ] 테스트가 의미 있는가?
- [ ] 엣지 케이스가 포함되었는가?

### 문서화 검토
- [ ] API 문서가 업데이트되었는가?
- [ ] README가 업데이트되었는가?
- [ ] 변경사항이 문서화되었는가? 