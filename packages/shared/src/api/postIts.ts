import { getApiClient } from './client';
import { ADMIN_ENDPOINTS } from './endpoints';
import type { PageResponse } from '../types/common';
import type { PostIt, PostItListParams } from '../types/postIt';

export const postItsApi = {
  list: async (params?: PostItListParams): Promise<PageResponse<PostIt>> => {
    const { data } = await getApiClient().get<PageResponse<PostIt>>(
      ADMIN_ENDPOINTS.POST_ITS,
      { params }
    );
    return data;
  },

  detail: async (uuid: string): Promise<PostIt> => {
    const { data } = await getApiClient().get<PostIt>(
      ADMIN_ENDPOINTS.POST_IT_DETAIL(uuid)
    );
    return data;
  },

  hide: async (uuid: string, reason?: string): Promise<PostIt> => {
    const { data } = await getApiClient().patch<PostIt>(
      ADMIN_ENDPOINTS.POST_IT_HIDE(uuid),
      { reason }
    );
    return data;
  },

  restore: async (uuid: string): Promise<PostIt> => {
    const { data } = await getApiClient().patch<PostIt>(
      ADMIN_ENDPOINTS.POST_IT_RESTORE(uuid)
    );
    return data;
  },
};
