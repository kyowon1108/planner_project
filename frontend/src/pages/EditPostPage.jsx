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
  useMediaQuery,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Article,
  Group,
  Edit,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { postAPI, teamAPI } from '../services/api';
import { Team, Post } from '../types';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorDisplay from '../components/ErrorDisplay.jsx';
import Navbar from '../components/Navbar.jsx';
import TagRecommendation from '../components/TagRecommendation.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';

const EditPostPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
        title.title,
        content.content,
        team_id.team_id.toString(),
        category.category || '일반',
        tags.tags || '',
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

  const handleTagSelect = (tag) => {
    const currentTags = formData.tags ? formData.tags.split(',').map(t => t.trim()) : [];
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag].join(', ');
      setFormData({ ...formData, tags });
    }
  };

  const handleSubmit = async (e.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.team_id) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      await postAPI.updatePost(parseInt(id!), {
        ...formData,
        team_id(formData.team_id),
        category.category || '일반',
        tags.tags.trim() || undefined,
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
                onClick={() => navigate(`/posts/${id}`)}
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
                게시글 수정
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
                <form onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    label="제목"
                    variant="outlined"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title.target.value })}
                    sx={{ 
                      mb,
                      '& .MuiOutlinedInput-root': {
                        borderRadius,
                      }
                    }}
                    InputProps={{
                      startAdornment: <ArticleIcon sx={{ mr, color: 'primary.main' }} />,
                    }}
                    required
                  />

                  <FormControl fullWidth sx={{ mb }}>
                    <InputLabel>팀 선택</InputLabel>
                    <Select
                      value={formData.team_id}
                      label="팀 선택"
                      onChange={(e) => setFormData({ ...formData, team_id.target.value })}
                      startAdornment={<GroupIcon sx={{ mr, color: 'primary.main' }} />}
                      sx={{
                        borderRadius,
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

                  <FormControl fullWidth sx={{ mb }}>
                    <InputLabel>카테고리</InputLabel>
                    <Select
                      value={formData.category}
                      label="카테고리"
                      onChange={(e) => setFormData({ ...formData, category.target.value })}
                      sx={{
                        borderRadius,
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
                    onChange={(e) => setFormData({ ...formData, tags.target.value })}
                    placeholder="예, 회의, 아이디어"
                    sx={{ 
                      mb,
                      '& .MuiOutlinedInput-root': {
                        borderRadius,
                        '& fieldset': {
                          borderColor: 'rgba(0,0,0,0.2)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                    InputProps={{
                      startAdornment: <EditIcon sx={{ mr, color ? '#b0b0b0' : 'text.secondary' }} />,
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
                    onChange={(e) => setFormData({ ...formData, content.target.value })}
                    sx={{ 
                      mb,
                      '& .MuiOutlinedInput-root': {
                        borderRadius,
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
                      startIcon={<EditIcon />}
                      disabled={submitting}
                      sx={{
                        background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
                        boxShadow: '0 4px 16px rgba(33, 150, 243, 0.3)',
                        borderRadius,
                        fontWeight,
                        textTransform: 'none',
                        px,
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