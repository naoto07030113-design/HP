'use client'

import { useState } from 'react'
import type { Patient, PatientFormData } from '@/types/patient'
import {
  GENDER_LABELS, INSURANCE_LABELS, REFERRAL_SOURCES,
} from '@/types/patient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import type { Clinic, Staff } from '@/types/clinic'
import { format } from 'date-fns'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: Patient | null
  clinics: Clinic[]
  staff: Staff[]
  defaultClinicId?: string
  onSubmit: (data: PatientFormData) => void
}

const TODAY = format(new Date(), 'yyyy-MM-dd')

function makeDefault(clinicId: string): PatientFormData {
  return {
    clinic_id: clinicId,
    name: '', name_kana: '', gender: 'unknown',
    birth_date: null, phone: null, email: null,
    postal_code: null, address: null,
    first_visit_date: TODAY,
    primary_staff_id: null, insurance_type: 'none',
    referral_source: null, chief_complaint: null,
    medical_history: null, current_medications: null,
    allergies: null, notes: null, is_active: true,
  }
}

export function PatientForm({
  open, onOpenChange, initial, clinics, staff, defaultClinicId, onSubmit,
}: Props) {
  const [form, setForm] = useState<PatientFormData>(() =>
    initial
      ? {
          clinic_id: initial.clinic_id, name: initial.name, name_kana: initial.name_kana,
          gender: initial.gender, birth_date: initial.birth_date, phone: initial.phone,
          email: initial.email, postal_code: initial.postal_code, address: initial.address,
          first_visit_date: initial.first_visit_date, primary_staff_id: initial.primary_staff_id,
          insurance_type: initial.insurance_type, referral_source: initial.referral_source,
          chief_complaint: initial.chief_complaint, medical_history: initial.medical_history,
          current_medications: initial.current_medications, allergies: initial.allergies,
          notes: initial.notes, is_active: initial.is_active,
        }
      : makeDefault(defaultClinicId ?? clinics[0]?.id ?? ''),
  )

  const set = <K extends keyof PatientFormData>(k: K, v: PatientFormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const nullStr = (v: string) => v || null

  const clinicStaff = staff.filter((s) => s.clinic_id === form.clinic_id && s.is_active)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    onSubmit({
      ...form,
      name_kana: form.name_kana || '',
      phone: nullStr(form.phone ?? ''),
      email: nullStr(form.email ?? ''),
      postal_code: nullStr(form.postal_code ?? ''),
      address: nullStr(form.address ?? ''),
      referral_source: nullStr(form.referral_source ?? ''),
      chief_complaint: nullStr(form.chief_complaint ?? ''),
      medical_history: nullStr(form.medical_history ?? ''),
      current_medications: nullStr(form.current_medications ?? ''),
      allergies: nullStr(form.allergies ?? ''),
      notes: nullStr(form.notes ?? ''),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? '患者情報を編集' : '患者を新規登録'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="basic">基本情報</TabsTrigger>
              <TabsTrigger value="medical">医療情報</TabsTrigger>
              <TabsTrigger value="questionnaire">問診票</TabsTrigger>
            </TabsList>

            {/* 基本情報 */}
            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-1.5">
                <Label>所属院 *</Label>
                <Select value={form.clinic_id} onValueChange={(v) => set('clinic_id', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {clinics.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="p-name">氏名（漢字）*</Label>
                  <Input id="p-name" value={form.name}
                    onChange={(e) => set('name', e.target.value)} placeholder="山田 太郎" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-kana">フリガナ</Label>
                  <Input id="p-kana" value={form.name_kana}
                    onChange={(e) => set('name_kana', e.target.value)} placeholder="ヤマダ タロウ" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>性別</Label>
                  <Select value={form.gender} onValueChange={(v) => set('gender', v as PatientFormData['gender'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.entries(GENDER_LABELS) as [PatientFormData['gender'], string][]).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-birth">生年月日</Label>
                  <Input id="p-birth" type="date"
                    value={form.birth_date ?? ''}
                    onChange={(e) => set('birth_date', e.target.value || null)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="p-phone">電話番号</Label>
                  <Input id="p-phone" type="tel" value={form.phone ?? ''}
                    onChange={(e) => set('phone', e.target.value)} placeholder="090-0000-0000" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-email">メールアドレス</Label>
                  <Input id="p-email" type="email" value={form.email ?? ''}
                    onChange={(e) => set('email', e.target.value)} placeholder="example@mail.com" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="p-zip">郵便番号</Label>
                  <Input id="p-zip" value={form.postal_code ?? ''}
                    onChange={(e) => set('postal_code', e.target.value)} placeholder="000-0000" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="p-addr">住所</Label>
                  <Input id="p-addr" value={form.address ?? ''}
                    onChange={(e) => set('address', e.target.value)} placeholder="東京都渋谷区..." />
                </div>
              </div>
            </TabsContent>

            {/* 医療情報 */}
            <TabsContent value="medical" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="p-first-visit">初診日</Label>
                  <Input id="p-first-visit" type="date"
                    value={form.first_visit_date ?? ''}
                    onChange={(e) => set('first_visit_date', e.target.value || null)} />
                </div>
                <div className="space-y-1.5">
                  <Label>担当スタッフ</Label>
                  <Select value={form.primary_staff_id ?? ''} onValueChange={(v) => set('primary_staff_id', v || null)}>
                    <SelectTrigger><SelectValue placeholder="未指定" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">未指定</SelectItem>
                      {clinicStaff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>保険種別</Label>
                  <Select value={form.insurance_type} onValueChange={(v) => set('insurance_type', v as PatientFormData['insurance_type'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.entries(INSURANCE_LABELS) as [PatientFormData['insurance_type'], string][]).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>紹介元</Label>
                  <Select value={form.referral_source ?? ''} onValueChange={(v) => set('referral_source', v || null)}>
                    <SelectTrigger><SelectValue placeholder="選択してください" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">未選択</SelectItem>
                      {REFERRAL_SOURCES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="p-notes">院内メモ（患者非公開）</Label>
                <Textarea id="p-notes" value={form.notes ?? ''}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder="施術上の注意事項・スタッフ間の申し送りなど" rows={3} />
              </div>

              <div className="flex items-center gap-3">
                <Switch id="p-active" checked={form.is_active} onCheckedChange={(v) => set('is_active', v)} />
                <Label htmlFor="p-active" className="cursor-pointer">アクティブ</Label>
              </div>
            </TabsContent>

            {/* 問診票 */}
            <TabsContent value="questionnaire" className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-complaint">主訴（来院理由・症状）</Label>
                <Textarea id="p-complaint" value={form.chief_complaint ?? ''}
                  onChange={(e) => set('chief_complaint', e.target.value)}
                  placeholder="腰痛、肩こり、膝の痛みなど" rows={3} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-history">既往歴</Label>
                <Textarea id="p-history" value={form.medical_history ?? ''}
                  onChange={(e) => set('medical_history', e.target.value)}
                  placeholder="過去の病気・手術歴など" rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-meds">服薬中の薬</Label>
                <Textarea id="p-meds" value={form.current_medications ?? ''}
                  onChange={(e) => set('current_medications', e.target.value)}
                  placeholder="薬品名・用量など" rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-allergy">アレルギー</Label>
                <Input id="p-allergy" value={form.allergies ?? ''}
                  onChange={(e) => set('allergies', e.target.value)}
                  placeholder="金属、薬品、食物など" />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
            <Button type="submit">{initial ? '更新' : '登録'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
