import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorDisplay from '../components/ErrorDisplay';

describe('ErrorDisplay', () => {
  it('기본 에러 메시지가 렌더링되는지 확인', () => {
    render(<ErrorDisplay />);
    
    expect(screen.getByText('오류가 발생했습니다.')).toBeInTheDocument();
  });

  it('커스텀 에러 메시지가 렌더링되는지 확인', () => {
    const customMessage = '커스텀 에러 메시지';
    render(<ErrorDisplay message={customMessage} />);
    
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  it('재시도 버튼이 클릭되면 onRetry 함수가 호출되는지 확인', () => {
    const mockOnRetry = jest.fn();
    render(<ErrorDisplay onRetry={mockOnRetry} />);
    
    const retryButton = screen.getByText('다시 시도');
    fireEvent.click(retryButton);
    
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });
}); 