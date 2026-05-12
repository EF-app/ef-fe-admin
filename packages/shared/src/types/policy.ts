/**
 * 약관 / 정책 문서 — DDL `code_policy_document` 정합.
 *
 * BE 컬럼: id, policy_type, version, title, content, summary, is_required,
 *         effective_date, expires_at, is_active, requires_reagreement,
 *         create_time, update_time, create_user, update_user
 *
 * 유니크 키: (policy_type, version)
 *
 * 어드민 화면에서는 추가로 displayStatus(어드민용 라이프사이클 — 활성/비활성/예약/만료) 계산해 표시.
 */

/** code_policy_document.policy_type 8종 */
export const POLICY_TYPE = {
  TERMS_AGREE: 'TERMS_AGREE',
  PRIVACY_COLLECTION_AGREE: 'PRIVACY_COLLECTION_AGREE',
  SENSITIVE_AGREE: 'SENSITIVE_AGREE',
  NO_DISCLOSURE_AGREE: 'NO_DISCLOSURE_AGREE',
  MARKETING_AGREE: 'MARKETING_AGREE',
  PUSH_AGREE: 'PUSH_AGREE',
  LOCATION_AGREE: 'LOCATION_AGREE',
  PRIVACY_POLICY: 'PRIVACY_POLICY',
} as const;
export type PolicyKind = (typeof POLICY_TYPE)[keyof typeof POLICY_TYPE];

/** 어드민 표시용 상태 (BE 컬럼은 is_active + 날짜로 표현, 화면용으로 묶어서) */
export type PolicyStatus =
  | 'ACTIVE'       // is_active=true, 현재 사용 중
  | 'SCHEDULED'    // is_active=true 지만 effective_date 가 미래
  | 'EXPIRED'      // expires_at 지난 버전
  | 'INACTIVE';    // is_active=false (구버전·임시)

export interface PolicyDoc {
  id: number;
  uuid: string;          // 어드민 라우팅용 (BE 가 없으면 `pol-${id}` 형태로 합성)
  policy_type: PolicyKind;

  version: string;       // 'v1.0' 등
  title: string;
  content: string;       // LONGTEXT
  summary: string | null;

  is_required: boolean;
  effective_date: string;       // 발효일
  expires_at: string | null;    // 만료일 (없으면 무기한)
  is_active: boolean;
  requires_reagreement: boolean;

  create_time: string;
  update_time: string;
  create_user: number;
  create_user_name?: string;
  update_user: number;

  /** 표시용 동의 누적 수 (BE 가 같이 내려줄 거라 가정, 어드민용) */
  consent_count?: number;
}

export interface PolicyListParams {
  policy_type?: PolicyKind;
  is_active?: boolean;
  page?: number;
  size?: number;
}

export interface PolicyUpsertRequest {
  policy_type: PolicyKind;
  version: string;
  title: string;
  content: string;
  summary?: string | null;
  is_required: boolean;
  effective_date: string;          // ISO
  expires_at?: string | null;
  is_active?: boolean;
  requires_reagreement?: boolean;
}
