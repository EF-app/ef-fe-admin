/**
 * 정산/매출 대시보드용 타입
 */
import type { PaymentDailySummary } from './payment';

export interface RevenueSummary {
  period_start: string;
  period_end: string;
  gross_revenue: number;
  net_revenue: number;
  refund_amount: number;
  payment_count: number;
  refund_count: number;
  subscription_revenue: number;
  star_revenue: number;
  new_subscribers: number;
  renewed_subscribers: number;
  churned_subscribers: number;
  active_subscribers: number;
}

export interface RevenueByMethod {
  pg_provider: string;
  amount: number;
  count: number;
  share: number;
}

export interface RevenueByPlan {
  plan_code: string;
  plan_name: string;
  amount: number;
  count: number;
}

export type { PaymentDailySummary };
