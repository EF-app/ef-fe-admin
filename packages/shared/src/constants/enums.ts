/**
 * DB ENUM 값과 1:1 매핑 (ef_schema_v2.1 기준)
 * 백엔드 응답의 snake_case 값을 그대로 사용
 */

export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  WARNING: 'WARNING',
  TEMP_SUSPENDED: 'TEMP_SUSPENDED',
  PERMANENTLY_SUSPENDED: 'PERMANENTLY_SUSPENDED',
} as const;
export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export const SUSPENSION_TYPE = {
  WARNING: 'WARNING',
  TEMPORARY: 'TEMPORARY',
  PERMANENT: 'PERMANENT',
} as const;
export type SuspensionType = (typeof SUSPENSION_TYPE)[keyof typeof SUSPENSION_TYPE];

export const REPORT_TARGET_TYPE = {
  POST_IT: 'POST_IT',
  BAL_COMMENT: 'BAL_COMMENT',
  PROFILE: 'PROFILE',
  CHAT: 'CHAT',
} as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPE)[keyof typeof REPORT_TARGET_TYPE];

export const REPORT_STATUS = {
  PENDING: 'PENDING',
  PROCESSED: 'PROCESSED',
  DISMISSED: 'DISMISSED',
} as const;
export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED',
} as const;
export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const PAYMENT_TYPE = {
  SUBSCRIPTION: 'SUBSCRIPTION',
  STAR_CHARGE: 'STAR_CHARGE',
} as const;
export type PaymentType = (typeof PAYMENT_TYPE)[keyof typeof PAYMENT_TYPE];

export const REFUND_TYPE = {
  FULL: 'FULL',
  PARTIAL: 'PARTIAL',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
} as const;
export type RefundType = (typeof REFUND_TYPE)[keyof typeof REFUND_TYPE];

export const NOTICE_TARGET_TYPE = {
  ALL: 'ALL',
  IOS: 'IOS',
  ANDROID: 'ANDROID',
  PREMIUM: 'PREMIUM',
  SEGMENT: 'SEGMENT',
} as const;
export type NoticeTargetType = (typeof NOTICE_TARGET_TYPE)[keyof typeof NOTICE_TARGET_TYPE];

export const NOTICE_STATUS = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  SENT: 'SENT',
  CANCELED: 'CANCELED',
} as const;
export type NoticeStatus = (typeof NOTICE_STATUS)[keyof typeof NOTICE_STATUS];

export const NOTICE_SEND_SOURCE = {
  APP: 'APP',
  WEB: 'WEB',
} as const;
export type NoticeSendSource = (typeof NOTICE_SEND_SOURCE)[keyof typeof NOTICE_SEND_SOURCE];

export const ADMIN_ROLE = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
  FINANCE: 'FINANCE',
  CS: 'CS',
} as const;
export type AdminRole = (typeof ADMIN_ROLE)[keyof typeof ADMIN_ROLE];

export const ADMIN_LOGIN_SOURCE = {
  WEB: 'WEB',
  APP: 'APP',
} as const;
export type AdminLoginSource = (typeof ADMIN_LOGIN_SOURCE)[keyof typeof ADMIN_LOGIN_SOURCE];

export const LOGIN_FAILURE_REASON = {
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  INVALID_ID: 'INVALID_ID',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  IP_NOT_ALLOWED: 'IP_NOT_ALLOWED',
  TOTP_FAILED: 'TOTP_FAILED',
  OTHER: 'OTHER',
} as const;
export type LoginFailureReason = (typeof LOGIN_FAILURE_REASON)[keyof typeof LOGIN_FAILURE_REASON];

export const PROFILE_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type ProfileStatus = (typeof PROFILE_STATUS)[keyof typeof PROFILE_STATUS];

export const MATCH_PURPOSE = {
  FRIEND: 'FRIEND',
  LOVER: 'LOVER',
  BOTH: 'BOTH',
} as const;
export type MatchPurpose = (typeof MATCH_PURPOSE)[keyof typeof MATCH_PURPOSE];

export const DRINKING_LEVEL = {
  NONE: 'NONE',
  SOMETIMES: 'SOMETIMES',
  OFTEN: 'OFTEN',
} as const;
export type DrinkingLevel = (typeof DRINKING_LEVEL)[keyof typeof DRINKING_LEVEL];

export const SMOKING_LEVEL = {
  NONE: 'NONE',
  SOMETIMES: 'SOMETIMES',
  OFTEN: 'OFTEN',
} as const;
export type SmokingLevel = (typeof SMOKING_LEVEL)[keyof typeof SMOKING_LEVEL];

export const TATTOO_LEVEL = {
  NONE: 'NONE',
  SMALL: 'SMALL',
  BIG: 'BIG',
} as const;
export type TattooLevel = (typeof TATTOO_LEVEL)[keyof typeof TATTOO_LEVEL];

export const BAL_GAME_STATUS = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  PUBLISHED: 'PUBLISHED',
  HIDDEN: 'HIDDEN',
  ARCHIVED: 'ARCHIVED',
} as const;
export type BalGameStatus = (typeof BAL_GAME_STATUS)[keyof typeof BAL_GAME_STATUS];

export const BAL_APPLY_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type BalApplyStatus = (typeof BAL_APPLY_STATUS)[keyof typeof BAL_APPLY_STATUS];

export const BAL_CATEGORY = {
  FOOD: 1,
  DAILY: 2,
  TRAVEL: 3,
  HOBBY: 4,
  WORK: 5,
  LOVE: 6,
  SOCIAL: 7,
  MEDIA: 8,
} as const;
export type BalCategoryId = (typeof BAL_CATEGORY)[keyof typeof BAL_CATEGORY];

export interface BalCategory {
  id: BalCategoryId;
  name: string;
  emoji: string;
}

export const BAL_CATEGORIES: BalCategory[] = [
  { id: 1, name: '음식·맛집', emoji: '🍜' },
  { id: 2, name: '일상·공감', emoji: '💭' },
  { id: 3, name: '여행·라이프', emoji: '✈️' },
  { id: 4, name: '게임·취미', emoji: '🎮' },
  { id: 5, name: '직장·커리어', emoji: '💼' },
  { id: 6, name: '연애·관계', emoji: '💕' },
  { id: 7, name: '사회·이슈', emoji: '🗞️' },
  { id: 8, name: '영화·드라마', emoji: '🎬' },
];

export const BAL_CATEGORY_MAP: Record<number, BalCategory> = BAL_CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.id]: c }),
  {} as Record<number, BalCategory>
);

export const AUDIT_ACTION = {
  PUBLISH_GAME: 'PUBLISH_GAME',
  HIDE_COMMENT: 'HIDE_COMMENT',
  PROCESS_REPORT: 'PROCESS_REPORT',
  DISMISS_REPORT: 'DISMISS_REPORT',
  REFUND: 'REFUND',
  SUSPEND_USER: 'SUSPEND_USER',
  LIFT_SUSPENSION: 'LIFT_SUSPENSION',
  APPROVE_PROFILE: 'APPROVE_PROFILE',
  REJECT_PROFILE: 'REJECT_PROFILE',
  CREATE_NOTICE: 'CREATE_NOTICE',
  SEND_NOTICE: 'SEND_NOTICE',
  APPROVE_BAL_APPLY: 'APPROVE_BAL_APPLY',
  REJECT_BAL_APPLY: 'REJECT_BAL_APPLY',
  HIDE_BAL_GAME: 'HIDE_BAL_GAME',
} as const;
export type AuditAction = (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION];
