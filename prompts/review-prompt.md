# CODE REVIEW REQUEST

## Review Criteria
Please review the following code against these standards:

### Technical Quality
- Code follows established patterns
- Proper error handling
- Type safety maintained
- Performance considerations
- Security best practices

### Testing
- Adequate test coverage
- Tests are meaningful and maintainable
- Edge cases covered
- Integration tests included

### Documentation
- Code is self-documenting
- Complex logic is explained
- API changes are documented
- README updates included

### Safety
- No security vulnerabilities
- Proper input validation
- Resource cleanup handled
- Error boundaries implemented

## Output Format
Please provide:

### 1. Overall Assessment
- **APPROVE**: Code is ready for merge
- **REQUEST_CHANGES**: Issues need to be fixed
- **NEEDS_DISCUSSION**: Further discussion required

### 2. Specific Issues
List any problems found with:
- **Severity**: Critical, High, Medium, Low
- **Category**: Security, Performance, Code Quality, Testing, Documentation
- **Description**: Clear explanation of the issue
- **Suggestion**: How to fix the issue

### 3. Suggestions
Improvement recommendations:
- Code optimization opportunities
- Better patterns to follow
- Additional tests needed
- Documentation improvements

### 4. Questions
Anything that needs clarification:
- Unclear requirements
- Design decisions
- Implementation choices
- Future considerations

## Review Checklist

### Frontend Code Review
- [ ] TypeScript types are properly defined
- [ ] React components follow best practices
- [ ] State management is appropriate
- [ ] Error boundaries are implemented
- [ ] Performance optimizations applied
- [ ] Accessibility considerations
- [ ] Responsive design implemented
- [ ] Unit tests cover all logic
- [ ] Integration tests for API calls
- [ ] E2E tests for user workflows

### Backend Code Review
- [ ] Python type hints are used
- [ ] FastAPI patterns are followed
- [ ] Database queries are optimized
- [ ] Input validation is implemented
- [ ] Error handling is comprehensive
- [ ] Security measures are in place
- [ ] Logging is appropriate
- [ ] Unit tests cover business logic
- [ ] Integration tests for endpoints
- [ ] Database tests for repositories

### API Review
- [ ] RESTful conventions followed
- [ ] Proper HTTP status codes
- [ ] Consistent response format
- [ ] Input validation implemented
- [ ] Error responses are clear
- [ ] API documentation updated
- [ ] Rate limiting considered
- [ ] Authentication/authorization
- [ ] CORS configuration
- [ ] Versioning strategy

### Database Review
- [ ] Schema design is appropriate
- [ ] Indexes are optimized
- [ ] Foreign key constraints
- [ ] Data integrity maintained
- [ ] Migration scripts included
- [ ] Query performance
- [ ] Connection pooling
- [ ] Backup strategy
- [ ] Data validation
- [ ] Security considerations

## Example Review Response

### Overall Assessment
**REQUEST_CHANGES** - Several issues need to be addressed before merge.

### Specific Issues

#### Critical Issues
1. **Security**: Missing input validation on user registration
   - **Description**: Email field accepts any string without validation
   - **Suggestion**: Add email format validation using Pydantic EmailStr
   - **Location**: `backend/api/v1/users.py:45`

2. **Performance**: N+1 query problem in team member list
   - **Description**: Each team member triggers separate database query
   - **Suggestion**: Use joinedload to fetch members in single query
   - **Location**: `backend/services/team_service.py:78`

#### High Priority Issues
3. **Code Quality**: Missing error handling in API endpoint
   - **Description**: Database connection errors not handled
   - **Suggestion**: Add try-catch block with proper error logging
   - **Location**: `backend/api/v1/todos.py:23`

#### Medium Priority Issues
4. **Testing**: Insufficient test coverage for edge cases
   - **Description**: Only happy path scenarios tested
   - **Suggestion**: Add tests for invalid inputs and error conditions
   - **Location**: `backend/tests/test_todos.py`

#### Low Priority Issues
5. **Documentation**: Missing API documentation
   - **Description**: New endpoint not documented in OpenAPI
   - **Suggestion**: Add proper docstring with examples
   - **Location**: `backend/api/v1/posts.py:67`

### Suggestions
1. **Performance**: Consider implementing Redis caching for frequently accessed data
2. **Security**: Add rate limiting to prevent brute force attacks
3. **Testing**: Implement property-based testing for complex validation logic
4. **Documentation**: Add more examples in API documentation

### Questions
1. Should we implement soft delete for todos instead of hard delete?
2. Do we need to add audit logging for user actions?
3. Should we implement pagination for the team member list?

## Review Best Practices

### Be Constructive
- Focus on the code, not the person
- Provide specific, actionable feedback
- Explain the reasoning behind suggestions
- Offer alternatives when possible

### Be Thorough
- Review all aspects of the code
- Check for security vulnerabilities
- Consider performance implications
- Verify test coverage

### Be Consistent
- Apply the same standards to all code
- Follow established review patterns
- Use consistent terminology
- Maintain review quality

### Be Timely
- Complete reviews promptly
- Respond to follow-up questions
- Update review status as needed
- Escalate blocking issues

## Review Templates

### Quick Review (Minor Changes)
```
✅ APPROVE - Minor changes look good
- Code follows established patterns
- No security or performance issues
- Tests are adequate
- Documentation is sufficient
```

### Standard Review (Feature Implementation)
```
🔄 REQUEST_CHANGES - Several issues to address

**Critical Issues:**
- [Issue 1 with severity and location]

**High Priority Issues:**
- [Issue 2 with severity and location]

**Suggestions:**
- [Improvement suggestions]

**Questions:**
- [Clarification needed]
```

### Complex Review (Major Changes)
```
❓ NEEDS_DISCUSSION - Architecture decisions needed

**Design Questions:**
- [Architecture concerns]

**Implementation Concerns:**
- [Technical issues]

**Alternative Approaches:**
- [Different solutions to consider]

**Next Steps:**
- [What needs to be decided]
``` 