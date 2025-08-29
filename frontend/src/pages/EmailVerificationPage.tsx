import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  Fade,
  Grow,
  Slide,
  useTheme as useMuiTheme,
  useMediaQuery,
  CircularProgress,
  InputAdornment,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import {
  Email as EmailIcon,
  Verified as VerifiedIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { emailVerificationAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';


const EmailVerificationPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [animateIn, setAnimateIn] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // 이메일 인증 페이지용 라이트 테마 생성
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
    // URL에서 이메일 파라미터 확인
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError('이메일을 입력해주세요.');
      return;
    }

    setSendingCode(true);
    setError('');
    setSuccess('');

    try {
      await emailVerificationAPI.sendVerificationCode(email);
      setCodeSent(true);
      setCountdown(60); // 60초 대기
      setSuccess('인증 코드가 이메일로 발송되었습니다.');
    } catch (err: any) {
      setError(err.response?.data?.detail || '인증 코드 발송에 실패했습니다.');
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError('인증 코드를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await emailVerificationAPI.verifyCode(email, verificationCode);
      setSuccess('이메일 인증이 완료되었습니다!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || '인증 코드가 올바르지 않습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setSendingCode(true);
    setError('');
    setSuccess('');

    try {
      await emailVerificationAPI.resendVerificationCode(email);
      setCountdown(60);
      setSuccess('인증 코드가 재발송되었습니다.');
    } catch (err: any) {
      setError(err.response?.data?.detail || '인증 코드 재발송에 실패했습니다.');
    } finally {
      setSendingCode(false);
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
          p: 2,
        }}
      >
      <Container maxWidth="sm">
        <Slide direction="up" in={animateIn} timeout={800}>
          <Paper
            elevation={24}
            sx={{
              p: 4,
              borderRadius: 3,
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.3)',
              width: '100%',
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Grow in={animateIn} timeout={1000}>
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
                  <EmailIcon sx={{ color: 'white', fontSize: 40 }} />
                </Box>
              </Grow>
              
              <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
                이메일 인증
              </Typography>
              <Typography variant="body1" color="text.secondary">
                계정 보안을 위해 이메일 인증을 완료해주세요
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

            {success && (
              <Fade in={!!success}>
                <Alert
                  severity="success"
                  icon={<CheckCircleIcon />}
                  sx={{
                    mb: 3,
                    borderRadius: 2,
                    '& .MuiAlert-message': { fontWeight: 500 },
                  }}
                >
                  {success}
                </Alert>
              </Fade>
            )}

            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={codeSent}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>

            {!codeSent ? (
              <Button
                fullWidth
                variant="contained"
                onClick={handleSendCode}
                disabled={sendingCode}
                startIcon={sendingCode ? <CircularProgress size={20} /> : <SendIcon />}
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
                }}
              >
                {sendingCode ? '발송 중...' : '인증 코드 발송'}
              </Button>
            ) : (
              <>
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="인증 코드 (6자리)"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="000000"
                    inputProps={{
                      maxLength: 6,
                      style: { textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.5em' }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleVerifyCode}
                  disabled={loading || verificationCode.length !== 6}
                  startIcon={loading ? <CircularProgress size={20} /> : <VerifiedIcon />}
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
                  {loading ? '인증 중...' : '인증 완료'}
                </Button>

                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Button
                    variant="text"
                    onClick={handleResendCode}
                    disabled={countdown > 0 || sendingCode}
                    startIcon={sendingCode ? <CircularProgress size={16} /> : <RefreshIcon />}
                    sx={{
                      textTransform: 'none',
                      color: 'primary.main',
                      '&:disabled': {
                        color: 'text.disabled',
                      },
                    }}
                  >
                    {countdown > 0 
                      ? `${countdown}초 후 재발송 가능` 
                      : sendingCode 
                        ? '재발송 중...' 
                        : '인증 코드 재발송'
                    }
                  </Button>
                </Box>
              </>
            )}

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button
                variant="text"
                onClick={() => navigate('/login')}
                sx={{
                  textTransform: 'none',
                  color: 'text.secondary',
                }}
              >
                로그인으로 돌아가기
              </Button>
            </Box>
          </Paper>
        </Slide>
      </Container>
    </Box>
    </ThemeProvider>
  );
};

export default EmailVerificationPage; 