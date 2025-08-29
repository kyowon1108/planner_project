import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TeamSelector from '../components/TeamSelector';

describe('TeamSelector', () => {
  const mockTeams = [
    { 
      id: 1, 
      name: '팀 A', 
      description: '팀 A 설명',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      members: []
    },
    { 
      id: 2, 
      name: '팀 B', 
      description: '팀 B 설명',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      members: []
    },
    { 
      id: 3, 
      name: '팀 C', 
      description: '팀 C 설명',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      members: []
    }
  ];

  const mockOnTeamChange = jest.fn();

  beforeEach(() => {
    mockOnTeamChange.mockClear();
  });

  it('팀 선택 컴포넌트가 렌더링되는지 확인', () => {
    render(
      <TeamSelector
        teams={mockTeams}
        selectedTeamId={null}
        onTeamChange={mockOnTeamChange}
      />
    );
    
    expect(screen.getByText('전체 팀')).toBeInTheDocument();
  });

  it('팀 옵션들이 렌더링되는지 확인', () => {
    render(
      <TeamSelector
        teams={mockTeams}
        selectedTeamId={null}
        onTeamChange={mockOnTeamChange}
      />
    );
    
    const select = screen.getByRole('combobox');
    fireEvent.mouseDown(select);
    
    expect(screen.getByText('팀 A')).toBeInTheDocument();
    expect(screen.getByText('팀 B')).toBeInTheDocument();
    expect(screen.getByText('팀 C')).toBeInTheDocument();
  });
}); 