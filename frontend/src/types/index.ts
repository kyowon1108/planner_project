export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  members: TeamMember[];
  owner_id?: number;
  owner_name?: string;
  member_count?: number;
}

export interface TeamMember {
  id: number;
  team_id: number;
  user_id: number;
  role: string;
  joined_at: string;
  user_name?: string;
  user_email?: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface Planner {
  id: number;
  title: string;
  description: string;
  deadline: string;
  status: string;
  team_id: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  team_name?: string;
}

export interface Todo {
  id: number;
  title: string;
  description: string;
  priority: string;
  due_date?: string;
  assigned_to?: number[];
  is_completed: boolean;
  planner_id: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  assignee_names?: string[];
  status?: string;
  team_name?: string;
  planner_name?: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  team_id: number;
  author_id: number;
  category?: string;
  tags?: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
  team_name?: string;
  like_count?: number;
  is_liked?: boolean;
  reply_count?: number;
}

export interface Reply {
  id: number;
  content: string;
  author_id: number;
  author_name: string;
  post_id: number;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  deleted_at?: string;
}

export interface CreateReplyRequest {
  content: string;
  post_id: number;
}

export interface UpdateReplyRequest {
  content: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface CreateTeamRequest {
  name: string;
  description: string;
}

export interface CreatePlannerRequest {
  title: string;
  description: string;
  team_id: number;
  status: string;
  deadline?: string;
}

export interface CreateTodoRequest {
  title: string;
  description?: string | null;
  planner_id: number;
  priority: string;
  due_date?: string | null;
  assigned_to?: number[] | null;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  team_id: number;
  category?: string;
  tags?: string;
}

export interface Invite {
  id: number;
  code: string;
  team_id: number;
  created_by: number;
  role: string;
  is_used: boolean;
  expires_at?: string;
  created_at: string;
}

export interface CreateInviteRequest {
  team_id: number;
  role?: string;
  email?: string;
  expires_at?: string;
}

export interface AcceptInviteRequest {
  code: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  related_id?: number;
  created_at: string;
}

// API 에러 타입 정의
export interface ApiError {
  detail: string;
  status_code?: number;
  message?: string;
}

// API 응답 타입 정의
export interface ApiResponse<T> {
  data: T;
  message?: string;
} 