# FRONTEND REFACTORING REQUEST

## Context
I need you to refactor the frontend code to improve code quality, performance, and maintainability.

## Required Reading
Please review these documents before starting:
- `docs/02-architecture.md` - System architecture and patterns
- `docs/05-coding-standards.md` - Coding standards and best practices
- `docs/04-tools-and-setup.md` - Development tools and setup
- `docs/03-implementation-plan.md` - Current implementation status

## Refactoring Guidelines

### Code Quality Improvements
1. **TypeScript**: Strict type checking and proper interfaces
2. **React Best Practices**: Functional components, hooks, proper state management
3. **Component Structure**: Reusable components, proper prop interfaces
4. **Error Handling**: Error boundaries and proper error states
5. **Performance**: React.memo, useMemo, useCallback optimization

### Performance Optimizations
1. **Bundle Size**: Code splitting and lazy loading
2. **Rendering**: Virtual scrolling for large lists
3. **State Management**: Optimize Context API usage
4. **API Calls**: Implement caching and request deduplication
5. **Images**: Optimize image loading and lazy loading

### User Experience Improvements
1. **Accessibility**: ARIA labels, keyboard navigation
2. **Responsive Design**: Mobile-first approach
3. **Loading States**: Proper loading indicators
4. **Error States**: User-friendly error messages
5. **Animations**: Smooth transitions and feedback

### Architecture Improvements
1. **Component Architecture**: Atomic design principles
2. **State Management**: Context API optimization
3. **Routing**: Proper route organization
4. **API Integration**: Centralized API service layer
5. **Testing**: Component and integration tests

## Refactoring Process

### Step 1: Analysis
- Review current component structure
- Identify performance bottlenecks
- Check accessibility issues
- Analyze bundle size
- Review state management

### Step 2: Planning
- Create component hierarchy
- Plan state management strategy
- Design API integration layer
- Plan testing strategy
- Set up performance monitoring

### Step 3: Implementation
- Write tests first (TDD approach)
- Implement changes incrementally
- Maintain backward compatibility
- Update documentation

### Step 4: Validation
- Run all tests
- Check performance improvements
- Verify accessibility
- Test responsive design

## Specific Refactoring Tasks

### Component Optimization
```typescript
// Before: Inefficient component
const UserList = ({ users, onSelect }) => {
  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} onSelect={onSelect} />
      ))}
    </div>
  );
};

// After: Optimized with React.memo and useCallback
const UserList = React.memo(({ users, onSelect }) => {
  const handleSelect = useCallback((user) => {
    onSelect(user);
  }, [onSelect]);

  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} onSelect={handleSelect} />
      ))}
    </div>
  );
});
```

### State Management
```typescript
// Before: Multiple contexts
const AuthContext = createContext();
const ThemeContext = createContext();
const UserContext = createContext();

// After: Combined context with useReducer
interface AppState {
  auth: AuthState;
  theme: ThemeState;
  user: UserState;
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}>();

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    default:
      return state;
  }
};
```

### API Integration
```typescript
// Before: Direct API calls in components
const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/users/me')
      .then(res => res.json())
      .then(data => setUser(data))
      .finally(() => setLoading(false));
  }, []);

  return loading ? <Spinner /> : <UserCard user={user} />;
};

// After: Centralized API service with hooks
const useUser = (userId: string) => {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    userService.getUser(userId)
      .then(data => setState({ data, loading: false, error: null }))
      .catch(error => setState({ data: null, loading: false, error }));
  }, [userId]);

  return state;
};

const UserProfile = () => {
  const { data: user, loading, error } = useUser('me');

  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  return <UserCard user={user} />;
};
```

### Error Handling
```typescript
// Before: Basic error handling
const LoginForm = () => {
  const [error, setError] = useState('');

  const handleSubmit = async (data) => {
    try {
      await login(data);
    } catch (err) {
      setError('Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {/* form fields */}
    </form>
  );
};

// After: Comprehensive error handling
const LoginForm = () => {
  const [state, setState] = useState({
    loading: false,
    error: null
  });

  const handleSubmit = async (data) => {
    setState({ loading: true, error: null });
    
    try {
      await authService.login(data);
    } catch (err) {
      setState({ 
        loading: false, 
        error: err.response?.data?.message || '로그인에 실패했습니다.' 
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {state.error && (
        <Alert severity="error" onClose={() => setState({ ...state, error: null })}>
          {state.error}
        </Alert>
      )}
      <Button type="submit" disabled={state.loading}>
        {state.loading ? <Spinner size="small" /> : '로그인'}
      </Button>
    </form>
  );
};
```

## Refactoring Checklist

### Code Quality
- [ ] TypeScript strict mode enabled
- [ ] ESLint rules satisfied
- [ ] Component interfaces defined
- [ ] Props validation implemented
- [ ] Code duplication eliminated
- [ ] Naming conventions followed

### Performance
- [ ] Bundle size optimized
- [ ] Code splitting implemented
- [ ] React.memo used appropriately
- [ ] useMemo/useCallback applied
- [ ] Virtual scrolling for large lists
- [ ] Image optimization

### Accessibility
- [ ] ARIA labels added
- [ ] Keyboard navigation supported
- [ ] Color contrast checked
- [ ] Screen reader compatibility
- [ ] Focus management implemented

### User Experience
- [ ] Loading states implemented
- [ ] Error states handled
- [ ] Responsive design verified
- [ ] Animations smooth
- [ ] Feedback mechanisms added

### Testing
- [ ] Unit tests for components
- [ ] Integration tests for workflows
- [ ] Accessibility tests
- [ ] Performance tests
- [ ] Test coverage maintained

## Output Format

### Refactoring Plan
1. **Current Issues**: List identified problems
2. **Proposed Changes**: Describe refactoring approach
3. **Breaking Changes**: Note any API changes
4. **Migration Strategy**: How to implement changes
5. **Testing Strategy**: How to validate changes

### Implementation Steps
1. **Phase 1**: Component optimization (non-breaking)
2. **Phase 2**: State management improvements
3. **Phase 3**: Performance optimizations
4. **Phase 4**: Accessibility enhancements

### Validation
- [ ] All tests pass
- [ ] Performance improved
- [ ] Accessibility verified
- [ ] Documentation updated
- [ ] Bundle size reduced

## Questions to Ask
- What specific areas need refactoring?
- Are there performance bottlenecks?
- Are there accessibility issues?
- What is the current test coverage?
- Are there any breaking changes acceptable?
- What is the timeline for refactoring?

## Example Refactoring Request

```
Please refactor the frontend components to:
1. Implement proper TypeScript interfaces
2. Optimize component performance with React.memo
3. Improve state management with Context API
4. Add comprehensive error handling
5. Enhance accessibility features

Focus on:
- src/components/ directory
- src/pages/ directory
- src/hooks/ directory
- src/contexts/ directory
```

## Safety Guidelines
- Always write tests before refactoring
- Make incremental changes
- Maintain backward compatibility
- Document all changes
- Have rollback plan ready
- Test thoroughly before deployment 