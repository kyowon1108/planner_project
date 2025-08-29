# REFACTORING REQUEST

## Context
I need you to refactor the backend code to improve code quality, performance, and maintainability.

## Required Reading
Please review these documents before starting:
- `docs/02-architecture.md` - System architecture and patterns
- `docs/05-coding-standards.md` - Coding standards and best practices
- `docs/04-tools-and-setup.md` - Development tools and setup
- `docs/03-implementation-plan.md` - Current implementation status

## Refactoring Guidelines

### Code Quality Improvements
1. **Follow PEP 8**: Python style guide compliance
2. **Type Hints**: Add proper type annotations
3. **Documentation**: Improve docstrings and comments
4. **Error Handling**: Implement proper exception handling
5. **Logging**: Add structured logging

### Performance Optimizations
1. **Database Queries**: Optimize N+1 queries
2. **Caching**: Implement Redis caching where appropriate
3. **Connection Pooling**: Optimize database connections
4. **Async Operations**: Use async/await for I/O operations

### Security Enhancements
1. **Input Validation**: Strengthen Pydantic validators
2. **Authentication**: Improve JWT token handling
3. **Authorization**: Enhance permission checks
4. **SQL Injection**: Ensure ORM usage prevents injection

### Architecture Improvements
1. **Service Layer**: Separate business logic from API endpoints
2. **Repository Pattern**: Improve data access layer
3. **Dependency Injection**: Use FastAPI dependencies properly
4. **Error Boundaries**: Implement proper error handling

## Refactoring Process

### Step 1: Analysis
- Review current code structure
- Identify code smells and technical debt
- Analyze performance bottlenecks
- Check security vulnerabilities

### Step 2: Planning
- Create refactoring plan
- Identify breaking changes
- Plan migration strategy
- Set up rollback plan

### Step 3: Implementation
- Write tests first (TDD approach)
- Implement changes incrementally
- Maintain backward compatibility
- Update documentation

### Step 4: Validation
- Run all tests
- Check performance improvements
- Verify security enhancements
- Update API documentation

## Specific Refactoring Tasks

### Database Layer
```python
# Before: N+1 Query Problem
def get_team_with_members(team_id: int, db: Session):
    team = db.query(Team).filter(Team.id == team_id).first()
    if team:
        team.members = db.query(TeamMember).filter(TeamMember.team_id == team_id).all()
    return team

# After: Optimized with joinedload
def get_team_with_members(team_id: int, db: Session):
    return db.query(Team)\
        .options(joinedload(Team.members))\
        .filter(Team.id == team_id)\
        .first()
```

### Service Layer
```python
# Before: Business logic in API endpoint
@router.post("/users/")
async def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    # Validation logic here
    # Business logic here
    # Database operations here
    pass

# After: Separated concerns
@router.post("/users/")
async def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    return await user_service.create_user(db, user_data)

class UserService:
    async def create_user(self, db: Session, user_data: UserCreate) -> User:
        # Business logic here
        pass
```

### Error Handling
```python
# Before: Generic error handling
@router.get("/users/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# After: Proper exception handling
@router.get("/users/{user_id}")
async def get_user(user_id: int, db: Session = Depends(get_db)):
    try:
        user = user_service.get_user_by_id(db, user_id)
        if not user:
            raise UserNotFoundException(user_id)
        return user
    except UserNotFoundException as e:
        logger.warning(f"User not found: {user_id}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error getting user {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

## Refactoring Checklist

### Code Quality
- [ ] PEP 8 compliance
- [ ] Type hints added
- [ ] Docstrings updated
- [ ] Variable names improved
- [ ] Function complexity reduced
- [ ] Code duplication eliminated

### Performance
- [ ] Database queries optimized
- [ ] N+1 queries resolved
- [ ] Caching implemented
- [ ] Connection pooling configured
- [ ] Async operations used

### Security
- [ ] Input validation strengthened
- [ ] SQL injection prevented
- [ ] Authentication improved
- [ ] Authorization enhanced
- [ ] Error messages sanitized

### Architecture
- [ ] Service layer separated
- [ ] Repository pattern implemented
- [ ] Dependency injection used
- [ ] Error boundaries defined
- [ ] Configuration externalized

### Testing
- [ ] Unit tests updated
- [ ] Integration tests added
- [ ] Performance tests included
- [ ] Security tests implemented
- [ ] Test coverage maintained

## Output Format

### Refactoring Plan
1. **Current Issues**: List identified problems
2. **Proposed Changes**: Describe refactoring approach
3. **Breaking Changes**: Note any API changes
4. **Migration Strategy**: How to implement changes
5. **Testing Strategy**: How to validate changes

### Implementation Steps
1. **Phase 1**: Core refactoring (non-breaking)
2. **Phase 2**: API improvements (breaking changes)
3. **Phase 3**: Performance optimizations
4. **Phase 4**: Security enhancements

### Validation
- [ ] All tests pass
- [ ] Performance improved
- [ ] Security verified
- [ ] Documentation updated
- [ ] API compatibility maintained

## Questions to Ask
- What specific areas need refactoring?
- Are there performance bottlenecks?
- Are there security concerns?
- What is the current test coverage?
- Are there any breaking changes acceptable?
- What is the timeline for refactoring?

## Example Refactoring Request

```
Please refactor the backend API endpoints to:
1. Separate business logic into service layer
2. Optimize database queries to prevent N+1 problems
3. Improve error handling with proper exceptions
4. Add comprehensive logging
5. Enhance input validation

Focus on:
- /api/v1/users/* endpoints
- /api/v1/teams/* endpoints
- UserService and TeamService classes
- Database repository pattern implementation
```

## Safety Guidelines
- Always write tests before refactoring
- Make incremental changes
- Maintain backward compatibility
- Document all changes
- Have rollback plan ready
- Test thoroughly before deployment 