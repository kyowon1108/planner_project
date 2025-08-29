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
  Alert,
  Fade,
  Grow,
  Slide,
  useTheme as useMuiTheme,
  useMediaQuery,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Article as ArticleIcon,
  Group as GroupIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { postAPI, teamAPI } from '../services/api';
import { Team, Post } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import Navbar from '../components/Navbar';
import TagRecommendation from '../components/TagRecommendation';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const EditPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [post, setPost] = useState<Post | null>(null);
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

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [teamsData, postData] = await Promise.all([
        teamAPI.getTeams(),
        postAPI.getPost(parseInt(id!)),
      ]);
      setTeams(teamsData);
      setPost(postData);
      setFormData({
        title: postData.title,
        content: postData.content,
        team_id: postData.team_id.toString(),
        category: postData.category || '일반',
        tags: postData.tags || '',
      });
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const handleTagSelect = (tag: string) => {
    const currentTags = formData.tags ? formData.tags.split(',').map(t => t.trim()) : [];
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag].join(', ');
      setFormData({ ...formData, tags: newTags });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.team_id) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      await postAPI.updatePost(parseInt(id!), {
        ...formData,
        team_id: parseInt(formData.team_id),
        category: formData.category || '일반',
        tags: formData.tags.trim() || undefined,
      });
      navigate(`/posts/${id}`);
    } catch (err) {
      console.error('Error updating post:', err);
      alert('게시글 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="게시글 정보를 불러오는 중..." />;
  if (error) return <ErrorDisplay message={error} onRetry={fetchData} />;
  if (!post) return <ErrorDisplay message="게시글을 찾을 수 없습니다." onRetry={() => navigate('/posts')} />;

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
                onClick={() => navigate(`/posts/${id}`)}
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
                게시글 수정
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
                      }
                    }}
                    InputProps={{
                      startAdornment: <ArticleIcon sx={{ mr: 1, color: 'primary.main' }} />,
                    }}
                    required
                  />

                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>팀 선택</InputLabel>
                    <Select
                      value={formData.team_id}
                      label="팀 선택"
                      onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                      startAdornment={<GroupIcon sx={{ mr: 1, color: 'primary.main' }} />}
                      sx={{
                        borderRadius: 2,
                      }}
                      required
                    >
                      {teams.map((team) => (
                        <MenuItem key={team.id} value={team.id}>
                          {team.name}
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
                      }
                    }}
                    required
                  />

                  <Box display="flex" gap={2} justifyContent="flex-end">
                    <Button
                      variant="outlined"
                      onClick={() => navigate(`/posts/${id}`)}
                      disabled={submitting}
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
                      startIcon={<EditIcon />}
                      disabled={submitting}
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
                      {submitting ? '저장 중...' : '저장'}
                    </Button>
                  </Box>
                </form>
              </Paper>
            </Fade>
          </Slide>
        </Container>
      </Box>
    </>
  );
};

export default EditPostPage; 