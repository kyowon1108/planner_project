/**
 * 시간 관련 유틸리티 함수들
 * KST만 사용하도록 단순화
 */

// 현재 KST 시간 반환
export const nowKst = (): Date => {
  return new Date();
};

// KST 날짜를 포맷팅 (시간 포함)
export const formatKstDate = (date: Date | string): string => {
  try {
    const kstDate = typeof date === 'string' ? new Date(date) : date;
    return kstDate.toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.warn('날짜 포맷팅 오류:', error);
    return String(date);
  }
};

// KST 날짜를 포맷팅 (날짜만)
export const formatKstDateOnly = (date: Date | string): string => {
  try {
    const kstDate = typeof date === 'string' ? new Date(date) : date;
    return kstDate.toLocaleDateString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.warn('날짜 포맷팅 오류:', error);
    return String(date);
  }
}; 