'use client'

import { useState } from 'react'
import type { Menu, MenuFormData, Clinic } from '@/types/clinic'
import { VISIT_TYPE_LABELS } from '@/types/clinic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: Menu | null
  clinics: Clinic[]
  defaultClinicId?: string
  onSubmit: (data: MenuFormData) => void
}

export function MenuForm({ open, onOpenChange, initial, clinics, defaultClinicId, onSubmit }: Props) {
  const [form, setForm] = useState<MenuFormData>(() =>
    initial
      ? { clinic_id: initial.clinic_id, name: initial.name, duration_min: initial.duration_min,
          price: initial.price, visit_type: initial.visit_type, is_active: initial.is_active, sort_order: initial.sort_order }
      : { clinic_id: defaultClinicId ?? clinics[0]?.id ?? '', name: '', duration_min: 60,
          price: 0, visit_type: 'both', is_active: true, sort_order: 0 },
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.clinic_id) return
    onSubmit(form)
    onOpenChange(false)
  }

  const set = <K extends keyof MenuFormData>(k: K, v: MenuFormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'メニューを編集' : 'メニューを追加'}</DialogTitle>
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
            <Label htmlFor="menu-name">メニュー名 *</Label>
            <Input id="menu-name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="整体・骨格矯正" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="duration">所要時間（分）</Label>
              <Input id="duration" type="number" min={5} step={5} value={form.duration_min}
                onChange={(e) => set('duration_min', Number(e.target.value))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">料金（円）</Label>
              <Input id="price" type="number" min={0} step={100} value={form.price}
                onChange={(e) => set('price', Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>初診/再来区分</Label>
            <Select value={form.visit_type} onValueChange={(v) => set('visit_type', v as MenuFormData['visit_type'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(VISIT_TYPE_LABELS) as Array<keyof typeof VISIT_TYPE_LABELS>).map((k) => (
                  <SelectItem key={k} value={k}>{VISIT_TYPE_LABELS[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Switch id="menu-active" checked={form.is_active} onCheckedChange={(v) => set('is_active', v)} />
            <Label htmlFor="menu-active" className="cursor-pointer">表示する</Label>
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
