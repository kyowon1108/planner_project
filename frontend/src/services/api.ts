import axios from 'axios';
import { logger } from '../utils/logger';
import {
  User,
  Team,
  TeamMember,
  Planner,
  Todo,
  Post,
  Invite,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  CreateTeamRequest,
  CreatePlannerRequest,
  CreateTodoRequest,
  CreatePostRequest,
  CreateInviteRequest,
  ApiError,
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

// axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 추가 및 로깅
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // API 요청 로깅
    logger.logApiRequest(config.method?.toUpperCase() || 'UNKNOWN', config.url || '', config.data);
    
    return config;
  },
  (error) => {
    logger.logApiError('REQUEST', 'unknown', error);
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리 및 로깅
api.interceptors.response.use(
  (response) => {
    // API 응답 로깅
    logger.logApiResponse(
      response.config.method?.toUpperCase() || 'UNKNOWN',
      response.config.url || '',
      response.status,
      response.data
    );
    
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // API 에러 로깅
    logger.logApiError(
      error.config?.method?.toUpperCase() || 'UNKNOWN',
      error.config?.url || '',
      error
    );
    
    return Promise.reject(error);
  }
);

// 인증 관련 API
export const authAPI = {
  login: async (email: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    
    const response = await api.post('/users/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<User> => {
    const response = await api.post('/users/', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/users/me');
    return response.data;
  },

  searchUserByEmail: async (email: string): Promise<User> => {
    const response = await api.get(`/users/search?email=${encodeURIComponent(email)}`);
    return response.data;
  },
};

// 사용자 관련 API
export const userAPI = {
  updateProfile: async (data: { name: string; email: string }): Promise<User> => {
    const response = await api.put('/users/me', data);
    return response.data;
  },

  changePassword: async (data: { current_password: string; new_password: string }): Promise<{ message: string }> => {
    const response = await api.put('/users/me/password', data);
    return response.data;
  },

  deleteAccount: async (data: { password: string }): Promise<{ message: string }> => {
    const response = await api.delete('/users/me', { data });
    return response.data;
  },
};

// 팀 관련 API
export const teamAPI = {
  getTeams: async () => {
    const response = await api.get('/teams');
    return response.data;
  },
  getTeam: async (id: number) => {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },
  createTeam: async (data: any) => {
    const response = await api.post('/teams', data);
    return response.data;
  },
  updateTeam: async (id: number, data: any) => {
    const response = await api.put(`/teams/${id}`, data);
    return response.data;
  },
  deleteTeam: async (id: number) => {
    const response = await api.delete(`/teams/${id}`);
    return response.data;
  },
  getTeamMembers: async (id: number) => {
    const response = await api.get(`/teams/${id}/members`);
    return response.data;
  },
  addTeamMember: async (teamId: number, data: any) => {
    const response = await api.post(`/teams/${teamId}/members`, data);
    return response.data;
  },
  removeTeamMember: async (teamId: number, userId: number) => {
    const response = await api.delete(`/teams/${teamId}/members/${userId}`);
    return response.data;
  },
  updateTeamMemberRole: async (teamId: number, userId: number, data: any) => {
    const response = await api.put(`/teams/${teamId}/members/${userId}/role`, data);
    return response.data;
  },
  leaveTeam: async (teamId: number) => {
    const response = await api.post(`/teams/${teamId}/leave`);
    return response.data;
  },
  transferOwnership: async (teamId: number, newOwnerId: number) => {
    const response = await api.post(`/teams/${teamId}/transfer-ownership/${newOwnerId}`);
    return response.data;
  },
};

// 플래너 관련 API
export const plannerAPI = {
  getPlanners: async (): Promise<Planner[]> => {
    const response = await api.get('/planners/');
    return response.data;
  },

  getPlanner: async (id: number): Promise<Planner> => {
    const response = await api.get(`/planners/${id}`);
    return response.data;
  },

  createPlanner: async (data: CreatePlannerRequest): Promise<Planner> => {
    const response = await api.post('/planners/', data);
    return response.data;
  },

  updatePlanner: async (id: number, data: Partial<CreatePlannerRequest>): Promise<Planner> => {
    const response = await api.put(`/planners/${id}`, data);
    return response.data;
  },

  deletePlanner: async (id: number): Promise<void> => {
    await api.delete(`/planners/${id}`);
  },

  updateStatus: async (id: number, status: string): Promise<any> => {
    const response = await api.patch(`/planners/${id}/status?status=${status}`);
    return response.data;
  },
};

// 할 일 관련 API
export const todoAPI = {
  getTodos: async (plannerId?: number): Promise<Todo[]> => {
    if (plannerId) {
      const response = await api.get(`/todos/planner/${plannerId}`);
      return response.data;
    } else {
      const response = await api.get('/todos/');
      return response.data;
    }
  },

  getMyTodos: async (): Promise<Todo[]> => {
    const response = await api.get('/todos/my');
    return response.data;
  },

  getTodo: async (id: number): Promise<Todo> => {
    const response = await api.get(`/todos/${id}`);
    return response.data;
  },

  createTodo: async (data: CreateTodoRequest): Promise<Todo> => {
    console.log('API 호출 - createTodo:', data);
    const response = await api.post('/todos/', data);
    console.log('API 응답 - createTodo:', response.data);
    return response.data;
  },

  updateTodo: async (id: number, data: Partial<CreateTodoRequest>): Promise<Todo> => {
    const response = await api.put(`/todos/${id}`, data);
    return response.data;
  },

  deleteTodo: async (id: number): Promise<void> => {
    await api.delete(`/todos/${id}`);
  },

  toggleCompletion: async (id: number): Promise<any> => {
    const response = await api.patch(`/todos/${id}/complete`);
    return response.data;
  },
};





// 게시글 관련 API
export const postAPI = {
  getPosts: async (): Promise<Post[]> => {
    const response = await api.get('/posts/');
    return response.data;
  },

  getPost: async (id: number): Promise<Post> => {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  },

  createPost: async (data: CreatePostRequest): Promise<Post> => {
    const response = await api.post('/posts/', data);
    return response.data;
  },

  updatePost: async (id: number, data: Partial<CreatePostRequest>): Promise<Post> => {
    const response = await api.put(`/posts/${id}`, data);
    return response.data;
  },

  deletePost: async (id: number): Promise<void> => {
    await api.delete(`/posts/${id}`);
  },
};

// 이메일 인증 관련 API
export const emailVerificationAPI = {
  sendVerificationCode: async (email: string): Promise<any> => {
    const response = await api.post('/email-verification/send', { email });
    return response.data;
  },

  verifyCode: async (email: string, verificationCode: string): Promise<any> => {
    const response = await api.post('/email-verification/verify', { 
      email, 
      verification_code: verificationCode 
    });
    return response.data;
  },

  resendVerificationCode: async (email: string): Promise<any> => {
    const response = await api.post('/email-verification/resend', { email });
    return response.data;
  },

  getVerificationStatus: async (email: string): Promise<any> => {
    const response = await api.get(`/email-verification/status/${email}`);
    return response.data;
  },
};

// 초대 관련 API
export const inviteAPI = {
  createInvite: async (data: CreateInviteRequest): Promise<Invite> => {
    console.log('API 호출 - createInvite:', data);
    const response = await api.post('/invites/', data);
    console.log('API 응답 - createInvite:', response.data);
    return response.data;
  },

  getTeamInvites: async (teamId: number): Promise<Invite[]> => {
    const response = await api.get(`/invites/team/${teamId}`);
    return response.data;
  },

  getPendingInvites: async (): Promise<Invite[]> => {
    const response = await api.get('/invites/pending');
    return response.data;
  },

  acceptInvite: async (code: string): Promise<any> => {
    console.log('API 호출 - acceptInvite:', code);
    try {
      const response = await api.post(`/invites/accept/${code}`);
      console.log('API 응답 - acceptInvite:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('API 에러 - acceptInvite:', error);
      console.error('에러 상태:', error.response?.status);
      console.error('에러 데이터:', error.response?.data);
      console.error('에러 메시지:', error.message);
      throw error;
    }
  },

  rejectInvite: async (code: string): Promise<any> => {
    console.log('API 호출 - rejectInvite:', code);
    try {
      const response = await api.post(`/invites/reject/${code}`);
      console.log('API 응답 - rejectInvite:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('API 에러 - rejectInvite:', error);
      console.error('에러 상태:', error.response?.status);
      console.error('에러 데이터:', error.response?.data);
      console.error('에러 메시지:', error.message);
      throw error;
    }
  },
};

// 댓글 관련 API
export const replyAPI = {
  createReply: async (postId: number, content: string): Promise<any> => {
    try {
      const response = await api.post(`/posts/${postId}/replies`, { content });
      console.log('댓글 작성 API 응답:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('API 에러 - createReply:', error);
      console.error('에러 응답:', error.response?.data);
      throw error;
    }
  },

  getReplies: async (postId: number, page: number = 1, size: number = 10): Promise<any[]> => {
    try {
      const response = await api.get(`/posts/${postId}/replies?page=${page}&size=${size}`);
      return response.data;
    } catch (error: any) {
      console.error('API 에러 - getReplies:', error);
      throw error;
    }
  },

  updateReply: async (replyId: number, content: string): Promise<any> => {
    try {
      const response = await api.put(`/replies/${replyId}`, { content });
      return response.data;
    } catch (error: any) {
      console.error('API 에러 - updateReply:', error);
      throw error;
    }
  },

  deleteReply: async (replyId: number): Promise<void> => {
    try {
      await api.delete(`/replies/${replyId}`);
    } catch (error: any) {
      console.error('API 에러 - deleteReply:', error);
      throw error;
    }
  },
};

// 좋아요 관련 API
export const likeAPI = {
  toggleLike: async (postId: number): Promise<any> => {
    try {
      const response = await api.post(`/posts/${postId}/toggle`);
      return response.data;
    } catch (error: any) {
      console.error('API 에러 - toggleLike:', error);
      throw error;
    }
  },

  getLikeStatus: async (postId: number): Promise<any> => {
    try {
      const response = await api.get(`/posts/${postId}/like/status`);
      return response.data;
    } catch (error: any) {
      console.error('API 에러 - getLikeStatus:', error);
      throw error;
    }
  },

  getPostLikes: async (postId: number): Promise<any[]> => {
    try {
      const response = await api.get(`/posts/${postId}/likes`);
      return response.data;
    } catch (error: any) {
      console.error('API 에러 - getPostLikes:', error);
      throw error;
    }
  },
};

// 알림 관련 API
export const notificationAPI = {
  getNotifications: async (): Promise<any[]> => {
    const response = await api.get('/notifications/');
    return response.data;
  },

  markAsRead: async (notificationId: number): Promise<void> => {
    await api.put(`/notifications/${notificationId}/mark-read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put('/notifications/mark-all-read');
  },

  deleteNotification: async (notificationId: number): Promise<void> => {
    await api.delete(`/notifications/${notificationId}`);
  },
};

// AI 관련 API
export const aiAPI = {
  recommendTags: async (content: string, existingTags?: string[]): Promise<{recommended_tags: string[]}> => {
    try {
      const response = await api.post('/ai/recommend-tags', {
        content,
        existing_tags: existingTags
      });
      return response.data;
    } catch (error: any) {
      console.error('API 에러 - recommendTags:', error);
      throw error;
    }
  },

  recommendTodos: async (plannerDescription: string, existingTodos?: string[]): Promise<{recommended_todos: any[]}> => {
    try {
      const response = await api.post('/ai/recommend-todos', {
        planner_description: plannerDescription,
        existing_todos: existingTodos
      });
      return response.data;
    } catch (error: any) {
      console.error('API 에러 - recommendTodos:', error);
      throw error;
    }
  },

  analyzeContent: async (content: string): Promise<{sentiment: string, topics: string[], confidence: number}> => {
    try {
      const response = await api.post('/ai/analyze-content', {
        content
      });
      return response.data;
    } catch (error: any) {
      console.error('API 에러 - analyzeContent:', error);
      throw error;
    }
  },
};

// 검색 관련 API
export const searchAPI = {
  search: async (query: string): Promise<any[]> => {
    try {
      const response = await api.get(`/search/?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error: any) {
      console.error('API 에러 - search:', error);
      throw error;
    }
  },
};

// 활동 로그 관련 API
export const activityAPI = {
  getActivities: async (): Promise<any[]> => {
    try {
      const response = await api.get('/activities/');
      return response.data;
    } catch (error: any) {
      console.error('API 에러 - getActivities:', error);
      throw error;
    }
  },

  getUserActivities: async (userId: number): Promise<any[]> => {
    try {
      const response = await api.get(`/activities/user/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('API 에러 - getUserActivities:', error);
      throw error;
    }
  },

  getTeamActivities: async (teamId: number): Promise<any[]> => {
    try {
      const response = await api.get(`/activities/team/${teamId}`);
      return response.data;
    } catch (error: any) {
      console.error('API 에러 - getTeamActivities:', error);
      throw error;
    }
  },
};

export default api; 