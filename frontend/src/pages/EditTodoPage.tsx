import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Fade,
  Grow,
  Slide,
  useTheme as useMuiTheme,
  useMediaQuery,
  Alert,
  Chip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Assignment as AssignmentIcon,
  Description as DescriptionIcon,
  Group as GroupIcon,
  PriorityHigh as PriorityIcon,
  Schedule as ScheduleIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { todoAPI, plannerAPI, teamAPI } from '../services/api';
import { Todo, Planner } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePermissions } from '../hooks/usePermissions';

const EditTodoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [todo, setTodo] = useState<Todo | null>(null);
  const [planners, setPlanners] = useState<Planner[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animateIn, setAnimateIn] = useState(false);
  
  // 폼 상태
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('보통');
  const [plannerId, setPlannerId] = useState<number | ''>('');
  const [assignedTo, setAssignedTo] = useState<number[]>([]);
  const [dueDate, setDueDate] = useState('');
  
  const { darkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  // 권한 관리 - todo와 planners가 로드된 후에만 권한 확인
  const selectedPlanner = todo?.planner_id ? planners.find(p => p.id === todo.planner_id) : null;
  const { hasPermission } = usePermissions(selectedPlanner?.team_id);

  useEffect(() => {
    setAnimateIn(true);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const [todoData, plannersData] = await Promise.all([
          todoAPI.getTodo(parseInt(id)),
          plannerAPI.getPlanners()
        ]);
        
        setTodo(todoData);
        setPlanners(plannersData);
        
        // 폼 초기화
        setTitle(todoData.title);
        setDescription(todoData.description || '');
        setPriority(todoData.priority);
        setPlannerId(todoData.planner_id);
        setAssignedTo(todoData.assigned_to || []);
        
        // 마감일 설정 (날짜만)
        if (todoData.due_date) {
          const dueDateObj = new Date(todoData.due_date);
          setDueDate(dueDateObj.toISOString().split('T')[0]);
        }
        
        // 플래너가 선택되면 팀 멤버 가져오기
        if (todoData.planner_id) {
          await fetchTeamData(todoData.planner_id);
        }
      } catch (err) {
        setError('할일을 불러오는데 실패했습니다.');
        console.error('Error fetching todo:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // 플래너 선택이 변경될 때 팀 멤버 가져오기
  useEffect(() => {
    if (plannerId) {
      fetchTeamData(plannerId);
    }
  }, [plannerId]);

  // 플래너 선택 시 팀 정보 가져오기
  const fetchTeamData = async (plannerId: number) => {
    const selectedPlanner = planners.find(p => p.id === plannerId);
    if (selectedPlanner?.team_id) {
      try {
        const teamData = await teamAPI.getTeam(selectedPlanner.team_id);
        setTeamMembers(teamData.members || []);
      } catch (err) {
        console.error('Error fetching team data:', err);
        setTeamMembers([]);
      }
    } else {
      setTeamMembers([]);
    }
  };

  const handleSave = async () => {
    if (!todo || !title.trim()) {
      alert('할일 제목을 입력해주세요.');
      return;
    }

    if (!plannerId) {
      alert('플래너를 선택해주세요.');
      return;
    }

    // 플래너의 마감일 체크
    const selectedPlanner = planners.find(p => p.id === plannerId);
    console.log('Selected planner:', selectedPlanner);
    console.log('Due date:', dueDate);
    
    if (selectedPlanner?.deadline && dueDate) {
      // 날짜만 비교 (시간 제거)
      const plannerDeadlineDate = selectedPlanner.deadline.split('T')[0];
      const todoDueDateOnly = dueDate;
      
      console.log('Planner deadline (date only):', plannerDeadlineDate);
      console.log('Todo due date (date only):', todoDueDateOnly);
      console.log('Comparison:', todoDueDateOnly > plannerDeadlineDate);
      
      // 플래너 마감일을 넘어서는 할일 수정 불가
      if (todoDueDateOnly > plannerDeadlineDate) {
        alert('플래너의 마감일보다 마감일을 더 뒤로 설정할 수 없습니다.');
        return;
      }
    }

    try {
      await todoAPI.updateTodo(todo.id, {
        title: title.trim(),
        description: description.trim(),
        priority,
        due_date: dueDate ? `${dueDate}T00:00:00` : null,
        planner_id: plannerId as number,
        assigned_to: assignedTo.length > 0 ? assignedTo : null,
      });
      
      navigate(`/todos/${todo.id}`);
    } catch (err) {
      console.error('Error updating todo:', err);
      alert('할일 수정에 실패했습니다.');
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
                onClick={() => navigate(`/todos/${todo.id}`)}
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
                  flexGrow: 1,
                  fontWeight: 700,
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                할일 수정
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
                }}
              >
                <Box sx={{ p: 4 }}>
                  <Alert 
                    severity="info" 
                    sx={{ 
                      mb: 3,
                      borderRadius: 2,
                      '& .MuiAlert-icon': {
                        color: 'primary.main',
                      }
                    }}
                  >
                    할일 정보를 수정하여 더 나은 계획을 세워보세요.
                  </Alert>

                  <TextField
                    autoFocus
                    margin="dense"
                    label="할일 제목 *"
                    fullWidth
                    variant="outlined"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    sx={{ 
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'rgba(0,0,0,0.2)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                    InputProps={{
                      startAdornment: <EditIcon sx={{ mr: 1, color: darkMode ? '#b0b0b0' : 'text.secondary' }} />,
                    }}
                  />
                  
                  <TextField
                    margin="dense"
                    label="설명"
                    fullWidth
                    variant="outlined"
                    multiline
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    sx={{ 
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'rgba(0,0,0,0.2)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                    InputProps={{
                      startAdornment: <DescriptionIcon sx={{ mr: 1, color: darkMode ? '#b0b0b0' : 'text.secondary', alignSelf: 'flex-start', mt: 1 }} />,
                    }}
                  />
                  
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>플래너 선택 *</InputLabel>
                    <Select
                      value={plannerId}
                      label="플래너 선택 *"
                      onChange={(e) => {
                        const newPlannerId = e.target.value as number | '';
                        setPlannerId(newPlannerId);
                        if (typeof newPlannerId === 'number') {
                          fetchTeamData(newPlannerId);
                          
                          // 플래너 변경 시 마감일 체크
                          const selectedPlanner = planners.find(p => p.id === newPlannerId);
                          if (selectedPlanner?.deadline && dueDate) {
                            // 날짜만 비교 (시간 제거)
                            const plannerDeadlineDate = selectedPlanner.deadline.split('T')[0];
                            const todoDueDateOnly = dueDate;
                            
                            if (todoDueDateOnly > plannerDeadlineDate) {
                              alert('플래너의 마감일보다 마감일을 더 뒤로 설정할 수 없습니다. 마감일을 조정해주세요.');
                              setDueDate(plannerDeadlineDate); // 플래너 마감일로 자동 설정
                            }
                          }
                        }
                      }}
                      sx={{
                        borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(0,0,0,0.2)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      {planners.map((planner) => (
                        <MenuItem key={planner.id} value={planner.id}>
                          <Box display="flex" alignItems="center">
                            <GroupIcon sx={{ mr: 1, fontSize: 16 }} />
                            {planner.title}
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  {/* 담당자 선택 (플래너가 선택된 경우에만 표시) */}
                  {(() => {
                    console.log('담당자 선택 조건 확인:');
                    console.log('- plannerId:', plannerId);
                    console.log('- teamMembers.length:', teamMembers.length);
                    console.log('- hasPermission todo_assign:', hasPermission('todo_assign'));
                    console.log('- selectedPlanner:', selectedPlanner);
                    return null;
                  })()}
                  {plannerId && teamMembers.length > 0 && hasPermission('todo_assign') && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                        담당자 선택
                      </Typography>
                      
                      {/* 개별 사용자 선택 */}
                      <FormControl fullWidth>
                        <InputLabel>담당자 선택 (여러 명 선택 가능)</InputLabel>
                        <Select
                          multiple
                          value={assignedTo}
                          onChange={(e) => setAssignedTo(e.target.value as number[])}
                          label="담당자 선택 (여러 명 선택 가능)"
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {(selected as number[]).map((userId) => {
                                const member = teamMembers.find(m => m.user_id === userId);
                                return (
                                  <Chip 
                                    key={userId} 
                                    label={member ? (member as any).user?.name || `사용자 ${userId}` : `사용자 ${userId}`}
                                    size="small"
                                  />
                                );
                              })}
                            </Box>
                          )}
                        >
                          {teamMembers.map((member) => (
                            <MenuItem key={member.id} value={member.user_id}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                <Typography variant="body2">
                                  {(member as any).user?.name || `사용자 ${member.user_id}`} ({(member as any).role})
                                </Typography>
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  )}
                  
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>우선순위</InputLabel>
                    <Select
                      value={priority}
                      label="우선순위"
                      onChange={(e) => setPriority(e.target.value)}
                      sx={{
                        borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(0,0,0,0.2)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main',
                        },
                      }}
                    >
                      <MenuItem value="긴급">긴급</MenuItem>
                      <MenuItem value="높음">높음</MenuItem>
                      <MenuItem value="보통">보통</MenuItem>
                      <MenuItem value="낮음">낮음</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <TextField
                    margin="dense"
                    label="마감일"
                    type="date"
                    fullWidth
                    variant="outlined"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    sx={{ 
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'rgba(0,0,0,0.2)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                    InputProps={{
                      startAdornment: <ScheduleIcon sx={{ mr: 1, color: darkMode ? '#b0b0b0' : 'text.secondary' }} />,
                    }}
                  />
                  
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate(`/todos/${todo.id}`)}
                      sx={{
                        borderRadius: 2,
                        borderColor: 'rgba(0,0,0,0.3)',
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: 'rgba(0,0,0,0.04)',
                        }
                      }}
                    >
                      취소
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      sx={{
                        borderRadius: 2,
                        background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                        boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)',
                        }
                      }}
                    >
                      저장
                    </Button>
                  </Box>
                </Box>
              </Paper>
            </Fade>
          </Slide>
        </Container>
      </Box>
    </>
  );
};

export default EditTodoPage; 