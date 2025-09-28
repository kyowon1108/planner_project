import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { useTheme } from '../../contexts/ThemeContext.jsx';

interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status;
  variant: 'outlined' | 'filled';
  size: 'small' | 'medium';
  showIcon: boolean;
  customColors: {
    background: string;
    text: string;
    border: string;
  };
}

const StatusChip = ({
  status,
  variant = 'filled',
  size = 'small',
  showIcon = false,
  customColors,
  ...chipProps
}) => {
  const { darkMode } = useTheme();

  const getStatusConfig = (status) => {
    const statusLower = status.toLowerCase();
    
    // 할일 상태
    if (statusLower.includes('완료') || statusLower.includes('completed')) {
      return {
        color: 'success',
        icon: '✓',
        label: '완료',
        bgColor ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
        textColor ? '#4caf50' : '#2e7d32',
        borderColor ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.3)',
      };
    }
    
    if (statusLower.includes('진행중') || statusLower.includes('in_progress')) {
      return {
        color: 'warning',
        icon: '⏳',
        label: '진행중',
        bgColor ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.1)',
        textColor ? '#ff9800' : '#f57c00',
        borderColor ? 'rgba(255, 152, 0, 0.3)' : 'rgba(255, 152, 0, 0.3)',
      };
    }
    
    if (statusLower.includes('대기') || statusLower.includes('pending')) {
      return {
        color: 'info',
        icon: '⏸️',
        label: '대기중',
        bgColor ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
        textColor ? '#2196f3' : '#1976d2',
        borderColor ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0.3)',
      };
    }

    // 우선순위
    if (statusLower.includes('긴급') || statusLower.includes('urgent') || statusLower.includes('high')) {
      return {
        color: 'error',
        icon: '🔥',
        label: '긴급',
        bgColor ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.1)',
        textColor ? '#f44336' : '#d32f2f',
        borderColor ? 'rgba(244, 67, 54, 0.3)' : 'rgba(244, 67, 54, 0.3)',
      };
    }
    
    if (statusLower.includes('높음') || statusLower.includes('high')) {
      return {
        color: 'error',
        icon: '🔴',
        label: '높음',
        bgColor ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.1)',
        textColor ? '#f44336' : '#d32f2f',
        borderColor ? 'rgba(244, 67, 54, 0.3)' : 'rgba(244, 67, 54, 0.3)',
      };
    }
    
    if (statusLower.includes('보통') || statusLower.includes('medium')) {
      return {
        color: 'warning',
        icon: '🟡',
        label: '보통',
        bgColor ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.1)',
        textColor ? '#ff9800' : '#f57c00',
        borderColor ? 'rgba(255, 152, 0, 0.3)' : 'rgba(255, 152, 0, 0.3)',
      };
    }
    
    if (statusLower.includes('낮음') || statusLower.includes('low')) {
      return {
        color: 'success',
        icon: '🟢',
        label: '낮음',
        bgColor ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
        textColor ? '#4caf50' : '#2e7d32',
        borderColor ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.3)',
      };
    }

    // 팀 역할
    if (statusLower.includes('owner') || statusLower.includes('소유자')) {
      return {
        color: 'error',
        icon: '👑',
        label: '소유자',
        bgColor ? 'rgba(156, 39, 176, 0.2)' : 'rgba(156, 39, 176, 0.1)',
        textColor ? '#9c27b0' : '#7b1fa2',
        borderColor ? 'rgba(156, 39, 176, 0.3)' : 'rgba(156, 39, 176, 0.3)',
      };
    }
    
    if (statusLower.includes('admin') || statusLower.includes('관리자')) {
      return {
        color: 'warning',
        icon: '⚡',
        label: '관리자',
        bgColor ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.1)',
        textColor ? '#ff9800' : '#f57c00',
        borderColor ? 'rgba(255, 152, 0, 0.3)' : 'rgba(255, 152, 0, 0.3)',
      };
    }
    
    if (statusLower.includes('member') || statusLower.includes('멤버')) {
      return {
        color: 'info',
        icon: '👤',
        label: '멤버',
        bgColor ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
        textColor ? '#2196f3' : '#1976d2',
        borderColor ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0.3)',
      };
    }

    // 플래너 상태
    if (statusLower.includes('진행중')) {
      return {
        color: 'warning',
        icon: '🚀',
        label: '진행중',
        bgColor ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.1)',
        textColor ? '#ff9800' : '#f57c00',
        borderColor ? 'rgba(255, 152, 0, 0.3)' : 'rgba(255, 152, 0, 0.3)',
      };
    }
    
    if (statusLower.includes('대기중')) {
      return {
        color: 'info',
        icon: '⏸️',
        label: '대기중',
        bgColor ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
        textColor ? '#2196f3' : '#1976d2',
        borderColor ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0.3)',
      };
    }
    
    if (statusLower.includes('완료')) {
      return {
        color: 'success',
        icon: '✅',
        label: '완료',
        bgColor ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
        textColor ? '#4caf50' : '#2e7d32',
        borderColor ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.3)',
      };
    }

    // 기본값
    return {
      color: 'default',
      icon: '📋',
      label,
      bgColor ? 'rgba(158, 158, 158, 0.2)' : 'rgba(158, 158, 158, 0.1)',
      textColor ? '#9e9e9e' : '#616161',
      borderColor ? 'rgba(158, 158, 158, 0.3)' : 'rgba(158, 158, 158, 0.3)',
    };
  };

  const config = getStatusConfig(status);
  const colors = customColors || {
    background.bgColor,
    text.textColor,
    border.borderColor,
  };

  return (
    <Chip
      label={showIcon ? `${config.icon} ${config.label}` : config.label}
      color={config.color}
      variant={variant}
      size={size}
      sx={{
        backgroundColor === 'filled' ? colors.background : 'transparent',
        color.text,
        borderColor === 'outlined' ? colors.border : 'transparent',
        fontWeight,
        fontSize === 'small' ? '0.75rem' : '0.875rem',
        '& .MuiChip-label': {
          color.text,
        },
        ...chipProps.sx,
      }}
      {...chipProps}
    />
  );
};

export default StatusChip; 