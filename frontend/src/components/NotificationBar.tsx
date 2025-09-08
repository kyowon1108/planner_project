import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Button,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Group as GroupIcon,
  Assignment as AssignmentIcon,
  Article as ArticleIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { inviteAPI, notificationAPI } from '../services/api';
import { useWebSocket } from '../services/websocket';
import { useTheme } from '../contexts/ThemeContext';
import NotificationToast from './NotificationToast';

interface NotificationBarProps {
  onInviteAccepted?: () => void;
}

const NotificationBar: React.FC<NotificationBarProps> = ({ onInviteAccepted }) => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { connect, disconnect, addListener, removeListener } = useWebSocket();
  
            // 초대 알림 상태 (URL 파라미터 방식 제거)
          // const [showNotification, setShowNotification] = useState(false);
          // const [inviteCode, setInviteCode] = useState<string>('');
          // const [isProcessing, setIsProcessing] = useState(false);
          // const [successMessage, setSuccessMessage] = useState<string>('');
  
  // 실시간 알림 상태
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationMenuAnchor, setNotificationMenuAnchor] = useState<null | HTMLElement>(null);
  const [currentToastNotification, setCurrentToastNotification] = useState<any>(null);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const lastLoadTime = useRef(0);
  const LOAD_THROTTLE_MS = 1000; // 1초 간격으로 제한

  // 알림 로딩 함수 (스로틀링 적용)
  const loadNotifications = useCallback(async () => {
    const now = Date.now();
    
    // 이미 로딩 중이거나 스로틀링 시간이 안지났으면 건너뛰기
    if (isLoadingNotifications || (now - lastLoadTime.current < LOAD_THROTTLE_MS)) {
      console.log('알림 로딩을 건너뜁니다:', {
        isLoading: isLoadingNotifications,
        timeSinceLastLoad: now - lastLoadTime.current
      });
      return;
    }

    try {
      lastLoadTime.current = now;
      setIsLoadingNotifications(true);
      const data = await notificationAPI.getNotifications();
      console.log('로드된 알림:', data);
      
      // 중복 제거 및 유효한 알림만 필터링
      const validNotifications = data.filter((notification: any) => {
        return notification && 
               notification.id && 
               notification.title && 
               notification.message &&
               notification.type;
      });
      
      setNotifications(validNotifications);
      console.log('설정된 알림:', validNotifications);
      
    } catch (error) {
      console.error('알림 로드 실패:', error);
      setNotifications([]);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [isLoadingNotifications, LOAD_THROTTLE_MS]);

  // WebSocket 연결 및 알림 리스너 설정
  useEffect(() => {
    if (user?.id) {
      connect();
      
      // 실시간 알림 리스너
      const handleNotification = (data: any) => {
        console.log('실시간 알림 수신:', data);
        
        // 새로운 NotificationToast 형식으로 데이터 변환
        const toastData = data.type === 'realtime_notification' ? data.data : data;
        
        setNotifications(prev => [toastData, ...prev]);
        setCurrentToastNotification(toastData);
      };
      
      addListener('notification', handleNotification);
      
      return () => {
        removeListener('notification', handleNotification);
        disconnect();
      };
    }
  }, [user?.id, connect, disconnect, addListener, removeListener]);

  // 초기 알림 로드 (별도 useEffect)
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user?.id, loadNotifications]);

            // URL 파라미터 초대 알림 제거 (알림 메뉴에서 처리)
          // useEffect(() => {
          //   const urlParams = new URLSearchParams(window.location.search);
          //   const code = urlParams.get('invite');
          //   if (code) {
          //     setInviteCode(code);
          //     setShowNotification(true);
          //   }
          // }, []);

    // URL 파라미터 초대 관련 함수들 제거 (알림 메뉴에서 처리)
  // const handleAcceptInvite = async () => { ... };
  // const handleRejectInvite = () => { ... };
  // const handleCloseNotification = () => { ... };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationMenuAnchor(event.currentTarget);
    // 메뉴가 닫혀있을 때만 알림 로드
    if (!notificationMenuAnchor && !isLoadingNotifications) {
      loadNotifications();
    }
  };

  const handleNotificationMenuClose = () => {
    setNotificationMenuAnchor(null);
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      // 초대 알림이 아닌 경우 UI에서 제거
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('알림 삭제 실패:', error);
    }
  };

  const handleInviteAction = async (notification: any, action: 'accept' | 'reject') => {
    try {
      // 먼저 알림을 UI에서 제거 (즉시 반응)
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      
      if (action === 'accept') {
        // 팀 초대 수락 로직
        console.log('팀 초대 수락:', notification);
        
        // 실제 초대 코드가 있으면 수락 처리
        if (notification.related_id) {
          // 팀 ID로 초대 코드 찾기
          try {
            const pendingInvites = await inviteAPI.getPendingInvites();
            const invite = pendingInvites.find((inv: any) => inv.team_id === notification.related_id);
            
            if (invite) {
              const response = await inviteAPI.acceptInvite(invite.code);
              console.log('팀 초대 수락 처리됨:', response);
            } else {
              console.error('초대 코드를 찾을 수 없음:', notification.related_id);
              alert('초대 코드를 찾을 수 없습니다.');
            }
          } catch (inviteError) {
            console.error('초대 처리 실패:', inviteError);
            alert('초대 처리에 실패했습니다.');
          }
        }
        
        alert('팀 초대를 수락했습니다!');
      } else {
        // 팀 초대 거절 로직
        console.log('팀 초대 거절:', notification);
        
        // 실제 초대 코드가 있으면 거절 처리
        if (notification.related_id) {
          // 팀 ID로 초대 코드 찾기
          try {
            const pendingInvites = await inviteAPI.getPendingInvites();
            const invite = pendingInvites.find((inv: any) => inv.team_id === notification.related_id);
            
            if (invite) {
              const response = await inviteAPI.rejectInvite(invite.code);
              console.log('팀 초대 거절 처리됨:', response);
            } else {
              console.error('초대 코드를 찾을 수 없음:', notification.related_id);
              alert('초대 코드를 찾을 수 없습니다.');
            }
          } catch (inviteError) {
            console.error('초대 처리 실패:', inviteError);
            alert('초대 처리에 실패했습니다.');
          }
        }
        
        alert('팀 초대를 거절했습니다.');
      }
      
      // 백엔드에서 알림 삭제
      try {
        await notificationAPI.deleteNotification(notification.id);
        console.log('알림 삭제 성공:', notification.id);
      } catch (deleteError) {
        console.error('알림 삭제 실패:', deleteError);
        // 삭제 실패 시 알림을 다시 추가
        setNotifications(prev => [...prev, notification]);
      }
      
      // 메뉴 닫기
      setNotificationMenuAnchor(null);
      
    } catch (error) {
      console.error('팀 초대 처리 실패:', error);
      alert('팀 초대 처리에 실패했습니다.');
      // 실패 시 알림을 다시 추가
      setNotifications(prev => [...prev, notification]);
    }
  };

  // NotificationToast에서 액션 처리
  const handleToastAction = async (action: string, data: any) => {
    if (action === 'accept' || action === 'reject') {
      await handleInviteAction(data, action);
    } else if (action === 'view_todo') {
      // 할 일 보기 - 해당 페이지로 이동
      console.log('할 일 보기:', data);
      // TODO: 실제 할 일 페이지로 라우팅
    }
    
    // 토스트 알림 닫기
    setCurrentToastNotification(null);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      // 초대 알림을 제외하고 UI에서 제거
      setNotifications(prev => prev.filter(n => n.type === 'team_invite'));
    } catch (error) {
      console.error('모든 알림 삭제 실패:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'team_invite': return <GroupIcon />;
      case 'todo_assigned': return <AssignmentIcon />;
      case 'post_comment': return <ArticleIcon />;
      default: return <NotificationsIcon />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'team_invite': return '#2196F3'; // 파란색
      case 'todo_assigned': return '#FF9800'; // 주황색
      case 'post_comment': return '#4CAF50'; // 초록색
      default: return '#757575'; // 회색
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      {/* 알림 아이콘 */}
      <IconButton
        color="inherit"
        onClick={handleNotificationClick}
        sx={{ position: 'relative' }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      {/* 알림 메뉴 */}
      <Menu
        anchorEl={notificationMenuAnchor}
        open={Boolean(notificationMenuAnchor)}
        onClose={handleNotificationMenuClose}
        PaperProps={{
          sx: {
            width: 350,
            maxHeight: 400,
            background: darkMode 
              ? 'rgba(30,30,30,0.98)' 
              : 'rgba(255,255,255,0.98)',
            border: darkMode 
              ? '1px solid rgba(255,255,255,0.1)' 
              : '1px solid rgba(0,0,0,0.1)',
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">알림</Typography>
            {unreadCount > 0 && (
              <Button size="small" onClick={handleMarkAllAsRead}>
                모두 읽음
              </Button>
            )}
          </Box>
        </Box>
        
                        {notifications.length === 0 ? (
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                      알림이 없습니다
                    </Typography>
                  </MenuItem>
                ) : (
                  notifications.slice(0, 10).map((notification) => (
                    <MenuItem
                      key={notification.id}
                      onClick={() => notification.type !== 'team_invite' && handleMarkAsRead(notification.id)}
                      sx={{
                        bgcolor: notification.is_read ? 'transparent' : 'action.hover',
                        borderLeft: notification.is_read ? 'none' : '3px solid',
                        borderColor: getNotificationColor(notification.type),
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                        position: 'relative',
                      }}
                    >
                      <ListItemIcon>
                        <Box sx={{ color: getNotificationColor(notification.type) }}>
                          {getNotificationIcon(notification.type)}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={notification.title}
                        secondary={notification.message}
                        primaryTypographyProps={{
                          variant: 'body2',
                          fontWeight: notification.is_read ? 'normal' : 'bold',
                          color: getNotificationColor(notification.type),
                        }}
                        secondaryTypographyProps={{
                          variant: 'caption',
                        }}
                      />
                      
                      {/* 팀 초대 알림인 경우 수락/거절 버튼 */}
                      {notification.type === 'team_invite' && (
                        <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            color="success"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInviteAction(notification, 'accept');
                            }}
                            sx={{ 
                              minWidth: 'auto',
                              px: 1,
                              py: 0.5,
                              fontSize: '0.75rem',
                              borderColor: 'success.main',
                              color: 'success.main',
                              '&:hover': {
                                borderColor: 'success.dark',
                                bgcolor: 'success.light',
                                color: 'success.dark',
                              }
                            }}
                          >
                            수락
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInviteAction(notification, 'reject');
                            }}
                            sx={{ 
                              minWidth: 'auto',
                              px: 1,
                              py: 0.5,
                              fontSize: '0.75rem',
                              borderColor: 'error.main',
                              color: 'error.main',
                              '&:hover': {
                                borderColor: 'error.dark',
                                bgcolor: 'error.light',
                                color: 'error.dark',
                              }
                            }}
                          >
                            거절
                          </Button>
                        </Box>
                      )}
                    </MenuItem>
                  ))
                )}
      </Menu>

      {/* URL 파라미터 초대 알림 제거 (알림 메뉴에서 처리) */}
      {/* {showNotification && inviteCode && (
        <Collapse in={showNotification}>
          <Alert>...</Alert>
        </Collapse>
      )} */}

      {/* 실시간 알림 토스트 */}
      <NotificationToast
        notification={currentToastNotification}
        onClose={() => setCurrentToastNotification(null)}
        onAction={handleToastAction}
      />
    </>
  );
};

export default NotificationBar; 