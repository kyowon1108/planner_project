import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Avatar,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { authAPI, inviteAPI, teamAPI } from '../services/api';
import { User } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface InviteMemberDialogProps {
  open: boolean;
  onClose: () => void;
  teamId: number;
  teamName: string;
  onInviteSent: () => void;
  userRole?: string | null;
}

const InviteMemberDialog: React.FC<InviteMemberDialogProps> = ({
  open,
  onClose,
  teamId,
  teamName,
  onInviteSent,
  userRole
}) => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('editor'); // 기본값을 editor로 변경
  const [searchedUser, setSearchedUser] = useState<User | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [isLoadingInvites, setIsLoadingInvites] = useState(false);

  // 팀 멤버 목록과 대기 중인 초대 로드
  useEffect(() => {
    const loadTeamData = async () => {
      if (!open) return;
      
      setIsLoadingMembers(true);
      setIsLoadingInvites(true);
      try {
        const [members, invites] = await Promise.all([
          teamAPI.getTeamMembers(teamId),
          inviteAPI.getTeamInvites(teamId)
        ]);
        setTeamMembers(members);
        setPendingInvites(invites.filter((invite: any) => !invite.is_used));
      } catch (err) {
        console.error('팀 데이터 로드 실패:', err);
      } finally {
        setIsLoadingMembers(false);
        setIsLoadingInvites(false);
      }
    };

    loadTeamData();
  }, [open, teamId]);

  // 이메일 입력 시 사용자 검색
  useEffect(() => {
    const searchUser = async () => {
      if (!email.trim() || !email.includes('@')) {
        setSearchedUser(null);
        setError(null);
        return;
      }

      setIsSearching(true);
      setError(null);
      
      try {
        const searchedUserData = await authAPI.searchUserByEmail(email.trim());
        setSearchedUser(searchedUserData);
        
        // 자기 자신 초대 방지
        if (searchedUserData.id === user?.id) {
          setError('자기 자신을 초대할 수 없습니다.');
          setSearchedUser(null);
          return;
        }
        
        // 이미 팀 멤버인지 확인
        const isAlreadyMember = teamMembers.some(member => member.user_id === searchedUserData.id);
        if (isAlreadyMember) {
          setError('이미 팀 멤버입니다.');
          setSearchedUser(null);
          return;
        }

        // 이미 초대를 보낸 사용자인지 확인
        const hasPendingInvite = pendingInvites.some(invite => invite.email === searchedUserData.email);
        if (hasPendingInvite) {
          setError('이미 초대를 보낸 사용자입니다.');
          setSearchedUser(null);
          return;
        }
        
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('해당 이메일의 사용자를 찾을 수 없습니다.');
          setSearchedUser(null);
        } else {
          setError('사용자 검색 중 오류가 발생했습니다.');
          setSearchedUser(null);
        }
      } finally {
        setIsSearching(false);
      }
    };

    // 디바운스 적용
    const timeoutId = setTimeout(searchUser, 500);
    return () => clearTimeout(timeoutId);
  }, [email, teamMembers, pendingInvites, user?.id]);

  const handleSendInvite = async () => {
    if (!email.trim() || !searchedUser) {
      setError('유효한 사용자 이메일을 입력해주세요.');
      return;
    }

    // 추가 검증
    if (searchedUser.id === user?.id) {
      setError('자기 자신을 초대할 수 없습니다.');
      return;
    }

    const isAlreadyMember = teamMembers.some(member => member.user_id === searchedUser.id);
    if (isAlreadyMember) {
      setError('이미 팀 멤버입니다.');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      // inviteAPI 사용
      await inviteAPI.createInvite({
        team_id: teamId,
        email: email.trim(),
        role: role
      });

      setEmail('');
      setSearchedUser(null);
      setRole('editor');
      
      // 즉시 다이얼로그 닫기
      onClose();
      onInviteSent();

    } catch (err: any) {
      if (err.response?.status === 400) {
        setError(err.response.data?.detail || '이미 팀 멤버이거나 초대가 불가능합니다.');
      } else {
        setError(err.message || '초대 발송에 실패했습니다.');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setSearchedUser(null);
    setRole('editor');
    setError(null);
    onClose();
  };

  // 역할 옵션 생성
  const getRoleOptions = () => {
    const options = [
      { value: 'editor', label: '편집자', description: '콘텐츠 생성과 수정 권한' },
      { value: 'viewer', label: '조회자', description: '읽기 전용 권한' },
      { value: 'guest', label: '게스트', description: '제한적인 읽기 권한' }
    ];

    // OWNER/ADMIN만 더 높은 권한 부여 가능
    if (userRole === 'owner' || userRole === 'admin') {
      options.unshift(
        { value: 'manager', label: '매니저', description: '팀 관리와 콘텐츠 관리 권한' }
      );
    }

    if (userRole === 'owner') {
      options.unshift(
        { value: 'admin', label: '관리자', description: '거의 모든 권한' }
      );
    }

    return options;
  };

  return (
    <>
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth 
        disableEscapeKeyDown={isSending}
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: darkMode 
              ? 'rgba(30,30,30,0.98)' 
              : 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(20px)',
            border: darkMode 
              ? '1px solid rgba(255,255,255,0.1)' 
              : '1px solid rgba(0,0,0,0.1)',
          }
        }}
      >
        <DialogTitle sx={{ 
          color: darkMode ? '#ffffff' : '#2c3e50',
          borderBottom: darkMode 
            ? '1px solid rgba(255,255,255,0.1)' 
            : '1px solid rgba(0,0,0,0.1)',
        }}>
          <Typography variant="h6" component="div">
            팀원 초대하기
          </Typography>
          <Typography variant="body2" color={darkMode ? 'text.primary' : 'text.secondary'}>
            {teamName} 팀에 새로운 멤버를 초대합니다
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* 이메일 입력 */}
            <TextField
              label="초대할 사용자의 이메일"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              fullWidth
              required
              disabled={isSending}
              error={!!error && !searchedUser}
              helperText={error && !searchedUser ? error : ''}
            />

            {/* 사용자 검색 중 */}
            {isSearching && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">
                  사용자 검색 중...
                </Typography>
              </Box>
            )}

            {/* 검색된 사용자 프로필 */}
            {searchedUser && !isSearching && (
              <Box
                sx={{
                  p: 2,
                  border: '1px solid #e0e0e0',
                  borderRadius: 2,
                  bgcolor: '#f8f9fa'
                }}
              >
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  초대할 사용자
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <PersonIcon />
                  </Avatar>
                  
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight="medium">
                      {searchedUser.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchedUser.email}
                    </Typography>
                  </Box>
                  
                  <Chip 
                    label="확인됨" 
                    color="success" 
                    size="small" 
                    variant="outlined"
                  />
                </Box>
              </Box>
            )}

            {/* 역할 선택 */}
            <FormControl fullWidth disabled={isSending}>
              <InputLabel>팀에서의 역할</InputLabel>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                label="팀에서의 역할"
              >
                {getRoleOptions().map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box>
                      <Typography variant="body2">{option.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* 역할 설명 */}
            <Box sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>역할별 권한:</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                • <strong>관리자:</strong> 거의 모든 권한을 가집니다
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                • <strong>매니저:</strong> 팀 관리와 콘텐츠 관리 권한을 가집니다
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                • <strong>편집자:</strong> 콘텐츠 생성과 수정 권한을 가집니다
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                • <strong>조회자:</strong> 읽기 전용 권한을 가집니다
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                • <strong>게스트:</strong> 제한적인 읽기 권한을 가집니다
              </Typography>
            </Box>

            {/* 경고 메시지 */}
            {searchedUser && searchedUser.id === user?.id && (
              <Alert severity="warning">
                자기 자신을 초대할 수 없습니다.
              </Alert>
            )}

            {searchedUser && teamMembers.some(member => member.user_id === searchedUser.id) && (
              <Alert severity="warning">
                이미 팀 멤버입니다.
              </Alert>
            )}

            {searchedUser && pendingInvites.some(invite => invite.email === searchedUser.email) && (
              <Alert severity="warning">
                이미 초대를 보낸 사용자입니다.
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button 
            onClick={handleClose} 
            color="inherit"
          >
            {isSending ? '닫기' : '취소'}
          </Button>
          <Button
            onClick={handleSendInvite}
            variant="contained"
            disabled={!searchedUser || isSending || searchedUser?.id === user?.id || teamMembers.some(member => member.user_id === searchedUser?.id) || pendingInvites.some(invite => invite.email === searchedUser?.email)}
            startIcon={isSending ? <CircularProgress size={16} /> : null}
          >
            {isSending ? '발송 중...' : '초대 발송'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InviteMemberDialog; 