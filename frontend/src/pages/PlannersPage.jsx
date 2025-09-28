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
  Add,
  Edit,
  Delete,
  Assignment,
  Group,
  CalendarToday,
  Visibility,
  Schedule,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { plannerAPI, teamAPI } from '../services/api';
import { Planner } from '../types';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorDisplay from '../components/ErrorDisplay.jsx';
import Navbar from '../components/Navbar.jsx';
import SortSelect, { SortOption } from '../components/SortSelect.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { getDetailedDeadlineText } from '../utils/dateUtils';
const PlannersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [planners, setPlanners] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
    } catch (err) {
      setError('플래너 목록을 불러오는데 실패했습니다.');
      console.error('Error fetching planners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanners();
  }, []);

  const handleDeletePlanner = async (plannerId) => {
    if (!window.confirm('정말로 이 플래너를 삭제하시겠습니까?')) return;
    
    try {
      await plannerAPI.deletePlanner(plannerId);
      fetchPlanners();
    } catch (err) {
      console.error('Error deleting planner:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case '진행중':
        return 'primary';
      case '완료':
        return 'success';
      case '대기중':
        return 'warning';
      default 'default';
    }
  };

  // 권한 확인 함수
  const canEditPlanner = (planner)=> {
    if (!user) return false;
    // 생성자인 경우만 수정 가능
    return planner.created_by === user.id;
  };

  const canDeletePlanner = (planner)=> {
    if (!user) return false;
    // 생성자인 경우만 삭제 가능 (MEMBER는 삭제 불가)
    return planner.created_by === user.id;
  };

  const sortPlanners = (plannersToSort) => {
    return [...plannersToSort].sort((a, b) => {
      switch (sortBy) {
        case 'deadline':
          return new Date(a.deadline || '').getTime() - new Date(b.deadline || '').getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default 0;
      }
    });
  };

  const sortOptions = [
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
              gap 
            }}>
              {sortPlanners(planners).map((planner, index) => (
                <Fade in={animateIn} timeout={1000 + index * 100} key={planner.id}>
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
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Box sx={{ flex }}>
                          <Box display="flex" alignItems="center" mb={1}>
                            <AssignmentIcon sx={{ mr, color: 'primary.main' }} />
                            <Typography 
                              variant="h6" 
                              component="h2"
                              sx={{
                                fontWeight,
                                color ? '#ffffff' : '#2c3e50',
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
                                p,
                                backgroundColor: 'rgba(0,0,0,0.02)',
                                borderRadius,
                                border: '1px solid rgba(0,0,0,0.05)',
                                lineHeight.5,
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
                            sx={{ fontWeight }}
                          />
                          {planner.team_name && (
                            <Chip 
                              icon={<GroupIcon />}
                              label={planner.team_name} 
                              size="small" 
                              variant="outlined"
                              sx={{ fontWeight }}
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
                            sx={{ fontWeight }}
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
                          fontWeight,
                        }}
                      >
                        <CalendarIcon sx={{ fontSize }} />
                        생성일: {new Date(planner.created_at).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                    
                    <CardActions sx={{ p, pt }}>
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => navigate(`/planners/${planner.id}`)}
                        sx={{
                          fontWeight,
                          textTransform: 'none',
                          borderRadius,
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
                            fontWeight,
                            textTransform: 'none',
                            borderRadius,
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
                            fontWeight,
                            textTransform: 'none',
                            borderRadius,
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
                      p,
                      borderRadius,
                      background ? 'rgba(45,45,45,0.95)' : 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(20px)',
                      border ? '1px solid rgba(64,64,64,0.3)' : '1px solid rgba(255,255,255,0.3)',
                      textAlign: 'center',
                      gridColumn: { xs: '1', sm: '1 / -1', md: '1 / -1' },
                    }}
                  >
                    <AssignmentIcon sx={{ fontSize, color ? '#b0b0b0' : 'text.secondary', mb }} />
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