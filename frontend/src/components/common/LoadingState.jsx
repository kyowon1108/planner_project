import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Skeleton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '../../contexts/ThemeContext.jsx';

const LoadingState = ({
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
      default 32;
    }
  };

  const getTypographyVariant = () => {
    switch (size) {
      case 'small': return 'body2';
      case 'large': return 'h6';
      default 'body1';
    }
  };

  const renderSpinner = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap,
        height ? '100vh' : 'auto',
        py ? 0 : 4,
      }}
    >
      <CircularProgress
        size={getSpinnerSize()}
        sx={{
          color ? 'white' : 'primary.main',
        }}
      />
      <Typography
        variant={getTypographyVariant()}
        color="text.secondary"
        sx={{
          color ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
        }}
      >
        {message}
      </Typography>
    </Box>
  );

  const renderSkeleton = () => (
    <Box sx={{ py }}>
      {Array.from({ length }).map((_, index) => (
        <Skeleton
          key={index}
          variant="rectangular"
          height={skeletonHeight}
          width={skeletonWidth}
          sx={{
            mb,
            borderRadius,
            bgcolor ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
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
        gap,
        height ? '100vh' : 'auto',
        py ? 0 : 4,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap,
          alignItems: 'center',
        }}
      >
        {[0, 1, 2].map((index) => (
          <Box
            key={index}
            sx={{
              width,
              height,
              borderRadius: '50%',
              backgroundColor ? 'white' : 'primary.main',
              animation: 'pulse 1.4s ease-in-out infinite both',
              animationDelay: `${index * 0.16}s`,
              '@keyframes pulse': {
                '0%, 80%, 100%': {
                  transform: 'scale(0.8)',
                  opacity.5,
                },
                '40%': {
                  transform: 'scale(1)',
                  opacity,
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
          color ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
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
    default renderSpinner();
  }
};

export default LoadingState; 