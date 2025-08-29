import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
  Flag as FlagIcon,
} from '@mui/icons-material';
import { Todo, Planner } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface CalendarProps {
  todos: Todo[];
  planners: Planner[];
  currentUserId?: number;
  onDateClick?: (date: Date) => void;
  onTodoClick?: (todo: Todo) => void;
  onPlannerClick?: (planner: Planner) => void;
}

const Calendar: React.FC<CalendarProps> = ({ todos, planners, currentUserId, onDateClick, onTodoClick, onPlannerClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { darkMode } = useTheme();

  // 현재 월의 첫 번째 날 계산
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

  // 달력에 표시할 날짜들 생성 (6주 x 7일)
  const calendarDays = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    calendarDays.push(date);
  }

  // 특정 날짜의 할 일들 가져오기 (담당자인 것만)
  const getTodosForDate = (date: Date) => {
    return todos.filter(todo => {
      if (!todo.due_date) return false;
      const todoDate = new Date(todo.due_date);
      
      // 년, 월, 일만 비교 (시간 제외)
      const todoYear = todoDate.getFullYear();
      const todoMonth = todoDate.getMonth();
      const todoDay = todoDate.getDate();
      
      const dateYear = date.getFullYear();
      const dateMonth = date.getMonth();
      const dateDay = date.getDate();
      
      return todoYear === dateYear && todoMonth === dateMonth && todoDay === dateDay;
    });
  };

  // 특정 날짜의 플래너들 가져오기 (마감일 기준)
  const getPlannersForDate = (date: Date) => {
    return planners.filter(planner => {
      if (!planner.deadline) return false;
      const plannerDate = new Date(planner.deadline);
      
      // 년, 월, 일만 비교 (시간 제외)
      const plannerYear = plannerDate.getFullYear();
      const plannerMonth = plannerDate.getMonth();
      const plannerDay = plannerDate.getDate();
      
      const dateYear = date.getFullYear();
      const dateMonth = date.getMonth();
      const dateDay = date.getDate();
      
      return plannerYear === dateYear && plannerMonth === dateMonth && plannerDay === dateDay;
    });
  };

  // 이전/다음 월 이동
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // 오늘 날짜인지 확인
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // 현재 월의 날짜인지 확인
  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  // 날짜가 지났는지 확인 (마감일 지남)
  const isOverdue = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  // 우선순위에 따른 색상 반환
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case '긴급': return 'error';
      case '높음': return 'warning';
      case '보통': return 'info';
      case '낮음': return 'default';
      default: return 'info';
    }
  };

  // 우선순위에 따른 배경색 반환
  const getPriorityBgColor = (priority: string) => {
    switch (priority) {
      case '긴급': return 'error.main';
      case '높음': return 'warning.main';
      case '보통': return 'info.main';
      case '낮음': return 'grey.500';
      default: return 'info.main';
    }
  };

  // 플래너 상태에 따른 색상 반환
  const getPlannerStatusColor = (status: string) => {
    switch (status) {
      case '진행중': return 'primary';
      case '대기중': return 'warning';
      case '완료': return 'success';
      default: return 'default';
    }
  };

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <Card>
               <CardContent sx={{ p: 1 }}>
                 {/* 달력 헤더 */}
         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="h6" component="h2">
            <EventIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
          </Typography>
          <Box>
            <IconButton onClick={goToPreviousMonth} size="small">
              <ChevronLeftIcon />
            </IconButton>
            <IconButton onClick={goToNextMonth} size="small">
              <ChevronRightIcon />
            </IconButton>
          </Box>
        </Box>

                 {/* 요일 헤더 */}
         <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.3, mb: 0.5 }}>
           {dayNames.map((day) => (
             <Box
               key={day}
               sx={{
                 p: 0.15,
                 textAlign: 'center',
                 fontWeight: 'bold',
                 color: darkMode 
                   ? (day === '일' ? '#ff6b6b' : day === '토' ? '#74b9ff' : '#ffffff')
                   : (day === '일' ? 'error.main' : day === '토' ? 'primary.main' : 'text.primary'),
                 fontSize: '1.2rem',
                 bgcolor: darkMode ? '#2d2d2d' : 'grey.50',
                 borderRadius: 0.5,
                 border: '1px solid',
                 borderColor: darkMode ? '#404040' : 'grey.200',
               }}
             >
               {day}
             </Box>
           ))}
         </Box>

                 {/* 달력 그리드 */}
         <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.3 }}>
          {calendarDays.map((date, index) => {
            const dayTodos = getTodosForDate(date);
            const dayPlanners = getPlannersForDate(date);

            return (
              <Box
                key={index}
                                 sx={{
                   aspectRatio: '1.415',
                   p: 2,
                   border: '1px solid',
                   borderColor: darkMode ? '#404040' : 'grey.200',
                   borderRadius: 0.5,
                   cursor: onDateClick ? 'pointer' : 'default',
                   bgcolor: darkMode
                     ? (isToday(date) ? '#1976d2' : !isCurrentMonth(date) ? '#1a1a1a' : '#2d2d2d')
                     : (isToday(date) ? 'primary.light' : !isCurrentMonth(date) ? 'grey.50' : 'white'),
                   color: darkMode
                     ? (isCurrentMonth(date) ? '#ffffff' : '#666666')
                     : (isCurrentMonth(date) ? 'text.primary' : 'text.disabled'),
                   '&:hover': onDateClick ? { 
                     bgcolor: darkMode
                       ? (isToday(date) ? '#1565c0' : '#3d3d3d')
                       : (isToday(date) ? 'primary.200' : 'grey.100'),
                     transform: 'scale(1.02)',
                     transition: 'all 0.2s ease-in-out'
                   } : {},
                   position: 'relative',
                   minHeight: 95,
                   transition: 'all 0.2s ease-in-out',
                 }}
                onClick={() => onDateClick?.(date)}
              >
                                 {/* 날짜 */}
                 <Typography
                   variant="caption"
                   sx={{
                     fontWeight: isToday(date) ? 'bold' : 'normal',
                     color: isToday(date) ? 'white' : (darkMode ? '#ffffff' : 'inherit'),
                     fontSize: '0.7rem',
                     position: 'absolute',
                     top: 0,
                     right: 0,
                     width: 'auto',
                     height: 'auto',
                     pr: 0.5,
                     pt: 0.5,
                   }}
                 >
                   {date.getDate()}
                 </Typography>

                 {/* 이벤트 표시 */}
                 <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                   {dayTodos.slice(0, 3).map((todo, todoIndex) => {
                     const isTodoOverdue = todo.due_date && isOverdue(new Date(todo.due_date));
                     return (
                       <Tooltip
                         key={`todo-${todoIndex}`}
                         title={`${todo.title} (${todo.priority})${isTodoOverdue ? ' - 기한 지남' : ''}`}
                         arrow
                       >
                         <Chip
                           icon={todo.priority === '긴급' ? <FlagIcon sx={{ fontSize: '0.6rem' }} /> : undefined}
                           label={todo.title.length > 5 ? `${todo.title.substring(0, 5)}...` : todo.title}
                           size="small"
                           color={getPriorityColor(todo.priority) as any}
                           variant={isTodoOverdue ? 'filled' : 'filled'}
                           sx={{
                             fontSize: '0.6rem',
                             height: 16,
                             '& .MuiChip-label': { px: 0.5 },
                             cursor: 'pointer',
                             '&:hover': { opacity: 0.8 },
                             bgcolor: isTodoOverdue 
                               ? (darkMode ? '#1a1a1a' : '#2d2d2d') 
                               : getPriorityBgColor(todo.priority),
                             color: isTodoOverdue 
                               ? (darkMode ? '#888888' : '#666666') 
                               : 'white',
                             zIndex: 1,
                             position: 'relative',
                             boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                           }}
                           onClick={(e) => {
                             e.stopPropagation();
                             onTodoClick?.(todo);
                           }}
                         />
                       </Tooltip>
                     );
                   })}
                   
                   {dayPlanners.slice(0, 2).map((planner, plannerIndex) => {
                     const isPlannerOverdue = planner.deadline && isOverdue(new Date(planner.deadline));
                     return (
                       <Tooltip
                         key={`planner-${plannerIndex}`}
                         title={`${planner.title} (${planner.status})${isPlannerOverdue ? ' - 기한 지남' : ''}`}
                         arrow
                       >
                         <Chip
                           icon={<AssignmentIcon sx={{ fontSize: '0.6rem' }} />}
                           label={planner.title.length > 5 ? `${planner.title.substring(0, 5)}...` : planner.title}
                           size="small"
                           variant={isPlannerOverdue ? 'filled' : 'outlined'}
                           color={getPlannerStatusColor(planner.status) as any}
                           sx={{
                             fontSize: '0.6rem',
                             height: 16,
                             '& .MuiChip-label': { px: 0.5 },
                             cursor: 'pointer',
                             '&:hover': { opacity: 0.8 },
                             bgcolor: isPlannerOverdue 
                               ? (darkMode ? '#1a1a1a' : '#2d2d2d') 
                               : (darkMode ? '#3d3d3d' : 'white'),
                             color: isPlannerOverdue 
                               ? (darkMode ? '#888888' : '#666666') 
                               : (darkMode ? '#ffffff' : 'text.primary'),
                             border: '1px solid',
                             borderColor: isPlannerOverdue 
                               ? (darkMode ? '#333333' : '#444444') 
                               : (darkMode ? '#555555' : 'grey.300'),
                             zIndex: 1,
                             position: 'relative',
                             boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                           }}
                           onClick={(e) => {
                             e.stopPropagation();
                             onPlannerClick?.(planner);
                           }}
                         />
                       </Tooltip>
                     );
                   })}

                                     {(dayTodos.length > 3 || dayPlanners.length > 2) && (
                     <Typography
                       variant="caption"
                       sx={{
                         fontSize: '0.5rem',
                         color: darkMode ? '#b0b0b0' : 'text.secondary',
                         display: 'block',
                       }}
                     >
                       +{dayTodos.length + dayPlanners.length - 5}개 더
                     </Typography>
                   )}
                </Box>
              </Box>
            );
          })}
        </Box>

      </CardContent>
    </Card>
  );
};

export default Calendar; 