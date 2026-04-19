import type { AuditLog } from '../types/admin';
import { mockPage } from './pageUtil';

export const mockAuditLogs: AuditLog[] = [
  {
    id: 8001,
    admin_id: 1,
    admin_name: '슈퍼 관리자',
    action: 'PROCESS_REPORT',
    target_type: 'Report',
    target_id: 5003,
    before_json: { status: 'PENDING' },
    after_json: { status: 'PROCESSED' },
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0',
    create_time: '2026-04-19T10:00:00.000Z',
  },
  {
    id: 8002,
    admin_id: 1,
    admin_name: '슈퍼 관리자',
    action: 'REFUND',
    target_type: 'PaymentLog',
    target_id: 7003,
    before_json: { status: 'SUCCESS' },
    after_json: { status: 'REFUNDED', refund_type: 'FULL' },
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0',
    create_time: '2026-04-19T18:30:00.000Z',
  },
  {
    id: 8003,
    admin_id: 1,
    admin_name: '슈퍼 관리자',
    action: 'SUSPEND_USER',
    target_type: 'User',
    target_id: 103,
    before_json: { status: 'ACTIVE' },
    after_json: { status: 'TEMP_SUSPENDED' },
    ip_address: '127.0.0.1',
    user_agent: 'Mozilla/5.0',
    create_time: '2026-04-15T00:00:00.000Z',
  },
];

export const mockAuditLogsPage = mockPage(mockAuditLogs);
