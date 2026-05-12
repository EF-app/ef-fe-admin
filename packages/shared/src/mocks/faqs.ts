/**
 * FAQ mock — DDL `code_faq` INSERT 구문의 항목들 그대로 반영.
 */
import type { FaqItem } from '../types/faq';
import { mockPage } from './pageUtil';

const ts = (iso: string) => iso;

export const mockFaqs: FaqItem[] = [
  // ─── 계정 ─────────────────────────────
  {
    id: 1,
    category: 'ACCOUNT',
    question: '비밀번호를 잊어버렸어요. 어떻게 하나요?',
    answer:
      "로그인 화면 하단의 '비밀번호 찾기' 버튼을 누르신 후, 가입 시 등록한 휴대폰 번호로 본인 인증을 받으시면 비밀번호를 재설정할 수 있어요.",
    display_order: 1,
    is_popular: false,
    is_active: true,
    create_time: ts('2026-04-17T00:00:00.000Z'),
    update_time: ts('2026-04-17T00:00:00.000Z'),
  },
  {
    id: 2,
    category: 'ACCOUNT',
    question: '보안코드는 무엇인가요?',
    answer:
      '보안코드는 앱을 실행할 때마다 입력하는 4자리 숫자입니다. 다른 사람이 내 계정에 접근하지 못하도록 보호해줘요. 설정에서 언제든 변경할 수 있습니다.',
    display_order: 2,
    is_popular: true,
    is_active: true,
    create_time: ts('2026-04-17T00:00:00.000Z'),
    update_time: ts('2026-04-17T00:00:00.000Z'),
  },
  {
    id: 3,
    category: 'ACCOUNT',
    question: '회원 탈퇴는 어떻게 하나요?',
    answer:
      '마이 탭 > 계정 관리 > 회원 탈퇴에서 진행하실 수 있어요. 탈퇴 후 30일 동안 데이터가 분리 보관된 후 영구 삭제됩니다.',
    display_order: 3,
    is_popular: false,
    is_active: true,
    create_time: ts('2026-04-17T00:00:00.000Z'),
    update_time: ts('2026-04-17T00:00:00.000Z'),
  },
  {
    id: 4,
    category: 'ACCOUNT',
    question: '닉네임을 변경할 수 있나요?',
    answer:
      '네, 마이 탭 > 프로필 수정에서 닉네임을 변경할 수 있습니다. 단, 사용 중인 닉네임이나 부적절한 단어는 사용할 수 없어요.',
    display_order: 4,
    is_popular: false,
    is_active: true,
    create_time: ts('2026-04-17T00:00:00.000Z'),
    update_time: ts('2026-04-17T00:00:00.000Z'),
  },
  // ─── 매칭 ─────────────────────────────
  {
    id: 5,
    category: 'MATCHING',
    question: '매칭이 잘 안 떠요. 어떻게 해야 하나요?',
    answer:
      '프로필 사진을 추가하거나, 자기소개를 채우거나, 관심사를 더 많이 등록해보세요. 프로필 완성도가 높을수록 더 많은 매칭 후보에게 노출됩니다.',
    display_order: 1,
    is_popular: true,
    is_active: true,
    create_time: ts('2026-04-17T00:00:00.000Z'),
    update_time: ts('2026-04-17T00:00:00.000Z'),
  },
  {
    id: 6,
    category: 'MATCHING',
    question: '슈퍼 좋아요는 어떻게 다른가요?',
    answer:
      '일반 좋아요와 달리 상대방에게 우선적으로 노출되며, 매칭률이 약 3배 높아져요. 별을 사용해서 보낼 수 있어요.',
    display_order: 2,
    is_popular: false,
    is_active: true,
    create_time: ts('2026-04-17T00:00:00.000Z'),
    update_time: ts('2026-04-17T00:00:00.000Z'),
  },
  {
    id: 7,
    category: 'MATCHING',
    question: '매칭된 사람에게 어떻게 말을 걸어야 할까요?',
    answer:
      '상대방 프로필의 관심사나 자기소개에서 공감 가는 부분을 언급하면 자연스러운 대화를 시작할 수 있어요. 너무 형식적이지 않게, 진심을 담은 첫 메시지를 추천드려요!',
    display_order: 3,
    is_popular: false,
    is_active: true,
    create_time: ts('2026-04-17T00:00:00.000Z'),
    update_time: ts('2026-04-17T00:00:00.000Z'),
  },
  {
    id: 8,
    category: 'MATCHING',
    question: '내가 좋아요를 누른 사람을 다시 볼 수 있나요?',
    answer:
      "마이 탭의 '내가 누른 좋아요'에서 확인할 수 있어요. 상대방이 좋아요를 누르면 '서로 좋아요'에서도 보여요.",
    display_order: 4,
    is_popular: false,
    is_active: true,
    create_time: ts('2026-04-17T00:00:00.000Z'),
    update_time: ts('2026-04-17T00:00:00.000Z'),
  },
  // ─── 메시지 ───────────────────────────
  {
    id: 9,
    category: 'MESSAGE',
    question: '메시지가 도착하지 않아요.',
    answer:
      '휴대폰 설정에서 EF 앱의 알림 권한이 허용되어 있는지 확인해주세요. 그래도 안 되면 앱을 한 번 종료한 후 다시 실행해보세요.',
    display_order: 1,
    is_popular: false,
    is_active: true,
    create_time: ts('2026-04-17T00:00:00.000Z'),
    update_time: ts('2026-04-17T00:00:00.000Z'),
  },
  {
    id: 10,
    category: 'MESSAGE',
    question: '메시지 내용을 신고할 수 있나요?',
    answer:
      "채팅방 우측 상단의 더보기(⋮) 버튼을 누른 후 '신고하기'를 선택하시면 됩니다. 신고 내용은 24시간 이내 검토를 시작합니다.",
    display_order: 2,
    is_popular: false,
    is_active: true,
    create_time: ts('2026-04-17T00:00:00.000Z'),
    update_time: ts('2026-04-17T00:00:00.000Z'),
  },
  // ─── 결제 ─────────────────────────────
  {
    id: 11,
    category: 'PAYMENT',
    question: '프리미엄 멤버십은 어떤 혜택이 있나요?',
    answer:
      '광고 제거, 무제한 답장, 받은 좋아요 전체 보기, 프로필 부스터, 매일 슈퍼 좋아요 5개 등 다양한 혜택이 있어요. 자세한 내용은 마이 탭 > 프리미엄에서 확인하세요.',
    display_order: 1,
    is_popular: true,
    is_active: true,
    create_time: ts('2026-04-17T00:00:00.000Z'),
    update_time: ts('2026-04-17T00:00:00.000Z'),
  },
  {
    id: 12,
    category: 'PAYMENT',
    question: '결제 후 별이 충전되지 않았어요.',
    answer:
      '결제일로부터 24시간이 지나도 별이 충전되지 않으면, 1:1 문의로 결제 영수증과 함께 알려주세요. 빠르게 확인 후 처리해드립니다.',
    display_order: 2,
    is_popular: false,
    is_active: true,
    create_time: ts('2026-04-17T00:00:00.000Z'),
    update_time: ts('2026-04-17T00:00:00.000Z'),
  },
  {
    id: 13,
    category: 'PAYMENT',
    question: '환불은 어떻게 받나요?',
    answer:
      '결제 후 7일 이내, 별이나 구독 기능을 사용하지 않은 경우에 한해 전액 환불이 가능합니다. 마이 탭 > 고객센터 > 환불 신청에서 진행해주세요.',
    display_order: 3,
    is_popular: false,
    is_active: true,
    create_time: ts('2026-04-17T00:00:00.000Z'),
    update_time: ts('2026-04-17T00:00:00.000Z'),
  },
  // ─── 신고/차단 ─────────────────────────
  {
    id: 14,
    category: 'REPORT',
    question: '다른 회원을 차단하면 어떻게 되나요?',
    answer:
      '차단한 회원은 내 프로필을 볼 수 없고, 서로 메시지를 주고받을 수 없게 됩니다. 차단한 사용자 목록은 마이 탭 > 차단한 사용자에서 관리할 수 있어요.',
    display_order: 1,
    is_popular: true,
    is_active: true,
    create_time: ts('2026-04-17T00:00:00.000Z'),
    update_time: ts('2026-04-17T00:00:00.000Z'),
  },
  {
    id: 15,
    category: 'REPORT',
    question: '신고하면 상대방이 알 수 있나요?',
    answer:
      '신고는 익명으로 처리되며, 상대방에게 신고자의 정보가 절대 공개되지 않습니다. 안심하고 신고해주세요.',
    display_order: 2,
    is_popular: false,
    is_active: true,
    create_time: ts('2026-04-17T00:00:00.000Z'),
    update_time: ts('2026-04-17T00:00:00.000Z'),
  },
  {
    id: 16,
    category: 'REPORT',
    question: '허위 신고를 하면 어떻게 되나요?',
    answer:
      '허위 신고가 반복적으로 발견되면 신고자 계정도 제재 대상이 될 수 있어요. 사실 관계를 정확히 확인한 후 신고해주시기 바랍니다.',
    display_order: 3,
    is_popular: false,
    is_active: true,
    create_time: ts('2026-04-17T00:00:00.000Z'),
    update_time: ts('2026-04-17T00:00:00.000Z'),
  },
  // ─── 기타 ─────────────────────────────
  {
    id: 17,
    category: 'ETC',
    question: '앱이 자꾸 멈춰요.',
    answer:
      '앱을 완전히 종료한 후 다시 실행해보세요. 그래도 문제가 지속되면 앱을 최신 버전으로 업데이트하거나 재설치해보시고, 계속되면 1:1 문의로 알려주세요.',
    display_order: 1,
    is_popular: false,
    is_active: true,
    create_time: ts('2026-04-17T00:00:00.000Z'),
    update_time: ts('2026-04-17T00:00:00.000Z'),
  },
  {
    id: 18,
    category: 'ETC',
    question: '다른 사용자가 부적절한 행동을 했을 때 어떻게 하나요?',
    answer:
      '즉시 해당 사용자를 신고하고 차단해주세요. 긴급한 상황이라면 고객센터(help@ef.app)로 직접 연락해주시면 더 빠르게 도와드릴 수 있어요.',
    display_order: 2,
    is_popular: false,
    is_active: true,
    create_time: ts('2026-04-17T00:00:00.000Z'),
    update_time: ts('2026-04-17T00:00:00.000Z'),
  },
];

export const mockFaqsPage = mockPage(mockFaqs);
