import { getApiClient } from './client';
import { ADMIN_ENDPOINTS } from './endpoints';
import type { PageResponse } from '../types/common';
import type {
  User,
  UserDetail,
  UserListParams,
  UserSuspension,
  SuspendUserRequest,
} from '../types/user';

export const usersApi = {
  list: async (params?: UserListParams): Promise<PageResponse<User>> => {
    const { data } = await getApiClient().get<PageResponse<User>>(
      ADMIN_ENDPOINTS.USERS,
      { params }
    );
    return data;
  },

  detail: async (uuid: string | number): Promise<UserDetail> => {
    const { data } = await getApiClient().get<UserDetail>(
      ADMIN_ENDPOINTS.USER_DETAIL(uuid)
    );
    return data;
  },

  suspend: async (
    uuid: string | number,
    payload: SuspendUserRequest
  ): Promise<UserSuspension> => {
    const { data } = await getApiClient().post<UserSuspension>(
      ADMIN_ENDPOINTS.USER_SUSPEND(uuid),
      payload
    );
    return data;
  },

  liftSuspension: async (
    uuid: string | number,
    suspensionId: number,
    lifted_reason: string
  ): Promise<UserSuspension> => {
    const { data } = await getApiClient().patch<UserSuspension>(
      ADMIN_ENDPOINTS.USER_SUSPENSION_LIFT(uuid, suspensionId),
      { lifted_reason }
    );
    return data;
  },

  suspensions: async (uuid: string | number): Promise<UserSuspension[]> => {
    const { data } = await getApiClient().get<UserSuspension[]>(
      ADMIN_ENDPOINTS.USER_SUSPENSIONS(uuid)
    );
    return data;
  },
};
