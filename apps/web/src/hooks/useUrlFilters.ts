/**
 * @file hooks/useUrlFilters.ts
 * @description URL 쿼리 파라미터 기반 필터 상태 훅.
 *
 *  목적: admin 목록 페이지에서 필터/정렬/페이지 상태를 URL 에 보관 →
 *        상세 페이지 진입 후 뒤로가기 시 자동 복원.
 *        새로고침/공유 가능. React Query key 와 1:1 매칭.
 *
 *  사용 예:
 *    const [filters, setFilters] = useUrlFilters({
 *      status: { default: 'PENDING' },
 *      sort:   { default: 'OLDEST' },
 *      page:   { default: 0, parse: Number, format: String },
 *    });
 *
 *    setFilters({ status: 'PROCESSED' });   // 다른 키는 보존
 *    setFilters({ status: undefined });     // 기본값으로 되돌리고 URL 에서 제거
 */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface FilterSpec<T> {
  /** URL 에 키가 없을 때 / 기본값과 같을 때 적용되는 값 */
  default: T;
  /** URL string → 실제 타입으로 변환. 기본은 그대로 string */
  parse?: (raw: string) => T;
  /** 실제 값 → URL string. 기본은 String() */
  format?: (val: T) => string;
}

export type FilterSpecs<S extends Record<string, unknown>> = {
  [K in keyof S]: FilterSpec<S[K]>;
};

/**
 * 필터 키별 spec 을 받아 URL 동기화 상태 + setter 반환.
 * - 값 === default 면 URL 에서 해당 키 제거 (URL 깨끗하게)
 * - undefined 전달 시 default 로 되돌리고 URL 에서 제거
 */
export function useUrlFilters<S extends Record<string, unknown>>(
  specs: FilterSpecs<S>,
): [S, (patch: Partial<{ [K in keyof S]: S[K] | undefined }>) => void] {
  const [searchParams, setSearchParams] = useSearchParams();

  const values = useMemo(() => {
    const out = {} as S;
    (Object.keys(specs) as Array<keyof S>).forEach((key) => {
      const spec = specs[key];
      const raw = searchParams.get(key as string);
      if (raw == null) {
        // URL 에 키 없음 → 기본값 (초기 진입 / 깨끗한 URL)
        out[key] = spec.default;
      } else if (raw === '') {
        // URL 에 빈 값 → 사용자가 명시적으로 undefined 선택 (예: '전체' 칩)
        // 단, default 가 이미 undefined 면 sentinel 의미 없음 → default 그대로
        out[key] = (spec.default === undefined
          ? spec.default
          : (undefined as unknown as S[typeof key]));
      } else {
        out[key] = spec.parse ? spec.parse(raw) : (raw as unknown as S[typeof key]);
      }
    });
    return out;
  }, [searchParams, specs]);

  const set = useCallback(
    (patch: Partial<{ [K in keyof S]: S[K] | undefined }>) => {
      const next = new URLSearchParams(searchParams);
      (Object.keys(patch) as Array<keyof S>).forEach((key) => {
        const spec = specs[key];
        const raw = patch[key];

        if (raw === null) {
          next.delete(key as string);
          return;
        }
        if (raw === undefined) {
          // 명시적 undefined — default 가 undefined 면 그냥 URL 에서 삭제 (의미 동일).
          // default 가 비-undefined 일 때만 sentinel(빈 값)로 저장해 "전체" 의도 표현.
          if (spec.default === undefined) {
            next.delete(key as string);
          } else {
            next.set(key as string, '');
          }
          return;
        }
        if (raw === spec.default) {
          // 값이 default 와 같음 → URL 에서 삭제 (URL 깨끗하게)
          next.delete(key as string);
          return;
        }
        if (raw === '') {
          // 빈 문자열 (예: keyword) → 삭제
          next.delete(key as string);
          return;
        }
        const formatted = spec.format
          ? spec.format(raw as S[typeof key])
          : String(raw);
        next.set(key as string, formatted);
      });
      setSearchParams(next, { replace: false });
    },
    [searchParams, setSearchParams, specs],
  );

  return [values, set];
}

/** 흔히 쓰는 parse 헬퍼들 */
export const parseInt0 = (s: string): number => {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
};
export const parseBoolOrUndef = (s: string): boolean | undefined => {
  if (s === 'true') return true;
  if (s === 'false') return false;
  return undefined;
};
