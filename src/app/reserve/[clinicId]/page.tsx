'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format, addDays, isSameDay, parseISO, differenceInMinutes } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, ChevronRight, Check, ArrowLeft } from 'lucide-react'
import { useClinicStore, reservationsStore } from '@/lib/clinic-store'
import { useAnnouncementsStore, announcementsStore } from '@/lib/announcement-store'
import { AnnouncementBanners } from '@/components/common/AnnouncementBanner'
import { cn } from '@/lib/utils'
import type { Staff, Menu } from '@/types/clinic'
import { VISIT_TYPE_LABELS } from '@/types/clinic'

type Step = 'visit_type' | 'menu' | 'staff' | 'date' | 'time' | 'info' | 'confirm' | 'complete'

const STEP_LABELS: Record<Step, string> = {
  visit_type: '初診・再来選択',
  menu: 'メニュー選択',
  staff: '担当者選択',
  date: '日付選択',
  time: '時間選択',
  info: '患者情報',
  confirm: '予約確認',
  complete: '完了',
}

const STEPS: Step[] = ['visit_type', 'menu', 'staff', 'date', 'time', 'info', 'confirm', 'complete']

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

function generateTimeSlots(openTime: string, closeTime: string, durationMin: number): string[] {
  const slots: string[] = []
  const open = timeToMinutes(openTime)
  const close = timeToMinutes(closeTime)
  for (let t = open; t + durationMin <= close; t += 30) {
    slots.push(minutesToTime(t))
  }
  return slots
}

function isSlotAvailable(
  date: string,
  time: string,
  staffId: string | null,
  durationMin: number,
  reservations: ReturnType<typeof reservationsStore.getAll>,
): boolean {
  const startMin = timeToMinutes(time)
  const endMin = startMin + durationMin
  return !reservations.some((r) => {
    if (r.status === 'cancelled' || !r.start_at.startsWith(date)) return false
    if (staffId && r.staff_id !== staffId) return false
    const rStart = differenceInMinutes(parseISO(r.start_at), new Date(r.start_at.slice(0, 10)))
    const rEnd = differenceInMinutes(parseISO(r.end_at), new Date(r.end_at.slice(0, 10)))
    return startMin < rEnd && endMin > rStart
  })
}

export default function ReserveClinicPage() {
  const params = useParams()
  const clinicId = String(params.clinicId)
  const store = useClinicStore()
  const announcements = useAnnouncementsStore()
  const router = useRouter()

  const clinic = store.clinics.find((c) => c.id === clinicId)
  const clinicAnnouncements = announcementsStore.getActive('clinic', clinicId)

  const [step, setStep] = useState<Step>('visit_type')
  const [visitType, setVisitType] = useState<'first' | 'return'>('return')
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [patientName, setPatientName] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [memo, setMemo] = useState('')
  const [calendarOffset, setCalendarOffset] = useState(0)

  const availableMenus = store.menus.filter(
    (m) => m.clinic_id === clinicId && m.is_active && (m.visit_type === 'both' || m.visit_type === visitType),
  )
  const availableStaff = store.staff.filter((s) => s.clinic_id === clinicId && s.is_active && s.is_bookable)

  // カレンダー: 今日から14日分
  const calendarDays = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => addDays(new Date(), i + calendarOffset * 14)),
    [calendarOffset],
  )

  // 利用可能時間帯
  const availableSlots = useMemo(() => {
    if (!clinic || !selectedMenu || !selectedDate) return []
    const date = format(selectedDate, 'yyyy-MM-dd')
    const slots = generateTimeSlots(clinic.open_time, clinic.close_time, selectedMenu.duration_min)
    return slots.filter((t) =>
      isSlotAvailable(date, t, selectedStaff?.id ?? null, selectedMenu.duration_min, store.reservations),
    )
  }, [clinic, selectedMenu, selectedStaff, selectedDate, store.reservations])

  function goNext() {
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
  }
  function goBack() {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
    else router.push('/reserve')
  }

  function handleConfirm() {
    if (!selectedMenu || !selectedDate || !selectedTime || !patientName) return
    const date = format(selectedDate, 'yyyy-MM-dd')
    const startAt = new Date(`${date}T${selectedTime}:00`).toISOString()
    const endAt = new Date(
      new Date(`${date}T${selectedTime}:00`).getTime() + selectedMenu.duration_min * 60 * 1000,
    ).toISOString()
    reservationsStore.create({
      clinic_id: clinicId,
      staff_id: selectedStaff?.id ?? null,
      menu_id: selectedMenu.id,
      patient_id: null,
      patient_name: patientName,
      patient_phone: patientPhone || null,
      start_at: startAt,
      end_at: endAt,
      status: 'confirmed',
      memo: memo || null,
    })
    setStep('complete')
  }

  if (!clinic) {
    return <div className="p-8 text-center text-muted-foreground">院が見つかりません</div>
  }

  const currentStepIdx = STEPS.indexOf(step)
  const progress = Math.round((currentStepIdx / (STEPS.length - 2)) * 100)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-green-900 text-white sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={goBack} className="p-1 rounded hover:bg-green-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-semibold">{clinic.name}</p>
            {step !== 'complete' && (
              <p className="text-xs text-green-300">{STEP_LABELS[step]}</p>
            )}
          </div>
        </div>
        {/* プログレスバー */}
        {step !== 'complete' && (
          <div className="h-1 bg-green-800">
            <div
              className="h-full bg-gold-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
        {/* お知らせ */}
        {step === 'visit_type' && clinicAnnouncements.length > 0 && (
          <AnnouncementBanners announcements={clinicAnnouncements} />
        )}

        {/* Step: 初診・再来 */}
        {step === 'visit_type' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-green-900">初診・再来を選んでください</h2>
            <div className="grid grid-cols-2 gap-3">
              {(['first', 'return'] as const).map((vt) => (
                <button
                  key={vt}
                  onClick={() => { setVisitType(vt); goNext() }}
                  className="bg-white rounded-2xl border-2 border-green-100 p-6 text-center hover:border-green-500 hover:bg-green-50 transition-all active:scale-[0.98]"
                >
                  <div className="text-3xl mb-2">{vt === 'first' ? '🌱' : '🔄'}</div>
                  <div className="font-bold text-green-900">
                    {vt === 'first' ? '初診（はじめて）' : '再来（2回目以降）'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: メニュー */}
        {step === 'menu' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-green-900">メニューを選んでください</h2>
            <div className="space-y-2">
              {availableMenus.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setSelectedMenu(m); goNext() }}
                  className="w-full bg-white rounded-xl border border-green-100 p-4 text-left hover:border-green-400 hover:bg-green-50 transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-green-900">{m.name}</p>
                    <ChevronRight className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span>{m.duration_min}分</span>
                    <span className="font-medium text-green-800">¥{m.price.toLocaleString()}</span>
                  </div>
                </button>
              ))}
              {availableMenus.length === 0 && (
                <p className="text-center text-muted-foreground py-8">予約可能なメニューがありません</p>
              )}
            </div>
          </div>
        )}

        {/* Step: スタッフ */}
        {step === 'staff' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-green-900">担当者を選んでください</h2>
            <div className="space-y-2">
              <button
                onClick={() => { setSelectedStaff(null); goNext() }}
                className="w-full bg-white rounded-xl border border-green-100 p-4 text-left hover:border-green-400 hover:bg-green-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-green-900">指名なし（おまかせ）</p>
                  <ChevronRight className="w-4 h-4 text-green-400" />
                </div>
              </button>
              {availableStaff.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedStaff(s); goNext() }}
                  className="w-full bg-white rounded-xl border border-green-100 p-4 text-left hover:border-green-400 hover:bg-green-50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-green-900">{s.name}</p>
                      {s.role && <p className="text-sm text-muted-foreground">{s.role}</p>}
                    </div>
                    <ChevronRight className="w-4 h-4 text-green-400" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: 日付 */}
        {step === 'date' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-green-900">日付を選んでください</h2>
            <div className="bg-white rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <button onClick={() => setCalendarOffset((o) => Math.max(0, o - 1))}
                  className="p-1 rounded hover:bg-green-50 disabled:opacity-30" disabled={calendarOffset === 0}>
                  <ChevronLeft className="w-5 h-5 text-green-700" />
                </button>
                <span className="text-sm font-medium text-green-900">
                  {format(calendarDays[0], 'yyyy年M月', { locale: ja })}
                </span>
                <button onClick={() => setCalendarOffset((o) => o + 1)} className="p-1 rounded hover:bg-green-50">
                  <ChevronRight className="w-5 h-5 text-green-700" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {['月', '火', '水', '木', '金', '土', '日'].map((d, i) => (
                  <div key={d} className={cn('text-xs font-medium py-1', i === 5 && 'text-blue-500', i === 6 && 'text-red-500')}>
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                  const dow = (day.getDay() + 6) % 7
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => { setSelectedDate(day); goNext() }}
                      className={cn(
                        'rounded-lg py-2.5 text-sm font-medium transition-all hover:bg-green-100',
                        isSameDay(day, new Date()) && 'border border-green-500',
                        selectedDate && isSameDay(day, selectedDate) && 'bg-green-700 text-white hover:bg-green-800',
                        dow === 5 && 'text-blue-500',
                        dow === 6 && 'text-red-500',
                      )}
                    >
                      {format(day, 'd')}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step: 時間 */}
        {step === 'time' && selectedDate && selectedMenu && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-green-900">
              {format(selectedDate, 'M月d日（E）', { locale: ja })} の時間を選んでください
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {availableSlots.map((t) => (
                <button
                  key={t}
                  onClick={() => { setSelectedTime(t); goNext() }}
                  className="bg-white border border-green-200 rounded-xl py-3 text-center font-semibold text-green-900 hover:border-green-500 hover:bg-green-50 transition-all"
                >
                  {t}
                </button>
              ))}
              {availableSlots.length === 0 && (
                <div className="col-span-3 py-8 text-center text-muted-foreground">
                  この日は空き枠がありません
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step: 患者情報 */}
        {step === 'info' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-green-900">患者情報を入力してください</h2>
            <div className="bg-white rounded-xl border border-border p-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-semibold">お名前 *</Label>
                <Input id="name" value={patientName} onChange={(e) => setPatientName(e.target.value)}
                  placeholder="山田 太郎" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-semibold">電話番号</Label>
                <Input id="phone" value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="090-0000-0000" type="tel" className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="memo" className="text-sm font-semibold">症状・ご要望（任意）</Label>
                <Textarea id="memo" value={memo} onChange={(e) => setMemo(e.target.value)}
                  placeholder="腰痛・肩こり など" rows={3} />
              </div>
            </div>
            <Button className="w-full h-12 text-base" disabled={!patientName.trim()} onClick={goNext}>
              次へ進む
            </Button>
          </div>
        )}

        {/* Step: 確認 */}
        {step === 'confirm' && selectedMenu && selectedDate && selectedTime && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-green-900">予約内容をご確認ください</h2>
            <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="bg-green-800 text-white px-5 py-4">
                <p className="text-lg font-bold">{clinic.name}</p>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <Row label="日時" value={`${format(selectedDate, 'yyyy年M月d日（E）', { locale: ja })} ${selectedTime} - ${
                  (() => {
                    const [h, m] = selectedTime.split(':').map(Number)
                    const end = new Date(2000, 0, 1, h, m + selectedMenu.duration_min)
                    return format(end, 'HH:mm')
                  })()
                }`} />
                <Row label="メニュー" value={`${selectedMenu.name}（${selectedMenu.duration_min}分・¥${selectedMenu.price.toLocaleString()}）`} />
                <Row label="担当" value={selectedStaff?.name ?? 'おまかせ'} />
                <Row label="お名前" value={patientName} />
                {patientPhone && <Row label="電話番号" value={patientPhone} />}
                {memo && <Row label="ご要望" value={memo} />}
              </div>
            </div>
            <Button className="w-full h-12 text-base font-bold" onClick={handleConfirm}>
              予約を確定する
            </Button>
          </div>
        )}

        {/* Step: 完了 */}
        {step === 'complete' && (
          <div className="text-center py-8 space-y-5">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-green-700" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-900 mb-2">予約が完了しました</h2>
              <p className="text-muted-foreground">ご予約ありがとうございます。</p>
              {clinic.phone && (
                <p className="text-sm text-muted-foreground mt-2">
                  ご不明な点は <span className="font-medium text-green-800">{clinic.phone}</span> までお電話ください
                </p>
              )}
            </div>
            <Button variant="outline" onClick={() => router.push('/reserve')} className="w-full">
              TOPに戻る
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-right font-medium text-green-900">{value}</span>
    </div>
  )
}
