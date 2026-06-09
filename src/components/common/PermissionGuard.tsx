'use client'

import { useCurrentUser, ROLE_LABELS } from '@/lib/auth-store'
import { ShieldAlert } from 'lucide-react'
import type { UserRole } from '@/lib/auth-store'

interface Props {
  allowedRoles: UserRole[]
  children: React.ReactNode
}

export function PermissionGuard({ allowedRoles, children }: Props) {
  const user = useCurrentUser()

  if (!user) return null

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="p-8 flex flex-col items-center justify-center text-center min-h-[40vh]">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <ShieldAlert className="w-7 h-7 text-red-500" />
        </div>
        <h2 className="text-base font-semibold text-gray-800 mb-1">アクセス権限がありません</h2>
        <p className="text-sm text-muted-foreground">
          このページは {allowedRoles.map((r) => ROLE_LABELS[r]).join('・')} のみアクセスできます
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          現在のロール: {ROLE_LABELS[user.role]}
        </p>
      </div>
    )
  }

  return <>{children}</>
}
