/**
 * 공통 유효성 검사 규칙 — 웹/앱 폼에서 공통 사용
 * 단순 정규식 기반. 필요 시 zod/yup으로 확장.
 */

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export const validators = {
  required: (value: unknown, fieldName = '값'): ValidationResult => {
    if (value === null || value === undefined || value === '') {
      return { valid: false, message: `${fieldName}을(를) 입력해주세요.` };
    }
    return { valid: true };
  },

  loginId: (value: string): ValidationResult => {
    if (!value) return { valid: false, message: '아이디를 입력해주세요.' };
    if (value.length < 4 || value.length > 50) {
      return { valid: false, message: '아이디는 4~50자여야 합니다.' };
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(value)) {
      return { valid: false, message: '영문·숫자·언더스코어·마침표만 사용 가능합니다.' };
    }
    return { valid: true };
  },

  password: (value: string): ValidationResult => {
    if (!value) return { valid: false, message: '비밀번호를 입력해주세요.' };
    if (value.length < 8) {
      return { valid: false, message: '비밀번호는 8자 이상이어야 합니다.' };
    }
    return { valid: true };
  },

  phone: (value: string): ValidationResult => {
    const normalized = value.replace(/[-\s]/g, '');
    if (!/^01[0-9]{8,9}$/.test(normalized)) {
      return { valid: false, message: '올바른 전화번호 형식이 아닙니다.' };
    }
    return { valid: true };
  },

  email: (value: string): ValidationResult => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return { valid: false, message: '올바른 이메일 형식이 아닙니다.' };
    }
    return { valid: true };
  },

  maxLength: (value: string, max: number, fieldName = '값'): ValidationResult => {
    if (value && value.length > max) {
      return { valid: false, message: `${fieldName}은(는) ${max}자 이하여야 합니다.` };
    }
    return { valid: true };
  },

  minLength: (value: string, min: number, fieldName = '값'): ValidationResult => {
    if (!value || value.length < min) {
      return { valid: false, message: `${fieldName}은(는) ${min}자 이상이어야 합니다.` };
    }
    return { valid: true };
  },

  noticeTitle: (value: string): ValidationResult => {
    if (!value) return { valid: false, message: '제목을 입력해주세요.' };
    if (value.length > 200) {
      return { valid: false, message: '제목은 200자 이하여야 합니다.' };
    }
    return { valid: true };
  },

  noticeBody: (value: string): ValidationResult => {
    if (!value) return { valid: false, message: '본문을 입력해주세요.' };
    return { valid: true };
  },

  suspensionReason: (value: string): ValidationResult => {
    if (!value) return { valid: false, message: '제재 사유를 입력해주세요.' };
    if (value.length > 500) {
      return { valid: false, message: '사유는 500자 이하여야 합니다.' };
    }
    return { valid: true };
  },

  refundReason: (value: string): ValidationResult => {
    if (!value) return { valid: false, message: '환불 사유를 입력해주세요.' };
    if (value.length > 500) {
      return { valid: false, message: '사유는 500자 이하여야 합니다.' };
    }
    return { valid: true };
  },

  rejectionReason: (value: string): ValidationResult => {
    if (!value) return { valid: false, message: '반려 사유를 입력해주세요.' };
    if (value.length > 255) {
      return { valid: false, message: '사유는 255자 이하여야 합니다.' };
    }
    return { valid: true };
  },
};

export function validateAll(
  results: ValidationResult[]
): { valid: boolean; messages: string[] } {
  const messages = results.filter((r) => !r.valid).map((r) => r.message ?? '');
  return { valid: messages.length === 0, messages };
}
