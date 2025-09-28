import React from 'react';
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material';
import {
  Schedule,
} from '@mui/icons-material';
import { getQuickDateOptions } from '../utils/dateUtils';

const QuickDateSelect = ({ onDateSelect, disabled = false }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDateSelect = (date) => {
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
        sx={{ minWidth: 'auto', px }}
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
            sx={{ minWidth }}
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