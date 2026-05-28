/**
 * 백엔드 어드민 피드백 API 클라이언트 (복수 — /v1/admin/feedbacks).
 * - RspTemplate<T> = { code, message, data } 언랩.
 * - BE 는 camelCase, 화면(Feedback 타입)은 레거시 snake_case → 이 모듈이 매핑.
 *
 * BE 컨트롤러: AdminFeedbackController
 *   - GET    /v1/admin/feedbacks        목록 (feedbackType/status/categoryCode/keyword)
 *   - GET    /v1/admin/feedbacks/{id}   단건 상세
 *   - PATCH  /v1/admin/feedbacks/{id}   처리 (status/adminReply/adminInternalMemo)
 */
import { getApiClient } from './client';
import type { PageResponse } from '../types/common';
import type {
  Feedback,
  FeedbackListParams,
  UpdateFeedbackRequest,
} from '../types/feedback';
import type {
  FeedbackType,
  FeedbackCategory,
  FeedbackStatus,
} from '../constants/enums';

interface RspTemplate<T> {
  code: number;
  message: string;
  data: T;
}

interface SpringPage<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

// BE AdminFeedbackRspDto (camelCase)
interface BeFeedback {
  id: number;
  reporterId: number;
  reporterNickname: string | null;
  reporterLoginId: string | null;
  feedbackType: FeedbackType;
  categoryCode: FeedbackCategory;
  title: string;
  content: string;
  screenshotUrls: string[];
  appVersion: string | null;
  deviceInfo: string | null;
  networkType: string | null;
  status: FeedbackStatus;
  adminReply: string | null;
  adminReplyAt: string | null;
  adminHandlerId: number | null;
  adminHandlerName: string | null;
  adminInternalMemo: string | null;
  createTime: string;
  updateTime: string;
}

const BASE = '/v1/admin/feedbacks';

function toFeedback(be: BeFeedback): Feedback {
  return {
    id: be.id,
    reporter_id: be.reporterId,
    reporter_nickname: be.reporterNickname ?? undefined,
    reporter_login_id: be.reporterLoginId ?? undefined,
    feedback_type: be.feedbackType,
    category_code: be.categoryCode,
    title: be.title,
    content: be.content,
    screenshot_urls: be.screenshotUrls ?? null,
    app_version: be.appVersion,
    device_info: be.deviceInfo,
    network_type: be.networkType,
    status: be.status,
    admin_reply: be.adminReply,
    admin_reply_at: be.adminReplyAt,
    admin_handler_id: be.adminHandlerId,
    admin_handler_name: be.adminHandlerName ?? undefined,
    admin_internal_memo: be.adminInternalMemo,
    create_time: be.createTime,
    update_time: be.updateTime,
  };
}

export const feedbackBeApi = {
  list: async (params?: FeedbackListParams): Promise<PageResponse<Feedback>> => {
    const { data } = await getApiClient().get<RspTemplate<SpringPage<BeFeedback>>>(
      BASE,
      {
        params: {
          feedbackType: params?.feedback_type,
          status: params?.status,
          categoryCode: params?.category_code,
          keyword: params?.keyword,
          page: params?.page,
          size: params?.size,
        },
      }
    );
    const page = data.data;
    return {
      content: page.content.map(toFeedback),
      page: page.number,
      size: page.size,
      totalElements: page.totalElements,
      totalPages: page.totalPages,
      hasNext: !page.last,
    };
  },

  detail: async (id: number): Promise<Feedback> => {
    const { data } = await getApiClient().get<RspTemplate<BeFeedback>>(
      `${BASE}/${id}`
    );
    return toFeedback(data.data);
  },

  update: async (id: number, payload: UpdateFeedbackRequest): Promise<Feedback> => {
    const { data } = await getApiClient().patch<RspTemplate<BeFeedback>>(
      `${BASE}/${id}`,
      {
        status: payload.status,
        adminReply: payload.admin_reply,
        adminInternalMemo: payload.admin_internal_memo,
      }
    );
    return toFeedback(data.data);
  },
};
