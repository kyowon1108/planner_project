# Test Template: [TEST_NAME]

## 테스트 개요
- **테스트 ID**: TEST-XXX
- **테스트 타입**: Unit/Integration/E2E
- **테스트 대상**: [테스트 대상]
- **우선순위**: High/Medium/Low

## 테스트 목적
[이 테스트가 검증하려는 목적]

## 테스트 시나리오

### 시나리오 1: [시나리오 제목]
**설명**: [시나리오 설명]

**전제 조건**:
- [전제 조건 1]
- [전제 조건 2]

**테스트 단계**:
1. [단계 1]
2. [단계 2]
3. [단계 3]

**예상 결과**:
- [예상 결과 1]
- [예상 결과 2]

**실제 결과**:
- [ ] [결과 1]
- [ ] [결과 2]

### 시나리오 2: [시나리오 제목]
**설명**: [시나리오 설명]

**전제 조건**:
- [전제 조건 1]
- [전제 조건 2]

**테스트 단계**:
1. [단계 1]
2. [단계 2]
3. [단계 3]

**예상 결과**:
- [예상 결과 1]
- [예상 결과 2]

**실제 결과**:
- [ ] [결과 1]
- [ ] [결과 2]

## 테스트 데이터

### 입력 데이터
```json
{
  "test_case_1": {
    "input": "value",
    "expected": "expected_value"
  },
  "test_case_2": {
    "input": "value",
    "expected": "expected_value"
  }
}
```

### 테스트 환경
- **브라우저**: Chrome/Firefox/Safari
- **OS**: Windows/macOS/Linux
- **화면 해상도**: [해상도]
- **네트워크**: [네트워크 조건]

## 테스트 코드

### Frontend 테스트 (Jest + React Testing Library)
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  beforeEach(() => {
    // 테스트 설정
  });

  afterEach(() => {
    // 테스트 정리
  });

  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    render(<ComponentName />);
    
    const button = screen.getByRole('button', { name: 'Click me' });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Updated Text')).toBeInTheDocument();
    });
  });

  it('should handle error states', () => {
    // 에러 상태 테스트
  });
});
```

### Backend 테스트 (pytest)
```python
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

class TestFeature:
    def test_successful_operation(self):
        """성공적인 작업 테스트"""
        response = client.post("/api/endpoint", json={
            "field1": "value1",
            "field2": "value2"
        })
        
        assert response.status_code == 200
        assert response.json()["result"] == "success"
    
    def test_invalid_input(self):
        """잘못된 입력 테스트"""
        response = client.post("/api/endpoint", json={
            "field1": "",  # 빈 값
            "field2": "value2"
        })
        
        assert response.status_code == 400
        assert "validation error" in response.json()["detail"]
    
    def test_database_operation(self, db_session):
        """데이터베이스 작업 테스트"""
        # 데이터베이스 테스트 로직
        pass
```

### E2E 테스트 (Cypress)
```typescript
describe('Feature E2E Test', () => {
  beforeEach(() => {
    cy.visit('/feature-page');
  });

  it('should complete user workflow', () => {
    // 사용자 워크플로우 테스트
    cy.get('[data-testid="input-field"]').type('test value');
    cy.get('[data-testid="submit-button"]').click();
    
    cy.get('[data-testid="success-message"]')
      .should('be.visible')
      .and('contain', 'Success');
  });

  it('should handle error scenarios', () => {
    // 에러 시나리오 테스트
    cy.intercept('POST', '/api/endpoint', {
      statusCode: 500,
      body: { error: 'Server error' }
    });
    
    cy.get('[data-testid="submit-button"]').click();
    cy.get('[data-testid="error-message"]').should('be.visible');
  });
});
```

## 테스트 결과

### 통과한 테스트
- [ ] [테스트 1]
- [ ] [테스트 2]
- [ ] [테스트 3]

### 실패한 테스트
- [ ] [테스트 1] - [실패 이유]
- [ ] [테스트 2] - [실패 이유]

### 버그 발견
- [ ] [버그 1] - [버그 설명]
- [ ] [버그 2] - [버그 설명]

## 성능 테스트

### 응답 시간
- **평균 응답 시간**: [시간]
- **최대 응답 시간**: [시간]
- **최소 응답 시간**: [시간]

### 부하 테스트
- **동시 사용자**: [수]
- **처리량**: [요청/초]
- **에러율**: [%]

## 보안 테스트

### 입력 검증
- [ ] SQL Injection 테스트
- [ ] XSS 테스트
- [ ] CSRF 테스트
- [ ] 인증/권한 테스트

### 결과
- [ ] 모든 보안 테스트 통과
- [ ] 발견된 취약점: [취약점 목록]

## 접근성 테스트

### WCAG 준수
- [ ] 키보드 네비게이션
- [ ] 스크린 리더 호환성
- [ ] 색상 대비
- [ ] 포커스 표시

### 결과
- [ ] 모든 접근성 테스트 통과
- [ ] 개선 필요 사항: [개선 사항]

## 테스트 완료 체크리스트

### 기능 테스트
- [ ] 모든 기능이 정상 작동하는가?
- [ ] 에러 처리가 적절한가?
- [ ] 사용자 인터페이스가 직관적인가?

### 성능 테스트
- [ ] 응답 시간이 요구사항을 만족하는가?
- [ ] 부하 상황에서 안정적인가?
- [ ] 메모리 사용량이 적절한가?

### 보안 테스트
- [ ] 보안 취약점이 없는가?
- [ ] 인증/권한이 올바르게 작동하는가?
- [ ] 데이터가 안전하게 처리되는가?

### 호환성 테스트
- [ ] 다양한 브라우저에서 작동하는가?
- [ ] 다양한 디바이스에서 작동하는가?
- [ ] 다양한 화면 크기에서 작동하는가?

## 결론

### 테스트 결과 요약
[테스트 결과에 대한 간단한 요약]

### 권장사항
- [권장사항 1]
- [권장사항 2]
- [권장사항 3]

### 다음 단계
- [ ] [다음 단계 1]
- [ ] [다음 단계 2]
- [ ] [다음 단계 3]

## 승인
- [ ] **테스터 승인**: [날짜]
- [ ] **개발자 승인**: [날짜]
- [ ] **프로덕트 매니저 승인**: [날짜] 