import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';

interface PasswordStrengthMeterProps {
  password: string;
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const calculateStrength = (password: string): { score: number; label: string; color: string } => {
    if (!password) return { score: 0, label: '', color: '#e0e0e0' };

    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    score += checks.length ? 20 : 0;
    score += checks.lowercase ? 20 : 0;
    score += checks.uppercase ? 20 : 0;
    score += checks.numbers ? 20 : 0;
    score += checks.special ? 20 : 0;

    if (score <= 20) return { score, label: '매우 약함', color: '#f44336' };
    if (score <= 40) return { score, label: '약함', color: '#ff9800' };
    if (score <= 60) return { score, label: '보통', color: '#ffc107' };
    if (score <= 80) return { score, label: '강함', color: '#4caf50' };
    return { score, label: '매우 강함', color: '#2e7d32' };
  };

  const strength = calculateStrength(password);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="caption" color="text.secondary">
          비밀번호 강도
        </Typography>
        {password && (
          <Typography variant="caption" sx={{ color: strength.color, fontWeight: 600 }}>
            {strength.label}
          </Typography>
        )}
      </Box>
      <LinearProgress
        variant="determinate"
        value={strength.score}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: '#e0e0e0',
          '& .MuiLinearProgress-bar': {
            backgroundColor: strength.color,
            borderRadius: 3,
          },
        }}
      />
      {password && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {strength.score < 60 && '더 강한 비밀번호를 사용하세요'}
            {strength.score >= 60 && strength.score < 80 && '비밀번호가 양호합니다'}
            {strength.score >= 80 && '훌륭한 비밀번호입니다!'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PasswordStrengthMeter; 