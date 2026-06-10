'use client'

import { useState, useMemo } from 'react'
import { format, parseISO, addDays, startOfWeek, isSameDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Phone, CalendarCheck, X, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import { useClinicStore } from '@/lib/clinic-store'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { cn } from '@/lib/utils'
import type { Reservation } from '@/types/clinic'

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
function minutesToTime(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}
function generateSlots(open: string, close: string, duration: number) {
  const slots: string[] = []
  for (let t = timeToMinutes(open); t + duration <= timeToMinutes(close); t += 30) {
    slots.push(minutesToTime(t))
  }
  return slots
}

export default function CancelPage() {
  const store = useClinicStore()

  const [phone, setPhone] = useState('')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const [changeTarget, setChangeTarget] = useState<Reservation | null>(null)
  const [changeDate, setChangeDate] = useState<Date | null>(null)
  const [changeTime, setChangeTime] = useState<string | null>(null)
  const [calendarOffset, setCalendarOffset] = useState(0)
  const [confirmChangeOpen, setConfirmChangeOpen] = useState(false)
  const [changing, setChanging] = useState(false)

  const calendarBase = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 0 }), [])
  const calendarDays = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDays(calendarBase, i + calendarOffset * 14)),
    [calendarBase, calendarOffset],
  )

  const changeClinic = changeTarget
    ? store.clinics.find((c) => c.id === changeTarget.clinic_id)
    : null
  const changeMenu = changeTarget
    ? store.menus.find((m) => m.id === changeTarget.menu_id)
    : null
  const closedDatesSet = useMemo(() => {
    if (!changeTarget) return new Set<string>()
    return new Set(
      store.closedDays
        .filter((d) => d.clinic_id === changeTarget.clinic_id)
        .map((d) => d.closed_date),
    )
  }, [store.closedDays, changeTarget])

  const availableSlots = useMemo(() => {
    if (!changeTarget || !changeClinic || !changeMenu || !changeDate) return []
    const date = format(changeDate, 'yyyy-MM-dd')
    const duration = changeMenu.duration_min
    const slots = generateSlots(changeClinic.open_time, changeClinic.close_time, duration)
    return slots.filter((t) => {
      const startMin = timeToMinutes(t)
      const endMin = startMin + duration
      return !store.reservations.some((r) => {
        if (r.id === changeTarget.id) return false
        if (r.status === 'cancelled' || r.status === 'no_show') return false
        if (changeTarget.staff_id && r.staff_id !== changeTarget.staff_id) return false
        if (format(parseISO(r.start_at), 'yyyy-MM-dd') !== date) return false
        const rStart = parseISO(r.start_at)
        const rEnd = parseISO(r.end_at)
        const rStartMin = rStart.getHours() * 60 + rStart.getMinutes()
        const rEndMin = rEnd.getHours() * 60 + rEnd.getMinutes()
        return startMin < rEndMin && endMin > rStartMin
      })
    })
  }, [changeTarget, changeClinic, changeMenu, changeDate, store.reservations])

  async function handleSearch() {
    if (!phone.trim()) return
    setLoading(true)
    setError('')
    setSearched(false)
    setChangeTarget(null)
    try {
      const supabase = getSupabaseClient()
      const { data, error: err } = await supabase
        .from('reservations')
        .select('*')
        .eq('patient_phone', phone.replace(/-/g, '').trim())
        .eq('status', 'confirmed')
        .gte('start_at', new Date().toISOString())
        .order('start_at')
      if (err) throw err
      setReservations(data ?? [])
      setSearched(true)
    } catch {
      setError('検索に失敗しました。しばらくしてから再試行してください。')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    if (!cancelId) return
    setCancelling(true)
    try {
      const supabase = getSupabaseClient()
      const { error: err } = await supabase
        .from('reservations')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', cancelId)
      if (err) throw err
      setReservations((prev) => prev.filter((r) => r.id !== cancelId))
      setCancelId(null)
    } catch {
      setError('キャンセルに失敗しました。院に直接ご連絡ください。')
      setCancelId(null)
    } finally {
      setCancelling(false)
    }
  }

  async function handleChange() {
    if (!changeTarget || !changeDate || !changeTime || !changeMenu) return
    setChanging(true)
    try {
      const date = format(changeDate, 'yyyy-MM-dd')
      const newStart = new Date(`${date}T${changeTime}:00`).toISOString()
      const newEnd = new Date(
        new Date(`${date}T${changeTime}:00`).getTime() + changeMenu.duration_min * 60 * 1000,
      ).toISOString()
      const supabase = getSupabaseClient()
      const { error: err } = await supabase
        .from('reservations')
        .update({ start_at: newStart, end_at: newEnd, updated_at: new Date().toISOString() })
        .eq('id', changeTarget.id)
      if (err) throw err
      setReservations((prev) =>
        prev.map((r) =>
          r.id === changeTarget.id ? { ...r, start_at: newStart, end_at: newEnd } : r,
        ),
      )
      setChangeTarget(null)
      setChangeDate(null)
      setChangeTime(null)
      setConfirmChangeOpen(false)
    } catch {
      setError('変更に失敗しました。院に直接ご連絡ください。')
      setConfirmChangeOpen(false)
    } finally {
      setChanging(false)
    }
  }

  function openChange(r: Reservation) {
    setChangeTarget(r)
    setChangeDate(null)
    setChangeTime(null)
    setCalendarOffset(0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <header className="bg-green-900 text-white px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/reserve" className="text-green-200 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight">予約の確認・変更・キャンセル</h1>
            <p className="text-green-200 text-sm mt-0.5">電話番号で予約を検索できます</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* 検索フォーム */}
        <div className="bg-white rounded-xl border border-border shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-green-900">
            <Phone className="w-4 h-4" />
            <span>電話番号で予約を検索</span>
          </div>
          <div className="flex gap-2">
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="例: 090-1234-5678"
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading || !phone.trim()}>
              {loading ? '検索中...' : '検索'}
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {/* 検索結果 */}
        {searched && (
          <div className="space-y-3">
            {reservations.length === 0 ? (
              <div className="bg-white rounded-xl border border-border shadow-sm p-6 text-center">
                <CalendarCheck className="w-8 h-8 mx-auto mb-2 text-green-300" />
                <p className="text-sm text-muted-foreground">予約が見つかりませんでした</p>
                <p className="text-xs text-muted-foreground mt-1">
                  電話番号を確認するか、院に直接お問い合わせください
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{reservations.length}件の予約が見つかりました</p>
                {reservations.map((r) => {
                  const isChanging = changeTarget?.id === r.id
                  return (
                    <div key={r.id} className={cn(
                      'bg-white rounded-xl border shadow-sm overflow-hidden',
                      isChanging ? 'border-green-400' : 'border-border',
                    )}>
                      {/* 予約カード */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-green-900">
                              {format(parseISO(r.start_at), 'M月d日（E） HH:mm', { locale: ja })}
                            </p>
                            <p className="text-sm text-muted-foreground mt-0.5">{r.patient_name}</p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            {!isChanging && (
                              <Button
                                variant="outline" size="sm"
                                className="h-8 text-xs border-green-300 text-green-700 hover:bg-green-50"
                                onClick={() => openChange(r)}
                              >
                                <Pencil className="w-3 h-3 mr-1" />
                                変更
                              </Button>
                            )}
                            {isChanging && (
                              <Button
                                variant="ghost" size="sm"
                                className="h-8 text-xs text-muted-foreground"
                                onClick={() => setChangeTarget(null)}
                              >
                                閉じる
                              </Button>
                            )}
                            <Button
                              variant="outline" size="sm"
                              className="h-8 text-xs text-destructive border-destructive hover:bg-destructive/10"
                              onClick={() => setCancelId(r.id)}
                            >
                              <X className="w-3 h-3 mr-1" />
                              キャンセル
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* 日時変更パネル */}
                      {isChanging && changeClinic && (
                        <div className="border-t border-green-100 p-4 bg-green-50/40 space-y-4">
                          <p className="text-sm font-semibold text-green-900">新しい日時を選んでください</p>

                          {/* カレンダー */}
                          <div className="bg-white rounded-xl border border-border p-3">
                            <div className="flex items-center justify-between mb-3">
                              <button
                                onClick={() => { setCalendarOffset((o) => Math.max(0, o - 1)); setChangeDate(null); setChangeTime(null) }}
                                disabled={calendarOffset === 0}
                                className="p-1 rounded hover:bg-green-50 disabled:opacity-30"
                              >
                                <ChevronLeft className="w-4 h-4 text-green-700" />
                              </button>
                              <span className="text-sm font-medium text-green-900">
                                {format(calendarDays[0], 'M月', { locale: ja })}
                                {format(calendarDays[0], 'M') !== format(calendarDays[13], 'M') && (
                                  <>〜{format(calendarDays[13], 'M月', { locale: ja })}</>
                                )}
                              </span>
                              <button
                                onClick={() => { setCalendarOffset((o) => o + 1); setChangeDate(null); setChangeTime(null) }}
                                className="p-1 rounded hover:bg-green-50"
                              >
                                <ChevronRight className="w-4 h-4 text-green-700" />
                              </button>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center mb-1">
                              {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
                                <div key={d} className={cn('text-xs font-medium py-1', i === 0 && 'text-red-500', i === 6 && 'text-blue-500')}>
                                  {d}
                                </div>
                              ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                              {calendarDays.map((day) => {
                                const dow = day.getDay()
                                const isPast = day < new Date(new Date().setHours(0, 0, 0, 0))
                                const dateStr = format(day, 'yyyy-MM-dd')
                                const isClosed = closedDatesSet.has(dateStr)
                                const disabled = isPast || isClosed
                                const isSelected = changeDate && isSameDay(day, changeDate)
                                return (
                                  <button
                                    key={day.toISOString()}
                                    disabled={disabled}
                                    onClick={() => { setChangeDate(day); setChangeTime(null) }}
                                    className={cn(
                                      'rounded-lg py-2 text-sm font-medium transition-all',
                                      disabled ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-green-100',
                                      isClosed && 'bg-red-50',
                                      isSameDay(day, new Date()) && !disabled && 'border border-green-500',
                                      isSelected && 'bg-green-700 text-white hover:bg-green-800',
                                      !disabled && !isSelected && dow === 0 && 'text-red-500',
                                      !disabled && !isSelected && dow === 6 && 'text-blue-500',
                                    )}
                                  >
                                    {format(day, 'd')}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          {/* 時間スロット */}
                          {changeDate && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-2">
                                {format(changeDate, 'M月d日（E）', { locale: ja })} の時間
                              </p>
                              {availableSlots.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-3">この日は空き枠がありません</p>
                              ) : (
                                <div className="grid grid-cols-4 gap-1.5">
                                  {availableSlots.map((t) => (
                                    <button
                                      key={t}
                                      onClick={() => setChangeTime(t)}
                                      className={cn(
                                        'py-2 rounded-lg text-sm font-medium border transition-all',
                                        changeTime === t
                                          ? 'bg-green-700 text-white border-green-700'
                                          : 'bg-white border-green-200 text-green-900 hover:border-green-500 hover:bg-green-50',
                                      )}
                                    >
                                      {t}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* 変更ボタン */}
                          {changeDate && changeTime && (
                            <Button
                              className="w-full"
                              onClick={() => setConfirmChangeOpen(true)}
                            >
                              {format(changeDate, 'M月d日（E）', { locale: ja })} {changeTime} に変更する
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </>
            )}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center pt-2">
          ご不明な点は院に直接お電話ください
        </p>
      </div>

      {/* キャンセル確認 */}
      <ConfirmDialog
        open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)}
        title="予約をキャンセルしますか？"
        description="キャンセル後は元に戻せません。急ぎの場合は院に直接お電話ください。"
        confirmLabel={cancelling ? 'キャンセル中...' : 'キャンセルする'}
        variant="destructive"
        onConfirm={handleCancel}
      />

      {/* 変更確認 */}
      <ConfirmDialog
        open={confirmChangeOpen} onOpenChange={(o) => !o && setConfirmChangeOpen(false)}
        title="予約日時を変更しますか？"
        description={
          changeDate && changeTime
            ? `${format(changeDate, 'M月d日（E）', { locale: ja })} ${changeTime} に変更します`
            : ''
        }
        confirmLabel={changing ? '変更中...' : '変更する'}
        onConfirm={handleChange}
      />
    </div>
  )
}
