import { getApiClient } from './client';
import { ADMIN_ENDPOINTS } from './endpoints';
import type { PageResponse } from '../types/common';
import type {
  Notice,
  NoticeListParams,
  CreateNoticeRequest,
} from '../types/notice';

export const noticesApi = {
  list: async (params?: NoticeListParams): Promise<PageResponse<Notice>> => {
    const { data } = await getApiClient().get<PageResponse<Notice>>(
      ADMIN_ENDPOINTS.NOTICES,
      { params }
    );
    return data;
  },

  detail: async (uuid: string): Promise<Notice> => {
    const { data } = await getApiClient().get<Notice>(
      ADMIN_ENDPOINTS.NOTICE_DETAIL(uuid)
    );
    return data;
  },

  create: async (payload: CreateNoticeRequest): Promise<Notice> => {
    const { data } = await getApiClient().post<Notice>(
      ADMIN_ENDPOINTS.NOTICES,
      payload
    );
    return data;
  },

  update: async (uuid: string, payload: Partial<CreateNoticeRequest>): Promise<Notice> => {
    const { data } = await getApiClient().patch<Notice>(
      ADMIN_ENDPOINTS.NOTICE_DETAIL(uuid),
      payload
    );
    return data;
  },

  send: async (uuid: string): Promise<Notice> => {
    const { data } = await getApiClient().post<Notice>(
      ADMIN_ENDPOINTS.NOTICE_SEND(uuid)
    );
    return data;
  },

  cancel: async (uuid: string): Promise<Notice> => {
    const { data } = await getApiClient().patch<Notice>(
      ADMIN_ENDPOINTS.NOTICE_CANCEL(uuid)
    );
    return data;
  },
};
