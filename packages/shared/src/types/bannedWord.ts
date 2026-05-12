export type BannedWordSeverity = 'BLOCK' | 'WARN' | 'MASK';

export interface BannedWord {
  id: number;
  word: string;
  severity: BannedWordSeverity;
  category: string;
  is_active: boolean;
  hit_count: number;
  created_by_admin_id: number;
  created_by_admin_name?: string;
  create_time: string;
  update_time: string;
}

export interface BannedWordListParams {
  keyword?: string;
  severity?: BannedWordSeverity;
  category?: string;
  is_active?: boolean;
  page?: number;
  size?: number;
}

export interface BannedWordUpsertRequest {
  word: string;
  severity: BannedWordSeverity;
  category: string;
  is_active?: boolean;
}
