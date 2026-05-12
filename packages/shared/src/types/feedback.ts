import type {
  FeedbackType,
  FeedbackCategory,
  FeedbackStatus,
} from '../constants/enums';

export interface Feedback {
  id: number;
  reporter_id: number;
  reporter_nickname?: string;
  feedback_type: FeedbackType;
  category_code: FeedbackCategory;
  title: string;
  content: string;
  screenshot_urls: string[] | null;
  app_version: string | null;
  device_info: string | null;
  network_type: string | null;
  status: FeedbackStatus;
  admin_reply: string | null;
  admin_reply_at: string | null;
  admin_handler_id: number | null;
  admin_handler_name?: string;
  admin_internal_memo: string | null;
  create_time: string;
  update_time: string;
}

export interface FeedbackListParams {
  feedback_type?: FeedbackType;
  status?: FeedbackStatus;
  category_code?: FeedbackCategory;
  keyword?: string;
  page?: number;
  size?: number;
}

export interface UpdateFeedbackRequest {
  status?: FeedbackStatus;
  admin_reply?: string;
  admin_internal_memo?: string;
}
