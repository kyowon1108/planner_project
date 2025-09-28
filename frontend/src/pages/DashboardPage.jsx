import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  FormControl,
  Select,
  MenuItem,
  Divider,
  Grow,
} from "@mui/material";
import {
  Assignment,
  CheckCircle,
  Article,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { plannerAPI, todoAPI, postAPI, teamAPI } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorDisplay from "../components/ErrorDisplay.jsx";
import Navbar from "../components/Navbar.jsx";
import Calendar from "../components/Calendar.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useTheme } from "../contexts/ThemeContext.jsx";

const CARD_GAP = 3; // 24px

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const [teams, setTeams] = useState([]);
  const [planners, setPlanners] = useState([]);
  const [todos, setTodos] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [encouragementIndex, setEncouragementIndex] = useState(0);

  // 격려 메시지 생성 (단순화)
  const generateEncouragementMessage = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // 오늘 마감인 할일들
    const todayTodos = todos.filter(todo => {
      if (!todo.due_date || todo.is_completed) return false;
      const dueDate = new Date(todo.due_date);
      const dueDateStr = dueDate.toISOString().split('T')[0];
      return dueDateStr === todayStr;
    });

    // 내일 마감인 할일들
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const tomorrowTodos = todos.filter(todo => {
      if (!todo.due_date || todo.is_completed) return false;
      const dueDate = new Date(todo.due_date);
      const dueDateStr = dueDate.toISOString().split('T')[0];
      return dueDateStr === tomorrowStr;
    });

    // 할일 기반 응원 메시지
    if (todayTodos.length > 0) {
      return {
        title: "🔥 오늘 마감인 할일이 있어요!",
        subtitle: `${todayTodos.length}개의 할일을 완료해보세요!`,
        type: "urgent",
      };
    }

    if (tomorrowTodos.length > 0) {
      return {
        title: "⏰ 내일 마감인 할일이 있어요!",
        subtitle: `${tomorrowTodos.length}개의 할일을 미리 준비해보세요!`,
        type: "warning",
      };
    }

    // 기본 응원 메시지
    const defaultMessages = [
      {
        title: "🌟 오늘도 파이팅!",
        subtitle: "당신의 꾸준함이 정말 인상적이에요!",
        type: "default",
      },
      {
        title: "💫 오늘도 한 걸음씩 나아가고 계시네요!",
        subtitle: "작은 진전도 큰 성취예요!",
        type: "default",
      },
      {
        title: "🎯 할일을 하나씩 완료해보세요!",
        subtitle: "작은 성취가 큰 동기부여가 됩니다!",
        type: "default",
      },
    ];
    return defaultMessages[encouragementIndex % defaultMessages.length];
  };
  const currentEncouragement = generateEncouragementMessage();

  useEffect(() => {
    const interval = setInterval(() => {
      setEncouragementIndex((prev) => (prev + 1) % 3);
    }, 30000); // 30초마다 변경
    return () => clearInterval(interval);
  }, []);

  // 데이터 페치
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const teamsData = await teamAPI.getTeams();
      setTeams(teamsData);
      const plannersData = await plannerAPI.getPlanners();
      setPlanners(plannersData);
      const todosData = await todoAPI.getTodos();
      setTodos(todosData);
      const postsData = await postAPI.getPosts();
      setPosts(postsData);
    } catch (err) {
      setError("데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  const handleTeamChange = (event) => {
    const value = event.target.value;
    setSelectedTeamId(value === "" ? null : (value));
  };
  const handleTodoClick = (todo) => navigate(`/todos/${todo.id}`);
  const handlePlannerClick = (planner) => navigate(`/planners/${planner.id}`);
  const handleDateClick = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    navigate(`/todos?date=${dateStr}`);
  };

  const getFilteredPlanners = () => {
    return planners.filter((planner) => {
      // 팀 필터링
      if (selectedTeamId !== null && planner.team_id !== selectedTeamId) return false;
      
      // 상태 필터링 (진행중 또는 대기중)
      if (planner.status !== "진행중" && planner.status !== "대기중") return false;
      
      // 기한이 지난 플래너는 제외
      if (planner.deadline) {
        const endDate = new Date(planner.deadline);
        const now = new Date();
        
        // 날짜만 비교 (시간 무시)
        const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diffDays = Math.ceil((endDateOnly.getTime() - nowOnly.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) return false; // 기한이 지난 플래너 제외
      }
      
      return true;
    });
  };

  const getCalendarPlanners = () => {
    return planners.filter((planner) => {
      // 팀 필터링만 적용 (기한이 지난 것도 포함)
      if (selectedTeamId !== null && planner.team_id !== selectedTeamId) return false;
      return true;
    });
  };
      const sortPlanners = (ps) =>
    [...ps].sort((a, b) => {
      // 우선순위 > 일반
      const getPriority = (planner) => {
        if (!planner.deadline) return 1;
        
        const endDate = new Date(planner.deadline);
        const now = new Date();
        
        // 날짜만 비교 (시간 무시)
        const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diffDays = Math.ceil((endDateOnly.getTime() - nowOnly.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 7) return 0; // 임박 (플래너는 7일)
        return 1; // 일반
      };
      
      const priorityA = getPriority(a);
      const priorityB = getPriority(b);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // 같은 우선순위면 최신순
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const getFilteredTodos = () => {
    let filteredTodos = todos.filter((todo) => !todo.is_completed);
    
    // 기한이 지난 할일은 제외
    filteredTodos = filteredTodos.filter((todo) => {
      if (!todo.due_date) return true; // 마감일이 없는 할일은 포함
      
      const dueDate = new Date(todo.due_date);
      const now = new Date();
      
      // 날짜만 비교 (시간 무시)
      const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffDays = Math.ceil((dueDateOnly.getTime() - nowOnly.getTime()) / (1000 * 60 * 60 * 24));
      
      return diffDays >= 0; // 기한이 지나지 않은 할일만 포함
    });
    
    // 팀 필터링
    if (selectedTeamId !== null) {
      const teamPlannerIds = planners
        .filter((planner) => planner.team_id === selectedTeamId)
        .map((planner) => planner.id);
      filteredTodos = filteredTodos.filter((todo) => teamPlannerIds.includes(todo.planner_id));
    }
    
    return filteredTodos;
  };

  const getCalendarTodos = () => {
    let filteredTodos = todos.filter((todo) => !todo.is_completed);
    
    // 팀 필터링만 적용 (기한이 지난 것도 포함)
    if (selectedTeamId !== null) {
      const teamPlannerIds = planners
        .filter((planner) => planner.team_id === selectedTeamId)
        .map((planner) => planner.id);
      filteredTodos = filteredTodos.filter((todo) => teamPlannerIds.includes(todo.planner_id));
    }
    
    return filteredTodos;
  };
  const sortTodos = (ts) =>
    [...ts].sort((a, b) => {
      // 우선순위 > 일반
      const getPriority = (todo) => {
        if (!todo.due_date) return 1;
        
        const dueDate = new Date(todo.due_date);
        const now = new Date();
        
        // 날짜만 비교 (시간 무시)
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diffDays = Math.ceil((dueDateOnly.getTime() - nowOnly.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 3) return 0; // 임박
        return 1; // 일반
      };
      
      const priorityA = getPriority(a);
      const priorityB = getPriority(b);
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // 같은 우선순위면 최신순
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const getFilteredPosts = () => {
    if (selectedTeamId === null) return posts;
    return posts.filter((post) => post.team_id === selectedTeamId);
  };
  const sortPosts = (ps) =>
    [...ps].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  if (loading) return <LoadingSpinner message="대시보드를 불러오는 중..." />;
  if (error) return <ErrorDisplay message={error} onRetry={fetchData} />;

  const recentPlanners = sortPlanners(getFilteredPlanners());
  const recentTodos = sortTodos(getFilteredTodos());
  const recentPosts = sortPosts(getFilteredPosts());

  return (
    <>
      <Navbar />
              <Box
          sx={{
            minHeight: "100vh",
            background: darkMode
              ? "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)"
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            pt: 3,
            pb: 4,
            overflowX: "hidden",
          }}
        >
        <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
          {/* 상단 격려 + 팀 선택 */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 2 }}>
            <Box
              sx={{
                flex: 1,
                background: darkMode
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(255,255,255,0.13)",
                borderRadius: 2,
                px: 3,
                py: 2,
                mr: 2,
                color: "white",
                minHeight: "80px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  textShadow: "0 2px 8px rgba(54,54,54,0.18)",
                  mb: 1,
                  letterSpacing: "-0.5px",
                }}
              >
                {currentEncouragement.title}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 400,
                  opacity: 0.96,
                  textShadow: "0 1px 4px rgba(80,80,80,0.11)",
                  mb: 0,
                }}
              >
                {currentEncouragement.subtitle}
              </Typography>
            </Box>
            <FormControl sx={{
              minWidth: 200,
              bgcolor: darkMode ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.1)",
              borderRadius: 1
            }}>
              <Select
                value={selectedTeamId || ""}
                onChange={handleTeamChange}
                displayEmpty
                sx={{
                  color: "white",
                  ".MuiSelect-icon": { color: "white" },
                  ".MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.3)",
                  },
                  ":hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.5)",
                  },
                }}
              >
                <MenuItem value="">
                  전체</em>
                </MenuItem>
                {teams.map((team) => (
                  <MenuItem key={team.id} value={team.id}>
                    {team.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* 2컬럼 그리드 레이아웃 */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "340px 1fr",
              columnGap: 3,
              alignItems: "flex-start",
              minHeight: "600px",
            }}
          >
            {/* 좌측 리스트 카드 묶음 */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: CARD_GAP }}>
              {/* 진행중인 플래너 카드 */}
              <Card sx={{
                borderRadius: 2,
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                bgcolor: darkMode ? '#2d2d2d' : '#ffffff',
                border: darkMode ? '1px solid #404040' : 'none'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box
                    display="flex"
                    alignItems="center"
                    mb={2}
                    justifyContent="space-between"
                  >
                    <Box display="flex" alignItems="center">
                      <Assignment
                        sx={{ mr: 1, fontSize: 24, color: darkMode ? "#b8a9d9" : "#8d44ad" }}
                      />
                      <Typography variant="h6" fontWeight={600} color={darkMode ? "#ffffff" : "inherit"}>
                        진행중인 플래너 ({getFilteredPlanners().length})
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="text"
                      sx={{ 
                        minWidth: "auto",
                        fontWeight: 600,
                        ml: 1,
                        color: darkMode ? "#b8a9d9" : "#8d44ad" 
                      }}
                      onClick={() => navigate("/planners")}
                    >
                      전체보기
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: darkMode ? "#404040" : "inherit" }} />

                  {/* 내부 스크롤 영역 */}
                  <Box
                    sx={{
                      height: "300px",
                      overflowY: "auto",
                      pr: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                      "&::-webkit-scrollbar": { width: "8px" },
                      "&::-webkit-scrollbar-track": {
                        background: "rgba(0,0,0,0.05)",
                        borderRadius: 1,
                      },
                      "&::-webkit-scrollbar-thumb": {
                        background: "rgba(0,0,0,0.25)",
                        borderRadius: 1,
                        "&:hover": {
                          background: "rgba(0,0,0,0.35)",
                        },
                      },
                    }}
                  >
                    {recentPlanners.map((planner) => (
                      <Grow in timeout={400} key={planner.id}>
                        <Box
                          sx={{
                            p: 2,
                            border: (() => {
                              if (!planner.deadline) {
                                return darkMode ? "1.5px solid #404040" : "1.5px solid #dadada";
                              }
                              
                              const endDate = new Date(planner.deadline);
                              const now = new Date();
                              
                              // 날짜만 비교 (시간 무시)
                              const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                              const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                              const diffDays = Math.ceil((endDateOnly.getTime() - nowOnly.getTime()) / (1000 * 60 * 60 * 24));
                              
                              if (diffDays <= 7) {
                                return darkMode ? "1.5px solid #ff9800" : "1.5px solid #ff9800"; // 임박
                              }
                              return darkMode ? "1.5px solid #404040" : "1.5px solid #dadada"; // 일반
                            })(),
                            borderRadius: 1,
                            mb: 1,
                            cursor: "pointer",
                            transition: "all 0.17s",
                            background: (() => {
                              if (!planner.deadline) {
                                return darkMode ? "#3d3d3d" : "#f9fafc";
                              }
                              
                              const endDate = new Date(planner.deadline);
                              const now = new Date();
                              
                              // 날짜만 비교 (시간 무시)
                              const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                              const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                              const diffDays = Math.ceil((endDateOnly.getTime() - nowOnly.getTime()) / (1000 * 60 * 60 * 24));
                              
                              if (diffDays <= 7) {
                                return darkMode ? "#3d2f1f" : "#fff3e0"; // 임박
                              }
                              return darkMode ? "#3d3d3d" : "#f9fafc"; // 일반
                            })(),
                            "&:hover": { 
                              bgcolor: (() => {
                                if (!planner.deadline) {
                                  return darkMode ? "#4d4d4d" : "#efecff";
                                }
                                
                                const endDate = new Date(planner.deadline);
                                const now = new Date();
                                
                                // 날짜만 비교 (시간 무시)
                                const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                                const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                const diffDays = Math.ceil((endDateOnly.getTime() - nowOnly.getTime()) / (1000 * 60 * 60 * 24));
                                
                                if (diffDays <= 7) {
                                  return darkMode ? "#4d3f2f" : "#ffe0b2"; // 임박
                                }
                                return darkMode ? "#4d4d4d" : "#efecff"; // 일반
                              })()
                            },
                          }}
                          onClick={() => handlePlannerClick(planner)}
                        >
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 600,
                                fontSize: "1.02rem",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: "180px",
                                mr: 1,
                                color: darkMode ? "#ffffff" : "inherit",
                              }}
                            >
                              {planner.title}
                            </Typography>
                            <Chip
                              label={(() => {
                                if (!planner.deadline) return planner.status;
                                
                                const endDate = new Date(planner.deadline);
                                const now = new Date();
                                
                                // 날짜만 비교 (시간 무시)
                                const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                                const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                const diffDays = Math.ceil((endDateOnly.getTime() - nowOnly.getTime()) / (1000 * 60 * 60 * 24));
                                
                                if (diffDays <= 7) return "임박";
                                return planner.status;
                              })()}
                              size="small"
                              color={(() => {
                                if (!planner.deadline) {
                                  return planner.status === "진행중" ? "primary" : "warning";
                                }
                                
                                const endDate = new Date(planner.deadline);
                                const now = new Date();
                                
                                // 날짜만 비교 (시간 무시)
                                const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
                                const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                const diffDays = Math.ceil((endDateOnly.getTime() - nowOnly.getTime()) / (1000 * 60 * 60 * 24));
                                
                                if (diffDays <= 7) return "warning";
                                return planner.status === "진행중" ? "primary" : "warning";
                              })()}
                              sx={{
                                fontWeight: "bold",
                                fontSize: "0.9rem",
                                px: 0.5,
                                mr: 0,
                              }}
                            />
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              mt: 0.5,
                              fontSize: "0.81rem",
                              opacity: 0.7,
                              color: darkMode ? "#b0b0b0" : "text.secondary",
                            }}
                          >
                            {planner.team_name || "팀 없음"}
                          </Typography>
                        </Box>
                      </Grow>
                    ))}
                  </Box>
                </CardContent>
              </Card>
              {/* 진행중인 할일 카드 */}
              <Card sx={{
                borderRadius: 2,
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                bgcolor: darkMode ? '#2d2d2d' : '#ffffff',
                border: darkMode ? '1px solid #404040' : 'none'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box
                    display="flex"
                    alignItems="center"
                    mb={2}
                    justifyContent="space-between"
                  >
                    <Box display="flex" alignItems="center">
                      <CheckCircle
                        sx={{ mr: 1, fontSize: 24, color: darkMode ? "#7dd3a0" : "#3cb371" }}
                      />
                      <Typography variant="h6" fontWeight={600} color={darkMode ? "#ffffff" : "inherit"}>
                        진행중인 할일 ({getFilteredTodos().length})
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="text"
                      sx={{ 
                        minWidth: "auto",
                        fontWeight: 600,
                        ml: 1,
                        color: darkMode ? "#7dd3a0" : "#3cb371" 
                      }}
                      onClick={() => navigate("/todos")}
                    >
                      전체보기
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: darkMode ? "#404040" : "inherit" }} />
                  <Box
                    sx={{
                      height: "300px",
                      overflowY: "auto",
                      pr: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                      "&::-webkit-scrollbar": { width: "8px" },
                      "&::-webkit-scrollbar-track": {
                        background: "rgba(0,0,0,0.05)",
                        borderRadius: 1,
                      },
                      "&::-webkit-scrollbar-thumb": {
                        background: "rgba(0,0,0,0.25)",
                        borderRadius: 1,
                        "&:hover": {
                          background: "rgba(0,0,0,0.35)",
                        },
                      },
                    }}
                  >
                    {recentTodos.map((todo) => (
                      <Grow in timeout={400} key={todo.id}>
                        <Box
                          sx={{
                            p: 2,
                                                          border: (() => {
                                if (!todo.due_date) {
                                  return darkMode ? "1.5px solid #404040" : "1.5px solid #dadada";
                                }
                                
                                const dueDate = new Date(todo.due_date);
                                const now = new Date();
                                
                                // 날짜만 비교 (시간 무시)
                                const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
                                const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                const diffDays = Math.ceil((dueDateOnly.getTime() - nowOnly.getTime()) / (1000 * 60 * 60 * 24));
                                
                                if (diffDays <= 3) {
                                  return darkMode ? "1.5px solid #ff9800" : "1.5px solid #ff9800"; // 임박
                                }
                                return darkMode ? "1.5px solid #404040" : "1.5px solid #dadada"; // 일반
                              })(),
                            borderRadius: 1,
                            mb: 1,
                            cursor: "pointer",
                                                          background: (() => {
                                if (!todo.due_date) {
                                  return darkMode ? "#3d3d3d" : "#fcfcf7";
                                }
                                
                                const dueDate = new Date(todo.due_date);
                                const now = new Date();
                                
                                // 날짜만 비교 (시간 무시)
                                const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
                                const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                const diffDays = Math.ceil((dueDateOnly.getTime() - nowOnly.getTime()) / (1000 * 60 * 60 * 24));
                                
                                if (diffDays <= 3) {
                                  return darkMode ? "#3d2f1f" : "#fff3e0"; // 임박
                                }
                                return darkMode ? "#3d3d3d" : "#fcfcf7"; // 일반
                              })(),
                            transition: "all 0.17s",
                            "&:hover": { 
                              bgcolor: (() => {
                                if (!todo.due_date) {
                                  return darkMode ? "#4d4d4d" : "#effff7";
                                }
                                
                                const dueDate = new Date(todo.due_date);
                                const now = new Date();
                                
                                // 날짜만 비교 (시간 무시)
                                const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
                                const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                const diffDays = Math.ceil((dueDateOnly.getTime() - nowOnly.getTime()) / (1000 * 60 * 60 * 24));
                                
                                if (diffDays <= 3) {
                                  return darkMode ? "#4d3f2f" : "#ffe0b2"; // 임박
                                }
                                return darkMode ? "#4d4d4d" : "#effff7"; // 일반
                              })()
                            },
                          }}
                          onClick={() => handleTodoClick(todo)}
                        >
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 600,
                                fontSize: "1.02rem",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: "180px",
                                mr: 1,
                                color: darkMode ? "#ffffff" : "inherit",
                              }}
                            >
                              {todo.title}
                            </Typography>
                            <Chip
                              label={(() => {
                                if (!todo.due_date) return "진행중";
                                
                                const dueDate = new Date(todo.due_date);
                                const now = new Date();
                                
                                // 날짜만 비교 (시간 무시)
                                const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
                                const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                const diffDays = Math.ceil((dueDateOnly.getTime() - nowOnly.getTime()) / (1000 * 60 * 60 * 24));
                                
                                if (diffDays <= 3) return "임박";
                                return "진행중";
                              })()}
                              size="small"
                              color={(() => {
                                if (!todo.due_date) return "primary";
                                
                                const dueDate = new Date(todo.due_date);
                                const now = new Date();
                                
                                // 날짜만 비교 (시간 무시)
                                const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
                                const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                                const diffDays = Math.ceil((dueDateOnly.getTime() - nowOnly.getTime()) / (1000 * 60 * 60 * 24));
                                
                                if (diffDays <= 3) return "warning";
                                return "primary";
                              })()}
                              sx={{
                                fontWeight: "bold",
                                fontSize: "0.9rem",
                                px: 0.5,
                                mr: 0,
                              }}
                            />
                          </Box>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
                            <Typography
                              variant="caption"
                              sx={{ 
                                fontSize: "0.81rem", 
                                opacity: 0.7,
                                color: darkMode ? "#b0b0b0" : "text.secondary"
                              }}
                            >
                              {planners.find((p) => p.id === todo.planner_id)?.title ||
                                "플래너 없음"}
                            </Typography>
                            {todo.due_date && (
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: "0.81rem",
                                  opacity: 0.7,
                                  color: darkMode ? "#b0b0b0" : "text.secondary",
                                }}
                              >
                                마감: {new Date(todo.due_date).toLocaleDateString()}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Grow>
                    ))}
                  </Box>
                </CardContent>
              </Card>
              {/* 최근 게시글 카드 */}
              <Card sx={{
                borderRadius: 2,
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                bgcolor: darkMode ? '#2d2d2d' : '#ffffff',
                border: darkMode ? '1px solid #404040' : 'none'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box
                    display="flex"
                    alignItems="center"
                    mb={2}
                    justifyContent="space-between"
                  >
                    <Box display="flex" alignItems="center">
                      <Article
                        sx={{ mr: 1, fontSize: 24, color: darkMode ? "#ffb74d" : "#ff9800" }}
                      />
                      <Typography variant="h6" fontWeight={600} color={darkMode ? "#ffffff" : "inherit"}>
                        최근 게시글 ({getFilteredPosts().length})
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="text"
                      sx={{ 
                        minWidth: "auto",
                        fontWeight: 600,
                        ml: 1,
                        color: darkMode ? "#ffb74d" : "#ff9800" 
                      }}
                      onClick={() => navigate("/posts")}
                    >
                      전체보기
                    </Button>
                  </Box>
                  <Divider sx={{ mb: 2, borderColor: darkMode ? "#404040" : "inherit" }} />
                  <Box
                    sx={{
                      height: "300px",
                      overflowY: "auto",
                      pr: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                      "&::-webkit-scrollbar": { width: "8px" },
                      "&::-webkit-scrollbar-track": {
                        background: "rgba(0,0,0,0.05)",
                        borderRadius: 1,
                      },
                      "&::-webkit-scrollbar-thumb": {
                        background: "rgba(0,0,0,0.25)",
                        borderRadius: 1,
                        "&:hover": {
                          background: "rgba(0,0,0,0.35)",
                        },
                      },
                    }}
                  >
                    {recentPosts.map((post) => (
                      <Grow in timeout={400} key={post.id}>
                        <Box
                          sx={{
                            p: 2,
                            border: darkMode ? "1.5px solid #404040" : "1.5px solid #dadada",
                            borderRadius: 1,
                            mb: 1,
                            cursor: "pointer",
                            background: darkMode ? "#3d3d3d" : "#fdf6eb",
                            transition: "all 0.17s",
                            "&:hover": { 
                              bgcolor: darkMode ? "#4d4d4d" : "#ffecc0" 
                            },
                          }}
                          onClick={() => navigate(`/posts/${post.id}`)}
                        >
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 600,
                                fontSize: "1.02rem",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                maxWidth: "180px",
                                mr: 1,
                                color: darkMode ? "#ffffff" : "inherit",
                              }}
                            >
                              {post.title}
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                            <Typography
                              variant="caption"
                              sx={{ 
                                fontSize: "0.81rem", 
                                opacity: 0.7,
                                color: darkMode ? "#b0b0b0" : "text.secondary"
                              }}
                            >
                              {post.author_name ? `작성자: ${post.author_name}` : ""}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ 
                                fontSize: "0.81rem", 
                                opacity: 0.6,
                                ml: 1,
                                color: darkMode ? "#b0b0b0" : "text.secondary"
                              }}
                            >
                              {new Date(post.created_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      </Grow>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Box>
            {/* 달력 (중앙+오른쪽 공간) */}
            <Box
              sx={{
                width: "100%",
                height: "100%",
                background: darkMode
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(255,255,255,0.18)",
                borderRadius: 2,
                p: 3,
                boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                display: "flex",
                alignItems: "stretch",
                justifyContent: "stretch",
                overflow: "hidden",
              }}
            >
              <Calendar
                todos={getCalendarTodos()}
                planners={getCalendarPlanners()}
                currentUserId={user?.id}
                onTodoClick={handleTodoClick}
                onPlannerClick={handlePlannerClick}
                onDateClick={handleDateClick}
              />
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default DashboardPage; 