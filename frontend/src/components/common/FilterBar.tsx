import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  IconButton,
  Collapse,
  Typography,
  useTheme as useMuiTheme,
  useMediaQuery,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterField {
  key: string;
  label: string;
  type: 'select' | 'text' | 'date' | 'number';
  options?: FilterOption[];
  placeholder?: string;
  defaultValue?: string | number;
}

interface FilterBarProps {
  filters: FilterField[];
  values: Record<string, any>;
  onFilterChange: (key: string, value: any) => void;
  onClearFilters?: () => void;
  showAdvancedFilters?: boolean;
  onAdvancedFiltersToggle?: () => void;
  loading?: boolean;
  variant?: 'horizontal' | 'vertical';
  spacing?: number;
  showClearButton?: boolean;
  showAdvancedToggle?: boolean;
  maxVisibleFilters?: number;
}

const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  values,
  onFilterChange,
  onClearFilters,
  showAdvancedFilters = false,
  onAdvancedFiltersToggle,
  loading = false,
  variant = 'horizontal',
  spacing = 2,
  showClearButton = true,
  showAdvancedToggle = true,
  maxVisibleFilters = 3,
}) => {
  const { darkMode } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

  const visibleFilters = filters.slice(0, maxVisibleFilters);
  const advancedFilters = filters.slice(maxVisibleFilters);

  const hasActiveFilters = () => {
    return Object.values(values).some(value => 
      value !== '' && value !== null && value !== undefined
    );
  };

  const handleClearFilters = () => {
    if (onClearFilters) {
      onClearFilters();
    } else {
      // 기본 동작: 모든 필터를 초기값으로 리셋
      filters.forEach(filter => {
        onFilterChange(filter.key, filter.defaultValue || '');
      });
    }
  };

  const renderFilterField = (filter: FilterField) => {
    const value = values[filter.key] || filter.defaultValue || '';

    switch (filter.type) {
      case 'select':
        return (
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: isMobile ? '100%' : 150,
              bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
              borderRadius: 1,
            }}
          >
            <InputLabel>{filter.label}</InputLabel>
            <Select
              value={value}
              onChange={(e) => onFilterChange(filter.key, e.target.value)}
              label={filter.label}
              disabled={loading}
              sx={{
                color: darkMode ? 'white' : 'inherit',
                '.MuiSelect-icon': { color: darkMode ? 'white' : 'inherit' },
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
                },
                ':hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                },
              }}
            >
              {filter.options?.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'text':
        return (
          <TextField
            size="small"
            label={filter.label}
            value={value}
            onChange={(e) => onFilterChange(filter.key, e.target.value)}
            placeholder={filter.placeholder}
            disabled={loading}
            sx={{
              minWidth: isMobile ? '100%' : 200,
              '& .MuiOutlinedInput-root': {
                bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                borderRadius: 1,
                color: darkMode ? 'white' : 'inherit',
                '& fieldset': {
                  borderColor: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
                },
                '&:hover fieldset': {
                  borderColor: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                },
              },
              '& .MuiInputLabel-root': {
                color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
              },
            }}
          />
        );

      case 'date':
        return (
          <TextField
            size="small"
            type="date"
            label={filter.label}
            value={value}
            onChange={(e) => onFilterChange(filter.key, e.target.value)}
            disabled={loading}
            InputLabelProps={{ shrink: true }}
            sx={{
              minWidth: isMobile ? '100%' : 150,
              '& .MuiOutlinedInput-root': {
                bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                borderRadius: 1,
                color: darkMode ? 'white' : 'inherit',
                '& fieldset': {
                  borderColor: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
                },
                '&:hover fieldset': {
                  borderColor: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                },
              },
              '& .MuiInputLabel-root': {
                color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
              },
            }}
          />
        );

      case 'number':
        return (
          <TextField
            size="small"
            type="number"
            label={filter.label}
            value={value}
            onChange={(e) => onFilterChange(filter.key, e.target.value)}
            placeholder={filter.placeholder}
            disabled={loading}
            sx={{
              minWidth: isMobile ? '100%' : 120,
              '& .MuiOutlinedInput-root': {
                bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
                borderRadius: 1,
                color: darkMode ? 'white' : 'inherit',
                '& fieldset': {
                  borderColor: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
                },
                '&:hover fieldset': {
                  borderColor: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                },
              },
              '& .MuiInputLabel-root': {
                color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
              },
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      {/* 기본 필터 */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: variant === 'vertical' ? 'column' : 'row',
          gap: spacing,
          alignItems: variant === 'vertical' ? 'stretch' : 'center',
          flexWrap: 'wrap',
        }}
      >
        {visibleFilters.map((filter) => (
          <Box key={filter.key}>
            {renderFilterField(filter)}
          </Box>
        ))}

        {/* 액션 버튼들 */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            ml: variant === 'horizontal' ? 'auto' : 0,
          }}
        >
          {showAdvancedToggle && advancedFilters.length > 0 && (
            <IconButton
              onClick={onAdvancedFiltersToggle}
              size="small"
              sx={{ color: darkMode ? 'white' : 'inherit' }}
            >
              {showAdvancedFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}

          {showClearButton && hasActiveFilters() && (
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              variant="outlined"
              sx={{
                color: darkMode ? 'white' : 'inherit',
                borderColor: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.23)',
                '&:hover': {
                  borderColor: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                },
              }}
            >
              초기화
            </Button>
          )}
        </Box>
      </Box>

      {/* 고급 필터 */}
      {showAdvancedToggle && advancedFilters.length > 0 && (
        <Collapse in={showAdvancedFilters}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: variant === 'vertical' ? 'column' : 'row',
              gap: spacing,
              alignItems: variant === 'vertical' ? 'stretch' : 'center',
              flexWrap: 'wrap',
              mt: 2,
              pt: 2,
              borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            }}
          >
            {advancedFilters.map((filter) => (
              <Box key={filter.key}>
                {renderFilterField(filter)}
              </Box>
            ))}
          </Box>
        </Collapse>
      )}

      {/* 활성 필터 표시 */}
      {hasActiveFilters() && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {filters.map((filter) => {
            const value = values[filter.key];
            if (!value || value === '') return null;

            const getFilterLabel = () => {
              if (filter.type === 'select' && filter.options) {
                const option = filter.options.find(opt => opt.value === value);
                return option?.label || value;
              }
              return value;
            };

            return (
              <Chip
                key={filter.key}
                label={`${filter.label}: ${getFilterLabel()}`}
                onDelete={() => onFilterChange(filter.key, filter.defaultValue || '')}
                size="small"
                sx={{
                  bgcolor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  color: darkMode ? 'white' : 'inherit',
                }}
              />
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default FilterBar; 