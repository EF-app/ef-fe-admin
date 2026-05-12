/**
 * 채팅방 내 시스템 메시지 템플릿
 * - 매칭 성사, 경고, 안내 등 자동 발송 메시지의 본문을 운영자가 관리
 */
export type SystemMessageEvent =
  | 'MATCH_CREATED'
  | 'MATCH_EXPIRED'
  | 'PARTNER_LEFT'
  | 'WARNING_ISSUED'
  | 'CHAT_TIME_LIMIT'
  | 'PREMIUM_PROMO'
  | 'CUSTOM';

export interface SystemMessageTemplate {
  id: number;
  uuid: string;
  event_code: SystemMessageEvent;
  title: string;
  body: string;
  is_active: boolean;
  send_count: number;
  last_sent_at: string | null;
  create_time: string;
  update_time: string;
  update_user_name?: string;
}

export interface SystemMessageListParams {
  event_code?: SystemMessageEvent;
  is_active?: boolean;
  page?: number;
  size?: number;
}

export interface SystemMessageUpsertRequest {
  event_code: SystemMessageEvent;
  title: string;
  body: string;
  is_active?: boolean;
}

export interface SystemMessageBroadcastRequest {
  body: string;
  target: 'ALL_CHATS' | 'PREMIUM_CHATS';
}
