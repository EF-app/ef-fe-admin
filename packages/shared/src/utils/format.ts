import dayjs from 'dayjs';

export function formatDate(value: string | Date | null | undefined, pattern = 'YYYY-MM-DD'): string {
  if (!value) return '-';
  return dayjs(value).format(pattern);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '-';
  return dayjs(value).format('YYYY-MM-DD HH:mm');
}

export function formatFromNow(value: string | Date | null | undefined): string {
  if (!value) return '-';
  const date = dayjs(value);
  const diffMin = dayjs().diff(date, 'minute');
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = dayjs().diff(date, 'hour');
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = dayjs().diff(date, 'day');
  if (diffDay < 7) return `${diffDay}일 전`;
  return date.format('YYYY-MM-DD');
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-';
  return `₩${value.toLocaleString('ko-KR')}`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '-';
  return value.toLocaleString('ko-KR');
}

export function formatPhone(value: string | null | undefined): string {
  if (!value) return '-';
  const normalized = value.replace(/\D/g, '');
  if (normalized.length === 11) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 7)}-${normalized.slice(7)}`;
  }
  if (normalized.length === 10) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}-${normalized.slice(6)}`;
  }
  return value;
}

export function formatDiff(diff: number | null | undefined): string {
  if (diff == null) return '';
  if (diff > 0) return `▲ ${diff.toLocaleString('ko-KR')}`;
  if (diff < 0) return `▼ ${Math.abs(diff).toLocaleString('ko-KR')}`;
  return '변동 없음';
}
