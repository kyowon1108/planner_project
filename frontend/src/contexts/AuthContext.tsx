import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { User } from '../types';
import { authAPI } from '../services/api';
import { logger } from '../utils/logger';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      logger.info('토큰으로 사용자 정보 로드 시도');
      authAPI.getCurrentUser()
        .then((userData: User) => {
          setUser(userData);
          logger.info('사용자 정보 로드 성공', 'AUTH', { userId: userData.id, email: userData.email });
        })
        .catch((error: any) => {
          logger.warn('토큰으로 사용자 정보 로드 실패', 'AUTH', error);
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      logger.info('저장된 토큰 없음');
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      logger.info('로그인 시도', 'AUTH', { email });
      const response = await authAPI.login(email, password);
      logger.info('로그인 응답 받음', 'AUTH', { hasToken: !!response.access_token });
      
      if (response.access_token) {
        localStorage.setItem('token', response.access_token);
        setUser(response.user);
        logger.info('로그인 성공', 'AUTH', { userId: response.user.id, email: response.user.email });
        return true;
      } else {
        logger.error('로그인 실패 - 토큰 없음', 'AUTH', response);
        return false;
      }
    } catch (error: any) {
      logger.error('로그인 오류', 'AUTH', error);
      // 구체적인 에러 메시지 처리
      if (error.response?.status === 429) {
        throw new Error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
      } else if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error('로그인 중 오류가 발생했습니다.');
      }
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      logger.info('회원가입 시도', 'AUTH', { email });
      await authAPI.register({ name, email, password });
      logger.info('회원가입 성공', 'AUTH', { email });
    } catch (error) {
      logger.error('회원가입 실패', 'AUTH', error);
      throw error;
    }
  };

  const logout = () => {
    logger.info('로그아웃', 'AUTH', { userId: user?.id });
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 