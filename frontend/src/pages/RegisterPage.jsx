import React, { useState, useEffect, useCallback } from 'react';
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
  Snackbar,
  Fade,
  Grow,
  Slide,
  useTheme,
  useMediaQuery,
  Divider,
  Chip,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Person,
  Lock,
  PersonAdd,
  CheckCircle,
  Error,
  Assignment,
  Group,
  Schedule,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

import PasswordStrengthMeter from '../components/PasswordStrengthMeter.jsx';
import {
  validateEmail,
  validatePassword,
  validateName,
  validateConfirmPassword,
  debounce,
} from '../utils/validation';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // 유효성 검사 상태
  const [nameValidation, setNameValidation] = useState({ isValid, message: '' });
  const [emailValidation, setEmailValidation] = useState({ isValid, message: '' });
  const [passwordValidation, setPasswordValidation] = useState({ isValid, message: '' });
  const [confirmPasswordValidation, setConfirmPasswordValidation] = useState({ isValid, message: '' });
  
  // 포커스 상태
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  
  const { register, login } = useAuth();
  const navigate = useNavigate();
  
  // 회원가입 페이지용 라이트 테마 생성
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

  // 이메일 중복 확인 (디바운스 적용)
  const checkEmailAvailability = useCallback(
    async (email) => {
      if (!email || !validateEmail(email).isValid) return;
      
      try {
        // 실제로는 백엔드 API를 호출해야 하지만, 여기서는 시뮬레이션
        // await userAPI.checkEmailAvailability(email);
        const isAvailable = true; // 실제로는 API 응답
        if (!isAvailable) {
          setEmailValidation({ isValid, message: '이미 사용 중인 이메일입니다.' });
        }
      } catch (error) {
        console.error('이메일 중복 확인 실패:', error);
      }
    },
    []
  );

  // 디바운스된 이메일 확인 함수
  const debouncedCheckEmail = useCallback(
    debounce(checkEmailAvailability, 500),
    [checkEmailAvailability]
  );

  // 실시간 유효성 검사
  useEffect(() => {
    const nameResult = validateName(name);
    setNameValidation(nameResult);
  }, [name]);

  useEffect(() => {
    const emailResult = validateEmail(email);
    setEmailValidation(emailResult);
    if (emailResult.isValid) {
      debouncedCheckEmail(email);
    }
  }, [email, debouncedCheckEmail]);

  useEffect(() => {
    const passwordResult = validatePassword(password);
    setPasswordValidation(passwordResult);
  }, [password]);

  useEffect(() => {
    const confirmResult = validateConfirmPassword(password, confirmPassword);
    setConfirmPasswordValidation(confirmResult);
  }, [password, confirmPassword]);

  useEffect(() => {
    setAnimateIn(true);
  }, []);

  const features = [
    { icon: <GroupIcon />, text: '팀 협업', color: '#1976d2' },
    { icon: <AssignmentIcon />, text: '할일 관리', color: '#2e7d32' },
    { icon: <ScheduleIcon />, text: '일정 관리', color: '#ed6c02' },
  ];

  // 폼 유효성 확인
  const isFormValid = () => {
    return (
      nameValidation.isValid &&
      emailValidation.isValid &&
      passwordValidation.isValid &&
      confirmPasswordValidation.isValid
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isFormValid()) {
      setError('모든 필드를 올바르게 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      // 회원가입
      await register(name, email, password);
      
      // 자동 로그인
      await login(email, password);
      
      setShowSuccessSnackbar(true);
      
      // 이메일 인증 페이지로 이동
      setTimeout(() => {
        navigate(`/email-verification?email=${encodeURIComponent(email)}`);
      }, 1500);
      
    } catch (err) {
      const errorMessage = err.response?.data?.detail || '회원가입에 실패했습니다.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e.KeyboardEvent, nextFieldId: string) => {
    if (e.key === 'Enter' && nextFieldId) {
      const nextField = document.getElementById(nextFieldId);
      if (nextField) {
        nextField.focus();
      }
    }
  };

  return (
    <ThemeProvider theme={lightTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p,
        }}
      >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns ? '1fr' : '1fr 1fr',
            gap: 1,
            alignItems: 'center',
          }}
        >
          {/* 왼쪽 및 기능 소개 */}
          <Slide direction="right" in={animateIn} timeout={800}>
            <Box
              sx={{
                color: 'white',
                textAlign ? 'center' : 'left',
                mb ? 4 : 0,
              }}
            >
              <Grow in={animateIn} timeout={1000}>
                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontWeight,
                    mb,
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
                    mb,
                    opacity.9,
                    fontWeight,
                    lineHeight.6,
                  }}
                >
                  지금 시작하고 팀과 함께 성장하세요
                </Typography>
              </Fade>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {features.map((feature, index) => (
                  <Fade in={animateIn} timeout={1400 + index * 200} key={feature.text}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p,
                        borderRadius,
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                    >
                      <Box
                        sx={{
                          color.color,
                          backgroundColor: 'white',
                          borderRadius: '50%',
                          p,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight }}>
                        {feature.text}
                      </Typography>
                    </Box>
                  </Fade>
                ))}
              </Box>
            </Box>
          </Slide>

          {/* 오른쪽 폼 */}
          <Slide direction="left" in={animateIn} timeout={800}>
            <Paper
              elevation={24}
              sx={{
                p,
                borderRadius,
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.3)',
                maxWidth,
                mx: 'auto',
                width: '100%',
              }}
            >
              <Box sx={{ textAlign: 'center', mb }}>
                <Box
                  sx={{
                    width,
                    height,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb,
                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                  }}
                >
                  <PersonAddIcon sx={{ color: 'white', fontSize }} />
                </Box>
                <Typography variant="h4" component="h2" sx={{ fontWeight, mb }}>
                  회원가입
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  새로운 계정을 만들어 시작하세요
                </Typography>
              </Box>

              {error && (
                <Fade in={!!error}>
                  <Alert
                    severity="error"
                    icon={<ErrorIcon />}
                    sx={{
                      mb,
                      borderRadius,
                      '& .MuiAlert-message': { fontWeight },
                    }}
                  >
                    {error}
                  </Alert>
                </Fade>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                {/* 이름 입력 */}
                <TextField
                  fullWidth
                  required
                  id="name"
                  label="이름"
                  name="name"
                  autoComplete="name"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'email')}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  error={name.length > 0 && !nameValidation.isValid}
                  helperText={nameValidation.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon
                          sx={{
                            color ? 'primary.main' : 'text.secondary',
                            transition: 'color 0.3s ease',
                          }}
                        />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb,
                    '& .MuiOutlinedInput-root': {
                      borderRadius,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                      },
                      '&.Mui-focused': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderWidth,
                        },
                      },
                    },
                  }}
                />

                {/* 이메일 입력 */}
                <TextField
                  fullWidth
                  required
                  id="email"
                  label="이메일"
                  name="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'password')}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  error={email.length > 0 && !emailValidation.isValid}
                  helperText={emailValidation.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon
                          sx={{
                            color ? 'primary.main' : 'text.secondary',
                            transition: 'color 0.3s ease',
                          }}
                        />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb,
                    '& .MuiOutlinedInput-root': {
                      borderRadius,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                      },
                      '&.Mui-focused': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderWidth,
                        },
                      },
                    },
                  }}
                />

                {/* 비밀번호 입력 */}
                <TextField
                  fullWidth
                  required
                  name="password"
                  label="비밀번호"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'confirmPassword')}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  error={password.length > 0 && !passwordValidation.isValid}
                  helperText={passwordValidation.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon
                          sx={{
                            color ? 'primary.main' : 'text.secondary',
                            transition: 'color 0.3s ease',
                          }}
                        />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="비밀번호 표시/숨김"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb,
                    '& .MuiOutlinedInput-root': {
                      borderRadius,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                      },
                      '&.Mui-focused': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderWidth,
                        },
                      },
                    },
                  }}
                />

                {/* 비밀번호 강도 표시 */}
                {password.length > 0 && (
                  <Box sx={{ mb }}>
                    <PasswordStrengthMeter password={password} />
                  </Box>
                )}

                {/* 비밀번호 확인 입력 */}
                <TextField
                  fullWidth
                  required
                  name="confirmPassword"
                  label="비밀번호 확인"
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => setConfirmPasswordFocused(false)}
                  error={confirmPassword.length > 0 && !confirmPasswordValidation.isValid}
                  helperText={confirmPasswordValidation.message}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon
                          sx={{
                            color ? 'primary.main' : 'text.secondary',
                            transition: 'color 0.3s ease',
                          }}
                        />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="비밀번호 확인 표시/숨김"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb,
                    '& .MuiOutlinedInput-root': {
                      borderRadius,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                      },
                      '&.Mui-focused': {
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderWidth,
                        },
                      },
                    },
                  }}
                />

                {/* 회원가입 버튼 */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading || !isFormValid()}
                  startIcon={loading ? null : <PersonAddIcon />}
                  sx={{
                    py: 0.5,
                    borderRadius,
                    fontSize: '1.1rem',
                    fontWeight,
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
                  {loading ? '회원가입 중...' : '회원가입'}
                </Button>

                <Divider sx={{ my }}>
                  <Chip label="또는" size="small" />
                </Divider>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb }}>
                    이미 계정이 있으신가요?
                  </Typography>
                  <Button
                    component={Link}
                    href="/login"
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    sx={{
                      borderRadius,
                      textTransform: 'none',
                      fontWeight,
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      '&:hover': {
                        borderColor: 'primary.dark',
                        backgroundColor: 'primary.main',
                        color: 'white',
                      },
                    }}
                  >
                    로그인으로 돌아가기
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Slide>
        </Box>
      </Container>

      {/* 성공 스낵바 */}
      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSuccessSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowSuccessSnackbar(false)}
          severity="success"
          icon={<CheckCircleIcon />}
          sx={{ width: '100%' }}
        >
          회원가입이 완료되었습니다! 잠시 후 대시보드로 이동합니다.
        </Alert>
      </Snackbar>
    </Box>
    </ThemeProvider>
  );
};

export default RegisterPage; 