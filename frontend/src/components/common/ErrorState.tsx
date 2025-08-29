import React from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  AlertTitle,
  useTheme as useMuiTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

interface ErrorStateProps {
  error?: string | Error | null;
  title?: string;
  message?: string;
  variant?: 'alert' | 'card' | 'minimal';
  size?: 'small' | 'medium' | 'large';
  fullHeight?: boolean;
  showRetry?: boolean;
  showHome?: boolean;
  showBack?: boolean;
  onRetry?: () => void;
  onHome?: () => void;
  onBack?: () => void;
  severity?: 'error' | 'warning' | 'info';
  actions?: React.ReactNode;
}

const ErrorState: React.FC<ErrorStateProps> = ({
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
      default:
        return '오류';
    }
  };

  const getTypographyVariant = () => {
    switch (size) {
      case 'small': return 'body2';
      case 'large': return 'h6';
      default: return 'body1';
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
        borderRadius: 2,
        '& .MuiAlert-icon': {
          color: darkMode ? 'white' : 'inherit',
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
                  color: darkMode ? 'white' : 'inherit',
                  borderColor: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
                  '&:hover': {
                    borderColor: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
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
                   color: darkMode ? 'white' : 'inherit',
                   borderColor: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
                   '&:hover': {
                     borderColor: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
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
                  color: darkMode ? 'white' : 'inherit',
                  borderColor: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
                  '&:hover': {
                    borderColor: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
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
      <AlertTitle>{getErrorTitle()}</AlertTitle>
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
        gap: 3,
        height: fullHeight ? '100vh' : 'auto',
        py: fullHeight ? 0 : 4,
        textAlign: 'center',
      }}
    >
      <ErrorIcon
        sx={{
          fontSize: size === 'large' ? 80 : size === 'small' ? 40 : 60,
          color: severity === 'error' ? 'error.main' : 
                 severity === 'warning' ? 'warning.main' : 'info.main',
        }}
      />
      <Box>
        <Typography
          variant={size === 'large' ? 'h5' : size === 'small' ? 'h6' : 'h6'}
          component="h2"
          sx={{
            fontWeight: 600,
            color: darkMode ? 'white' : 'text.primary',
            mb: 1,
          }}
        >
          {getErrorTitle()}
        </Typography>
        <Typography
          variant={getTypographyVariant()}
          color="text.secondary"
          sx={{
            color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
            mb: 3,
          }}
        >
          {getErrorMessage()}
        </Typography>
      </Box>
      
      {(showRetry || showHome || showBack || actions) && (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
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
                color: darkMode ? 'white' : 'inherit',
                borderColor: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
                '&:hover': {
                  borderColor: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
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
                color: darkMode ? 'white' : 'inherit',
                borderColor: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
                '&:hover': {
                  borderColor: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
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
        py: 1,
      }}
    >
      <ErrorIcon
        sx={{
          fontSize: 16,
          color: severity === 'error' ? 'error.main' : 
                 severity === 'warning' ? 'warning.main' : 'info.main',
        }}
      />
      <Typography
        variant={getTypographyVariant()}
        color="text.secondary"
        sx={{
          color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
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
    default:
      return renderAlert();
  }
};

export default ErrorState; 