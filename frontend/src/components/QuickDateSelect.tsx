import React from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { getQuickDateOptions } from '../utils/dateUtils';

interface QuickDateSelectProps {
  onDateSelect: (date: string) => void;
  disabled?: boolean;
}

const QuickDateSelect: React.FC<QuickDateSelectProps> = ({ onDateSelect, disabled = false }) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDateSelect = (date: string) => {
    onDateSelect(date);
    handleClose();
  };

  const quickOptions = getQuickDateOptions();

  return (
    <Box>
      <Button
        variant="outlined"
        size="small"
        startIcon={<ScheduleIcon />}
        onClick={handleClick}
        disabled={disabled}
        sx={{ minWidth: 'auto', px: 1 }}
      >
        빠른 선택
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        {quickOptions.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => handleDateSelect(option.value)}
            sx={{ minWidth: 150 }}
          >
            <Typography variant="body2">
              {option.label}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default QuickDateSelect; 