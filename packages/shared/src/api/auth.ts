import { getApiClient } from './client';
import { ADMIN_ENDPOINTS } from './endpoints';
import type { AdminAccount, LoginRequest, LoginResponse } from '../types/admin';

export const authApi = {
  login: async (payload: LoginRequest): Promise<LoginResponse> => {
    const { data } = await getApiClient().post<LoginResponse>(
      ADMIN_ENDPOINTS.LOGIN,
      payload
    );
    return data;
  },

  logout: async (): Promise<void> => {
    await getApiClient().post(ADMIN_ENDPOINTS.LOGOUT);
  },

  me: async (): Promise<AdminAccount> => {
    const { data } = await getApiClient().get<AdminAccount>(ADMIN_ENDPOINTS.ME);
    return data;
  },
};
