import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Avatar,
  AvatarGroup,
  LinearProgress,
  Chip,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Paper,
  IconButton,
  Tooltip,
  Badge,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Groups,
  TrendingUp,
  Schedule,
  Assignment,
  Insights,
  Star,
  Warning,
  CheckCircle,
  Lightbulb,
  AccessTime,
  People,
  Assessment,
  Refresh,
  Timeline,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { aiAPI } from '../services/api';

;
  collaboration_patterns: {
    most_productive_pairs;
    communication_frequency;
    knowledge_sharing_score;
  };
  optimal_meeting_times;
  team_strengths;
  improvement_areas;
}

const TeamProductivityInsights = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const [teamData, setTeamData] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [timePeriod, setTimePeriod] = useState('week');

  useEffect(() => {
    if (user) {
      loadTeamInsights();
      loadMockTeamMembers(); // TODO 팀 멤버 API 호출로 대체
    }
  }, [user, selectedTeam, timePeriod]);

  const loadTeamInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const insights = await aiAPI.getTeamCollaborationSuggestions(selectedTeam || undefined);
      setTeamData(insights);
    } catch (error) {
      console.error('팀 생산성 인사이트 로드 실패:', error);
      setError('팀 생산성 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadMockTeamMembers = () => {
    // TODO API로 대체
    const mockMembers = [
      {
        id: 1,
        name: '김개발',
        role: '프론트엔드 개발자',
        workload,
        productivity_score,
        completed_tasks,
        pending_tasks,
      },
      {
        id,
        name: '이테스터',
        role: 'QA 엔지니어',
        workload,
        productivity_score,
        completed_tasks,
        pending_tasks,
      },
      {
        id,
        name: '박기획',
        role: '프로젝트 매니저',
        workload,
        productivity_score,
        completed_tasks,
        pending_tasks,
      },
      {
        id,
        name: '최디자인',
        role: 'UI/UX 디자이너',
        workload,
        productivity_score,
        completed_tasks,
        pending_tasks,
      },
    ];
    setTeamMembers(mockMembers);
  };

  const getWorkloadColor = (workload) => {
    if (workload >= 80) return 'error';
    if (workload >= 60) return 'warning';
    return 'success';
  };

  const getProductivityColor = (score) => {
    if (score >= 85) return '#4caf50';
    if (score >= 70) return '#ff9800';
    return '#f44336';
  };

  const getBalanceStatusIcon = (status) => {
    switch (status) {
      case 'balanced': return <SuccessIcon color="success" />;
      case 'unbalanced': return <WarningIcon color="warning" />;
      default <InsightsIcon color="primary" />;
    }
  };

  if (!user) {
    return (
      <Alert severity="info">
        팀 생산성 인사이트를 보려면 로그인해주세요.
      </Alert>
    );
  }

  return (
    <Box sx={{ p }}>
      {/* 헤더 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TeamIcon sx={{ mr, color: 'primary.main', fontSize }} />
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              👥 팀 생산성 인사이트
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              팀의 협업 패턴과 생산성을 분석하여 최적화 제안을 제공합니다
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth }}>
            <InputLabel>기간</InputLabel>
            <Select
              value={timePeriod}
              label="기간"
              onChange={(e) => setTimePeriod(e.target.value)}
            >
              <MenuItem value="week">최근 1주</MenuItem>
              <MenuItem value="month">최근 1달</MenuItem>
              <MenuItem value="quarter">최근 3개월</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            onClick={loadTeamInsights}
            disabled={loading}
            startIcon={<RefreshIcon />}
          >
            새로고침
          </Button>
        </Box>
      </Box>

      {/* 로딩 상태 */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my }}>
          <CircularProgress />
        </Box>
      )}

      {/* 에러 상태 */}
      {error && (
        <Alert severity="error" sx={{ mb }}>
          <AlertTitle>오류</AlertTitle>
          {error}
          <Button size="small" onClick={loadTeamInsights} sx={{ mt }}>
            다시 시도
          </Button>
        </Alert>
      )}

      {/* 팀 멤버 개요 */}
      {!loading && teamMembers.length > 0 && (
        <Grid container spacing={3} sx={{ mb }}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb }}>
                  <People sx={{ mr }} />
                  <Typography variant="h6">팀 멤버 현황</Typography>
                  <AvatarGroup max={6} sx={{ ml }}>
                    {teamMembers.map((member) => (
                      <Avatar
                        key={member.id}
                        sx={{
                          bgcolor(member.productivity_score),
                          width,
                          height,
                        }}
                      >
                        {member.name.charAt(0)}
                      </Avatar>
                    ))}
                  </AvatarGroup>
                </Box>
                
                <Grid container spacing={2}>
                  {teamMembers.map((member) => (
                    <Grid item xs={12} sm={6} md={3} key={member.id}>
                      <Paper
                        variant="outlined"
                        sx={{ p, textAlign: 'center', height: '100%' }}
                      >
                        <Avatar
                          sx={{
                            bgcolor(member.productivity_score),
                            mx: 'auto',
                            mb,
                            width,
                            height,
                          }}
                        >
                          {member.name.charAt(0)}
                        </Avatar>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {member.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {member.role}
                        </Typography>
                        
                        {/* 워크로드 */}
                        <Box sx={{ mt }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption">워크로드</Typography>
                            <Typography variant="caption">{member.workload}%</Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={member.workload}
                            color={getWorkloadColor(member.workload)}
                            sx={{ height, borderRadius }}
                          />
                        </Box>
                        
                        {/* 생산성 점수 */}
                        <Box sx={{ mt }}>
                          <Typography variant="caption" color="text.secondary">
                            생산성 점수
                          </Typography>
                          <Typography
                            variant="h6"
                            sx={{ color(member.productivity_score) }}
                          >
                            {member.productivity_score}점
                          </Typography>
                        </Box>
                        
                        {/* 작업 통계 */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt }}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" fontWeight="bold" color="success.main">
                              {member.completed_tasks}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              완료
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="body2" fontWeight="bold" color="warning.main">
                              {member.pending_tasks}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              진행중
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* 팀 협업 인사이트 */}
      {!loading && teamData && (
        <Grid container spacing={3}>
          {/* 워크로드 밸런스 */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb }}>
                  {getBalanceStatusIcon(teamData.workload_balance.status)}
                  <Typography variant="h6" sx={{ ml }}>
                    워크로드 밸런스
                  </Typography>
                  <Chip
                    label={teamData.workload_balance.status === 'balanced' ? '균형' : '불균형'}
                    size="small"
                    color={teamData.workload_balance.status === 'balanced' ? 'success' : 'warning'}
                    sx={{ ml }}
                  />
                </Box>
                
                <List dense>
                  {teamData.workload_balance.recommendations.map((recommendation, index) => (
                    <ListItem key={index}>
                      <ListItemIcon sx={{ minWidth }}>
                        <IdeaIcon sx={{ fontSize, color: 'warning.main' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={recommendation}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* 협업 패턴 */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb }}>
                  <CollaborationIcon color="primary" />
                  <Typography variant="h6" sx={{ ml }}>
                    협업 패턴
                  </Typography>
                  <Badge
                    badgeContent={teamData.collaboration_patterns.knowledge_sharing_score}
                    color="primary"
                    sx={{ ml }}
                  >
                    <StarIcon />
                  </Badge>
                </Box>
                
                <Box sx={{ mb }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    생산적인 페어
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {teamData.collaboration_patterns.most_productive_pairs.map((pair, index) => (
                      <Chip
                        key={index}
                        label={pair}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    커뮤니케이션 빈도: <strong>{teamData.collaboration_patterns.communication_frequency}</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    지식 공유 점수: <strong>{teamData.collaboration_patterns.knowledge_sharing_score}/10</strong>
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* 최적 미팅 시간 */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb }}>
                  <ClockIcon color="primary" />
                  <Typography variant="h6" sx={{ ml }}>
                    최적 미팅 시간
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {teamData.optimal_meeting_times.map((time, index) => (
                    <Chip
                      key={index}
                      label={time}
                      color="primary"
                      variant="filled"
                      icon={<TimeIcon />}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* 팀 강점 */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb }}>
                  <TrendingIcon sx={{ color: 'success.main' }} />
                  <Typography variant="h6" sx={{ ml }}>
                    팀 강점
                  </Typography>
                </Box>
                
                <List dense>
                  {teamData.team_strengths.map((strength, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth }}>
                        <SuccessIcon sx={{ fontSize, color: 'success.main' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={strength}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* 개선 영역 */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb }}>
                  <MetricsIcon sx={{ color: 'warning.main' }} />
                  <Typography variant="h6" sx={{ ml }}>
                    개선 영역
                  </Typography>
                </Box>
                
                <List dense>
                  {teamData.improvement_areas.map((area, index) => (
                    <ListItem key={index} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth }}>
                        <WarningIcon sx={{ fontSize, color: 'warning.main' }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={area}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* AI 종합 분석 */}
          <Grid item xs={12}>
            <Card
              sx={{
                background
                  ? 'linear-gradient(135deg, #1a237e 0%, #3f51b5 100%)'
                  : 'linear-gradient(135deg, #3f51b5 0%, #9c27b0 100%)',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb }}>
                  <InsightsIcon sx={{ mr, color: 'white' }} />
                  <Typography variant="h6" sx={{ color: 'white' }}>
                    🤖 AI 종합 분석 및 제안
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Alert
                      severity="info"
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        '& .MuiAlert-icon': { color: 'white' },
                      }}
                    >
                      <Typography variant="body2">
                        <strong>생산성 트렌드:</strong> 팀 전체 생산성이 지난 주 대비 12% 향상되었습니다.
                        김개발님의 작업 효율성이 특히 눈에 띕니다.
                      </Typography>
                    </Alert>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Alert
                      severity="warning"
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        '& .MuiAlert-icon': { color: 'white' },
                      }}
                    >
                      <Typography variant="body2">
                        <strong>주의 사항:</strong> 워크로드 불균형이 감지되었습니다.
                        작업 재분배를 통해 번아웃을 예방하세요.
                      </Typography>
                    </Alert>
                  </Grid>
                </Grid>
                
                <Box sx={{ mt }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mb }}>
                    💡 <strong>핵심 제안사항:</strong>
                  </Typography>
                  <Grid container spacing={1}>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ textAlign: 'center', p, bgcolor: 'rgba(255,255,255,0.1)', borderRadius }}>
                        <TimelineIcon sx={{ fontSize, color: 'white', mb }} />
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          오전 10-11시에 팀 회의를 진행하면 참여도가 25% 향상됩니다
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ textAlign: 'center', p, bgcolor: 'rgba(255,255,255,0.1)', borderRadius }}>
                        <CollaborationIcon sx={{ fontSize, color: 'white', mb }} />
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          김개발-이테스터 페어가 가장 효율적인 코드 리뷰를 진행합니다
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ textAlign: 'center', p, bgcolor: 'rgba(255,255,255,0.1)', borderRadius }}>
                        <MetricsIcon sx={{ fontSize, color: 'white', mb }} />
                        <Typography variant="body2" sx={{ color: 'white' }}>
                          문서화 프로세스 개선으로 지식 공유 효율성을 높이세요
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* 빈 상태 */}
      {!loading && !teamData && !error && (
        <Card sx={{ textAlign: 'center', py }}>
          <CardContent>
            <TeamIcon sx={{ fontSize, color: 'text.secondary', mb }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              팀 데이터가 없습니다
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb }}>
              팀을 구성하고 작업을 진행하면 생산성 인사이트를 확인할 수 있습니다.
            </Typography>
            <Button
              variant="contained"
              onClick={loadTeamInsights}
              startIcon={<TeamIcon />}
            >
              팀 분석 시작하기
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default TeamProductivityInsights;