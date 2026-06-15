/**
 * 매칭 운영 지표 & 매칭률 가중치 조정
 */

export interface MatchingFunnel {
  matches: number;
  with_first_msg_in_24h: number;
  with_first_msg_in_7d: number;
  first_msg_response_rate: number;
  active_after_3d: number;
  active_after_7d: number;
  avg_first_msg_minutes: number;
}

export interface MatchingDailyPoint {
  date: string;
  total_matches: number;
  chat_started: number;
  chat_started_rate: number;
}

export interface MatchingWeights {
  age_weight: number;
  area_weight: number;
  mbti_weight: number;
  purpose_weight: number;
  drinking_weight: number;
  smoking_weight: number;
  hobby_weight: number;
  base_rate: number;
  premium_boost: number;
  updated_at: string;
  updated_by_admin_name?: string;
}

export interface UpdateMatchingWeightsRequest {
  age_weight: number;
  area_weight: number;
  mbti_weight: number;
  purpose_weight: number;
  drinking_weight: number;
  smoking_weight: number;
  hobby_weight: number;
  base_rate: number;
  premium_boost: number;
}

/**
 * code_match_config 1행 — BE AdminMatchConfigItemRspDto 와 1:1.
 *  valueType: 'INT' | 'DOUBLE' | 'JSON' (스칼라는 string 으로 저장, JSON 은 JSON 문자열).
 */
export type MatchConfigValueType = 'INT' | 'DOUBLE' | 'JSON';

export interface MatchConfigItem {
  configKey: string;
  configValue: string;
  valueType: MatchConfigValueType;
  description: string | null;
  updateTime: string;
  updateUser: number | null;
}

/** PATCH /v1/admin/matches/config 의 body — 변경된 entries 만 */
export interface MatchConfigUpdateRequest {
  entries: { configKey: string; configValue: string }[];
}
