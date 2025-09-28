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
  Search,
  Clear,
  FilterList,
} from '@mui/icons-material';

[];
  placeholder: string;
  filterLabel: string;
  showClearButton: boolean;
}

const SearchFilterBar = ({
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

  const handleSearchChange = (event.ChangeEvent) => {
    const value = event.target.value;
    setLocalSearchTerm(value);
    onSearchChange(value);
  };

  const handleClearSearch = () => {
    setLocalSearchTerm('');
    onSearchChange('');
  };

  const handleFilterChange = (event) => {
    onFilterChange(event.target.value);
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p,
        mb,
        borderRadius,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* 검색 입력창 */}
        <TextField
          size="small"
          placeholder={placeholder}
          value={localSearchTerm}
          onChange={handleSearchChange}
          sx={{
            minWidth,
            flexGrow,
            '& .MuiOutlinedInput-root': {
              borderRadius,
              backgroundColor: 'rgba(255,255,255,0.8)',
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment && localSearchTerm && (
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
        <FormControl size="small" sx={{ minWidth }}>
          {filterLabel}</InputLabel>
          <Select
            value={filterValue}
            onChange={handleFilterChange}
            label={filterLabel}
            sx={{
              borderRadius,
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