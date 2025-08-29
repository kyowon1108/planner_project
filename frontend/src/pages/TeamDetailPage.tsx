import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton,
  Alert,
  Snackbar,
  Menu,
  MenuItem,
  FormControl,
  Select,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputLabel,
  Paper,
  Fade,
  Grow,
  Slide,
  useTheme as useMuiTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Edit as EditIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  FilterList as FilterListIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  AdminPanelSettings as AdminIcon,
  TransferWithinAStation as TransferIcon,
  ExitToApp as ExitIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { teamAPI, inviteAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Team, Invite } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import Navbar from '../components/Navbar';
import InviteMemberDialog from '../components/InviteMemberDialog';

const TeamDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteMemberDialogOpen, setInviteMemberDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [inviteSuccessMessage, setInviteSuccessMessage] = useState<string | null>(null);
  const [roleChangeAnchorEl, setRoleChangeAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMemberForRoleChange, setSelectedMemberForRoleChange] = useState<number | null>(null);
  const [transferOwnershipDialogOpen, setTransferOwnershipDialogOpen] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState<number | null>(null);
  const [animateIn, setAnimateIn] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [showInvites, setShowInvites] = useState(false);
  
  // 멤버 검색, 필터링, 정렬 상태
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState<string>('all');
  const [memberSortBy, setMemberSortBy] = useState<string>('name');
  const [memberSortOrder, setMemberSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const { darkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  useEffect(() => {
    setAnimateIn(true);
  }, []);

  const fetchTeam = useCallback(async () => {
    if (!id) return;
    
    try {
      const [teamData, membersData, invitesData] = await Promise.all([
        teamAPI.getTeam(parseInt(id)),
        teamAPI.getTeamMembers(parseInt(id)),
        inviteAPI.getTeamInvites(parseInt(id))
      ]);
      
      // Current user member info loaded
      const currentUserMember = membersData.find((member: any) => member.user_id === user?.id);
      setUserRole(currentUserMember?.role || null);
      
      // 권한에 따른 기능 활성화
      if (currentUserMember && (currentUserMember.role === 'owner' || currentUserMember.role === 'admin')) {
        // 초대 관리 권한이 있는 경우
      }
      
      const teamWithMembers = {
        ...teamData,
        members: membersData
      };
      
      setTeam(teamWithMembers);
      setPendingInvites(invitesData.filter((invite: any) => !invite.is_used));
      setLoading(false);
    } catch (err) {
      console.error('Error fetching team:', err);
      setError('팀 정보를 불러오는데 실패했습니다.');
      setLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  const handleRemoveMember = async (userId: number) => {
    if (!window.confirm('정말로 이 멤버를 팀에서 제거하시겠습니까?')) return;
    
    try {
      await teamAPI.removeTeamMember(parseInt(id!), userId);
      fetchTeam();
    } catch (err) {
      console.error('Error removing member:', err);
    }
  };

  const handleInviteSent = () => {
    setInviteMemberDialogOpen(false);
    setInviteSuccessMessage('초대가 성공적으로 전송되었습니다!');
    fetchTeam();
  };

  const handleRoleChangeClick = (event: React.MouseEvent<HTMLElement>, memberId: number) => {
    setRoleChangeAnchorEl(event.currentTarget);
    setSelectedMemberForRoleChange(memberId);
  };

  // 현재 선택된 멤버의 역할 가져오기
  const getSelectedMemberRole = () => {
    if (!selectedMemberForRoleChange || !team?.members) return null;
    const member = team.members.find(m => m.user_id === selectedMemberForRoleChange);
    return member?.role || null;
  };

  const handleRoleChangeClose = () => {
    setRoleChangeAnchorEl(null);
    setSelectedMemberForRoleChange(null);
  };

  const handleRoleChange = async (newRole: string) => {
    if (!selectedMemberForRoleChange) return;
    
    try {
      await teamAPI.updateTeamMemberRole(parseInt(id!), selectedMemberForRoleChange, { role: newRole });
      
      // 성공 메시지 표시
      setInviteSuccessMessage(`멤버의 역할이 ${newRole}로 변경되었습니다.`);
      
      // 팀 데이터 새로고침
      fetchTeam();
      
      setRoleChangeAnchorEl(null);
      setSelectedMemberForRoleChange(null);
    } catch (err: any) {
      console.error('Error updating member role:', err);
      setError(err.response?.data?.detail || '역할 변경에 실패했습니다.');
    }
  };

  const handleLeaveTeam = async () => {
    if (!window.confirm('정말로 이 팀을 나가시겠습니까?')) return;
    
    try {
      await teamAPI.leaveTeam(parseInt(id!));
      navigate('/teams');
    } catch (err) {
      console.error('Error leaving team:', err);
    }
  };

  const handleTransferOwnership = async () => {
    if (!selectedNewOwner) return;
    
    try {
      await teamAPI.transferOwnership(parseInt(id!), selectedNewOwner);
      setTransferOwnershipDialogOpen(false);
      setSelectedNewOwner(null);
      fetchTeam();
    } catch (err) {
      console.error('Error transferring ownership:', err);
    }
  };

  const handleDeleteTeam = async () => {
    if (!window.confirm('정말로 이 팀을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    
    try {
      await teamAPI.deleteTeam(parseInt(id!));
      navigate('/teams');
    } catch (err) {
      console.error('Error deleting team:', err);
    }
  };

  const getFilteredAndSortedMembers = () => {
    if (!team?.members) return [];
    
    let filtered = team.members;
    
    // 검색 필터링
    if (memberSearchTerm) {
      filtered = filtered.filter(member => 
        member.user_name?.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
        member.user_email?.toLowerCase().includes(memberSearchTerm.toLowerCase())
      );
    }
    
    // 역할 필터링
    if (memberRoleFilter !== 'all') {
      filtered = filtered.filter(member => member.role === memberRoleFilter);
    }
    
    // 정렬
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (memberSortBy) {
        case 'name':
          comparison = (a.user_name || '').localeCompare(b.user_name || '');
          break;
        case 'role':
          comparison = a.role.localeCompare(b.role);
          break;
        case 'joined_at':
          comparison = new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime();
          break;
        default:
          comparison = 0;
      }
      
      return memberSortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  };

  const getMemberCounts = () => {
    if (!team?.members) return { total: 0, owner: 0, admin: 0, manager: 0, editor: 0, viewer: 0, member: 0, guest: 0 };
    
    return {
      total: team.members.length,
      owner: team.members.filter(m => m.role === 'owner').length,
      admin: team.members.filter(m => m.role === 'admin').length,
      manager: team.members.filter(m => m.role === 'manager').length,
      editor: team.members.filter(m => m.role === 'editor').length,
      viewer: team.members.filter(m => m.role === 'viewer').length,
              member: team.members.filter(m => m.role === 'editor').length,
      guest: team.members.filter(m => m.role === 'guest').length,
    };
  };

  // 역할 우선순위 정의
  const getRolePriority = (role: string): number => {
    const priorities = {
      'owner': 6,
      'admin': 5,
      'manager': 4,
      'editor': 3,
      'viewer': 2,
      'guest': 1
    };
    return priorities[role as keyof typeof priorities] || 0;
  };

  // 현재 사용자가 변경할 수 있는 역할인지 확인
  const canChangeRole = (targetMemberRole: string): boolean => {
    if (!userRole) return false;
    
    const currentUserPriority = getRolePriority(userRole);
    const targetPriority = getRolePriority(targetMemberRole);
    
    // 자신보다 낮은 역할만 변경 가능
    return targetPriority < currentUserPriority;
  };

  // 역할 변경 메뉴 아이템 생성
  const getRoleChangeOptions = (currentRole: string) => {
    const options = [
      { value: 'guest', label: '게스트' },
      { value: 'viewer', label: '조회자' },
      { value: 'editor', label: '편집자' },
      { value: 'manager', label: '매니저' },
      { value: 'admin', label: '관리자' }
    ];

    // 현재 사용자의 권한에 따라 필터링
    const currentUserPriority = getRolePriority(userRole || '');
    return options.filter(option => {
      const optionPriority = getRolePriority(option.value);
      return optionPriority < currentUserPriority && option.value !== currentRole;
    });
  };

  if (loading) return <LoadingSpinner message="팀 정보를 불러오는 중..." />;
  if (error) return <ErrorDisplay message={error} onRetry={fetchTeam} />;
  if (!team) return <ErrorDisplay message="팀을 찾을 수 없습니다." onRetry={() => navigate('/teams')} />;

  const memberCounts = getMemberCounts();
  const filteredMembers = getFilteredAndSortedMembers();

  return (
    <>
      <Navbar />
      <Box
        sx={{
          minHeight: '100vh',
          background: darkMode ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          pt: 2,
          pb: 4,
        }}
      >
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Slide direction="down" in={animateIn} timeout={600}>
            <Box display="flex" alignItems="center" mb={4}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/teams')}
                sx={{ 
                  mr: 2,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }
                }}
              >
                목록으로
              </Button>
              <Typography 
                variant="h4" 
                component="h1"
                sx={{
                  fontWeight: 700,
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                {team.name}
              </Typography>
            </Box>
          </Slide>

          <Slide direction="up" in={animateIn} timeout={800}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
              {/* 팀 정보 */}
              <Fade in={animateIn} timeout={1000}>
                <Paper
                  elevation={8}
                  sx={{
                    borderRadius: 3,
                    background: darkMode ? 'rgba(45,45,45,0.95)' : 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(20px)',
                    border: darkMode ? '1px solid rgba(64,64,64,0.3)' : '1px solid rgba(255,255,255,0.3)',
                    overflow: 'hidden',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                      <Box display="flex" alignItems="center">
                        <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography 
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: darkMode ? '#ffffff' : '#2c3e50',
                          }}
                        >
                          팀 정보
                        </Typography>
                      </Box>
                      {(userRole === 'owner' || userRole === 'admin') && (
                        <>
                          <Button
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => navigate(`/teams/${id}/edit`)}
                            sx={{
                              borderRadius: 2,
                              background: 'linear-gradient(45deg, #2196F3 30%, #42A5F5 90%)',
                              boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)',
                              '&:hover': {
                                background: 'linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)',
                              }
                            }}
                          >
                            수정
                          </Button>
                        </>
                      )}
                    </Box>
                    
                    <Typography 
                      variant="body1" 
                      mb={3}
                      sx={{
                        p: 2,
                        backgroundColor: 'rgba(0,0,0,0.02)',
                        borderRadius: 2,
                        border: '1px solid rgba(0,0,0,0.05)',
                        lineHeight: 1.6,
                      }}
                    >
                      {team.description}
                    </Typography>
                    
                    <Box display="flex" gap={1} mb={3} flexWrap="wrap">
                      <Chip 
                        icon={<PersonIcon />}
                        label={`멤버 ${team.members?.length || 0}명`} 
                        color="primary" 
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                      {(userRole === 'owner' || userRole === 'admin') && (
                        <Chip 
                          icon={<AddIcon />}
                          label={`초대 ${pendingInvites.length}명`} 
                          color="secondary" 
                          variant="outlined"
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                    </Box>
                    
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.5,
                        fontWeight: 500,
                      }}
                    >
                      <CalendarIcon sx={{ fontSize: 14 }} />
                      생성일: {new Date(team.created_at).toLocaleDateString()}
                    </Typography>
                    
                    {/* 팀 관리 버튼들 */}
                    <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {/* 소유자만 권한 이전 가능 */}
                      {userRole === 'owner' && team.members && team.members.filter(m => m.role !== 'owner').length > 0 && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<TransferIcon />}
                          onClick={() => setTransferOwnershipDialogOpen(true)}
                          color="warning"
                          sx={{
                            fontWeight: 600,
                            textTransform: 'none',
                            borderRadius: 2,
                          }}
                        >
                          소유자 권한 이전
                        </Button>
                      )}
                      
                      {/* 소유자만 팀 삭제 가능 (마지막 멤버일 때만) */}
                      {userRole === 'owner' && team.members && team.members.length === 1 && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={handleDeleteTeam}
                          color="error"
                          sx={{
                            fontWeight: 600,
                            textTransform: 'none',
                            borderRadius: 2,
                          }}
                        >
                          팀 삭제
                        </Button>
                      )}
                      
                      {/* 소유자가 아닌 경우에만 팀 나가기 가능 */}
                      {userRole && userRole !== 'owner' && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<ExitIcon />}
                          onClick={handleLeaveTeam}
                          color="error"
                          sx={{
                            fontWeight: 600,
                            textTransform: 'none',
                            borderRadius: 2,
                          }}
                        >
                          팀 나가기
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                </Paper>
              </Fade>

              {/* 멤버 목록 */}
              <Fade in={animateIn} timeout={1200}>
                <Paper
                  elevation={8}
                  sx={{
                    borderRadius: 3,
                    background: darkMode ? 'rgba(45,45,45,0.95)' : 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(20px)',
                    border: darkMode ? '1px solid rgba(64,64,64,0.3)' : '1px solid rgba(255,255,255,0.3)',
                    overflow: 'hidden',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* 헤더 */}
                    <Box sx={{ mb: 3 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Typography 
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            color: darkMode ? '#ffffff' : '#2c3e50',
                          }}
                        >
                          팀 멤버
                        </Typography>
                        
                        {/* 멤버 초대 버튼 */}
                        {(userRole === 'owner' || userRole === 'admin') && (
                          <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setInviteMemberDialogOpen(true)}
                            size="small"
                            sx={{
                              background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                              boxShadow: '0 4px 16px rgba(76, 175, 80, 0.3)',
                              borderRadius: 2,
                              fontWeight: 600,
                              textTransform: 'none',
                              '&:hover': {
                                transform: 'translateY(-1px)',
                                boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
                              },
                            }}
                          >
                            멤버 초대
                          </Button>
                        )}
                      </Box>
                      
                      {/* 역할별 통계 */}
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 1, 
                        flexWrap: 'wrap',
                        mb: 2,
                        p: 2,
                        backgroundColor: 'rgba(0,0,0,0.02)',
                        borderRadius: 2,
                        border: '1px solid rgba(0,0,0,0.05)'
                      }}>
                        <Chip 
                          label={`총 ${memberCounts.total}명`} 
                          size="small" 
                          color="primary"
                          sx={{ fontWeight: 600 }}
                        />
                        {memberCounts.owner > 0 && (
                          <Chip 
                            label={`소유자 ${memberCounts.owner}명`} 
                            size="small" 
                            color="warning"
                            sx={{ fontWeight: 600 }}
                          />
                        )}
                        {memberCounts.admin > 0 && (
                          <Chip 
                            label={`관리자 ${memberCounts.admin}명`} 
                            size="small" 
                            color="info"
                            sx={{ fontWeight: 600 }}
                          />
                        )}
                        {memberCounts.manager > 0 && (
                          <Chip 
                            label={`매니저 ${memberCounts.manager}명`} 
                            size="small" 
                            color="success"
                            sx={{ fontWeight: 600 }}
                          />
                        )}
                        {memberCounts.editor > 0 && (
                          <Chip 
                            label={`편집자 ${memberCounts.editor}명`} 
                            size="small" 
                            color="primary"
                            sx={{ fontWeight: 600 }}
                          />
                        )}
                        {memberCounts.viewer > 0 && (
                          <Chip 
                            label={`조회자 ${memberCounts.viewer}명`} 
                            size="small" 
                            color="secondary"
                            sx={{ fontWeight: 600 }}
                          />
                        )}
                        {memberCounts.member > 0 && (
                          <Chip 
                            label={`멤버 ${memberCounts.member}명`} 
                            size="small" 
                            color="default"
                            sx={{ fontWeight: 600 }}
                          />
                        )}
                        {memberCounts.guest > 0 && (
                          <Chip 
                            label={`게스트 ${memberCounts.guest}명`} 
                            size="small" 
                            color="default"
                            sx={{ fontWeight: 600 }}
                          />
                        )}
                      </Box>
                    </Box>

                    {/* 검색 및 필터 */}
                    <Box sx={{ 
                      mb: 3,
                      p: 2,
                      backgroundColor: 'rgba(0,0,0,0.02)',
                      borderRadius: 2,
                      border: '1px solid rgba(0,0,0,0.05)'
                    }}>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: darkMode ? '#ffffff' : '#2c3e50' }}>
                        멤버 검색 및 필터
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                        <TextField
                          placeholder="멤버 검색..."
                          value={memberSearchTerm}
                          onChange={(e) => setMemberSearchTerm(e.target.value)}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchIcon />
                              </InputAdornment>
                            ),
                          }}
                          size="small"
                          sx={{
                            minWidth: 200,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            }
                          }}
                        />
                        
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <InputLabel>역할 필터</InputLabel>
                          <Select
                            value={memberRoleFilter}
                            onChange={(e) => setMemberRoleFilter(e.target.value)}
                            label="역할 필터"
                            sx={{ borderRadius: 2 }}
                          >
                            <MenuItem value="all">전체 역할</MenuItem>
                            <MenuItem value="owner">소유자</MenuItem>
                            <MenuItem value="admin">관리자</MenuItem>
                            <MenuItem value="manager">매니저</MenuItem>
                            <MenuItem value="editor">편집자</MenuItem>
                            <MenuItem value="viewer">조회자</MenuItem>
                            <MenuItem value="guest">게스트</MenuItem>
                          </Select>
                        </FormControl>
                        
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <InputLabel>정렬 기준</InputLabel>
                          <Select
                            value={memberSortBy}
                            onChange={(e) => setMemberSortBy(e.target.value)}
                            label="정렬 기준"
                            sx={{ borderRadius: 2 }}
                          >
                            <MenuItem value="name">이름순</MenuItem>
                            <MenuItem value="role">역할순</MenuItem>
                            <MenuItem value="joined_at">가입일순</MenuItem>
                          </Select>
                        </FormControl>
                        
                        <ToggleButtonGroup
                          value={memberSortOrder}
                          exclusive
                          onChange={(e, value) => value && setMemberSortOrder(value)}
                          size="small"
                          sx={{ borderRadius: 2 }}
                        >
                          <ToggleButton value="asc" sx={{ borderRadius: 1 }}>
                            <ArrowUpwardIcon />
                          </ToggleButton>
                          <ToggleButton value="desc" sx={{ borderRadius: 1 }}>
                            <ArrowDownwardIcon />
                          </ToggleButton>
                        </ToggleButtonGroup>
                      </Box>
                    </Box>

                    {/* 멤버 목록 */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: darkMode ? '#ffffff' : '#2c3e50' }}>
                        멤버 목록 ({filteredMembers.length}명)
                      </Typography>
                    </Box>
                    <List sx={{ p: 0 }}>
                      {filteredMembers.length === 0 ? (
                        <Box sx={{ 
                          textAlign: 'center', 
                          py: 4,
                          backgroundColor: 'rgba(0,0,0,0.02)',
                          borderRadius: 2,
                          border: '1px solid rgba(0,0,0,0.05)'
                        }}>
                          <Typography variant="body2" color="text.secondary">
                            {memberSearchTerm || memberRoleFilter !== 'all' 
                              ? '검색 조건에 맞는 멤버가 없습니다.' 
                              : '아직 팀에 멤버가 없습니다.'}
                          </Typography>
                        </Box>
                      ) : (
                        filteredMembers.map((member, index) => (
                          <Fade in={animateIn} timeout={1400 + index * 100} key={member.id}>
                            <Box>
                              <ListItem
                                sx={{
                                  p: 2,
                                  mb: 1,
                                  borderRadius: 2,
                                  backgroundColor: 'rgba(0,0,0,0.02)',
                                  border: '1px solid rgba(0,0,0,0.05)',
                                  '&:hover': {
                                    backgroundColor: 'rgba(0,0,0,0.04)',
                                  },
                                }}
                              >
                                <ListItemAvatar>
                                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                                    {member.user_name?.charAt(0) || 'U'}
                                  </Avatar>
                                </ListItemAvatar>
                                
                                <ListItemText
                                  primary={
                                    <Box display="flex" alignItems="center" gap={1}>
                                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                        {member.user_name}
                                      </Typography>
                                      <Chip 
                                        label={member.role} 
                                        size="small"
                                        color={
                                          member.role === 'owner' ? 'warning' :
                                          member.role === 'admin' ? 'info' :
                                          member.role === 'manager' ? 'success' :
                                          member.role === 'editor' ? 'primary' :
                                          member.role === 'viewer' ? 'secondary' : 'default'
                                        }
                                        sx={{ fontWeight: 600 }}
                                      />
                                    </Box>
                                  }
                                  secondary={
                                    <Box>
                                      <Typography variant="body2" color="text.secondary">
                                        {member.user_email}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        가입일: {new Date(member.joined_at).toLocaleDateString()}
                                      </Typography>
                                    </Box>
                                  }
                                />
                                
                                {/* 관리 버튼들 */}
                                {canChangeRole(member.role) && (
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <IconButton
                                      size="small"
                                      onClick={(e) => handleRoleChangeClick(e, member.user_id)}
                                      sx={{ color: 'primary.main' }}
                                      title="역할 변경"
                                    >
                                      <EditIcon />
                                    </IconButton>
                                    
                                    {userRole === 'owner' && member.role !== 'owner' && (
                                      <IconButton
                                        size="small"
                                        onClick={() => handleRemoveMember(member.user_id)}
                                        sx={{ color: 'error.main' }}
                                        title="멤버 제거"
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    )}
                                  </Box>
                                )}
                              </ListItem>
                              {index < filteredMembers.length - 1 && <Divider />}
                            </Box>
                          </Fade>
                        ))
                      )}
                    </List>
                  </CardContent>
                </Paper>
              </Fade>
            </Box>
          </Slide>
        </Container>
      </Box>

      {/* 초대 성공 메시지 */}
      <Snackbar
        open={!!inviteSuccessMessage}
        autoHideDuration={4000}
        onClose={() => setInviteSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setInviteSuccessMessage(null)} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {inviteSuccessMessage}
        </Alert>
      </Snackbar>

      {/* 역할 변경 메뉴 */}
      <Menu
        anchorEl={roleChangeAnchorEl}
        open={Boolean(roleChangeAnchorEl)}
        onClose={handleRoleChangeClose}
      >
        {getRoleChangeOptions(getSelectedMemberRole() || '').map(option => (
          <MenuItem 
            key={option.value} 
            onClick={() => handleRoleChange(option.value)}
            disabled={!canChangeRole(option.value)}
          >
            {option.label}
          </MenuItem>
        ))}
        {getSelectedMemberRole() === 'owner' && (
          <MenuItem disabled>
            소유자는 역할을 변경할 수 없습니다
          </MenuItem>
        )}
      </Menu>

      {/* 소유자 권한 이전 다이얼로그 */}
      <Dialog 
        open={transferOwnershipDialogOpen} 
        onClose={() => setTransferOwnershipDialogOpen(false)}
        maxWidth="sm"
        fullWidth
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
          fontWeight: 600, 
          color: darkMode ? '#ffffff' : '#2c3e50',
          borderBottom: darkMode 
            ? '1px solid rgba(255,255,255,0.1)' 
            : '1px solid rgba(0,0,0,0.1)',
        }}>
          소유자 권한 이전
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography 
            variant="body2" 
            color={darkMode ? 'text.primary' : 'text.secondary'} 
            mb={3}
          >
            새로운 소유자를 선택하세요. 이 작업은 되돌릴 수 없습니다.
          </Typography>
          <FormControl fullWidth>
            <InputLabel sx={{ color: darkMode ? 'text.primary' : 'text.secondary' }}>
              새 소유자
            </InputLabel>
            <Select
              value={selectedNewOwner || ''}
              onChange={(e) => setSelectedNewOwner(e.target.value as number)}
              label="새 소유자"
              sx={{ 
                borderRadius: 2,
                '& .MuiSelect-select': {
                  color: darkMode ? '#ffffff' : '#2c3e50',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                },
              }}
            >
              {team.members?.filter(m => m.role !== 'owner').map(member => (
                <MenuItem 
                  key={member.user_id} 
                  value={member.user_id}
                  sx={{
                    color: darkMode ? '#ffffff' : '#2c3e50',
                    '&:hover': {
                      backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
                    },
                  }}
                >
                  {member.user_name} ({member.user_email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={() => setTransferOwnershipDialogOpen(false)}
            sx={{
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              color: darkMode ? '#ffffff' : '#2c3e50',
              '&:hover': {
                backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
              },
            }}
          >
            취소
          </Button>
          <Button 
            onClick={handleTransferOwnership}
            variant="contained"
            color="warning"
            disabled={!selectedNewOwner}
            sx={{
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(255,152,0,0.4)',
              },
            }}
          >
            권한 이전
          </Button>
        </DialogActions>
      </Dialog>

      {/* 멤버 초대 다이얼로그 */}
      <InviteMemberDialog
        open={inviteMemberDialogOpen}
        onClose={() => setInviteMemberDialogOpen(false)}
        onInviteSent={handleInviteSent}
        teamId={parseInt(id!)}
        teamName={team.name}
      />
    </>
  );
};

export default TeamDetailPage; 