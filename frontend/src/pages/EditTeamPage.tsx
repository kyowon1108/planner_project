import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  TextField,
  Box,
  Paper,
  Fade,
  Grow,
  Slide,
  useTheme as useMuiTheme,
  useMediaQuery,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Group as GroupIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { teamAPI } from '../services/api';
import { Team } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const EditTeamPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  
  const { darkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  useEffect(() => {
    setAnimateIn(true);
  }, []);

  const fetchTeam = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await teamAPI.getTeam(parseInt(id));
      setTeam(data);
      setFormData({
        name: data.name,
        description: data.description || '',
      });
    } catch (err) {
      setError('팀 정보를 불러오는데 실패했습니다.');
      console.error('Error fetching team:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('팀 이름을 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      await teamAPI.updateTeam(parseInt(id!), {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
      navigate(`/teams/${id}`);
    } catch (err) {
      console.error('Error updating team:', err);
      alert('팀 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="팀 정보를 불러오는 중..." />;
  if (error) return <ErrorDisplay message={error} onRetry={fetchTeam} />;
  if (!team) return <ErrorDisplay message="팀을 찾을 수 없습니다." onRetry={() => navigate('/teams')} />;

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
                onClick={() => navigate(`/teams/${id}`)}
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
                팀 수정
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
                    팀 정보를 수정하여 더 나은 협업 환경을 만들어보세요.
                  </Alert>

                  <form onSubmit={handleSubmit}>
                    <TextField
                      fullWidth
                      label="팀 이름"
                      variant="outlined"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                        startAdornment: <GroupIcon sx={{ mr: 1, color: darkMode ? '#b0b0b0' : 'text.secondary' }} />,
                      }}
                      required
                    />

                    <TextField
                      fullWidth
                      label="팀 설명"
                      variant="outlined"
                      multiline
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      sx={{ 
                        mb: 4,
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
                        startAdornment: <EditIcon sx={{ mr: 1, color: darkMode ? '#b0b0b0' : 'text.secondary', alignSelf: 'flex-start', mt: 1 }} />,
                      }}
                    />

                    <Box display="flex" gap={2} justifyContent="flex-end">
                      <Button
                        variant="outlined"
                        onClick={() => navigate(`/teams/${id}`)}
                        disabled={submitting}
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
                        type="submit"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        disabled={submitting}
                        sx={{
                          borderRadius: 2,
                          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                          boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)',
                          }
                        }}
                      >
                        {submitting ? '저장 중...' : '저장'}
                      </Button>
                    </Box>
                  </form>
                </Box>
              </Paper>
            </Fade>
          </Slide>
        </Container>
      </Box>
    </>
  );
};

export default EditTeamPage; 