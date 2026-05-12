import type { PostItCategory } from '../constants/enums';

export interface PostIt {
  id: number;
  uuid: string;
  user_id: number;
  user_nickname?: string;
  category_code: PostItCategory;
  content: string;
  is_anonymous: boolean;
  expires_at: string;
  pinned_until: string | null;
  report_count: number;
  reply_count: number;
  is_hidden: boolean;
  is_deleted: boolean;
  create_time: string;
  update_time: string;
}

export interface PostItListParams {
  keyword?: string;
  category_code?: PostItCategory;
  is_hidden?: boolean;
  is_deleted?: boolean;
  user_id?: number;
  page?: number;
  size?: number;
}
