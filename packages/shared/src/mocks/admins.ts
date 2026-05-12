/**
 * 관리자 계정 리스트 (관리자 계정 관리 페이지용)
 * - 단일 mockAdminAccount 는 ./admin.ts 에서 export
 */
import type { AdminAccount } from '../types/admin';
import { mockAdminAccount } from './admin';
import { mockPage } from './pageUtil';

export const mockAdmins: AdminAccount[] = [
  mockAdminAccount,
  {
    id: 2,
    uuid: 'admin-2',
    login_id: 'kim.ops',
    name: '운영 김',
    email: 'kim@ef.test',
    phone: '010-1234-5678',
    role: 'ADMIN',
    is_active: true,
    deactivated_at: null,
    deactivated_reason: null,
    last_login_at: '2026-05-12T07:30:00.000Z',
    last_login_ip: '203.0.113.11',
    create_time: '2026-01-15T00:00:00.000Z',
    update_time: '2026-05-12T07:30:00.000Z',
  },
  {
    id: 3,
    uuid: 'admin-3',
    login_id: 'lee.mod',
    name: '모더 이',
    email: 'lee@ef.test',
    phone: '010-2233-4455',
    role: 'MODERATOR',
    is_active: true,
    deactivated_at: null,
    deactivated_reason: null,
    last_login_at: '2026-05-11T15:00:00.000Z',
    last_login_ip: '203.0.113.12',
    create_time: '2026-02-10T00:00:00.000Z',
    update_time: '2026-05-11T15:00:00.000Z',
  },
  {
    id: 4,
    uuid: 'admin-4',
    login_id: 'park.cs',
    name: 'CS 박',
    email: 'park@ef.test',
    phone: '010-9988-7766',
    role: 'CS',
    is_active: true,
    deactivated_at: null,
    deactivated_reason: null,
    last_login_at: '2026-05-12T06:45:00.000Z',
    last_login_ip: '203.0.113.13',
    create_time: '2026-03-01T00:00:00.000Z',
    update_time: '2026-05-12T06:45:00.000Z',
  },
  {
    id: 5,
    uuid: 'admin-5',
    login_id: 'choi.fin',
    name: '재무 최',
    email: 'choi@ef.test',
    phone: '010-4444-3333',
    role: 'FINANCE',
    is_active: false,
    deactivated_at: '2026-04-30T00:00:00.000Z',
    deactivated_reason: '퇴사',
    last_login_at: '2026-04-29T18:00:00.000Z',
    last_login_ip: '203.0.113.14',
    create_time: '2026-01-20T00:00:00.000Z',
    update_time: '2026-04-30T00:00:00.000Z',
  },
];

export const mockAdminsPage = mockPage(mockAdmins);
