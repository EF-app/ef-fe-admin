import type { User } from '../types/user';
import { mockPage } from './pageUtil';

export const mockProfileReviews: User[] = [
  {
    id: 201,
    uuid: 'u-201',
    login_id: 'kakao_201',
    phone: '010-9999-0001',
    nickname: '신규유저A',
    nickname_changed_at: null,
    age: 25,
    job: '학생',
    is_withdraw: false,
    withdraw_date: null,
    status: 'ACTIVE',
    area: '서울특별시 강남구',
    last_login_time: '2026-04-20T08:00:00.000Z',
    verified_birth_date: '2000-05-01',
    identity_verified_at: '2026-04-19T00:00:00.000Z',
    create_time: '2026-04-19T00:00:00.000Z',
    update_time: '2026-04-20T08:00:00.000Z',
  },
  {
    id: 202,
    uuid: 'u-202',
    login_id: 'apple_202',
    phone: '010-9999-0002',
    nickname: '신규유저B',
    nickname_changed_at: null,
    age: 28,
    job: '회사원',
    is_withdraw: false,
    withdraw_date: null,
    status: 'ACTIVE',
    area: '부산광역시 해운대구',
    last_login_time: '2026-04-20T07:45:00.000Z',
    verified_birth_date: '1997-11-11',
    identity_verified_at: '2026-04-19T12:00:00.000Z',
    create_time: '2026-04-19T12:00:00.000Z',
    update_time: '2026-04-20T07:45:00.000Z',
  },
];

export const mockProfileReviewsPage = mockPage(mockProfileReviews);
