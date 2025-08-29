import React from 'react';
import { FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';

export interface SortOption {
  value: string;
  label: string;
}

interface SortSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SortOption[];
  label?: string;
  size?: 'small' | 'medium';
}

const SortSelect: React.FC<SortSelectProps> = ({ 
  value, 
  onChange, 
  options, 
  label = '정렬', 
  size = 'small' 
}) => {
  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value);
  };

  return (
    <FormControl size={size} sx={{ minWidth: 120 }}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={value}
        label={label}
        onChange={handleChange}
      >
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SortSelect; 