'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarOff, Plus, Trash2, RefreshCw, Calendar } from 'lucide-react'
import { useClosedDaysStore, closedDaysStore } from '@/lib/closed-days-store'
import { useClinicStore } from '@/lib/clinic-store'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import {
  DAY_OF_WEEK_LABELS,
  CLOSE_TYPE_LABELS,
  type ClosedDayCloseType,
} from '@/types/clinic'
import { cn } from '@/lib/utils'

type TabKey = 'recurring' | 'oneoff'

const CLOSE_TYPE_OPTIONS: ClosedDayCloseType[] = ['all_day', 'morning', 'afternoon', 'time_range']

export default function SchedulePage() {
  useClosedDaysStore()
  const { clinics } = useClinicStore()
  const [activeTab, setActiveTab] = useState<TabKey>('recurring')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // 定休日フォーム
  const [rClinic, setRClinic] = useState<string>('all')
  const [rDow, setRDow] = useState<number | null>(null)
  const [rCloseType, setRCloseType] = useState<ClosedDayCloseType>('all_day')
  const [rFrom, setRFrom] = useState('09:00')
  const [rTo, setRTo] = useState('12:00')
  const [rReason, setRReason] = useState('')

  // 臨時休診フォーム
  const [oClinic, setOClinic] = useState<string>('all')
  const [oDate, setODate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [oCloseType, setOCloseType] = useState<ClosedDayCloseType>('all_day')
  const [oFrom, setOFrom] = useState('09:00')
  const [oTo, setOTo] = useState('12:00')
  const [oReason, setOReason] = useState('')

  const allDays = closedDaysStore.getAll()
  const recurringDays = allDays.filter((d) => d.repeat_type === 'weekly')
    .sort((a, b) => (a.day_of_week ?? 0) - (b.day_of_week ?? 0))
  const oneOffDays = allDays.filter((d) => d.repeat_type === 'none')
    .sort((a, b) => (a.closed_date ?? '').localeCompare(b.closed_date ?? ''))

  async function handleAddRecurring() {
    if (rDow === null) { toast.error('曜日を選択してください'); return }
    try {
      await closedDaysStore.create({
        clinic_id: rClinic === 'all' ? null : rClinic,
        closed_date: null,
        repeat_type: 'weekly',
        day_of_week: rDow,
        close_type: rCloseType,
        close_from: rCloseType === 'time_range' ? rFrom : null,
        close_to: rCloseType === 'time_range' ? rTo : null,
        reason: rReason || null,
      })
      toast.success('定休日を追加しました')
      setRDow(null)
      setRReason('')
    } catch {
      toast.error('追加に失敗しました')
    }
  }

  async function handleAddOneOff() {
    if (!oDate) { toast.error('日付を入力してください'); return }
    try {
      await closedDaysStore.create({
        clinic_id: oClinic === 'all' ? null : oClinic,
        closed_date: oDate,
        repeat_type: 'none',
        day_of_week: null,
        close_type: oCloseType,
        close_from: oCloseType === 'time_range' ? oFrom : null,
        close_to: oCloseType === 'time_range' ? oTo : null,
        reason: oReason || null,
      })
      toast.success('臨時休診を追加しました')
      setOReason('')
    } catch {
      toast.error('追加に失敗しました')
    }
  }

  function clinicLabel(clinicId: string | null) {
    if (!clinicId) return '全院'
    return clinics.find((c) => c.id === clinicId)?.name ?? clinicId
  }

  function closureLabel(d: ReturnType<typeof closedDaysStore.getAll>[number]) {
    const base = CLOSE_TYPE_LABELS[d.close_type]
    if (d.close_type === 'time_range' && d.close_from && d.close_to) {
      return `${d.close_from}〜${d.close_to}`
    }
    return base
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h1 className="page-title">休診日管理</h1>
        <p className="text-sm text-muted-foreground mt-0.5">定休日・臨時休診の設定</p>
      </div>

      {/* タブ */}
      <div className="flex gap-1 border-b">
        {([
          { key: 'recurring', label: '定休日（週次繰返し）', icon: RefreshCw },
          { key: 'oneoff',    label: '臨時休診（単発）',     icon: Calendar },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              activeTab === key
                ? 'border-green-700 text-green-900'
                : 'border-transparent text-muted-foreground hover:text-green-800',
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── 定休日タブ ── */}
      {activeTab === 'recurring' && (
        <div className="space-y-5">
          {/* 追加フォーム */}
          <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-green-900 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              定休日を追加
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">院</Label>
                <Select value={rClinic} onValueChange={setRClinic}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全院共通</SelectItem>
                    {clinics.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">休診タイプ</Label>
                <Select value={rCloseType} onValueChange={(v) => setRCloseType(v as ClosedDayCloseType)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CLOSE_TYPE_OPTIONS.map((k) => (
                      <SelectItem key={k} value={k}>{CLOSE_TYPE_LABELS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {rCloseType === 'time_range' && (
              <div className="flex items-center gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">開始時刻</Label>
                  <Input type="time" value={rFrom} onChange={(e) => setRFrom(e.target.value)} className="h-9 w-32" />
                </div>
                <span className="mt-5 text-muted-foreground">〜</span>
                <div className="space-y-1.5">
                  <Label className="text-xs">終了時刻</Label>
                  <Input type="time" value={rTo} onChange={(e) => setRTo(e.target.value)} className="h-9 w-32" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">曜日を選択</Label>
              <div className="flex gap-2 flex-wrap">
                {DAY_OF_WEEK_LABELS.map((label, i) => (
                  <button
                    key={i}
                    onClick={() => setRDow(rDow === i ? null : i)}
                    className={cn(
                      'w-10 h-10 rounded-full text-sm font-bold transition-all border-2',
                      rDow === i
                        ? 'bg-green-700 text-white border-green-700'
                        : i === 0
                        ? 'border-red-200 text-red-500 hover:bg-red-50'
                        : i === 6
                        ? 'border-blue-200 text-blue-500 hover:bg-blue-50'
                        : 'border-stone-200 text-stone-700 hover:bg-stone-50',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">理由・メモ（任意）</Label>
              <Input
                value={rReason}
                onChange={(e) => setRReason(e.target.value)}
                placeholder="例: 院長不在"
                className="h-9 text-sm"
              />
            </div>

            <div className="flex justify-end">
              <Button size="sm" onClick={handleAddRecurring} disabled={rDow === null}>
                <Plus className="w-4 h-4 mr-1.5" />
                追加
              </Button>
            </div>
          </div>

          {/* 一覧 */}
          {recurringDays.length === 0 ? (
            <EmptyState
              icon={CalendarOff}
              title="定休日が設定されていません"
              description="上のフォームから毎週の定休日を追加してください"
            />
          ) : (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">曜日</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">院</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">休診タイプ</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">理由</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recurringDays.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold',
                          d.day_of_week === 0 ? 'bg-red-100 text-red-700'
                          : d.day_of_week === 6 ? 'bg-blue-100 text-blue-700'
                          : 'bg-stone-100 text-stone-700',
                        )}>
                          {d.day_of_week !== null ? DAY_OF_WEEK_LABELS[d.day_of_week] : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{clinicLabel(d.clinic_id)}</td>
                      <td className="px-4 py-3 text-sm">{closureLabel(d)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{d.reason ?? '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(d.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── 臨時休診タブ ── */}
      {activeTab === 'oneoff' && (
        <div className="space-y-5">
          {/* 追加フォーム */}
          <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
            <h2 className="font-semibold text-green-900 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              臨時休診を追加
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">院</Label>
                <Select value={oClinic} onValueChange={setOClinic}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全院共通</SelectItem>
                    {clinics.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">日付</Label>
                <Input
                  type="date"
                  value={oDate}
                  onChange={(e) => setODate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">休診タイプ</Label>
                <Select value={oCloseType} onValueChange={(v) => setOCloseType(v as ClosedDayCloseType)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CLOSE_TYPE_OPTIONS.map((k) => (
                      <SelectItem key={k} value={k}>{CLOSE_TYPE_LABELS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {oCloseType === 'time_range' && (
                <div className="flex items-center gap-2 sm:col-span-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">開始時刻</Label>
                    <Input type="time" value={oFrom} onChange={(e) => setOFrom(e.target.value)} className="h-9 w-32" />
                  </div>
                  <span className="mt-5 text-muted-foreground">〜</span>
                  <div className="space-y-1.5">
                    <Label className="text-xs">終了時刻</Label>
                    <Input type="time" value={oTo} onChange={(e) => setOTo(e.target.value)} className="h-9 w-32" />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">理由・メモ（任意）</Label>
              <Input
                value={oReason}
                onChange={(e) => setOReason(e.target.value)}
                placeholder="例: 研修のため午前休"
                className="h-9 text-sm"
              />
            </div>

            <div className="flex justify-end">
              <Button size="sm" onClick={handleAddOneOff}>
                <Plus className="w-4 h-4 mr-1.5" />
                追加
              </Button>
            </div>
          </div>

          {/* 一覧 */}
          {oneOffDays.length === 0 ? (
            <EmptyState
              icon={CalendarOff}
              title="臨時休診が設定されていません"
              description="上のフォームから臨時休診日を追加してください"
            />
          ) : (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">日付</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">院</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">休診タイプ</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">理由</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {oneOffDays.map((d) => {
                    const isPast = d.closed_date ? d.closed_date < format(new Date(), 'yyyy-MM-dd') : false
                    return (
                      <tr key={d.id} className={cn('hover:bg-slate-50/50', isPast && 'opacity-50')}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-medium">{d.closed_date}</span>
                          {isPast && <span className="ml-1.5 text-xs text-muted-foreground">（過去）</span>}
                        </td>
                        <td className="px-4 py-3 text-sm">{clinicLabel(d.clinic_id)}</td>
                        <td className="px-4 py-3 text-sm">{closureLabel(d)}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{d.reason ?? '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
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
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        title="休診日を削除しますか？"
        confirmLabel="削除"
        variant="destructive"
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
