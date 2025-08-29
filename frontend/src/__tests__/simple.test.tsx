import '@testing-library/jest-dom';

describe('Simple Test', () => {
  it('should work', () => {
    expect(1 + 1).toBe(2);
  });

  it('should have jest-dom matchers', () => {
    const element = document.createElement('div');
    element.textContent = 'Hello World';
    document.body.appendChild(element);
    
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('Hello World');
  });
}); 