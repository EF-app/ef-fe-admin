/**
 * 단일 mock 플래그 (EF-FE 패턴 정합):
 *  - mockMode=true  → BE 연결된 도메인도 강제로 mock (친구 데모 등 전체 mock 모드)
 *  - mockMode=false → BE 연결된 도메인은 BE 호출. 미연결 도메인은 훅 자체가 항상 mock 반환.
 *
 * "BE 연결 여부"는 환경변수가 아니라 각 훅 코드 안에 하드코딩.
 * BE 가 새 도메인을 구현하면 그 훅의 short-circuit 한 줄을 제거 → isMockMode 분기로 복귀.
 */
let mockMode = true;

export function isMockMode(): boolean {
  return mockMode;
}

export function setMockMode(enabled: boolean): void {
  mockMode = enabled;
}
