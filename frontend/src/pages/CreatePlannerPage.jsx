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
  useMediaQuery,
  useTheme as useMuiTheme,
} from '@mui/material';
import {
  ArrowBack,
  Assignment,
  Group,
  Schedule,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { teamAPI, plannerAPI } from '../services/api';
import { Team } from '../types';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';

const CreatePlannerPage = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [teamId, setTeamId] = useState('');
  const [status, setStatus] = useState('진행중');
  const [deadline, setDeadline] = useState(null);
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const navigate = useNavigate();
  
  const { darkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  useEffect(() => {
    setAnimateIn(true);
  }, []);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const teamsData = await teamAPI.getTeams();
        setTeams(teamsData);
        if (teamsData.length > 0) {
          setTeamId(teamsData[0].id);
        }
      } catch (error) {
        console.error('팀 목록 로딩 실패:', error);
      }
    };

    fetchTeams();
  }, []);

  const handleSubmit = async (e) => {
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

      const plannerData = {
        title: title.trim(),
        description: description.trim(),
        team_id: teamId,
        status,
        deadline: deadline || undefined,
      };

      const createdPlanner = await plannerAPI.createPlanner(plannerData);
      navigate(`/planners/${createdPlanner.id}/todo-recommendations`, {
        state: {
          plannerId: createdPlanner.id,
          plannerTitle: createdPlanner.title,
          plannerDescription: createdPlanner.description,
        }
      });
    } catch (err) {
      setError(err.response?.data?.detail || '플래너 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box
          sx={{
            minHeight: '100vh',
            background ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            pt,
            pb,
          }}
        >
          <Container maxWidth="md" sx={{ mt, mb }}>
            <Slide direction="down" in={animateIn} timeout={600}>
              <Box display="flex" alignItems="center" mb={4}>
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={() => navigate('/dashboard')}
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
                  새 플래너 만들기
                </Typography>
              </Box>
            </Slide>

            <Slide direction="up" in={animateIn} timeout={800}>
              <Fade in={animateIn} timeout={1000}>
                <Paper
                  elevation={8}
                  sx={{
                    borderRadius,
                    background ? 'rgba(45,45,45,0.95)' : 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(20px)',
                    border ? '1px solid rgba(64,64,64,0.3)' : '1px solid rgba(255,255,255,0.3)',
                    overflow: 'hidden',
                    p,
                  }}
                >
                  {error && (
                    <Alert severity="error" sx={{ mb, borderRadius }}>
                      {error}
                    </Alert>
                  )}

                  <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <TextField
                      fullWidth
                      label="플래너 제목"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      variant="outlined"
                      InputProps={{
                        startAdornment: <AssignmentIcon sx={{ mr, color: 'primary.main' }} />,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius,
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
                          borderRadius,
                        }
                      }}
                    />

                    <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', md: 'row' } }}>
                      <FormControl fullWidth>
                        <InputLabel>팀 선택</InputLabel>
                        <Select
                          value={teamId}
                          label="팀 선택"
                          onChange={(e) => setTeamId(e.target.value)}
                          required
                          startAdornment={<GroupIcon sx={{ mr, color: 'primary.main' }} />}
                          sx={{
                            borderRadius,
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
                          startAdornment={<ScheduleIcon sx={{ mr, color: 'primary.main' }} />}
                          sx={{
                            borderRadius,
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
                          fullWidth,
                          variant: 'outlined',
                          InputProps: {
                            startAdornment, // AccessTimeIcon 제거
                          },
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              borderRadius,
                            }
                          },
                        },
                      }}
                    />
                    
                    {/* TimePicker 제거 */}

                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt }}>
                      <Button
                        variant="outlined"
                        onClick={() => navigate('/dashboard')}
                        disabled={loading}
                        sx={{
                          fontWeight,
                          textTransform: 'none',
                          borderRadius,
                          px,
                        }}
                      >
                        취소
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        sx={{
                          background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                          boxShadow: '0 4px 16px rgba(76, 175, 80, 0.3)',
                          borderRadius,
                          fontWeight,
                          textTransform: 'none',
                          px,
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
                          },
                        }}
                      >
                        {loading ? '생성 중...' : '플래너 생성'}
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

export default CreatePlannerPage; 