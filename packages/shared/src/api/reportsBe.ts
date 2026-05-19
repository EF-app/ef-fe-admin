/**
 * 백엔드 어드민 신고 API 클라이언트 (BE 정합 — uuid 미사용, 모두 id 기반).
 *
 * - 응답은 RspTemplate<T> = { code, message, data } 로 감싸져 있어 data 만 꺼내 반환.
 * - Spring Page 응답을 FE 의 PageResponse 모양으로 변환.
 * - camelCase 필드를 FE 의 snake_case Report / ReportGroup 으로 변환.
 *
 * 인증 토큰은 client.ts 인터셉터가 Authorization 헤더에 자동 부착.
 *
 * 한계 (BE 미구현):
 *   - target_type 필터 — BE 가 status 만 받음. BE 모드에서는 target_type 필터칩 무력화.
 *   - detail 응답에는 enrich 필드 (target_user_*, bal_game_id, target_preview) 없음.
 *     모두 옵션이라 표시 단계에서 자동 폴백.
 */
import { getApiClient } from './client';
import type { PageResponse } from '../types/common';
import type { Report, ReportGroup, ReportListParams, ReportGroupListParams } from '../types/report';
import type { ReportTargetType, ReportStatus } from '../constants/enums';

interface RspTemplate<T> {
  code: number;
  message: string;
  data: T;
}

/** Spring Data Page 응답 모양 (필요한 필드만). */
interface PageBe<T> {
  content: T[];
  number: number;       // current page (0-based)
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

/** BE AdminReportSummaryRspDto (그룹화 응답에서 enrich 채워짐). */
interface AdminReportSummaryBeDto {
  id: number;
  targetType: ReportTargetType;
  targetId: number;
  status: ReportStatus;
  reporterId: number | null;
  createTime: string;
  // enrich (옵션)
  reporterNickname?: string | null;
  targetUserId?: number | null;
  targetUserNickname?: string | null;
  balGameId?: number | null;
  targetPreview?: string | null;
}

/** BE AdminReportGroupRspDto. */
interface AdminReportGroupBeDto {
  targetType: ReportTargetType;
  targetId: number;
  totalCount: number;
  pendingCount: number;
  firstReportedAt: string;
  lastReportedAt: string;
  reports: AdminReportSummaryBeDto[];
}

/** BE AdminReportDetailRspDto. */
interface AdminReportDetailBeDto {
  id: number;
  targetType: ReportTargetType;
  targetId: number;
  reporterId: number | null;
  reason: string | null;
  status: ReportStatus;
  adminProcessedById: number | null;
  adminProcessedByName: string | null;
  adminProcessedAt: string | null;
  suspensionId: number | null;
  effectiveSuspensionId: number | null;
  parentReportId: number | null;
  createTime: string;
}

const BASE = '/v1/admin/reports';

// ─────────────────── 변환 헬퍼 ───────────────────

function toReportFromSummary(be: AdminReportSummaryBeDto): Report {
  return {
    id: be.id,
    target_type: be.targetType,
    target_id: be.targetId,
    reporter_id: be.reporterId,
    reporter_nickname: be.reporterNickname ?? undefined,
    reason: null,             // summary 에는 reason 없음 (detail 에만 있음)
    status: be.status,
    admin_processed_by: null, // summary 에는 없음
    admin_processed_by_name: undefined,
    admin_processed_at: null,
    suspension_id: null,
    effective_suspension_id: null,
    parent_report_id: null,
    target_preview: be.targetPreview ?? undefined,
    target_user_id: be.targetUserId ?? undefined,
    target_user_nickname: be.targetUserNickname ?? undefined,
    bal_game_id: be.balGameId ?? undefined,
    create_time: be.createTime,
    update_time: be.createTime,
  };
}

function toReportFromDetail(be: AdminReportDetailBeDto): Report {
  return {
    id: be.id,
    target_type: be.targetType,
    target_id: be.targetId,
    reporter_id: be.reporterId,
    reason: be.reason,
    status: be.status,
    admin_processed_by: be.adminProcessedById,
    admin_processed_by_name: be.adminProcessedByName ?? undefined,
    admin_processed_at: be.adminProcessedAt,
    suspension_id: be.suspensionId,
    effective_suspension_id: be.effectiveSuspensionId,
    parent_report_id: be.parentReportId,
    // detail 에는 enrich 필드 없음
    create_time: be.createTime,
    update_time: be.createTime,
  };
}

function toReportGroup(be: AdminReportGroupBeDto): ReportGroup {
  const reports = be.reports.map(toReportFromSummary);
  const first = reports[0];
  return {
    target_type: be.targetType,
    target_id: be.targetId,
    total_count: be.totalCount,
    pending_count: be.pendingCount,
    first_reported_at: be.firstReportedAt,
    last_reported_at: be.lastReportedAt,
    reports,
    target_user_id: first?.target_user_id,
    target_user_nickname: first?.target_user_nickname,
    target_preview: first?.target_preview,
  };
}

function toPageResponse<TBe, TFe>(
  page: PageBe<TBe>,
  mapper: (be: TBe) => TFe
): PageResponse<TFe> {
  return {
    content: page.content.map(mapper),
    page: page.number,
    size: page.size,
    totalElements: page.totalElements,
    totalPages: page.totalPages,
    hasNext: !page.last,
  };
}

// ─────────────────── API ───────────────────

export const reportsBeApi = {
  /**
   * 플랫 신고 목록 — 그룹화 안 함. 거의 안 쓰지만 API 호환 위해 유지.
   * BE: GET /v1/admin/reports?status=&page=&size=
   * 주의: target_type 필터 미지원 (BE 가 status 만 받음).
   */
  list: async (params?: ReportListParams): Promise<PageResponse<Report>> => {
    const { data } = await getApiClient().get<
      RspTemplate<PageBe<AdminReportSummaryBeDto>>
    >(BASE, {
      params: {
        status: params?.status,
        page: params?.page,
        size: params?.size,
      },
    });
    return toPageResponse(data.data, toReportFromSummary);
  },

  /**
   * 그룹화된 신고 목록 — (target_type, target_id) 단위 묶음.
   * BE: GET /v1/admin/reports/grouped?status=&page=&size=
   * 주의: target_type 필터 미지원.
   */
  listGrouped: async (
    params?: ReportGroupListParams
  ): Promise<PageResponse<ReportGroup>> => {
    const { data } = await getApiClient().get<
      RspTemplate<PageBe<AdminReportGroupBeDto>>
    >(`${BASE}/grouped`, {
      params: {
        status: params?.status,
        page: params?.page,
        size: params?.size,
      },
    });
    return toPageResponse(data.data, toReportGroup);
  },

  /** BE: GET /v1/admin/reports/{id} */
  detail: async (id: number): Promise<Report> => {
    const { data } = await getApiClient().get<RspTemplate<AdminReportDetailBeDto>>(
      `${BASE}/${id}`
    );
    return toReportFromDetail(data.data);
  },
};
