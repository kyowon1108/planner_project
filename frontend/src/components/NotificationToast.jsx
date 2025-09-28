import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Box,
  Typography,
  Slide,
  SlideProps
} from '@mui/material';
import {
  Notifications,
  Group,
  Assignment,
  Article,
  CheckCircle,
  Schedule,
  Warning,
  Announcement,
  Assessment
} from '@mui/icons-material';

const SlideTransition = React.forwardRef<unknown, SlideProps>((props, ref) => {
  return <Slide direction="down" ref={ref} {...props} />;
});

const NotificationToast = ({
  notification,
  onClose,
  onAction
}) => {
  const [open, setOpen] = useState(false);
  const [autoHideDuration, setAutoHideDuration] = useState(6000);

  useEffect(() => {
    if (notification) {
      setOpen(true);
      
      // 우선순위에 따라 자동 숨김 시간 조정
      switch (notification.priority) {
        case 'urgent':
          setAutoHideDuration(10000); // 10초
          break;
        case 'high':
          setAutoHideDuration(8000); // 8초
          break;
        case 'medium':
          setAutoHideDuration(6000); // 6초
          break;
        case 'low':
          setAutoHideDuration(4000); // 4초
          break;
        default(6000);
      }
      
      // 알림음 재생 (선택사항)
      playNotificationSound(notification.sound);
    }
  }, [notification]);

  const handleClose = (event: React | Event, reason: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
    setTimeout(onClose, 200); // 애니메이션 완료 후 상태 클리어
  };

  const playNotificationSound = (soundType) => {
    try {
      // 브라우저 알림음 재생 (실제 환경에서는 오디오 파일 사용 권장)
      if ('speechSynthesis' in window && soundType !== 'silent') {
        // 간단한 비프음 대신 진동으로 대체 (모바일에서)
        if ('vibrate' in navigator) {
          navigator.vibrate([200]);
        }
      }
    } catch (error) {
      console.warn('알림음 재생 실패:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'team_invite': return <GroupIcon />;
      case 'todo_assigned': return <AssignmentIcon />;
      case 'todo_completed': return <CheckCircleIcon />;
      case 'todo_comment': return <ArticleIcon />;
      case 'post_comment': return <ArticleIcon />;
      case 'post_like': return <CheckCircleIcon />;
      case 'deadline_approaching': return <ScheduleIcon />;
      case 'deadline_urgent': return <WarningIcon />;
      case 'daily_summary': return <AssessmentIcon />;
      case 'system_announcement': return <AnnouncementIcon />;
      default: return <NotificationsIcon />;
    }
  };

  const getAlertSeverity = (priority) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'info';
    }
  };

  const getNotificationActions = () => {
    if (!notification || !onAction) return null;

    // 팀 초대 알림인 경우 수락/거절 버튼 표시
    if (notification.notification_type === 'team_invite') {
      return (
        <Box sx={{ display: 'flex', gap: 1, mt }}>
          <button
            style={{
              padding: '4px 8px',
              border: '1px solid #4CAF50',
              borderRadius: '4px',
              background: 'transparent',
              color: '#4CAF50',
              fontSize: '12px',
              cursor: 'pointer'
            }}
            onClick={() => onAction('accept', notification)}
          >
            수락
          </button>
          <button
            style={{
              padding: '4px 8px',
              border: '1px solid #f44336',
              borderRadius: '4px',
              background: 'transparent',
              color: '#f44336',
              fontSize: '12px',
              cursor: 'pointer'
            }}
            onClick={() => onAction('reject', notification)}
          >
            거절
          </button>
        </Box>
      );
    }

    // 할 일 관련 알림인 경우 바로가기 버튼
    if (notification.notification_type.startsWith('todo_') && notification.related_id) {
      return (
        <Box sx={{ mt }}>
          <button
            style={{
              padding: '4px 8px',
              border: '1px solid #2196F3',
              borderRadius: '4px',
              background: 'transparent',
              color: '#2196F3',
              fontSize: '12px',
              cursor: 'pointer'
            }}
            onClick={() => onAction('view_todo', notification)}
          >
            할 일 보기
          </button>
        </Box>
      );
    }

    return null;
  };

  if (!notification) return null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      TransitionComponent={SlideTransition}
      sx={{
        mt, // AppBar 아래 위치
        '& .MuiSnackbarContent-root': {
          minWidth: '350px',
          maxWidth: '500px'
        }
      }}
    >
      <Alert
        severity={getAlertSeverity(notification.priority)}
        onClose={handleClose}
        sx={{
          width: '100%',
          alignItems: 'flex-start',
          '& .MuiAlert-icon': {
            color.color || 'inherit'
          }
        }}
        icon={getNotificationIcon(notification.notification_type)}
      >
        <AlertTitle sx={{ mb: 0.5, fontWeight: 'bold' }}>
          {notification.title}
        </AlertTitle>
        <Typography variant="body2" sx={{ mb }}>
          {notification.message}
        </Typography>
        
        {/* 타임스탬프 */}
        <Typography variant="caption" color="text.secondary">
          {new Date(notification.timestamp).toLocaleTimeString()}
        </Typography>
        
        {/* 액션 버튼들 */}
        {getNotificationActions()}
      </Alert>
    </Snackbar>
  );
};

export default NotificationToast;