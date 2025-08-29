import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from typing import Generator
import os
import tempfile
import uuid
from datetime import datetime, date

from main import app
from database import Base, get_db
from models.user import User
from models.team import Team, TeamMember
from models.planner import Planner
from models.todo import Todo
from models.post import Post
from models.reply import Reply
from models.like import Like
from models.notification import Notification
from models.invite import Invite
from models.activity import Activity
from core.security import create_access_token, get_password_hash

# 테스트용 데이터베이스 설정
@pytest.fixture(scope="session")
def test_db_url():
    """테스트용 데이터베이스 URL"""
    # 임시 파일을 사용하여 테스트마다 독립적인 데이터베이스 생성
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    yield f"sqlite:///{path}"
    # 테스트 후 파일 삭제
    if os.path.exists(path):
        os.unlink(path)

@pytest.fixture(scope="session")
def engine(test_db_url):
    """테스트용 엔진"""
    engine = create_engine(test_db_url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session(engine):
    """테스트용 데이터베이스 세션"""
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        session.close()

@pytest.fixture
def client(db_session):
    """테스트 클라이언트"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

# 테스트 데이터 fixture들
@pytest.fixture
def test_user_data():
    """테스트 사용자 데이터"""
    unique_id = str(uuid.uuid4())[:8]
    return {
        "name": f"테스트 사용자 {unique_id}",
        "email": f"test{unique_id}@example.com",
        "password": "TestPassword123"
    }

@pytest.fixture
def test_user(db_session, test_user_data):
    """테스트 사용자 생성"""
    user = User(
        name=test_user_data["name"],
        email=test_user_data["email"],
        password=get_password_hash(test_user_data["password"])
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_team_data():
    """테스트 팀 데이터"""
    unique_id = str(uuid.uuid4())[:8]
    return {
        "name": f"테스트 팀 {unique_id}",
        "description": f"테스트 팀 설명 {unique_id}"
    }

@pytest.fixture
def test_team(db_session, test_user, test_team_data):
    """테스트 팀 생성"""
    team = Team(
        name=test_team_data["name"],
        description=test_team_data["description"],
        owner_id=test_user.id
    )
    db_session.add(team)
    db_session.commit()
    db_session.refresh(team)
    
    # 팀 멤버 추가
    team_member = TeamMember(
        team_id=team.id,
        user_id=test_user.id,
        role="owner"
    )
    db_session.add(team_member)
    db_session.commit()
    
    return team

@pytest.fixture
def test_planner_data(test_team):
    """테스트 플래너 데이터"""
    unique_id = str(uuid.uuid4())[:8]
    return {
        "title": f"테스트 플래너 {unique_id}",
        "description": f"테스트 플래너 설명 {unique_id}",
        "team_id": test_team.id,
        "deadline": "2024-12-31"
    }

@pytest.fixture
def test_planner(db_session, test_user, test_team, test_planner_data):
    """테스트 플래너 생성"""
    planner = Planner(
        title=test_planner_data["title"],
        description=test_planner_data["description"],
        team_id=test_team.id,
        created_by=test_user.id,
        deadline=date(2024, 12, 31)
    )
    db_session.add(planner)
    db_session.commit()
    db_session.refresh(planner)
    return planner

@pytest.fixture
def test_todo_data(test_planner):
    """테스트 할일 데이터"""
    unique_id = str(uuid.uuid4())[:8]
    return {
        "title": f"테스트 할일 {unique_id}",
        "description": f"테스트 할일 설명 {unique_id}",
        "planner_id": test_planner.id,
        "priority": "보통",
        "due_date": "2024-12-31"
    }

@pytest.fixture
def test_todo(db_session, test_user, test_planner, test_todo_data):
    """테스트 할일 생성"""
    todo = Todo(
        title=test_todo_data["title"],
        description=test_todo_data["description"],
        planner_id=test_planner.id,
        created_by=test_user.id,
        priority=test_todo_data["priority"],
        due_date="2024-12-31"
    )
    db_session.add(todo)
    db_session.commit()
    db_session.refresh(todo)
    return todo

@pytest.fixture
def test_post_data(test_team):
    """테스트 게시글 데이터"""
    unique_id = str(uuid.uuid4())[:8]
    return {
        "title": f"테스트 게시글 {unique_id}",
        "content": f"테스트 게시글 내용 {unique_id}",
        "team_id": test_team.id
    }

@pytest.fixture
def test_post(db_session, test_user, test_team, test_post_data):
    """테스트 게시글 생성"""
    post = Post(
        title=test_post_data["title"],
        content=test_post_data["content"],
        team_id=test_team.id,
        author_id=test_user.id
    )
    db_session.add(post)
    db_session.commit()
    db_session.refresh(post)
    return post

@pytest.fixture
def auth_headers(test_user):
    """인증 헤더 생성"""
    token_data = {"sub": str(test_user.id)}
    token = create_access_token(token_data)
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def authenticated_client(client, test_user, auth_headers):
    """인증된 테스트 클라이언트"""
    # 사용자 생성
    user_data = {
        "name": test_user.name,
        "email": test_user.email,
        "password": "TestPassword123"
    }
    client.post("/api/v1/users/", json=user_data)
    
    # 로그인
    login_data = {
        "username": test_user.email,
        "password": "TestPassword123"
    }
    response = client.post("/api/v1/users/login", data=login_data)
    token = response.json()["access_token"]
    
    # 인증 헤더 설정
    client.headers.update({"Authorization": f"Bearer {token}"})
    return client 