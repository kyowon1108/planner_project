import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Box,
  Chip,
  Divider,
  Paper,
  Fade,
  Grow,
  Slide,
  useTheme as useMuiTheme,
  useMediaQuery,
  TextField,
  IconButton,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Delete,
  Article,
  Group,
  Person,
  CalendarToday,
  Update,
  Favorite,
  FavoriteBorder,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { postAPI, likeAPI, replyAPI } from '../services/api';
import { Post, Reply } from '../types';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorDisplay from '../components/ErrorDisplay.jsx';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { formatDateTime } from '../utils/dateUtils';

const PostDetailPage = () => {
  const { id } = useParams<{ id }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [likeStatus, setLikeStatus] = useState({is_liked, like_count});
  const [replies, setReplies] = useState([]);
  const [newReply, setNewReply] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [replyPage, setReplyPage] = useState(1);
  const [replyTotalPages, setReplyTotalPages] = useState(1);
  const [replyTotalCount, setReplyTotalCount] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [replyToDelete, setReplyToDelete] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animateIn, setAnimateIn] = useState(false);
  
  const { darkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  useEffect(() => {
    setAnimateIn(true);
  }, []);

  const fetchPost = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching post with ID:', id);
      console.log('API base URL:', process.env.REACT_APP_API_BASE_URL || 'http://localhost/api/v1');
      console.log('User token:', localStorage.getItem('token') ? 'Present' : 'Not found');
      
      const data = await postAPI.getPost(parseInt(id));
      console.log('Fetched post data:', data);
      console.log('Post tags:', data.tags);
      console.log('Post category:', data.category);
      setPost(data);
    } catch (err) {
      console.error('Error fetching post:', err);
      console.error('Error details:', {
        message.message,
        status.response?.status,
        statusText.response?.statusText,
        data.response?.data,
        config.config
      });
      
      // 구체적인 에러 메시지 처리
      let errorMessage = '게시글을 불러오는데 실패했습니다.';
      
      if (err.response?.status === 401) {
        errorMessage = '로그인이 필요합니다. 로그인 페이지로 이동합니다.';
        // 3초 후 로그인 페이지로 리다이렉트
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else if (err.response?.status === 404) {
        errorMessage = '게시글을 찾을 수 없습니다.';
      } else if (err.response?.data?.error?.message) {
        errorMessage = err.response.data.error.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('PostDetailPage useEffect triggered');
    console.log('User state:', user);
    console.log('Post ID:', id);
    
    // 사용자가 로그인되어 있는지 확인
    if (!user) {
      console.log('User not logged in, setting error');
      setError('로그인이 필요합니다.');
      return;
    }
    
    console.log('User is logged in, fetching post');
    fetchPost();
  }, [id, user]);

  const fetchLikeStatus = async () => {
    if (!id) return;
    
    try {
      const status = await likeAPI.getLikeStatus(parseInt(id));
      setLikeStatus(status);
    } catch (error) {
      console.error('Error fetching like status:', error);
    }
  };

  useEffect(() => {
    if (post) {
      fetchLikeStatus();
      fetchReplies();
    }
  }, [post]);

  const fetchReplies = async (page = 1) => {
    if (!id) return;
    
    try {
      const data = await replyAPI.getReplies(parseInt(id), page);
      console.log('Replies API response:', data);
      
      // 백엔드 API는 댓글 배열만 반환하므로 직접 사용
      if (Array.isArray(data)) {
        setReplies(data);
        setReplyTotalPages(1); // 현재는 페이지네이션 없음
        setReplyTotalCount(data.length);
      } else if (data && typeof data === 'object' && 'replies' in data) {
        // 만약 페이지네이션 정보가 포함된 응답이 온다면
        const responseData = data as { replies; pagination: any };
        setReplies(responseData.replies);
        setReplyTotalPages(responseData.pagination?.total_pages || 1);
        setReplyTotalCount(responseData.pagination?.total_count || responseData.replies.length);
      } else {
        setReplies([]);
        setReplyTotalPages(1);
        setReplyTotalCount(0);
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
      // 에러 발생 시 기본값 설정
      setReplies([]);
      setReplyTotalPages(1);
      setReplyTotalCount(0);
    }
  };

  const handleDeletePost = async () => {
    if (!post || !window.confirm('게시글을 삭제하시겠습니까?')) return;
    
    try {
      await postAPI.deletePost(post.id);
      navigate('/posts');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('게시글 삭제에 실패했습니다.');
    }
  };

  const handleLikeToggle = async () => {
    if (!id) return;
    
    try {
      await likeAPI.toggleLike(parseInt(id));
      fetchLikeStatus();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleSubmitReply = async () => {
    if (!id || !newReply.trim()) return;
    
    try {
      setReplyLoading(true);
      const result = await replyAPI.createReply(parseInt(id), newReply.trim());
      console.log('댓글 작성 성공:', result);
      setNewReply('');
      // 새 댓글 작성 후 첫 페이지로 이동
      setReplyPage(1);
      await fetchReplies(1);
    } catch (error) {
      console.error('Error creating reply:', error);
      const errorMessage = error.response?.data?.detail || '댓글 작성에 실패했습니다.';
      alert(errorMessage);
    } finally {
      setReplyLoading(false);
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    
    try {
      await replyAPI.deleteReply(replyId);
      fetchReplies(replyPage);
    } catch (error) {
      console.error('Error deleting reply:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  const handlePageChange = (event.ChangeEvent<unknown>, value) => {
    setReplyPage(value);
    fetchReplies(value);
  };

  // 권한 체크 함수들
  const canEditPost = () => {
    if (!post || !user) return false;
    return post.author_id === user.id;
  };

  const canDeletePost = () => {
    if (!post || !user) return false;
    // 작성자이거나 admin/owner인 경우
    return post.author_id === user.id;
  };

  const canDeleteReply = (reply) => {
    if (!user) return false;
    // 댓글 작성자이거나 게시글 작성자이거나 admin/owner인 경우
    return reply.author_id === user.id || (post && post.author_id === user.id);
  };

  if (loading) return <LoadingSpinner message="게시글을 불러오는 중..." />;
  if (error) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Container maxWidth="sm">
          <ErrorDisplay 
            message={error} 
            onRetry={fetchPost}
            onLogin={() => navigate('/login')}
          />
        </Container>
      </Box>
    );
  }
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
        <Container maxWidth="lg" sx={{ mt, mb }}>
          <Slide direction="down" in={animateIn} timeout={600}>
            <Box display="flex" alignItems="center" mb={4}>
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/posts')}
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
                  flexGrow,
                  fontWeight,
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                {post.title}
              </Typography>
              <Box display="flex" alignItems="center" gap={1} mr={2}>
                <Button
                  variant="outlined"
                  onClick={handleLikeToggle}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: 'white',
                    minWidth: 'auto',
                    px,
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderColor: 'white',
                    }
                  }}
                >
                  {likeStatus.is_liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                  <Typography sx={{ ml, fontWeight }}>
                    {likeStatus.like_count}
                  </Typography>
                </Button>
              </Box>
              
              {canEditPost() && (
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/posts/${post.id}/edit`)}
                  sx={{ 
                    mr,
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                    }
                  }}
                >
                  수정
                </Button>
              )}
              {canDeletePost() && (
                <Button
                  startIcon={<DeleteIcon />}
                  onClick={handleDeletePost}
                  color="error"
                  variant="outlined"
                  sx={{
                    borderColor: 'rgba(255,255,255,0.3)',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderColor: 'white',
                    }
                  }}
                >
                  삭제
                </Button>
              )}
            </Box>
          </Slide>

          <Slide direction="up" in={animateIn} timeout={800}>
            <Fade in={animateIn} timeout={1000}>
              <Box display="flex" gap={3} flexDirection={{ xs: 'column', md: 'row' }}>
                {/* 왼쪽 내용 */}
                <Box sx={{ flex: { xs: '1', md: '0 0 58%' } }}>
                  <Paper
                    elevation={8}
                    sx={{
                      borderRadius,
                      background ? 'rgba(45,45,45,0.95)' : 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(20px)',
                      border ? '1px solid rgba(64,64,64,0.3)' : '1px solid rgba(255,255,255,0.3)',
                      overflow: 'hidden',
                      height: 'fit-content',
                    }}
                  >
                    <CardContent sx={{ p }}>
                      {/* 제목과 메타 정보 */}
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                        <Box display="flex" alignItems="center">
                          <ArticleIcon sx={{ mr, color: 'primary.main', fontSize }} />
                          <Typography 
                            variant="h4" 
                            component="h2"
                            sx={{
                              fontWeight,
                              color ? '#ffffff' : '#2c3e50',
                            }}
                          >
                            {post.title}
                          </Typography>
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={2}>
                          {post.team_name && (
                            <Box 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 0.5,
                                px,
                                py,
                                borderRadius,
                                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                                border: '1px solid rgba(25, 118, 210, 0.2)',
                              }}
                            >
                              <GroupIcon sx={{ fontSize, color: 'primary.main' }} />
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight, 
                                  color: 'primary.main',
                                  fontSize: '0.9rem',
                                }}
                              >
                                {post.team_name}
                              </Typography>
                            </Box>
                          )}
                          
                          {post.author_name && (
                            <Box 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 0.5,
                                px,
                                py,
                                borderRadius,
                                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                border: '1px solid rgba(76, 175, 80, 0.2)',
                              }}
                            >
                              <PersonIcon sx={{ fontSize, color: 'success.main' }} />
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight, 
                                  color: 'success.main',
                                  fontSize: '0.9rem',
                                }}
                              >
                                {post.author_name}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>

                      {/* 구분선 */}
                      <Divider sx={{ mb, borderColor: 'rgba(0,0,0,0.1)' }} />

                      {/* 카테고리와 태그 섹션 */}
                      <Box display="flex" gap={1} mb={4} flexWrap="wrap">
                        {post.category && (
                          <Chip 
                            label={post.category} 
                            color="primary"
                            sx={{ 
                              fontWeight,
                              fontSize: '0.9rem',
                              py,
                            }}
                          />
                        )}
                        {post.tags && post.tags.split(',').map((tag, index) => (
                          <Chip 
                            key={index}
                            label={tag.trim()} 
                            variant="outlined"
                            sx={{ 
                              fontWeight,
                              fontSize: '0.85rem',
                              py: 0.5,
                            }}
                          />
                        ))}
                      </Box>

                      <Divider sx={{ mb, borderColor: 'rgba(0,0,0,0.1)' }} />

                      <Typography 
                        variant="body1" 
                        sx={{ 
                          whiteSpace: 'pre-wrap', 
                          mb,
                          lineHeight.8,
                          fontSize: '1.1rem',
                          color ? '#ffffff' : '#2c3e50',
                        }}
                      >
                        {post.content}
                      </Typography>

                      <Divider sx={{ mb, borderColor: 'rgba(0,0,0,0.1)' }} />

                      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CalendarIcon sx={{ fontSize, color ? '#b0b0b0' : 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight }}>
                            작성일: {formatDateTime(post.created_at)}
                          </Typography>
                        </Box>
                        {post.updated_at !== post.created_at && (
                          <Box display="flex" alignItems="center" gap={1}>
                            <UpdateIcon sx={{ fontSize, color ? '#b0b0b0' : 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight }}>
                              수정일: {formatDateTime(post.updated_at)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Paper>
                </Box>

                {/* 오른쪽 섹션 */}
                <Box sx={{ flex: { xs: '1', md: '0 0 42%' } }}>
                  <Paper
                    elevation={8}
                    sx={{
                      borderRadius,
                      background ? 'rgba(45,45,45,0.95)' : 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(20px)',
                      border ? '1px solid rgba(64,64,64,0.3)' : '1px solid rgba(255,255,255,0.3)',
                      overflow: 'hidden',
                      height: 'fit-content',
                      maxHeight: '80vh',
                      overflowY: 'auto',
                    }}
                  >
                    <CardContent sx={{ p }}>
                      <Typography variant="h6" sx={{ mb, fontWeight, color ? '#ffffff' : '#2c3e50' }}>
                        💬 댓글 ({replyTotalCount}개)
                      </Typography>
                      
                      {/* 댓글 작성 폼 */}
                      <Box sx={{ mb }}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          placeholder="댓글을 작성해주세요..."
                          value={newReply}
                          onChange={(e) => setNewReply(e.target.value)}
                          sx={{ 
                            mb,
                            '& .MuiOutlinedInput-root': {
                              borderRadius,
                              '& fieldset': {
                                borderColor ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'primary.main',
                              },
                            },
                          }}
                        />
                        <Box display="flex" justifyContent="flex-end">
                          <Button
                            variant="contained"
                            onClick={handleSubmitReply}
                            disabled={replyLoading || !newReply.trim()}
                            size="small"
                            sx={{
                              borderRadius,
                              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                              boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                              '&:hover': {
                                background: 'linear-gradient(45deg, #1976D2 30%, #1E88E5 90%)',
                              }
                            }}
                          >
                            {replyLoading ? '작성 중...' : '댓글 작성'}
                          </Button>
                        </Box>
                      </Box>

                      {/* 댓글 목록 */}
                      <Box>
                        {(!replies || replies.length === 0) ? (
                          <Typography variant="body2" sx={{ 
                            textAlign: 'center', 
                            py,
                            color ? '#b0b0b0' : 'text.secondary'
                          }}>
                            아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
                          </Typography>
                        ) : (
                          <>
                            {replies.map((reply) => (
                              <Box
                                key={reply.id}
                                sx={{
                                  p,
                                  mb,
                                  borderRadius,
                                  backgroundColor 
                                    ? (reply.is_deleted ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)')
                                    : (reply.is_deleted ? 'rgba(0,0,0,0.01)' : 'rgba(0,0,0,0.02)'),
                                  border 
                                    ? '1px solid rgba(255,255,255,0.1)'
                                    : '1px solid rgba(0,0,0,0.05)',
                                  opacity.is_deleted ? 0.7 : 1,
                                }}
                              >
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Box
                                      sx={{
                                        width,
                                        height,
                                        borderRadius: '50%',
                                        backgroundColor.is_deleted ? 'grey.400' : 'primary.main',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight,
                                        fontSize: '0.8rem',
                                      }}
                                    >
                                      {reply.author_name.charAt(0)}
                                    </Box>
                                    <Typography 
                                      variant="caption" 
                                      sx={{ 
                                        fontWeight, 
                                        color.is_deleted 
                                          ? (darkMode ? '#b0b0b0' : 'text.secondary') 
                                          : (darkMode ? '#ffffff' : '#2c3e50')
                                      }}
                                    >
                                      {reply.author_name}
                                    </Typography>
                                    {reply.is_deleted && (
                                      <Chip 
                                        label="삭제됨" 
                                        size="small" 
                                        color="default" 
                                        variant="outlined"
                                        sx={{ fontSize: '0.7rem', height }}
                                      />
                                    )}
                                  </Box>
                                  <Box display="flex" alignItems="center" gap={1}>
                                    <Typography variant="caption" sx={{ 
                                      fontSize: '0.7rem',
                                      color ? '#b0b0b0' : 'text.secondary'
                                    }}>
                                      {formatDateTime(reply.created_at)}
                                    </Typography>
                                    {!reply.is_deleted && canDeleteReply(reply) && (
                                      <IconButton
                                        size="small"
                                        onClick={() => handleDeleteReply(reply.id)}
                                        sx={{ color: 'error.main', p: 0.5 }}
                                      >
                                        <DeleteIcon sx={{ fontSize }} />
                                      </IconButton>
                                    )}
                                  </Box>
                                </Box>
                                {!reply.is_deleted && (
                                  <Typography 
                                    variant="body2" 
                                    sx={{ 
                                      lineHeight.4, 
                                      color ? '#ffffff' : '#2c3e50',
                                      fontSize: '0.9rem'
                                    }}
                                  >
                                    {reply.content}
                                  </Typography>
                                )}
                              </Box>
                            ))}
                            
                            {/* 페이지네이션 */}
                            {replyTotalPages > 1 && (
                              <Box display="flex" justifyContent="center" mt={2}>
                                <Pagination
                                  count={replyTotalPages}
                                  page={replyPage}
                                  onChange={handlePageChange}
                                  color="primary"
                                  size="small"
                                />
                              </Box>
                            )}
                          </>
                        )}
                      </Box>
                    </CardContent>
                  </Paper>
                </Box>
              </Box>
            </Fade>
          </Slide>
        </Container>
      </Box>
    </>
  );
};

export default PostDetailPage; 