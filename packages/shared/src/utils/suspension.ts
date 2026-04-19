import dayjs from 'dayjs';
import type { SuspensionType } from '../constants/enums';

/**
 * 제재 유형 → 종료 일시 계산
 * WARNING: ends_at 없음 (경고만)
 * TEMPORARY: 7일 또는 30일 (UI에서 추가 분기 필요)
 * PERMANENT: ends_at 없음 (영구)
 */
export function calcSuspensionEndsAt(
  type: SuspensionType,
  durationDays?: number
): string | null {
  if (type === 'TEMPORARY' && durationDays) {
    return dayjs().add(durationDays, 'day').toISOString();
  }
  return null;
}

export const TEMPORARY_DURATION_OPTIONS = [
  { days: 7, label: '7일 정지' },
  { days: 30, label: '30일 정지' },
] as const;
