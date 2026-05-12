/**
 * 푸시 알림 — 공지(notice) 와 분리된 별도 발송 모듈.
 *
 * 공지 등록 자체는 푸시를 발송하지 않으며, 푸시는 항상 이 모듈을 통해 별도로 작성·예약·발송한다.
 * 같은 공지로 시점·대상을 달리해 여러 번 푸시를 보낼 수 있음 (`linkedNoticeId` 가 동일한 푸시 N개).
 */

/** 발송 대상 */
export const PUSH_TARGET = {
  ALL: 'ALL',
  IOS: 'IOS',
  ANDROID: 'ANDROID',
  PREMIUM: 'PREMIUM',
  SEGMENT: 'SEGMENT',
} as const;
export type PushTarget = (typeof PUSH_TARGET)[keyof typeof PUSH_TARGET];

/** 발송 종류 — 어드민 카테고라이즈용 */
export const PUSH_KIND = {
  /** 공지로부터 파생 — 공지 상세에서 "푸시 보내기" 진입 */
  NOTICE_LINK: 'NOTICE_LINK',
  /** 마케팅·프로모션 (할인, 이벤트, 쿠폰 만료 임박 등) */
  MARKETING: 'MARKETING',
  /** 긴급 점검·장애 안내 등 즉시성 알림 */
  EMERGENCY: 'EMERGENCY',
  /** 그 외 임의 푸시 */
  CUSTOM: 'CUSTOM',
} as const;
export type PushKind = (typeof PUSH_KIND)[keyof typeof PUSH_KIND];

/** 발송 라이프사이클 */
export const PUSH_STATUS = {
  DRAFT: 'DRAFT',         // 작성 중
  SCHEDULED: 'SCHEDULED', // 예약됨 (scheduledAt 미래)
  SENDING: 'SENDING',     // 전송 큐 진행 중 (mock 에선 즉시 SENT 로 전환)
  SENT: 'SENT',           // 완료
  FAILED: 'FAILED',       // 실패
  CANCELED: 'CANCELED',   // 예약 취소
} as const;
export type PushStatus = (typeof PUSH_STATUS)[keyof typeof PUSH_STATUS];

export interface Push {
  id: number;
  title: string;            // 푸시 제목 (앱 알림 상단)
  body: string;             // 푸시 본문
  deepLink: string | null;  // 앱 내 이동 경로 (예: "ef://notice/123")
  target: PushTarget;
  /** SEGMENT 일 때 어드민 메모 — "7일 미접속자", "20-25세 서울 거주" 등 */
  segmentDesc: string | null;
  kind: PushKind;
  /** NOTICE_LINK 일 때 연관 공지 id */
  linkedNoticeId: number | null;
  scheduledAt: string | null;
  sentAt: string | null;
  sentCount: number;
  targetCount: number;   // 발송 대상 추정 인원 (어드민 미리보기용)
  status: PushStatus;
  createTime: string;
  createdBy: string;
}

export interface PushListParams {
  status?: PushStatus | 'ALL';
  kind?: PushKind;
  page?: number;
  size?: number;
}

export interface PushUpsertRequest {
  title: string;
  body: string;
  deepLink?: string | null;
  target: PushTarget;
  segmentDesc?: string | null;
  kind: PushKind;
  linkedNoticeId?: number | null;
  /** SCHEDULED 일 때만 채움 (10분 단위) */
  scheduledAt?: string | null;
  /** DRAFT / SCHEDULED / SENT (즉시 발송) */
  status: 'DRAFT' | 'SCHEDULED' | 'SENT';
}
