import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: Props) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center bg-white/60 rounded-2xl border border-dashed border-green-200', className)}>
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 ring-1 ring-green-100 flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-green-600" />
        </div>
      )}
      <p className="text-base font-semibold text-green-950 mb-1">{title}</p>
      {description && <p className="text-sm text-muted-foreground mb-4 max-w-xs">{description}</p>}
      {action && (
        <Button onClick={action.onClick} size="sm">
          {action.label}
        </Button>
      )}
    </div>
  )
}
