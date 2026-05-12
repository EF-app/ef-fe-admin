import {
  createApiClient,
  setApiClient,
  setMockMode,
  STORAGE_KEYS,
} from '@ef-fe-admin/shared';

const baseURL = import.meta.env.VITE_API_URL ?? '';

const client = createApiClient({
  baseURL,
  getToken: () => localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN),
  onUnauthorized: () => {
    // 어디서 튕긴 건지 추적용 — 콘솔에서 호출 스택 확인
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn('[auth] 401 detected — clearing tokens & redirecting to /login');
    }
    localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_PROFILE);
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  },
});

setApiClient(client);

// Mock 모드 토글 (단일 플래그)
// - true  → BE 연결된 도메인(로그인·공지)도 강제 mock. 친구/팀원 데모용.
// - false → BE 연결된 도메인만 실제 BE 호출. 미연결 도메인은 훅이 항상 mock 반환.
// 설정 방법:
//   1) .env.local 에 VITE_USE_MOCK=false 추가
//   2) 또는 콘솔에서 localStorage.setItem('ef_use_mock', 'false') 후 새로고침
const envMockFlag = import.meta.env.VITE_USE_MOCK;
const lsMockFlag =
  typeof window !== 'undefined' ? window.localStorage.getItem('ef_use_mock') : null;
const useMock = lsMockFlag != null ? lsMockFlag !== 'false' : envMockFlag !== 'false';
setMockMode(useMock);

if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.info(
    `[api] mode = ${useMock ? 'MOCK (모두 mock)' : 'REAL BE (연결된 도메인만 BE)'} · baseURL = ${
      baseURL || '(proxy /api, /v1)'
    }`
  );
}
