import { useState, useCallback } from 'react';
import { ApiError } from '../types';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<T>
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const result = await apiFunction(...args);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (error: any) {
        const errorMessage = error.response?.data?.detail || 
                           error.message || 
                           '알 수 없는 오류가 발생했습니다.';
        setState(prev => ({ ...prev, loading: false, error: errorMessage }));
        return null;
      }
    },
    [apiFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// 특정 에러 타입을 처리하는 훅
export function useApiWithErrorHandling<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  errorHandler?: (error: ApiError) => void
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const result = await apiFunction(...args);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (error: any) {
        const apiError: ApiError = {
          detail: error.response?.data?.detail || error.message || '알 수 없는 오류가 발생했습니다.',
          status_code: error.response?.status,
          message: error.message,
        };
        
        if (errorHandler) {
          errorHandler(apiError);
        }
        
        setState(prev => ({ ...prev, loading: false, error: apiError.detail }));
        return null;
      }
    },
    [apiFunction, errorHandler]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
} 