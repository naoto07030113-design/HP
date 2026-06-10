'use client'

import { useState } from 'react'
import { format, parseISO, isBefore, startOfToday } from 'date-fns'
import { ja } from 'date-fns/locale'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, CalendarX } from 'lucide-react'
import { useClinicStore, closedDaysStore } from '@/lib/clinic-store'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { cn } from '@/lib/utils'

export default function SchedulePage() {
  const store = useClinicStore()
  const [filterClinic, setFilterClinic] = useState(store.clinics[0]?.id ?? 'all')
  const [newDate, setNewDate] = useState('')
  const [newReason, setNewReason] = useState('')
  const [adding, setAdding] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const today = startOfToday()

  const upcomingDays = store.closedDays
    .filter((d) => filterClinic === 'all' || d.clinic_id === filterClinic)
    .filter((d) => !isBefore(parseISO(d.closed_date), today))
    .sort((a, b) => a.closed_date < b.closed_date ? -1 : 1)

  const pastDays = store.closedDays
    .filter((d) => filterClinic === 'all' || d.clinic_id === filterClinic)
    .filter((d) => isBefore(parseISO(d.closed_date), today))
    .sort((a, b) => a.closed_date < b.closed_date ? 1 : -1)
    .slice(0, 5)

  async function handleAdd() {
    if (!newDate || filterClinic === 'all') return
    try {
      setAdding(true)
      await closedDaysStore.create({
        clinic_id: filterClinic,
        closed_date: newDate,
        reason: newReason.trim() || null,
      })
      toast.success('休診日を追加しました')
      setNewDate('')
      setNewReason('')
    } catch {
      toast.error('追加に失敗しました')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">休診日管理</h1>
          <p className="text-sm text-muted-foreground mt-0.5">院ごとの休診日・臨時休診を設定します</p>
        </div>
      </div>

      <Select value={filterClinic} onValueChange={setFilterClinic}>
        <SelectTrigger className="w-52 h-8 text-sm">
          <SelectValue placeholder="院を選択" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべての院</SelectItem>
          {store.clinics.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {filterClinic !== 'all' && (
        <div className="bg-white rounded-xl border border-border shadow-sm p-4">
          <h2 className="text-sm font-semibold text-green-900 mb-3">休診日を追加</h2>
          <div className="flex flex-wrap gap-2">
            <Input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="h-8 w-40 text-sm"
            />
            <Input
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder="理由（例: 年末年始、研修）"
              className="h-8 flex-1 min-w-[160px] text-sm"
            />
            <Button size="sm" className="h-8 gap-1" onClick={handleAdd} disabled={!newDate || adding}>
              <Plus className="w-4 h-4" />
              追加
            </Button>
          </div>
        </div>
      )}

      {upcomingDays.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title="予定されている休診日はありません"
          description={filterClinic === 'all' ? '院を選択して休診日を追加してください' : '上のフォームから休診日を追加してください'}
        />
      ) : (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-4 py-2 bg-green-50 border-b border-green-100">
            <span className="text-xs font-semibold text-green-700">予定休診日</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-green-100 bg-green-50/50">
                <th className="text-left px-4 py-3 text-green-900 font-semibold">日付</th>
                <th className="text-left px-4 py-3 text-green-900 font-semibold hidden sm:table-cell">曜日</th>
                <th className="text-left px-4 py-3 text-green-900 font-semibold">理由</th>
                {filterClinic === 'all' && (
                  <th className="text-left px-4 py-3 text-green-900 font-semibold hidden md:table-cell">院</th>
                )}
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-green-50">
              {upcomingDays.map((d) => {
                const clinic = store.clinics.find((c) => c.id === d.clinic_id)
                const date = parseISO(d.closed_date)
                const dow = date.getDay()
                return (
                  <tr key={d.id} className="hover:bg-green-50/40">
                    <td className="px-4 py-3 font-medium text-green-900">
                      {format(date, 'yyyy/MM/dd')}
                    </td>
                    <td className={cn(
                      'px-4 py-3 hidden sm:table-cell',
                      dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-muted-foreground',
                    )}>
                      {format(date, 'E', { locale: ja })}曜日
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{d.reason ?? '-'}</td>
                    {filterClinic === 'all' && (
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {clinic?.name ?? '-'}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost" size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteId(d.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {pastDays.length > 0 && (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden opacity-60">
          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-semibold text-muted-foreground">過去の休診日（直近5件）</span>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {pastDays.map((d) => {
                const clinic = store.clinics.find((c) => c.id === d.clinic_id)
                const date = parseISO(d.closed_date)
                return (
                  <tr key={d.id}>
                    <td className="px-4 py-2.5 text-muted-foreground">{format(date, 'yyyy/MM/dd')}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{d.reason ?? '-'}</td>
                    {filterClinic === 'all' && (
                      <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{clinic?.name ?? '-'}</td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}
        title="休診日を削除しますか？" confirmLabel="削除" variant="destructive"
        onConfirm={async () => {
          if (deleteId) {
            try {
              await closedDaysStore.delete(deleteId)
              toast.success('削除しました')
            } catch {
              toast.error('削除に失敗しました')
            }
          }
          setDeleteId(null)
        }}
      />
    </div>
  )
}
