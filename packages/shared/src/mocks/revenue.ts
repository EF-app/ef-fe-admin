import type { RevenueSummary, RevenueByMethod, RevenueByPlan, PaymentDailySummary } from '../types/revenue';
import type { ChartPoint } from '../types/dashboard';

export const mockRevenueSummary: RevenueSummary = {
  period_start: '2026-04-13',
  period_end: '2026-05-12',
  gross_revenue: 18_420_000,
  net_revenue: 17_010_000,
  refund_amount: 1_410_000,
  payment_count: 1284,
  refund_count: 73,
  subscription_revenue: 12_980_000,
  star_revenue: 5_440_000,
  new_subscribers: 218,
  renewed_subscribers: 442,
  churned_subscribers: 71,
  active_subscribers: 3_148,
};

export const mockRevenueByMethod: RevenueByMethod[] = [
  { pg_provider: 'TOSS', amount: 9_120_000, count: 612, share: 49.5 },
  { pg_provider: 'KAKAOPAY', amount: 4_780_000, count: 358, share: 25.9 },
  { pg_provider: 'NAVERPAY', amount: 2_840_000, count: 212, share: 15.4 },
  { pg_provider: 'APPLE', amount: 1_180_000, count: 64, share: 6.4 },
  { pg_provider: 'GOOGLE', amount: 500_000, count: 38, share: 2.8 },
];

export const mockRevenueByPlan: RevenueByPlan[] = [
  { plan_code: 'PRO_3M', plan_name: 'EF Pro 3개월', amount: 6_640_000, count: 83 },
  { plan_code: 'PRO_1M', plan_name: 'EF Pro 1개월', amount: 4_180_000, count: 140 },
  { plan_code: 'BASIC_1M', plan_name: 'EF Basic 1개월', amount: 2_160_000, count: 145 },
  { plan_code: 'STAR_500', plan_name: '별 500개', amount: 2_870_000, count: 522 },
  { plan_code: 'STAR_1200', plan_name: '별 1200개', amount: 2_570_000, count: 234 },
];

export const mockRevenueDailyChart = (days = 30): ChartPoint[] => {
  const base = 480_000;
  const arr: ChartPoint[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dow = d.getDay();
    const weekend = dow === 0 || dow === 6 ? 1.25 : 1;
    const wobble = 0.85 + Math.sin(i / 3) * 0.15 + (i % 7) * 0.02;
    arr.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      value: Math.round(base * weekend * wobble),
    });
  }
  return arr;
};

export const mockPaymentDailySummary: PaymentDailySummary[] = (() => {
  const out: PaymentDailySummary[] = [];
  const today = new Date('2026-05-12');
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const wobble = 0.85 + Math.sin(i / 2) * 0.15;
    const gross = Math.round(620_000 * wobble);
    const refund = Math.round(48_000 * wobble);
    out.push({
      summary_date: iso,
      total_revenue: gross,
      star_revenue: Math.round(gross * 0.3),
      sub_revenue: Math.round(gross * 0.7),
      refund_amount: refund,
      refund_count: Math.max(1, Math.round(8 * wobble)),
      net_revenue: gross - refund,
      payment_count: Math.round(42 * wobble),
      payment_failed: Math.max(0, Math.round(3 * wobble)),
      payment_pending_expired: 1,
      new_subscriber: Math.round(7 * wobble),
      renewed_subscriber: Math.round(14 * wobble),
      churn_count: Math.round(2 * wobble),
      active_subscriber_eod: 3148 - i * 4,
      dau: Math.round(8200 * wobble),
      new_users: Math.round(120 * wobble),
      withdraw_users: Math.round(11 * wobble),
    });
  }
  return out;
})();
