import type {
  UserStatus,
  SuspensionType,
  ProfileStatus,
  MatchPurpose,
  DrinkingLevel,
  SmokingLevel,
  TattooLevel,
} from '../constants/enums';

export interface User {
  id: number;
  uuid: string;
  login_id: string;
  phone: string;
  scode: string;
  nickname: string;
  nickname_changed_at: string | null;
  age: number;
  job: string | null;
  is_withdraw: boolean;
  withdraw_date: string | null;
  status: UserStatus;
  area_id: number | null;
  last_login_time: string | null;
  verified_birth_date: string | null;
  identity_verified_at: string | null;
  create_time: string;
  update_time: string;
}

export interface UserProfile {
  user_id: number;
  match_purpose: MatchPurpose;
  bio_message: string | null;
  mbti: string | null;
  drinking: DrinkingLevel | null;
  smoking: SmokingLevel | null;
  tattoo: TattooLevel | null;
  height: number | null;
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
  lifted_by: number | null;
  lifted_reason: string | null;
  created_by: number;
  create_time: string;
  update_time: string;
}

export interface UserDetail extends User {
  profile?: UserProfile;
  photos?: UserPhoto[];
  active_suspension?: UserSuspension | null;
  suspensions?: UserSuspension[];
  report_count?: number;
  payment_total?: number;
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
