import type { PaymentStatus, PaymentType, RefundType } from '../constants/enums';

export interface PaymentLog {
  id: number;
  user_id: number | null;
  user_nickname?: string;
  order_id: string;
  payment_type: PaymentType;
  ref_plan_id: number | null;
  star_amount: number | null;
  amount: number;
  currency: string;
  pg_provider: string;
  status: PaymentStatus;
  paid_at: string | null;
  refunded_at: string | null;
  refund_type: RefundType | null;
  refund_reason: string | null;
  create_time: string;
  update_time: string;
}

export interface PaymentDailySummary {
  summary_date: string;
  total_revenue: number;
  star_revenue: number;
  sub_revenue: number;
  refund_amount: number;
  refund_count: number;
  net_revenue: number;
  payment_count: number;
  payment_failed: number;
  payment_pending_expired: number;
  new_subscriber: number;
  renewed_subscriber: number;
  churn_count: number;
  active_subscriber_eod: number;
  dau: number;
  new_users: number;
  withdraw_users: number;
}

export interface PaymentListParams {
  status?: PaymentStatus;
  payment_type?: PaymentType;
  page?: number;
  size?: number;
}

export interface RefundRequest {
  refund_type: RefundType;
  refund_reason: string;
  amount?: number;
}

export interface RefundChecklist {
  within_7days: boolean;
  benefit_unused: boolean;
  eligible: boolean;
}
