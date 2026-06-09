'use client'

import { useState, useEffect, useRef } from 'react'
import type { MedicalRecord, MedicalRecordFormData } from '@/types/medical-record'
import { TREATMENT_AREAS, TREATMENT_METHODS } from '@/types/medical-record'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { format } from 'date-fns'
import { useClinicStore } from '@/lib/clinic-store'
import { usePatientStore, patientStore } from '@/lib/patient-store'
import { Search, UserCheck, Mic, MicOff, Camera } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Web Speech API 型定義 ──────────────────────────────────────
interface ISpeechRecognition {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: { results: { [i: number]: { [i: number]: { transcript: string } }; length: number } }) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start(): void
  stop(): void
}
interface ISpeechRecognitionConstructor {
  new(): ISpeechRecognition
}

function getSR(): ISpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null
  return (
    (window as unknown as { SpeechRecognition?: ISpeechRecognitionConstructor }).SpeechRecognition ??
    (window as unknown as { webkitSpeechRecognition?: ISpeechRecognitionConstructor }).webkitSpeechRecognition ??
    null
  )
}

// ── 音声入力フック ──────────────────────────────────────
function useSpeechInput(setter: (fn: (prev: string | null) => string | null) => void) {
  const [recording, setRecording] = useState(false)
  const recRef = useRef<ISpeechRecognition | null>(null)

  function toggle() {
    if (recording) {
      recRef.current?.stop()
      setRecording(false)
      return
    }
    const SR = getSR()
    if (!SR) return
    const r = new SR()
    r.lang = 'ja-JP'
    r.continuous = true
    r.interimResults = false
    r.onresult = (e) => {
      let text = ''
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript
      }
      setter((prev) => (prev ? prev + text : text))
    }
    r.onend = () => setRecording(false)
    r.onerror = () => setRecording(false)
    r.start()
    recRef.current = r
    setRecording(true)
  }

  useEffect(() => () => { recRef.current?.stop() }, [])
  return { recording, toggle }
}

function MicButton({ recording, toggle }: { recording: boolean; toggle: () => void }) {
  return (
    <button
      type="button"
      onClick={toggle}
      title={recording ? '録音停止' : '音声入力開始'}
      className={cn(
        'h-7 w-7 rounded-md border flex items-center justify-center transition-colors flex-shrink-0',
        recording
          ? 'bg-red-600 border-red-600 text-white animate-pulse'
          : 'border-border text-muted-foreground hover:border-green-400 hover:text-green-700',
      )}
    >
      {recording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
    </button>
  )
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: MedicalRecord | null
  defaultPatientId?: string
  defaultPatientName?: string
  defaultStaffId?: string
  defaultClinicId?: string
  defaultDate?: string
  defaultReservationId?: string
  onSubmit: (data: MedicalRecordFormData) => void
}

function CheckGroup({
  options, value, onChange,
}: {
  options: readonly string[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  function toggle(opt: string) {
    onChange(value.includes(opt) ? value.filter((x) => x !== opt) : [...value, opt])
  }
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={cn(
            'px-2.5 py-1 rounded-full border text-xs font-medium transition-colors',
            value.includes(opt)
              ? 'bg-green-700 text-white border-green-700'
              : 'border-border text-muted-foreground hover:border-green-400 hover:text-green-800',
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

const EMPTY: MedicalRecordFormData = {
  patient_id: '', patient_name: '', reservation_id: null,
  clinic_id: '', staff_id: null,
  visit_date: format(new Date(), 'yyyy-MM-dd'),
  subjective: null, objective: null, assessment: null, plan: null,
  blood_pressure_systolic: null, blood_pressure_diastolic: null,
  pulse: null, temperature: null,
  treatment_areas: [], treatment_methods: [],
  treatment_duration_min: null, treatment_notes: null,
  next_visit_plan: null, memo: null,
}

export function RecordForm({
  open, onOpenChange, initial,
  defaultPatientId, defaultPatientName, defaultStaffId,
  defaultClinicId, defaultDate, defaultReservationId,
  onSubmit,
}: Props) {
  const store = useClinicStore()
  const allPatients = usePatientStore()
  const [form, setForm] = useState<MedicalRecordFormData>(EMPTY)
  const [patientSearch, setPatientSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])

  // 音声入力フック (SOAP 各フィールド用)
  const voiceS = useSpeechInput((fn) => setForm((f) => ({ ...f, subjective: fn(f.subjective) })))
  const voiceO = useSpeechInput((fn) => setForm((f) => ({ ...f, objective: fn(f.objective) })))
  const voiceA = useSpeechInput((fn) => setForm((f) => ({ ...f, assessment: fn(f.assessment) })))
  const voiceP = useSpeechInput((fn) => setForm((f) => ({ ...f, plan: fn(f.plan) })))

  const searchedPatients = patientSearch.length >= 1
    ? patientStore.search(patientSearch, form.clinic_id || undefined).slice(0, 6)
    : []

  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        patient_id: initial.patient_id,
        patient_name: initial.patient_name,
        reservation_id: initial.reservation_id,
        clinic_id: initial.clinic_id,
        staff_id: initial.staff_id,
        visit_date: initial.visit_date,
        subjective: initial.subjective,
        objective: initial.objective,
        assessment: initial.assessment,
        plan: initial.plan,
        blood_pressure_systolic: initial.blood_pressure_systolic,
        blood_pressure_diastolic: initial.blood_pressure_diastolic,
        pulse: initial.pulse,
        temperature: initial.temperature,
        treatment_areas: initial.treatment_areas,
        treatment_methods: initial.treatment_methods,
        treatment_duration_min: initial.treatment_duration_min,
        treatment_notes: initial.treatment_notes,
        next_visit_plan: initial.next_visit_plan,
        memo: initial.memo,
      })
    } else {
      const clinicId = defaultClinicId ?? store.clinics[0]?.id ?? ''
      const patient = defaultPatientId
        ? allPatients.find((p) => p.id === defaultPatientId)
        : null
      setForm({
        ...EMPTY,
        clinic_id: clinicId,
        staff_id: defaultStaffId ?? null,
        visit_date: defaultDate ?? format(new Date(), 'yyyy-MM-dd'),
        reservation_id: defaultReservationId ?? null,
        patient_id: defaultPatientId ?? '',
        patient_name: patient?.name ?? defaultPatientName ?? '',
      })
    }
    setPatientSearch('')
    setShowSearch(false)
    // 写真を localStorage から読み込む
    if (initial) {
      const saved = localStorage.getItem(`mr_photos_${initial.id}`)
      setPhotos(saved ? (JSON.parse(saved) as string[]) : [])
    } else {
      setPhotos([])
    }
  }, [open, initial])

  function setF<K extends keyof MedicalRecordFormData>(k: K, v: MedicalRecordFormData[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function selectPatient(p: ReturnType<typeof patientStore.getAll>[number]) {
    setF('patient_id', p.id)
    setF('patient_name', p.name)
    setPatientSearch('')
    setShowSearch(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.patient_name.trim() || !form.clinic_id || !form.visit_date) return
    onSubmit(form)
    onOpenChange(false)
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!initial) return
    const files = Array.from(e.target.files ?? [])
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        setPhotos((prev) => {
          const next = [...prev, dataUrl]
          localStorage.setItem(`mr_photos_${initial.id}`, JSON.stringify(next))
          return next
        })
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  function removePhoto(index: number) {
    const next = photos.filter((_, i) => i !== index)
    if (initial) localStorage.setItem(`mr_photos_${initial.id}`, JSON.stringify(next))
    setPhotos(next)
  }

  const filteredStaff = store.staff.filter(
    (s) => s.clinic_id === form.clinic_id && s.is_active,
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? 'カルテを編集' : 'カルテを記入'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="basic">基本情報</TabsTrigger>
              <TabsTrigger value="soap">SOAP</TabsTrigger>
              <TabsTrigger value="treatment">施術</TabsTrigger>
              <TabsTrigger value="memo">次回・メモ</TabsTrigger>
              <TabsTrigger value="photos">写真</TabsTrigger>
            </TabsList>

            {/* ── 基本情報 ── */}
            <TabsContent value="basic" className="space-y-4 mt-0">
              {/* 患者 */}
              <div className="space-y-1.5">
                <Label>患者 *</Label>
                {form.patient_id ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 border border-green-200">
                    <UserCheck className="w-4 h-4 text-green-700 flex-shrink-0" />
                    <span className="text-sm font-medium text-green-900 flex-1">{form.patient_name}</span>
                    <button
                      type="button"
                      onClick={() => { setF('patient_id', ''); setF('patient_name', '') }}
                      className="text-xs text-muted-foreground hover:text-red-600"
                    >
                      変更
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={patientSearch}
                        onChange={(e) => { setPatientSearch(e.target.value); setShowSearch(true) }}
                        onFocus={() => setShowSearch(true)}
                        placeholder="患者名・フリガナ・電話番号で検索..."
                        className="pl-8"
                      />
                    </div>
                    {showSearch && searchedPatients.length > 0 && (
                      <div className="border border-border rounded-lg shadow-md bg-white z-50 overflow-hidden">
                        {searchedPatients.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => selectPatient(p)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-green-50 text-left border-b border-green-50 last:border-0"
                          >
                            <span className="font-medium text-green-900">{p.name}</span>
                            <span className="text-muted-foreground text-xs ml-1">{p.name_kana}</span>
                            {p.phone && <span className="text-xs text-muted-foreground ml-auto">{p.phone}</span>}
                          </button>
                        ))}
                      </div>
                    )}
                    <Input
                      value={form.patient_name}
                      onChange={(e) => setF('patient_name', e.target.value)}
                      placeholder="または氏名を直接入力"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>院 *</Label>
                  <Select value={form.clinic_id} onValueChange={(v) => setF('clinic_id', v)}>
                    <SelectTrigger><SelectValue placeholder="院を選択" /></SelectTrigger>
                    <SelectContent>
                      {store.clinics.filter((c) => c.is_active).map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>担当スタッフ</Label>
                  <Select value={form.staff_id ?? ''} onValueChange={(v) => setF('staff_id', v || null)}>
                    <SelectTrigger><SelectValue placeholder="未指定" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">未指定</SelectItem>
                      {filteredStaff.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>施術日 *</Label>
                <Input
                  type="date"
                  value={form.visit_date}
                  onChange={(e) => setF('visit_date', e.target.value)}
                  required
                />
              </div>

              {/* バイタルサイン */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-green-900">バイタルサイン</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">収縮期血圧 (mmHg)</p>
                    <Input
                      type="number" min={60} max={250}
                      value={form.blood_pressure_systolic ?? ''}
                      onChange={(e) => setF('blood_pressure_systolic', e.target.value ? Number(e.target.value) : null)}
                      placeholder="120"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">拡張期血圧 (mmHg)</p>
                    <Input
                      type="number" min={40} max={150}
                      value={form.blood_pressure_diastolic ?? ''}
                      onChange={(e) => setF('blood_pressure_diastolic', e.target.value ? Number(e.target.value) : null)}
                      placeholder="80"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">脈拍 (bpm)</p>
                    <Input
                      type="number" min={30} max={200}
                      value={form.pulse ?? ''}
                      onChange={(e) => setF('pulse', e.target.value ? Number(e.target.value) : null)}
                      placeholder="72"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">体温 (°C)</p>
                    <Input
                      type="number" min={34} max={42} step={0.1}
                      value={form.temperature ?? ''}
                      onChange={(e) => setF('temperature', e.target.value ? Number(e.target.value) : null)}
                      placeholder="36.5"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── SOAP ── */}
            <TabsContent value="soap" className="space-y-4 mt-0">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-green-800 font-semibold">S — 主訴・患者の訴え</Label>
                  <MicButton recording={voiceS.recording} toggle={voiceS.toggle} />
                </div>
                <Textarea
                  value={form.subjective ?? ''}
                  onChange={(e) => setF('subjective', e.target.value || null)}
                  placeholder="患者が訴える症状、痛みの部位・強度・性質など"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-green-800 font-semibold">O — 所見・検査結果</Label>
                  <MicButton recording={voiceO.recording} toggle={voiceO.toggle} />
                </div>
                <Textarea
                  value={form.objective ?? ''}
                  onChange={(e) => setF('objective', e.target.value || null)}
                  placeholder="視診・触診・整形外科テスト・可動域・圧痛点など"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-green-800 font-semibold">A — 評価・診断</Label>
                  <MicButton recording={voiceA.recording} toggle={voiceA.toggle} />
                </div>
                <Textarea
                  value={form.assessment ?? ''}
                  onChange={(e) => setF('assessment', e.target.value || null)}
                  placeholder="症状の評価、病態の考察、診断など"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-green-800 font-semibold">P — 治療計画</Label>
                  <MicButton recording={voiceP.recording} toggle={voiceP.toggle} />
                </div>
                <Textarea
                  value={form.plan ?? ''}
                  onChange={(e) => setF('plan', e.target.value || null)}
                  placeholder="今後の治療方針、通院頻度、生活指導など"
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* ── 施術 ── */}
            <TabsContent value="treatment" className="space-y-4 mt-0">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-green-900">施術部位</Label>
                <CheckGroup
                  options={TREATMENT_AREAS}
                  value={form.treatment_areas}
                  onChange={(v) => setF('treatment_areas', v)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-green-900">施術方法</Label>
                <CheckGroup
                  options={TREATMENT_METHODS}
                  value={form.treatment_methods}
                  onChange={(v) => setF('treatment_methods', v)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>施術時間（分）</Label>
                <Input
                  type="number" min={5} max={240} step={5}
                  value={form.treatment_duration_min ?? ''}
                  onChange={(e) => setF('treatment_duration_min', e.target.value ? Number(e.target.value) : null)}
                  placeholder="60"
                  className="w-32"
                />
              </div>
              <div className="space-y-1.5">
                <Label>施術メモ（ツボ・手技の詳細など）</Label>
                <Textarea
                  value={form.treatment_notes ?? ''}
                  onChange={(e) => setF('treatment_notes', e.target.value || null)}
                  placeholder="使用したツボ、手技の詳細、反応など"
                  rows={4}
                />
              </div>
            </TabsContent>

            {/* ── 次回・メモ ── */}
            <TabsContent value="memo" className="space-y-4 mt-0">
              <div className="space-y-1.5">
                <Label>次回来院計画</Label>
                <Textarea
                  value={form.next_visit_plan ?? ''}
                  onChange={(e) => setF('next_visit_plan', e.target.value || null)}
                  placeholder="次回来院の目安、通院頻度の変更など"
                  rows={3}
                />
              </div>
              <div className="space-y-1.5">
                <Label>院内メモ（スタッフ専用）</Label>
                <Textarea
                  value={form.memo ?? ''}
                  onChange={(e) => setF('memo', e.target.value || null)}
                  placeholder="スタッフ間の申し送り、注意事項など"
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* ── 写真 ── */}
            <TabsContent value="photos" className="space-y-4 mt-0">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-green-900">施術写真</Label>
                <label className={cn('cursor-pointer', !initial && 'pointer-events-none opacity-50')}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-border text-sm font-medium hover:bg-accent transition-colors">
                    <Camera className="w-3.5 h-3.5" />
                    写真を追加
                  </span>
                </label>
              </div>

              {!initial && (
                <p className="text-xs text-muted-foreground bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5">
                  カルテを保存してから写真タブで追加できます
                </p>
              )}

              {photos.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
                  写真が登録されていません
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((src, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden border border-border">
                      <img src={src} alt={`施術写真 ${i + 1}`} className="w-full h-24 object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(i)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] hidden group-hover:flex items-center justify-center font-bold"
                      >
                        x
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                写真はこの端末のブラウザにのみ保存されます
              </p>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
            <Button type="submit">{initial ? '更新' : 'カルテを保存'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
