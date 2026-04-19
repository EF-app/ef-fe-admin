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
} from './enums';

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  ACTIVE: '정상',
  WARNING: '경고',
  TEMP_SUSPENDED: '일시정지',
  PERMANENTLY_SUSPENDED: '영구정지',
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
  FRIEND: '친구',
  LOVER: '연인',
  BOTH: '둘 다',
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
