import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  Link,
  InputAdornment,
  IconButton,
  Fade,
  Grow,
  Slide,
  useTheme as useMuiTheme,
  useMediaQuery,
  Divider,
  Chip,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Login as LoginIcon,
  PersonAdd as PersonAddIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Assignment as AssignmentIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';


const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // 로그인 페이지용 라이트 테마 생성
  const lightTheme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: '#f5f5f5',
        paper: '#ffffff',
      },
      text: {
        primary: '#000000',
        secondary: '#666666',
      },
    },
  });
  
  const isMobile = useMediaQuery(lightTheme.breakpoints.down('sm'));

  useEffect(() => {
    setAnimateIn(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const features = [
    { icon: <GroupIcon />, text: '팀 협업', color: '#1976d2' },
    { icon: <AssignmentIcon />, text: '할일 관리', color: '#2e7d32' },
    { icon: <ScheduleIcon />, text: '일정 관리', color: '#ed6c02' },
  ];

  return (
    <ThemeProvider theme={lightTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 4,
            alignItems: 'center',
          }}
        >
          {/* 왼쪽: 브랜딩 및 기능 소개 */}
          <Slide direction="right" in={animateIn} timeout={800}>
            <Box
              sx={{
                color: 'white',
                textAlign: isMobile ? 'center' : 'left',
                mb: isMobile ? 4 : 0,
              }}
            >
              <Grow in={animateIn} timeout={1000}>
                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontWeight: 700,
                    mb: 2,
                    background: 'linear-gradient(45deg, #fff, #f0f0f0)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  }}
                >
                  협업 플래너
                </Typography>
              </Grow>
              
              <Fade in={animateIn} timeout={1200}>
                <Typography
                  variant="h5"
                  sx={{
                    mb: 4,
                    opacity: 0.9,
                    fontWeight: 300,
                    lineHeight: 1.6,
                  }}
                >
                  팀과 함께 더 스마트하게 일하세요
                </Typography>
              </Fade>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {features.map((feature, index) => (
                  <Fade in={animateIn} timeout={1400 + index * 200} key={feature.text}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        borderRadius: 2,
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                    >
                      <Box
                        sx={{
                          color: feature.color,
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          p: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 500 }}>
                        {feature.text}
                      </Typography>
                    </Box>
                  </Fade>
                ))}
              </Box>
            </Box>
          </Slide>

          {/* 오른쪽: 로그인 폼 */}
          <Slide direction="left" in={animateIn} timeout={800}>
            <Paper
              elevation={24}
              sx={{
                p: 4,
                borderRadius: 3,
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.3)',
                maxWidth: 450,
                mx: 'auto',
                width: '100%',
              }}
            >
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                  }}
                >
                  <LoginIcon sx={{ color: 'white', fontSize: 40 }} />
                </Box>
                <Typography variant="h4" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
                  로그인
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  계정에 로그인하여 시작하세요
                </Typography>
              </Box>

              {error && (
                <Fade in={!!error}>
                  <Alert
                    severity="error"
                    icon={<ErrorIcon />}
                    sx={{
                      mb: 3,
                      borderRadius: 2,
                      '& .MuiAlert-message': { fontWeight: 500 },
                    }}
                  >
                    {error}
                  </Alert>
                </Fade>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  required
                  id="email"
                  label="이메일"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon
                          sx={{
                            color: emailFocused ? 'primary.main' : 'text.secondary',
                            transition: 'color 0.3s ease',
                          }}
                        />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                      },
                      '&.Mui-focused': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderWidth: 2,
                        },
                      },
                    },
                  }}
                />

                <TextField
                  fullWidth
                  required
                  name="password"
                  label="비밀번호"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon
                          sx={{
                            color: passwordFocused ? 'primary.main' : 'text.secondary',
                            transition: 'color 0.3s ease',
                          }}
                        />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="비밀번호 표시/숨김"
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 4,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                      },
                      '&.Mui-focused': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderWidth: 2,
                        },
                      },
                    },
                  }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? null : <LoginIcon />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)',
                    },
                    '&:disabled': {
                      background: 'linear-gradient(135deg, #ccc 0%, #999 100%)',
                      transform: 'none',
                    },
                  }}
                >
                  {loading ? '로그인 중...' : '로그인'}
                </Button>

                <Divider sx={{ my: 3 }}>
                  <Chip label="또는" size="small" />
                </Divider>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    아직 계정이 없으신가요?
                  </Typography>
                  <Button
                    component={Link}
                    href="/register"
                    variant="outlined"
                    startIcon={<PersonAddIcon />}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      '&:hover': {
                        borderColor: 'primary.dark',
                        backgroundColor: 'primary.main',
                        color: 'white',
                      },
                    }}
                  >
                    회원가입
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Slide>
        </Box>
      </Container>
    </Box>
    </ThemeProvider>
  );
};

export default LoginPage; 