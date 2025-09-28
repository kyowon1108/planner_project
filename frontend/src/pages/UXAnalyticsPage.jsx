import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Alert,
  Chip,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Analytics,
  Timeline,
  Speed,
  TrendingUp,
  Download,
  Refresh,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext.jsx';
import UXAnalyticsDashboard from '../components/UXAnalyticsDashboard.jsx';
import { uxAnalytics } from '../services/uxAnalytics';
import { logger } from '../utils/logger';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ux-tabpanel-${index}`}
      aria-labelledby={`ux-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p }}>{children}</Box>}
    </div>
  );
}

const UXAnalyticsPage = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 모든 세션 가져오기
      const allSessions = uxAnalytics.getAllSessions();
      setSessions(allSessions);
      
      // 현재 세션을 기본으로 선택
      const currentSession = uxAnalytics.getCurrentSession();
      if (currentSession) {
        setSelectedSessionId(currentSession.id);
      }
      
      logger.logUserAction('UX Analytics 페이지 로드');
    } catch (err) {
      setError('세션 데이터를 불러오는데 실패했습니다.');
      logger.error(`UX Analytics 페이지 로드 실패: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSessionSelect = (sessionId) => {
    setSelectedSessionId(sessionId);
  };

  const handleRefresh = () => {
    loadSessions();
  };

  const handleExportData = () => {
    try {
      const currentSession = uxAnalytics.getCurrentSession();
      if (currentSession) {
        const analysis = uxAnalytics.analyzeSession(currentSession.id);
        const dataStr = JSON.stringify(analysis, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ux-analysis-${currentSession.id}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        logger.logUserAction('UX 분석 데이터 내보내기');
      }
    } catch (err) {
      setError('데이터 내보내기에 실패했습니다.');
      logger.error(`UX 분석 데이터 내보내기 실패: ${err}`);
    }
  };

  if (!user) {
    return (
      <Alert severity="warning" sx={{ m }}>
        UX 분석을 보려면 로그인이 필요합니다.
      </Alert>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt, mb }}>
      <Box sx={{ mb }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <AnalyticsIcon sx={{ mr }} />
          UX 분석 대시보드
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb }}>
          사용자 경험 분석 및 성능 모니터링
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mb }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            새로고침
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportData}
          >
            데이터 내보내기
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ mb }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt }}>
            데이터를 불러오는 중...
          </Typography>
        </Box>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="UX 분석 탭"
          sx={{ borderBottom, borderColor: 'divider' }}
        >
          <Tab label="실시간 분석" icon={<TrendingUpIcon />} />
          <Tab label="세션 관리" icon={<TimelineIcon />} />
          <Tab label="성능 모니터링" icon={<SpeedIcon />} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="h6" gutterBottom>
            실시간 UX 분석
          </Typography>
          <UXAnalyticsDashboard sessionId={selectedSessionId || undefined} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            세션 관리
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {sessions.map((session) => (
              <Box key={session.id} sx={{ flex: '1 1 300px', minWidth }}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border === session.id ? 2 : 1,
                    borderColor === session.id ? 'primary.main' : 'divider'
                  }}
                  onClick={() => handleSessionSelect(session.id)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      세션 {session.id.slice(-8)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      시작: {new Date(session.startTime).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      이벤트 수: {session.events.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      경로: {session.path}
                    </Typography>
                    <Box sx={{ mt }}>
                      <Chip 
                        label={`${session.screenSize.width}x${session.screenSize.height}`}
                        size="small"
                        sx={{ mr }}
                      />
                      <Chip 
                        label={session.userAgent.includes('Chrome') ? 'Chrome' : 'Other'}
                        size="small"
                        color="primary"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
          
          {sessions.length === 0 && (
            <Alert severity="info">
              아직 수집된 세션 데이터가 없습니다.
            </Alert>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            성능 모니터링
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ flex: '1 1 300px', minWidth }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    시스템 성능
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    실시간 시스템 메트릭을 확인할 수 있습니다.
                  </Typography>
                  {/* 여기에 시스템 성능 차트 추가 */}
                </CardContent>
              </Card>
            </Box>
            
            <Box sx={{ flex: '1 1 300px', minWidth }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    사용자 피드백
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    수집된 사용자 피드백을 확인할 수 있습니다.
                  </Typography>
                  {/* 여기에 사용자 피드백 차트 추가 */}
                </CardContent>
              </Card>
            </Box>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default UXAnalyticsPage; 