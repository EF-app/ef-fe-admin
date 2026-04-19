import type { AdminAccount } from '../types/admin';

export const mockAdminAccount: AdminAccount = {
  id: 1,
  uuid: 'admin-0001',
  login_id: 'admin',
  name: '슈퍼 관리자',
  email: 'admin@ef.local',
  phone: '010-0000-0000',
  role: 'SUPER_ADMIN',
  is_active: true,
  deactivated_at: null,
  deactivated_reason: null,
  last_login_at: '2026-04-20T08:32:00.000Z',
  last_login_ip: '127.0.0.1',
  create_time: '2026-01-01T00:00:00.000Z',
  update_time: '2026-04-20T08:32:00.000Z',
};
