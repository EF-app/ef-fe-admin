/**
 * FAQ — DDL `code_faq` 정합.
 *
 * BE 컬럼: id, category, question, answer, display_order, is_popular, is_active,
 *          create_time, update_time
 */

export const FAQ_CATEGORY = {
  ACCOUNT: 'ACCOUNT',
  MATCHING: 'MATCHING',
  MESSAGE: 'MESSAGE',
  PAYMENT: 'PAYMENT',
  REPORT: 'REPORT',
  ETC: 'ETC',
} as const;
export type FaqCategory = (typeof FAQ_CATEGORY)[keyof typeof FAQ_CATEGORY];

export interface FaqItem {
  id: number;
  category: FaqCategory;
  question: string;
  answer: string;
  display_order: number;
  is_popular: boolean;
  is_active: boolean;
  create_time: string;
  update_time: string;
}

export interface FaqListParams {
  category?: FaqCategory;
  is_active?: boolean;
  is_popular?: boolean;
  page?: number;
  size?: number;
}

export interface FaqUpsertRequest {
  category: FaqCategory;
  question: string;
  answer: string;
  display_order?: number;
  is_popular?: boolean;
  is_active?: boolean;
}
