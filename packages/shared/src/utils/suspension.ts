import dayjs from 'dayjs';
import type { SuspensionType } from '../constants/enums';

/**
 * 제재 유형 → 종료 일시 계산
 * WARNING: 시작 + WARNING_LIFETIME_DAYS (옐로카드. 30일 후 자동 만료)
 * TEMPORARY: 시작 + durationDays
 * PERMANENT: null (영구)
 */
export function calcSuspensionEndsAt(
  type: SuspensionType,
  durationDays?: number
): string | null {
  if (type === 'WARNING') {
    return dayjs().add(WARNING_LIFETIME_DAYS, 'day').toISOString();
  }
  if (type === 'TEMPORARY' && durationDays) {
    return dayjs().add(durationDays, 'day').toISOString();
  }
  return null;
}

export const TEMPORARY_DURATION_OPTIONS = [
  { days: 7, label: '7일 정지' },
  { days: 30, label: '30일 정지' },
] as const;

/**
 * 자동 에스컬레이션 임계치 — BE SuspensionService 와 동일하게 유지해야 함.
 * 최근 N일 내 WARNING M회 누적 시 자동 TEMPORARY 부과.
 */
export const WARNING_WINDOW_DAYS = 30;
export const WARNING_THRESHOLD = 5;
/** WARNING 1건의 유효 기간 (일). 옐로카드처럼 일정 기간 후 자동 만료. BE WARNING_LIFETIME_DAYS 와 일치 필수. */
export const WARNING_LIFETIME_DAYS = 30;
export const FIRST_TEMP_DAYS = 7;
export const SECOND_TEMP_DAYS = 30;

export type EscalationOutcome =
  | { willEscalate: false }
  | { willEscalate: true; nextType: 'TEMPORARY'; days: 7 | 30 }
  | { willEscalate: true; nextType: 'PERMANENT' };

/**
 * WARNING 1건을 추가 부과한다고 가정했을 때 자동 에스컬레이션 결과를 미리 계산.
 *   - currentWarningCount: 최근 30일 내 WARNING 부과 건수 (이번 부과 전)
 *   - lastTemporaryDurationDays: 직전 TEMPORARY 의 일수 (없으면 null)
 */
export function previewWarningEscalation(
  currentWarningCount: number,
  lastTemporaryDurationDays: number | null,
): EscalationOutcome {
  const after = currentWarningCount + 1;
  if (after < WARNING_THRESHOLD) return { willEscalate: false };

  if (lastTemporaryDurationDays == null) {
    return { willEscalate: true, nextType: 'TEMPORARY', days: FIRST_TEMP_DAYS };
  }
  if (lastTemporaryDurationDays <= FIRST_TEMP_DAYS) {
    return { willEscalate: true, nextType: 'TEMPORARY', days: SECOND_TEMP_DAYS };
  }
  return { willEscalate: true, nextType: 'PERMANENT' };
}
