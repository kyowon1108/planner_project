describe('Posts Page', () => {
  beforeEach(() => {
    cy.visit('/posts')
  })

  it('게시글 페이지가 정상적으로 렌더링되는지 확인', () => {
    cy.get('h1').should('contain', '게시글')
    cy.get('button').should('contain', '추가')
  })

  it('게시글 추가 버튼이 동작하는지 확인', () => {
    cy.get('button').contains('추가').click()
    
    // 새 게시글 작성 페이지로 이동하는지 확인
    cy.url().should('include', '/posts/create')
  })

  it('검색 기능이 동작하는지 확인', () => {
    const searchTerm = '테스트'
    cy.get('input[placeholder*="검색"]').type(searchTerm)
    cy.get('input[placeholder*="검색"]').should('have.value', searchTerm)
  })

  it('카테고리 필터가 동작하는지 확인', () => {
    cy.get('select').first().select('일반')
    cy.get('select').first().should('have.value', '일반')
  })
}) 