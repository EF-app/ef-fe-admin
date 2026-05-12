import { getApiClient } from './client';
import { ADMIN_ENDPOINTS } from './endpoints';
import type { PageResponse } from '../types/common';
import type {
  Feedback,
  FeedbackListParams,
  UpdateFeedbackRequest,
} from '../types/feedback';

export const feedbackApi = {
  list: async (params?: FeedbackListParams): Promise<PageResponse<Feedback>> => {
    const { data } = await getApiClient().get<PageResponse<Feedback>>(
      ADMIN_ENDPOINTS.FEEDBACKS,
      { params }
    );
    return data;
  },

  detail: async (id: number): Promise<Feedback> => {
    const { data } = await getApiClient().get<Feedback>(
      ADMIN_ENDPOINTS.FEEDBACK_DETAIL(id)
    );
    return data;
  },

  update: async (id: number, payload: UpdateFeedbackRequest): Promise<Feedback> => {
    const { data } = await getApiClient().patch<Feedback>(
      ADMIN_ENDPOINTS.FEEDBACK_UPDATE(id),
      payload
    );
    return data;
  },
};
