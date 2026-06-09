'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { format, addDays, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bell, Copy, Check, Phone, Calendar } from 'lucide-react'
import { useClinicStore } from '@/lib/clinic-store'
import { useSettingsStore } from '@/lib/settings-store'
import { StatusBadge } from '@/components/common/StatusBadge'
import { cn } from '@/lib/utils'

const DEFAULT_TEMPLATE = `{{date}}のご予約のご確認です。
{{time}}より{{clinic}}でのご予約をお受けしております。
担当: {{staff}} / メニュー: {{menu}}
ご不明な点はお気軽にご連絡ください。`

function getLocalStorageKey(reservationId: string): string {
  return `reminder_sent_${reservationId}`
}

function buildReminderText(
  template: string,
  vars: { date: string; time: string; clinic: string; staff: string; menu: string },
): string {
  return template
    .replace(/\{\{date\}\}/g, vars.date)
    .replace(/\{\{time\}\}/g, vars.time)
    .replace(/\{\{clinic\}\}/g, vars.clinic)
    .replace(/\{\{staff\}\}/g, vars.staff)
    .replace(/\{\{menu\}\}/g, vars.menu)
}

export default function RemindersPage() {
  const store = useClinicStore()
  const settings = useSettingsStore()

  // Default selected date: tomorrow
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    format(addDays(new Date(), 1), 'yyyy-MM-dd'),
  )
  const [filterClinic, setFilterClinic] = useState('all')

  // Map of reservationId -> reminder sent state (backed by localStorage)
  const [reminderSent, setReminderSent] = useState<Record<string, boolean>>({})

  // Load reminder states from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    const loaded: Record<string, boolean> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('reminder_sent_')) {
        const id = key.replace('reminder_sent_', '')
        loaded[id] = localStorage.getItem(key) === 'true'
      }
    }
    setReminderSent(loaded)
  }, [])

  const toggleReminder = useCallback((reservationId: string, value: boolean) => {
    setReminderSent((prev) => ({ ...prev, [reservationId]: value }))
    if (typeof window !== 'undefined') {
      localStorage.setItem(getLocalStorageKey(reservationId), String(value))
    }
  }, [])

  const filteredReservations = useMemo(() => {
    return store.reservations
      .filter((r) => {
        if (!r.start_at.startsWith(selectedDate)) return false
        if (filterClinic !== 'all' && r.clinic_id !== filterClinic) return false
        return true
      })
      .sort((a, b) => (a.start_at < b.start_at ? -1 : 1))
  }, [store.reservations, selectedDate, filterClinic])

  const reminderSentCount = filteredReservations.filter((r) => reminderSent[r.id]).length

  const template =
    settings.reminderTemplate && settings.reminderTemplate.trim()
      ? settings.reminderTemplate
      : DEFAULT_TEMPLATE

  async function copyPhone(phone: string) {
    try {
      await navigator.clipboard.writeText(phone)
      toast.success('電話番号をコピーしました')
    } catch {
      toast.error('コピーに失敗しました')
    }
  }

  async function copyReminderText(reservationId: string) {
    const r = filteredReservations.find((res) => res.id === reservationId)
    if (!r) return

    const clinic = store.clinics.find((c) => c.id === r.clinic_id)
    const menu = store.menus.find((m) => m.id === r.menu_id)
    const staff = store.staff.find((s) => s.id === r.staff_id)

    const dateLabel = format(parseISO(r.start_at), 'M月d日（E）', { locale: ja })
    const timeLabel = format(parseISO(r.start_at), 'HH:mm')

    const text = buildReminderText(template, {
      date: dateLabel,
      time: timeLabel,
      clinic: clinic?.name ?? '-',
      staff: staff?.name ?? '-',
      menu: menu?.name ?? '-',
    })

    try {
      await navigator.clipboard.writeText(text)
      toast.success('メール文をコピーしました')
    } catch {
      toast.error('コピーに失敗しました')
    }
  }

  function setDateOffset(offsetDays: number) {
    setSelectedDate(format(addDays(new Date(), offsetDays), 'yyyy-MM-dd'))
  }

  const selectedDateLabel = (() => {
    try {
      return format(parseISO(selectedDate), 'M月d日（E）', { locale: ja })
    } catch {
      return selectedDate
    }
  })()

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Bell className="w-5 h-5 text-green-700" />
            リマインド送信
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">予約リマインド対象の患者一覧</p>
        </div>
      </div>

      {/* Date picker + quick buttons */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              対象日
            </Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-9 w-40 text-sm"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs border-green-300 text-green-800 hover:bg-green-50"
              onClick={() => setDateOffset(0)}
            >
              今日
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs border-green-300 text-green-800 hover:bg-green-50"
              onClick={() => setDateOffset(1)}
            >
              明日
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs border-green-300 text-green-800 hover:bg-green-50"
              onClick={() => setDateOffset(2)}
            >
              2日後
            </Button>
          </div>
          <Select value={filterClinic} onValueChange={setFilterClinic}>
            <SelectTrigger className="h-9 w-44 text-sm">
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

        {/* Summary */}
        <div className="flex items-center gap-3 pt-1 border-t border-green-50">
          <span className="text-sm font-semibold text-green-900">{selectedDateLabel}</span>
          <span className="text-sm text-muted-foreground">
            {filteredReservations.length}件の予約
            <span className="mx-1.5 text-green-300">|</span>
            <span className="text-green-700 font-medium">
              リマインド済み: {reminderSentCount}件
            </span>
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-green-100 bg-green-50">
                <th className="text-left px-4 py-3 text-green-900 font-semibold whitespace-nowrap">時間</th>
                <th className="text-left px-4 py-3 text-green-900 font-semibold">患者名 / 電話番号</th>
                <th className="text-left px-4 py-3 text-green-900 font-semibold hidden md:table-cell">メニュー</th>
                <th className="text-left px-4 py-3 text-green-900 font-semibold hidden sm:table-cell">担当</th>
                <th className="text-left px-4 py-3 text-green-900 font-semibold">状態</th>
                <th className="text-center px-4 py-3 text-green-900 font-semibold whitespace-nowrap">リマインド済</th>
                <th className="px-4 py-3 text-green-900 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-50">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Bell className="w-8 h-8 text-green-200" />
                      <p className="text-sm">{selectedDateLabel}の予約はありません</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReservations.map((r) => {
                  const staffMember = store.staff.find((s) => s.id === r.staff_id)
                  const menu = store.menus.find((m) => m.id === r.menu_id)
                  const isSent = reminderSent[r.id] ?? false

                  return (
                    <tr
                      key={r.id}
                      className={cn(
                        'hover:bg-green-50/30 transition-colors',
                        isSent && 'bg-green-50/50',
                      )}
                    >
                      {/* Time */}
                      <td className="px-4 py-3 font-mono font-medium text-green-900 whitespace-nowrap">
                        {format(parseISO(r.start_at), 'HH:mm')}
                      </td>

                      {/* Patient name + phone */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-green-900">{r.patient_name}</div>
                        {r.patient_phone ? (
                          <button
                            type="button"
                            onClick={() => copyPhone(r.patient_phone!)}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-green-700 transition-colors mt-0.5 group"
                            title="クリックでコピー"
                          >
                            <Phone className="w-3 h-3 group-hover:text-green-600" />
                            {r.patient_phone}
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>

                      {/* Menu */}
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {menu?.name ?? '-'}
                      </td>

                      {/* Staff */}
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {staffMember?.name ?? '-'}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={r.status} />
                      </td>

                      {/* Reminder toggle */}
                      <td className="px-4 py-3 text-center">
                        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isSent}
                            onChange={(e) => toggleReminder(r.id, e.target.checked)}
                            className={cn(
                              'w-4 h-4 rounded border-2 cursor-pointer appearance-none transition-colors',
                              isSent
                                ? 'bg-green-600 border-green-600'
                                : 'bg-white border-gray-300 hover:border-green-400',
                            )}
                          />
                          {isSent && (
                            <Check className="w-3 h-3 text-white absolute pointer-events-none" />
                          )}
                          <span className={cn('text-xs', isSent ? 'text-green-700 font-medium' : 'text-muted-foreground')}>
                            {isSent ? '済' : '未'}
                          </span>
                        </label>
                      </td>

                      {/* Copy reminder text */}
                      <td className="px-4 py-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1 border-green-300 text-green-700 hover:bg-green-50 whitespace-nowrap"
                          onClick={() => copyReminderText(r.id)}
                        >
                          <Copy className="w-3 h-3" />
                          メール文をコピー
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredReservations.length > 0 && (
          <div className="px-4 py-2 border-t border-green-50 text-xs text-muted-foreground bg-green-50/30 flex items-center justify-between">
            <span>{filteredReservations.length}件表示</span>
            {reminderSentCount > 0 && (
              <span className="text-green-700 font-medium">
                {reminderSentCount}/{filteredReservations.length}件リマインド完了
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
