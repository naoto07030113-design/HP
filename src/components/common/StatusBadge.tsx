import { cn } from '@/lib/utils'
import type { ReservationStatus } from '@/types/clinic'
import { RESERVATION_STATUS_LABELS } from '@/types/clinic'

const STATUS_STYLES: Record<ReservationStatus, string> = {
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  visited: 'bg-gold-100 text-gold-800 border-gold-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
  no_show: 'bg-red-100 text-red-700 border-red-200',
}

interface Props {
  status: ReservationStatus
  className?: string
}

export function StatusBadge({ status, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
        STATUS_STYLES[status],
        className,
      )}
    >
      {RESERVATION_STATUS_LABELS[status]}
    </span>
  )
}

interface ActiveBadgeProps {
  isActive: boolean
  activeLabel?: string
  inactiveLabel?: string
  className?: string
}

export function ActiveBadge({
  isActive,
  activeLabel = '表示中',
  inactiveLabel = '非表示',
  className,
}: ActiveBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
        isActive
          ? 'bg-green-100 text-green-800 border-green-200'
          : 'bg-gray-100 text-gray-500 border-gray-200',
        className,
      )}
    >
      {isActive ? activeLabel : inactiveLabel}
    </span>
  )
}
