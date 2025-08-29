# 프론트엔드 리팩토링 명령어 가이드

## 리팩토링 요청 방법

### 기본 명령어 형식
```
프론트엔드 리팩토링을 진행해주세요. 다음 문서들을 확인하고 진행해주세요:
- docs/02-architecture.md
- docs/05-coding-standards.md
- docs/04-tools-and-setup.md
- docs/03-implementation-plan.md
- prompts/frontend-refactor-prompt.md
```

### 구체적인 리팩토링 요청 예시

#### 1. 전체 프론트엔드 리팩토링
```
프론트엔드 전체를 리팩토링해주세요. 다음 문서들을 확인하고 진행해주세요:
- docs/02-architecture.md
- docs/05-coding-standards.md
- docs/04-tools-and-setup.md
- docs/03-implementation-plan.md
- prompts/frontend-refactor-prompt.md

특히 다음 사항들을 개선해주세요:
1. TypeScript 타입 안전성 강화
2. 컴포넌트 성능 최적화
3. 상태 관리 개선
4. 에러 처리 강화
5. 접근성 개선
```

#### 2. 특정 컴포넌트 리팩토링
```
프론트엔드의 [컴포넌트명] 부분을 리팩토링해주세요. 다음 문서들을 확인하고 진행해주세요:
- docs/02-architecture.md
- docs/05-coding-standards.md
- docs/04-tools-and-setup.md
- docs/03-implementation-plan.md
- prompts/frontend-refactor-prompt.md

구체적으로 다음 파일들을 개선해주세요:
- frontend/src/components/[컴포넌트명]/
- frontend/src/pages/[페이지명]/
- frontend/src/hooks/use[훅명].ts
- frontend/src/contexts/[컨텍스트명].tsx
```

#### 3. 성능 최적화 리팩토링
```
프론트엔드 성능을 최적화하기 위해 리팩토링해주세요. 다음 문서들을 확인하고 진행해주세요:
- docs/02-architecture.md
- docs/05-coding-standards.md
- docs/04-tools-and-setup.md
- docs/03-implementation-plan.md
- prompts/frontend-refactor-prompt.md

다음 사항들을 중점적으로 개선해주세요:
1. 번들 크기 최적화
2. 컴포넌트 렌더링 최적화
3. API 호출 최적화
4. 이미지 로딩 최적화
5. 코드 스플리팅 구현
```

#### 4. 접근성 개선 리팩토링
```
프론트엔드 접근성을 개선하기 위해 리팩토링해주세요. 다음 문서들을 확인하고 진행해주세요:
- docs/02-architecture.md
- docs/05-coding-standards.md
- docs/04-tools-and-setup.md
- docs/03-implementation-plan.md
- prompts/frontend-refactor-prompt.md

다음 사항들을 중점적으로 개선해주세요:
1. ARIA 라벨 추가
2. 키보드 네비게이션 지원
3. 색상 대비 개선
4. 스크린 리더 호환성
5. 포커스 관리 개선
```

## 리팩토링 단계별 명령어

### 1단계: 분석 및 계획
```
프론트엔드 코드를 분석하고 리팩토링 계획을 수립해주세요. 다음 문서들을 확인하고 진행해주세요:
- docs/02-architecture.md
- docs/05-coding-standards.md
- docs/04-tools-and-setup.md
- docs/03-implementation-plan.md
- prompts/frontend-refactor-prompt.md

다음 사항들을 분석해주세요:
1. 현재 컴포넌트 구조 분석
2. 성능 병목 지점 식별
3. 접근성 이슈 검토
4. 번들 크기 분석
5. 상태 관리 패턴 검토
```

### 2단계: 테스트 작성
```
리팩토링을 위한 테스트를 먼저 작성해주세요. 다음 문서들을 확인하고 진행해주세요:
- docs/02-architecture.md
- docs/05-coding-standards.md
- docs/04-tools-and-setup.md
- docs/03-implementation-plan.md
- prompts/frontend-refactor-prompt.md

다음 사항들을 포함해주세요:
1. 컴포넌트 단위 테스트
2. 통합 테스트 작성
3. 접근성 테스트 추가
4. 성능 테스트 구현
5. 테스트 커버리지 확인
```

### 3단계: 점진적 리팩토링
```
프론트엔드 코드를 점진적으로 리팩토링해주세요. 다음 문서들을 확인하고 진행해주세요:
- docs/02-architecture.md
- docs/05-coding-standards.md
- docs/04-tools-and-setup.md
- docs/03-implementation-plan.md
- prompts/frontend-refactor-prompt.md

다음 순서로 진행해주세요:
1. TypeScript 타입 정의 개선
2. 컴포넌트 성능 최적화
3. 상태 관리 개선
4. 에러 처리 강화
5. 접근성 개선
```

### 4단계: 검증 및 문서화
```
리팩토링 결과를 검증하고 문서화해주세요. 다음 문서들을 확인하고 진행해주세요:
- docs/02-architecture.md
- docs/05-coding-standards.md
- docs/04-tools-and-setup.md
- docs/03-implementation-plan.md
- prompts/frontend-refactor-prompt.md

다음 사항들을 확인해주세요:
1. 모든 테스트 통과 확인
2. 성능 개선 측정
3. 접근성 검증 완료
4. 컴포넌트 문서 업데이트
5. 변경사항 문서화
```

## 특정 기능별 리팩토링 명령어

### 컴포넌트 최적화
```
React 컴포넌트를 최적화해주세요. 다음 문서들을 확인하고 진행해주세요:
- docs/02-architecture.md
- docs/05-coding-standards.md
- docs/04-tools-and-setup.md
- docs/03-implementation-plan.md
- prompts/frontend-refactor-prompt.md

다음 사항들을 개선해주세요:
1. React.memo 적용
2. useMemo/useCallback 최적화
3. 컴포넌트 분리
4. Props 인터페이스 정의
5. 불필요한 리렌더링 방지
```

### 상태 관리 개선
```
상태 관리를 개선해주세요. 다음 문서들을 확인하고 진행해주세요:
- docs/02-architecture.md
- docs/05-coding-standards.md
- docs/04-tools-and-setup.md
- docs/03-implementation-plan.md
- prompts/frontend-refactor-prompt.md

다음 사항들을 개선해주세요:
1. Context API 최적화
2. 커스텀 훅 분리
3. 상태 정규화
4. 불필요한 상태 제거
5. 상태 업데이트 최적화
```

### API 통합 개선
```
API 통합을 개선해주세요. 다음 문서들을 확인하고 진행해주세요:
- docs/02-architecture.md
- docs/05-coding-standards.md
- docs/04-tools-and-setup.md
- docs/03-implementation-plan.md
- prompts/frontend-refactor-prompt.md

다음 사항들을 개선해주세요:
1. API 서비스 레이어 구현
2. 커스텀 훅으로 API 호출 분리
3. 에러 처리 표준화
4. 로딩 상태 관리
5. 캐싱 전략 구현
```

### 라우팅 개선
```
라우팅을 개선해주세요. 다음 문서들을 확인하고 진행해주세요:
- docs/02-architecture.md
- docs/05-coding-standards.md
- docs/04-tools-and-setup.md
- docs/03-implementation-plan.md
- prompts/frontend-refactor-prompt.md

다음 사항들을 개선해주세요:
1. 라우트 구조 정리
2. 코드 스플리팅 구현
3. 라우트 가드 추가
4. 404 페이지 개선
5. 네비게이션 최적화
```

## 리팩토링 완료 후 확인사항

### 코드 품질 확인
```
리팩토링 완료 후 다음 사항들을 확인해주세요:
- docs/05-coding-standards.md의 코딩 표준 준수
- TypeScript strict 모드 활성화
- ESLint 규칙 준수
- 모든 테스트 통과
- 컴포넌트 문서화 완료
```

### 성능 확인
```
리팩토링 완료 후 다음 사항들을 확인해주세요:
- 번들 크기 감소
- 컴포넌트 렌더링 최적화
- API 호출 최적화
- 이미지 로딩 최적화
- 메모리 사용량 개선
```

### 접근성 확인
```
리팩토링 완료 후 다음 사항들을 확인해주세요:
- ARIA 라벨 추가
- 키보드 네비게이션 지원
- 색상 대비 개선
- 스크린 리더 호환성
- 포커스 관리 개선
```

## 문제 해결

### 리팩토링 중 문제 발생 시
```
리팩토링 중 문제가 발생했습니다. 다음 문서들을 확인하고 해결해주세요:
- docs/02-architecture.md
- docs/05-coding-standards.md
- docs/04-tools-and-setup.md
- docs/03-implementation-plan.md
- prompts/frontend-refactor-prompt.md

문제 상황:
[구체적인 문제 설명]

해결 방안을 제시해주세요.
```

### 롤백이 필요한 경우
```
리팩토링을 롤백해야 합니다. 다음 문서들을 확인하고 진행해주세요:
- docs/02-architecture.md
- docs/05-coding-standards.md
- docs/04-tools-and-setup.md
- docs/03-implementation-plan.md
- prompts/frontend-refactor-prompt.md

롤백 이유:
[롤백이 필요한 이유]

안전한 롤백 방법을 제시해주세요.
```

## 리팩토링 체크리스트

### 사전 준비
- [ ] 현재 코드 백업
- [ ] 테스트 환경 준비
- [ ] 리팩토링 계획 수립
- [ ] 팀원과 협의

### 진행 중
- [ ] 단계별 리팩토링
- [ ] 테스트 통과 확인
- [ ] 성능 측정
- [ ] 문서 업데이트

### 완료 후
- [ ] 전체 테스트 실행
- [ ] 성능 테스트
- [ ] 접근성 검증
- [ ] 배포 준비
- [ ] 팀 리뷰

## 주의사항

1. **점진적 접근**: 한 번에 모든 것을 변경하지 말고 단계적으로 진행
2. **테스트 우선**: 리팩토링 전에 충분한 테스트 작성
3. **문서화**: 모든 변경사항을 문서화
4. **팀 협의**: 큰 변경사항은 팀과 협의
5. **롤백 계획**: 문제 발생 시 롤백할 수 있는 계획 준비 