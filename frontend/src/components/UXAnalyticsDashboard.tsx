import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Chip,
  LinearProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Error as ErrorIcon,
  Visibility as VisibilityIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { uxAnalytics, UXAnalysis } from '../services/uxAnalytics';

interface UXAnalyticsDashboardProps {
  sessionId?: string;
}

const UXAnalyticsDashboard: React.FC<UXAnalyticsDashboardProps> = ({ sessionId }) => {
  const [analysis, setAnalysis] = useState<UXAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  useEffect(() => {
    if (sessionId) {
      analyzeSession(sessionId);
    } else {
      analyzeCurrentSession();
    }
  }, [sessionId]);

  const analyzeSession = async (targetSessionId: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = uxAnalytics.analyzeSession(targetSessionId);
      setAnalysis(result);
    } catch (err) {
      setError('세션 분석에 실패했습니다.');
      console.error('Session analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeCurrentSession = () => {
    const currentSession = uxAnalytics.getCurrentSession();
    if (currentSession) {
      try {
        const result = uxAnalytics.analyzeSession(currentSession.id);
        setAnalysis(result);
      } catch (err) {
        setError('현재 세션 분석에 실패했습니다.');
        console.error('Current session analysis error:', err);
      }
    }
  };

  const getUsabilityScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getPerformanceColor = (loadTime: number) => {
    if (loadTime < 1000) return 'success';
    if (loadTime < 3000) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 1 }}>
          UX 분석 중...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!analysis) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        분석할 세션 데이터가 없습니다.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <AnalyticsIcon sx={{ mr: 1 }} />
        UX 분석 대시보드
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* 사용성 점수 */}
        <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon sx={{ mr: 1 }} />
                사용성 점수
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h3" sx={{ mr: 2 }}>
                  {analysis.usabilityScore}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  / 100
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={analysis.usabilityScore}
                color={getUsabilityScoreColor(analysis.usabilityScore) as any}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Box>

        {/* 성능 메트릭 */}
        <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <SpeedIcon sx={{ mr: 1 }} />
                성능 메트릭
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  페이지 로딩 시간
                </Typography>
                <Typography variant="h6" color={getPerformanceColor(analysis.performanceMetrics.pageLoadTime)}>
                  {analysis.performanceMetrics.pageLoadTime.toFixed(0)}ms
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  상호작용 시간
                </Typography>
                <Typography variant="h6">
                  {Math.round(analysis.performanceMetrics.interactionTime / 1000)}초
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  에러율
                </Typography>
                <Typography variant="h6" color={analysis.performanceMetrics.errorRate > 5 ? 'error' : 'success'}>
                  {analysis.performanceMetrics.errorRate.toFixed(1)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* 사용자 플로우 */}
        <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <TimelineIcon sx={{ mr: 1 }} />
                사용자 플로우
              </Typography>
              <List dense>
                {analysis.userFlow.slice(0, 5).map((flow, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={`${flow.from} → ${flow.to}`}
                      secondary={`${flow.count}회 방문`}
                    />
                    <Chip label={flow.count} size="small" />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* 개선 권장사항 */}
        <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <ErrorIcon sx={{ mr: 1 }} />
                개선 권장사항
              </Typography>
              <List dense>
                {analysis.recommendations.map((recommendation, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={recommendation} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* 히트맵 */}
        <Box sx={{ flex: '1 1 100%', minWidth: 0 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <VisibilityIcon sx={{ mr: 1 }} />
                  클릭 히트맵
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setShowHeatmap(true)}
                >
                  상세 보기
                </Button>
              </Box>
              <Box sx={{ height: 200, bgcolor: 'grey.100', borderRadius: 1, position: 'relative' }}>
                {analysis.heatmapData.slice(0, 20).map((point, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: 'absolute',
                      left: `${point.x}%`,
                      top: `${point.y}%`,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: `rgba(255, 0, 0, ${Math.min(point.intensity / 5, 0.8)})`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* 히트맵 상세 다이얼로그 */}
      <Dialog
        open={showHeatmap}
        onClose={() => setShowHeatmap(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>클릭 히트맵 상세</DialogTitle>
        <DialogContent>
          <Box sx={{ height: 400, bgcolor: 'grey.100', borderRadius: 1, position: 'relative' }}>
            {analysis.heatmapData.map((point, index) => (
              <Box
                key={index}
                sx={{
                  position: 'absolute',
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: `rgba(255, 0, 0, ${Math.min(point.intensity / 5, 0.8)})`,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: 'rgba(255, 0, 0, 1)',
                    transform: 'translate(-50%, -50%) scale(1.5)',
                  },
                }}
                title={`클릭 ${point.intensity}회`}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowHeatmap(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UXAnalyticsDashboard; 