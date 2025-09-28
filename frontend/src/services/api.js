import axios from 'axios';
import { logger } from '../utils/logger';

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
  login: async (email, password) => {
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

  register: async (data) => {
    const response = await api.post('/users/', data);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  searchUserByEmail: async (email) => {
    const response = await api.get(`/users/search?email=${encodeURIComponent(email)}`);
    return response.data;
  },
};

// 사용자 관련 API
export const userAPI = {
  updateProfile: async (data) => {
    const response = await api.put('/users/me', data);
    return response.data;
  },

  changePassword: async (data) => {
    const response = await api.put('/users/me/password', data);
    return response.data;
  },

  deleteAccount: async (data) => {
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
  getTeam: async (id) => {
    const response = await api.get(`/teams/${id}`);
    return response.data;
  },
  createTeam: async (data: any) => {
    const response = await api.post('/teams', data);
    return response.data;
  },
  updateTeam: async (id, data) => {
    const response = await api.put(`/teams/${id}`, data);
    return response.data;
  },
  deleteTeam: async (id) => {
    const response = await api.delete(`/teams/${id}`);
    return response.data;
  },
  getTeamMembers: async (id) => {
    const response = await api.get(`/teams/${id}/members`);
    return response.data;
  },
  addTeamMember: async (teamId, data) => {
    const response = await api.post(`/teams/${teamId}/members`, data);
    return response.data;
  },
  removeTeamMember: async (teamId, userId) => {
    const response = await api.delete(`/teams/${teamId}/members/${userId}`);
    return response.data;
  },
  updateTeamMemberRole: async (teamId, userId, data) => {
    const response = await api.put(`/teams/${teamId}/members/${userId}/role`, data);
    return response.data;
  },
  leaveTeam: async (teamId) => {
    const response = await api.post(`/teams/${teamId}/leave`);
    return response.data;
  },
  transferOwnership: async (teamId, newOwnerId) => {
    const response = await api.post(`/teams/${teamId}/transfer-ownership/${newOwnerId}`);
    return response.data;
  },
};

// 플래너 관련 API
export const plannerAPI = {
  getPlanners: async () => {
    const response = await api.get('/planners/');
    return response.data;
  },

  getPlanner: async (id) => {
    const response = await api.get(`/planners/${id}`);
    return response.data;
  },

  createPlanner: async (data) => {
    const response = await api.post('/planners/', data);
    return response.data;
  },

  updatePlanner: async (id, data) => {
    const response = await api.put(`/planners/${id}`, data);
    return response.data;
  },

  deletePlanner: async (id) => {
    await api.delete(`/planners/${id}`);
  },

  updateStatus: async (id, status) => {
    const response = await api.patch(`/planners/${id}/status?status=${status}`);
    return response.data;
  },
};

// 할 일 관련 API
export const todoAPI = {
  getTodos: async (plannerId) => {
    if (plannerId) {
      const response = await api.get(`/todos/planner/${plannerId}`);
      return response.data;
    } else {
      const response = await api.get('/todos/');
      return response.data;
    }
  },

  getMyTodos: async () => {
    const response = await api.get('/todos/my');
    return response.data;
  },

  getTodo: async (id) => {
    const response = await api.get(`/todos/${id}`);
    return response.data;
  },

  createTodo: async (data) => {
    console.log('API 호출 - createTodo:', data);
    const response = await api.post('/todos/', data);
    console.log('API 응답 - createTodo:', response.data);
    return response.data;
  },

  updateTodo: async (id, data) => {
    const response = await api.put(`/todos/${id}`, data);
    return response.data;
  },

  deleteTodo: async (id) => {
    await api.delete(`/todos/${id}`);
  },

  toggleCompletion: async (id) => {
    const response = await api.patch(`/todos/${id}/complete`);
    return response.data;
  },
};





// 게시글 관련 API
export const postAPI = {
  getPosts: async () => {
    const response = await api.get('/posts/');
    return response.data;
  },

  getPost: async (id) => {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  },

  createPost: async (data) => {
    const response = await api.post('/posts/', data);
    return response.data;
  },

  updatePost: async (id, data) => {
    const response = await api.put(`/posts/${id}`, data);
    return response.data;
  },

  deletePost: async (id) => {
    await api.delete(`/posts/${id}`);
  },
};

// 이메일 인증 관련 API
export const emailVerificationAPI = {
  sendVerificationCode: async (email) => {
    const response = await api.post('/email-verification/send', { email });
    return response.data;
  },

  verifyCode: async (email, verificationCode) => {
    const response = await api.post('/email-verification/verify', { 
      email, 
      verification_code: verificationCode 
    });
    return response.data;
  },

  resendVerificationCode: async (email) => {
    const response = await api.post('/email-verification/resend', { email });
    return response.data;
  },

  getVerificationStatus: async (email) => {
    const response = await api.get(`/email-verification/status/${email}`);
    return response.data;
  },
};

// 초대 관련 API
export const inviteAPI = {
  createInvite: async (data) => {
    console.log('API 호출 - createInvite:', data);
    const response = await api.post('/invites/', data);
    console.log('API 응답 - createInvite:', response.data);
    return response.data;
  },

  getTeamInvites: async (teamId) => {
    const response = await api.get(`/invites/team/${teamId}`);
    return response.data;
  },

  getPendingInvites: async () => {
    const response = await api.get('/invites/pending');
    return response.data;
  },

  acceptInvite: async (code) => {
    console.log('API 호출 - acceptInvite:', code);
    try {
      const response = await api.post(`/invites/accept/${code}`);
      console.log('API 응답 - acceptInvite:', response.data);
      return response.data;
    } catch (error) {
      console.error('API 에러 - acceptInvite:', error);
      console.error('에러 상태:', error.response?.status);
      console.error('에러 데이터:', error.response?.data);
      console.error('에러 메시지:', error.message);
      throw error;
    }
  },

  rejectInvite: async (code) => {
    console.log('API 호출 - rejectInvite:', code);
    try {
      const response = await api.post(`/invites/reject/${code}`);
      console.log('API 응답 - rejectInvite:', response.data);
      return response.data;
    } catch (error) {
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
  createReply: async (postId, content) => {
    try {
      const response = await api.post(`/posts/${postId}/replies`, { content });
      console.log('댓글 작성 API 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('API 에러 - createReply:', error);
      console.error('에러 응답:', error.response?.data);
      throw error;
    }
  },

  getReplies: async (postId, page = 1, size = 10) => {
    try {
      const response = await api.get(`/posts/${postId}/replies?page=${page}&size=${size}`);
      return response.data;
    } catch (error) {
      console.error('API 에러 - getReplies:', error);
      throw error;
    }
  },

  updateReply: async (replyId, content) => {
    try {
      const response = await api.put(`/replies/${replyId}`, { content });
      return response.data;
    } catch (error) {
      console.error('API 에러 - updateReply:', error);
      throw error;
    }
  },

  deleteReply: async (replyId) => {
    try {
      await api.delete(`/replies/${replyId}`);
    } catch (error) {
      console.error('API 에러 - deleteReply:', error);
      throw error;
    }
  },
};

// 좋아요 관련 API
export const likeAPI = {
  toggleLike: async (postId) => {
    try {
      const response = await api.post(`/posts/${postId}/toggle`);
      return response.data;
    } catch (error) {
      console.error('API 에러 - toggleLike:', error);
      throw error;
    }
  },

  getLikeStatus: async (postId) => {
    try {
      const response = await api.get(`/posts/${postId}/like/status`);
      return response.data;
    } catch (error) {
      console.error('API 에러 - getLikeStatus:', error);
      throw error;
    }
  },

  getPostLikes: async (postId) => {
    try {
      const response = await api.get(`/posts/${postId}/likes`);
      return response.data;
    } catch (error) {
      console.error('API 에러 - getPostLikes:', error);
      throw error;
    }
  },
};

// 알림 관련 API
export const notificationAPI = {
  getNotifications: async () => {
    const response = await api.get('/notifications/');
    return response.data;
  },

  markAsRead: async (notificationId) => {
    await api.put(`/notifications/${notificationId}/mark-read`);
  },

  markAllAsRead: async () => {
    await api.put('/notifications/mark-all-read');
  },

  deleteNotification: async (notificationId) => {
    await api.delete(`/notifications/${notificationId}`);
  },
};

// AI 관련 API
export const aiAPI = {
  recommendTags: async (content, existingTags) => {
    try {
      const response = await api.post('/ai/recommend-tags', {
        content,
        existing_tags: existingTags
      });
      return response.data;
    } catch (error) {
      console.error('API 에러 - recommendTags:', error);
      throw error;
    }
  },

  recommendTodos: async (plannerDescription, existingTodos) => {
    try {
      const response = await api.post('/ai/recommend-todos', {
        planner_description: plannerDescription,
        existing_todos: existingTodos
      });
      return response.data;
    } catch (error) {
      console.error('API 에러 - recommendTodos:', error);
      throw error;
    }
  },

  analyzeContent: async (content) => {
    try {
      const response = await api.post('/ai/analyze-content', {
        content
      });
      return response.data;
    } catch (error) {
      console.error('API 에러 - analyzeContent:', error);
      throw error;
    }
  },
};

// 검색 관련 API
export const searchAPI = {
  search: async (query) => {
    try {
      const response = await api.get(`/search/?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('API 에러 - search:', error);
      throw error;
    }
  },
};

// 활동 로그 관련 API
export const activityAPI = {
  getActivities: async () => {
    try {
      const response = await api.get('/activities/');
      return response.data;
    } catch (error) {
      console.error('API 에러 - getActivities:', error);
      throw error;
    }
  },

  getUserActivities: async (userId) => {
    try {
      const response = await api.get(`/activities/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('API 에러 - getUserActivities:', error);
      throw error;
    }
  },

  getTeamActivities: async (teamId) => {
    try {
      const response = await api.get(`/activities/team/${teamId}`);
      return response.data;
    } catch (error) {
      console.error('API 에러 - getTeamActivities:', error);
      throw error;
    }
  },
};

// ==== FEAT-004: 고도화된 AI 추천 시스템 타입 정의 ====
/**
 * @typedef {Object} AIRecommendationAdvanced
 * @property {string} title
 * @property {string} description
 * @property {'low'|'medium'|'high'} priority
 * @property {string} category
 * @property {number} estimated_time
 * @property {number} confidence
 * @property {string} reasoning
 * @property {string} [optimal_time]
 */

/**
 * @typedef {Object} ProductivityInsights
 * @property {number} productivity_score
 * @property {number[]} peak_hours
 * @property {string[]} preferred_task_types
 * @property {Object<string, number>} avg_completion_times
 * @property {string} collaboration_style
 * @property {Object<string, *>} work_patterns
 * @property {string[]} recommendations
 * @property {Object} weekly_trend
 * @property {number} weekly_trend.completed_tasks
 * @property {number} weekly_trend.avg_daily_tasks
 * @property {string} weekly_trend.productivity_change
 */

/**
 * @typedef {Object} TextAnalysisResult
 * @property {string[]} tags
 * @property {string} priority
 * @property {string} category
 * @property {string} sentiment
 * @property {string[]} topics
 * @property {number} confidence
 * @property {string[]} keywords
 * @property {Object} suggestions
 * @property {number} suggestions.estimated_time
 * @property {string[]} suggestions.best_time_slots
 * @property {string[]} suggestions.related_tasks
 */

// 고도화된 AI 추천 시스템 API 확장
const aiAPIAdvanced = {
  // 개인화된 스마트 할 일 추천
  getSmartTodoRecommendations: async (context) => {
    try {
      const contextParam = context ? `?context=${encodeURIComponent(JSON.stringify(context))}` : '';
      const response = await api.get(`/ai/recommendations/todos${contextParam}`);
      return response.data;
    } catch (error) {
      console.error('AI 할 일 추천 조회 실패:', error);
      throw error;
    }
  },

  // 추천 피드백 제출
  submitRecommendationFeedback: async (recommendationId, feedback) => {
    try {
      await api.post('/ai/recommendations/feedback', {
        recommendation_id: recommendationId,
        feedback: feedback
      });
    } catch (error) {
      console.error('추천 피드백 제출 실패:', error);
      throw error;
    }
  },

  // 생산성 인사이트 조회
  getProductivityInsights: async (period = 'week') => {
    try {
      const response = await api.get(`/ai/insights/productivity?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('생산성 인사이트 조회 실패:', error);
      throw error;
    }
  },

  // 고도화된 텍스트 분석 (자동 태깅)
  analyzeTextAdvanced: async (text, analysisType = 'comprehensive') => {
    try {
      const response = await api.post('/ai/analyze/text', null, {
        params: {
          text: text,
          analysis_type: analysisType
        }
      });
      return response.data;
    } catch (error) {
      console.error('고급 텍스트 분석 실패:', error);
      throw error;
    }
  },

  // 팀 협업 제안
  getTeamCollaborationSuggestions: async (teamId) => {
    try {
      const teamParam = teamId ? `?team_id=${teamId}` : '';
      const response = await api.get(`/ai/suggestions/team${teamParam}`);
      return response.data;
    } catch (error) {
      console.error('팀 협업 제안 조회 실패:', error);
      throw error;
    }
  }
};

// 기존 aiAPI에 고도화된 기능 병합
Object.assign(aiAPI, aiAPIAdvanced);

export default api; 