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
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { aiAPI } from '../services/api';

interface TagRecommendationProps {
  content: string;
  existingTags?: string[];
  onTagSelect: (tag: string) => void;
  disabled?: boolean;
}

const TagRecommendation: React.FC<TagRecommendationProps> = ({
  content,
  existingTags = [],
  onTagSelect,
  disabled = false,
}) => {
  const [recommendedTags, setRecommendedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    if (!content.trim() || content.trim().length < 10) {
      setRecommendedTags([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await aiAPI.recommendTags(content, existingTags);
      setRecommendedTags(response.recommended_tags);
    } catch (err: any) {
      setError('태그 추천을 불러오는데 실패했습니다.');
      console.error('태그 추천 오류:', err);
    } finally {
      setLoading(false);
    }
  }, [content, existingTags]);

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

  const handleTagClick = (tag: string) => {
    onTagSelect(tag);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          AI가 태그를 추천하고 있습니다...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <Button size="small" onClick={handleRefresh} sx={{ ml: 1 }}>
          다시 시도
        </Button>
      </Alert>
    );
  }

  if (recommendedTags.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <AutoAwesomeIcon sx={{ fontSize: 16, color: 'primary.main' }} />
        <Typography variant="body2" color="text.secondary">
          AI 추천 태그
        </Typography>
        <Tooltip title="새로고침">
          <IconButton size="small" onClick={handleRefresh} disabled={disabled}>
            <RefreshIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>
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
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'primary.light',
                color: 'primary.contrastText',
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default TagRecommendation; 