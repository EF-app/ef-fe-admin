import type { NoticeTargetType, NoticeStatus, NoticeSendSource } from '../constants/enums';

export interface Notice {
  id: number;
  uuid: string;
  title: string;
  body: string;
  target_type: NoticeTargetType;
  target_filter: Record<string, unknown> | null;
  status: NoticeStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  sent_count: number;
  read_count: number;
  send_source: NoticeSendSource;
  correction_of: number | null;
  create_time: string;
  update_time: string;
  create_user: number;
  update_user: number | null;
}

export interface NoticeListParams {
  status?: NoticeStatus;
  page?: number;
  size?: number;
}

export interface CreateNoticeRequest {
  title: string;
  body: string;
  target_type: NoticeTargetType;
  target_filter?: Record<string, unknown> | null;
  scheduled_at?: string | null;
}
