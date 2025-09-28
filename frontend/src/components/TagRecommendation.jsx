import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Chip,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Badge,
  Collapse,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  AutoAwesome,
  Refresh,
  Psychology,
  TrendingUp,
  Schedule,
  Category,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { aiAPI, TextAnalysisResult } from '../services/api';

const TagRecommendation = ({
  content,
  existingTags = [],
  onTagSelect,
  onPriorityChange,
  onCategoryChange,
  onEstimatedTimeChange,
  disabled = false,
  showAdvancedAnalysis = false,
}) => {
  const [recommendedTags, setRecommendedTags] = useState([]);
  const [textAnalysis, setTextAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    if (!content.trim() || content.trim().length < 10) {
      setRecommendedTags([]);
      setTextAnalysis(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      if (showAdvancedAnalysis) {
        // 고도화된 텍스트 분석 사용
        const analysis = await aiAPI.analyzeTextAdvanced(content, 'comprehensive');
        setTextAnalysis(analysis);
        setRecommendedTags(analysis.tags);
        
        // 콜백 호출로 부모 컴포넌트에 정보 전달
        if (onPriorityChange) onPriorityChange(analysis.priority);
        if (onCategoryChange) onCategoryChange(analysis.category);
        if (onEstimatedTimeChange) onEstimatedTimeChange(analysis.suggestions.estimated_time);
      } else {
        // 기본 태그 추천
        const response = await aiAPI.recommendTags(content, existingTags);
        setRecommendedTags(response.recommended_tags);
      }
    } catch (err) {
      setError('AI 분석을 불러오는데 실패했습니다.');
      console.error('AI 분석 오류:', err);
    } finally {
      setLoading(false);
    }
  }, [content, existingTags, showAdvancedAnalysis, onPriorityChange, onCategoryChange, onEstimatedTimeChange]);

  useEffect(() => {
    // 내용이 변경될 때마다 자동으로 추천 요청
    const timeoutId = setTimeout(() => {
      fetchRecommendations();
    }, 2000); // 2초 딜레이로 변경

    return () => clearTimeout(timeoutId);
  }, [fetchRecommendations]);

  const handleRefresh = () => {
    fetchRecommendations();
  };

  const handleTagClick = (tag) => {
    onTagSelect(tag);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'primary';
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '#4caf50';
      case 'negative': return '#f44336';
      case 'neutral': return '#757575';
      default: return '#757575';
    }
  };

  if (loading) {
    return (
      <Box sx={{ mb }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            {showAdvancedAnalysis ? 'AI가 종합 분석 중입니다...' : 'AI가 태그를 추천하고 있습니다...'}
          </Typography>
        </Box>
        {showAdvancedAnalysis && (
          <LinearProgress sx={{ mt }} />
        )}
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb }}>
        {error}
        <Button size="small" onClick={handleRefresh} sx={{ ml }}>
          다시 시도
        </Button>
      </Alert>
    );
  }

  if (recommendedTags.length === 0 && !textAnalysis) {
    return null;
  }

  return (
    <Box sx={{ mb }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge badgeContent={recommendedTags.length} color="primary">
            <BrainIcon sx={{ fontSize, color: 'primary.main' }} />
          </Badge>
          <Typography variant="body2" color="text.secondary" fontWeight="bold">
            {showAdvancedAnalysis ? 'AI 종합 분석' : 'AI 추천 태그'}
          </Typography>
          {textAnalysis && (
            <Chip 
              label={`신뢰도 ${Math.round(textAnalysis.confidence * 100)}%`} 
              size="small" 
              color={textAnalysis.confidence > 0.7 ? 'success' : 'warning'}
            />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {showAdvancedAnalysis && (
            <Tooltip title={showAdvanced ? '간단히 보기' : '상세 분석 보기'}>
              <IconButton 
                size="small" 
                onClick={() => setShowAdvanced(!showAdvanced)}
                disabled={disabled}
              >
                {showAdvanced ? <CollapseIcon /> : <ExpandIcon />}
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="새로고침">
            <IconButton size="small" onClick={handleRefresh} disabled={disabled}>
              <RefreshIcon sx={{ fontSize }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* 추천 태그 */}
      {recommendedTags.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            추천 태그 ({recommendedTags.length}개)
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {recommendedTags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                variant="outlined"
                onClick={() => handleTagClick(tag)}
                disabled={disabled}
                sx={{
                  cursor: disabled ? 'default' : 'pointer',
                  '&:hover': !disabled ? {
                    backgroundColor: 'primary.light',
                    color: 'primary.contrastText',
                  } : {},
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* 고도화된 분석 결과 */}
      {showAdvancedAnalysis && textAnalysis && (
        
          {/* 빠른 정보 카드 */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 1, mb }}>
            <Card variant="outlined" sx={{ p }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingIcon sx={{ fontSize }} color={getPriorityColor(textAnalysis.priority)} />
                
                  <Typography variant="caption" color="text.secondary">우선순위</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {textAnalysis.priority === 'high' ? '높음' : textAnalysis.priority === 'medium' ? '보통' : '낮음'}
                  </Typography>
                </Box>
              </Box>
            </Card>

            <Card variant="outlined" sx={{ p }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CategoryIcon sx={{ fontSize, color: 'info.main' }} />
                
                  <Typography variant="caption" color="text.secondary">카테고리</Typography>
                  <Typography variant="body2" fontWeight="bold">{textAnalysis.category}</Typography>
                </Box>
              </Box>
            </Card>

            <Card variant="outlined" sx={{ p }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TimeIcon sx={{ fontSize, color: 'warning.main' }} />
                
                  <Typography variant="caption" color="text.secondary">예상 시간</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {textAnalysis.suggestions.estimated_time}분
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Box>

          {/* 상세 분석 (확장 가능) */}
          <Collapse in={showAdvanced}>
            <Card variant="outlined" sx={{ mt }}>
              <CardContent sx={{ pt }}>
                <Typography variant="subtitle2" gutterBottom>
                  🧠 상세 AI 분석
                </Typography>
                
                {/* 감정 분석 */}
                <Box sx={{ mb }}>
                  <Typography variant="caption" color="text.secondary">감정 분석</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box 
                      sx={{ 
                        width, 
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: getSentimentColor(textAnalysis.sentiment) 
                      }} 
                    />
                    <Typography variant="body2">
                      {textAnalysis.sentiment === 'positive' ? '긍정적' : 
                       textAnalysis.sentiment === 'negative' ? '부정적' : '중립적'}
                    </Typography>
                  </Box>
                </Box>

                {/* 키워드 */}
                <Box sx={{ mb }}>
                  <Typography variant="caption" color="text.secondary">추출된 키워드</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {textAnalysis.keywords.slice(0, 8).map((keyword, index) => (
                      <Chip 
                        key={index} 
                        label={keyword} 
                        size="small" 
                        variant="filled"
                        sx={{ fontSize: '0.7rem', height }}
                      />
                    ))}
                  </Box>
                </Box>

                {/* 주제 */}
                {textAnalysis.topics.length > 0 && (
                  <Box sx={{ mb }}>
                    <Typography variant="caption" color="text.secondary">관련 주제</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {textAnalysis.topics.map((topic, index) => (
                        <Chip 
                          key={index} 
                          label={topic} 
                          size="small" 
                          color="secondary"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* 제안사항 */}
                
                  <Typography variant="caption" color="text.secondary">AI 제안</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight.4 }}>
                      • 최적 수행 시간: {textAnalysis.suggestions.best_time_slots.join(', ')}
                    </Typography>
                    {textAnalysis.suggestions.related_tasks.length > 0 && (
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', lineHeight.4 }}>
                        • 관련 작업: {textAnalysis.suggestions.related_tasks.slice(0, 3).join(', ')}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Collapse>
        </Box>
      )}
    </Box>
  );
};

export default TagRecommendation; 