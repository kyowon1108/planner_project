import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
          gap={2}
          p={3}
        >
          <Alert severity="error" sx={{ maxWidth: 600, width: '100%' }}>
            <Typography variant="h6" gutterBottom>
              예상치 못한 오류가 발생했습니다
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              죄송합니다. 문제가 발생했습니다. 페이지를 새로고침하거나 다시 시도해주세요.
            </Typography>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box mt={2}>
                <Typography variant="caption" component="pre" sx={{ 
                  whiteSpace: 'pre-wrap', 
                  fontSize: '0.75rem',
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  p: 1,
                  borderRadius: 1
                }}>
                  {this.state.error ? (typeof this.state.error === 'object' ? JSON.stringify(this.state.error) : String(this.state.error)) : 'Unknown error'}
                </Typography>
              </Box>
            )}
          </Alert>
          
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.handleReset}
            >
              다시 시도
            </Button>
            <Button
              variant="outlined"
              onClick={() => window.location.reload()}
            >
              페이지 새로고침
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 