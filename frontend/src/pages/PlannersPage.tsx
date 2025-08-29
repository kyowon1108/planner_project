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
  Paper,
  Fade,
  Grow,
  Slide,
  useTheme as useMuiTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  Group as GroupIcon,
  CalendarToday as CalendarIcon,
  Visibility as VisibilityIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { plannerAPI, teamAPI } from '../services/api';
import { Planner } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import Navbar from '../components/Navbar';
import SortSelect, { SortOption } from '../components/SortSelect';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getDetailedDeadlineText } from '../utils/dateUtils';
const PlannersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [planners, setPlanners] = useState<Planner[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('created_at');
  const [animateIn, setAnimateIn] = useState(false);
  
  const { darkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  useEffect(() => {
    setAnimateIn(true);
  }, []);

  const fetchPlanners = async () => {
    try {
      setLoading(true);
      setError(null);
      const [plannersData, teamsData] = await Promise.all([
        plannerAPI.getPlanners(),
        teamAPI.getTeams()
      ]);
      setPlanners(plannersData);
      setTeams(teamsData);
    } catch (err: any) {
      setError('플래너 목록을 불러오는데 실패했습니다.');
      console.error('Error fetching planners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanners();
  }, []);

  const handleDeletePlanner = async (plannerId: number) => {
    if (!window.confirm('정말로 이 플래너를 삭제하시겠습니까?')) return;
    
    try {
      await plannerAPI.deletePlanner(plannerId);
      fetchPlanners();
    } catch (err) {
      console.error('Error deleting planner:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '진행중':
        return 'primary';
      case '완료':
        return 'success';
      case '대기중':
        return 'warning';
      default:
        return 'default';
    }
  };

  // 권한 확인 함수
  const canEditPlanner = (planner: Planner): boolean => {
    if (!user) return false;
    // 생성자인 경우만 수정 가능
    return planner.created_by === user.id;
  };

  const canDeletePlanner = (planner: Planner): boolean => {
    if (!user) return false;
    // 생성자인 경우만 삭제 가능 (MEMBER는 삭제 불가)
    return planner.created_by === user.id;
  };

  const sortPlanners = (plannersToSort: Planner[]) => {
    return [...plannersToSort].sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          return new Date(a.deadline || '').getTime() - new Date(b.deadline || '').getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
  };

  const sortOptions: SortOption[] = [
    { value: 'deadline', label: '마감일순' },
    { value: 'title', label: '제목순 (가나다순)' },
    { value: 'created_at', label: '생성일순' },
  ];

  if (loading) return <LoadingSpinner message="플래너 목록을 불러오는 중..." />;
  if (error) return <ErrorDisplay message={error} onRetry={fetchPlanners} />;

  return (
    <>
      <Navbar />
              <Box
          sx={{
            minHeight: '100vh',
            background: darkMode 
              ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            pt: 2,
            pb: 4,
          }}
        >
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Slide direction="down" in={animateIn} timeout={600}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
              <Typography 
                variant="h4" 
                component="h1"
                sx={{
                  fontWeight: 700,
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                플래너 목록
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
                  onClick={() => navigate('/planners/create')}
                  size="large"
                  sx={{
                    background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                    boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)',
                    borderRadius: 2,
                    px: 3,
                    py: 1.5,
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '1rem',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 40px rgba(76, 175, 80, 0.4)',
                    },
                  }}
                >
                  새 플래너 만들기
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
              gap: 3 
            }}>
              {sortPlanners(planners).map((planner, index) => (
                <Fade in={animateIn} timeout={1000 + index * 100} key={planner.id}>
                  <Paper
                    elevation={8}
                    sx={{
                      borderRadius: 3,
                      background: darkMode 
                        ? 'rgba(45,45,45,0.95)'
                        : 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(20px)',
                      border: darkMode 
                        ? '1px solid rgba(64,64,64,0.3)'
                        : '1px solid rgba(255,255,255,0.3)',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: darkMode 
                          ? '0 20px 40px rgba(0,0,0,0.3)'
                          : '0 20px 40px rgba(0,0,0,0.1)',
                      },
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box sx={{ flex: 1 }}>
                          <Box display="flex" alignItems="center" mb={1}>
                            <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography 
                              variant="h6" 
                              component="h2"
                              sx={{
                                fontWeight: 600,
                                color: darkMode ? '#ffffff' : '#2c3e50',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              {planner.title}
                            </Typography>
                          </Box>
                          
                          {planner.description && (
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              mb={2}
                              sx={{
                                p: 2,
                                backgroundColor: 'rgba(0,0,0,0.02)',
                                borderRadius: 2,
                                border: '1px solid rgba(0,0,0,0.05)',
                                lineHeight: 1.5,
                              }}
                            >
                              {planner.description}
                            </Typography>
                          )}
                        </Box>
                        
                        <Box display="flex" gap={1} flexWrap="wrap">
                          <Chip 
                            label={planner.status} 
                            color={getStatusColor(planner.status) as 'primary' | 'success' | 'warning' | 'default'}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                          {planner.team_name && (
                            <Chip 
                              icon={<GroupIcon />}
                              label={planner.team_name} 
                              size="small" 
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                          )}
                        </Box>
                      </Box>
                      
                      <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                        {planner.deadline && (
                          <Chip 
                            icon={<CalendarIcon />}
                            label={`마감일: ${new Date(planner.deadline).toLocaleDateString()}`} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontWeight: 500 }}
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
                        생성일: {new Date(planner.created_at).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                    
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => navigate(`/planners/${planner.id}`)}
                        sx={{
                          fontWeight: 600,
                          textTransform: 'none',
                          borderRadius: 2,
                        }}
                      >
                        상세보기
                      </Button>
                      
                      {/* 생성자만 수정/삭제 가능 */}
                      {canEditPlanner(planner) && (
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => navigate(`/planners/${planner.id}/edit`)}
                          sx={{
                            fontWeight: 600,
                            textTransform: 'none',
                            borderRadius: 2,
                          }}
                        >
                          수정
                        </Button>
                      )}
                      
                      {canDeletePlanner(planner) && (
                        <Button
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeletePlanner(planner.id)}
                          color="error"
                          sx={{
                            fontWeight: 600,
                            textTransform: 'none',
                            borderRadius: 2,
                          }}
                        >
                          삭제
                        </Button>
                      )}
                    </CardActions>
                  </Paper>
                </Fade>
              ))}
              
              {planners.length === 0 && (
                <Fade in={animateIn} timeout={1200}>
                  <Paper
                    elevation={8}
                    sx={{
                      p: 6,
                      borderRadius: 3,
                      background: darkMode ? 'rgba(45,45,45,0.95)' : 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(20px)',
                      border: darkMode ? '1px solid rgba(64,64,64,0.3)' : '1px solid rgba(255,255,255,0.3)',
                      textAlign: 'center',
                      gridColumn: { xs: '1', sm: '1 / -1', md: '1 / -1' },
                    }}
                  >
                    <AssignmentIcon sx={{ fontSize: 64, color: darkMode ? '#b0b0b0' : 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      플래너가 없습니다
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      새로운 플래너를 만들어보세요!
                    </Typography>
                  </Paper>
                </Fade>
              )}
            </Box>
          </Slide>
        </Container>
      </Box>
    </>
  );
};

export default PlannersPage; 