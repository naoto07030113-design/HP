'use client'

import { useState, useMemo } from 'react'
import { format, parseISO, isSameDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Phone, CalendarCheck, X, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import { getSupabaseClient } from '@/lib/supabase'
import { useClinicStore } from '@/lib/clinic-store'
import { useClosedDaysStore, closedDaysStore } from '@/lib/closed-days-store'
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
  useClosedDaysStore()

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

  const calendarData = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + calendarOffset
    const firstOfMonth = new Date(year, month, 1)
    const startDow = firstOfMonth.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells: (Date | null)[] = []
    for (let i = 0; i < startDow; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
    return { cells, firstOfMonth }
  }, [calendarOffset])

  const changeClinic = changeTarget
    ? store.clinics.find((c) => c.id === changeTarget.clinic_id)
    : null
  const changeMenu = changeTarget
    ? store.menus.find((m) => m.id === changeTarget.menu_id)
    : null
  function isDayClosed(day: Date): boolean {
    if (!changeTarget) return false
    const closure = closedDaysStore.getClosureForDate(day, changeTarget.clinic_id)
    return closure?.allDay === true
  }

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
    <div className="min-h-screen bg-stone-50">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-emerald-950 to-emerald-900 text-white sticky top-0 z-10 shadow-md">
        <div className="max-w-lg mx-auto px-4 py-3.5 flex items-center gap-3">
          <Link href="/reserve" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm font-bold">予約の確認・変更・キャンセル</h1>
            <p className="text-[11px] text-emerald-300 mt-0.5">電話番号で予約を検索できます</p>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* 検索フォーム */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-950 font-bold">
            <Phone className="w-4 h-4 text-emerald-600" />
            <span className="text-sm">電話番号で予約を検索</span>
          </div>
          <div className="flex gap-2">
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="例: 090-1234-5678"
              className="flex-1 h-11 rounded-xl border-stone-200 focus:border-emerald-400"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !phone.trim()}
              className={cn(
                'px-5 h-11 rounded-xl font-bold text-sm transition-all',
                loading || !phone.trim()
                  ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                  : 'bg-emerald-800 text-white hover:bg-emerald-700 active:scale-[0.98]',
              )}
            >
              {loading ? '検索中...' : '検索'}
            </button>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* 検索結果 */}
        {searched && (
          <div className="space-y-3">
            {reservations.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
                  <CalendarCheck className="w-7 h-7 text-stone-300" />
                </div>
                <p className="text-sm font-semibold text-stone-500">予約が見つかりませんでした</p>
                <p className="text-xs text-stone-400 mt-1">
                  電話番号を確認するか、院に直接お問い合わせください
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-stone-400 px-1">{reservations.length}件の予約が見つかりました</p>
                {reservations.map((r) => {
                  const isChanging = changeTarget?.id === r.id
                  return (
                    <div key={r.id} className={cn(
                      'bg-white rounded-2xl border shadow-sm overflow-hidden transition-all',
                      isChanging ? 'border-emerald-300' : 'border-stone-100',
                    )}>
                      <div className="h-1 bg-gradient-to-r from-emerald-600 to-emerald-400" />
                      {/* 予約カード */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-emerald-950">
                              {format(parseISO(r.start_at), 'M月d日（E） HH:mm', { locale: ja })}
                            </p>
                            <p className="text-sm text-stone-500 mt-0.5">{r.patient_name}</p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            {!isChanging && (
                              <button
                                className="h-8 px-3 rounded-xl border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-50 transition-colors flex items-center gap-1"
                                onClick={() => openChange(r)}
                              >
                                <Pencil className="w-3 h-3" />
                                変更
                              </button>
                            )}
                            {isChanging && (
                              <button
                                className="h-8 px-3 rounded-xl border border-stone-200 text-stone-500 text-xs font-semibold hover:bg-stone-50 transition-colors"
                                onClick={() => setChangeTarget(null)}
                              >
                                閉じる
                              </button>
                            )}
                            <button
                              className="h-8 px-3 rounded-xl border border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition-colors flex items-center gap-1"
                              onClick={() => setCancelId(r.id)}
                            >
                              <X className="w-3 h-3" />
                              キャンセル
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 日時変更パネル */}
                      {isChanging && changeClinic && (
                        <div className="border-t border-stone-100 p-4 bg-stone-50/60 space-y-4">
                          <p className="text-sm font-bold text-emerald-950">新しい日時を選んでください</p>

                          {/* カレンダー */}
                          <div className="bg-white rounded-2xl border border-stone-100 p-4">
                            <div className="flex items-center justify-between mb-4">
                              <button
                                onClick={() => { setCalendarOffset((o) => Math.max(0, o - 1)); setChangeDate(null); setChangeTime(null) }}
                                disabled={calendarOffset === 0}
                                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-emerald-100 flex items-center justify-center transition-colors disabled:opacity-30"
                              >
                                <ChevronLeft className="w-3.5 h-3.5 text-emerald-800" />
                              </button>
                              <span className="text-sm font-bold text-emerald-950">
                                {format(calendarData.firstOfMonth, 'yyyy年M月', { locale: ja })}
                              </span>
                              <button
                                onClick={() => { setCalendarOffset((o) => o + 1); setChangeDate(null); setChangeTime(null) }}
                                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-emerald-100 flex items-center justify-center transition-colors"
                              >
                                <ChevronRight className="w-3.5 h-3.5 text-emerald-800" />
                              </button>
                            </div>
                            <div className="grid grid-cols-7 gap-1 text-center mb-1">
                              {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
                                <div key={d} className={cn('text-xs font-semibold py-1 text-stone-400', i === 0 && 'text-red-400', i === 6 && 'text-blue-400')}>
                                  {d}
                                </div>
                              ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                              {calendarData.cells.map((day, idx) => {
                                if (!day) return <div key={`empty-${idx}`} />
                                const dow = day.getDay()
                                const isPast = day < new Date(new Date().setHours(0, 0, 0, 0))
                                const isClosed = isDayClosed(day)
                                const disabled = isPast || isClosed
                                const isSelected = changeDate && isSameDay(day, changeDate)
                                const isToday = isSameDay(day, new Date())
                                return (
                                  <button
                                    key={day.toISOString()}
                                    disabled={disabled}
                                    onClick={() => { setChangeDate(day); setChangeTime(null) }}
                                    className={cn(
                                      'rounded-xl py-2 text-xs font-semibold transition-all',
                                      disabled ? 'text-stone-200 cursor-not-allowed' : 'hover:bg-emerald-50',
                                      isClosed && 'bg-red-50 text-red-200',
                                      isToday && !disabled && !isSelected && 'ring-1 ring-emerald-400 text-emerald-700',
                                      isSelected && 'bg-emerald-800 text-white hover:bg-emerald-700',
                                      !disabled && !isSelected && dow === 0 && 'text-red-400',
                                      !disabled && !isSelected && dow === 6 && 'text-blue-400',
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
                              <p className="text-xs font-semibold text-stone-500 mb-2">
                                {format(changeDate, 'M月d日（E）', { locale: ja })} の空き時間
                              </p>
                              {availableSlots.length === 0 ? (
                                <p className="text-sm text-stone-400 text-center py-3">この日は空き枠がありません</p>
                              ) : (
                                <div className="grid grid-cols-4 gap-1.5">
                                  {availableSlots.map((t) => (
                                    <button
                                      key={t}
                                      onClick={() => setChangeTime(t)}
                                      className={cn(
                                        'py-2.5 rounded-xl text-xs font-bold border transition-all',
                                        changeTime === t
                                          ? 'bg-emerald-800 text-white border-emerald-800'
                                          : 'bg-white border-stone-200 text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50',
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
                            <button
                              className="w-full h-11 rounded-2xl bg-emerald-800 text-white font-bold text-sm hover:bg-emerald-700 active:scale-[0.99] transition-all"
                              onClick={() => setConfirmChangeOpen(true)}
                            >
                              {format(changeDate, 'M月d日（E）', { locale: ja })} {changeTime} に変更する
                            </button>
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

        <p className="text-xs text-stone-400 text-center pt-2">
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
