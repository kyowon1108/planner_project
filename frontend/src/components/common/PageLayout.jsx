import React from 'react';
import {
  Box,
  Container,
  Typography,
  Slide,
  Fade,
  Grow,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import Navbar from '../Navbar';

const PageLayout = ({
  children,
  title,
  subtitle,
  maxWidth = 'lg',
  showNavbar = true,
  animateIn = true,
  animationDelay = 0,
  containerProps = {},
  headerContent,
  backgroundVariant = 'default',
}) => {
  const { darkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  const getBackgroundStyle = () => {
    switch (backgroundVariant) {
      case 'gradient':
        return darkMode 
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      case 'solid':
        return darkMode ? '#1a1a2e' : '#f5f5f5';
      default darkMode 
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {showNavbar && <Navbar />}
      <Box
        sx={{
          minHeight ? 'calc(100vh - 64px)' : '100vh',
          background(),
          pt ? 4 : 0,
          pb,
          overflowX: 'hidden',
        }}
      >
        <Container 
          maxWidth={maxWidth} 
          sx={{ 
            mt ? 2 : 4, 
            mb,
            ...containerProps.sx 
          }}
          {...containerProps}
        >
          {/* 헤더 섹션 */}
          {(title || headerContent) && (
            <Slide direction="down" in={animateIn} timeout={600 + animationDelay}>
              <Box sx={{ mb }}>
                {title && (
                  <Fade in={animateIn} timeout={800 + animationDelay}>
                    <Typography
                      variant={isMobile ? 'h5' : 'h4'}
                      component="h1"
                      sx={{
                        fontWeight,
                        color: 'white',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        mb ? 1 : 0,
                      }}
                    >
                      {title}
                    </Typography>
                  </Fade>
                )}
                {subtitle && (
                  <Fade in={animateIn} timeout={1000 + animationDelay}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'white',
                        opacity.9,
                        fontWeight,
                      }}
                    >
                      {subtitle}
                    </Typography>
                  </Fade>
                )}
                {headerContent && (
                  <Grow in={animateIn} timeout={1200 + animationDelay}>
                    <Box sx={{ mt }}>
                      {headerContent}
                    </Box>
                  </Grow>
                )}
              </Box>
            </Slide>
          )}

          {/* 메인 콘텐츠 */}
          <Slide direction="up" in={animateIn} timeout={800 + animationDelay}>
            <Box>
              {children}
            </Box>
          </Slide>
        </Container>
      </Box>
    </Box>
  );
};

export default PageLayout; 