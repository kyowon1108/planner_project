/**
 * 날짜 관련 유틸리티 함수들
 * 날짜만 사용하도록 단순화
 */

// 현재 날짜 반환 (YYYY-MM-DD 형식)
export const nowDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

// 게시글/댓글용 시간 포맷팅 (YYYY.MM.DD HH:MM 형식)
export const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  } catch (error) {
    console.warn('날짜 포맷팅 오류:', error);
    return dateString;
  }
};

// 날짜가 임박했는지 확인 (3일 이내)
export const isDeadlineImminent = (dueDate: string): boolean => {
  if (!dueDate) return false;
  
  const today = new Date();
  const deadline = new Date(dueDate);
  
  // 날짜만 비교 (시간 제거)
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
  
  const diffTime = deadlineDate.getTime() - todayDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays <= 3 && diffDays >= 0;
};

// 마감일 텍스트 생성
export const getDeadlineText = (dueDate: string): string => {
  if (!dueDate) return '';
  
  const today = new Date();
  const deadline = new Date(dueDate);
  
  // 날짜만 비교 (시간 제거)
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
  
  const diffTime = deadlineDate.getTime() - todayDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return '기한 지남';
  } else if (diffDays === 0) {
    return '오늘';
  } else if (diffDays === 1) {
    return '내일';
  } else {
    return `${diffDays}일 남음`;
  }
};

// 상세 마감일 텍스트 생성 (날짜만)
export const getDetailedDeadlineText = (dueDate: string): string => {
  if (!dueDate) return '';
  
  const today = new Date();
  const deadline = new Date(dueDate);
  
  // 날짜만 비교 (시간 제거)
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
  
  const diffTime = deadlineDate.getTime() - todayDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return '기한 지남';
  } else if (diffDays === 0) {
    return '오늘';
  } else if (diffDays === 1) {
    return '내일';
  } else {
    return `${diffDays}일 남음`;
  }
};

/**
 * 마감시간을 간단하게 표시하는 함수 - KST 기준
 * @param dueDate 마감일시 (KST ISO 문자열)
 * @returns 간단한 마감시간 텍스트
 */
export const getSimpleDeadlineText = (dueDate: string) => {
  const deadline = new Date(dueDate);
  const now = new Date();
  
  // 같은 날인지 확인
  const isSameDay = deadline.toDateString() === now.toDateString();
  
  if (isSameDay) {
    return `오늘 ${deadline.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })}`;
  } else {
    return deadline.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
};

/**
 * 빠른 날짜 선택 옵션들 - KST 기준
 */
export const getQuickDateOptions = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  // 이번 주 금요일 찾기
  const friday = new Date(today);
  const daysUntilFriday = (5 - today.getDay() + 7) % 7;
  friday.setDate(today.getDate() + daysUntilFriday);
  
  // 다음 주 월요일
  const nextMonday = new Date(today);
  const daysUntilMonday = (1 - today.getDay() + 7) % 7;
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  
  const options = [
    { label: '오늘', value: today.toISOString().split('T')[0] },
    { label: '내일', value: tomorrow.toISOString().split('T')[0] },
    { label: '이번 주 금요일', value: friday.toISOString().split('T')[0] },
    { label: '다음 주 월요일', value: nextMonday.toISOString().split('T')[0] },
  ];
  
  // 중복된 날짜 제거
  const uniqueOptions = options.filter((option, index, self) => 
    index === self.findIndex(o => o.value === option.value)
  );
  
  return uniqueOptions;
}; 