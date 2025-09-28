import React from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  AlertTitle,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Error,
  Refresh,
  Home,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext.jsx';

const ErrorState = ({
  error,
  title,
  message,
  variant = 'alert',
  size = 'medium',
  fullHeight = false,
  showRetry = true,
  showHome = false,
  showBack = false,
  onRetry,
  onHome,
  onBack,
  severity = 'error',
  actions,
}) => {
  const navigate = useNavigate();
  const { darkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  const getErrorMessage = () => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return message || '오류가 발생했습니다.';
  };

  const getErrorTitle = () => {
    if (title) return title;
    
    switch (severity) {
      case 'warning':
        return '경고';
      case 'info':
        return '알림';
      default '오류';
    }
  };

  const getTypographyVariant = () => {
    switch (size) {
      case 'small': return 'body2';
      case 'large': return 'h6';
      default 'body1';
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleHome = () => {
    if (onHome) {
      onHome();
    } else {
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const renderAlert = () => (
    <Alert
      severity={severity}
      icon={<ErrorIcon />}
      sx={{
        borderRadius,
        '& .MuiAlert-icon': {
          color ? 'white' : 'inherit',
        },
      }}
      action={
        actions || (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {showRetry && (
              <Button
                size="small"
                startIcon={<RefreshIcon />}
                onClick={handleRetry}
                variant="outlined"
                sx={{
                  color ? 'white' : 'inherit',
                  borderColor ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
                  '&:hover': {
                    borderColor ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                  },
                }}
              >
                다시 시도
              </Button>
            )}
            {showHome && (
              <Button
                size="small"
                startIcon={<HomeIcon />}
                onClick={handleHome}
                variant="outlined"
                                 sx={{
                   color ? 'white' : 'inherit',
                   borderColor ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
                   '&:hover': {
                     borderColor ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                   },
                 }}
              >
                홈으로
              </Button>
            )}
            {showBack && (
              <Button
                size="small"
                startIcon={<ArrowBackIcon />}
                onClick={handleBack}
                variant="outlined"
                sx={{
                  color ? 'white' : 'inherit',
                  borderColor ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
                  '&:hover': {
                    borderColor ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                  },
                }}
              >
                뒤로
              </Button>
            )}
          </Box>
        )
      }
    >
      {getErrorTitle()}</AlertTitle>
      {getErrorMessage()}
    </Alert>
  );

  const renderCard = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        height ? '100vh' : 'auto',
        py ? 0 : 4,
        textAlign: 'center',
      }}
    >
      <ErrorIcon
        sx={{
          fontSize === 'large' ? 80 : size === 'small' ? 40 : 60,
          color === 'error' ? 'error.main' : 
                 severity === 'warning' ? 'warning.main' : 'info.main',
        }}
      />
      
        <Typography
          variant={size === 'large' ? 'h5' : size === 'small' ? 'h6' : 'h6'}
          component="h2"
          sx={{
            fontWeight,
            color ? 'white' : 'text.primary',
            mb,
          }}
        >
          {getErrorTitle()}
        </Typography>
        <Typography
          variant={getTypographyVariant()}
          color="text.secondary"
          sx={{
            color ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
            mb,
          }}
        >
          {getErrorMessage()}
        </Typography>
      </Box>
      
      {(showRetry || showHome || showBack || actions) && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
          {actions}
          {showRetry && (
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleRetry}
              size={size === 'small' ? 'small' : 'medium'}
            >
              다시 시도
            </Button>
          )}
          {showHome && (
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={handleHome}
              size={size === 'small' ? 'small' : 'medium'}
              sx={{
                color ? 'white' : 'inherit',
                borderColor ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
                '&:hover': {
                  borderColor ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                },
              }}
            >
              홈으로
            </Button>
          )}
          {showBack && (
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              size={size === 'small' ? 'small' : 'medium'}
              sx={{
                color ? 'white' : 'inherit',
                borderColor ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
                '&:hover': {
                  borderColor ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                },
              }}
            >
              뒤로
            </Button>
          )}
        </Box>
      )}
    </Box>
  );

  const renderMinimal = () => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py,
      }}
    >
      <ErrorIcon
        sx={{
          fontSize,
          color === 'error' ? 'error.main' : 
                 severity === 'warning' ? 'warning.main' : 'info.main',
        }}
      />
      <Typography
        variant={getTypographyVariant()}
        color="text.secondary"
        sx={{
          color ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
        }}
      >
        {getErrorMessage()}
      </Typography>
    </Box>
  );

  switch (variant) {
    case 'card':
      return renderCard();
    case 'minimal':
      return renderMinimal();
    default renderAlert();
  }
};

export default ErrorState; 