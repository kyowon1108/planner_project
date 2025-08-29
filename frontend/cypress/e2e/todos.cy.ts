describe('Todos Page', () => {
  beforeEach(() => {
    cy.visit('/todos')
  })

  it('할 일 페이지가 정상적으로 렌더링되는지 확인', () => {
    cy.get('h1').should('contain', '할 일')
    cy.get('button').should('contain', '추가')
  })

  it('할 일 추가 버튼이 동작하는지 확인', () => {
    cy.get('button').contains('추가').click()
    
    // 모달이나 폼이 나타나는지 확인
    cy.get('input').should('be.visible')
  })

  it('검색 기능이 동작하는지 확인', () => {
    const searchTerm = '테스트'
    cy.get('input[placeholder*="검색"]').type(searchTerm)
    cy.get('input[placeholder*="검색"]').should('have.value', searchTerm)
  })

  it('정렬 기능이 동작하는지 확인', () => {
    cy.get('select').first().select('due_date')
    cy.get('select').first().should('have.value', 'due_date')
  })
}) 