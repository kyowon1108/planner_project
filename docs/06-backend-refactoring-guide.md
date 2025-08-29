# 백엔드 리팩토링 명령어 가이드

## 리팩토링 요청 방법

### 기본 명령어 형식
```
백엔드 리팩토링을 진행해주세요. 다음 문서들을 확인하고 진행해주세요:
- docs/02-architecture.md
- docs/05-coding-standards.md
- docs/04-tools-and-setup.md
- docs/03-implementation-plan.md
- prompts/refactor-prompt.md
```

### 구체적인 리팩토링 요청 예시

#### 1. 전체 백엔드 리팩토링
```
백엔드 전체를 리팩토링해주세요. 다음 문서들을 확인하고 진행해주세요:
- docs/02-architecture.md
- docs/05-coding-standards.md
- docs/04-tools-and-setup.md
- docs/03-implementation-plan.md
- prompts/refactor-prompt.md

특히 다음 사항들을 개선해주세요:
1. 서비스 레이어 분리
2. 데이터베이스 쿼리 최적화
3. 에러 처리 개선
4. 로깅 시스템 강화
5. 보안 검증 강화
```

#### 2. 특정 모듈 리팩토링
```
백엔드의 [모듈명] 부분을 리팩토링해주세요. 다음 문서들을 확인하고 진행해주세요:
- docs/02-architecture.md
- docs/05-coding-standards.md
- docs/04-tools-and-setup.md
- docs/03-implementation-plan.md
- prompts/refactor-prompt.md

구체적으로 다음 파일들을 개선해주세요:
- backend/api/v1/[모듈명].py
- backend/services/[모듈명]_service.py
- backend/repositories/[모듈명]_repository.py
- backend/models/[모듈명].py
```

#### 3. 성능 최적화 리팩토링
```
백엔드 성능을 최적화하기 위해 리팩토링해주세요. 다음 문서들을 확인하고 진행해주세요:
- docs/02-architecture.md
- docs/05-coding-standards.md
- docs/04-tools-and-setup.md
- docs/03-implementation-plan.md
- prompts/refactor-prompt.md

다음 사항들을 중점적으로 개선해주세요:
1. N+1 쿼리 문제 해결
2. 데이터베이스 인덱스 최적화
3. 캐싱 전략 구현
4. 비동기 처리 개선
5. 연결 풀 최적화
```

#### 4. 보안 강화 리팩토링
```
백엔드 보안을 강화하기 위해 리팩토링해주세요. 다음 문서들을 확인하고 진행해주세요:
- docs/02-architecture.md
- docs/05-coding-standards.md
- docs/04-tools-and-setup.md
- docs/03-implementation-plan.md
- prompts/refactor-prompt.md

다음 사항들을 중점적으로 개선해주세요:
1. 입력 검증 강화
2. 인증/권한 시스템 개선
3. SQL Injection 방지
4. 에러 메시지 보안
5. 로깅 보안 강화
```

## 리팩토링 단계별 명령어

### 1단계: 분석 및 계획
```
백엔드 코드를 분석하고 리팩토링 계획을 수립해주세요. 다음 문서들을 확인하고 진행해주세요:
- docs/02-architecture.md
- docs/05-coding-standards.md
- docs/04-tools-and-setup.md
- docs/03-implementation-plan.md
- prompts/refactor-prompt.md

다음 사항들을 분석해주세요:
1. 현재 코드 구조 분석
2. 성능 병목 지점 식별
3. 보안 취약점 검토
4. 코드 품질 이슈 파악
5. 리팩토링 우선순위 설정
```

### 2단계: 테스트 작성
```
리팩토링을 위한 테스트를 먼저 작성해주세요. 다음 문서들을 확인하고 진행해주세요:
- docs/02-architecture.md
- docs/05-coding-standards.md
- docs/04-tools-and-setup.md
- docs/03-implementation-plan.md
- prompts/refactor-prompt.md

다음 사항들을 포함해주세요:
1. 기존 기능에 대한 단위 테스트
2. 통합 테스트 작성
3. 성능 테스트 추가
4. 보안 테스트 구현
5. 테스트 커버리지 확인
```

### 3단계: 점진적 리팩토링
```
백엔드 코드를 점진적으로 리팩토링해주세요. 다음 문서들을 확인하고 진행해주세요:
- docs/02-architecture.md
- docs/05-coding-standards.md
- docs/04-tools-and-setup.md
- docs/03-implementation-plan.md
- prompts/refactor-prompt.md

다음 순서로 진행해주세요:
1. 비즈니스 로직을 서비스 레이어로 분리
2. 데이터베이스 쿼리 최적화
3. 에러 처리 개선
4. 로깅 시스템 강화
5. 보안 검증 강화
```

### 4단계: 검증 및 문서화
```
리팩토링 결과를 검증하고 문서화해주세요. 다음 문서들을 확인하고 진행해주세요:
- docs/02-architecture.md
- docs/05-coding-standards.md
- docs/04-tools-and-setup.md
- docs/03-implementation-plan.md
- prompts/refactor-prompt.md

다음 사항들을 확인해주세요:
1. 모든 테스트 통과 확인
2. 성능 개선 측정
3. 보안 검증 완료
4. API 문서 업데이트
5. 변경사항 문서화
```

## 특정 기능별 리팩토링 명령어

### 인증 시스템 리팩토링
```
인증 시스템을 리팩토링해주세요. 다음 문서들을 확인하고 진행해주세요:
- docs/02-architecture.md
- docs/05-coding-standards.md
- docs/04-tools-and-setup.md
- docs/03-implementation-plan.md
- docs/features/feature-001-auth.md
- prompts/refactor-prompt.md

다음 사항들을 개선해주세요:
1. JWT 토큰 관리 개선
2. 비밀번호 해싱 강화
3. 이메일 인증 로직 개선
4. 권한 관리 시스템 강화
5. 보안 로깅 추가
```

### 데이터베이스 레이어 리팩토링
```
데이터베이스 레이어를 리팩토링해주세요. 다음 문서들을 확인하고 진행해주세요:
- docs/02-architecture.md
- docs/05-coding-standards.md
- docs/04-tools-and-setup.md
- docs/03-implementation-plan.md
- prompts/refactor-prompt.md

다음 사항들을 개선해주세요:
1. Repository 패턴 구현
2. N+1 쿼리 문제 해결
3. 데이터베이스 인덱스 최적화
4. 연결 풀 설정 개선
5. 트랜잭션 관리 강화
```

### API 엔드포인트 리팩토링
```
API 엔드포인트를 리팩토링해주세요. 다음 문서들을 확인하고 진행해주세요:
- docs/02-architecture.md
- docs/05-coding-standards.md
- docs/04-tools-and-setup.md
- docs/03-implementation-plan.md
- prompts/refactor-prompt.md

다음 사항들을 개선해주세요:
1. 비즈니스 로직을 서비스로 분리
2. 입력 검증 강화
3. 에러 처리 표준화
4. 응답 형식 통일
5. API 문서 자동화
```

## 리팩토링 완료 후 확인사항

### 코드 품질 확인
```
리팩토링 완료 후 다음 사항들을 확인해주세요:
- docs/05-coding-standards.md의 코딩 표준 준수
- 모든 테스트 통과
- 타입 힌트 완전성
- 문서화 완료
- 코드 복잡도 감소
```

### 성능 확인
```
리팩토링 완료 후 다음 사항들을 확인해주세요:
- 데이터베이스 쿼리 성능 개선
- 응답 시간 단축
- 메모리 사용량 최적화
- 동시 처리 능력 향상
- 캐싱 효과 확인
```

### 보안 확인
```
리팩토링 완료 후 다음 사항들을 확인해주세요:
- 입력 검증 강화
- SQL Injection 방지
- 인증/권한 검증
- 에러 메시지 보안
- 로깅 보안
```

## 문제 해결

### 리팩토링 중 문제 발생 시
```
리팩토링 중 문제가 발생했습니다. 다음 문서들을 확인하고 해결해주세요:
- docs/02-architecture.md
- docs/05-coding-standards.md
- docs/04-tools-and-setup.md
- docs/03-implementation-plan.md
- prompts/refactor-prompt.md

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
- prompts/refactor-prompt.md

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
- [ ] 보안 검증
- [ ] 배포 준비
- [ ] 팀 리뷰

## 주의사항

1. **점진적 접근**: 한 번에 모든 것을 변경하지 말고 단계적으로 진행
2. **테스트 우선**: 리팩토링 전에 충분한 테스트 작성
3. **문서화**: 모든 변경사항을 문서화
4. **팀 협의**: 큰 변경사항은 팀과 협의
5. **롤백 계획**: 문제 발생 시 롤백할 수 있는 계획 준비 