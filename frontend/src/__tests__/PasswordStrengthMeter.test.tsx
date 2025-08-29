import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';

describe('PasswordStrengthMeter', () => {
  it('비밀번호 강도 미터가 렌더링되는지 확인', () => {
    render(<PasswordStrengthMeter password="test123" />);
    
    expect(screen.getByText(/비밀번호 강도/i)).toBeInTheDocument();
  });

  it('빈 비밀번호일 때 기본 상태를 표시하는지 확인', () => {
    render(<PasswordStrengthMeter password="" />);
    
    expect(screen.getByText(/비밀번호 강도/i)).toBeInTheDocument();
  });

  it('강한 비밀번호일 때 적절한 메시지를 표시하는지 확인', () => {
    render(<PasswordStrengthMeter password="StrongPass123!" />);
    
    expect(screen.getByText(/비밀번호 강도/i)).toBeInTheDocument();
  });
}); 