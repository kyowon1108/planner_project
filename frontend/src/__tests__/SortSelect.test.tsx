import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SortSelect from '../components/SortSelect';

describe('SortSelect', () => {
  const mockOptions = [
    { value: 'name', label: '이름순' },
    { value: 'date', label: '날짜순' },
    { value: 'priority', label: '우선순위순' }
  ];

  it('정렬 옵션들이 렌더링되는지 확인', () => {
    const mockOnChange = jest.fn();
    render(
      <SortSelect
        value="name"
        onChange={mockOnChange}
        options={mockOptions}
        label="정렬"
      />
    );
    
    // 더 구체적인 선택자 사용
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('이름순')).toBeInTheDocument();
  });

  it('옵션 변경 시 onChange 함수가 호출되는지 확인', () => {
    const mockOnChange = jest.fn();
    render(
      <SortSelect
        value="name"
        onChange={mockOnChange}
        options={mockOptions}
        label="정렬"
      />
    );
    
    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);
    
    const dateOption = screen.getByText('날짜순');
    fireEvent.click(dateOption);
    
    expect(mockOnChange).toHaveBeenCalled();
  });
}); 