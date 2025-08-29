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
  Analytics as AnalyticsIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  TrendingUp as TrendingUpIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import UXAnalyticsDashboard from '../components/UXAnalyticsDashboard';
import { uxAnalytics } from '../services/uxAnalytics';
import { logger } from '../utils/logger';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ux-tabpanel-${index}`}
      aria-labelledby={`ux-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const UXAnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSessionSelect = (sessionId: string) => {
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
      <Alert severity="warning" sx={{ m: 2 }}>
        UX 분석을 보려면 로그인이 필요합니다.
      </Alert>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <AnalyticsIcon sx={{ mr: 2 }} />
          UX 분석 대시보드
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          사용자 경험 분석 및 성능 모니터링
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
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
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ mb: 3 }}>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1 }}>
            데이터를 불러오는 중...
          </Typography>
        </Box>
      )}

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="UX 분석 탭"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
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
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {sessions.map((session) => (
              <Box key={session.id} sx={{ flex: '1 1 300px', minWidth: 0 }}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: selectedSessionId === session.id ? 2 : 1,
                    borderColor: selectedSessionId === session.id ? 'primary.main' : 'divider'
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
                    <Box sx={{ mt: 2 }}>
                      <Chip 
                        label={`${session.screenSize.width}x${session.screenSize.height}`}
                        size="small"
                        sx={{ mr: 1 }}
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
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
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
            
            <Box sx={{ flex: '1 1 300px', minWidth: 0 }}>
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