import { getApiClient } from './client';
import { ADMIN_ENDPOINTS } from './endpoints';
import type { PageResponse } from '../types/common';
import type { User, UserDetail } from '../types/user';

export interface ProfileReviewListParams {
  page?: number;
  size?: number;
}

export const profileReviewsApi = {
  list: async (params?: ProfileReviewListParams): Promise<PageResponse<User>> => {
    const { data } = await getApiClient().get<PageResponse<User>>(
      ADMIN_ENDPOINTS.PROFILE_REVIEWS,
      { params }
    );
    return data;
  },

  detail: async (userUuid: string): Promise<UserDetail> => {
    const { data } = await getApiClient().get<UserDetail>(
      ADMIN_ENDPOINTS.PROFILE_REVIEW_DETAIL(userUuid)
    );
    return data;
  },

  approve: async (userUuid: string): Promise<void> => {
    await getApiClient().post(ADMIN_ENDPOINTS.PROFILE_REVIEW_APPROVE(userUuid));
  },

  reject: async (userUuid: string, profile_rejected_reason: string): Promise<void> => {
    await getApiClient().post(ADMIN_ENDPOINTS.PROFILE_REVIEW_REJECT(userUuid), {
      profile_rejected_reason,
    });
  },
};
