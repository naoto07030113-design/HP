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

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: Reservation | null
  clinics: Clinic[]
  staff: Staff[]
  menus: Menu[]
  defaultDate?: string       // "yyyy-MM-dd"
  defaultStartTime?: string  // "HH:mm"
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
  const [clinicId, setClinicId] = useState(defaultClinicId ?? clinics[0]?.id ?? '')
  const [staffId, setStaffId] = useState(defaultStaffId ?? '')
  const [menuId, setMenuId] = useState('')
  const [patientName, setPatientName] = useState('')
  const [patientPhone, setPatientPhone] = useState('')
  const [startDate, setStartDate] = useState(defaultDate ?? format(new Date(), 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState(defaultStartTime ?? '09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [status, setStatus] = useState<Reservation['status']>('confirmed')
  const [memo, setMemo] = useState('')

  useEffect(() => {
    if (initial) {
      setClinicId(initial.clinic_id)
      setStaffId(initial.staff_id ?? '')
      setMenuId(initial.menu_id ?? '')
      setPatientName(initial.patient_name)
      setPatientPhone(initial.patient_phone ?? '')
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
      setPatientName('')
      setPatientPhone('')
      setStartDate(defaultDate ?? format(new Date(), 'yyyy-MM-dd'))
      setStartTime(defaultStartTime ?? '09:00')
      setEndTime(calcEndTime(defaultStartTime ?? '09:00', 60))
      setStatus('confirmed')
      setMemo('')
    }
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
      patient_id: null,
      patient_name: patientName,
      patient_phone: patientPhone || null,
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
          {/* 患者情報 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label htmlFor="patient-name">患者名 *</Label>
              <Input id="patient-name" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="山本 太郎" required />
            </div>
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <Label htmlFor="patient-phone">電話番号</Label>
              <Input id="patient-phone" value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} placeholder="090-0000-0000" />
            </div>
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
