import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Skeleton,
  useTheme as useMuiTheme,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '../../contexts/ThemeContext';

interface LoadingStateProps {
  message?: string;
  variant?: 'spinner' | 'skeleton' | 'dots';
  size?: 'small' | 'medium' | 'large';
  fullHeight?: boolean;
  skeletonCount?: number;
  skeletonHeight?: number;
  skeletonWidth?: string | number;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = '로딩 중...',
  variant = 'spinner',
  size = 'medium',
  fullHeight = false,
  skeletonCount = 3,
  skeletonHeight = 60,
  skeletonWidth = '100%',
}) => {
  const { darkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  const getSpinnerSize = () => {
    switch (size) {
      case 'small': return 24;
      case 'large': return 48;
      default: return 32;
    }
  };

  const getTypographyVariant = () => {
    switch (size) {
      case 'small': return 'body2';
      case 'large': return 'h6';
      default: return 'body1';
    }
  };

  const renderSpinner = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        height: fullHeight ? '100vh' : 'auto',
        py: fullHeight ? 0 : 4,
      }}
    >
      <CircularProgress
        size={getSpinnerSize()}
        sx={{
          color: darkMode ? 'white' : 'primary.main',
        }}
      />
      <Typography
        variant={getTypographyVariant()}
        color="text.secondary"
        sx={{
          color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
        }}
      >
        {message}
      </Typography>
    </Box>
  );

  const renderSkeleton = () => (
    <Box sx={{ py: 2 }}>
      {Array.from({ length: skeletonCount }).map((_, index) => (
        <Skeleton
          key={index}
          variant="rectangular"
          height={skeletonHeight}
          width={skeletonWidth}
          sx={{
            mb: 2,
            borderRadius: 2,
            bgcolor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          }}
        />
      ))}
    </Box>
  );

  const renderDots = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        height: fullHeight ? '100vh' : 'auto',
        py: fullHeight ? 0 : 4,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
        }}
      >
        {[0, 1, 2].map((index) => (
          <Box
            key={index}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: darkMode ? 'white' : 'primary.main',
              animation: 'pulse 1.4s ease-in-out infinite both',
              animationDelay: `${index * 0.16}s`,
              '@keyframes pulse': {
                '0%, 80%, 100%': {
                  transform: 'scale(0.8)',
                  opacity: 0.5,
                },
                '40%': {
                  transform: 'scale(1)',
                  opacity: 1,
                },
              },
            }}
          />
        ))}
      </Box>
      <Typography
        variant={getTypographyVariant()}
        color="text.secondary"
        sx={{
          color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
        }}
      >
        {message}
      </Typography>
    </Box>
  );

  switch (variant) {
    case 'skeleton':
      return renderSkeleton();
    case 'dots':
      return renderDots();
    default:
      return renderSpinner();
  }
};

export default LoadingState; 