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
  Paper,
  Fade,
  Grow,
  Slide,
  useTheme as useMuiTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import AdvancedSearchFilter from '../components/AdvancedSearchFilter';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Article as ArticleIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Visibility as VisibilityIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { postAPI, likeAPI, teamAPI } from '../services/api';
import { Post } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorDisplay from '../components/ErrorDisplay';
import Navbar from '../components/Navbar';
import SortSelect, { SortOption } from '../components/SortSelect';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatDateTime } from '../utils/dateUtils';

const PostsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('created_at');
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [likeStatuses, setLikeStatuses] = useState<{[key: number]: {is_liked: boolean, like_count: number}}>({});
  
  const { darkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  useEffect(() => {
    setAnimateIn(true);
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const [postsData, teamsData] = await Promise.all([
        postAPI.getPosts(),
        teamAPI.getTeams()
      ]);
      setPosts(postsData);
      setTeams(teamsData);
    } catch (err) {
      setError('게시글 목록을 불러오는데 실패했습니다.');
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // 좋아요 상태 가져오기
  const fetchLikeStatuses = async () => {
    try {
      const promises = posts.map(post => likeAPI.getLikeStatus(post.id));
      const results = await Promise.all(promises);
      const statuses: {[key: number]: {is_liked: boolean, like_count: number}} = {};
      posts.forEach((post, index) => {
        statuses[post.id] = results[index];
      });
      setLikeStatuses(statuses);
    } catch (error) {
      console.error('Error fetching like statuses:', error);
    }
  };

  useEffect(() => {
    if (posts.length > 0) {
      fetchLikeStatuses();
    }
  }, [posts]);

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;
    
    try {
      await postAPI.deletePost(postId);
      fetchPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  const handleLikeToggle = async (postId: number) => {
    try {
      const result = await likeAPI.toggleLike(postId);
      // 좋아요 상태 업데이트
      setLikeStatuses(prev => ({
        ...prev,
        [postId]: {
          is_liked: result.action === 'added',
          like_count: result.action === 'added' 
            ? (prev[postId]?.like_count || 0) + 1 
            : (prev[postId]?.like_count || 1) - 1
        }
      }));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const sortOptions: SortOption[] = [
    { value: 'created_at', label: '작성일순' },
    { value: 'title', label: '제목순 (가나다순)' },
    { value: 'author_name', label: '작성자순' },
    { value: 'team_name', label: '팀순' },
    { value: 'updated_at', label: '수정일순' },
  ];

  const categoryOptions = [
    { value: '일반', label: '일반' },
    { value: '공지사항', label: '공지사항' },
    { value: '질문', label: '질문' },
    { value: '공유', label: '공유' },
    { value: '회의록', label: '회의록' },
    { value: '기타', label: '기타' },
  ];

  // 게시글 수정/삭제 권한 확인 함수
  const canEditPost = (post: Post): boolean => {
    if (!user) return false;
    // 작성자인 경우만 수정 가능
    return post.author_id === user.id;
  };

  const canDeletePost = (post: Post): boolean => {
    if (!user) return false;
    // 작성자인 경우만 삭제 가능
    return post.author_id === user.id;
  };

  const getFilteredPosts = () => {
    let filtered = posts;
    
    // 카테고리 필터링 (고급 필터)
    if (selectedCategory !== '전체') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }
    
    // 팀 필터링
    if (selectedTeam !== 'all') {
      filtered = filtered.filter(post => post.team_id?.toString() === selectedTeam);
    }
    
    // 검색 필터링 (타입별)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(post => {
        switch (searchType) {
          case 'title':
            return post.title?.toLowerCase().includes(searchLower);
          case 'content':
            return post.content?.toLowerCase().includes(searchLower);
          case 'author':
            return post.author_name?.toLowerCase().includes(searchLower);
          case 'all':
          default:
            const titleMatch = post.title?.toLowerCase().includes(searchLower);
            const contentMatch = post.content?.toLowerCase().includes(searchLower);
            const authorMatch = post.author_name?.toLowerCase().includes(searchLower);
            return titleMatch || contentMatch || authorMatch;
        }
      });
    }
    
    return filtered;
  };

  const sortPosts = (postsToSort: Post[]) => {
    return [...postsToSort].sort((a, b) => {
      switch (sortBy) {
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        
        case 'title':
          return a.title.localeCompare(b.title);
        
        case 'author_name':
          return (a.author_name || '').localeCompare(b.author_name || '');
        
        case 'team_name':
          return (a.team_name || '').localeCompare(b.team_name || '');
        
        case 'updated_at':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        
        default:
          return 0;
      }
    });
  };

  if (loading) return <LoadingSpinner message="게시글 목록을 불러오는 중..." />;
  if (error) return <ErrorDisplay message={error} onRetry={fetchPosts} />;

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
              <Typography 
                variant="h4" 
                component="h1"
                sx={{
                  fontWeight: 700,
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                게시글 목록
              </Typography>
              {teams.length === 0 ? (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/teams')}
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
                  팀 만들기
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/posts/create')}
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
                  새 게시글 작성
                </Button>
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
                    <InputLabel>카테고리</InputLabel>
                    <Select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      label="카테고리"
                    >
                      <MenuItem value="전체">전체</MenuItem>
                      {categoryOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
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
                {sortPosts(getFilteredPosts()).map((post, index) => (
                <Fade in={animateIn} timeout={1000 + index * 100} key={post.id}>
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
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Box display="flex" alignItems="center">
                          <ArticleIcon sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography 
                            variant="h6" 
                            component="h2"
                            sx={{
                              fontWeight: 600,
                              color: darkMode ? '#ffffff' : '#2c3e50',
                            }}
                          >
                            {post.title}
                          </Typography>
                        </Box>
                        
                        <Box display="flex" alignItems="center" gap={1}>
                          {post.team_name && (
                            <Box 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 0.5,
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1.5,
                                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                                border: '1px solid rgba(25, 118, 210, 0.2)',
                              }}
                            >
                              <GroupIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  fontWeight: 600, 
                                  color: 'primary.main',
                                  fontSize: '0.75rem',
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
                                px: 1.5,
                                py: 0.5,
                                borderRadius: 1.5,
                                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                border: '1px solid rgba(76, 175, 80, 0.2)',
                              }}
                            >
                              <PersonIcon sx={{ fontSize: 14, color: 'success.main' }} />
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  fontWeight: 600, 
                                  color: 'success.main',
                                  fontSize: '0.75rem',
                                }}
                              >
                                {post.author_name}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                      
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        mb={2}
                        sx={{
                          p: 2,
                          backgroundColor: 'rgba(0,0,0,0.02)',
                          borderRadius: 2,
                          border: '1px solid rgba(0,0,0,0.05)',
                          lineHeight: 1.6,
                        }}
                      >
                        {post.content.length > 200 
                          ? `${post.content.substring(0, 200)}...` 
                          : post.content
                        }
                      </Typography>
                      

                      
                      <Box display="flex" alignItems="center" gap={2}>
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
                          작성일: {formatDateTime(post.created_at)}
                        </Typography>
                        
                        {post.reply_count !== undefined && (
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
                            💬 댓글 {post.reply_count}개
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                    
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <IconButton
                          size="small"
                          onClick={() => handleLikeToggle(post.id)}
                          sx={{
                            color: likeStatuses[post.id]?.is_liked ? 'error.main' : 'text.secondary',
                            '&:hover': {
                              color: 'error.main',
                              transform: 'scale(1.1)',
                            },
                          }}
                        >
                          {likeStatuses[post.id]?.is_liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                        </IconButton>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          {likeStatuses[post.id]?.like_count || 0}
                        </Typography>
                      </Box>
                      
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => navigate(`/posts/${post.id}`)}
                        sx={{
                          fontWeight: 600,
                          textTransform: 'none',
                          borderRadius: 2,
                        }}
                      >
                        상세보기
                      </Button>
                      
                      {/* 작성자만 수정 가능 */}
                      {canEditPost(post) && (
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => navigate(`/posts/${post.id}/edit`)}
                          sx={{
                            fontWeight: 600,
                            textTransform: 'none',
                            borderRadius: 2,
                          }}
                        >
                          수정
                        </Button>
                      )}
                      
                      {/* 작성자만 삭제 가능 */}
                      {canDeletePost(post) && (
                        <Button
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeletePost(post.id)}
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
              
              {sortPosts(getFilteredPosts()).length === 0 && (
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
                    <ArticleIcon sx={{ fontSize: 64, color: darkMode ? '#b0b0b0' : 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {teams.length === 0 ? '팀이 없습니다' : (searchTerm || selectedTeam !== 'all' ? '검색 결과가 없습니다' : '게시글이 없습니다')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      {teams.length === 0 
                        ? '게시글을 작성하려면 먼저 팀을 만들어주세요.' 
                        : (searchTerm || selectedTeam !== 'all' ? '다른 검색어나 필터를 시도해보세요.' : '새로운 게시글을 작성해보세요!')
                      }
                    </Typography>
                    {teams.length === 0 && (
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/teams')}
                        sx={{
                          background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
                          borderRadius: 2,
                          px: 3,
                          py: 1.5,
                          fontWeight: 600,
                          textTransform: 'none',
                        }}
                      >
                        팀 만들기
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
    </>
  );
};

export default PostsPage; 