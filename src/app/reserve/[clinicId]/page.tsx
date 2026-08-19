'use client'

import { useState, useMemo, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format, isSameDay, parseISO, addDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, ChevronRight, Check, ArrowLeft, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useClinicStore } from '@/lib/clinic-store'
import { useMerchandiseStore } from '@/lib/merchandise-store'
import { useAnnouncementsStore, announcementsStore } from '@/lib/announcement-store'
import { useClosedDaysStore, closedDaysStore } from '@/lib/closed-days-store'
import { useSettingsStore } from '@/lib/settings-store'
import { apiPost, ApiError } from '@/lib/api-client'
import { AnnouncementBanners } from '@/components/common/AnnouncementBanner'
import { SelfCareGuide } from '@/components/reserve/SelfCareGuide'
import { cn, normalizePhone } from '@/lib/utils'
import type { Staff, Menu } from '@/types/clinic'
import { VISIT_TYPE_LABELS } from '@/types/clinic'

type Step = 'visit_type' | 'menu' | 'staff' | 'date' | 'time' | 'info' | 'confirm' | 'complete'

// 予約完了時に舞う花びら。毎回同じ見え方になるよう座標は固定で持つ
const PETALS = [
  { x: -58, rotate: 200, color: '#A7E8C8' },
  { x: -30, rotate: -160, color: '#FFCBA4' },
  { x: -8,  rotate: 240, color: '#9BD4EE' },
  { x: 22,  rotate: -210, color: '#A7E8C8' },
  { x: 46,  rotate: 180, color: '#FFE3A4' },
  { x: 68,  rotate: -240, color: '#9BD4EE' },
  { x: -72, rotate: 150, color: '#FFCBA4' },
  { x: 8,   rotate: -190, color: '#A7E8C8' },
]

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

export default function ReserveClinicPage() {
  const params = useParams()
  const clinicId = String(params.clinicId)
  const store = useClinicStore()
  const announcements = useAnnouncementsStore()
  useClosedDaysStore()
  const settings = useSettingsStore()
  const router = useRouter()

  const clinic = store.clinics.find((c) => c.id === clinicId)
  const clinicAnnouncements = announcementsStore.getActive('clinic', clinicId)
  const merchandiseStore = useMerchandiseStore()
  const hasMerchandise = merchandiseStore.merchandise.some((m) => m.clinic_id === clinicId && m.is_active)

  const [step, setStep] = useState<Step>('visit_type')
  const [visitType, setVisitType] = useState<'first' | 'return'>('return')
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [patientName, setPatientName] = useState('')
  const [patientNameKana, setPatientNameKana] = useState('')
  const [patientGender, setPatientGender] = useState<'male' | 'female' | 'other' | 'unknown'>('unknown')
  const [patientBirthDate, setPatientBirthDate] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [patientEmail, setPatientEmail] = useState('')
  const [patientPostalCode, setPatientPostalCode] = useState('')
  const [patientAddress, setPatientAddress] = useState('')
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [medicalHistory, setMedicalHistory] = useState('')
  const [currentMedications, setCurrentMedications] = useState('')
  const [allergies, setAllergies] = useState('')
  const [referralSource, setReferralSource] = useState('')
  const [referralName, setReferralName] = useState('')
  const [memo, setMemo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [calendarOffset, setCalendarOffset] = useState(0)

  const availableMenus = store.menus.filter(
    (m) => m.clinic_id === clinicId && m.is_active && (m.visit_type === 'both' || m.visit_type === visitType),
  )
  const availableStaff = store.staff.filter((s) => s.clinic_id === clinicId && s.is_active && s.is_bookable)

  // カレンダー: 月ごとに切り替え（全日表示）
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

  // 空き枠はサーバーで算出する。
  // 以前はブラウザが全予約を受け取って計算していたため、空きを知るためだけに
  // 他の患者の氏名と電話番号まで配信されていた。
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [slotsError, setSlotsError] = useState<string | null>(null)

  useEffect(() => {
    if (!clinic || !selectedMenu || !selectedDate) { setAvailableSlots([]); return }
    const controller = new AbortController()
    setSlotsLoading(true)
    setSlotsError(null)
    apiPost<{ slots: string[] }>('/api/v1/appointments/availability', {
      clinicId,
      menuId: selectedMenu.id,
      staffId: selectedStaff?.id ?? null,
      date: format(selectedDate, 'yyyy-MM-dd'),
    }, { signal: controller.signal })
      .then((res) => setAvailableSlots(res.slots))
      .catch((err) => {
        if (controller.signal.aborted) return
        setAvailableSlots([])
        setSlotsError(err instanceof ApiError ? err.message : '空き時間を取得できませんでした。')
      })
      .finally(() => { if (!controller.signal.aborted) setSlotsLoading(false) })
    return () => controller.abort()
  }, [clinic, clinicId, selectedMenu, selectedStaff, selectedDate])

  function goNext() {
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
  }
  function goBack() {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
    else router.push('/reserve')
  }

  async function handleConfirm() {
    if (!selectedMenu || !selectedDate || !selectedTime || !patientName) return
    setSubmitting(true)
    const date = format(selectedDate, 'yyyy-MM-dd')
    const startAt = new Date(`${date}T${selectedTime}:00`).toISOString()
    const endAt = new Date(
      new Date(`${date}T${selectedTime}:00`).getTime() + selectedMenu.duration_min * 60 * 1000,
    ).toISOString()

    const reservationData = {
      clinic_id: clinicId,
      staff_id: selectedStaff?.id ?? null,
      menu_id: selectedMenu.id,
      patient_name: patientName,
      patient_phone: normalizePhone(patientPhone),
      start_at: startAt,
      end_at: endAt,
      memo: memo || null,
      referral_name: referralSource === '紹介' ? referralName || null : null,
    }

    // 初診は問診内容もあわせて送る。再来は予約だけ
    const patientData = visitType === 'first'
      ? {
          name: patientName,
          name_kana: patientNameKana,
          gender: patientGender,
          birth_date: patientBirthDate || undefined,
          phone: normalizePhone(patientPhone),
          email: patientEmail,
          postal_code: patientPostalCode,
          address: patientAddress,
          chief_complaint: chiefComplaint,
          medical_history: medicalHistory,
          current_medications: currentMedications,
          allergies: allergies,
          referral_source: referralSource,
          referral_name: referralSource === '紹介' ? referralName || null : null,
        }
      : undefined

    // 枠が空いているかはサーバーで再確認される。
    // 画面に空きが出てから送信するまでの間に埋まった場合もここで弾かれる
    try {
      await apiPost('/api/intake', { patient: patientData, reservation: reservationData })
    } catch (err) {
      setSubmitting(false)
      if (err instanceof ApiError && err.code === 'APPOINTMENT_CONFLICT') {
        toast.error(err.message)
        setSelectedTime(null)
        setStep('time')
        return
      }
      toast.error(
        err instanceof ApiError
          ? `${err.message}（${err.supportCode}）`
          : '予約の送信に失敗しました。時間をおいて再度お試しください。',
      )
      return
    }

    setSubmitting(false)
    setStep('complete')
  }

  if (!clinic) {
    return <div className="p-8 text-center text-muted-foreground">院が見つかりません</div>
  }

  // 「次へ進む」が押せない理由。初診は主訴も必須
  const missingField =
    !patientName.trim() ? 'お名前'
    : !patientPhone.trim() ? '電話番号'
    : (visitType === 'first' && !chiefComplaint.trim()) ? '気になる症状'
    : null

  const currentStepIdx = STEPS.indexOf(step)
  const progress = Math.round((currentStepIdx / (STEPS.length - 2)) * 100)
  const visibleSteps = STEPS.filter((s) => s !== 'complete')

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-green-950/95 to-green-900/95 backdrop-blur-md text-white sticky top-0 z-20 shadow-md">
        <div className="max-w-lg mx-auto px-4 py-3.5 flex items-center gap-3">
          <button onClick={goBack} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-bold tracking-wide">{clinic.name}</p>
            {step !== 'complete' && (
              <p className="text-[11px] text-gold-300/90 tracking-wider mt-0.5">{STEP_LABELS[step]}</p>
            )}
          </div>
        </div>
        {step !== 'complete' && (
          <div className="h-[3px] bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-gold-500 to-gold-300 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </header>

      <div key={step} className="rs-step max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* お知らせ */}
        {step === 'visit_type' && clinicAnnouncements.length > 0 && (
          <AnnouncementBanners announcements={clinicAnnouncements} />
        )}

        {/* ステップドット */}
        {step !== 'complete' && (
          <div className="flex items-center justify-center gap-1.5 py-1">
            {visibleSteps.map((s, i) => (
              <div
                key={s}
                className={cn(
                  'rs-dot rounded-full',
                  s === step
                    ? 'w-6 h-2 bg-emerald-700'
                    : i < currentStepIdx
                    ? 'w-2 h-2 bg-emerald-400'
                    : 'w-2 h-2 bg-stone-300/70',
                )}
              />
            ))}
          </div>
        )}

        {/* Step: 初診・再来 */}
        {step === 'visit_type' && (
          <div className="space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-black text-emerald-950">はじめてのご来院ですか？</h2>
              <p className="text-sm text-stone-500 mt-1">該当するものを選んでください</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              {([
                { type: 'first', title: 'はじめて', sub: '初診' },
                { type: 'return', title: '2回目以降', sub: '再来' },
              ] as const).map(({ type, title, sub }) => (
                <button
                  key={type}
                  onClick={() => { setVisitType(type); goNext() }}
                  className="group rs-press rs-rise bg-white/72 backdrop-blur-md rounded-2xl border-2 border-stone-100 p-7 text-center hover:border-emerald-400 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <p className="text-xs font-bold text-stone-400 tracking-widest uppercase mb-1">{sub}</p>
                  <p className="text-lg font-black text-emerald-950">{title}</p>
                </button>
              ))}
            </div>
            {hasMerchandise && (
              <Link
                href={`/reserve/${clinicId}/merchandise`}
                className="flex items-center justify-between rs-press rs-rise bg-white/72 backdrop-blur-md rounded-2xl border border-pink-100 shadow-sm p-4 hover:border-pink-300 hover:shadow-md group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-50 to-pink-100 ring-1 ring-pink-200/60 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-950">物販を予約する</p>
                    <p className="text-xs text-muted-foreground mt-0.5">物販・グッズの事前予約はこちら</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-pink-300 group-hover:text-pink-600 transition-colors" />
              </Link>
            )}
          </div>
        )}

        {/* Step: メニュー */}
        {step === 'menu' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black text-emerald-950">メニューを選んでください</h2>
            </div>
            <div className="space-y-2.5">
              {availableMenus.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => { setSelectedMenu(m); goNext() }}
                  style={{ ['--rs-i' as string]: i }}
                  className="w-full rs-press rs-rise bg-white/72 backdrop-blur-md rounded-2xl border border-stone-100 p-4 text-left hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-emerald-950">{m.name}</p>
                      <p className="text-sm text-stone-500 mt-0.5">{m.duration_min}分</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-lg font-black text-emerald-800">¥{m.price.toLocaleString()}</span>
                      <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center">
                        <ChevronRight className="w-4 h-4 text-emerald-500" />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
              {availableMenus.length === 0 && (
                <p className="text-center text-stone-400 py-10">予約可能なメニューがありません</p>
              )}
            </div>
          </div>
        )}

        {/* Step: スタッフ */}
        {step === 'staff' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-emerald-950">担当者を選んでください</h2>
            <div className="space-y-2.5">
              <button
                onClick={() => { setSelectedStaff(null); goNext() }}
                className="w-full rs-press rs-rise bg-white/72 backdrop-blur-md rounded-2xl border border-stone-100 p-4 text-left hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-stone-500 text-xs font-bold">任意</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-emerald-950">指名なし（おまかせ）</p>
                    <p className="text-xs text-stone-400 mt-0.5">空いている担当者が対応します</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
                </div>
              </button>
              {availableStaff.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedStaff(s); goNext() }}
                  className="w-full rs-press rs-rise bg-white/72 backdrop-blur-md rounded-2xl border border-stone-100 p-4 text-left hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-emerald-800 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">{s.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-emerald-950">{s.name}</p>
                      {s.role && <p className="text-xs text-stone-400 mt-0.5">{s.role}</p>}
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: 日付 */}
        {step === 'date' && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-emerald-950">日付を選んでください</h2>
            <div className="bg-white/72 backdrop-blur-md rounded-2xl border border-stone-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCalendarOffset((o) => Math.max(0, o - 1))}
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-emerald-100 flex items-center justify-center transition-colors disabled:opacity-30" disabled={calendarOffset === 0}>
                  <ChevronLeft className="w-4 h-4 text-emerald-800" />
                </button>
                <span className="text-sm font-medium text-green-900">
                  {format(calendarData.firstOfMonth, 'yyyy年M月', { locale: ja })}
                </span>
                <button onClick={() => setCalendarOffset((o) => o + 1)}
                  className="w-8 h-8 rounded-full bg-stone-100 hover:bg-emerald-100 flex items-center justify-center transition-colors">
                  <ChevronRight className="w-4 h-4 text-emerald-800" />
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
                  const isTooFar = day > addDays(new Date(), settings.maxAdvanceBookingDays)
                  const closure = closedDaysStore.getClosureForDate(day, clinicId)
                  const isAllDayClosed = closure?.allDay === true
                  const isPartialClosed = !!closure && !closure.allDay
                  const isDisabled = isPast || isTooFar || isAllDayClosed
                  return (
                    <button
                      key={day.toISOString()}
                      disabled={isDisabled}
                      onClick={() => { setSelectedDate(day); goNext() }}
                      className={cn(
                        'relative rounded-lg py-2.5 text-sm font-medium transition-all',
                        isDisabled
                          ? isAllDayClosed
                            ? 'bg-red-50 text-red-300 cursor-not-allowed'
                            : 'text-gray-300 cursor-not-allowed'
                          : 'hover:bg-green-100',
                        isSameDay(day, new Date()) && !isDisabled && 'border border-green-500',
                        selectedDate && isSameDay(day, selectedDate) && 'bg-green-700 text-white hover:bg-green-800',
                        !isDisabled && dow === 0 && 'text-red-500',
                        !isDisabled && dow === 6 && 'text-blue-500',
                        selectedDate && isSameDay(day, selectedDate) && 'text-white',
                      )}
                    >
                      {format(day, 'd')}
                      {isPartialClosed && !isDisabled && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-400" />
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-red-50 border border-red-200 inline-block" />
                  終日休診
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                  部分休診あり
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step: 時間 */}
        {step === 'time' && selectedDate && selectedMenu && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black text-emerald-950">時間を選んでください</h2>
              <p className="text-sm text-stone-500 mt-1">{format(selectedDate, 'M月d日（E）', { locale: ja })}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {availableSlots.map((t, i) => (
                <button
                  key={t}
                  onClick={() => { setSelectedTime(t); goNext() }}
                  style={{ ['--rs-i' as string]: i }}
                  className="rs-press rs-rise bg-white/72 backdrop-blur-md border border-stone-100 rounded-2xl py-3.5 text-center font-bold text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md"
                >
                  {t}
                </button>
              ))}
              {/* 空き枠はサーバーへ問い合わせる。取得中に「空きなし」と出さない */}
              {slotsLoading && (
                <div className="col-span-3 py-10 text-center text-stone-400 text-sm flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                  空き時間を確認しています
                </div>
              )}
              {!slotsLoading && slotsError && (
                <div className="col-span-3 py-8 text-center space-y-3">
                  <p className="text-sm text-red-600">{slotsError}</p>
                  <button
                    type="button"
                    onClick={() => setSelectedDate(selectedDate ? new Date(selectedDate) : null)}
                    className="rs-press text-sm font-semibold text-emerald-800 underline underline-offset-2"
                  >
                    もう一度試す
                  </button>
                </div>
              )}
              {!slotsLoading && !slotsError && availableSlots.length === 0 && (
                <div className="col-span-3 py-10 text-center text-stone-400 text-sm">
                  この日は空き枠がありません
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step: 患者情報 */}
        {step === 'info' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black text-emerald-950">
                {visitType === 'first' ? '問診票の入力' : '患者情報の入力'}
              </h2>
              {visitType === 'first' && (
                <p className="text-sm text-stone-500 mt-1">
                  院内でのご記入も可能です
                </p>
              )}
            </div>
            <div className="bg-white/72 backdrop-blur-md rounded-2xl border border-stone-100 p-5 space-y-4 shadow-sm">
              {/* 基本情報 - 共通 */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-semibold text-stone-700">お名前 <span className="text-red-400">*</span></Label>
                <Input id="name" value={patientName} onChange={(e) => setPatientName(e.target.value)}
                  placeholder="山田 太郎" className="h-11 rounded-xl border-stone-200 focus:border-emerald-400" />
              </div>

              {visitType === 'first' && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="name-kana" className="text-sm font-semibold text-stone-700">フリガナ</Label>
                    <Input id="name-kana" value={patientNameKana}
                      onChange={(e) => setPatientNameKana(e.target.value)}
                      placeholder="ヤマダ タロウ" className="h-11 rounded-xl border-stone-200 focus:border-emerald-400" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold text-stone-700">性別</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {([['male', '男性'], ['female', '女性'], ['other', 'その他'], ['unknown', '回答しない']] as const).map(([v, label]) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setPatientGender(v)}
                          className={cn(
                            'rounded-xl border py-2 text-xs font-semibold transition-all',
                            patientGender === v
                              ? 'border-emerald-700 bg-emerald-800 text-white'
                              : 'border-stone-200 bg-white text-stone-600 hover:border-emerald-300',
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="birth-date" className="text-sm font-semibold text-stone-700">生年月日</Label>
                    <Input id="birth-date" type="date" value={patientBirthDate}
                      onChange={(e) => setPatientBirthDate(e.target.value)} className="h-11 rounded-xl border-stone-200" />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-semibold text-stone-700">電話番号 <span className="text-red-400">*</span></Label>
                <Input id="phone" value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="090-0000-0000" type="tel" inputMode="tel" className="h-11 rounded-xl border-stone-200 focus:border-emerald-400" />
                <p className="text-xs text-stone-400">ご予約の変更やご連絡に使用します</p>
              </div>

              {visitType === 'first' && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-semibold text-stone-700">メールアドレス</Label>
                    <Input id="email" type="email" value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      placeholder="example@mail.com" className="h-11 rounded-xl border-stone-200 focus:border-emerald-400" />
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="postal-code" className="text-sm font-semibold text-stone-700">郵便番号</Label>
                      <Input id="postal-code" value={patientPostalCode}
                        onChange={(e) => setPatientPostalCode(e.target.value)}
                        placeholder="000-0000" className="h-11 rounded-xl border-stone-200" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="address" className="text-sm font-semibold text-stone-700">住所</Label>
                      <Input id="address" value={patientAddress}
                        onChange={(e) => setPatientAddress(e.target.value)}
                        placeholder="都道府県・市区町村・番地" className="h-11 rounded-xl border-stone-200" />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100">
                    <p className="text-xs font-bold text-emerald-700 tracking-wider uppercase mb-3">問診内容</p>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="chief-complaint" className="text-sm font-semibold text-stone-700">
                          主な症状・お悩み <span className="text-red-400">*</span>
                        </Label>
                        <Textarea id="chief-complaint" value={chiefComplaint}
                          onChange={(e) => setChiefComplaint(e.target.value)}
                          placeholder="腰痛・肩こり・頭痛など" rows={2} className="rounded-xl border-stone-200" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="medical-history" className="text-sm font-semibold text-stone-700">既往歴</Label>
                        <Textarea id="medical-history" value={medicalHistory}
                          onChange={(e) => setMedicalHistory(e.target.value)}
                          placeholder="過去の病気・手術歴など（ない場合は空欄）" rows={2} className="rounded-xl border-stone-200" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="medications" className="text-sm font-semibold text-stone-700">現在服用中のお薬</Label>
                        <Input id="medications" value={currentMedications}
                          onChange={(e) => setCurrentMedications(e.target.value)}
                          placeholder="薬品名（ない場合は空欄）" className="h-11 rounded-xl border-stone-200" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="allergies" className="text-sm font-semibold text-stone-700">アレルギー</Label>
                        <Input id="allergies" value={allergies}
                          onChange={(e) => setAllergies(e.target.value)}
                          placeholder="食品・薬品・金属など（ない場合は空欄）" className="h-11 rounded-xl border-stone-200" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold text-stone-700">来院のきっかけ</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {['紹介', 'インターネット', 'SNS', 'チラシ', '通りがかり', 'その他'].map((src) => (
                            <button
                              key={src}
                              type="button"
                              onClick={() => {
                                const next = src === referralSource ? '' : src
                                setReferralSource(next)
                                if (next !== '紹介') setReferralName('')
                              }}
                              className={cn(
                                'rounded-xl border py-2 text-xs font-semibold transition-all',
                                referralSource === src
                                  ? 'border-emerald-700 bg-emerald-800 text-white'
                                  : 'border-stone-200 bg-white text-stone-600 hover:border-emerald-300',
                              )}
                            >
                              {src}
                            </button>
                          ))}
                        </div>
                        {referralSource === '紹介' && (
                          <div className="space-y-1.5 pt-1">
                            <Label htmlFor="referral-name" className="text-sm font-semibold text-stone-700">紹介者のお名前</Label>
                            <Input
                              id="referral-name"
                              value={referralName}
                              onChange={(e) => setReferralName(e.target.value)}
                              placeholder="山田 太郎"
                              className="h-11 rounded-xl border-stone-200"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {visitType === 'return' && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="memo" className="text-sm font-semibold text-stone-700">今回の症状・ご要望（任意）</Label>
                    <Textarea id="memo" value={memo} onChange={(e) => setMemo(e.target.value)}
                      placeholder="腰痛・肩こり など" rows={3} className="rounded-xl border-stone-200" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-stone-700">ご紹介の方はいますか？（任意）</Label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const next = referralSource === '紹介' ? '' : '紹介'
                          setReferralSource(next)
                          if (next !== '紹介') setReferralName('')
                        }}
                        className={cn(
                          'rounded-xl border px-4 py-2 text-sm font-semibold transition-all',
                          referralSource === '紹介'
                            ? 'border-emerald-700 bg-emerald-800 text-white'
                            : 'border-stone-200 bg-white text-stone-600 hover:border-emerald-300',
                        )}
                      >
                        紹介あり
                      </button>
                      {referralSource === '紹介' && (
                        <Input
                          value={referralName}
                          onChange={(e) => setReferralName(e.target.value)}
                          placeholder="紹介者のお名前"
                          className="h-10 flex-1 rounded-xl border-stone-200"
                        />
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            {/* 押せない理由を出さないと、何が足りないのか分からないまま止まってしまう */}
            {missingField && (
              <p className="text-center text-sm text-stone-500">{missingField}をご入力ください</p>
            )}
            <button
              className={cn(
                'w-full h-12 rounded-2xl text-base font-bold transition-all',
                missingField
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-emerald-800 text-white hover:bg-emerald-700 active:scale-[0.99]',
              )}
              disabled={!!missingField}
              onClick={goNext}
            >
              次へ進む
            </button>
          </div>
        )}

        {/* Step: 確認 */}
        {step === 'confirm' && selectedMenu && selectedDate && selectedTime && (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-emerald-950">予約内容をご確認ください</h2>
            <div className="bg-white/72 backdrop-blur-md rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-emerald-600 to-emerald-400" />
              <div className="px-5 py-4 border-b border-stone-100">
                <p className="font-bold text-emerald-950">{clinic.name}</p>
              </div>
              <div className="p-5 space-y-3 text-sm">
                <Row label="日時" value={`${format(selectedDate, 'M月d日（E）', { locale: ja })} ${selectedTime} - ${
                  (() => {
                    const [h, m] = selectedTime.split(':').map(Number)
                    const end = new Date(2000, 0, 1, h, m + selectedMenu.duration_min)
                    return format(end, 'HH:mm')
                  })()
                }`} />
                <Row label="メニュー" value={`${selectedMenu.name}（${selectedMenu.duration_min}分）`} />
                <Row label="料金" value={`¥${selectedMenu.price.toLocaleString()}`} />
                <Row label="担当" value={selectedStaff?.name ?? 'おまかせ'} />
                <Row label="お名前" value={patientName} />
                <Row label="電話番号" value={patientPhone} />
                {memo && <Row label="ご要望" value={memo} />}
                {referralSource === '紹介' && referralName && (
                  <Row label="紹介者" value={`${referralName}様`} />
                )}
              </div>
            </div>
            {visitType === 'first' && (
              <div className="bg-white/72 backdrop-blur-md rounded-2xl border border-stone-100 p-5 space-y-2.5 text-sm shadow-sm">
                <p className="text-xs font-bold text-emerald-700 tracking-wider uppercase mb-3">問診情報</p>
                {patientNameKana && <Row label="フリガナ" value={patientNameKana} />}
                {patientGender !== 'unknown' && <Row label="性別" value={{ male: '男性', female: '女性', other: 'その他', unknown: '' }[patientGender]} />}
                {patientBirthDate && <Row label="生年月日" value={patientBirthDate} />}
                {patientEmail && <Row label="メール" value={patientEmail} />}
                {chiefComplaint && <Row label="主な症状" value={chiefComplaint} />}
                {referralSource && (
                  <Row
                    label="来院のきっかけ"
                    value={referralSource === '紹介' && referralName ? `紹介（${referralName}様）` : referralSource}
                  />
                )}
              </div>
            )}
            <button
              className={cn(
                'w-full h-12 rounded-2xl text-base font-bold transition-all',
                submitting
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-emerald-800 text-white hover:bg-emerald-700 active:scale-[0.99]',
              )}
              onClick={handleConfirm}
              disabled={submitting}
            >
              {submitting ? '送信中...' : '予約を確定する'}
            </button>
          </div>
        )}

        {/* Step: 完了 */}
        {step === 'complete' && (
          <div className="py-8 space-y-5">
            <div className="text-center space-y-3">
              {/* 完了の手応え：広がる輪 → チェックが描かれる → 花びらが舞う */}
              <div className="relative w-20 h-20 mx-auto">
                <span aria-hidden className="rs-ring absolute inset-0 rounded-full border-2 border-emerald-400" />
                <span aria-hidden className="rs-ring absolute inset-0 rounded-full border-2 border-emerald-300" style={{ animationDelay: '0.6s' }} />
                <div className="relative w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center shadow-sm">
                  <svg className="rs-check w-10 h-10" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M4.5 12.5l5 5 10-11" stroke="rgb(4 120 87)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                {PETALS.map((petal, i) => (
                  <span
                    key={i}
                    aria-hidden
                    className="rs-petal"
                    style={{
                      background: petal.color,
                      ['--rs-i' as string]: i,
                      ['--rs-x' as string]: `${petal.x}px`,
                      ['--rs-r' as string]: `${petal.rotate}deg`,
                    }}
                  />
                ))}
              </div>
              <h2 className="text-2xl font-black text-emerald-950">予約が完了しました</h2>
              <p className="text-stone-500 text-sm">ご予約ありがとうございます</p>
            </div>

            {/* 予約サマリー */}
            {selectedDate && selectedMenu && selectedTime && (
              <div className="bg-white/72 backdrop-blur-md rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-emerald-600 to-emerald-400" />
                <div className="p-5 space-y-2.5">
                  <p className="text-xs font-bold text-emerald-700 tracking-wider uppercase mb-3">予約内容</p>
                  <p className="font-bold text-emerald-950">{clinic.name}</p>
                  <div className="text-sm text-stone-600 space-y-1.5">
                    <p className="font-semibold text-emerald-900">{format(selectedDate, 'M月d日（E）', { locale: ja })}　{selectedTime}〜</p>
                    <p>{selectedMenu.name}（{selectedMenu.duration_min}分）</p>
                    {selectedStaff && <p>担当: {selectedStaff.name}</p>}
                    {patientName && <p>お名前: {patientName}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* LINEで保存ボタン */}
            {selectedDate && selectedMenu && selectedTime && (
              <a
                href={`https://line.me/R/msg/text/?${encodeURIComponent(
                  [
                    '【予約確認】',
                    clinic.name,
                    `${format(selectedDate, 'M月d日（E）', { locale: ja })} ${selectedTime}〜`,
                    selectedMenu.name,
                    selectedStaff ? `担当: ${selectedStaff.name}` : null,
                    patientName ? `お名前: ${patientName}` : null,
                  ].filter(Boolean).join('\n'),
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#06C755] text-white font-bold text-sm hover:opacity-90 active:scale-[0.99] transition-all"
              >
                LINEで予約内容を保存する
              </a>
            )}

            {/* 来院までの待ち時間に、整骨院らしいセルフケアを案内する */}
            <SelfCareGuide />

            {clinic.phone && (
              <p className="text-xs text-center text-stone-400">
                ご不明な点は <span className="font-semibold text-emerald-800">{clinic.phone}</span> までお電話ください
              </p>
            )}

            <button
              onClick={() => router.push('/reserve')}
              className="w-full h-11 rounded-2xl border-2 border-stone-200 text-stone-600 font-semibold text-sm hover:border-emerald-300 hover:text-emerald-800 transition-all"
            >
              TOPに戻る
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-stone-400 flex-shrink-0">{label}</span>
      <span className="text-right font-semibold text-emerald-950">{value}</span>
    </div>
  )
}
