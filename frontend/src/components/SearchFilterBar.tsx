import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  InputAdornment,
  Chip,
  Typography,
  Paper,
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';

interface SearchFilterBarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterValue: string;
  onFilterChange: (value: string) => void;
  filterOptions: { value: string; label: string }[];
  placeholder?: string;
  filterLabel?: string;
  showClearButton?: boolean;
}

const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchTerm,
  onSearchChange,
  filterValue,
  onFilterChange,
  filterOptions,
  placeholder = "검색...",
  filterLabel = "필터",
  showClearButton = true,
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setLocalSearchTerm(value);
    onSearchChange(value);
  };

  const handleClearSearch = () => {
    setLocalSearchTerm('');
    onSearchChange('');
  };

  const handleFilterChange = (event: any) => {
    onFilterChange(event.target.value);
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 2,
        mb: 3,
        borderRadius: 3,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* 검색 입력창 */}
        <TextField
          size="small"
          placeholder={placeholder}
          value={localSearchTerm}
          onChange={handleSearchChange}
          sx={{
            minWidth: 250,
            flexGrow: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              backgroundColor: 'rgba(255,255,255,0.8)',
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: showClearButton && localSearchTerm && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={handleClearSearch}
                  edge="end"
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* 필터 드롭다운 */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>{filterLabel}</InputLabel>
          <Select
            value={filterValue}
            onChange={handleFilterChange}
            label={filterLabel}
            sx={{
              borderRadius: 2,
              backgroundColor: 'rgba(255,255,255,0.8)',
            }}
          >
            {filterOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* 활성 필터 표시 */}
        {(searchTerm || filterValue !== 'all') && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FilterIcon color="action" fontSize="small" />
            <Typography variant="caption" color="text.secondary">
              활성 필터:
            </Typography>
            {searchTerm && (
              <Chip
                label={`검색: "${searchTerm}"`}
                size="small"
                onDelete={() => onSearchChange('')}
                color="primary"
                variant="outlined"
              />
            )}
            {filterValue !== 'all' && (
              <Chip
                label={filterOptions.find(opt => opt.value === filterValue)?.label || filterValue}
                size="small"
                onDelete={() => onFilterChange('all')}
                color="secondary"
                variant="outlined"
              />
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default SearchFilterBar; 