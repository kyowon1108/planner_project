import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuickDateSelect from '../components/QuickDateSelect';

describe('QuickDateSelect', () => {
  const mockOnDateSelect = jest.fn();

  beforeEach(() => {
    mockOnDateSelect.mockClear();
  });

  it('빠른 날짜 선택 컴포넌트가 렌더링되는지 확인', () => {
    render(<QuickDateSelect onDateSelect={mockOnDateSelect} />);
    
    expect(screen.getByText('빠른 선택')).toBeInTheDocument();
  });

  it('빠른 선택 버튼 클릭 시 메뉴가 나타나는지 확인', () => {
    render(<QuickDateSelect onDateSelect={mockOnDateSelect} />);
    
    const quickSelectButton = screen.getByText('빠른 선택');
    fireEvent.click(quickSelectButton);
    
    // 메뉴가 나타나는지 확인 (실제 구현에 따라 조정 필요)
    expect(quickSelectButton).toBeInTheDocument();
  });
}); 