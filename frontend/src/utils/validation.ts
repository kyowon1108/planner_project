export interface ValidationResult {
  isValid: boolean;
  message: string;
}

export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, message: '' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: '올바른 이메일 형식을 입력해주세요.' };
  }
  
  return { isValid: true, message: '✅ 사용 가능한 이메일입니다.' };
};

export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, message: '' };
  }
  
  if (password.length < 8) {
    return { isValid: false, message: '비밀번호는 최소 8자 이상이어야 합니다.' };
  }
  
  const checks = {
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  
  const passedChecks = Object.values(checks).filter(Boolean).length;
  
  if (passedChecks < 3) {
    return { isValid: false, message: '비밀번호는 대문자, 소문자, 숫자, 특수문자 중 3가지 이상을 포함해야 합니다.' };
  }
  
  return { isValid: true, message: '✅ 안전한 비밀번호입니다.' };
};

export const validateName = (name: string): ValidationResult => {
  if (!name) {
    return { isValid: false, message: '' };
  }
  
  if (name.length < 2) {
    return { isValid: false, message: '이름은 최소 2자 이상이어야 합니다.' };
  }
  
  if (name.length > 20) {
    return { isValid: false, message: '이름은 최대 20자까지 입력 가능합니다.' };
  }
  
  const nameRegex = /^[가-힣a-zA-Z\s]+$/;
  if (!nameRegex.test(name)) {
    return { isValid: false, message: '이름에는 한글, 영문, 공백만 입력 가능합니다.' };
  }
  
  return { isValid: true, message: '✅ 사용 가능한 이름입니다.' };
};

export const validateConfirmPassword = (password: string, confirmPassword: string): ValidationResult => {
  if (!confirmPassword) {
    return { isValid: false, message: '' };
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, message: '비밀번호가 일치하지 않습니다.' };
  }
  
  return { isValid: true, message: '✅ 비밀번호가 일치합니다.' };
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}; 