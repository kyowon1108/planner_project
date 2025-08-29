import React, { useState } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Collapse,
  IconButton,
  Typography,
} from '@mui/material';
import {
  Search as SearchIcon,
  Tune as TuneIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

interface SearchFilterOption {
  value: string;
  label: string;
  description?: string;
}

interface AdvancedSearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchType: string;
  onSearchTypeChange: (value: string) => void;
  showAdvancedFilters: boolean;
  onAdvancedFiltersToggle: () => void;
  children?: React.ReactNode;
}

const AdvancedSearchFilter: React.FC<AdvancedSearchFilterProps> = ({
  searchTerm,
  onSearchChange,
  searchType,
  onSearchTypeChange,
  showAdvancedFilters,
  onAdvancedFiltersToggle,
  children,
}) => {
  const searchTypeOptions: SearchFilterOption[] = [
    { value: 'all', label: '전체 검색' },
    { value: 'title', label: '제목 검색' },
    { value: 'content', label: '내용 검색' },
    { value: 'author', label: '작성자 검색' },
  ];

  const handleClearAll = () => {
    onSearchChange('');
    onSearchTypeChange('all');
  };

  return (
    <Box sx={{ mb: 3 }}>
      {/* 기본 검색 영역 */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <TextField
          fullWidth
          placeholder="검색어를 입력하세요..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          size="small"
        />
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>검색 타입</InputLabel>
          <Select
            value={searchType}
            onChange={(e) => onSearchTypeChange(e.target.value)}
            label="검색 타입"
          >
            {searchTypeOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <IconButton
          onClick={onAdvancedFiltersToggle}
          sx={{ 
            border: '1px solid',
            borderColor: 'divider',
            '&:hover': { backgroundColor: 'action.hover' }
          }}
        >
          <TuneIcon />
        </IconButton>
      </Box>

      {/* 활성 필터 표시 */}
      {(searchTerm || searchType !== 'all') && (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2" color="text.secondary">
            활성 필터:
          </Typography>
          {searchTerm && (
            <Chip
              label={`검색: ${searchTerm}`}
              onDelete={() => onSearchChange('')}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
          {searchType !== 'all' && (
            <Chip
              label={`타입: ${searchTypeOptions.find(opt => opt.value === searchType)?.label}`}
              onDelete={() => onSearchTypeChange('all')}
              size="small"
              color="secondary"
              variant="outlined"
            />
          )}
          <Button
            size="small"
            onClick={handleClearAll}
            startIcon={<ClearIcon />}
            sx={{ ml: 'auto' }}
          >
            모든 필터 제거
          </Button>
        </Box>
      )}

      {/* 고급 필터 영역 */}
      <Collapse in={showAdvancedFilters}>
        <Box sx={{ 
          p: 2, 
          border: '1px solid', 
          borderColor: 'divider', 
          borderRadius: 1,
          backgroundColor: 'background.paper'
        }}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
};

export default AdvancedSearchFilter; 