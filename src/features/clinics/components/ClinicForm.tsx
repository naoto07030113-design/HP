'use client'

import { useState } from 'react'
import type { Clinic, ClinicFormData } from '@/types/clinic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: Clinic | null
  onSubmit: (data: ClinicFormData) => void
}

const DEFAULT: ClinicFormData = {
  name: '', address: '', phone: '',
  open_time: '09:00', close_time: '18:00',
  is_active: true, sort_order: 0,
}

export function ClinicForm({ open, onOpenChange, initial, onSubmit }: Props) {
  const [form, setForm] = useState<ClinicFormData>(() =>
    initial
      ? { name: initial.name, address: initial.address ?? '', phone: initial.phone ?? '',
          open_time: initial.open_time, close_time: initial.close_time,
          is_active: initial.is_active, sort_order: initial.sort_order }
      : DEFAULT,
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSubmit(form)
    onOpenChange(false)
  }

  const set = <K extends keyof ClinicFormData>(k: K, v: ClinicFormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? '院を編集' : '院を追加'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">院名 *</Label>
            <Input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="葵鍼灸整骨院 本院" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">住所</Label>
            <Input id="address" value={form.address ?? ''} onChange={(e) => set('address', e.target.value)} placeholder="東京都渋谷区..." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">電話番号</Label>
            <Input id="phone" value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} placeholder="03-0000-0000" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="open_time">開始時間</Label>
              <Input id="open_time" type="time" value={form.open_time} onChange={(e) => set('open_time', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="close_time">終了時間</Label>
              <Input id="close_time" type="time" value={form.close_time} onChange={(e) => set('close_time', e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="is_active" checked={form.is_active} onCheckedChange={(v) => set('is_active', v)} />
            <Label htmlFor="is_active" className="cursor-pointer">表示する</Label>
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
