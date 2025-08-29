from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from schemas.planner import PlannerCreate, PlannerRead, PlannerUpdate
from models.planner import Planner
from models.team import TeamMember, Team
from models.user import User
from database import get_db
from api.v1.users import get_current_user
from services.planner_service import PlannerService
from core.permissions import require_permission, Permission, Role, get_user_role_in_team
from datetime import date

router = APIRouter(prefix="/planners", tags=["planners"])

@router.post("/", response_model=PlannerRead)
def create_planner(
    planner: PlannerCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """플래너 생성"""
    try:
        planner_service = PlannerService(db)
        
        # PlannerCreate를 dict로 변환
        planner_data = {
            'title': planner.title,
            'description': planner.description,
            'deadline': date.fromisoformat(planner.deadline) if planner.deadline and isinstance(planner.deadline, str) else planner.deadline,
            'status': planner.status,
            'team_id': planner.team_id,
            'created_by': current_user.id
        }
        
        created_planner = planner_service.create_planner(planner_data, current_user)
        return created_planner
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"플래너 생성 중 오류가 발생했습니다: {str(e)}")

@router.get("/", response_model=List[PlannerRead])
def read_planners(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """플래너 목록 조회"""
    try:
        print(f"플래너 목록 조회 요청: 사용자={current_user.id}")
        planner_service = PlannerService(db)
        user_id = getattr(current_user, 'id', None)
        planners = planner_service.get_planners_by_user_teams(int(user_id) if user_id is not None else 0)
        
        print(f"조회된 플래너 개수: {len(planners)}")
        
        # 팀명 추가
        for planner in planners:
            try:
                team = db.query(Team).filter(Team.id == planner.team_id).first()
                planner.team_name = team.name if team else None
            except Exception as e:
                print(f"팀명 추가 중 오류 (플래너 {planner.id}): {e}")
                planner.team_name = None
        
        result = planners[skip:skip + limit] if planners else []
        print(f"반환할 플래너 개수: {len(result)}")
        return result
        
    except Exception as e:
        print(f"Error in read_planners: {e}")
        raise HTTPException(status_code=500, detail="플래너 목록을 불러오는데 실패했습니다.")

@router.get("/{planner_id}", response_model=PlannerRead)
def read_planner(planner_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """특정 플래너 조회"""
    try:
        print(f"플래너 조회 요청: ID={planner_id}, 사용자={current_user.id}")
        planner_service = PlannerService(db)
        planner = planner_service.get_planner_by_id(planner_id, current_user)
        
        if planner is None:
            raise HTTPException(status_code=404, detail="플래너를 찾을 수 없습니다.")
        
        # 팀명 추가
        try:
            team = db.query(Team).filter(Team.id == planner.team_id).first()
            setattr(planner, "team_name", team.name if team else None)
        except Exception as e:
            print(f"팀명 추가 중 오류: {e}")
            setattr(planner, "team_name", None)
        
        print(f"플래너 조회 성공: {planner.title}")
        return planner
        
    except ValueError as e:
        print(f"ValueError: {e}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"플래너 조회 중 예상치 못한 오류: {e}")
        raise HTTPException(status_code=500, detail=f"플래너 조회 중 오류가 발생했습니다: {str(e)}")

@router.put("/{planner_id}", response_model=PlannerRead)
def update_planner(
    planner_id: int, 
    planner: PlannerUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """플래너 수정"""
    try:
        planner_service = PlannerService(db)
        
        # PlannerUpdate를 dict로 변환
        planner_data = {}
        if planner.title is not None:
            planner_data['title'] = planner.title
        if planner.description is not None:
            planner_data['description'] = planner.description
        if planner.deadline is not None:
            planner_data['deadline'] = date.fromisoformat(planner.deadline) if isinstance(planner.deadline, str) else planner.deadline
        if planner.status is not None:
            planner_data['status'] = planner.status
        
        updated_planner = planner_service.update_planner(planner_id, planner_data, current_user)
        if not updated_planner:
            raise HTTPException(status_code=404, detail="플래너를 찾을 수 없습니다.")
        
        return updated_planner
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"플래너 수정 중 오류가 발생했습니다: {str(e)}")

@router.delete("/{planner_id}")
def delete_planner(
    planner_id: int, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """플래너 삭제"""
    try:
        planner_service = PlannerService(db)
        success = planner_service.delete_planner(planner_id, current_user)
        
        if not success:
            raise HTTPException(status_code=404, detail="플래너를 찾을 수 없습니다.")
        
        return {"message": "플래너가 삭제되었습니다."}
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"플래너 삭제 중 오류가 발생했습니다: {str(e)}")

@router.patch("/{planner_id}/status")
def update_planner_status(
    planner_id: int, 
    status: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """플래너 상태 업데이트"""
    try:
        planner_service = PlannerService(db)
        result = planner_service.update_planner_status(planner_id, status, current_user)
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"플래너 상태 변경 중 오류가 발생했습니다: {str(e)}") 