# 프론트엔드 리팩토링 TODO

## 🎯 목표
- 코드 중복 제거
- 컴포넌트 재사용성 향상
- 성능 최적화
- 유지보수성 개선

## 📋 Phase별 작업 계획

### Phase 1: 공통 컴포넌트 추출
- [ ] PageLayout 컴포넌트 생성
- [ ] DataTable 컴포넌트 생성
- [ ] FilterBar 컴포넌트 생성
- [ ] StatusChip 컴포넌트 생성
- [ ] LoadingState 컴포넌트 생성
- [ ] ErrorState 컴포넌트 생성

### Phase 2: 커스텀 훅 분리
- [ ] useApi 훅 개선
- [ ] useData 훅 생성
- [ ] useForm 훅 생성
- [ ] useOptimization 훅 생성
- [ ] usePagination 훅 생성

### Phase 3: 페이지 컴포넌트 분리
- [ ] DashboardPage 컴포넌트 분리
- [ ] TeamDetailPage 컴포넌트 분리
- [ ] PlannerDetailPage 컴포넌트 분리
- [ ] MyPage 컴포넌트 분리

### Phase 4: 성능 최적화
- [ ] React.memo 적용
- [ ] useMemo, useCallback 최적화
- [ ] 가상화 적용 (긴 리스트)
- [ ] 코드 스플리팅 적용

## 🚀 현재 진행 중
**Phase 1: 공통 컴포넌트 추출**

### 진행 상황
- [x] TODO 리스트 생성
- [ ] PageLayout 컴포넌트 생성
- [ ] DataTable 컴포넌트 생성
- [ ] FilterBar 컴포넌트 생성
- [ ] StatusChip 컴포넌트 생성
- [ ] LoadingState 컴포넌트 생성
- [ ] ErrorState 컴포넌트 생성

## 📝 노트
- 기존 컴포넌트들의 공통 패턴 분석 필요
- TypeScript 타입 정의 개선
- 스타일링 일관성 유지
- 테스트 코드 작성 고려 