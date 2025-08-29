# TDD DEVELOPMENT REQUEST

## Context
I need you to implement [FEATURE_NAME] using Test-Driven Development (TDD) approach.

## TDD Workflow
1. **Red**: Write failing tests first
2. **Green**: Write minimum code to pass tests
3. **Refactor**: Improve code while keeping tests green

## Required Reading
Please review these documents before starting:
- `docs/features/feature-XXX-[name].md` - Detailed feature specification
- `docs/04-tools-and-setup.md` - Tool usage guidelines
- `docs/05-coding-standards.md` - Coding standards

## Implementation Steps

### Step 1: Test Design
- Write comprehensive test cases covering:
  - Happy path scenarios
  - Edge cases
  - Error conditions
  - Input validation
  - Security requirements

### Step 2: Test Implementation
- Write failing tests first
- Ensure tests are descriptive and maintainable
- Use proper test naming conventions
- Include setup and teardown as needed

### Step 3: Implementation
- Write minimum code to make tests pass
- Follow existing code patterns
- Implement proper error handling
- Add input validation

### Step 4: Refactoring
- Improve code quality
- Remove code duplication
- Optimize performance
- Ensure all tests still pass

## Test Requirements

### Frontend Tests
- Unit tests for components
- Integration tests for API calls
- E2E tests for user workflows
- Test coverage should be >80%

### Backend Tests
- Unit tests for services
- Integration tests for API endpoints
- Database tests for repositories
- Test coverage should be >80%

## Safety Checklist
- [ ] All tests pass
- [ ] Linting rules satisfied
- [ ] Type checking clean
- [ ] No console errors/warnings
- [ ] Follows established patterns
- [ ] Proper error handling
- [ ] Input validation implemented
- [ ] Security requirements met

## Questions to Ask
- Are there any unclear requirements?
- Do you need additional context about existing code?
- Are there any potential edge cases I should consider?
- What are the performance requirements?
- Are there any security considerations?

## Example TDD Cycle

### 1. Red - Write Failing Test
```typescript
// Frontend example
describe('UserService', () => {
  it('should create a new user successfully', async () => {
    const userData = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123'
    };
    
    const result = await userService.createUser(userData);
    
    expect(result).toBeDefined();
    expect(result.email).toBe(userData.email);
    expect(result.username).toBe(userData.username);
  });
});
```

### 2. Green - Write Minimum Code
```typescript
// Minimum implementation to pass test
class UserService {
  async createUser(userData: UserCreate): Promise<User> {
    const response = await api.post('/users', userData);
    return response.data;
  }
}
```

### 3. Refactor - Improve Code
```typescript
// Improved implementation
class UserService {
  async createUser(userData: UserCreate): Promise<User> {
    try {
      // Validate input
      this.validateUserData(userData);
      
      // Create user
      const response = await api.post('/users', userData);
      
      // Log success
      logger.info('User created successfully', { userId: response.data.id });
      
      return response.data;
    } catch (error) {
      logger.error('Failed to create user', { error, userData });
      throw new UserCreationError('사용자 생성에 실패했습니다.');
    }
  }
  
  private validateUserData(userData: UserCreate): void {
    if (!userData.email || !userData.username || !userData.password) {
      throw new ValidationError('필수 필드가 누락되었습니다.');
    }
  }
}
```

## Test Categories

### Unit Tests
- Test individual functions/methods
- Mock external dependencies
- Focus on logic and behavior
- Fast execution

### Integration Tests
- Test component interactions
- Test API endpoint behavior
- Test database operations
- Real dependencies

### E2E Tests
- Test complete user workflows
- Test cross-browser compatibility
- Test real user scenarios
- Slow but comprehensive

## Test Best Practices

### Naming Conventions
```typescript
// ✅ Good test names
describe('UserService', () => {
  it('should create user when valid data is provided', () => {});
  it('should throw error when email is invalid', () => {});
  it('should throw error when username is too short', () => {});
});

// ❌ Bad test names
describe('UserService', () => {
  it('should work', () => {});
  it('test1', () => {});
});
```

### Test Structure
```typescript
describe('Feature', () => {
  // Setup
  beforeEach(() => {
    // Initialize test data
  });
  
  // Teardown
  afterEach(() => {
    // Clean up
  });
  
  // Tests
  it('should do something', () => {
    // Arrange
    const input = 'test';
    
    // Act
    const result = function(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### Mocking
```typescript
// ✅ Proper mocking
jest.mock('../api');

describe('UserService', () => {
  it('should handle API errors', async () => {
    const mockApi = api as jest.Mocked<typeof api>;
    mockApi.post.mockRejectedValue(new Error('Network error'));
    
    await expect(userService.createUser(userData))
      .rejects.toThrow('사용자 생성에 실패했습니다.');
  });
});
``` 