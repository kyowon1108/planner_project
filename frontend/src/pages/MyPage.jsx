import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Container,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  IconButton,
  InputAdornment,
  Fade,
  Grow,
  Slide,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Person,
  Lock,
  Delete,
  Visibility,
  VisibilityOff,
  Edit,
  Save,
  Cancel,
  Warning,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext.jsx';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter.jsx';
import Navbar from '../components/Navbar.jsx';
import { userAPI } from '../services/api';
import {
  validateEmail,
  validatePassword,
  validateName,
  validateConfirmPassword,
} from '../utils/validation';

const MyPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { darkMode } = useCustomTheme();
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  // 프로필 수정 상태
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [nameValidation, setNameValidation] = useState({ isValid: true, message: '' });
  const [emailValidation, setEmailValidation] = useState({ isValid: true, message: '' });

  // 비밀번호 변경 상태
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPasswordValidation, setNewPasswordValidation] = useState({ isValid: true, message: '' });
  const [confirmPasswordValidation, setConfirmPasswordValidation] = useState({ isValid: true, message: '' });

  // 회원탈퇴 상태
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  // 메시지 상태
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

  // 프로필 수정 유효성 검사
  useEffect(() => {
    if (name.length > 0) {
      setNameValidation(validateName(name));
    }
  }, [name]);

  useEffect(() => {
    if (email.length > 0) {
      setEmailValidation(validateEmail(email));
    }
  }, [email]);

  useEffect(() => {
    if (newPassword.length > 0) {
      setNewPasswordValidation(validatePassword(newPassword));
    }
  }, [newPassword]);

  useEffect(() => {
    if (confirmPassword.length > 0) {
      setConfirmPasswordValidation(validateConfirmPassword(newPassword, confirmPassword));
    }
  }, [confirmPassword, newPassword]);

  const handleProfileUpdate = async () => {
    if (!nameValidation.isValid || !emailValidation.isValid) {
      setMessage('입력 정보를 확인해주세요.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      await userAPI.updateProfile({ name, email });
      setMessage('프로필이 성공적으로 수정되었습니다.');
      setMessageType('success');
      setIsEditingProfile(false);
    } catch (error) {
      setMessage(error.response?.data?.detail || '프로필 수정에 실패했습니다.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPasswordValidation.isValid || !confirmPasswordValidation.isValid) {
      setMessage('새 비밀번호를 확인해주세요.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      await userAPI.changePassword({ current_password: currentPassword, new_password: newPassword });
      setMessage('비밀번호가 성공적으로 변경되었습니다.');
      setMessageType('success');
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setMessage(error.response?.data?.detail || '비밀번호 변경에 실패했습니다.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setMessage('비밀번호를 입력해주세요.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      await userAPI.deleteAccount({ password: deletePassword });
      setMessage('회원탈퇴가 완료되었습니다.');
      setMessageType('success');
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || '회원탈퇴에 실패했습니다.';
      setMessage(errorMessage);
      setMessageType('error');

      // 팀 탈퇴 조건 오류인 경우 특별 처리
      if (errorMessage.includes('모든 팀에서 탈퇴해야 합니다')) {
        setMessage('회원탈퇴를 위해서는 모든 팀에서 탈퇴해야 합니다. 팀 페이지에서 팀을 나간 후 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isProfileFormValid = () => {
    return nameValidation.isValid && emailValidation.isValid;
  };

  const isPasswordFormValid = () => {
    return currentPassword.length > 0 && newPasswordValidation.isValid && confirmPasswordValidation.isValid;
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Navbar />
      <Box
        sx={{
          minHeight: 'calc(100vh - 64px)', // Navbar 높이만큼 제외
          background: darkMode ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          py: 4,
        }}
      >
        <Container maxWidth="md">
          <Slide direction="up" in={true} timeout={800}>
            
              {/* 헤더 */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Grow in={true} timeout={1000}>
                  <Typography
                    variant="h3"
                    component="h1"
                    sx={{
                      fontWeight: 700,
                      mb: 2,
                      color: 'white',
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    }}
                  >
                    마이페이지
                  </Typography>
                </Grow>
                <Fade in={true} timeout={1200}>
                  <Typography variant="h6" sx={{ color: 'white', opacity: 0.9 }}>
                    프로필 관리 및 계정 설정
                  </Typography>
                </Fade>
              </Box>

              {/* 메시지 알림 */}
              {message && (
                <Fade in={!!message}>
                  <Alert
                    severity={messageType}
                    sx={{ mb: 3, borderRadius: 2 }}
                    onClose={() => setMessage('')}
                  >
                    {message}
                  </Alert>
                </Fade>
              )}

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
                {/* 프로필 정보 */}
                
                  <Slide direction="left" in={true} timeout={800}>
                    <Paper
                      elevation={24}
                      sx={{
                        p: 4,
                        borderRadius: 3,
                        background: darkMode ? 'rgba(45,45,45,0.95)' : 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(20px)',
                        border: darkMode ? '1px solid rgba(64,64,64,0.3)' : '1px solid rgba(255,255,255,0.3)',
                        height: 'fit-content',
                      }}
                    >
                      <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Avatar
                          sx={{
                            width: 80,
                            height: 80,
                            mx: 'auto',
                            mb: 2,
                            fontSize: '2rem',
                            background: darkMode ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          }}
                        >
                          {user?.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
                          프로필 정보
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 3 }}>
                        <TextField
                          fullWidth
                          label="이름"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={!isEditingProfile}
                          error={name.length > 0 && !nameValidation.isValid}
                          helperText={nameValidation.message}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Person />
                              </InputAdornment>
                            ),
                          }}
                          sx={{ mb: 3 }}
                        />
                        <TextField
                          fullWidth
                          label="이메일"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={!isEditingProfile}
                          error={email.length > 0 && !emailValidation.isValid}
                          helperText={emailValidation.message}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Person />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', gap: 2 }}>
                        {!isEditingProfile ? (
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<Edit />}
                            onClick={() => setIsEditingProfile(true)}
                            sx={{
                              background: darkMode ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            }}
                          >
                            프로필 수정
                          </Button>
                        ) : (
                          <>
                            <Button
                              fullWidth
                              variant="contained"
                              startIcon={<Save />}
                              onClick={handleProfileUpdate}
                              disabled={loading || !isProfileFormValid()}
                              sx={{
                                background: darkMode ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              }}
                            >
                              {loading ? '저장 중...' : '저장'}
                            </Button>
                            <Button
                              fullWidth
                              variant="outlined"
                              startIcon={<Cancel />}
                              onClick={() => {
                                setIsEditingProfile(false);
                                setName(user?.name || '');
                                setEmail(user?.email || '');
                              }}
                            >
                              취소
                            </Button>
                          </>
                        )}
                      </Box>
                    </Paper>
                  </Slide>
                </Box>

                {/* 비밀번호 변경 */}
                
                  <Slide direction="right" in={true} timeout={800}>
                    <Paper
                      elevation={24}
                      sx={{
                        p: 4,
                        borderRadius: 3,
                        background: darkMode ? 'rgba(45,45,45,0.95)' : 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(20px)',
                        border: darkMode ? '1px solid rgba(64,64,64,0.3)' : '1px solid rgba(255,255,255,0.3)',
                        height: 'fit-content',
                      }}
                    >
                      <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Lock sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                        <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
                          비밀번호 변경
                        </Typography>
                      </Box>

                      {!isChangingPassword ? (
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<Lock />}
                          onClick={() => setIsChangingPassword(true)}
                          sx={{
                            background: darkMode ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          }}
                        >
                          비밀번호 변경
                        </Button>
                      ) : (
                        
                          <TextField
                            fullWidth
                            label="현재 비밀번호"
                            type={showCurrentPassword ? 'text' : 'password'}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Lock />
                                </InputAdornment>
                              ),
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    edge="end"
                                  >
                                    {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                            sx={{ mb: 3 }}
                          />
                          <TextField
                            fullWidth
                            label="새 비밀번호"
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            error={newPassword.length > 0 && !newPasswordValidation.isValid}
                            helperText={newPasswordValidation.message}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Lock />
                                </InputAdornment>
                              ),
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    edge="end"
                                  >
                                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                            sx={{ mb: 3 }}
                          />
                          {newPassword.length > 0 && (
                            <PasswordStrengthMeter password={newPassword} />
                          )}
                          <TextField
                            fullWidth
                            label="새 비밀번호 확인"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            error={confirmPassword.length > 0 && !confirmPasswordValidation.isValid}
                            helperText={confirmPasswordValidation.message}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <Lock />
                                </InputAdornment>
                              ),
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    edge="end"
                                  >
                                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                            sx={{ mb: 3 }}
                          />
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Button
                              fullWidth
                              variant="contained"
                              onClick={handlePasswordChange}
                              disabled={loading || !isPasswordFormValid()}
                              sx={{
                                background: darkMode ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              }}
                            >
                              {loading ? '변경 중...' : '비밀번호 변경'}
                            </Button>
                            <Button
                              fullWidth
                              variant="outlined"
                              onClick={() => {
                                setIsChangingPassword(false);
                                setCurrentPassword('');
                                setNewPassword('');
                                setConfirmPassword('');
                              }}
                            >
                              취소
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </Paper>
                  </Slide>
                </Box>
              </Box>

              {/* 회원탈퇴 */}
              <Box sx={{ mt: 4 }}>
                <Slide direction="up" in={true} timeout={1000}>
                  <Paper
                    elevation={24}
                    sx={{
                      p: 4,
                      borderRadius: 3,
                      background: darkMode ? 'rgba(45,45,45,0.95)' : 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(20px)',
                      border: darkMode ? '1px solid rgba(64,64,64,0.3)' : '1px solid rgba(255,255,255,0.3)',
                    }}
                  >
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Warning sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                      <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 1, color: 'error.main' }}>
                        회원탈퇴
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다.
                      </Typography>
                      <Typography variant="body2" color="warning.main" sx={{ mt: 1, fontWeight: 600 }}>
                        ⚠️ 회원탈퇴를 위해서는 모든 팀에서 탈퇴해야 합니다.
                      </Typography>
                    </Box>

                    <Button
                      fullWidth
                      variant="outlined"
                      color="error"
                      startIcon={<Delete />}
                      onClick={() => setShowDeleteDialog(true)}
                      sx={{ borderColor: 'error.main', color: 'error.main' }}
                    >
                      회원탈퇴
                    </Button>
                  </Paper>
                </Slide>
              </Box>
            </Box>
          </Slide>

          {/* 회원탈퇴 확인 다이얼로그 */}
          <Dialog
            open={showDeleteDialog}
            onClose={() => setShowDeleteDialog(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle sx={{ color: 'error.main' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning color="error" />
                회원탈퇴 확인
              </Box>
            </DialogTitle>
            
              <Typography sx={{ mb: 3 }}>
                정말로 회원탈퇴를 하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </Typography>
              <TextField
                fullWidth
                label="비밀번호 확인"
                type={showDeletePassword ? 'text' : 'password'}
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowDeletePassword(!showDeletePassword)}
                        edge="end"
                      >
                        {showDeletePassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </DialogContent>
            
              <Button onClick={() => setShowDeleteDialog(false)}>
                취소
              </Button>
              <Button
                onClick={handleDeleteAccount}
                color="error"
                variant="contained"
                disabled={loading || !deletePassword}
              >
                {loading ? '처리 중...' : '회원탈퇴'}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </Box>
  );
};

export default MyPage;