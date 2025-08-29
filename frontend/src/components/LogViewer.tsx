import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Button,
  TextField,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Refresh as RefreshIcon, 
  Download as DownloadIcon, 
  Clear as ClearIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  BugReport as DebugIcon
} from '@mui/icons-material';
import { logger, LogLevel } from '../utils/logger';

interface LogViewerProps {
  open: boolean;
  onClose: () => void;
}

const LogViewer: React.FC<LogViewerProps> = ({ open, onClose }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [filterLevel, setFilterLevel] = useState<LogLevel>(LogLevel.INFO);
  const [searchTerm, setSearchTerm] = useState('');

  const refreshLogs = () => {
    const allLogs = logger.getLogs();
    setLogs(allLogs);
  };

  useEffect(() => {
    if (open) {
      refreshLogs();
    }
  }, [open]);

  const filteredLogs = logs.filter(log => {
    const levelMatch = log.level >= filterLevel;
    const searchMatch = searchTerm === '' || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.context && log.context.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return levelMatch && searchMatch;
  });

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case LogLevel.DEBUG: return <DebugIcon fontSize="small" />;
      case LogLevel.INFO: return <InfoIcon fontSize="small" />;
      case LogLevel.WARN: return <WarningIcon fontSize="small" />;
      case LogLevel.ERROR: return <ErrorIcon fontSize="small" />;
      default: return <InfoIcon fontSize="small" />;
    }
  };

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.DEBUG: return 'default';
      case LogLevel.INFO: return 'primary';
      case LogLevel.WARN: return 'warning';
      case LogLevel.ERROR: return 'error';
      default: return 'default';
    }
  };

  const getLevelText = (level: LogLevel) => {
    switch (level) {
      case LogLevel.DEBUG: return 'DEBUG';
      case LogLevel.INFO: return 'INFO';
      case LogLevel.WARN: return 'WARN';
      case LogLevel.ERROR: return 'ERROR';
      default: return 'UNKNOWN';
    }
  };

  const exportLogs = () => {
    const logData = logger.exportLogs();
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    logger.clearLogs();
    setLogs([]);
  };

  if (!open) return null;

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)',
        width: '90vw',
        height: '80vh',
        zIndex: 1000,
        p: 2,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">로그 뷰어</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>로그 레벨</InputLabel>
            <Select
              value={filterLevel}
              label="로그 레벨"
              onChange={(e) => setFilterLevel(e.target.value as LogLevel)}
            >
              <MenuItem value={LogLevel.DEBUG}>DEBUG</MenuItem>
              <MenuItem value={LogLevel.INFO}>INFO</MenuItem>
              <MenuItem value={LogLevel.WARN}>WARN</MenuItem>
              <MenuItem value={LogLevel.ERROR}>ERROR</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            size="small"
            placeholder="검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: 200 }}
          />
          
          <Tooltip title="새로고침">
            <IconButton onClick={refreshLogs}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="로그 내보내기">
            <IconButton onClick={exportLogs}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="로그 초기화">
            <IconButton onClick={clearLogs}>
              <ClearIcon />
            </IconButton>
          </Tooltip>
          
          <Button variant="outlined" onClick={onClose}>
            닫기
          </Button>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
        {filteredLogs.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">로그가 없습니다.</Typography>
          </Box>
        ) : (
          <Box sx={{ p: 1 }}>
            {filteredLogs.map((log, index) => (
              <Box
                key={index}
                sx={{
                  p: 1,
                  mb: 1,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  backgroundColor: 'background.paper'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  {getLevelIcon(log.level)}
                  <Chip 
                    label={getLevelText(log.level)} 
                    size="small" 
                    color={getLevelColor(log.level)}
                  />
                  {log.context && (
                    <Chip label={log.context} size="small" variant="outlined" />
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {new Date(log.timestamp).toLocaleString()}
                  </Typography>
                </Box>
                
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {log.message}
                </Typography>
                
                {log.data && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      데이터:
                    </Typography>
                    <Box
                      component="pre"
                      sx={{
                        fontSize: '0.75rem',
                        backgroundColor: 'grey.100',
                        p: 1,
                        borderRadius: 1,
                        overflow: 'auto',
                        maxHeight: 100
                      }}
                    >
                      {JSON.stringify(log.data, null, 2)}
                    </Box>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>
      
      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          총 {filteredLogs.length}개 로그 (전체 {logs.length}개)
        </Typography>
      </Box>
    </Paper>
  );
};

export default LogViewer; 