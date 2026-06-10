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
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: Staff | null
  clinics: Clinic[]
  defaultClinicId?: string
  onSubmit: (data: StaffFormData) => void
}

function parseRoles(role: string | null | undefined): string[] {
  if (!role) return []
  return role.split('・').filter(Boolean)
}

function joinRoles(roles: string[]): string | null {
  return roles.length > 0 ? roles.join('・') : null
}

export function StaffForm({ open, onOpenChange, initial, clinics, defaultClinicId, onSubmit }: Props) {
  const [clinicId, setClinicId] = useState(
    initial?.clinic_id ?? defaultClinicId ?? clinics[0]?.id ?? '',
  )
  const [name, setName] = useState(initial?.name ?? '')
  const [selectedRoles, setSelectedRoles] = useState<string[]>(parseRoles(initial?.role))
  const [isBookable, setIsBookable] = useState(initial?.is_bookable ?? true)
  const [isActive, setIsActive] = useState(initial?.is_active ?? true)
  const [sortOrder] = useState(initial?.sort_order ?? 0)

  function toggleRole(role: string) {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !clinicId) return
    onSubmit({
      clinic_id: clinicId,
      name: name.trim(),
      role: joinRoles(selectedRoles),
      is_bookable: isBookable,
      is_active: isActive,
      sort_order: sortOrder,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'スタッフを編集' : 'スタッフを追加'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>所属院 *</Label>
            <Select value={clinicId} onValueChange={setClinicId}>
              <SelectTrigger><SelectValue placeholder="院を選択" /></SelectTrigger>
              <SelectContent>
                {clinics.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="staff-name">スタッフ名 *</Label>
            <Input
              id="staff-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="田中 誠"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>職種（複数選択可）</Label>
            <div className="flex flex-wrap gap-2">
              {STAFF_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg border text-sm font-medium transition-all',
                    selectedRoles.includes(role)
                      ? 'bg-green-700 border-green-700 text-white'
                      : 'bg-white border-border text-green-900 hover:border-green-400 hover:bg-green-50',
                  )}
                >
                  {role}
                </button>
              ))}
            </div>
            {selectedRoles.length > 0 && (
              <p className="text-xs text-muted-foreground">選択中: {selectedRoles.join('・')}</p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Switch id="bookable" checked={isBookable} onCheckedChange={setIsBookable} />
              <Label htmlFor="bookable" className="cursor-pointer">予約受付する</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
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
