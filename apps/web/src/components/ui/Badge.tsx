import {
  USER_STATUS_LABEL,
  REPORT_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  NOTICE_STATUS_LABEL,
  PROFILE_STATUS_LABEL,
  BAL_GAME_STATUS_LABEL,
  BAL_APPLY_STATUS_LABEL,
} from '@ef-fe-admin/shared'
import type {
  UserStatus,
  ReportStatus,
  PaymentStatus,
  NoticeStatus,
  ProfileStatus,
  BalGameStatus,
  BalApplyStatus,
} from '@ef-fe-admin/shared'

type Tone = 'normal' | 'warn' | 'danger' | 'point' | 'neutral'

interface BadgeProps {
  tone?: Tone
  children: React.ReactNode
}

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  const toneClass = {
    normal: 'badge-normal',
    warn: 'badge-warn',
    danger: 'badge-danger',
    point: 'badge-point',
    neutral: 'badge-neutral',
  }[tone]
  return <span className={`badge ${toneClass}`}>{children}</span>
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const tone: Tone =
    status === 'ACTIVE' ? 'normal' :
    status === 'WARNING' ? 'warn' :
    'danger'
  return <Badge tone={tone}>{USER_STATUS_LABEL[status]}</Badge>
}

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const tone: Tone =
    status === 'PENDING' ? 'warn' :
    status === 'PROCESSED' ? 'normal' :
    'neutral'
  return <Badge tone={tone}>{REPORT_STATUS_LABEL[status]}</Badge>
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const tone: Tone =
    status === 'SUCCESS' ? 'normal' :
    status === 'PENDING' ? 'point' :
    status === 'REFUNDED' ? 'warn' :
    'danger'
  return <Badge tone={tone}>{PAYMENT_STATUS_LABEL[status]}</Badge>
}

export function NoticeStatusBadge({ status }: { status: NoticeStatus }) {
  const tone: Tone =
    status === 'SENT' ? 'normal' :
    status === 'SCHEDULED' ? 'point' :
    status === 'CANCELED' ? 'danger' :
    'neutral'
  return <Badge tone={tone}>{NOTICE_STATUS_LABEL[status]}</Badge>
}

export function ProfileStatusBadge({ status }: { status: ProfileStatus }) {
  const tone: Tone =
    status === 'APPROVED' ? 'normal' :
    status === 'PENDING' ? 'warn' :
    'danger'
  return <Badge tone={tone}>{PROFILE_STATUS_LABEL[status]}</Badge>
}

export function BalGameStatusBadge({ status }: { status: BalGameStatus }) {
  const tone: Tone =
    status === 'PUBLISHED' ? 'normal' :
    status === 'SCHEDULED' ? 'point' :
    status === 'HIDDEN' ? 'danger' :
    'neutral'
  return <Badge tone={tone}>{BAL_GAME_STATUS_LABEL[status]}</Badge>
}

export function BalApplyStatusBadge({ status }: { status: BalApplyStatus }) {
  const tone: Tone =
    status === 'APPROVED' ? 'normal' :
    status === 'PENDING' ? 'warn' :
    'danger'
  return <Badge tone={tone}>{BAL_APPLY_STATUS_LABEL[status]}</Badge>
}
