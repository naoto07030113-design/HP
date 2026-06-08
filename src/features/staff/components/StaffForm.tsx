'use client'

import { useState } from 'react'
import type { Staff, StaffFormData, Clinic } from '@/types/clinic'
import { STAFF_ROLES } from '@/types/clinic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: Staff | null
  clinics: Clinic[]
  defaultClinicId?: string
  onSubmit: (data: StaffFormData) => void
}

export function StaffForm({ open, onOpenChange, initial, clinics, defaultClinicId, onSubmit }: Props) {
  const [form, setForm] = useState<StaffFormData>(() =>
    initial
      ? { clinic_id: initial.clinic_id, name: initial.name, role: initial.role ?? '',
          is_bookable: initial.is_bookable, is_active: initial.is_active, sort_order: initial.sort_order }
      : { clinic_id: defaultClinicId ?? clinics[0]?.id ?? '', name: '', role: '',
          is_bookable: true, is_active: true, sort_order: 0 },
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.clinic_id) return
    onSubmit({ ...form, role: form.role || null })
    onOpenChange(false)
  }

  const set = <K extends keyof StaffFormData>(k: K, v: StaffFormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'スタッフを編集' : 'スタッフを追加'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>所属院 *</Label>
            <Select value={form.clinic_id} onValueChange={(v) => set('clinic_id', v)}>
              <SelectTrigger><SelectValue placeholder="院を選択" /></SelectTrigger>
              <SelectContent>
                {clinics.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="staff-name">スタッフ名 *</Label>
            <Input id="staff-name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="田中 誠" required />
          </div>
          <div className="space-y-1.5">
            <Label>職種</Label>
            <Select value={form.role ?? ''} onValueChange={(v) => set('role', v as StaffFormData['role'])}>
              <SelectTrigger><SelectValue placeholder="職種を選択" /></SelectTrigger>
              <SelectContent>
                {STAFF_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Switch id="bookable" checked={form.is_bookable} onCheckedChange={(v) => set('is_bookable', v)} />
              <Label htmlFor="bookable" className="cursor-pointer">予約受付する</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="active" checked={form.is_active} onCheckedChange={(v) => set('is_active', v)} />
              <Label htmlFor="active" className="cursor-pointer">表示する</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
            <Button type="submit">{initial ? '更新' : '追加'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
