import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('로딩 스피너가 렌더링되는지 확인', () => {
    render(<LoadingSpinner />);
    
    // 로딩 스피너가 렌더링되는지 확인
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
}); 