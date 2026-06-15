import type {
  MatchingFunnel,
  MatchingDailyPoint,
  MatchingWeights,
  MatchConfigItem,
} from '../types/matchingMetrics';

export const mockMatchingFunnel: MatchingFunnel = {
  matches: 2840,
  with_first_msg_in_24h: 1928,
  with_first_msg_in_7d: 2218,
  first_msg_response_rate: 0.612,
  active_after_3d: 1421,
  active_after_7d: 982,
  avg_first_msg_minutes: 38,
};

export const mockMatchingDailyChart = (days = 14): MatchingDailyPoint[] => {
  const arr: MatchingDailyPoint[] = [];
  const today = new Date('2026-05-12');
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const wobble = 0.85 + Math.sin(i / 2.5) * 0.18;
    const matches = Math.round(190 * wobble);
    const chat = Math.round(matches * (0.6 + Math.sin(i / 3) * 0.08));
    arr.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      total_matches: matches,
      chat_started: chat,
      chat_started_rate: chat / matches,
    });
  }
  return arr;
};

export const mockMatchingWeights: MatchingWeights = {
  age_weight: 0.25,
  area_weight: 0.20,
  mbti_weight: 0.10,
  purpose_weight: 0.20,
  drinking_weight: 0.05,
  smoking_weight: 0.05,
  hobby_weight: 0.15,
  base_rate: 0.62,
  premium_boost: 1.4,
  updated_at: '2026-05-08T11:00:00.000Z',
  updated_by_admin_name: '운영 김',
};

/**
 * code_match_config 시드 — sql/migration_match.sql 의 38 row 와 동일 (configKey 알파벳순).
 *  팀원이 mock 모드로 화면 검수할 때 사용.
 */
const MOCK_UPDATED_AT = '2026-05-08T11:00:00.000Z';
const MOCK_UPDATED_BY = 'system';

export const mockMatchConfig: MatchConfigItem[] = [
  { configKey: 'age_max_diff',                 configValue: '8',     valueType: 'INT',    description: '나이차 상한',         updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'bump_ideal',                   configValue: '0.20',  valueType: 'DOUBLE', description: '중요포인트 가산(이상형)', updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'bump_keyword',                 configValue: '0.15',  valueType: 'DOUBLE', description: '중요포인트 가산(키워드)', updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'bump_lifestyle',               configValue: '0.05',  valueType: 'DOUBLE', description: '중요포인트 가산(라이프)', updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'bump_location',                configValue: '0.05',  valueType: 'DOUBLE', description: '중요포인트 가산(지역)',   updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'category_mate_cats',           configValue: '["OUTDOOR","SELF_DEV","SPORTS"]', valueType: 'JSON', description: '같은카테고리 대상',     updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'category_mate_min',            configValue: '2',     valueType: 'INT',    description: '같은카테고리 공통 최소', updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'custom_kw_min',                configValue: '1',     valueType: 'INT',    description: '개인키워드 공통 최소',   updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'daily_show',                   configValue: '50',    valueType: 'INT',    description: '하루 노출 수',           updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'fresh_newbie_fan_out',         configValue: '200',   valueType: 'INT',    description: '신규자 1명당 등장 viewer 최대', updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'fresh_newbie_reserved_slots',  configValue: '5',     valueType: 'INT',    description: '50 cap 중 신규자 예약 슬롯 수', updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'fresh_newbie_reserved_step',   configValue: '5',     valueType: 'INT',    description: '신규자 예약 rank 간격(step)',   updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'fresh_newbie_window_hours',    configValue: '24',    valueType: 'INT',    description: '신규자 판정 기간(시간)',        updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'i_like_threshold',             configValue: '0.65',  valueType: 'DOUBLE', description: '#내가좋아하는 임계값',          updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'ideal_both_min',               configValue: '0.45',  valueType: 'DOUBLE', description: '#이상형 양방향 임계값',          updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'ideal_few_penalty',            configValue: '0.80',  valueType: 'DOUBLE', description: '필드<최소 시 감점 배수',         updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'ideal_min_fields',             configValue: '3',     valueType: 'INT',    description: '이상형 평가 최소 필드 수',       updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'keyword_base',                 configValue: '0.40',  valueType: 'DOUBLE', description: '키워드 점수 하한',               updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'keyword_chip_count',           configValue: '3',     valueType: 'INT',    description: '공통 키워드 칩 개수',            updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'keyword_coef',                 configValue: '0.60',  valueType: 'DOUBLE', description: '키워드 Jaccard 계수',            updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'keyword_tag_threshold',        configValue: '0.50',  valueType: 'DOUBLE', description: '#키워드 임계값',                 updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'last_active_days',             configValue: '31',    valueType: 'INT',    description: '최근 활동 기준(일)',             updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'lifestyle_tag_threshold',      configValue: '0.60',  valueType: 'DOUBLE', description: '#라이프 임계값',                 updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'likes_me_threshold',           configValue: '0.65',  valueType: 'DOUBLE', description: '#나를좋아하는 임계값',           updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'location_tag_threshold',       configValue: '0.60',  valueType: 'DOUBLE', description: '#가까운지역 임계값',             updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'newbie_floor',                 configValue: '10',    valueType: 'INT',    description: '뉴비 노출 하한',                 updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'newbie_ratio',                 configValue: '0.40',  valueType: 'DOUBLE', description: '뉴비 비율(200/300)',             updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'newbie_window_days',           configValue: '7',     valueType: 'INT',    description: '뉴비 판정 기간(일)',             updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'pass_cooldown_days',           configValue: '30',    valueType: 'INT',    description: '패스 쿨다운(일)',                updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'pool_size',                    configValue: '500',   valueType: 'INT',    description: '풀 크기',                        updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'radius_steps_km',              configValue: '[20,50,100,-1]', valueType: 'JSON', description: '반경 확장(km, -1=전국)', updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'random_slots',                 configValue: '5',     valueType: 'INT',    description: '랜덤 발견 슬롯',                 updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'recompute_action_threshold',   configValue: '5',     valueType: 'INT',    description: '오늘 본인 액션 ≥ N 시 프로필 재계산 차단', updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'recompute_max_per_day',        configValue: '1',     valueType: 'INT',    description: '일일 프로필 재계산 최대 횟수',   updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'region_tiers',                 configValue: '[[5,1.0],[20,0.8],[50,0.6],[100,0.4],[99999,0.2]]', valueType: 'JSON', description: '지역 거리 구간(km)→점수', updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'weight_ideal',                 configValue: '0.35',  valueType: 'DOUBLE', description: 'sortKey 이상형 가중치',         updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'weight_keyword',               configValue: '0.40',  valueType: 'DOUBLE', description: 'sortKey 키워드 가중치',         updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'weight_lifestyle',             configValue: '0.10',  valueType: 'DOUBLE', description: 'sortKey 라이프 가중치',         updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
  { configKey: 'weight_location',              configValue: '0.15',  valueType: 'DOUBLE', description: 'sortKey 지역 가중치',           updatedAt: MOCK_UPDATED_AT, updatedBy: MOCK_UPDATED_BY },
];
