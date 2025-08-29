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
} from '@mui/material';
import AdvancedSearchFilter from '../components/AdvancedSearchFilter';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { todoAPI, plannerAPI, teamAPI } from '../services/api';
import { Todo, Planner } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import Navbar from '../components/Navbar';
import SortSelect, { SortOption } from '../components/SortSelect';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePermissions } from '../hooks/usePermissions';

const TodosPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [planners, setPlanners] = useState<Planner[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('due_date');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoDescription, setNewTodoDescription] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState('보통');
  const [newTodoDueDate, setNewTodoDueDate] = useState('');
  const [newTodoPlannerId, setNewTodoPlannerId] = useState<number | ''>('');
  const [newTodoAssignedTo, setNewTodoAssignedTo] = useState<number[]>([]);

  const [animateIn, setAnimateIn] = useState(false);
  
  const { darkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  // URL에서 날짜 파라미터 가져오기
  const filterDate = searchParams.get('date');

  useEffect(() => {
    setAnimateIn(true);
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      setError(null);
      const [todosData, plannersData, teamsData] = await Promise.all([
        todoAPI.getTodos(),
        plannerAPI.getPlanners(),
        teamAPI.getTeams()
      ]);
      setTodos(todosData);
      setPlanners(plannersData);
      setTeams(teamsData);
      
      // 선택된 플래너의 팀 정보 가져오기
      if (newTodoPlannerId && typeof newTodoPlannerId === 'number') {
        const selectedPlanner = plannersData.find(p => p.id === newTodoPlannerId);
        if (selectedPlanner?.team_id) {
          try {
            const teamData = await teamAPI.getTeam(selectedPlanner.team_id);
            setTeamMembers(teamData.members || []);
          } catch (err) {
            console.error('Error fetching team data:', err);
          }
        }
      }
    } catch (err) {
      setError('할일 목록을 불러오는데 실패했습니다.');
      console.error('Error fetching todos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  // 플래너 선택 시 팀 정보 가져오기
  const handlePlannerChange = async (plannerId: number) => {
    setNewTodoPlannerId(plannerId);
    setNewTodoAssignedTo([]); // 담당자 초기화
    
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

  const handleCreateTodo = async () => {
    if (!newTodoTitle.trim()) {
      alert('할일 제목을 입력해주세요.');
      return;
    }

    if (!newTodoPlannerId) {
      alert('플래너를 선택해주세요.');
      return;
    }

    // 플래너의 마감일 체크
    const selectedPlanner = planners.find(p => p.id === newTodoPlannerId);
    if (selectedPlanner?.deadline && newTodoDueDate) {
      // 날짜만 비교 (시간 제거)
      const plannerDeadlineDate = selectedPlanner.deadline.split('T')[0];
      const todoDueDateOnly = newTodoDueDate;
      
      // 플래너 마감일을 넘어서는 할일 생성 불가
      if (todoDueDateOnly > plannerDeadlineDate) {
        alert('플래너의 마감일보다 마감일을 더 뒤로 설정할 수 없습니다.');
        return;
      }
    }

    const dueDateTime = newTodoDueDate ? `${newTodoDueDate}T00:00:00` : null;

    try {
      await todoAPI.createTodo({
        title: newTodoTitle.trim(),
        description: newTodoDescription.trim(),
        priority: newTodoPriority,
        due_date: dueDateTime,
        planner_id: newTodoPlannerId as number,
        assigned_to: newTodoAssignedTo.length > 0 ? newTodoAssignedTo : null,
      });
      setCreateDialogOpen(false);
      setNewTodoTitle('');
      setNewTodoDescription('');
      setNewTodoPriority('보통');
      setNewTodoDueDate('');
      setNewTodoPlannerId('');
      setNewTodoAssignedTo([]);
      fetchTodos();
    } catch (err) {
      console.error('Error creating todo:', err);
    }
  };

  const handleDeleteTodo = async (todoId: number) => {
    if (!window.confirm('정말로 이 할일을 삭제하시겠습니까?')) return;
    
    try {
      await todoAPI.deleteTodo(todoId);
      fetchTodos();
    } catch (err) {
      console.error('Error deleting todo:', err);
    }
  };

  const sortOptions: SortOption[] = [
    { value: 'due_date', label: '마감일순' },
    { value: 'priority', label: '우선순위순' },
    { value: 'title', label: '제목순 (가나다순)' },
    { value: 'created_at', label: '생성일순' },
  ];

  // 권한 관리 - 첫 번째 할일의 플래너 팀 ID 사용 (임시)
  const { hasPermission, canEditContent } = usePermissions(todos[0]?.planner_id ? planners.find(p => p.id === todos[0].planner_id)?.team_id : undefined);

  // 할일 수정/삭제 권한 확인 함수
  const canEditTodo = (todo: Todo): boolean => {
    if (!user) return false;
    // OWNER/ADMIN이거나 생성자인 경우 수정 가능
    return hasPermission('todo_update') || canEditContent(todo.created_by);
  };

  const canDeleteTodo = (todo: Todo): boolean => {
    if (!user) return false;
    // OWNER/ADMIN이거나 생성자인 경우 삭제 가능
    return hasPermission('todo_delete') || canEditContent(todo.created_by);
  };

  const getFilteredTodos = () => {
    let filteredTodos = todos;
    
    // 날짜 필터링 적용
    if (filterDate) {
      filteredTodos = filteredTodos.filter(todo => {
        if (!todo.due_date) return false;
        const todoDate = new Date(todo.due_date);
        const filterDateObj = new Date(filterDate);
        
        // 년, 월, 일만 비교 (시간 제외)
        const todoYear = todoDate.getFullYear();
        const todoMonth = todoDate.getMonth();
        const todoDay = todoDate.getDate();
        
        const filterYear = filterDateObj.getFullYear();
        const filterMonth = filterDateObj.getMonth();
        const filterDay = filterDateObj.getDate();
        
        return todoYear === filterYear && todoMonth === filterMonth && todoDay === filterDay;
      });
    }
    
    // 팀 필터링
    if (selectedTeam !== 'all') {
      filteredTodos = filteredTodos.filter(todo => {
        const planner = planners.find(p => p.id === todo.planner_id);
        return planner?.team_id?.toString() === selectedTeam;
      });
    }
    
    // 상태 필터링
    if (selectedStatus !== 'all') {
      filteredTodos = filteredTodos.filter(todo => todo.status === selectedStatus);
    }
    
    // 검색 필터링 (타입별)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredTodos = filteredTodos.filter(todo => {
        switch (searchType) {
          case 'title':
            return todo.title?.toLowerCase().includes(searchLower);
          case 'content':
            return todo.description?.toLowerCase().includes(searchLower);
          case 'author':
            return todo.creator_name?.toLowerCase().includes(searchLower);
          case 'all':
          default:
            const titleMatch = todo.title?.toLowerCase().includes(searchLower);
            const descriptionMatch = todo.description?.toLowerCase().includes(searchLower);
            const creatorMatch = todo.creator_name?.toLowerCase().includes(searchLower);
            const plannerMatch = todo.planner_name?.toLowerCase().includes(searchLower);
            return titleMatch || descriptionMatch || creatorMatch || plannerMatch;
        }
      });
    }
    
    return filteredTodos;
  };

  const sortTodos = (todosToSort: Todo[]) => {
    return [...todosToSort].sort((a, b) => {
      switch (sortBy) {
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        
        case 'priority':
          const priorityOrder = { '긴급': 0, '높음': 1, '보통': 2, '낮음': 3 };
          const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2;
          const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2;
          return aPriority - bPriority;
        
        case 'title':
          return a.title.localeCompare(b.title);
        
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        
        default:
          return 0;
      }
    });
  };

  if (loading) return <LoadingSpinner message="할일 목록을 불러오는 중..." />;
  if (error) return <ErrorDisplay message={error} onRetry={fetchTodos} />;

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
              <Box>
                <Typography 
                  variant="h4" 
                  component="h1"
                  sx={{
                    fontWeight: 700,
                    color: 'white',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  할일 목록
                  {filterDate && (
                    <Typography 
                      component="span" 
                      variant="h6"
                      sx={{ 
                        ml: 2, 
                        color: 'rgba(255,255,255,0.8)',
                        fontWeight: 400 
                      }}
                    >
                      ({new Date(filterDate).toLocaleDateString()} 기준)
                    </Typography>
                  )}
                </Typography>
                {filterDate && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate('/todos')}
                    sx={{ 
                      mt: 1, 
                      color: 'white', 
                      borderColor: 'white',
                      '&:hover': { 
                        borderColor: 'white', 
                        bgcolor: 'rgba(255,255,255,0.1)' 
                      } 
                    }}
                  >
                    필터 제거
                  </Button>
                )}
              </Box>
              {planners.length === 0 ? (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/planners')}
                  size="large"
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    borderRadius: 2,
                    px: 3,
                    py: 1.5,
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '1rem',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  플래너 만들기
                </Button>
              ) : (
                hasPermission('todo_create') && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateDialogOpen(true)}
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
                    새 할일 만들기
                  </Button>
                )
              )}
            </Box>
          </Slide>

          <Slide direction="up" in={animateIn} timeout={800}>
            <Box>
              {/* 통합 검색 및 필터링 */}
              <AdvancedSearchFilter
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                searchType={searchType}
                onSearchTypeChange={setSearchType}
                showAdvancedFilters={showAdvancedFilters}
                onAdvancedFiltersToggle={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                {/* 고급 필터 영역 */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>상태 필터</InputLabel>
                    <Select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      label="상태 필터"
                    >
                      <MenuItem value="all">모든 상태</MenuItem>
                      <MenuItem value="진행중">진행중</MenuItem>
                      <MenuItem value="완료">완료</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>팀 필터</InputLabel>
                    <Select
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      label="팀 필터"
                    >
                      <MenuItem value="all">모든 팀</MenuItem>
                      {teams.map(team => (
                        <MenuItem key={team.id} value={team.id.toString()}>
                          {team.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>정렬</InputLabel>
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      label="정렬"
                    >
                      {sortOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </AdvancedSearchFilter>
              
              <Box display="flex" flexDirection="column" gap={3}>
                {sortTodos(getFilteredTodos()).map((todo, index) => (
                <Fade in={animateIn} timeout={1000 + index * 100} key={todo.id}>
                  <Paper
                    elevation={8}
                    sx={{
                      borderRadius: 3,
                      background: darkMode ? 'rgba(45,45,45,0.95)' : 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(20px)',
                      border: darkMode ? '1px solid rgba(64,64,64,0.3)' : '1px solid rgba(255,255,255,0.3)',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
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
                              {todo.title}
                              {planners.find(p => p.id === todo.planner_id) && (
                                <Typography 
                                  component="span" 
                                  variant="body2" 
                                  color="text.secondary" 
                                  sx={{ fontWeight: 'normal' }}
                                >
                                  | {planners.find(p => p.id === todo.planner_id)?.title}
                                </Typography>
                              )}
                            </Typography>
                          </Box>
                          
                          {todo.description && (
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
                              {todo.description}
                            </Typography>
                          )}
                        </Box>
                        
                        <Box display="flex" gap={1} flexWrap="wrap">
                          <Chip 
                            label={todo.is_completed ? '완료' : '진행중'}
                            color={todo.is_completed ? 'success' : 'primary'}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                          <Chip 
                            label={todo.priority} 
                            size="small" 
                            color={
                              todo.priority === '긴급' ? 'error' : 
                              todo.priority === '높음' ? 'warning' : 
                              todo.priority === '보통' ? 'info' : 'success'
                            }
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                      </Box>
                      
                      <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                        {todo.due_date && (
                          <Chip 
                            icon={<CalendarIcon />}
                            label={`마감일: ${new Date(todo.due_date).toLocaleDateString()}`} 
                            size="small" 
                            variant="outlined"
                            sx={{ fontWeight: 500 }}
                          />
                        )}
                        {todo.assignee_names && todo.assignee_names.length > 0 && (
                          <Chip 
                            icon={<PersonIcon />}
                            label={`담당자: ${todo.assignee_names.join(', ')}`} 
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
                        생성일: {new Date(todo.created_at).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                    
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => navigate(`/todos/${todo.id}`)}
                        sx={{
                          fontWeight: 600,
                          textTransform: 'none',
                          borderRadius: 2,
                        }}
                      >
                        상세보기
                      </Button>
                      
                      {/* 생성자만 수정/삭제 가능 */}
                      {canEditTodo(todo) && (
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => navigate(`/todos/${todo.id}/edit`)}
                          sx={{
                            fontWeight: 600,
                            textTransform: 'none',
                            borderRadius: 2,
                          }}
                        >
                          수정
                        </Button>
                      )}
                      
                      {canDeleteTodo(todo) && (
                        <Button
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteTodo(todo.id)}
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
              
              {sortTodos(getFilteredTodos()).length === 0 && (
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
                    }}
                  >
                    <AssignmentIcon sx={{ fontSize: 64, color: darkMode ? '#b0b0b0' : 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {planners.length === 0 ? '플래너가 없습니다' : (searchTerm || selectedTeam !== 'all' || selectedStatus !== 'all' ? '검색 결과가 없습니다' : '할일이 없습니다')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      {planners.length === 0
                        ? '할일을 만들려면 먼저 플래너를 만들어주세요.'
                        : (searchTerm || selectedTeam !== 'all' || selectedStatus !== 'all' ? '다른 검색어나 필터를 시도해보세요.' : '새로운 할일을 만들어보세요!')
                      }
                    </Typography>
                    {planners.length === 0 && (
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/planners')}
                        sx={{
                          background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                          borderRadius: 2,
                          px: 3,
                          py: 1.5,
                          fontWeight: 600,
                          textTransform: 'none',
                        }}
                      >
                        플래너 만들기
                      </Button>
                    )}
                  </Paper>
                </Fade>
              )}
              </Box>
            </Box>
          </Slide>
        </Container>
      </Box>

      {/* 할일 생성 다이얼로그 */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(20px)',
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 600, 
          color: darkMode ? '#ffffff' : '#2c3e50',
          borderBottom: '1px solid rgba(0,0,0,0.1)',
        }}>
          새 할일 만들기
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="할일 제목"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
            
            <TextField
              label="설명"
              value={newTodoDescription}
              onChange={(e) => setNewTodoDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
            
            <FormControl fullWidth>
              <InputLabel>플래너</InputLabel>
              <Select
                value={newTodoPlannerId}
                onChange={(e) => handlePlannerChange(e.target.value as number)}
                label="플래너"
                required
                sx={{
                  borderRadius: 2,
                }}
              >
                {planners.map((planner) => (
                  <MenuItem key={planner.id} value={planner.id}>
                    {planner.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* 담당자 선택 (플래너가 선택된 경우에만 표시) */}
            {newTodoPlannerId && teamMembers.length > 0 && hasPermission('todo_assign') && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                  담당자 선택
                </Typography>
                
                {/* 개별 사용자 선택 */}
                <FormControl fullWidth>
                  <InputLabel>담당자 선택 (여러 명 선택 가능)</InputLabel>
                  <Select
                    multiple
                    value={newTodoAssignedTo}
                    onChange={(e) => setNewTodoAssignedTo(e.target.value as number[])}
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
            
            <FormControl fullWidth>
              <InputLabel>우선순위</InputLabel>
              <Select
                value={newTodoPriority}
                onChange={(e) => setNewTodoPriority(e.target.value)}
                label="우선순위"
                sx={{
                  borderRadius: 2,
                }}
              >
                <MenuItem value="긴급">긴급</MenuItem>
                <MenuItem value="높음">높음</MenuItem>
                <MenuItem value="보통">보통</MenuItem>
                <MenuItem value="낮음">낮음</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              label="마감일"
              type="date"
              value={newTodoDueDate}
              onChange={(e) => setNewTodoDueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={() => setCreateDialogOpen(false)}
            sx={{
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
            }}
          >
            취소
          </Button>
          <Button 
            onClick={handleCreateTodo}
            variant="contained"
            sx={{
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
            }}
          >
            할일 생성
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TodosPage; 