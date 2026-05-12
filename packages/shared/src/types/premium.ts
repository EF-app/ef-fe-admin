export type PremiumPlanCode = 'BASIC' | 'PRO' | 'TRIAL';

export interface PremiumMember {
  user_id: number;
  user_uuid: string;
  nickname: string;
  plan_code: PremiumPlanCode;
  plan_name: string;
  started_at: string;
  expires_at: string;
  is_auto_renew: boolean;
  total_paid: number;
  star_used: number;
  super_like_used: number;
  rewind_used: number;
  days_used: number;
}

export interface PremiumListParams {
  keyword?: string;
  plan_code?: PremiumPlanCode;
  is_auto_renew?: boolean;
  page?: number;
  size?: number;
}
