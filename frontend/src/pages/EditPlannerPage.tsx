import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Fade,
  Grow,
  Slide,
  useTheme as useMuiTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Assignment as AssignmentIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { teamAPI, plannerAPI, todoAPI } from '../services/api';
import { Team, Planner, Todo } from '../types';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const EditPlannerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [teamId, setTeamId] = useState<number | ''>('');
  const [status, setStatus] = useState('진행중');
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [animateIn, setAnimateIn] = useState(false);
  const navigate = useNavigate();
  
  const { darkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  useEffect(() => {
    setAnimateIn(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);
        const [teamsData, plannerData, todosData] = await Promise.all([
          teamAPI.getTeams(),
          plannerAPI.getPlanner(parseInt(id!)),
          todoAPI.getTodos(),
        ]);
        
        setTeams(teamsData);
        setTitle(plannerData.title);
        setDescription(plannerData.description);
        setTeamId(plannerData.team_id);
        setStatus(plannerData.status);
        
        // 마감일 설정 (날짜만)
        if (plannerData.deadline) {
          const deadlineDate = new Date(plannerData.deadline);
          setDeadline(deadlineDate);
        } else {
          setDeadline(null);
        }
        
        // 해당 플래너의 할일들만 필터링
        const plannerTodos = todosData.filter(todo => todo.planner_id === parseInt(id!));
        setTodos(plannerTodos);
      } catch (error) {
        console.error('데이터 로딩 실패:', error);
        setError('플래너 정보를 불러오는데 실패했습니다.');
      } finally {
        setInitialLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    if (!teamId) {
      setError('팀을 선택해주세요.');
      return;
    }

    setLoading(true);

    try {
      // 날짜만 사용 (시간 제거)
      let deadlineDate = null;
      if (deadline) {
        deadlineDate = deadline.toISOString().split('T')[0]; // YYYY-MM-DD 형식
      }

      // 할일들의 마감일 체크
      if (deadlineDate) {
        const newDeadline = new Date(deadlineDate);
        const overdueTodos = todos.filter(todo => {
          if (!todo.due_date) return false;
          const todoDueDate = new Date(todo.due_date);
          return todoDueDate > newDeadline;
        });

        if (overdueTodos.length > 0) {
          const todoTitles = overdueTodos.map(todo => todo.title).join(', ');
          alert(`할일들의 마감일을 수정해주세요: ${todoTitles}`);
          setLoading(false);
          return;
        }
      }

      const plannerData = {
        title: title.trim(),
        description: description.trim(),
        team_id: Number(teamId),
        status,
        deadline: deadlineDate || undefined,
      };

      await plannerAPI.updatePlanner(parseInt(id!), plannerData);
      navigate(`/planners/${id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || '플래너 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <>
        <Navbar />
        <LoadingSpinner message="플래너 정보를 불러오는 중..." />
      </>
    );
  }

  if (error && !loading) {
    return (
      <>
        <Navbar />
        <ErrorDisplay message={error} onRetry={() => navigate(`/planners/${id}`)} />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
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
                  onClick={() => navigate(`/planners/${id}`)}
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
                  플래너 수정
                </Typography>
              </Box>
            </Slide>

            <Slide direction="up" in={animateIn} timeout={800}>
              <Fade in={animateIn} timeout={1000}>
                <Paper
                  elevation={8}
                  sx={{
                    borderRadius: 3,
                    background: darkMode ? 'rgba(45,45,45,0.95)' : 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(20px)',
                    border: darkMode ? '1px solid rgba(64,64,64,0.3)' : '1px solid rgba(255,255,255,0.3)',
                    overflow: 'hidden',
                    p: 4,
                  }}
                >
                  {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                      {error}
                    </Alert>
                  )}

                  <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                      fullWidth
                      label="플래너 제목"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      variant="outlined"
                      InputProps={{
                        startAdornment: <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />

                    <TextField
                      fullWidth
                      label="설명"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      multiline
                      rows={4}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />

                    <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                      <FormControl fullWidth>
                        <InputLabel>팀 선택</InputLabel>
                        <Select
                          value={teamId}
                          label="팀 선택"
                          onChange={(e) => setTeamId(e.target.value as number)}
                          required
                          startAdornment={<GroupIcon sx={{ mr: 1, color: 'primary.main' }} />}
                          sx={{
                            borderRadius: 2,
                          }}
                        >
                          {teams.map((team) => (
                            <MenuItem key={team.id} value={team.id}>
                              {team.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <FormControl fullWidth>
                        <InputLabel>상태</InputLabel>
                        <Select
                          value={status}
                          label="상태"
                          onChange={(e) => setStatus(e.target.value)}
                          startAdornment={<ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />}
                          sx={{
                            borderRadius: 2,
                          }}
                        >
                          <MenuItem value="진행중">진행중</MenuItem>
                          <MenuItem value="완료">완료</MenuItem>
                          <MenuItem value="취소">취소</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>

                    <DatePicker
                      label="마감일"
                      value={deadline}
                      onChange={(newValue) => setDeadline(newValue)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          variant: 'outlined',
                          InputProps: {
                            // startAdornment: <AccessTimeIcon sx={{ mr: 1, color: 'primary.main' }} />, // Removed
                          },
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            }
                          },
                        },
                      }}
                    />
                    
                    {/* Removed TimePicker */}

                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => navigate(`/planners/${id}`)}
                        disabled={loading}
                        sx={{
                          fontWeight: 600,
                          textTransform: 'none',
                          borderRadius: 2,
                          px: 3,
                        }}
                      >
                        취소
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        startIcon={<EditIcon />}
                        sx={{
                          background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                          boxShadow: '0 4px 16px rgba(33, 150, 243, 0.3)',
                          borderRadius: 2,
                          fontWeight: 600,
                          textTransform: 'none',
                          px: 3,
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 6px 20px rgba(33, 150, 243, 0.4)',
                          },
                        }}
                      >
                        {loading ? '수정 중...' : '플래너 수정'}
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              </Fade>
            </Slide>
          </Container>
        </Box>
      </LocalizationProvider>
    </>
  );
};

export default EditPlannerPage; 