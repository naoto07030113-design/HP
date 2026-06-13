'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format, addDays } from 'date-fns'
import { BellRing, X } from 'lucide-react'
import { useScheduledPaymentStore } from '@/lib/scheduled-payment-store'
import { useCurrentUser, PERMISSIONS } from '@/lib/auth-store'
import { cn } from '@/lib/utils'

// 振込期日の前日・当日・期日超過の支払予定を管理画面上部に通知する
export function PaymentDueNotice() {
  const payments = useScheduledPaymentStore()
  const currentUser = useCurrentUser()
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null
  if (!currentUser || !PERMISSIONS.canViewAccounting(currentUser.role)) return null

  const today = format(new Date(), 'yyyy-MM-dd')
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')

  const due = payments
    .filter((p) => p.status === 'pending' && p.due_date <= tomorrow)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))

  if (due.length === 0) return null

  const overdue = due.filter((p) => p.due_date < today)
  const dueToday = due.filter((p) => p.due_date === today)
  const dueTomorrow = due.filter((p) => p.due_date === tomorrow)

  const hasUrgent = overdue.length > 0 || dueToday.length > 0

  function label(dueDate: string): string {
    if (dueDate < today) return '期日超過'
    if (dueDate === today) return '本日期日'
    return '明日期日'
  }

  return (
    <div className={cn(
      'flex items-start gap-3 px-4 py-2.5 border-b text-sm',
      hasUrgent ? 'bg-red-50 border-red-200 text-red-900' : 'bg-amber-50 border-amber-200 text-amber-900',
    )}>
      <BellRing className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold">
          振込期日が近い支払いが{due.length}件あります
          {overdue.length > 0 && `（うち期日超過 ${overdue.length}件）`}
        </p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs">
          {[...overdue, ...dueToday, ...dueTomorrow].slice(0, 5).map((p) => (
            <span key={p.id} className="inline-flex items-center gap-1.5">
              <span className={cn(
                'px-1.5 py-0.5 rounded font-semibold',
                p.due_date <= today ? 'bg-red-600 text-white' : 'bg-amber-500 text-white',
              )}>
                {label(p.due_date)}
              </span>
              <span>{p.due_date}</span>
              <span className="font-medium">{p.vendor || p.description}</span>
              <span className="font-semibold">{p.amount.toLocaleString()}円</span>
            </span>
          ))}
          {due.length > 5 && <span className="opacity-70">ほか{due.length - 5}件</span>}
        </div>
        <Link href="/admin/cashbook" className="inline-block text-xs underline mt-1 opacity-80 hover:opacity-100">
          経費・出納帳で確認する
        </Link>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 rounded hover:bg-black/10 transition-colors flex-shrink-0"
        aria-label="閉じる"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
