'use client'

import { useState } from 'react'
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, FileText } from 'lucide-react'
import { useClinicStore } from '@/lib/clinic-store'
import Papa from 'papaparse'

type ExportType = 'all' | 'daily' | 'staff'

export default function ExportsPage() {
  const store = useClinicStore()
  const [exportType, setExportType] = useState<ExportType>('all')
  const [clinicId, setClinicId] = useState('all')
  const [staffId, setStaffId] = useState('all')
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'))

  function buildData() {
    let reservations = store.reservations.filter((r) => {
      const d = r.start_at.slice(0, 10)
      if (dateFrom && d < dateFrom) return false
      if (dateTo && d > dateTo) return false
      if (clinicId !== 'all' && r.clinic_id !== clinicId) return false
      if (staffId !== 'all' && r.staff_id !== staffId) return false
      return true
    }).sort((a, b) => a.start_at < b.start_at ? -1 : 1)

    const STATUS_MAP: Record<string, string> = {
      confirmed: '予約確定', visited: '来院済', cancelled: 'キャンセル', no_show: '無断キャンセル',
    }

    if (exportType === 'daily') {
      const dayMap = new Map<string, typeof reservations>()
      reservations.forEach((r) => {
        const d = r.start_at.slice(0, 10)
        if (!dayMap.has(d)) dayMap.set(d, [])
        dayMap.get(d)!.push(r)
      })
      return Array.from(dayMap.entries()).map(([date, rs]) => ({
        日付: date,
        予約件数: rs.length,
        来院済: rs.filter((r) => r.status === 'visited').length,
        キャンセル: rs.filter((r) => r.status === 'cancelled').length,
        無断キャンセル: rs.filter((r) => r.status === 'no_show').length,
      }))
    }

    if (exportType === 'staff') {
      const staffMap = new Map<string, typeof reservations>()
      reservations.forEach((r) => {
        const key = r.staff_id ?? '未担当'
        if (!staffMap.has(key)) staffMap.set(key, [])
        staffMap.get(key)!.push(r)
      })
      return Array.from(staffMap.entries()).map(([sid, rs]) => {
        const s = store.staff.find((st) => st.id === sid)
        return {
          スタッフ名: s?.name ?? '未担当',
          職種: s?.role ?? '',
          予約件数: rs.length,
          来院済: rs.filter((r) => r.status === 'visited').length,
          キャンセル: rs.filter((r) => r.status === 'cancelled').length,
          売上合計: rs.filter((r) => r.status === 'visited').reduce((sum, r) => {
            const menu = store.menus.find((m) => m.id === r.menu_id)
            return sum + (menu?.price ?? 0)
          }, 0),
        }
      })
    }

    // 全件
    return reservations.map((r) => {
      const staff = store.staff.find((s) => s.id === r.staff_id)
      const menu = store.menus.find((m) => m.id === r.menu_id)
      const clinic = store.clinics.find((c) => c.id === r.clinic_id)
      return {
        予約ID: r.id,
        院名: clinic?.name ?? '',
        患者名: r.patient_name,
        電話番号: r.patient_phone ?? '',
        担当スタッフ: staff?.name ?? '',
        メニュー: menu?.name ?? '',
        料金: menu?.price ?? 0,
        予約開始: format(parseISO(r.start_at), 'yyyy/MM/dd HH:mm'),
        予約終了: format(parseISO(r.end_at), 'HH:mm'),
        ステータス: STATUS_MAP[r.status] ?? r.status,
        メモ: r.memo ?? '',
        作成日時: format(parseISO(r.created_at), 'yyyy/MM/dd HH:mm'),
      }
    })
  }

  function handleExport() {
    const data = buildData()
    if (data.length === 0) {
      alert('出力対象のデータがありません')
      return
    }
    const csv = Papa.unparse(data as Record<string, unknown>[])
    const bom = '﻿'
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const label = exportType === 'all' ? '予約一覧' : exportType === 'daily' ? '日別集計' : 'スタッフ別集計'
    a.download = `${label}_${dateFrom}_${dateTo}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const EXPORT_TYPES = [
    { value: 'all', label: '予約一覧CSV', desc: '期間内の全予約データ（患者名・日時・メニュー等）' },
    { value: 'daily', label: '日別予約CSV', desc: '日別の予約件数・来院済・キャンセル集計' },
    { value: 'staff', label: 'スタッフ別CSV', desc: 'スタッフ別の予約件数・来院数・売上集計' },
  ] as const

  return (
    <div className="p-4 lg:p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="page-title">CSV出力</h1>
        <p className="text-sm text-muted-foreground mt-0.5">予約データをCSV形式でダウンロードします（BOM付きUTF-8）</p>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm p-5 space-y-5">
        {/* 出力タイプ */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-green-900">出力タイプ</Label>
          <div className="space-y-2">
            {EXPORT_TYPES.map((t) => (
              <label
                key={t.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  exportType === t.value ? 'border-green-600 bg-green-50' : 'border-border hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio" name="exportType" value={t.value}
                  checked={exportType === t.value}
                  onChange={() => setExportType(t.value)}
                  className="mt-0.5"
                />
                <div>
                  <div className="font-medium text-sm text-green-900">{t.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 期間 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="date-from" className="text-sm">期間（開始）</Label>
            <Input id="date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date-to" className="text-sm">期間（終了）</Label>
            <Input id="date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9" />
          </div>
        </div>

        {/* 絞り込み */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm">院で絞り込み</Label>
            <Select value={clinicId} onValueChange={setClinicId}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべての院</SelectItem>
                {store.clinics.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {exportType === 'all' && (
            <div className="space-y-1.5">
              <Label className="text-sm">スタッフで絞り込み</Label>
              <Select value={staffId} onValueChange={setStaffId}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  {store.staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Button className="w-full gap-2" onClick={handleExport}>
          <Download className="w-4 h-4" />
          CSVダウンロード
        </Button>
      </div>
    </div>
  )
}
