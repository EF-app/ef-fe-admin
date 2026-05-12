import type {
  MatchingFunnel,
  MatchingDailyPoint,
  MatchingWeights,
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
