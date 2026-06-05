import { STATUS_COLORS } from '../../lib/utils.js'

export default function StatusBadge({ status, size = 'sm' }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS['未接触']
  const sizeClass = size === 'xs' ? 'text-xs px-1.5 py-0.5' : 'text-xs px-2.5 py-1'

  return (
    <span className={`inline-flex items-center gap-1 rounded border font-medium ${colors.bg} ${colors.text} ${colors.border} ${sizeClass}`}>
      {status}
    </span>
  )
}
