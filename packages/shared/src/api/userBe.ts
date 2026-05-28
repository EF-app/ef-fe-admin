/**
 * 백엔드 어드민 유저 관리 API 클라이언트 (복수 — /v1/admin/users).
 * - RspTemplate<T> = { code, message, data } 언랩.
 * - BE 는 camelCase, 어드민 화면(User/UserDetail 타입)은 레거시 snake_case.
 *   → 이 모듈이 camelCase → snake_case 매핑을 담당한다.
 *
 * BE 컨트롤러: AdminUserController (/v1/admin/users)
 *   - GET           : 목록 (keyword, status, page, size)
 *   - GET /{id}     : 단건 상세
 *
 * 제재 이력 / 매칭 / 차단 / 신고는 BE 미구현 — 응답에 없으며 화면이 빈 배열로 처리.
 * 작성 글(포스트잇/밸런스댓글)은 별도 엔드포인트에서 조회.
 */
import { getApiClient } from './client';
import type { PageResponse } from '../types/common';
import type {
  User,
  UserDetail,
  UserProfile,
  UserPhoto,
  UserListParams,
  UserSuspension,
  InterestTarget,
} from '../types/user';
import type { MatchPurpose } from '../constants/enums';

interface RspTemplate<T> {
  code: number;
  message: string;
  data: T;
}

interface SpringPage<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

const BASE = '/v1/admin/users';

/* ─────────── BE 원본(camelCase) 형태 ─────────── */

interface BeUserSummary {
  id: number;
  uuid: string;
  loginId: string;
  nickname: string;
  age: number | null;
  area: string | null;
  status: User['status'];
  profileStatus?: string | null;
  isWithdraw: boolean;
  lastLoginTime: string | null;
  createTime: string;
}

interface BeUserProfile {
  mbti: string | null;
  matchPurpose: MatchPurpose | null;
  interestTarget: InterestTarget | null;
  job: string | null;
  bioMessage: string | null;
  idealPoints: string[];
  keywords: Record<string, string[]>;
  myTags: string[];
  drinking: string | null;
  drinkTypes: string[];
  smoking: string | null;
  smokeTypes: string[];
  tattoo: string | null;
  hairStyle: string | null;
  bodyType: string | null;
  height: string | null;
  vibe: string | null;
  dailyType: string | null;
  religion: string | null;
  friendsAround: string | null;
  comingOut: string | null;
  fashion: string | null;
  grooming: string | null;
  idealHair: string | null;
  idealBody: string | null;
  idealHeight: string | null;
  idealVibe: string | null;
  profileStatus?: string | null;
  profileRejectedReason?: string | null;
  profileReviewedAt?: string | null;
  profileReviewedBy?: number | null;
}

interface BeUserPhoto {
  id: number;
  url: string;
  sortOrder: number;
}

interface BeUserLoginLog {
  id: number;
  loginAt: string;
  ipAddress: string | null;
  platform: string | null;
  deviceId: string | null;
  success: boolean;
  failureReason: string | null;
}

interface BeAdminSuspension {
  id: number;
  userId: number;
  userNickname: string | null;
  suspensionType: 'WARNING' | 'TEMPORARY' | 'PERMANENT';
  reason: string;
  startsAt: string;
  endsAt: string | null;
  sourceTargetType: string | null;
  sourceTargetId: number | null;
  isLifted: boolean;
  liftedAt: string | null;
  liftedByAdminId: number | null;
  liftedByAdminName: string | null;
  liftedReason: string | null;
  active: boolean;
  createUser: number;
  createdByAdminName: string | null;
  createTime: string;
}

interface BeUserDetail extends BeUserSummary {
  phone: string | null;
  email: string | null;
  birth: number | null;
  lastNicknameChangeTime: string | null;
  updateTime: string;
  withdrawAt: string | null;
  paymentTotal: number;
  premium: boolean;
  premiumUntil: string | null;
  inkBalance: number;
  profile: BeUserProfile | null;
  photos: BeUserPhoto[];
  recentLoginLogs: BeUserLoginLog[];
  activeSuspension: BeAdminSuspension | null;
  suspensions: BeAdminSuspension[];
  recentWarningCount: number;
  lastTemporaryDurationDays: number | null;
}

/* ─────────── camelCase → snake_case 매퍼 ─────────── */

function toUser(be: BeUserSummary): User {
  return {
    id: be.id,
    uuid: be.uuid,
    login_id: be.loginId,
    phone: '',
    nickname: be.nickname,
    nickname_changed_at: null,
    age: be.age ?? 0,
    job: null,
    is_withdraw: be.isWithdraw,
    withdraw_date: null,
    status: be.status,
    profile_status: be.profileStatus
      ? (be.profileStatus as User['profile_status'])
      : undefined,
    area: be.area,
    last_login_time: be.lastLoginTime,
    verified_birth_date: null,
    identity_verified_at: null,
    create_time: be.createTime,
    update_time: be.createTime,
  };
}

function toProfile(be: BeUserProfile | null, userId: number, createTime: string): UserProfile | undefined {
  if (!be) return undefined;
  const kw = be.keywords ?? {};
  return {
    user_id: userId,
    purpose: be.matchPurpose ?? 'FRIEND',
    bio_message: be.bioMessage,
    mbti: be.mbti,
    drinking: be.drinking,
    smoking: be.smoking,
    tattoo: be.tattoo,
    height: be.height,
    hair_style: be.hairStyle,
    body_type: be.bodyType,
    important_factor: null,
    boost_expires_at: null,
    profile_status: (be.profileStatus as UserProfile['profile_status']) ?? 'APPROVED',
    profile_rejected_reason: be.profileRejectedReason ?? null,
    profile_reviewed_at: be.profileReviewedAt ?? null,
    profile_reviewed_by: be.profileReviewedBy ?? null,
    create_time: createTime,
    update_time: createTime,
    interest_target: be.interestTarget ?? undefined,
    keywords: {
      lifestyle: kw.lifestyle ?? [],
      hobby: kw.hobby ?? [],
      outdoor: kw.outdoor ?? [],
      self_improve: kw.self_improve ?? [],
      food: kw.food ?? [],
      sports: kw.sports ?? [],
      music: kw.music ?? [],
      game: kw.game ?? [],
    },
    my_tags: be.myTags,
    drink_types: be.drinkTypes,
    smoke_types: be.smokeTypes,
    vibe: be.vibe ?? undefined,
    daily_type: be.dailyType ?? undefined,
    religion: be.religion ?? undefined,
    friends_around: be.friendsAround ?? undefined,
    coming_out: be.comingOut ?? undefined,
    fashion: be.fashion ?? undefined,
    grooming: be.grooming ?? undefined,
    ideal_hair: be.idealHair ?? undefined,
    ideal_body: be.idealBody ?? undefined,
    ideal_height: be.idealHeight ?? undefined,
    ideal_vibe: be.idealVibe ?? undefined,
    important_points: be.idealPoints,
  };
}

function toPhotos(be: BeUserPhoto[], userId: number): UserPhoto[] {
  return be.map((p, idx) => ({
    id: p.id,
    user_id: userId,
    url: p.url,
    order_no: p.sortOrder,
    is_main: idx === 0,
  }));
}

function toLoginLogs(be: BeUserLoginLog[]): NonNullable<UserDetail['recent_login_logs']> {
  return be.map((l) => ({
    id: l.id,
    time: l.loginAt,
    ip: l.ipAddress ?? '-',
    device: l.platform === 'IOS' || l.platform === 'ANDROID' ? l.platform : 'WEB',
    device_label: l.deviceId,
    location: null,
    success: l.success,
    failure_reason: l.failureReason,
  }));
}

function adminSuspensionToUserSuspension(be: BeAdminSuspension): UserSuspension {
  return {
    id: be.id,
    user_id: be.userId,
    suspension_type: be.suspensionType,
    reason: be.reason,
    starts_at: be.startsAt,
    ends_at: be.endsAt,
    is_lifted: be.isLifted,
    lifted_at: be.liftedAt,
    lifted_by_admin_id: be.liftedByAdminId,
    lifted_reason: be.liftedReason,
    created_by_admin_id: be.createUser,
    create_time: be.createTime,
    update_time: be.createTime,
  };
}

function toUserDetail(be: BeUserDetail): UserDetail {
  return {
    ...toUser(be),
    phone: be.phone ?? '',
    email: be.email,
    birth: be.birth,
    update_time: be.updateTime,
    nickname_changed_at: be.lastNicknameChangeTime,
    withdraw_date: be.withdrawAt,
    profile: toProfile(be.profile, be.id, be.createTime),
    photos: toPhotos(be.photos, be.id),
    payment_total: be.paymentTotal,
    is_premium: be.premium,
    premium_until: be.premiumUntil,
    ink_balance: be.inkBalance,
    recent_login_logs: toLoginLogs(be.recentLoginLogs),
    active_suspension: be.activeSuspension
      ? adminSuspensionToUserSuspension(be.activeSuspension)
      : null,
    suspensions: (be.suspensions ?? []).map(adminSuspensionToUserSuspension),
    recent_warning_count: be.recentWarningCount,
    last_temporary_duration_days: be.lastTemporaryDurationDays,
  };
}

export const userBeApi = {
  getUser: async (params?: UserListParams): Promise<PageResponse<User>> => {
    const { data } = await getApiClient().get<RspTemplate<SpringPage<BeUserSummary>>>(
      BASE,
      { params }
    );
    const page = data.data;
    return {
      content: page.content.map(toUser),
      page: page.number,
      size: page.size,
      totalElements: page.totalElements,
      totalPages: page.totalPages,
      hasNext: !page.last,
    };
  },

  getUserDetail: async (id: number): Promise<UserDetail> => {
    // BE AdminUserDetailRspDto.activeSuspension / suspensions 가 inline 으로 옴 — 단일 호출.
    const { data } = await getApiClient().get<RspTemplate<BeUserDetail>>(`${BASE}/${id}`);
    return toUserDetail(data.data);
  },

  // 프로필 승인 — PATCH /v1/admin/users/{id}/profile/approve
  approveProfile: async (id: number): Promise<void> => {
    await getApiClient().patch<RspTemplate<BeUserDetail>>(
      `${BASE}/${id}/profile/approve`
    );
  },

  // 프로필 반려 — PATCH /v1/admin/users/{id}/profile/reject
  rejectProfile: async (id: number, reason: string): Promise<void> => {
    await getApiClient().patch<RspTemplate<BeUserDetail>>(
      `${BASE}/${id}/profile/reject`,
      { reason }
    );
  },
};
