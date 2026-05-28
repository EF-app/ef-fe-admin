import type {
  UserStatus,
  SuspensionType,
  ProfileStatus,
  MatchPurpose,
} from '../constants/enums';

// re-export — User 타입에서 직접 사용
export type { ProfileStatus };

export interface User {
  id: number;
  uuid: string;
  login_id: string;
  phone: string;
  /** 업무 이메일 — BE 응답에 포함 (없으면 null) */
  email?: string | null;
  /** 생년월일 정수 (예: 19980314). 별도 표시용. verified_birth_date 와 별개. */
  birth?: number | null;
  nickname: string;
  nickname_changed_at: string | null;
  age: number;
  job: string | null;
  is_withdraw: boolean;
  withdraw_date: string | null;
  status: UserStatus;
  /** 프로필 심사 상태 — BE user_profile.profile_status (목록 응답에 포함, 없으면 미정) */
  profile_status?: ProfileStatus;
  /** 지역명 조합 문자열 ("서울특별시 강남구"). 미입력 시 null */
  area: string | null;
  last_login_time: string | null;
  verified_birth_date: string | null;
  identity_verified_at: string | null;
  create_time: string;
  update_time: string;
}

/** 관심 대상 — BE Purpose enum 미러 (com.nokcha.efbe.domain.profile.entity.Purpose). */
export type InterestTarget = 'LOVE' | 'FRIEND' | 'MIXED';

/** 관심사 키워드 8 그룹 (EF-FE KeywordSet 정합) */
export interface ProfileKeywordSet {
  lifestyle: string[];
  hobby: string[];
  outdoor: string[];
  self_improve: string[];
  food: string[];
  sports: string[];
  music: string[];
  game: string[];
}

export interface UserProfile {
  user_id: number;
  purpose: MatchPurpose;
  bio_message: string | null;
  mbti: string | null;
  /** code_personal 라벨 텍스트 ("가끔 마심" 등). 미입력 시 null */
  drinking: string | null;
  smoking: string | null;
  tattoo: string | null;
  /** code_personal 키 라벨 ("166~170" 등). 미입력 시 null */
  height: string | null;
  hair_style: string | null;
  body_type: string | null;
  important_factor: string | null;
  boost_expires_at: string | null;
  profile_status: ProfileStatus;
  profile_rejected_reason: string | null;
  profile_reviewed_at: string | null;
  profile_reviewed_by: number | null;
  create_time: string;
  update_time: string;

  /* ── EF-FE profile-creation 확장 필드 (어드민 표시용, 모두 선택) ── */

  /** 관심 대상 (지인 / 모두 / 애인) */
  interest_target?: InterestTarget;
  /** 관심사 키워드 8 그룹 — 각 그룹은 라벨 배열 */
  keywords?: ProfileKeywordSet;
  /** 사용자가 직접 추가한 나만의 태그 */
  my_tags?: string[];

  /** 음주 선호 주종 (라벨 배열) — drinking freq 와 별개 */
  drink_types?: string[];
  /** 흡연 종류 (라벨 배열) */
  smoke_types?: string[];

  /** 추가 외모/성향 */
  vibe?: string;          // 성향 (외향적 등)

  /* ── 추가 스타일 (EF-FE: ToggleSection) ── */
  daily_type?: string;    // 일상 유형
  religion?: string;
  friends_around?: string; // 이쪽 지인
  coming_out?: string;     // 커밍아웃 정도
  fashion?: string;
  grooming?: string;       // 꾸미는 스타일

  /* ── 이상형 ── */
  ideal_hair?: string;
  ideal_body?: string;
  ideal_height?: string;
  ideal_vibe?: string;
  important_points?: string[];

  /* ── MBTI 부가 ── */
  mbti_desc?: string;
  mbti_emoji?: string;

  /* ── 완성도 (BE 계산값) ── */
  completion?: number;        // 0~100
  completion_hint?: string;
}

export interface UserPhoto {
  id: number;
  user_id: number;
  url: string;
  order_no: number;
  is_main: boolean;
}

export interface UserSuspension {
  id: number;
  user_id: number;
  suspension_type: SuspensionType;
  reason: string;
  starts_at: string;
  ends_at: string | null;
  is_lifted: boolean;
  lifted_at: string | null;
  lifted_by_admin_id: number | null;
  lifted_reason: string | null;
  created_by_admin_id: number;
  create_time: string;
  update_time: string;
}

export interface UserMatchSummary {
  id: number;
  partner_user_id: number;
  partner_nickname: string;
  matched_at: string;
  is_active: boolean;
  last_message_at: string | null;
  message_count: number;
}

export interface UserBlock {
  id: number;
  blocked_user_id: number;
  blocked_user_nickname: string;
  blocked_user_uuid?: string;
  blocked_at: string;
  reason: string | null;
}

/** 이 유저가 다른 유저에게 차단당한 기록 */
export interface UserBlockedBy {
  id: number;
  blocker_user_id: number;
  blocker_user_nickname: string;
  blocker_user_uuid?: string;
  blocked_at: string;
  reason: string | null;
}

/** 이 유저가 작성한 밸런스게임 댓글 */
export interface UserBalGameComment {
  id: number;
  game_id: number;
  game_option_a: string;
  game_option_b: string;
  content: string;
  vote_choice: 'A' | 'B' | null;
  like_count: number;
  reply_count: number;
  create_time: string;
}

export interface UserPostItSummary {
  id: number;
  category_code: string;
  content_preview: string;
  is_hidden: boolean;
  is_deleted: boolean;
  report_count: number;
  reply_count: number;
  create_time: string;
}

export interface UserReportSummary {
  id: number;
  target_type: string;
  reason: string | null;
  status: string;
  create_time: string;
}

/** 이 유저가 다른 콘텐츠/유저에게 한 신고 (낸 신고) */
export interface UserMadeReport {
  id: number;
  target_type: string;
  /** 신고 대상 유저 닉네임 (BE 가 JOIN 해서 내려줌) */
  target_user_nickname: string | null;
  target_user_uuid: string | null;
  reason: string | null;
  status: string;
  create_time: string;
}

/** 디바이스 종류 */
export type LoginDevice = 'IOS' | 'ANDROID' | 'WEB';

/** 로그인 시도 로그 — 보안·도용 조사용 */
export interface UserLoginLog {
  id: number;
  /** 시도 시각 */
  time: string;
  /** 접속 IP */
  ip: string;
  /** 디바이스 종류 */
  device: LoginDevice;
  /** 디바이스 모델/User-Agent 요약 (예: "iPhone 15 Pro · iOS 17.4", "Chrome 124 · macOS") */
  device_label: string | null;
  /** 추정 위치 (예: "대한민국 · 서울") */
  location: string | null;
  /** 성공 여부 */
  success: boolean;
  /** 실패 시 사유 (INVALID_PASSWORD / INVALID_ID / ACCOUNT_LOCKED 등) */
  failure_reason: string | null;
}

export interface UserDetail extends User {
  profile?: UserProfile;
  photos?: UserPhoto[];
  active_suspension?: UserSuspension | null;
  suspensions?: UserSuspension[];
  /** 최근 30일 내 WARNING 부과 건수 — WARNING 부과 시 자동 에스컬레이션 사전 경고용 */
  recent_warning_count?: number;
  /** 직전 TEMPORARY 제재의 일수. 없으면 null. 자동 에스컬레이션 다음 등급 결정용 */
  last_temporary_duration_days?: number | null;
  report_count?: number;
  payment_total?: number;
  /** 보유 잉크(별) 잔액 */
  ink_balance?: number;
  /** 프리미엄 회원 만료 시각 — null 이면 일반 회원 */
  premium_until?: string | null;
  is_premium?: boolean;
  recent_matches?: UserMatchSummary[];
  /** 이 유저가 차단한 사람들 */
  blocks?: UserBlock[];
  /** 이 유저를 차단한 사람들 (역방향) */
  blocked_by?: UserBlockedBy[];
  recent_post_its?: UserPostItSummary[];
  recent_bal_comments?: UserBalGameComment[];
  /** 받은 신고 — 이 유저가 신고 당한 기록 */
  recent_reports?: UserReportSummary[];
  /** 낸 신고 — 이 유저가 다른 대상에 대해 신고한 기록 */
  recent_made_reports?: UserMadeReport[];
  /** 최근 로그인 로그 — 보안·도용 조사용 */
  recent_login_logs?: UserLoginLog[];
}

export interface UserListParams {
  keyword?: string;
  status?: UserStatus;
  page?: number;
  size?: number;
}

export interface SuspendUserRequest {
  suspension_type: SuspensionType;
  reason: string;
  ends_at?: string | null;
}
