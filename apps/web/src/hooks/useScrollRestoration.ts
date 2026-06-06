/**
 * @file hooks/useScrollRestoration.ts
 * @description URL (pathname+search) 단위 스크롤 위치 복원.
 *
 *  목적: 사용자가 긴 목록에서 스크롤 → 상세 진입 → 뒤로가기 시
 *        원래 스크롤 위치 복원.
 *
 *  메커니즘:
 *   - 페이지가 unmount 되거나 URL 이 바뀌기 직전에 현재 scrollY 를 key 에 저장
 *   - 같은 key 로 다시 진입(뒤로가기)하면 mount 직후 scrollTo
 *   - sessionStorage 사용 — 새로고침 후에도 같은 탭이면 유지
 *
 *  사용:
 *    function ReportsPage() {
 *      useScrollRestoration();
 *      ...
 *    }
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const STORAGE_PREFIX = 'admin:scroll:';

function getKey(pathname: string, search: string): string {
  return `${STORAGE_PREFIX}${pathname}${search}`;
}

export function useScrollRestoration(): void {
  const location = useLocation();
  const key = getKey(location.pathname, location.search);

  // 마운트 / URL 변경 시 — 저장된 위치 복원
  useEffect(() => {
    const saved = sessionStorage.getItem(key);
    if (saved != null) {
      const y = Number(saved);
      if (Number.isFinite(y)) {
        // 레이아웃 후 복원 — React Query 가 데이터 로드 후 높이가 늘어나는 케이스 대응
        requestAnimationFrame(() => {
          window.scrollTo(0, y);
        });
      }
    }

    // 페이지 떠날 때 (다른 라우트로 이동 직전) 현재 위치 저장
    return () => {
      sessionStorage.setItem(key, String(window.scrollY));
    };
  }, [key]);
}
