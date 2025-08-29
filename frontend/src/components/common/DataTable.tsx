import React from 'react';
import {
  Box,
  Paper,
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  IconButton,
  Button,
  Fade,
  Grow,
  useTheme as useMuiTheme,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '../../contexts/ThemeContext';

interface DataTableColumn<T> {
  key: string;
  label: string;
  render: (item: T, index: number) => React.ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  variant?: 'card' | 'table' | 'list';
  gridColumns?: number | { xs?: number; sm?: number; md?: number; lg?: number };
  animationDelay?: number;
  animateIn?: boolean;
  elevation?: number;
  spacing?: number;
  showActions?: boolean;
  selectable?: boolean;
  selectedItems?: T[];
  onSelectionChange?: (items: T[]) => void;
  getItemKey?: (item: T) => string | number;
}

const DataTable = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  emptyMessage = '데이터가 없습니다.',
  onRowClick,
  actions,
  variant = 'card',
  gridColumns = { xs: 1, sm: 2, md: 3, lg: 4 },
  animationDelay = 0,
  animateIn = true,
  elevation = 8,
  spacing = 3,
  showActions = true,
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  getItemKey = (item: T) => item.id || item.key || JSON.stringify(item),
}: DataTableProps<T>) => {
  const { darkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  const handleRowClick = (item: T) => {
    if (onRowClick) {
      onRowClick(item);
    }
  };

  const handleSelectionChange = (item: T, checked: boolean) => {
    if (!onSelectionChange) return;

    if (checked) {
      onSelectionChange([...selectedItems, item]);
    } else {
      onSelectionChange(selectedItems.filter(selected => getItemKey(selected) !== getItemKey(item)));
    }
  };

  const isSelected = (item: T) => {
    return selectedItems.some(selected => getItemKey(selected) === getItemKey(item));
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          로딩 중...
        </Typography>
      </Box>
    );
  }

  if (data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  const getGridTemplateColumns = () => {
    if (typeof gridColumns === 'number') {
      return `repeat(${gridColumns}, 1fr)`;
    }
    
    return {
      xs: `repeat(${gridColumns.xs || 1}, 1fr)`,
      sm: `repeat(${gridColumns.sm || 2}, 1fr)`,
      md: `repeat(${gridColumns.md || 3}, 1fr)`,
      lg: `repeat(${gridColumns.lg || 4}, 1fr)`,
    };
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: getGridTemplateColumns(),
        gap: spacing,
      }}
    >
      {data.map((item, index) => (
        <Fade 
          in={animateIn} 
          timeout={1000 + index * 100 + animationDelay} 
          key={getItemKey(item)}
        >
          <Paper
            elevation={elevation}
            sx={{
              borderRadius: 3,
              background: darkMode 
                ? 'rgba(45,45,45,0.95)' 
                : 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
              border: darkMode 
                ? '1px solid rgba(64,64,64,0.3)' 
                : '1px solid rgba(255,255,255,0.3)',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              cursor: onRowClick ? 'pointer' : 'default',
              '&:hover': {
                transform: onRowClick ? 'translateY(-4px)' : 'none',
                boxShadow: darkMode 
                  ? '0 20px 40px rgba(0,0,0,0.3)'
                  : '0 20px 40px rgba(0,0,0,0.1)',
              },
              ...(selectable && isSelected(item) && {
                border: '2px solid',
                borderColor: 'primary.main',
                backgroundColor: darkMode 
                  ? 'rgba(25, 118, 210, 0.1)' 
                  : 'rgba(25, 118, 210, 0.05)',
              }),
            }}
            onClick={() => handleRowClick(item)}
          >
            <CardContent sx={{ p: 3 }}>
              {columns.map((column) => (
                <Box
                  key={column.key}
                  sx={{
                    display: 'flex',
                    alignItems: column.align === 'center' ? 'center' : 
                              column.align === 'right' ? 'flex-end' : 'flex-start',
                    mb: column.key === columns[columns.length - 1].key ? 0 : 2,
                    width: column.width || '100%',
                  }}
                >
                  {column.render(item, index)}
                </Box>
              ))}
            </CardContent>
            
            {(showActions && actions) && (
              <CardActions sx={{ p: 2, pt: 0 }}>
                {actions(item)}
              </CardActions>
            )}
          </Paper>
        </Fade>
      ))}
    </Box>
  );
};

export default DataTable; 