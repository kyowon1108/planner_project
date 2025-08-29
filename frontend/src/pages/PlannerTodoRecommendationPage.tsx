import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Fade,
  Slide,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { aiAPI, todoAPI } from '../services/api';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

interface TodoRecommendationItem {
  title: string;
  description: string;
  priority: string;
  category: string;
}

interface LocationState {
  plannerId: number;
  plannerTitle: string;
  plannerDescription: string;
}

const PlannerTodoRecommendationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;
  
  const [recommendedTodos, setRecommendedTodos] = useState<TodoRecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTodos, setSelectedTodos] = useState<Set<number>>(new Set());
  const [creatingTodos, setCreatingTodos] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  
  const { darkMode } = useTheme();

  useEffect(() => {
    setAnimateIn(true);
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    if (!state?.plannerDescription) {
      setError('플래너 정보를 찾을 수 없습니다.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await aiAPI.recommendTodos(state.plannerDescription);
      setRecommendedTodos(response.recommended_todos);
    } catch (err: any) {
      setError('할일 추천을 불러오는데 실패했습니다.');
      console.error('할일 추천 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTodoToggle = (index: number) => {
    const newSelected = new Set(selectedTodos);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedTodos(newSelected);
  };

  const handleCreateTodos = async () => {
    if (selectedTodos.size === 0) {
      alert('추가할 할일을 선택해주세요.');
      return;
    }

    setCreatingTodos(true);
    try {
      const selectedTodoItems = Array.from(selectedTodos).map(index => recommendedTodos[index]);
      
      // 선택된 할일들을 순차적으로 생성
      for (const todo of selectedTodoItems) {
        await todoAPI.createTodo({
          title: todo.title,
          description: todo.description,
          priority: todo.priority as any,
          planner_id: state.plannerId,
          due_date: null,
          assigned_to: [],
        });
      }

      alert(`${selectedTodoItems.length}개의 할일이 성공적으로 추가되었습니다!`);
      navigate(`/planners/${state.plannerId}`);
    } catch (err: any) {
      console.error('할일 생성 오류:', err);
      alert('할일 생성에 실패했습니다.');
    } finally {
      setCreatingTodos(false);
    }
  };

  const handleSkip = () => {
    navigate(`/planners/${state.plannerId}`);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return '높음';
      case 'medium':
        return '보통';
      default:
        return '낮음';
    }
  };

  if (loading) return <LoadingSpinner message="AI가 할일을 추천하고 있습니다..." />;
  if (error) return (
    <Alert severity="error" sx={{ m: 2 }}>
      {error}
      <Button onClick={() => navigate(`/planners/${state?.plannerId}`)} sx={{ ml: 1 }}>
        플래너로 이동
      </Button>
    </Alert>
  );

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
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
          <Slide direction="down" in={animateIn} timeout={600}>
            <Box display="flex" alignItems="center" mb={4}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(`/planners/${state?.plannerId}`)}
                sx={{ 
                  mr: 2,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }
                }}
              >
                플래너로
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
                AI 할일 추천
              </Typography>
            </Box>
          </Slide>

          <Slide direction="up" in={animateIn} timeout={800}>
            <Fade in={animateIn} timeout={1000}>
              <Card
                elevation={8}
                sx={{
                  borderRadius: 3,
                  background: darkMode ? 'rgba(45,45,45,0.95)' : 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(20px)',
                  border: darkMode ? '1px solid rgba(64,64,64,0.3)' : '1px solid rgba(255,255,255,0.3)',
                  overflow: 'hidden',
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h5" component="h2" sx={{ mb: 1, fontWeight: 600 }}>
                      "{state?.plannerTitle}" 플래너를 위한 할일을 추천해드려요
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      AI가 플래너 설명을 분석하여 관련된 할일들을 추천했습니다. 
                      필요한 할일들을 선택하고 추가해보세요!
                    </Typography>
                  </Box>

                  <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                    <Typography variant="body2">
                      선택한 할일들은 플래너에 자동으로 추가되며, 
                      나중에 담당자와 마감일을 설정할 수 있습니다.
                    </Typography>
                  </Alert>

                  <List sx={{ p: 0 }}>
                    {recommendedTodos.map((todo, index) => (
                                             <ListItem
                         key={index}
                         sx={{
                           border: '1px solid #e0e0e0',
                           borderRadius: 1,
                           mb: 1,
                           backgroundColor: selectedTodos.has(index) ? 'primary.light' : 'transparent',
                           '&:hover': {
                             backgroundColor: selectedTodos.has(index) ? 'primary.light' : 'action.hover',
                           },
                           cursor: 'pointer',
                         }}
                         onClick={() => handleTodoToggle(index)}
                       >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {todo.title}
                              </Typography>
                              <Chip
                                label={getPriorityLabel(todo.priority)}
                                size="small"
                                color={getPriorityColor(todo.priority)}
                                icon={<FlagIcon />}
                              />
                            </Box>
                          }
                          secondary={
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {todo.description}
                            </Typography>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={todo.category}
                              size="small"
                              variant="outlined"
                            />
                            {selectedTodos.has(index) && (
                              <CheckCircleIcon color="primary" />
                            )}
                          </Box>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>

                  {recommendedTodos.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <AssignmentIcon sx={{ fontSize: 60, color: darkMode ? '#b0b0b0' : 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                        추천할 할일이 없습니다
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        플래너 설명을 더 자세히 작성하면 더 정확한 할일을 추천받을 수 있습니다.
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
                    <Button
                      variant="outlined"
                      onClick={handleSkip}
                      disabled={creatingTodos}
                      sx={{
                        borderRadius: 2,
                        px: 3,
                      }}
                    >
                      건너뛰기
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleCreateTodos}
                      disabled={selectedTodos.size === 0 || creatingTodos}
                      startIcon={creatingTodos ? <CircularProgress size={20} /> : <AddIcon />}
                      sx={{
                        borderRadius: 2,
                        px: 3,
                        background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #45a049 0%, #3d8b40 100%)',
                        },
                      }}
                    >
                      {creatingTodos ? '추가 중...' : `${selectedTodos.size}개 할일 추가`}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          </Slide>
        </Container>
      </Box>
    </>
  );
};

export default PlannerTodoRecommendationPage; 