'use client'

import { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format, isSameDay, parseISO } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, ChevronRight, Check, ArrowLeft, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import { useClinicStore, reservationsStore } from '@/lib/clinic-store'
import { useMerchandiseStore } from '@/lib/merchandise-store'
import { useAnnouncementsStore, announcementsStore } from '@/lib/announcement-store'
import { useClosedDaysStore, closedDaysStore } from '@/lib/closed-days-store'
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
    if (r.status === 'cancelled' || r.status === 'no_show') return false
    if (staffId && r.staff_id !== staffId) return false
    // Compare in local time to avoid UTC-vs-JST mismatch
    const rStartDate = parseISO(r.start_at)
    const rEndDate = parseISO(r.end_at)
    if (format(rStartDate, 'yyyy-MM-dd') !== date) return false
    const rStart = rStartDate.getHours() * 60 + rStartDate.getMinutes()
    const rEnd = rEndDate.getHours() * 60 + rEndDate.getMinutes()
    return startMin < rEnd && endMin > rStart
  })
}

export default function ReserveClinicPage() {
  const params = useParams()
  const clinicId = String(params.clinicId)
  const store = useClinicStore()
  const announcements = useAnnouncementsStore()
  useClosedDaysStore()
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

  // 利用可能時間帯（休診時間帯を除外）
  const availableSlots = useMemo(() => {
    if (!clinic || !selectedMenu || !selectedDate) return []
    const date = format(selectedDate, 'yyyy-MM-dd')
    const slots = generateTimeSlots(clinic.open_time, clinic.close_time, selectedMenu.duration_min)
    const closure = closedDaysStore.getClosureForDate(selectedDate, clinicId)
    return slots.filter((t) => {
      if (!isSlotAvailable(date, t, selectedStaff?.id ?? null, selectedMenu.duration_min, store.reservations)) {
        return false
      }
      if (closure && !closure.allDay && closure.closedFrom && closure.closedTo) {
        const slotMin = timeToMinutes(t)
        const fromMin = timeToMinutes(closure.closedFrom)
        const toMin = timeToMinutes(closure.closedTo)
        if (slotMin >= fromMin && slotMin < toMin) return false
      }
      return true
    })
  }, [clinic, clinicId, selectedMenu, selectedStaff, selectedDate, store.reservations])

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
      patient_phone: patientPhone || null,
      start_at: startAt,
      end_at: endAt,
      memo: memo || null,
    }

    if (visitType === 'first') {
      const patientData = {
        name: patientName,
        name_kana: patientNameKana,
        gender: patientGender,
        birth_date: patientBirthDate || undefined,
        phone: patientPhone,
        email: patientEmail,
        postal_code: patientPostalCode,
        address: patientAddress,
        chief_complaint: chiefComplaint,
        medical_history: medicalHistory,
        current_medications: currentMedications,
        allergies: allergies,
        referral_source: referralSource,
      }
      try {
        const res = await fetch('/api/intake', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patient: patientData, reservation: reservationData }),
        })
        if (!res.ok) throw new Error('送信エラー')
      } catch {
        setSubmitting(false)
        return
      }
    } else {
      await reservationsStore.create({
        ...reservationData,
        patient_id: null,
        referral_name: null,
        status: 'confirmed',
      })
    }
    setSubmitting(false)
    setStep('complete')
  }

  if (!clinic) {
    return <div className="p-8 text-center text-muted-foreground">院が見つかりません</div>
  }

  const currentStepIdx = STEPS.indexOf(step)
  const progress = Math.round((currentStepIdx / (STEPS.length - 2)) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(var(--surface))] to-white">
      {/* ヘッダー */}
      <header className="bg-gradient-to-r from-green-950 to-green-900 text-white sticky top-0 z-10 shadow-md">
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
        {/* プログレスバー */}
        {step !== 'complete' && (
          <div className="h-[3px] bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-gold-500 to-gold-300 transition-all duration-500 ease-out"
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
                  <div className="font-bold text-green-900 text-base">
                    {vt === 'first' ? '初診（はじめて）' : '再来（2回目以降）'}
                  </div>
                </button>
              ))}
            </div>
            {hasMerchandise && (
              <Link
                href={`/reserve/${clinicId}/merchandise`}
                className="flex items-center justify-between bg-white rounded-2xl border border-pink-100 shadow-sm p-4 hover:border-pink-300 hover:shadow-md transition-all group"
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
                  {format(calendarData.firstOfMonth, 'yyyy年M月', { locale: ja })}
                </span>
                <button onClick={() => setCalendarOffset((o) => o + 1)} className="p-1 rounded hover:bg-green-50">
                  <ChevronRight className="w-5 h-5 text-green-700" />
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
                {calendarData.cells.map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} />
                  const dow = day.getDay()
                  const isPast = day < new Date(new Date().setHours(0, 0, 0, 0))
                  const closure = closedDaysStore.getClosureForDate(day, clinicId)
                  const isAllDayClosed = closure?.allDay === true
                  const isPartialClosed = !!closure && !closure.allDay
                  const isDisabled = isPast || isAllDayClosed
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
            <div>
              <h2 className="text-lg font-bold text-green-900">
                {visitType === 'first' ? '問診票の入力' : '患者情報を入力してください'}
              </h2>
              {visitType === 'first' && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  初診の方は問診票の入力をお願いします。院内でのご記入も可能です。
                </p>
              )}
            </div>
            <div className="bg-white rounded-xl border border-border p-4 space-y-4">
              {/* 基本情報 - 共通 */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-semibold">お名前 <span className="text-red-500">*</span></Label>
                <Input id="name" value={patientName} onChange={(e) => setPatientName(e.target.value)}
                  placeholder="山田 太郎" className="h-10" />
              </div>

              {visitType === 'first' && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="name-kana" className="text-sm font-semibold">フリガナ</Label>
                    <Input id="name-kana" value={patientNameKana}
                      onChange={(e) => setPatientNameKana(e.target.value)}
                      placeholder="ヤマダ タロウ" className="h-10" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-semibold">性別</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {([['male', '男性'], ['female', '女性'], ['other', 'その他'], ['unknown', '回答しない']] as const).map(([v, label]) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setPatientGender(v)}
                          className={cn(
                            'rounded-lg border py-2 text-sm font-medium transition-all',
                            patientGender === v
                              ? 'border-green-600 bg-green-700 text-white'
                              : 'border-border bg-white hover:border-green-300 hover:bg-green-50',
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="birth-date" className="text-sm font-semibold">生年月日</Label>
                    <Input id="birth-date" type="date" value={patientBirthDate}
                      onChange={(e) => setPatientBirthDate(e.target.value)} className="h-10" />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-semibold">電話番号</Label>
                <Input id="phone" value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="090-0000-0000" type="tel" className="h-10" />
              </div>

              {visitType === 'first' && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-semibold">メールアドレス</Label>
                    <Input id="email" type="email" value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      placeholder="example@mail.com" className="h-10" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="postal-code" className="text-sm font-semibold">郵便番号</Label>
                      <Input id="postal-code" value={patientPostalCode}
                        onChange={(e) => setPatientPostalCode(e.target.value)}
                        placeholder="000-0000" className="h-10" />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label htmlFor="address" className="text-sm font-semibold">住所</Label>
                      <Input id="address" value={patientAddress}
                        onChange={(e) => setPatientAddress(e.target.value)}
                        placeholder="都道府県・市区町村・番地" className="h-10" />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-green-50">
                    <p className="text-xs font-semibold text-green-700 mb-3">問診内容</p>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="chief-complaint" className="text-sm font-semibold">
                          主な症状・お悩み <span className="text-red-500">*</span>
                        </Label>
                        <Textarea id="chief-complaint" value={chiefComplaint}
                          onChange={(e) => setChiefComplaint(e.target.value)}
                          placeholder="腰痛・肩こり・頭痛など" rows={2} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="medical-history" className="text-sm font-semibold">既往歴</Label>
                        <Textarea id="medical-history" value={medicalHistory}
                          onChange={(e) => setMedicalHistory(e.target.value)}
                          placeholder="過去の病気・手術歴など（ない場合は空欄）" rows={2} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="medications" className="text-sm font-semibold">現在服用中のお薬</Label>
                        <Input id="medications" value={currentMedications}
                          onChange={(e) => setCurrentMedications(e.target.value)}
                          placeholder="薬品名（ない場合は空欄）" className="h-10" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="allergies" className="text-sm font-semibold">アレルギー</Label>
                        <Input id="allergies" value={allergies}
                          onChange={(e) => setAllergies(e.target.value)}
                          placeholder="食品・薬品・金属など（ない場合は空欄）" className="h-10" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold">来院のきっかけ</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {['紹介', 'インターネット', 'SNS', 'チラシ', '通りがかり', 'その他'].map((src) => (
                            <button
                              key={src}
                              type="button"
                              onClick={() => setReferralSource(src === referralSource ? '' : src)}
                              className={cn(
                                'rounded-lg border py-2 text-xs font-medium transition-all',
                                referralSource === src
                                  ? 'border-green-600 bg-green-700 text-white'
                                  : 'border-border bg-white hover:border-green-300',
                              )}
                            >
                              {src}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {visitType === 'return' && (
                <div className="space-y-1.5">
                  <Label htmlFor="memo" className="text-sm font-semibold">今回の症状・ご要望（任意）</Label>
                  <Textarea id="memo" value={memo} onChange={(e) => setMemo(e.target.value)}
                    placeholder="腰痛・肩こり など" rows={3} />
                </div>
              )}
            </div>
            <Button
              className="w-full h-12 text-base"
              disabled={!patientName.trim() || (visitType === 'first' && !chiefComplaint.trim())}
              onClick={goNext}
            >
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
            {visitType === 'first' && (
              <div className="bg-white rounded-xl border border-border p-4 space-y-2 text-sm">
                <p className="font-semibold text-green-800 mb-1">問診情報</p>
                {patientNameKana && <Row label="フリガナ" value={patientNameKana} />}
                {patientGender !== 'unknown' && <Row label="性別" value={{ male: '男性', female: '女性', other: 'その他', unknown: '' }[patientGender]} />}
                {patientBirthDate && <Row label="生年月日" value={patientBirthDate} />}
                {patientEmail && <Row label="メール" value={patientEmail} />}
                {chiefComplaint && <Row label="主な症状" value={chiefComplaint} />}
                {referralSource && <Row label="来院のきっかけ" value={referralSource} />}
              </div>
            )}
            <Button className="w-full h-12 text-base font-bold" onClick={handleConfirm} disabled={submitting}>
              {submitting ? '送信中...' : '予約を確定する'}
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
