'use client'

import { useState, useEffect } from 'react'
import type { Reservation, ReservationFormData, Staff, Menu, Clinic } from '@/types/clinic'
import { RESERVATION_STATUS_LABELS } from '@/types/clinic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { format, parseISO, addMinutes } from 'date-fns'
import { usePatientStore, patientStore } from '@/lib/patient-store'
import { Search, UserCheck } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: Reservation | null
  clinics: Clinic[]
  staff: Staff[]
  menus: Menu[]
  defaultDate?: string
  defaultStartTime?: string
  defaultStaffId?: string
  defaultClinicId?: string
  onSubmit: (data: ReservationFormData) => void
}

function toLocalDatetime(iso: string) {
  try { return format(parseISO(iso), "yyyy-MM-dd'T'HH:mm") } catch { return '' }
}

function buildISO(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString()
}

export function ReservationForm({
  open, onOpenChange, initial, clinics, staff, menus,
  defaultDate, defaultStartTime, defaultStaffId, defaultClinicId, onSubmit,
}: Props) {
  const allPatients = usePatientStore()
  const [clinicId, setClinicId] = useState(defaultClinicId ?? clinics[0]?.id ?? '')
  const [staffId, setStaffId] = useState(defaultStaffId ?? '')
  const [menuId, setMenuId] = useState('')
  const [patientId, setPatientId] = useState<string | null>(null)
  const [patientName, setPatientName] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [referralName, setReferralName] = useState('')
  const [patientSearch, setPatientSearch] = useState('')
  const [showPatientSearch, setShowPatientSearch] = useState(false)
  const [startDate, setStartDate] = useState(defaultDate ?? format(new Date(), 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState(defaultStartTime ?? '09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [status, setStatus] = useState<Reservation['status']>('confirmed')
  const [memo, setMemo] = useState('')

  const searchedPatients = patientSearch.length >= 1
    ? patientStore.search(patientSearch, clinicId || undefined).slice(0, 6)
    : []

  function selectPatient(p: ReturnType<typeof patientStore.getAll>[number]) {
    setPatientId(p.id)
    setPatientName(p.name)
    setPatientPhone(p.phone ?? '')
    setPatientSearch('')
    setShowPatientSearch(false)
  }

  function clearPatient() {
    setPatientId(null)
    setPatientName('')
    setPatientPhone('')
  }

  useEffect(() => {
    if (initial) {
      setClinicId(initial.clinic_id)
      setStaffId(initial.staff_id ?? '')
      setMenuId(initial.menu_id ?? '')
      setPatientId(initial.patient_id)
      setPatientName(initial.patient_name)
      setPatientPhone(initial.patient_phone ?? '')
      setReferralName(initial.referral_name ?? '')
      const st = parseISO(initial.start_at)
      const et = parseISO(initial.end_at)
      setStartDate(format(st, 'yyyy-MM-dd'))
      setStartTime(format(st, 'HH:mm'))
      setEndTime(format(et, 'HH:mm'))
      setStatus(initial.status)
      setMemo(initial.memo ?? '')
    } else {
      setClinicId(defaultClinicId ?? clinics[0]?.id ?? '')
      setStaffId(defaultStaffId ?? '')
      setMenuId('')
      setPatientId(null)
      setPatientName('')
      setPatientPhone('')
      setReferralName('')
      setStartDate(defaultDate ?? format(new Date(), 'yyyy-MM-dd'))
      setStartTime(defaultStartTime ?? '09:00')
      setEndTime(calcEndTime(defaultStartTime ?? '09:00', 60))
      setStatus('confirmed')
      setMemo('')
    }
    setPatientSearch('')
    setShowPatientSearch(false)
  }, [open, initial])

  function calcEndTime(start: string, durationMin: number): string {
    try {
      const [h, m] = start.split(':').map(Number)
      const base = new Date(2000, 0, 1, h, m)
      const end = addMinutes(base, durationMin)
      return format(end, 'HH:mm')
    } catch { return start }
  }

  function handleMenuChange(mId: string) {
    setMenuId(mId)
    const menu = menus.find((m) => m.id === mId)
    if (menu) setEndTime(calcEndTime(startTime, menu.duration_min))
  }

  function handleStartTimeChange(t: string) {
    setStartTime(t)
    const menu = menus.find((m) => m.id === menuId)
    if (menu) setEndTime(calcEndTime(t, menu.duration_min))
  }

  const filteredStaff = staff.filter((s) => s.clinic_id === clinicId && s.is_active)
  const filteredMenus = menus.filter((m) => m.clinic_id === clinicId && m.is_active)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientName.trim() || !clinicId) return
    onSubmit({
      clinic_id: clinicId,
      staff_id: staffId || null,
      menu_id: menuId || null,
      patient_id: patientId,
      patient_name: patientName,
      patient_phone: patientPhone || null,
      referral_name: referralName || null,
      start_at: buildISO(startDate, startTime),
      end_at: buildISO(startDate, endTime),
      status,
      memo: memo || null,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? '予約を編集' : '予約を追加'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 患者選択 */}
          <div className="space-y-1.5">
            <Label>患者 *</Label>
            {patientId ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 border border-green-200">
                  <UserCheck className="w-4 h-4 text-green-700 flex-shrink-0" />
                  <span className="text-sm font-medium text-green-900 flex-1">{patientName}</span>
                  {patientPhone && <span className="text-xs text-muted-foreground">{patientPhone}</span>}
                  <button type="button" onClick={clearPatient} className="text-xs text-muted-foreground hover:text-red-600 ml-1">変更</button>
                </div>
                <Input value={referralName} onChange={(e) => setReferralName(e.target.value)} placeholder="紹介者氏名（任意）" />
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={patientSearch}
                    onChange={(e) => { setPatientSearch(e.target.value); setShowPatientSearch(true) }}
                    onFocus={() => setShowPatientSearch(true)}
                    placeholder="患者名・フリガナ・電話番号で検索..."
                    className="pl-8"
                  />
                </div>
                {showPatientSearch && searchedPatients.length > 0 && (
                  <div className="border border-border rounded-lg shadow-md bg-white z-50 overflow-hidden">
                    {searchedPatients.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectPatient(p)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-green-50 text-left border-b border-green-50 last:border-0"
                      >
                        <div>
                          <span className="font-medium text-green-900">{p.name}</span>
                          <span className="text-muted-foreground ml-2 text-xs">{p.name_kana}</span>
                        </div>
                        {p.phone && <span className="text-xs text-muted-foreground ml-auto">{p.phone}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {patientSearch && searchedPatients.length === 0 && showPatientSearch && (
                  <p className="text-xs text-muted-foreground px-1">患者が見つかりません。新患として入力してください。</p>
                )}
                {/* 新患として直接入力 */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Input value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="氏名（直接入力）" required={!patientId} />
                  <Input value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} placeholder="電話番号" />
                </div>
                <Input value={referralName} onChange={(e) => setReferralName(e.target.value)} placeholder="紹介者氏名（任意）" />
              </div>
            )}
          </div>

          {/* 院・スタッフ・メニュー */}
          <div className="space-y-1.5">
            <Label>院 *</Label>
            <Select value={clinicId} onValueChange={setClinicId}>
              <SelectTrigger><SelectValue placeholder="院を選択" /></SelectTrigger>
              <SelectContent>
                {clinics.filter((c) => c.is_active).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>担当スタッフ</Label>
              <Select value={staffId} onValueChange={setStaffId}>
                <SelectTrigger><SelectValue placeholder="未指定" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">未指定</SelectItem>
                  {filteredStaff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>メニュー</Label>
              <Select value={menuId} onValueChange={handleMenuChange}>
                <SelectTrigger><SelectValue placeholder="未指定" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">未指定</SelectItem>
                  {filteredMenus.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.name}（{m.duration_min}分）</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 日時 */}
          <div className="space-y-1.5">
            <Label htmlFor="res-date">予約日 *</Label>
            <Input id="res-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="res-start">開始時間 *</Label>
              <Input id="res-start" type="time" value={startTime} onChange={(e) => handleStartTimeChange(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="res-end">終了時間 *</Label>
              <Input id="res-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </div>
          </div>

          {/* ステータス */}
          {initial && (
            <div className="space-y-1.5">
              <Label>ステータス</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Reservation['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(RESERVATION_STATUS_LABELS) as [Reservation['status'], string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* メモ */}
          <div className="space-y-1.5">
            <Label htmlFor="res-memo">メモ</Label>
            <Textarea id="res-memo" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="症状・注意事項など" rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
            <Button type="submit">{initial ? '更新' : '予約追加'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
