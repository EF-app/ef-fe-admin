/**
 * ENUM 값 → UI 한글 라벨 매핑
 */
import {
  UserStatus,
  SuspensionType,
  ReportTargetType,
  ReportStatus,
  PaymentStatus,
  PaymentType,
  RefundType,
  NoticeTargetType,
  NoticeStatus,
  ProfileStatus,
  BalGameStatus,
  BalApplyStatus,
  MatchPurpose,
  DrinkingLevel,
  SmokingLevel,
  TattooLevel,
  PostItCategory,
  FeedbackType,
  FeedbackStatus,
  FeedbackCategory,
  AdminRole,
} from './enums';
import type { BannedWordSeverity } from '../types/bannedWord';
import type { PremiumPlanCode } from '../types/premium';
import type { PolicyKind, PolicyStatus } from '../types/policy';
import type { SystemMessageEvent } from '../types/systemMessage';
import type { NoticeBeCategory, NoticeBeStatus } from '../types/noticeBe';
import type { FaqCategory } from '../types/faq';
import type { PushTarget, PushKind, PushStatus } from '../types/push';
import { LOGIN_FAILURE_REASON, type LoginFailureReason } from './enums';
import type { LoginDevice } from '../types/user';
import type {
  BalBeCategory,
  BalGameBeStatus,
  BalApplyBeStatus,
} from '../types/balGameBe';

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: '정상',
  TEMPORARY: '일시정지',
  PERMANENT: '영구정지',
  WITHDRAWING: '탈퇴 신청',
  WITHDRAWN: '탈퇴 완료',
};

export const SUSPENSION_TYPE_LABEL: Record<SuspensionType, string> = {
  WARNING: '경고',
  TEMPORARY: '일시정지',
  PERMANENT: '영구정지',
};

export const REPORT_TARGET_TYPE_LABEL: Record<ReportTargetType, string> = {
  POST_IT: '포스트잇',
  BAL_COMMENT: '게임 댓글',
  PROFILE: '프로필',
  CHAT: '채팅',
  CHAT_IMAGE: '채팅 이미지',
};

export const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  PENDING: '대기 중',
  PROCESSED: '처리됨',
  DISMISSED: '기각됨',
};

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: '결제 대기',
  SUCCESS: '결제 완료',
  FAILED: '결제 실패',
  REFUNDED: '환불됨',
};

export const PAYMENT_TYPE_LABEL: Record<PaymentType, string> = {
  SUBSCRIPTION: '프리미엄 구독',
  STAR_CHARGE: '별 충전',
};

export const REFUND_TYPE_LABEL: Record<RefundType, string> = {
  FULL: '전액 환불',
  PARTIAL: '부분 환불',
  SYSTEM_ERROR: '시스템 오류',
};

export const NOTICE_TARGET_TYPE_LABEL: Record<NoticeTargetType, string> = {
  ALL: '전체',
  IOS: 'iOS 유저',
  ANDROID: 'Android 유저',
  PREMIUM: '프리미엄 구독자',
  SEGMENT: '맞춤 대상',
};

export const NOTICE_STATUS_LABEL: Record<NoticeStatus, string> = {
  DRAFT: '임시저장',
  SCHEDULED: '예약됨',
  SENT: '발송됨',
  CANCELED: '취소됨',
};

export const PROFILE_STATUS_LABEL: Record<ProfileStatus, string> = {
  PENDING: '심사 대기',
  APPROVED: '승인됨',
  REJECTED: '반려됨',
};

export const BAL_GAME_STATUS_LABEL: Record<BalGameStatus, string> = {
  DRAFT: '작성 중',
  SCHEDULED: '예약됨',
  PUBLISHED: '게시됨',
  HIDDEN: '숨김',
  ARCHIVED: '보관됨',
};

export const BAL_APPLY_STATUS_LABEL: Record<BalApplyStatus, string> = {
  PENDING: '대기 중',
  APPROVED: '승인됨',
  REJECTED: '반려됨',
};

export const MATCH_PURPOSE_LABEL: Record<MatchPurpose, string> = {
  LOVE: '연인',
  FRIEND: '친구',
  MIXED: '둘 다',
};

export const DRINKING_LABEL: Record<DrinkingLevel, string> = {
  NONE: '안 마심',
  SOMETIMES: '가끔',
  OFTEN: '자주',
};

export const SMOKING_LABEL: Record<SmokingLevel, string> = {
  NONE: '안 피움',
  SOMETIMES: '가끔',
  OFTEN: '자주',
};

export const TATTOO_LABEL: Record<TattooLevel, string> = {
  NONE: '없음',
  SMALL: '작음',
  BIG: '큼',
};

export const POST_IT_CATEGORY_LABEL: Record<PostItCategory, string> = {
  LIGHTN: '⚡ 번개',
  DAILY: '💭 일상',
  LOVE: '💕 연애',
  INFO: '📌 정보',
  QUESTION: '❓ 질문',
  WORRY: '🌧 고민',
  FREE: '🗨 자유',
};

export const FEEDBACK_TYPE_LABEL: Record<FeedbackType, string> = {
  BUG: '버그 신고',
  FEATURE_REQUEST: '기능 요청',
};

export const FEEDBACK_STATUS_LABEL: Record<FeedbackStatus, string> = {
  RECEIVED: '접수됨',
  IN_REVIEW: '검토 중',
  IN_PROGRESS: '처리 중',
  RESOLVED: '해결됨',
  DEFERRED: '보류',
  CLOSED: '종료',
};

export const FEEDBACK_CATEGORY_LABEL: Record<FeedbackCategory, string> = {
  UI_BROKEN: 'UI 깨짐',
  FEATURE_NOT_WORK: '기능 동작 안 함',
  PERFORMANCE: '성능 문제',
  NEW_FEATURE: '신기능 제안',
  UX_DESIGN: 'UX·디자인',
  PERF_IMPROVE: '성능 개선',
  PAYMENT: '결제',
  NOTIFICATION: '알림',
  CHAT: '채팅',
  ETC: '기타',
};

export const ADMIN_ROLE_LABEL: Record<AdminRole, string> = {
  SUPER_ADMIN: '슈퍼 관리자',
  ADMIN: '관리자',
  MODERATOR: '모더레이터',
  FINANCE: '재무',
  CS: 'CS',
};

export const BANNED_WORD_SEVERITY_LABEL: Record<BannedWordSeverity, string> = {
  BLOCK: '차단',
  WARN: '경고',
  MASK: '마스킹',
};

export const PREMIUM_PLAN_LABEL: Record<PremiumPlanCode, string> = {
  BASIC: 'Basic',
  PRO: 'Pro',
  TRIAL: '체험',
};

export const POLICY_KIND_LABEL: Record<PolicyKind, string> = {
  TERMS_AGREE: '이용약관',
  PRIVACY_COLLECTION_AGREE: '개인정보 수집·이용',
  SENSITIVE_AGREE: '민감정보 수집·이용',
  NO_DISCLOSURE_AGREE: '타인 정보 외부 유출 금지',
  MARKETING_AGREE: '마케팅 정보 수신',
  PUSH_AGREE: '푸시 알림',
  LOCATION_AGREE: '위치기반 서비스',
  PRIVACY_POLICY: '개인정보 처리방침',
};

export const POLICY_STATUS_LABEL: Record<PolicyStatus, string> = {
  ACTIVE: '활성',
  SCHEDULED: '예약',
  EXPIRED: '만료',
  INACTIVE: '비활성',
};

export const SYSTEM_MESSAGE_EVENT_LABEL: Record<SystemMessageEvent, string> = {
  MATCH_CREATED: '매칭 성사',
  MATCH_EXPIRED: '매칭 만료',
  PARTNER_LEFT: '상대 채팅 종료',
  WARNING_ISSUED: '경고 발동',
  CHAT_TIME_LIMIT: '채팅 시간 제한',
  PREMIUM_PROMO: '프리미엄 안내',
  CUSTOM: '커스텀',
};

/** BE NoticeCategory 라벨 (NOTICE/AMEND/EVENT/UPDATE) */
export const NOTICE_BE_CATEGORY_LABEL: Record<NoticeBeCategory, string> = {
  NOTICE: '공지',
  AMEND: '정정',
  EVENT: '이벤트',
  UPDATE: '업데이트',
};

/** BE NoticeStatus 라벨 (DRAFT/SCHEDULED/PUBLISHED/ARCHIVED) */
export const NOTICE_BE_STATUS_LABEL: Record<NoticeBeStatus, string> = {
  DRAFT: '임시저장',
  SCHEDULED: '예약됨',
  PUBLISHED: '게시 중',
  ARCHIVED: '종료',
};

/** BE BalCategoryCode 라벨 (7종) */
export const BAL_BE_CATEGORY_LABEL: Record<BalBeCategory, string> = {
  LOVE: '연애',
  DAILY: '일상',
  TRAVEL: '여행',
  TASTE: '취향',
  WHATIF: '만약에',
  DILEMMA: '딜레마',
  ETC: '기타',
};

/** BE BalGameStatus 라벨 */
export const BAL_GAME_BE_STATUS_LABEL: Record<BalGameBeStatus, string> = {
  DRAFT: '초안',
  SCHEDULED: '예약',
  PUBLISHED: '게시 중',
  HIDDEN: '숨김',
  ARCHIVED: '종료',
};

/** BE BalApplyStatus 라벨 */
export const BAL_APPLY_BE_STATUS_LABEL: Record<BalApplyBeStatus, string> = {
  PENDING: '대기',
  APPROVED: '승인',
  REJECTED: '반려',
};

/** code_faq.category 라벨 */
export const FAQ_CATEGORY_LABEL: Record<FaqCategory, string> = {
  ACCOUNT: '계정',
  MATCHING: '매칭',
  MESSAGE: '메시지',
  PAYMENT: '결제',
  REPORT: '신고·차단',
  ETC: '기타',
};

/** Push 발송 대상 라벨 */
export const PUSH_TARGET_LABEL: Record<PushTarget, string> = {
  ALL: '전체',
  IOS: 'iOS 유저',
  ANDROID: 'Android 유저',
  PREMIUM: '프리미엄 구독자',
  SEGMENT: '맞춤 세그먼트',
};

/** Push 종류 라벨 */
export const PUSH_KIND_LABEL: Record<PushKind, string> = {
  NOTICE_LINK: '공지 연동',
  MARKETING: '마케팅',
  EMERGENCY: '긴급',
  CUSTOM: '일반',
};

/** Push 상태 라벨 */
export const PUSH_STATUS_LABEL: Record<PushStatus, string> = {
  DRAFT: '임시저장',
  SCHEDULED: '예약됨',
  SENT: '전송 완료',
  SENDING: '전송 중',
  FAILED: '실패',
  CANCELED: '취소됨',
};

/** 로그인 실패 사유 라벨 */
export const LOGIN_FAILURE_REASON_LABEL: Record<LoginFailureReason, string> = {
  [LOGIN_FAILURE_REASON.INVALID_PASSWORD]: '비밀번호 불일치',
  [LOGIN_FAILURE_REASON.INVALID_ID]: '존재하지 않는 ID',
  [LOGIN_FAILURE_REASON.ACCOUNT_INACTIVE]: '비활성 계정',
  [LOGIN_FAILURE_REASON.ACCOUNT_LOCKED]: '계정 잠김',
  [LOGIN_FAILURE_REASON.IP_NOT_ALLOWED]: '허용되지 않은 IP',
  [LOGIN_FAILURE_REASON.TOTP_FAILED]: '2FA 실패',
  [LOGIN_FAILURE_REASON.OTHER]: '기타',
};

/** 로그인 디바이스 라벨 */
export const LOGIN_DEVICE_LABEL: Record<LoginDevice, string> = {
  IOS: 'iOS',
  ANDROID: 'Android',
  WEB: 'Web',
};
