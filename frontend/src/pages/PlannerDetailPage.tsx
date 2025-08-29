import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  ListItemIcon,
  Checkbox,
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
  TextField as MuiTextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Collapse,
  Paper,
  Divider,
  Fade,
  Grow,
  Slide,
  useTheme as useMuiTheme,
  useMediaQuery,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  KeyboardArrowUp as ArrowUpIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Flag as FlagIcon,
  Group as GroupIcon,
  Schedule as ScheduleIcon,
  Description as DescriptionIcon,
  PriorityHigh as PriorityIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { usePermissions } from '../hooks/usePermissions';
import { plannerAPI, todoAPI, teamAPI } from '../services/api';
import { Planner, Todo, TeamMember } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import Navbar from '../components/Navbar';
import QuickDateSelect from '../components/QuickDateSelect';
import { getDetailedDeadlineText } from '../utils/dateUtils';

const PlannerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [planner, setPlanner] = useState<Planner | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addTodoDialogOpen, setAddTodoDialogOpen] = useState(false);
  const [editTodoDialogOpen, setEditTodoDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [animateIn, setAnimateIn] = useState(false);
  const [todoFormData, setTodoFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    assigned_to: [] as number[],
  });

  // 권한 관리
  const { hasPermission, canEditContent } = usePermissions(planner?.team_id);

  // 검색, 필터링, 정렬 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'due_date' | 'priority' | 'title' | 'created_at'>('due_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const { darkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  useEffect(() => {
    setAnimateIn(true);
  }, []);

  // 현재 사용자가 담당자인 할일만 필터링 (useMemo로 최적화)
  const getMyTodos = useMemo(() => {
    const currentUserId = currentUser?.id;
    
    // 현재 사용자가 담당자인 할일 또는 담당자가 없는 할일 필터링
    const myTodos = todos.filter(todo => {
      const isAssigned = todo.assigned_to && todo.assigned_to.includes(currentUserId || 0);
      const isCreator = todo.created_by === currentUserId;
      const hasNoAssignee = !todo.assigned_to || todo.assigned_to.length === 0;
      const shouldShow = isAssigned || isCreator || hasNoAssignee;
      
      return shouldShow;
    });
    
    return myTodos;
  }, [todos, currentUser?.id]);

  // 검색, 필터링, 정렬된 할일 목록
  const filteredAndSortedTodos = useMemo(() => {
    let filtered = getMyTodos;

    // 검색 필터링
    if (searchTerm) {
      filtered = filtered.filter(todo =>
        todo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (todo.description && todo.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 상태 필터링
    if (statusFilter !== 'all') {
      filtered = filtered.filter(todo => {
        if (statusFilter === 'completed') return todo.is_completed;
        if (statusFilter === 'pending') return !todo.is_completed;
        return true;
      });
    }

    // 우선순위 필터링
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(todo => todo.priority === priorityFilter);
    }

    // 정렬
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'due_date':
          if (!a.due_date && !b.due_date) comparison = 0;
          else if (!a.due_date) comparison = 1;
          else if (!b.due_date) comparison = -1;
          else comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
        case 'priority':
          const priorityOrder = { '긴급': 0, '높음': 1, '보통': 2, '낮음': 3 };
          const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2;
          const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2;
          comparison = aPriority - bPriority;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [getMyTodos, searchTerm, statusFilter, priorityFilter, sortBy, sortOrder]);

  // 필터 초기화
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setSortBy('due_date');
    setSortOrder('asc');
  };

  const fetchPlanner = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const [plannerData, todosData] = await Promise.all([
        plannerAPI.getPlanner(parseInt(id)),
        todoAPI.getTodos(parseInt(id)),
      ]);
      setPlanner(plannerData);
      setTodos(todosData);
      
      // 팀 멤버 목록 가져오기
      if (plannerData.team_id) {
        try {
          const teamData = await teamAPI.getTeam(plannerData.team_id);
          setTeamMembers(teamData.members || []);
        } catch (err) {
          console.error('Error fetching team data:', err);
        }
      }
    } catch (err: any) {
      setError('플래너 정보를 불러오는데 실패했습니다.');
      console.error('Error fetching planner:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPlanner();
  }, [id, fetchPlanner]);

  const handleAddTodo = async () => {
    console.log('handleAddTodo 함수가 호출되었습니다!');
    console.log('planner:', planner);
    console.log('todoFormData:', todoFormData);
    
    if (!planner || !todoFormData.title) {
      console.log('Validation failed:', { planner: !!planner, title: !!todoFormData.title });
      return;
    }
    
    try {
      // 날짜만 사용 (시간 제거)
      let dueDate = null;
      if (todoFormData.due_date) {
        dueDate = todoFormData.due_date; // YYYY-MM-DD 형식 그대로 사용
      }

      const todoData = {
        title: todoFormData.title,
        description: todoFormData.description || null,
        planner_id: planner.id,
        priority: getPriorityValue(todoFormData.priority),
        due_date: dueDate,
        assigned_to: todoFormData.assigned_to.length > 0 ? todoFormData.assigned_to : null,
      };
      
      console.log('assigned_to 배열 길이:', todoFormData.assigned_to.length);
      console.log('assigned_to 배열 내용:', todoFormData.assigned_to);
      console.log('최종 assigned_to 값:', todoData.assigned_to);
      console.log('담당자 선택 여부:', todoFormData.assigned_to.length > 0 ? '선택됨' : '선택 안됨');
      
      console.log('Sending todo data:', todoData);
      console.log('Form data:', todoFormData);
      
      const result = await todoAPI.createTodo(todoData);
      console.log('Todo created successfully:', result);
      
      setAddTodoDialogOpen(false);
      setTodoFormData({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        assigned_to: [],
      });
      fetchPlanner();
    } catch (err: any) {
      console.error('Error adding todo:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      alert(`할일 추가에 실패했습니다: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleToggleTodo = async (todoId: number) => {
    try {
      await todoAPI.toggleCompletion(todoId);
      fetchPlanner();
    } catch (err) {
      console.error('Error toggling todo:', err);
    }
  };

  const handleDeleteTodo = async (todoId: number) => {
    console.log('삭제 버튼 클릭됨, todoId:', todoId);
    
    if (!window.confirm('정말로 이 할 일을 삭제하시겠습니까?')) {
      console.log('사용자가 삭제를 취소함');
      return;
    }
    
    try {
      console.log('할일 삭제 API 호출 시작, todoId:', todoId);
      await todoAPI.deleteTodo(todoId);
      console.log('할일 삭제 성공');
      fetchPlanner();
    } catch (err: any) {
      console.error('Error deleting todo:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      alert(`할일 삭제에 실패했습니다: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleEditTodo = (todo: Todo) => {
    setEditingTodo(todo);
    
    // 할일 데이터를 폼에 설정
    const dueDate = todo.due_date ? new Date(todo.due_date).toISOString().split('T')[0] : '';
    
    setTodoFormData({
      title: todo.title,
      description: todo.description || '',
      priority: getPriorityValue(todo.priority),
      due_date: dueDate,
      assigned_to: todo.assigned_to || [],
    });
    
    setEditTodoDialogOpen(true);
  };

  const handleUpdateTodo = async () => {
    if (!editingTodo || !todoFormData.title) {
      return;
    }
    
    try {
      // 날짜만 사용 (시간 제거)
      let dueDate = null;
      if (todoFormData.due_date) {
        dueDate = todoFormData.due_date; // YYYY-MM-DD 형식 그대로 사용
      }

      const todoData = {
        title: todoFormData.title,
        description: todoFormData.description || null,
        priority: todoFormData.priority, // 이미 영어 값이므로 그대로 사용
        due_date: dueDate,
        assigned_to: todoFormData.assigned_to.length > 0 ? todoFormData.assigned_to : null,
      };
      
      await todoAPI.updateTodo(editingTodo.id, todoData);
      setEditTodoDialogOpen(false);
      setEditingTodo(null);
      setTodoFormData({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        assigned_to: [],
      });
      fetchPlanner();
    } catch (err: any) {
      console.error('Error updating todo:', err);
      alert(`할일 수정에 실패했습니다: ${err.response?.data?.detail || err.message}`);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
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
      case 'low':
        return '낮음';
      case 'urgent':
        return '긴급';
      default:
        return priority;
    }
  };

  const getPriorityValue = (priority: string) => {
    switch (priority) {
      case '높음':
        return 'high';
      case '보통':
        return 'medium';
      case '낮음':
        return 'low';
      case '긴급':
        return 'urgent';
      default:
        return 'medium';
    }
  };

  if (loading) return <LoadingSpinner message="플래너 정보를 불러오는 중..." />;
  if (error) return <ErrorDisplay message={error} onRetry={fetchPlanner} />;
  if (!planner) return <ErrorDisplay message="플래너를 찾을 수 없습니다." onRetry={() => navigate('/planners')} />;

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
                onClick={() => navigate('/planners')}
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
                {planner.title}
              </Typography>
            </Box>
          </Slide>

          <Slide direction="up" in={animateIn} timeout={800}>
            <Fade in={animateIn} timeout={1000}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
                {/* 플래너 정보 */}
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
                  <Box sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" mb={3}>
                      <AssignmentIcon sx={{ mr: 2, color: 'primary.main', fontSize: 28 }} />
                      <Typography 
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: darkMode ? '#ffffff' : '#2c3e50',
                        }}
                      >
                        플래너 정보
                      </Typography>
                    </Box>
                    <Typography 
                      variant="body1" 
                      mb={3}
                      sx={{
                        lineHeight: 1.6,
                        color: darkMode ? '#ffffff' : '#2c3e50',
                      }}
                    >
                      {planner.description}
                    </Typography>
                    <Box display="flex" gap={1} mb={3} flexWrap="wrap">
                      <Chip 
                        label={planner.status} 
                        color={planner.status === '완료' ? 'success' : 'primary'}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                      {planner.team_name && (
                        <Chip 
                          label={planner.team_name} 
                          size="small" 
                          variant="outlined"
                          icon={<GroupIcon />}
                          sx={{ fontWeight: 600 }}
                        />
                      )}
                    </Box>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <ScheduleIcon sx={{ fontSize: 16, color: darkMode ? '#b0b0b0' : 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        {planner.deadline ? getDetailedDeadlineText(planner.deadline) : '마감일 미정'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      생성일: {new Date(planner.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Paper>

                {/* 할 일 목록 */}
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
                  <Box sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                      <Typography 
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: darkMode ? '#ffffff' : '#2c3e50',
                        }}
                      >
                        내 할 일 목록 ({filteredAndSortedTodos.length}개)
                      </Typography>
                      {hasPermission('todo_create') && (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => {
                            console.log('할일 추가 버튼 클릭됨');
                            setAddTodoDialogOpen(true);
                          }}
                          sx={{
                            borderRadius: 2,
                            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                            '&:hover': {
                              background: 'linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)',
                            }
                          }}
                        >
                          할 일 추가
                        </Button>
                      )}
                    </Box>

                    {/* 검색 및 필터 컨트롤 */}
                    <Box sx={{ mb: 3 }}>
                      {/* 검색창과 정렬 */}
                      <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="할 일 검색..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          sx={{
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
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchIcon />
                              </InputAdornment>
                            ),
                            endAdornment: searchTerm && (
                              <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setSearchTerm('')}>
                                  <ClearIcon />
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                        
                        {/* 정렬 드롭다운 */}
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                          <Select
                            value={`${sortBy}-${sortOrder}`}
                            onChange={(e) => {
                              const [newSortBy, newSortOrder] = e.target.value.split('-');
                              setSortBy(newSortBy as 'due_date' | 'priority' | 'title' | 'created_at');
                              setSortOrder(newSortOrder as 'asc' | 'desc');
                            }}
                            displayEmpty
                            sx={{ 
                              fontSize: '0.8rem',
                              borderRadius: 2,
                              '& .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'rgba(0,0,0,0.2)',
                              },
                              '&:hover .MuiOutlinedInput-notchedOutline': {
                                borderColor: 'primary.main',
                              },
                              '& .MuiSelect-select': { 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 0.5,
                                fontSize: '0.8rem'
                              } 
                            }}
                          >
                            <MenuItem value="due_date-asc" sx={{ fontSize: '0.8rem' }}>
                              <ScheduleIcon fontSize="small" />
                              마감일순 ↑
                            </MenuItem>
                            <MenuItem value="due_date-desc" sx={{ fontSize: '0.8rem' }}>
                              <ScheduleIcon fontSize="small" />
                              마감일순 ↓
                            </MenuItem>
                            <MenuItem value="priority-asc" sx={{ fontSize: '0.8rem' }}>
                              <SortIcon fontSize="small" />
                              우선순위순 ↑
                            </MenuItem>
                            <MenuItem value="priority-desc" sx={{ fontSize: '0.8rem' }}>
                              <SortIcon fontSize="small" />
                              우선순위순 ↓
                            </MenuItem>
                            <MenuItem value="title-asc" sx={{ fontSize: '0.8rem' }}>
                              <AssignmentIcon fontSize="small" />
                              제목순 ↑
                            </MenuItem>
                            <MenuItem value="title-desc" sx={{ fontSize: '0.8rem' }}>
                              <AssignmentIcon fontSize="small" />
                              제목순 ↓
                            </MenuItem>
                            <MenuItem value="created_at-asc" sx={{ fontSize: '0.8rem' }}>
                              <ScheduleIcon fontSize="small" />
                              생성일순 ↑
                            </MenuItem>
                            <MenuItem value="created_at-desc" sx={{ fontSize: '0.8rem' }}>
                              <ScheduleIcon fontSize="small" />
                              생성일순 ↓
                            </MenuItem>
                          </Select>
                        </FormControl>
                      </Box>

                      {/* 필터 버튼들 */}
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {/* 상태 필터 버튼 */}
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<FilterListIcon />}
                          onClick={() => {
                            if (statusFilter === 'all') setStatusFilter('pending');
                            else if (statusFilter === 'pending') setStatusFilter('completed');
                            else setStatusFilter('all');
                          }}
                          sx={{ 
                            minWidth: 'auto', 
                            px: 2, 
                            whiteSpace: 'nowrap',
                            fontSize: '0.8rem',
                            borderRadius: 2,
                            borderColor: statusFilter === 'all' ? 'grey.300' : 
                                        statusFilter === 'pending' ? 'green.main' : 'red.main',
                            color: statusFilter === 'all' ? 'text.primary' : 
                                   statusFilter === 'pending' ? 'green.main' : 'red.main',
                            '&:hover': {
                              borderColor: statusFilter === 'all' ? 'grey.400' : 
                                          statusFilter === 'pending' ? 'green.dark' : 'red.dark',
                              backgroundColor: statusFilter === 'all' ? 'grey.50' : 
                                            statusFilter === 'pending' ? 'green.50' : 'red.50'
                            }
                          }}
                        >
                          상태: {statusFilter === 'all' ? '전체' : statusFilter === 'pending' ? '진행중' : '완료'}
                        </Button>

                        {/* 우선순위 필터 버튼 */}
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<FlagIcon />}
                          onClick={() => {
                            if (priorityFilter === 'all') setPriorityFilter('긴급');
                            else if (priorityFilter === '긴급') setPriorityFilter('높음');
                            else if (priorityFilter === '높음') setPriorityFilter('보통');
                            else if (priorityFilter === '보통') setPriorityFilter('낮음');
                            else setPriorityFilter('all');
                          }}
                          sx={{ 
                            minWidth: 'auto', 
                            px: 2, 
                            whiteSpace: 'nowrap',
                            fontSize: '0.8rem',
                            borderRadius: 2,
                            borderColor: priorityFilter === 'all' ? 'grey.300' : 
                                        priorityFilter === '긴급' ? 'red.main' : 
                                        priorityFilter === '높음' ? 'orange.main' : 
                                        priorityFilter === '보통' ? 'yellow.main' : 'blue.main',
                            color: priorityFilter === 'all' ? 'text.primary' : 
                                   priorityFilter === '긴급' ? 'red.main' : 
                                   priorityFilter === '높음' ? 'orange.main' : 
                                   priorityFilter === '보통' ? 'yellow.dark' : 'blue.main',
                            '&:hover': {
                              borderColor: priorityFilter === 'all' ? 'grey.400' : 
                                          priorityFilter === '긴급' ? 'red.dark' : 
                                          priorityFilter === '높음' ? 'orange.dark' : 
                                          priorityFilter === '보통' ? 'yellow.dark' : 'blue.dark',
                              backgroundColor: priorityFilter === 'all' ? 'grey.50' : 
                                            priorityFilter === '긴급' ? 'red.50' : 
                                            priorityFilter === '높음' ? 'orange.50' : 
                                            priorityFilter === '보통' ? 'yellow.50' : 'blue.50'
                            }
                          }}
                        >
                          우선순위: {priorityFilter === 'all' ? '전체' : priorityFilter}
                        </Button>
                      </Box>

                      {/* 활성 필터 표시 */}
                      {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all') && (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mt: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            필터:
                          </Typography>
                          {searchTerm && (
                            <Chip
                              label={`검색: ${searchTerm}`}
                              size="small"
                              onDelete={() => setSearchTerm('')}
                              color="primary"
                              variant="outlined"
                            />
                          )}
                          {statusFilter !== 'all' && (
                            <Chip
                              label={`상태: ${statusFilter === 'pending' ? '진행중' : '완료'}`}
                              size="small"
                              onDelete={() => setStatusFilter('all')}
                              color="primary"
                              variant="outlined"
                            />
                          )}
                          {priorityFilter !== 'all' && (
                            <Chip
                              label={`우선순위: ${priorityFilter}`}
                              size="small"
                              onDelete={() => setPriorityFilter('all')}
                              color="primary"
                              variant="outlined"
                            />
                          )}
                          <Button
                            size="small"
                            startIcon={<ClearIcon />}
                            onClick={clearFilters}
                            color="inherit"
                            sx={{ fontSize: '0.75rem' }}
                          >
                            초기화
                          </Button>
                        </Box>
                      )}
                    </Box>
                    
                    <List>
                      {filteredAndSortedTodos.map((todo, index) => (
                        <ListItem key={todo.id} divider={index < filteredAndSortedTodos.length - 1}>
                          <ListItemIcon>
                            <Checkbox
                              checked={todo.is_completed}
                              onChange={() => handleToggleTodo(todo.id)}
                              icon={<RadioButtonUncheckedIcon />}
                              checkedIcon={<CheckCircleIcon />}
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    textDecoration: todo.is_completed ? 'line-through' : 'none',
                                    color: todo.is_completed ? 'text.secondary' : 'text.primary',
                                  }}
                                >
                                  {todo.title}
                                </Typography>
                                <Chip
                                  label={getPriorityLabel(todo.priority)}
                                  color={getPriorityColor(todo.priority) as 'error' | 'warning' | 'success' | 'default'}
                                  size="small"
                                />
                              </Box>
                            }
                            secondary={
                              <span>
                                {todo.description && (
                                  <Typography variant="body2" color="text.secondary" component="span">
                                    {todo.description}
                                  </Typography>
                                )}
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                  {todo.assignee_names && todo.assignee_names.length > 0 ? (
                                    todo.assignee_names.map((name, index) => (
                                      <Chip
                                        key={index}
                                        label={`담당: ${name}`}
                                        size="small"
                                        variant="outlined"
                                        color="primary"
                                      />
                                    ))
                                  ) : (
                                    <Typography variant="caption" color="text.secondary" component="span">
                                      담당자 없음
                                    </Typography>
                                  )}
                                </Box>
                                {todo.due_date && (
                                  <Typography variant="caption" color="text.secondary" component="span" sx={{ display: 'block', mt: 0.5 }}>
                                    {getDetailedDeadlineText(todo.due_date)}
                                  </Typography>
                                )}
                              </span>
                            }
                          />
                          {canEditContent(todo.created_by) && (
                            <IconButton
                              size="small"
                              onClick={() => handleEditTodo(todo)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                          )}
                          {hasPermission('todo_delete') && canEditContent(todo.created_by) && (
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteTodo(todo.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          )}
                        </ListItem>
                      ))}
                      {filteredAndSortedTodos.length === 0 && (
                        <ListItem>
                          <ListItemText
                            primary="할 일이 없습니다"
                            secondary="새로운 할 일을 추가해보세요"
                          />
                        </ListItem>
                      )}
                    </List>
                  </Box>
                </Paper>
              </Box>
            </Fade>
          </Slide>

          {/* 할 일 추가 다이얼로그 */}
          <Dialog open={addTodoDialogOpen} onClose={() => setAddTodoDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>할 일 추가</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                담당자를 지정하면 해당 사용자에게 할 일이 할당되어 책임을 명확히 할 수 있습니다.
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                label="제목"
                fullWidth
                variant="outlined"
                value={todoFormData.title}
                onChange={(e) => setTodoFormData({ ...todoFormData, title: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="설명"
                fullWidth
                variant="outlined"
                multiline
                rows={3}
                value={todoFormData.description}
                onChange={(e) => setTodoFormData({ ...todoFormData, description: e.target.value })}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>우선순위</InputLabel>
                <Select
                  value={todoFormData.priority}
                  label="우선순위"
                  onChange={(e) => setTodoFormData({ ...todoFormData, priority: e.target.value })}
                >
                  <MenuItem value="low">낮음</MenuItem>
                  <MenuItem value="medium">보통</MenuItem>
                  <MenuItem value="high">높음</MenuItem>
                  <MenuItem value="urgent">긴급</MenuItem>
                </Select>
              </FormControl>
              <Box sx={{ mb: 2 }}>
                <TextField
                  label="마감일"
                  type="date"
                  value={todoFormData.due_date}
                  onChange={(e) => setTodoFormData({ ...todoFormData, due_date: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 1 }}
                />
                <QuickDateSelect
                  onDateSelect={(date) => setTodoFormData({ ...todoFormData, due_date: date })}
                />
              </Box>
                  {/* 담당자 선택 (플래너가 선택된 경우에만 표시) */}
                  {planner?.team_id && teamMembers.length > 0 && hasPermission('todo_assign') && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                        담당자 선택
                      </Typography>
                      
                      {/* 개별 사용자 선택 */}
                      <FormControl fullWidth>
                        <InputLabel>담당자 선택 (여러 명 선택 가능)</InputLabel>
                        <Select
                          multiple
                          value={todoFormData.assigned_to}
                          onChange={(e) => setTodoFormData({
                            ...todoFormData,
                            assigned_to: e.target.value as number[]
                          })}
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
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setAddTodoDialogOpen(false)}>취소</Button>
              <Button 
                onClick={() => {
                  console.log('추가 버튼이 클릭되었습니다!');
                  handleAddTodo();
                }} 
                variant="contained"
              >
                추가
              </Button>
            </DialogActions>
          </Dialog>

          {/* 할 일 수정 다이얼로그 */}
          <Dialog open={editTodoDialogOpen} onClose={() => setEditTodoDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>할 일 수정</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                할 일 정보를 수정할 수 있습니다.
              </Typography>
              <TextField
                autoFocus
                margin="dense"
                label="제목"
                fullWidth
                variant="outlined"
                value={todoFormData.title}
                onChange={(e) => setTodoFormData({ ...todoFormData, title: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="설명"
                fullWidth
                variant="outlined"
                multiline
                rows={3}
                value={todoFormData.description}
                onChange={(e) => setTodoFormData({ ...todoFormData, description: e.target.value })}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>우선순위</InputLabel>
                <Select
                  value={todoFormData.priority}
                  label="우선순위"
                  onChange={(e) => setTodoFormData({ ...todoFormData, priority: e.target.value })}
                >
                  <MenuItem value="low">낮음</MenuItem>
                  <MenuItem value="medium">보통</MenuItem>
                  <MenuItem value="high">높음</MenuItem>
                  <MenuItem value="urgent">긴급</MenuItem>
                </Select>
              </FormControl>
              <Box sx={{ mb: 2 }}>
                <TextField
                  margin="dense"
                  label="마감일"
                  type="date"
                  fullWidth
                  variant="outlined"
                  value={todoFormData.due_date}
                  onChange={(e) => setTodoFormData({ ...todoFormData, due_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 1 }}
                />
                <QuickDateSelect
                  onDateSelect={(date) => setTodoFormData({ ...todoFormData, due_date: date })}
                />
              </Box>
              <FormControl fullWidth>
                <InputLabel>담당자 (여러 명 선택 가능)</InputLabel>
                <Select
                  multiple
                  value={todoFormData.assigned_to}
                  label="담당자 (여러 명 선택 가능)"
                  onChange={(e) => setTodoFormData({ ...todoFormData, assigned_to: e.target.value as number[] })}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as number[]).map((userId) => {
                        const member = teamMembers.find(m => m.user_id === userId);
                        return (
                          <Chip 
                            key={userId} 
                            label={member ? `사용자 ${userId} (${member.role})` : `사용자 ${userId}`}
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {teamMembers.map((member) => (
                    <MenuItem key={member.id} value={member.user_id}>
                      사용자 {member.user_id} ({member.role})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditTodoDialogOpen(false)}>취소</Button>
              <Button 
                onClick={handleUpdateTodo}
                variant="contained"
              >
                수정
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </>
  );
};

export default PlannerDetailPage; 