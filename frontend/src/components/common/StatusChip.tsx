import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import { useTheme } from '../../contexts/ThemeContext';

interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: string;
  variant?: 'outlined' | 'filled';
  size?: 'small' | 'medium';
  showIcon?: boolean;
  customColors?: {
    background?: string;
    text?: string;
    border?: string;
  };
}

const StatusChip: React.FC<StatusChipProps> = ({
  status,
  variant = 'filled',
  size = 'small',
  showIcon = false,
  customColors,
  ...chipProps
}) => {
  const { darkMode } = useTheme();

  const getStatusConfig = (status: string) => {
    const statusLower = status.toLowerCase();
    
    // 할일 상태
    if (statusLower.includes('완료') || statusLower.includes('completed')) {
      return {
        color: 'success' as const,
        icon: '✓',
        label: '완료',
        bgColor: darkMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
        textColor: darkMode ? '#4caf50' : '#2e7d32',
        borderColor: darkMode ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.3)',
      };
    }
    
    if (statusLower.includes('진행중') || statusLower.includes('in_progress')) {
      return {
        color: 'warning' as const,
        icon: '⏳',
        label: '진행중',
        bgColor: darkMode ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.1)',
        textColor: darkMode ? '#ff9800' : '#f57c00',
        borderColor: darkMode ? 'rgba(255, 152, 0, 0.3)' : 'rgba(255, 152, 0, 0.3)',
      };
    }
    
    if (statusLower.includes('대기') || statusLower.includes('pending')) {
      return {
        color: 'info' as const,
        icon: '⏸️',
        label: '대기중',
        bgColor: darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
        textColor: darkMode ? '#2196f3' : '#1976d2',
        borderColor: darkMode ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0.3)',
      };
    }

    // 우선순위
    if (statusLower.includes('긴급') || statusLower.includes('urgent') || statusLower.includes('high')) {
      return {
        color: 'error' as const,
        icon: '🔥',
        label: '긴급',
        bgColor: darkMode ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.1)',
        textColor: darkMode ? '#f44336' : '#d32f2f',
        borderColor: darkMode ? 'rgba(244, 67, 54, 0.3)' : 'rgba(244, 67, 54, 0.3)',
      };
    }
    
    if (statusLower.includes('높음') || statusLower.includes('high')) {
      return {
        color: 'error' as const,
        icon: '🔴',
        label: '높음',
        bgColor: darkMode ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.1)',
        textColor: darkMode ? '#f44336' : '#d32f2f',
        borderColor: darkMode ? 'rgba(244, 67, 54, 0.3)' : 'rgba(244, 67, 54, 0.3)',
      };
    }
    
    if (statusLower.includes('보통') || statusLower.includes('medium')) {
      return {
        color: 'warning' as const,
        icon: '🟡',
        label: '보통',
        bgColor: darkMode ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.1)',
        textColor: darkMode ? '#ff9800' : '#f57c00',
        borderColor: darkMode ? 'rgba(255, 152, 0, 0.3)' : 'rgba(255, 152, 0, 0.3)',
      };
    }
    
    if (statusLower.includes('낮음') || statusLower.includes('low')) {
      return {
        color: 'success' as const,
        icon: '🟢',
        label: '낮음',
        bgColor: darkMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
        textColor: darkMode ? '#4caf50' : '#2e7d32',
        borderColor: darkMode ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.3)',
      };
    }

    // 팀 역할
    if (statusLower.includes('owner') || statusLower.includes('소유자')) {
      return {
        color: 'error' as const,
        icon: '👑',
        label: '소유자',
        bgColor: darkMode ? 'rgba(156, 39, 176, 0.2)' : 'rgba(156, 39, 176, 0.1)',
        textColor: darkMode ? '#9c27b0' : '#7b1fa2',
        borderColor: darkMode ? 'rgba(156, 39, 176, 0.3)' : 'rgba(156, 39, 176, 0.3)',
      };
    }
    
    if (statusLower.includes('admin') || statusLower.includes('관리자')) {
      return {
        color: 'warning' as const,
        icon: '⚡',
        label: '관리자',
        bgColor: darkMode ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.1)',
        textColor: darkMode ? '#ff9800' : '#f57c00',
        borderColor: darkMode ? 'rgba(255, 152, 0, 0.3)' : 'rgba(255, 152, 0, 0.3)',
      };
    }
    
    if (statusLower.includes('member') || statusLower.includes('멤버')) {
      return {
        color: 'info' as const,
        icon: '👤',
        label: '멤버',
        bgColor: darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
        textColor: darkMode ? '#2196f3' : '#1976d2',
        borderColor: darkMode ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0.3)',
      };
    }

    // 플래너 상태
    if (statusLower.includes('진행중')) {
      return {
        color: 'warning' as const,
        icon: '🚀',
        label: '진행중',
        bgColor: darkMode ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 152, 0, 0.1)',
        textColor: darkMode ? '#ff9800' : '#f57c00',
        borderColor: darkMode ? 'rgba(255, 152, 0, 0.3)' : 'rgba(255, 152, 0, 0.3)',
      };
    }
    
    if (statusLower.includes('대기중')) {
      return {
        color: 'info' as const,
        icon: '⏸️',
        label: '대기중',
        bgColor: darkMode ? 'rgba(33, 150, 243, 0.2)' : 'rgba(33, 150, 243, 0.1)',
        textColor: darkMode ? '#2196f3' : '#1976d2',
        borderColor: darkMode ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0.3)',
      };
    }
    
    if (statusLower.includes('완료')) {
      return {
        color: 'success' as const,
        icon: '✅',
        label: '완료',
        bgColor: darkMode ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)',
        textColor: darkMode ? '#4caf50' : '#2e7d32',
        borderColor: darkMode ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.3)',
      };
    }

    // 기본값
    return {
      color: 'default' as const,
      icon: '📋',
      label: status,
      bgColor: darkMode ? 'rgba(158, 158, 158, 0.2)' : 'rgba(158, 158, 158, 0.1)',
      textColor: darkMode ? '#9e9e9e' : '#616161',
      borderColor: darkMode ? 'rgba(158, 158, 158, 0.3)' : 'rgba(158, 158, 158, 0.3)',
    };
  };

  const config = getStatusConfig(status);
  const colors = customColors || {
    background: config.bgColor,
    text: config.textColor,
    border: config.borderColor,
  };

  return (
    <Chip
      label={showIcon ? `${config.icon} ${config.label}` : config.label}
      color={config.color}
      variant={variant}
      size={size}
      sx={{
        backgroundColor: variant === 'filled' ? colors.background : 'transparent',
        color: colors.text,
        borderColor: variant === 'outlined' ? colors.border : 'transparent',
        fontWeight: 500,
        fontSize: size === 'small' ? '0.75rem' : '0.875rem',
        '& .MuiChip-label': {
          color: colors.text,
        },
        ...chipProps.sx,
      }}
      {...chipProps}
    />
  );
};

export default StatusChip; 