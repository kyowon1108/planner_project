import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface ErrorDisplayProps {
  message?: string;
  onRetry?: () => void;
  onLogin?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  message = '오류가 발생했습니다.', 
  onRetry,
  onLogin
}) => {
  const getErrorMessage = (error: any): string => {
    if (typeof error === 'string') {
      return error;
    }
    if (error?.message) {
      return typeof error.message === 'string' ? error.message : JSON.stringify(error.message);
    }
    if (error?.detail) {
      return typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail);
    }
    return typeof error === 'object' ? JSON.stringify(error) : String(error);
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="200px"
      gap={2}
    >
      <Alert severity="error" sx={{ maxWidth: 400 }}>
        <Typography variant="body1">
          {message}
        </Typography>
      </Alert>
      
      <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center">
        {onRetry && (
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={onRetry}
          >
            다시 시도
          </Button>
        )}
        {onLogin && (
          <Button
            variant="contained"
            color="primary"
            onClick={onLogin}
          >
            로그인
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default ErrorDisplay; 