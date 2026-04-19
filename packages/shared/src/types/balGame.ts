import type { BalGameStatus, BalApplyStatus } from '../constants/enums';

export interface BalGame {
  id: number;
  uuid: string;
  option_a: string;
  option_a_desc: string | null;
  option_b: string;
  option_b_desc: string | null;
  description: string | null;
  category_id: number | null;
  category_name?: string;
  status: BalGameStatus;
  scheduled_at: string | null;
  published_at: string | null;
  a_count: number;
  b_count: number;
  comment_count: number;
  applicant_id: number | null;
  applicant_nickname?: string;
  version: number;
  create_time: string;
  update_time: string;
}

export interface BalApply {
  id: number;
  user_id: number | null;
  user_nickname?: string;
  option_a: string;
  option_b: string;
  description: string | null;
  category_id: number | null;
  category_name?: string;
  status: BalApplyStatus;
  admin_memo: string | null;
  create_time: string;
  update_time: string;
}

export type BalGameSort = 'LATEST' | 'VOTES' | 'COMMENTS';

export interface BalGameListParams {
  status?: BalGameStatus;
  category_id?: number;
  sort?: BalGameSort;
  page?: number;
  size?: number;
}

export interface BalApplyListParams {
  status?: BalApplyStatus;
  page?: number;
  size?: number;
}

export interface RejectBalApplyRequest {
  admin_memo: string;
}

export interface BalGameUpsertRequest {
  option_a: string;
  option_a_desc?: string | null;
  option_b: string;
  option_b_desc?: string | null;
  description?: string | null;
  category_id: number;
  status: BalGameStatus;
  scheduled_at?: string | null;
  applicant_id?: number | null;
}

export interface BalCategoryStat {
  category_id: number;
  category_name: string;
  game_count: number;
  vote_count: number;
  bias: number;
}

export interface BalGameStats {
  total_count: number;
  published_count: number;
  scheduled_count: number;
  hidden_count: number;
  draft_count: number;
  archived_count: number;
  total_votes: number;
  total_comments: number;
  category_breakdown: BalCategoryStat[];
}
