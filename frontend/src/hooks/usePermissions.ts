import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { teamAPI } from '../services/api';

export type Permission = 
  // 팀 관리 권한 (8개)
  | 'team_create' | 'team_update' | 'team_delete' | 'team_invite' 
  | 'team_remove_owner' | 'team_remove_admin' | 'team_remove_member'
  | 'team_view_analytics'
  
  // 플래너 관리 권한 (6개)
  | 'planner_create' | 'planner_update' | 'planner_delete' | 'planner_assign'
  | 'planner_view' | 'planner_approve'
  
  // 할 일 관리 권한 (6개)
  | 'todo_create' | 'todo_update' | 'todo_delete' | 'todo_assign'
  | 'todo_view' | 'todo_complete'
  
  // 게시글 관리 권한 (5개)
  | 'post_create' | 'post_update' | 'post_delete'
  | 'post_view' | 'post_approve';

export type Role = 'owner' | 'admin' | 'manager' | 'editor' | 'viewer' | 'guest';

interface TeamMember {
  user_id: number;
  role: Role;
}

export const usePermissions = (teamId?: number) => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user || !teamId) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        const members = await teamAPI.getTeamMembers(teamId);
        const currentMember = members.find((member: TeamMember) => member.user_id === user.id);
        setUserRole(currentMember?.role || null);
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user, teamId]);

  const hasPermission = (permission: Permission): boolean => {
    if (!userRole) return false;

    const rolePermissions: Record<Role, Permission[]> = {
      owner: [
        // 팀 관리 - 모든 권한
        'team_create', 'team_update', 'team_delete', 'team_invite',
        'team_remove_owner', 'team_remove_admin', 'team_remove_member',
        'team_view_analytics',
        
        // 플래너 관리 - 모든 권한
        'planner_create', 'planner_update', 'planner_delete', 'planner_assign',
        'planner_view', 'planner_approve',
        
        // 할 일 관리 - 모든 권한
        'todo_create', 'todo_update', 'todo_delete', 'todo_assign',
        'todo_view', 'todo_complete',
        
        // 게시글 관리 - 모든 권한
        'post_create', 'post_update', 'post_delete',
        'post_view', 'post_approve'
      ],
      admin: [
        // 팀 관리 - 제한적 권한
        'team_update', 'team_invite', 'team_remove_member', 'team_view_analytics',
        
        // 플래너 관리 - 모든 권한
        'planner_create', 'planner_update', 'planner_delete', 'planner_assign',
        'planner_view', 'planner_approve',
        
        // 할 일 관리 - 모든 권한
        'todo_create', 'todo_update', 'todo_delete', 'todo_assign',
        'todo_view', 'todo_complete',
        
        // 게시글 관리 - 모든 권한
        'post_create', 'post_update', 'post_delete',
        'post_view', 'post_approve'
      ],
      manager: [
        // 팀 관리 - 제한적 권한
        'team_invite', 'team_remove_member', 'team_view_analytics',
        
        // 플래너 관리 - 생성/수정/조회
        'planner_create', 'planner_update', 'planner_assign', 'planner_view',
        
        // 할 일 관리 - 모든 권한
        'todo_create', 'todo_update', 'todo_delete', 'todo_assign',
        'todo_view', 'todo_complete',
        
        // 게시글 관리 - 생성/수정/조회
        'post_create', 'post_update', 'post_view'
      ],
      editor: [
        // 팀 관리 - 권한 없음
        
        // 플래너 관리 - 생성/수정/조회
        'planner_create', 'planner_update', 'planner_view',
        
        // 할 일 관리 - 생성/수정/조회
        'todo_create', 'todo_update', 'todo_view', 'todo_complete',
        
        // 게시글 관리 - 생성/수정/조회
        'post_create', 'post_update', 'post_view'
      ],
      viewer: [
        // 팀 관리 - 권한 없음
        
        // 플래너 관리 - 조회만
        'planner_view',
        
        // 할 일 관리 - 조회만
        'todo_view',
        
        // 게시글 관리 - 조회만
        'post_view'
      ],
      guest: [
        // 팀 관리 - 권한 없음
        
        // 플래너 관리 - 제한적 조회
        'planner_view',
        
        // 할 일 관리 - 제한적 조회
        'todo_view',
        
        // 게시글 관리 - 제한적 조회
        'post_view'
      ]
    };

    return rolePermissions[userRole]?.includes(permission) || false;
  };

  const canEditContent = (contentCreatorId?: number): boolean => {
    if (!user) return false;
    if (userRole === 'owner' || userRole === 'admin' || userRole === 'manager') return true;
    return contentCreatorId === user.id;
  };

  const getRoleDescription = (role: Role): string => {
    const roleDescriptions: Record<Role, string> = {
      owner: "소유자 - 모든 권한을 가집니다",
      admin: "관리자 - 거의 모든 권한을 가집니다",
      manager: "매니저 - 팀 관리와 콘텐츠 관리 권한을 가집니다",
      editor: "편집자 - 콘텐츠 생성과 수정 권한을 가집니다",
      viewer: "조회자 - 읽기 전용 권한을 가집니다",
      guest: "게스트 - 제한적인 읽기 권한을 가집니다"
    };
    return roleDescriptions[role] || "알 수 없는 역할";
  };

  const getRolePriority = (role: Role): number => {
    const rolePriorities: Record<Role, number> = {
      owner: 6,
      admin: 5,
      manager: 4,
      editor: 3,
      viewer: 2,
      guest: 1
    };
    return rolePriorities[role] || 0;
  };

  return {
    userRole,
    loading,
    hasPermission,
    canEditContent,
    getRoleDescription,
    getRolePriority
  };
}; 