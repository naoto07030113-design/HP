'use client'

import { Fragment, useState, useEffect, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useClinicStore, reservationsStore } from '@/lib/clinic-store'
import { StatusBadge } from '@/components/common/StatusBadge'

export default function TodayPage() {
  const store = useClinicStore()
  const [filterClinic, setFilterClinic] = useState('all')
  const [now, setNow] = useState(() => new Date())

  // Auto-refresh every 60 seconds to keep current time indicator up to date
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const todayStr = format(now, 'yyyy-MM-dd')

  const todayReservations = useMemo(() => {
    return store.reservations
      .filter((r) => {
        if (!r.start_at.startsWith(todayStr)) return false
        if (filterClinic !== 'all' && r.clinic_id !== filterClinic) return false
        return true
      })
      .sort((a, b) => (a.start_at < b.start_at ? -1 : 1))
  }, [store.reservations, todayStr, filterClinic])

  // Summary counts
  const totalCount = todayReservations.length
  const visitedCount = todayReservations.filter((r) => r.status === 'visited').length
  const confirmedCount = todayReservations.filter((r) => r.status === 'confirmed').length
  const cancelledCount = todayReservations.filter(
    (r) => r.status === 'cancelled' || r.status === 'no_show',
  ).length

  // Current time as minutes since midnight
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  function toMinutes(isoStr: string): number {
    const d = parseISO(isoStr)
    return d.getHours() * 60 + d.getMinutes()
  }

  async function handleArrive(id: string) {
    await reservationsStore.update(id, { status: 'visited' })
  }

  async function handleCancel(id: string) {
    await reservationsStore.update(id, { status: 'cancelled' })
  }

  // Find insertion index for the current-time indicator
  // Insert after the last reservation whose start_at is strictly before now
  let currentTimeInsertIndex = 0
  for (let i = 0; i < todayReservations.length; i++) {
    if (toMinutes(todayReservations[i].start_at) < nowMinutes) {
      currentTimeInsertIndex = i + 1
    }
  }
  // Only show the line if it would actually fall between rows (not at top or bottom)
  const showTimeLine =
    todayReservations.length > 0 &&
    currentTimeInsertIndex > 0 &&
    currentTimeInsertIndex < todayReservations.length

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">当日受付</h1>
          <p className="text-lg font-semibold text-green-800 mt-0.5">
            {format(now, 'M月d日（E）', { locale: ja })}
          </p>
        </div>
        <Select value={filterClinic} onValueChange={setFilterClinic}>
          <SelectTrigger className="h-8 w-44 text-sm">
            <SelectValue placeholder="院を選択" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての院</SelectItem>
            {store.clinics.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-border shadow-sm px-4 py-3">
          <p className="text-xs text-muted-foreground">本日の予約数</p>
          <p className="text-2xl font-bold text-green-900 mt-1">{totalCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 shadow-sm px-4 py-3">
          <p className="text-xs text-muted-foreground">来院済</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{visitedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-blue-200 shadow-sm px-4 py-3">
          <p className="text-xs text-muted-foreground">未来院</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{confirmedCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
          <p className="text-xs text-muted-foreground">キャンセル</p>
          <p className="text-2xl font-bold text-gray-500 mt-1">{cancelledCount}</p>
        </div>
      </div>

      {/* Main table */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-green-100 bg-green-50">
                <th className="text-left px-4 py-3 text-green-900 font-semibold">時間</th>
                <th className="text-left px-4 py-3 text-green-900 font-semibold">患者名</th>
                <th className="text-left px-4 py-3 text-green-900 font-semibold hidden md:table-cell">
                  メニュー
                </th>
                <th className="text-left px-4 py-3 text-green-900 font-semibold hidden sm:table-cell">
                  担当
                </th>
                <th className="text-left px-4 py-3 text-green-900 font-semibold">状態</th>
                <th className="px-4 py-3 text-green-900 font-semibold">アクション</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-50">
              {todayReservations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-muted-foreground">
                    本日の予約はありません
                  </td>
                </tr>
              ) : (
                todayReservations.map((r, index) => {
                  const staffMember = store.staff.find((s) => s.id === r.staff_id)
                  const menu = store.menus.find((m) => m.id === r.menu_id)
                  const isCurrentTimeRow = showTimeLine && index === currentTimeInsertIndex

                  return (
                    <Fragment key={r.id}>
                      {isCurrentTimeRow && (
                        <tr className="pointer-events-none">
                          <td colSpan={6} className="p-0">
                            <div className="flex items-center gap-2 px-4 py-0.5">
                              <span className="text-[10px] font-semibold text-red-500 whitespace-nowrap">
                                現在時刻
                              </span>
                              <div className="flex-1 border-t-2 border-red-400" />
                            </div>
                          </td>
                        </tr>
                      )}
                      <tr
                        className="hover:bg-green-50/30 transition-colors"
                      >
                        <td className="px-4 py-3 font-mono font-medium text-green-900">
                          {format(parseISO(r.start_at), 'HH:mm')}
                        </td>
                        <td className="px-4 py-3 font-medium text-green-900">
                          {r.patient_name}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          {menu?.name ?? '-'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {staffMember?.name ?? '-'}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-4 py-3">
                          {r.status === 'confirmed' && (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                className="h-7 text-xs bg-green-700 hover:bg-green-800 text-white"
                                onClick={() => handleArrive(r.id)}
                              >
                                来院
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-muted-foreground"
                                onClick={() => handleCancel(r.id)}
                              >
                                キャンセル
                              </Button>
                            </div>
                          )}
                          {r.status === 'visited' && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs border-green-300 text-green-700 hover:bg-green-50"
                                asChild
                              >
                                <a href="/admin/accounting">会計へ</a>
                              </Button>
                              <span className="text-xs text-green-600 font-medium">来院済</span>
                            </div>
                          )}
                          {(r.status === 'cancelled' || r.status === 'no_show') && (
                            <span className="text-xs text-muted-foreground">キャンセル済</span>
                          )}
                        </td>
                      </tr>
                    </Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        {todayReservations.length > 0 && (
          <div className="px-4 py-2 border-t border-green-50 text-xs text-muted-foreground bg-green-50/30">
            {todayReservations.length}件表示
          </div>
        )}
      </div>
    </div>
  )
}
