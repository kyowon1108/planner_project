from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, cast
from schemas.todo import TodoCreate, TodoRead, TodoUpdate
from models.todo import Todo
from models.planner import Planner
from models.team import TeamMember
from models.user import User
from database import get_db
from api.v1.users import get_current_user
from services.todo_service import TodoService
from core.permissions import require_permission, Permission, Role, get_user_role_in_team
from datetime import date, datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/todos", tags=["todos"])

@router.post("/", response_model=TodoRead)
def create_todo(
    todo: TodoCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """할일 생성"""
    try:
        todo_service = TodoService(db)
        
        # TodoCreate를 dict로 변환
        todo_data = {
            'title': todo.title,
            'description': todo.description,
            'priority': str(todo.priority),
            'status': todo.status,
            'due_date': date.fromisoformat(todo.due_date) if todo.due_date and isinstance(todo.due_date, str) else todo.due_date,
            'planner_id': todo.planner_id,
            'created_by': current_user.id,
            'assigned_to': todo.assigned_to
        }
        
        created_todo = todo_service.create_todo(todo_data, current_user)
        return created_todo
        
    except ValueError as e:
        logger.warning(f"할일 생성 실패 (검증 오류): {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"할일 생성 실패: {e}")
        raise HTTPException(status_code=500, detail=f"할일 생성 중 오류가 발생했습니다: {str(e)}")

@router.get("/", response_model=List[TodoRead])
def read_all_todos(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user),
    page: int = Query(1, ge=1, description="페이지 번호"),
    per_page: int = Query(20, ge=1, le=100, description="페이지당 항목 수"),
    sort_by: str = Query("created_at", description="정렬 기준"),
    sort_order: str = Query("desc", description="정렬 순서 (asc/desc)"),
    status_filter: Optional[str] = Query(None, description="상태 필터"),
    priority_filter: Optional[str] = Query(None, description="우선순위 필터"),
    search: Optional[str] = Query(None, description="검색어")
):
    """할일 목록 조회 (페이지네이션, 필터링, 검색 지원)"""
    try:
        todo_service = TodoService(db)
        
        # 기본적으로 사용자가 담당자인 할일들 조회
        user_id = cast(int, current_user.id)
        todos = todo_service.get_todos_by_assignee(user_id)
        
        # 필터링 적용
        if status_filter:
            todos = [todo for todo in todos if str(todo.status) == status_filter]
        
        if priority_filter:
            todos = [todo for todo in todos if str(todo.priority) == priority_filter]
        
        if search:
            # 검색 기능은 repository에서 처리하는 것이 더 효율적
            todos = db.query(Todo).join(Todo.assignees).filter(
                User.id == current_user.id
            ).filter(
                Todo.title.ilike(f"%{search}%") | Todo.description.ilike(f"%{search}%")
            ).all()
        
        # 정렬
        reverse = sort_order == "desc"
        if sort_by == "due_date":
            todos.sort(key=lambda x: (x.due_date is None, x.due_date or date.min), reverse=reverse)
        elif sort_by == "priority":
            priority_order = {"긴급": 0, "높음": 1, "보통": 2, "낮음": 3}
            todos.sort(key=lambda x: priority_order.get(str(x.priority), 2), reverse=reverse)
        elif sort_by == "title":
            todos.sort(key=lambda x: str(x.title), reverse=reverse)
        else:  # created_at
            todos.sort(key=lambda x: cast(datetime, x.created_at) if x.created_at is not None else datetime.min, reverse=reverse)
        
        # 페이지네이션
        total = len(todos)
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        paginated_todos = todos[start_idx:end_idx]
        
        # 담당자 정보 추가
        for todo in paginated_todos:
            try:
                # 담당자 이름들 가져오기
                assignee_names = []
                for assignee in todo.assignees:
                    assignee_names.append(assignee.name)
                setattr(todo, 'assignee_names', assignee_names)
                
                # 플래너 이름 가져오기
                planner = db.query(Planner).filter(Planner.id == todo.planner_id).first()
                if planner:
                    setattr(todo, 'planner_name', cast(str, planner.title))
                else:
                    setattr(todo, 'planner_name', None)
                
            except Exception as e:
                logger.error(f"Error processing todo {todo.id}: {e}")
                setattr(todo, 'assignee_names', [])
                setattr(todo, 'planner_name', None)
        
        return paginated_todos
        
    except Exception as e:
        logger.error(f"할일 목록 조회 실패: {e}")
        raise HTTPException(status_code=500, detail="할일 목록을 불러오는데 실패했습니다.")

@router.get("/planner/{planner_id}", response_model=List[TodoRead])
def read_todos_by_planner(
    planner_id: int,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """특정 플래너의 할일 목록 조회"""
    try:
        # 플래너 존재 확인
        planner = db.query(Planner).filter(Planner.id == planner_id).first()
        if not planner:
            raise HTTPException(status_code=404, detail="플래너를 찾을 수 없습니다.")
        
        # 사용자의 팀 내 역할 확인
        from core.permissions import get_user_role_in_team
        user_id = getattr(current_user, 'id', None)
        team_id = getattr(planner, 'team_id', None)
        
        if user_id is None or team_id is None:
            raise HTTPException(status_code=400, detail="사용자 또는 팀 정보가 유효하지 않습니다.")
            
        user_role = get_user_role_in_team(db, int(user_id), int(team_id))
        if not user_role:
            raise HTTPException(status_code=403, detail="팀 멤버가 아닙니다.")
        
        # 플래너의 할일들 조회
        todos = db.query(Todo).filter(Todo.planner_id == planner_id).all()
        
        # 담당자 정보와 플래너 정보 추가
        for todo in todos:
            try:
                # 담당자 이름들 가져오기
                assignee_names = []
                for assignee in todo.assignees:
                    assignee_names.append(assignee.name)
                setattr(todo, 'assignee_names', assignee_names)
                
                # 플래너 이름 추가
                setattr(todo, 'planner_name', planner.title)
                
            except Exception as e:
                logger.error(f"Error processing todo {todo.id}: {e}")
                setattr(todo, 'assignee_names', [])
                setattr(todo, 'planner_name', planner.title)
        
        return todos
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"플래너 할일 목록 조회 실패: {e}")
        raise HTTPException(status_code=500, detail="플래너 할일 목록을 불러오는데 실패했습니다.")

@router.get("/my", response_model=List[TodoRead])
def read_my_todos(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """내가 담당자인 할일 목록 조회"""
    try:
        # 사용자가 담당자인 할일들 조회
        todos = db.query(Todo).join(Todo.assignees).filter(User.id == current_user.id).all()
        
        # 담당자 정보 추가
        for todo in todos:
            try:
                # 담당자 이름들 가져오기
                assignee_names = []
                for assignee in todo.assignees:
                    assignee_names.append(assignee.name)
                setattr(todo, 'assignee_names', assignee_names)
                
            except Exception as e:
                logger.error(f"Error processing todo {todo.id}: {e}")
                setattr(todo, 'assignee_names', [])
        
        return todos
        
    except Exception as e:
        logger.error(f"내 할일 목록 조회 실패: {e}")
        raise HTTPException(status_code=500, detail="할일 목록을 불러오는데 실패했습니다.")

@router.get("/overdue", response_model=List[TodoRead])
def read_overdue_todos(
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """마감일이 지난 할일 목록 조회"""
    try:
        from repositories.todo_repository import TodoRepository
        todo_repo = TodoRepository(db)
        
        # 사용자가 담당자인 마감일 지난 할일들 조회
        overdue_todos = todo_repo.get_overdue_todos()
        user_todos = [todo for todo in overdue_todos if current_user in todo.assignees]
        
        # 담당자 정보 추가
        for todo in user_todos:
            try:
                assignee_names = []
                for assignee in todo.assignees:
                    assignee_names.append(assignee.name)
                setattr(todo, 'assignee_names', assignee_names)
            except Exception as e:
                logger.error(f"Error processing overdue todo {todo.id}: {e}")
                setattr(todo, 'assignee_names', [])
        
        return user_todos
        
    except Exception as e:
        logger.error(f"마감일 지난 할일 조회 실패: {e}")
        raise HTTPException(status_code=500, detail="마감일 지난 할일 목록을 불러오는데 실패했습니다.")

@router.get("/upcoming", response_model=List[TodoRead])
def read_upcoming_todos(
    days: int = Query(7, ge=1, le=30, description="앞으로 N일"),
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """앞으로 N일 내의 할일 목록 조회"""
    try:
        from repositories.todo_repository import TodoRepository
        todo_repo = TodoRepository(db)
        
        # 사용자가 담당자인 앞으로 N일 내 할일들 조회
        upcoming_todos = todo_repo.get_upcoming_todos(days)
        user_todos = [todo for todo in upcoming_todos if current_user in todo.assignees]
        
        # 담당자 정보 추가
        for todo in user_todos:
            try:
                assignee_names = []
                for assignee in todo.assignees:
                    assignee_names.append(assignee.name)
                setattr(todo, 'assignee_names', assignee_names)
            except Exception as e:
                logger.error(f"Error processing upcoming todo {todo.id}: {e}")
                setattr(todo, 'assignee_names', [])
        
        return user_todos
        
    except Exception as e:
        logger.error(f"앞으로 N일 내 할일 조회 실패: {e}")
        raise HTTPException(status_code=500, detail="앞으로 N일 내 할일 목록을 불러오는데 실패했습니다.")

@router.get("/{todo_id}", response_model=TodoRead)
def read_todo(
    todo_id: int,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """특정 할일 조회"""
    try:
        todo_service = TodoService(db)
        
        # 할일 조회
        todo = db.query(Todo).filter(Todo.id == todo_id).first()
        if not todo:
            raise HTTPException(status_code=404, detail="할일을 찾을 수 없습니다.")
        
        # 권한 확인 (담당자이거나 작성자이거나 팀 멤버)
        is_assignee = False
        if hasattr(todo, 'assignees') and todo.assignees is not None and todo.assignees:
            try:
                assignees_list = list(todo.assignees)
                if len(assignees_list) > 0:
                    is_assignee = current_user in assignees_list
            except Exception:
                is_assignee = False
        is_creator = todo.created_by == current_user.id
        
        is_creator = (getattr(todo, "created_by", None) == current_user.id)
        if not (is_assignee or is_creator):
            # 팀 멤버인지 확인
            planner = db.query(Planner).filter(Planner.id == todo.planner_id).first()
            if planner:
                team_member = db.query(TeamMember).filter(
                    TeamMember.user_id == current_user.id,
                    TeamMember.team_id == planner.team_id
                ).first()
                if not team_member:
                    raise HTTPException(status_code=403, detail="할일을 조회할 권한이 없습니다.")
        
        # 담당자 정보 추가
        try:
            assignee_names = []
            for assignee in todo.assignees:
                assignee_names.append(assignee.name)
            setattr(todo, 'assignee_names', assignee_names)
            
            # 플래너 이름 가져오기
            planner = db.query(Planner).filter(Planner.id == todo.planner_id).first()
            if planner:
                setattr(todo, 'planner_name', cast(str, planner.title))
            else:
                setattr(todo, 'planner_name', None)
            
            # 작성자 이름 가져오기
            creator = db.query(User).filter(User.id == todo.created_by).first()
            if creator:
                setattr(todo, 'creator_name', creator.name)
            else:
                setattr(todo, 'creator_name', '알 수 없음')
            
        except Exception as e:
            logger.error(f"Error processing todo {todo.id}: {e}")
            setattr(todo, 'assignee_names', [])
            setattr(todo, 'planner_name', None)
            setattr(todo, 'creator_name', '알 수 없음')
        
        return todo
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"할일 조회 실패: {e}")
        raise HTTPException(status_code=500, detail="할일을 불러오는데 실패했습니다.")

@router.put("/{todo_id}", response_model=TodoRead)
def update_todo(
    todo_id: int,
    todo_update: TodoUpdate,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """할일 수정"""
    try:
        todo_service = TodoService(db)
        
        # 업데이트 데이터 준비
        update_data = {}
        if todo_update.title is not None:
            update_data['title'] = todo_update.title
        if todo_update.description is not None:
            update_data['description'] = todo_update.description
        if todo_update.priority is not None:
            update_data['priority'] = str(todo_update.priority)
        if todo_update.status is not None:
            update_data['status'] = todo_update.status
        if todo_update.due_date is not None:
            update_data['due_date'] = date.fromisoformat(todo_update.due_date) if isinstance(todo_update.due_date, str) else todo_update.due_date
        if todo_update.assigned_to is not None:
            update_data['assigned_to'] = todo_update.assigned_to
        
        updated_todo = todo_service.update_todo(todo_id, update_data, current_user)
        if not updated_todo:
            raise HTTPException(status_code=404, detail="할일을 찾을 수 없습니다.")
        
        return updated_todo
        
    except ValueError as e:
        logger.warning(f"할일 수정 실패 (검증 오류): {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"할일 수정 실패: {e}")
        raise HTTPException(status_code=500, detail="할일 수정 중 오류가 발생했습니다.")

@router.delete("/{todo_id}")
def delete_todo(
    todo_id: int,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """할일 삭제"""
    try:
        todo_service = TodoService(db)
        
        result = todo_service.delete_todo(todo_id, current_user)
        if not result:
            raise HTTPException(status_code=404, detail="할일을 찾을 수 없습니다.")
        
        return {"message": "할일이 삭제되었습니다."}
        
    except ValueError as e:
        logger.warning(f"할일 삭제 실패 (검증 오류): {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"할일 삭제 실패: {e}")
        raise HTTPException(status_code=500, detail="할일 삭제 중 오류가 발생했습니다.")

@router.patch("/{todo_id}/complete")
def toggle_todo_completion(
    todo_id: int,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """할일 완료 상태 토글"""
    try:
        todo_service = TodoService(db)
        
        result = todo_service.toggle_todo_completion(todo_id, current_user)
        return result
        
    except ValueError as e:
        logger.warning(f"할일 완료 상태 토글 실패 (검증 오류): {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"할일 완료 상태 토글 실패: {e}")
        raise HTTPException(status_code=500, detail="할일 완료 상태 변경 중 오류가 발생했습니다.")

@router.put("/{todo_id}/status")
def update_todo_status(
    todo_id: int,
    status_update: dict,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """할일 상태 업데이트"""
    try:
        todo_service = TodoService(db)
        status = status_update.get("status")
        if status is None:
            raise HTTPException(status_code=400, detail="상태 값이 필요합니다.")
        updated_todo = todo_service.update_todo_status(todo_id, status, current_user)
        return updated_todo
        
    except ValueError as e:
        logger.warning(f"할일 상태 업데이트 실패 (검증 오류): {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"할일 상태 업데이트 실패: {e}")
        raise HTTPException(status_code=500, detail=f"할일 상태 업데이트 중 오류가 발생했습니다: {str(e)}") 