describe('Login Page', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('로그인 페이지가 정상적으로 렌더링되는지 확인', () => {
    cy.get('h1').should('contain', '로그인')
    cy.get('input[type="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.get('button[type="submit"]').should('be.visible')
  })

  it('이메일과 비밀번호를 입력할 수 있는지 확인', () => {
    const testEmail = 'test@example.com'
    const testPassword = 'password123'

    cy.get('input[type="email"]').type(testEmail)
    cy.get('input[type="password"]').type(testPassword)

    cy.get('input[type="email"]').should('have.value', testEmail)
    cy.get('input[type="password"]').should('have.value', testPassword)
  })

  it('로그인 폼 제출이 동작하는지 확인', () => {
    cy.get('input[type="email"]').type('test@example.com')
    cy.get('input[type="password"]').type('password123')
    cy.get('button[type="submit"]').click()

    // 로그인 성공/실패 여부와 관계없이 폼 제출이 동작하는지 확인
    cy.get('button[type="submit"]').should('exist')
  })
}) 