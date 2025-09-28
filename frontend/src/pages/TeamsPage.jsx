import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Box,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  Fade,
  Grow,
  Slide,
  useTheme as useMuiTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Group,
  Person,
  CalendarToday,
  Visibility,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { teamAPI } from '../services/api';
import { Team } from '../types.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorDisplay from '../components/ErrorDisplay.jsx';
import Navbar from '../components/Navbar.jsx';
import SortSelect, { SortOption } from '../components/SortSelect.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';

const TeamsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('created_at');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [animateIn, setAnimateIn] = useState(false);
  
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  useEffect(() => {
    setAnimateIn(true);
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teamAPI.getTeams();
      setTeams(data);
    } catch (err) {
      setError('팀 목록을 불러오는데 실패했습니다.');
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      alert('팀 이름을 입력해주세요.');
      return;
    }

    try {
      await teamAPI.createTeam({
        name.trim(),
        description.trim(),
      });
      setCreateDialogOpen(false);
      setNewTeamName('');
      setNewTeamDescription('');
      fetchTeams();
    } catch (err) {
      console.error('Error creating team:', err);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('정말로 이 팀을 삭제하시겠습니까?')) return;
    
    try {
      await teamAPI.deleteTeam(teamId);
      fetchTeams();
    } catch (err) {
      console.error('Error deleting team:', err);
      const errorMessage = err.response?.data?.detail || '팀 삭제에 실패했습니다.';
      alert(`팀 삭제 실패: ${errorMessage}`);
    }
  };

  const sortOptions = [
    { value: 'created_at', label: '생성일순' },
    { value: 'name', label: '팀명순 (가나다순)' },
    { value: 'member_count', label: '멤버수순' },
  ];

  // 팀 수정/삭제 권한 확인 함수
  const canEditTeam = (team)=> {
    if (!user) return false;
    // 소유자인 경우만 수정 가능
    return team.owner_id === user.id;
  };

  const sortTeams = (teamsToSort) => {
    return [...teamsToSort].sort((a, b) => {
      switch (sortBy) {
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        
        case 'name':
          return a.name.localeCompare(b.name);
        
        case 'member_count':
          return (b.member_count || 0) - (a.member_count || 0);
        
        default 0;
      }
    });
  };

  if (loading) return <LoadingSpinner message="팀 목록을 불러오는 중..." />;
  if (error) return <ErrorDisplay message={error} onRetry={fetchTeams} />;

  return (
    <>
      <Navbar />
              <Box
          sx={{
            minHeight: '100vh',
            background 
              ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            pt,
            pb,
          }}
        >
        <Container maxWidth="lg" sx={{ mt, mb }}>
          <Slide direction="down" in={animateIn} timeout={600}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
              <Typography 
                variant="h4" 
                component="h1"
                sx={{
                  fontWeight,
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                팀 목록
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <SortSelect
                  value={sortBy}
                  onChange={setSortBy}
                  options={sortOptions}
                  label="정렬"
                />
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setCreateDialogOpen(true)}
                  size="large"
                  sx={{
                    background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                    boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)',
                    borderRadius,
                    px,
                    py: 0.5,
                    fontWeight,
                    textTransform: 'none',
                    fontSize: '1rem',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 40px rgba(76, 175, 80, 0.4)',
                    },
                  }}
                >
                  새 팀 만들기
                </Button>
              </Box>
            </Box>
          </Slide>

          <Slide direction="up" in={animateIn} timeout={800}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { 
                xs: '1fr', 
                sm: 'repeat(2, 1fr)', 
                md: 'repeat(3, 1fr)' 
              }, 
              gap 
            }}>
              {sortTeams(teams).map((team, index) => (
                <Fade in={animateIn} timeout={1000 + index * 100} key={team.id}>
                  <Paper
                    elevation={8}
                    sx={{
                      borderRadius,
                      background 
                        ? 'rgba(45,45,45,0.95)'
                        : 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(20px)',
                      border 
                        ? '1px solid rgba(64,64,64,0.3)'
                        : '1px solid rgba(255,255,255,0.3)',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow 
                          ? '0 20px 40px rgba(0,0,0,0.3)'
                          : '0 20px 40px rgba(0,0,0,0.1)',
                      },
                    }}
                  >
                    <CardContent sx={{ p }}>
                      <Box display="flex" alignItems="center" mb={2}>
                        <GroupIcon sx={{ mr, color: 'primary.main' }} />
                        <Typography 
                          variant="h6" 
                          component="h2"
                          sx={{
                            fontWeight,
                            color ? '#ffffff' : '#2c3e50',
                          }}
                        >
                          {team.name}
                        </Typography>
                      </Box>
                      
                      {team.description && (
                        <Typography 
                          variant="body2" 
                          mb={2}
                          sx={{
                            p,
                            backgroundColor 
                              ? 'rgba(255,255,255,0.05)'
                              : 'rgba(0,0,0,0.02)',
                            borderRadius,
                            border 
                              ? '1px solid rgba(255,255,255,0.1)'
                              : '1px solid rgba(0,0,0,0.05)',
                            lineHeight.5,
                            color ? '#b0b0b0' : 'text.secondary',
                          }}
                        >
                          {team.description}
                        </Typography>
                      )}
                      
                      <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                        <Chip 
                          icon={<PersonIcon />}
                          label={`총 ${team.member_count || team.members?.length || 0}명`} 
                          size="small" 
                          variant="outlined"
                          sx={{ fontWeight }}
                        />
                        {team.owner_name && (
                          <Chip 
                            icon={<AdminIcon />}
                            label={`소유자: ${team.owner_name}`} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontWeight }}
                          />
                        )}
                      </Box>
                      
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 0.5,
                          fontWeight,
                          color ? '#b0b0b0' : 'text.secondary',
                        }}
                      >
                        <CalendarIcon sx={{ fontSize }} />
                        생성일: {new Date(team.created_at).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                    
                    <CardActions sx={{ p, pt }}>
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => navigate(`/teams/${team.id}`)}
                        sx={{
                          fontWeight,
                          textTransform: 'none',
                          borderRadius,
                        }}
                      >
                        상세보기
                      </Button>
                      
                      {/* 소유자만 수정/삭제 가능 */}
                      {canEditTeam(team) && (
                        <>
                          <Button
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => navigate(`/teams/${team.id}/edit`)}
                            sx={{
                              fontWeight,
                              textTransform: 'none',
                              borderRadius,
                            }}
                          >
                            수정
                          </Button>
                          <Button
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteTeam(team.id)}
                            color="error"
                            sx={{
                              fontWeight,
                              textTransform: 'none',
                              borderRadius,
                            }}
                          >
                            삭제
                          </Button>
                        </>
                      )}
                    </CardActions>
                  </Paper>
                </Fade>
              ))}
              
              {teams.length === 0 && (
                <Fade in={animateIn} timeout={1200}>
                  <Paper
                    elevation={8}
                    sx={{
                      p,
                      borderRadius,
                      background 
                        ? 'rgba(45,45,45,0.95)'
                        : 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(20px)',
                      border 
                        ? '1px solid rgba(64,64,64,0.3)'
                        : '1px solid rgba(255,255,255,0.3)',
                      textAlign: 'center',
                      gridColumn: { xs: '1', sm: '1 / -1', md: '1 / -1' },
                    }}
                  >
                    <GroupIcon sx={{ fontSize, color ? '#b0b0b0' : 'text.secondary', mb }} />
                    <Typography variant="h6" sx={{ color ? '#b0b0b0' : 'text.secondary' }} gutterBottom>
                      팀이 없습니다
                    </Typography>
                    <Typography variant="body2" sx={{ color ? '#b0b0b0' : 'text.secondary' }}>
                      새로운 팀을 만들어보세요!
                    </Typography>
                  </Paper>
                </Fade>
              )}
            </Box>
          </Slide>
        </Container>
      </Box>

      {/* 팀 생성 다이얼로그 */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius,
            background 
              ? 'rgba(45,45,45,0.98)'
              : 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(20px)',
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight, 
          color ? '#ffffff' : '#2c3e50',
          borderBottom 
            ? '1px solid rgba(255,255,255,0.1)'
            : '1px solid rgba(0,0,0,0.1)',
        }}>
          새 팀 만들기
        </DialogTitle>
        <DialogContent sx={{ pt }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <TextField
              label="팀 이름"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius,
                }
              }}
            />
            
            <TextField
              label="팀 설명"
              value={newTeamDescription}
              onChange={(e) => setNewTeamDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius,
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p, pt }}>
          <Button 
            onClick={() => setCreateDialogOpen(false)}
            sx={{
              fontWeight,
              textTransform: 'none',
              borderRadius,
            }}
          >
            취소
          </Button>
          <Button 
            onClick={handleCreateTeam}
            variant="contained"
            sx={{
              fontWeight,
              textTransform: 'none',
              borderRadius,
              px,
            }}
          >
            팀 생성
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TeamsPage; 