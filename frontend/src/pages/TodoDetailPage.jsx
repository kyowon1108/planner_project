import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  CircularProgress,
  Paper,
  Fade,
  Grow,
  Slide,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  CheckCircle,
  Assignment,
  Schedule,
  Person,
  CalendarToday,
} from '@mui/icons-material';
import { todoAPI, plannerAPI } from '../services/api';
import { Todo, Planner } from '../types';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorDisplay from '../components/ErrorDisplay.jsx';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';

const TodoDetailPage = () => {
  const { id } = useParams<{ id }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [todo, setTodo] = useState(null);
  const [planner, setPlanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animateIn, setAnimateIn] = useState(false);
  
  const { darkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  useEffect(() => {
    setAnimateIn(true);
  }, []);

  useEffect(() => {
    const fetchTodo = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        const todoData = await todoAPI.getTodo(parseInt(id));
        setTodo(todoData);
        
        // 플래너 정보도 가져오기
        if (todoData.planner_id) {
          try {
            const plannerData = await plannerAPI.getPlanner(todoData.planner_id);
            setPlanner(plannerData);
          } catch (plannerErr) {
            console.error('Error fetching planner:', plannerErr);
          }
        }
      } catch (err) {
        setError('할일을 불러오는데 실패했습니다.');
        console.error('Error fetching todo:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTodo();
  }, [id]);

  const handleToggleComplete = async () => {
    if (!todo) return;
    
    try {
      await todoAPI.toggleCompletion(todo.id);
      setTodo(prev => prev ? { ...prev, is_completed: !prev.is_completed } : null);
    } catch (err) {
      console.error('Error toggling todo completion:', err);
    }
  };

  const handleDelete = async () => {
    if (!todo || !window.confirm('정말로 이 할일을 삭제하시겠습니까?')) return;
    
    try {
      await todoAPI.deleteTodo(todo.id);
      navigate('/todos');
    } catch (err) {
      console.error('Error deleting todo:', err);
    }
  };

  if (loading) return <LoadingSpinner message="할일을 불러오는 중..." />;
  if (error) return <ErrorDisplay message={error} onRetry={() => window.location.reload()} />;
  if (!todo) return <ErrorDisplay message="할일을 찾을 수 없습니다." onRetry={() => navigate('/todos')} />;

  return (
    <>
      <Navbar />
      <Box
        sx={{
          minHeight: '100vh',
          background ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          pt,
          pb,
        }}
      >
        <Container maxWidth="lg" sx={{ mt, mb }}>
          <Slide direction="down" in={animateIn} timeout={600}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb }}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/todos')}
                sx={{ 
                  mr,
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
                  fontWeight,
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                할일 상세
              </Typography>
            </Box>
          </Slide>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns ? '1fr' : '1fr 1fr',
              gap,
              alignItems: 'start',
            }}
          >
            {/* 왼쪽 상세 정보 */}
            <Slide direction="right" in={animateIn} timeout={800}>
              <Paper
                elevation={24}
                sx={{
                  p,
                  borderRadius,
                  background ? 'rgba(45,45,45,0.95)' : 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(20px)',
                  border ? '1px solid rgba(64,64,64,0.3)' : '1px solid rgba(255,255,255,0.3)',
                }}
              >
                <Grow in={animateIn} timeout={1000}>
                  <Box sx={{ mb }}>
                    <Typography 
                      variant="h4" 
                      component="h2" 
                      gutterBottom
                      sx={{
                        fontWeight,
                        color ? '#ffffff' : '#2c3e50',
                        mb,
                      }}
                    >
                      {todo.title}
                      {planner && (
                        <Typography 
                          component="span" 
                          variant="h6" 
                          color="text.secondary" 
                          sx={{ 
                            ml, 
                            fontWeight: 'normal',
                            opacity.8,
                          }}
                        >
                          | {planner.title}
                        </Typography>
                      )}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap, mb }}>
                      <Chip
                        label={todo.is_completed ? '완료' : '진행중'}
                        color={todo.is_completed ? 'success' : 'primary'}
                        icon={todo.is_completed ? <CheckCircleIcon /> : undefined}
                        sx={{ 
                          fontWeight,
                          '& .MuiChip-label': { px }
                        }}
                      />
                      <Chip
                        label={todo.priority}
                        color={
                          todo.priority === '높음' ? 'error' :
                          todo.priority === '보통' ? 'warning' : 'default'
                        }
                        size="small"
                        sx={{ fontWeight }}
                      />
                    </Box>
                  </Box>
                </Grow>

                <Fade in={animateIn} timeout={1200}>
                  <Box sx={{ mb }}>
                    <Typography 
                      variant="h6" 
                      gutterBottom
                      sx={{
                        fontWeight,
                        color ? '#ffffff' : '#2c3e50',
                        display: 'flex',
                        alignItems: 'center',
                        gap,
                        mb,
                      }}
                    >
                      <AssignmentIcon sx={{ fontSize }} />
                      설명
                    </Typography>
                    <Typography 
                      variant="body1" 
                      color="text.secondary"
                      sx={{
                        p,
                        backgroundColor: 'rgba(0,0,0,0.02)',
                        borderRadius,
                        border: '1px solid rgba(0,0,0,0.05)',
                        lineHeight.6,
                      }}
                    >
                      {todo.description || '설명이 없습니다.'}
                    </Typography>
                  </Box>
                </Fade>

                <Fade in={animateIn} timeout={1400}>
                  <Box sx={{ mb }}>
                    <Typography 
                      variant="h6" 
                      gutterBottom
                      sx={{
                        fontWeight,
                        color ? '#ffffff' : '#2c3e50',
                        display: 'flex',
                        alignItems: 'center',
                        gap,
                        mb,
                      }}
                    >
                      <ScheduleIcon sx={{ fontSize }} />
                      상세 정보
                    </Typography>
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'auto 1fr', 
                      gap,
                      p,
                      backgroundColor: 'rgba(0,0,0,0.02)',
                      borderRadius,
                      border: '1px solid rgba(0,0,0,0.05)',
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap }}>
                        <CalendarIcon sx={{ fontSize, color ? '#b0b0b0' : 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight }}>
                          마감일:
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight }}>
                        {todo.due_date ? new Date(todo.due_date).toLocaleDateString() : '설정되지 않음'}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap }}>
                        <PersonIcon sx={{ fontSize, color ? '#b0b0b0' : 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight }}>
                          담당자:
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight }}>
                        {todo.assignee_names && todo.assignee_names.length > 0 
                          ? todo.assignee_names.join(', ') 
                          : '지정되지 않음'}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap }}>
                        <PersonIcon sx={{ fontSize, color ? '#b0b0b0' : 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight }}>
                          작성자:
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight }}>
                        {todo.creator_name || '알 수 없음'}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap }}>
                        <CalendarIcon sx={{ fontSize, color ? '#b0b0b0' : 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight }}>
                          생성일:
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight }}>
                        {new Date(todo.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                </Fade>
              </Paper>
            </Slide>

            {/* 오른쪽 버튼들 */}
            <Slide direction="left" in={animateIn} timeout={800}>
              <Paper
                elevation={24}
                sx={{
                  p,
                  borderRadius,
                  background ? 'rgba(45,45,45,0.95)' : 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(20px)',
                  border ? '1px solid rgba(64,64,64,0.3)' : '1px solid rgba(255,255,255,0.3)',
                  height: 'fit-content',
                }}
              >
                <Grow in={animateIn} timeout={1000}>
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{
                      fontWeight,
                      color ? '#ffffff' : '#2c3e50',
                      mb,
                      textAlign: 'center',
                    }}
                  >
                    할일 관리
                  </Typography>
                </Grow>

                <Fade in={animateIn} timeout={1200}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap }}>
                    <Button
                      variant={todo.is_completed ? "outlined" : "contained"}
                      color={todo.is_completed ? "inherit" : "success"}
                      onClick={handleToggleComplete}
                      startIcon={<CheckCircleIcon />}
                      size="large"
                      sx={{
                        py.5,
                        fontWeight,
                        borderRadius,
                        textTransform: 'none',
                        fontSize: '1rem',
                      }}
                    >
                      {todo.is_completed ? '완료 취소' : '완료 처리'}
                    </Button>
                    
                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<EditIcon />}
                      onClick={() => navigate(`/todos/${todo.id}/edit`)}
                      size="large"
                      sx={{
                        py.5,
                        fontWeight,
                        borderRadius,
                        textTransform: 'none',
                        fontSize: '1rem',
                        borderWidth,
                        '&:hover': {
                          borderWidth,
                        }
                      }}
                    >
                      수정
                    </Button>
                    
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={handleDelete}
                      size="large"
                      sx={{
                        py.5,
                        fontWeight,
                        borderRadius,
                        textTransform: 'none',
                        fontSize: '1rem',
                        borderWidth,
                        '&:hover': {
                          borderWidth,
                        }
                      }}
                    >
                      삭제
                    </Button>
                  </Box>
                </Fade>
              </Paper>
            </Slide>
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default TodoDetailPage; 