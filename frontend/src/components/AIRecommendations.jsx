import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Rating,
  Collapse,
  IconButton,
  Alert,
  AlertTitle,
  LinearProgress,
  Tooltip,
  Badge,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Psychology,
  Schedule,
  TrendingUp,
  Lightbulb,
  StarBorder,
  Star,
  ExpandMore,
  ExpandLess,
  AccessTime,
  Assignment,
  Insights,
  AutoAwesome,
  ThumbUp,
  ThumbDown,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { aiAPI, ProductivityInsights } from '../services/api';

const AIRecommendations = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const [recommendations, setRecommendations] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [userFeedback, setUserFeedback] = useState>({});

  useEffect(() => {
    if (user) {
      loadRecommendations();
      loadProductivityInsights();
    }
  }, [user]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await aiAPI.getSmartTodoRecommendations();
      setRecommendations(response.recommendations || []);
    } catch (error) {
      console.error('AI 추천 로드 실패:', error);
      setError('AI 추천을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadProductivityInsights = async () => {
    try {
      const insights = await aiAPI.getProductivityInsights();
      setInsights(insights);
    } catch (error) {
      console.error('생산성 인사이트 로드 실패:', error);
    }
  };

  const handleFeedback = async (recommendationIndex, feedback: 'like' | 'dislike') => {
    try {
      const recommendation = recommendations[recommendationIndex];
      await aiAPI.submitRecommendationFeedback(
        `${user?.id}_${recommendationIndex}_${Date.now()}`,
        {
          rating,
          recommendation_title.title,
          user_action === 'like' ? 'positive' : 'negative'
        }
      );
      
      setUserFeedback(prev => ({
        ...prev,
        [recommendationIndex]: feedback
      }));
      
      console.log(`추천 피드백 전송: ${feedback}`);
    } catch (error) {
      console.error('피드백 전송 실패:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default '#757575';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return '높음';
      case 'medium': return '보통';
      case 'low': return '낮음';
      default '미정';
    }
  };

  const formatTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes}분`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}시간 ${remainingMinutes}분` : `${hours}시간`;
  };

  if (!user) {
    return (
      <Alert severity="info">
        AI 추천 기능을 사용하려면 로그인해주세요.
      </Alert>
    );
  }

  return (
    <Box sx={{ p }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb }}>
        <MagicIcon sx={{ mr, color: 'primary.main', fontSize }} />
        
          <Typography variant="h4" component="h1" gutterBottom>
            🤖 AI 스마트 추천
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            당신의 생산성 패턴을 분석한 개인화된 추천을 확인하세요
          </Typography>
        </Box>
        <Box sx={{ ml: 'auto' }}>
          <Button 
            variant="outlined" 
            onClick={loadRecommendations}
            disabled={loading}
            startIcon={<AIIcon />}
          >
            새로고침
          </Button>
        </Box>
      </Box>

      {/* 생산성 인사이트 카드 */}
      {insights && (
        <Card sx={{ mb, background ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          
            <Box sx={{ display: 'flex', alignItems: 'center', mb }}>
              <InsightsIcon sx={{ mr, color: 'white' }} />
              <Typography variant="h6" sx={{ color: 'white' }}>
                생산성 인사이트
              </Typography>
            </Box>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 1 }}>
              {/* 생산성 점수 */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {Math.round(insights.productivity_score)}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  생산성 점수
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={insights.productivity_score} 
                  sx={{ mt, bgcolor: 'rgba(255,255,255,0.2)', '& .MuiLinearProgress-bar': { bgcolor: 'white' } }}
                />
              </Box>

              {/* 주간 트렌드 */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {insights.weekly_trend.completed_tasks}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  이번 주 완료 작업
                </Typography>
                <Chip 
                  label={insights.weekly_trend.productivity_change}
                  size="small"
                  sx={{ mt, bgcolor: 'rgba(76, 175, 80, 0.2)', color: 'white' }}
                />
              </Box>

              {/* 최적 시간대 */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold', mb }}>
                  생산적 시간대
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                  {insights.peak_hours.map((hour) => (
                    <Chip
                      key={hour}
                      label={`${hour}시`}
                      size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>

            {/* 추천 사항 */}
            <Box sx={{ mt }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mb }}>
                💡 개선 제안:
              </Typography>
              <List dense>
                {insights.recommendations.slice(0, 2).map((recommendation, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth }}>
                      <IdeaIcon sx={{ fontSize, color: 'white' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={recommendation} 
                      primaryTypographyProps={{ 
                        variant: 'body2', 
                        sx: { color: 'rgba(255,255,255,0.9)' } 
                      }} 
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 로딩 및 에러 처리 */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my }}>
          <LinearProgress sx={{ width: '100%', mb }} />
          <Typography variant="body2" color="text.secondary">
            AI가 당신을 위한 추천을 생성하고 있습니다...
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb }}>
          오류</AlertTitle>
          {error}
          <Button size="small" onClick={loadRecommendations} sx={{ mt }}>
            다시 시도
          </Button>
        </Alert>
      )}

      {/* 추천 목록 */}
      {!loading && recommendations.length > 0 && (
        
          <Typography variant="h6" sx={{ mb, display: 'flex', alignItems: 'center' }}>
            <TaskIcon sx={{ mr }} />
            개인화된 할 일 추천 ({recommendations.length}개)
          </Typography>
          
          {recommendations.map((recommendation, index) => (
            <Card key={index} sx={{ mb, position: 'relative' }}>
              
                {/* 신뢰도 배지 */}
                <Box sx={{ position: 'absolute', top, right }}>
                  <Badge
                    badgeContent={`${Math.round(recommendation.confidence * 100)}%`}
                    color={recommendation.confidence > 0.8 ? 'success' : recommendation.confidence > 0.6 ? 'warning' : 'default'}
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }
                    }}
                  >
                    <AIIcon color="primary" />
                  </Badge>
                </Box>

                {/* 메인 콘텐츠 */}
                <Box sx={{ pr }}>
                  <Typography variant="h6" component="h3" sx={{ mb, fontWeight: 'bold' }}>
                    {recommendation.title}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb }}>
                    {recommendation.description}
                  </Typography>

                  {/* 메타데이터 */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb }}>
                    <Chip
                      label={getPriorityLabel(recommendation.priority)}
                      size="small"
                      sx={{ 
                        bgcolor(recommendation.priority), 
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                    <Chip
                      label={recommendation.category}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<ClockIcon />}
                      label={formatTime(recommendation.estimated_time)}
                      size="small"
                      variant="outlined"
                    />
                    {recommendation.optimal_time && (
                      <Chip
                        icon={<TimeIcon />}
                        label={`최적: ${recommendation.optimal_time}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  {/* 추천 이유 (확장 가능) */}
                  
                    <Button
                      size="small"
                      onClick={() => setExpandedCard(expandedCard === index ? null : index)}
                      endIcon={expandedCard === index ? <CollapseIcon /> : <ExpandIcon />}
                      sx={{ mb }}
                    >
                      추천 이유 보기
                    </Button>
                    
                    <Collapse in={expandedCard === index}>
                      <Alert severity="info" sx={{ mt }}>
                        <Typography variant="body2">
                          🤔 AI 분석:</strong> {recommendation.reasoning}
                        </Typography>
                      </Alert>
                    </Collapse>
                  </Box>
                </Box>

                {/* 액션 버튼 */}
                <Divider sx={{ my }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ mr }}
                      onClick={() => {
                        // TODO 할 일 생성 로직
                        console.log('할 일 생성:', recommendation.title);
                        alert(`"${recommendation.title}" 할 일이 생성되었습니다!`);
                      }}
                    >
                      할 일로 추가
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        // TODO 보기 로직
                        console.log('나중에 보기:', recommendation.title);
                      }}
                    >
                      나중에
                    </Button>
                  </Box>

                  {/* 피드백 버튼 */}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="도움이 됐어요">
                      <IconButton
                        size="small"
                        onClick={() => handleFeedback(index, 'like')}
                        color={userFeedback[index] === 'like' ? 'success' : 'default'}
                      >
                        <LikeIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="별로예요">
                      <IconButton
                        size="small"
                        onClick={() => handleFeedback(index, 'dislike')}
                        color={userFeedback[index] === 'dislike' ? 'error' : 'default'}
                      >
                        <DislikeIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* 빈 상태 */}
      {!loading && recommendations.length === 0 && !error && (
        <Card sx={{ textAlign: 'center', py }}>
          
            <AIIcon sx={{ fontSize, color: 'text.secondary', mb }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              추천할 작업이 없습니다
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb }}>
              더 나은 추천을 위해 할 일을 더 많이 생성하고 완료해보세요!
            </Typography>
            <Button
              variant="contained"
              onClick={loadRecommendations}
              startIcon={<AIIcon />}
            >
              다시 분석하기
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AIRecommendations;