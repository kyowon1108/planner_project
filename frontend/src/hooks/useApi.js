import { useState, useCallback } from 'react';

/**
 * @typedef {Object} UseApiState
 * @property {*} data
 * @property {boolean} loading
 * @property {string|null} error
 */

/**
 * @typedef {Object} UseApiReturn
 * @property {*} data
 * @property {boolean} loading
 * @property {string|null} error
 * @property {Function} execute
 * @property {Function} reset
 */

export function useApi(apiFunction) {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args) => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const result = await apiFunction(...args);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (error) {
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
export function useApiWithErrorHandling(apiFunction, errorHandler) {
  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args) => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        const result = await apiFunction(...args);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (error) {
        const apiError = {
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