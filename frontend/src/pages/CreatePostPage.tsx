import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Article as ArticleIcon,
  Group as GroupIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { postAPI, teamAPI } from '../services/api';
import { Team } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import Navbar from '../components/Navbar';
import TagRecommendation from '../components/TagRecommendation';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const CreatePostPage: React.FC = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    team_id: '',
    category: '일반',
    tags: '',
  });

  
  const { darkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  useEffect(() => {
    setAnimateIn(true);
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teamAPI.getTeams();
      setTeams(data);
    } catch (err) {
      setError('팀 목록을 불러오는데 실패했습니다.');
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.team_id) {
      alert('제목, 내용, 팀을 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      const createdPost = await postAPI.createPost({
        ...formData,
        team_id: parseInt(formData.team_id),
        category: formData.category || '일반',
        tags: formData.tags.trim() || undefined,
      });
      

      
      navigate('/posts');
    } catch (err) {
      console.error('Error creating post:', err);
      alert('게시글 작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTagSelect = (tag: string) => {
    const currentTags = formData.tags ? formData.tags.split(',').map(t => t.trim()) : [];
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag].join(', ');
      setFormData({ ...formData, tags: newTags });
    }
  };

  if (loading) return <LoadingSpinner message="팀 목록을 불러오는 중..." />;
  if (error) return <ErrorDisplay message={error} onRetry={fetchTeams} />;

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
                onClick={() => navigate('/posts')}
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
                새 게시글 작성
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
                    새로운 게시글을 작성하여 팀원들과 소통하세요.
                  </Alert>

                  <form onSubmit={handleSubmit}>
                    <TextField
                      fullWidth
                      label="제목"
                      variant="outlined"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                      required
                    />

                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <InputLabel>팀 선택</InputLabel>
                      <Select
                        value={formData.team_id}
                        label="팀 선택"
                        onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                        sx={{
                          borderRadius: 2,
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(0,0,0,0.2)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main',
                          },
                        }}
                        required
                      >
                        {teams.map((team) => (
                          <MenuItem key={team.id} value={team.id}>
                            <Box display="flex" alignItems="center">
                              <GroupIcon sx={{ mr: 1, fontSize: 16 }} />
                              {team.name}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <InputLabel>카테고리</InputLabel>
                      <Select
                        value={formData.category}
                        label="카테고리"
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                        <MenuItem value="일반">일반</MenuItem>
                        <MenuItem value="공지사항">공지사항</MenuItem>
                        <MenuItem value="질문">질문</MenuItem>
                        <MenuItem value="공유">공유</MenuItem>
                        <MenuItem value="회의록">회의록</MenuItem>
                        <MenuItem value="기타">기타</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      fullWidth
                      label="태그 (쉼표로 구분)"
                      variant="outlined"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="예: 프로젝트, 회의, 아이디어"
                      sx={{ 
                        mb: 2,
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

                    {/* AI 태그 추천 */}
                    <TagRecommendation
                      content={formData.content}
                      existingTags={formData.tags ? formData.tags.split(',').map(t => t.trim()) : []}
                      onTagSelect={handleTagSelect}
                      disabled={submitting}
                    />

                    <TextField
                      fullWidth
                      label="내용"
                      variant="outlined"
                      multiline
                      rows={12}
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
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
                        startAdornment: <ArticleIcon sx={{ mr: 1, color: darkMode ? '#b0b0b0' : 'text.secondary', alignSelf: 'flex-start', mt: 1 }} />,
                      }}
                      required
                    />



                    <Box display="flex" gap={2} justifyContent="flex-end">
                      <Button
                        variant="outlined"
                        onClick={() => navigate('/posts')}
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

export default CreatePostPage; 