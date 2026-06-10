'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Download, Printer, FileSpreadsheet, BookOpen,
  ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle,
} from 'lucide-react'
import type { PayrollCalculation, PayrollEmployee, PayrollAttendance } from '@/types/payroll'
import {
  generateWageLedgerCSV,
  generatePayrollSummaryCSV,
  generateJournalCSV,
  downloadCSV,
  type JournalFormat,
  type WageLedgerRow,
} from '@/lib/payroll-export'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'

const PayslipPrint = dynamic(
  () => import('@/features/payroll/components/PayslipPrint'),
  { ssr: false }
)

type CalcRow = PayrollCalculation & {
  employee: PayrollEmployee & { staff?: { name: string; clinic?: { name: string } } }
  allowances?: { category: string; description: string; amount: number; is_deduction: boolean }[]
}

const COMPANY_NAME = '有限会社イトーメディカルケア'

export default function PayrollExportPage() {
  const now = new Date()
  const [year, setYear]   = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const [calcs, setCalcs]           = useState<CalcRow[]>([])
  const [attendances, setAttendances] = useState<Record<string, PayrollAttendance>>({})
  const [loading, setLoading]       = useState(true)
  const [journalFmt, setJournalFmt] = useState<JournalFormat>('mf')
  const [printTarget, setPrintTarget] = useState<CalcRow | null>(null)
  const [printAll, setPrintAll]     = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [calcsRes, attRes] = await Promise.all([
        fetch(`/api/payroll/slips?year=${year}&month=${month}`),
        fetch(`/api/payroll/attendance?year=${year}&month=${month}`),
      ])
      const calcsData: CalcRow[] = await calcsRes.json()
      const attData: PayrollAttendance[] = await attRes.json()

      setCalcs(Array.isArray(calcsData) ? calcsData : [])

      const attMap: Record<string, PayrollAttendance> = {}
      if (Array.isArray(attData)) {
        attData.forEach(a => { attMap[a.payroll_employee_id] = a })
      }
      setAttendances(attMap)
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { load() }, [load])

  const rows: WageLedgerRow[] = calcs.map(c => ({
    calc: c,
    attendance: attendances[c.payroll_employee_id],
  }))

  const confirmedRows = rows.filter(r => r.calc.status !== 'draft')

  function handleWageLedger() {
    if (confirmedRows.length === 0) {
      toast.warning('確定済みの給与データがありません')
      return
    }
    const csv = generateWageLedgerCSV(year, month, confirmedRows, COMPANY_NAME)
    downloadCSV(csv, `賃金台帳_${year}${padZ(month)}.csv`)
    toast.success('賃金台帳をダウンロードしました')
  }

  function handleSummary() {
    if (confirmedRows.length === 0) {
      toast.warning('確定済みの給与データがありません')
      return
    }
    const csv = generatePayrollSummaryCSV(year, month, confirmedRows)
    downloadCSV(csv, `給与支給一覧_${year}${padZ(month)}.csv`)
    toast.success('給与支給一覧をダウンロードしました')
  }

  function handleJournal() {
    if (confirmedRows.length === 0) {
      toast.warning('確定済みの給与データがありません')
      return
    }
    const csv = generateJournalCSV(year, month, confirmedRows, journalFmt)
    const suffix = { mf: 'MF会計', yayoi: '弥生', freee: 'freee' }[journalFmt]
    downloadCSV(csv, `仕訳データ_${suffix}_${year}${padZ(month)}.csv`)
    toast.success('仕訳データをダウンロードしました')
  }

  function handlePrintOne(calc: CalcRow) {
    setPrintTarget(calc)
    setPrintAll(false)
    setTimeout(() => window.print(), 200)
  }

  function handlePrintAll() {
    setPrintTarget(null)
    setPrintAll(true)
    setTimeout(() => window.print(), 200)
  }

  const draftCount     = rows.filter(r => r.calc.status === 'draft').length
  const confirmedCount = rows.filter(r => r.calc.status !== 'draft').length

  return (
    <>
      {/* ===== 画面表示 ===== */}
      <div className="max-w-5xl space-y-5 print:hidden">
        {/* 年月ナビ */}
        <div className="flex items-center gap-3">
          <button onClick={() => { if (month === 1) { setYear(y => y-1); setMonth(12) } else setMonth(m => m-1) }} className="p-1.5 rounded hover:bg-green-100">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-semibold text-green-900 text-lg w-28 text-center">{year}年{month}月</span>
          <button onClick={() => { if (month === 12) { setYear(y => y+1); setMonth(1) } else setMonth(m => m+1) }} className="p-1.5 rounded hover:bg-green-100">
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-400">エクスポート・印刷</span>
        </div>

        {/* ステータスサマリー */}
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1.5 text-gray-500">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            確定済: {confirmedCount}件
          </span>
          {draftCount > 0 && (
            <span className="flex items-center gap-1.5 text-orange-500">
              <AlertTriangle className="w-4 h-4" />
              下書き: {draftCount}件（エクスポート対象外）
            </span>
          )}
        </div>

        {/* ===== 税理士向けCSV ===== */}
        <section className="bg-white rounded-xl border border-green-100 p-5">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-green-600" />
            <h2 className="font-semibold text-green-900">税理士向け書類（マネーフォワード形式）</h2>
          </div>
          <p className="text-xs text-gray-400 mb-4">マネーフォワードクラウド給与と同じCSV列構成で出力します。税理士への提出・会計ソフト連携に使用してください。</p>

          <div className="grid md:grid-cols-2 gap-3">
            <ExportCard
              icon={<BookOpen className="w-5 h-5 text-blue-600" />}
              title="賃金台帳"
              desc="労働基準法第108条に基づく法定帳簿。税理士に渡す主要書類。MF形式と同列構成。"
              badge="法定帳簿"
              badgeColor="bg-blue-100 text-blue-700"
              onClick={handleWageLedger}
              disabled={loading || confirmedCount === 0}
            />
            <ExportCard
              icon={<FileSpreadsheet className="w-5 h-5 text-emerald-600" />}
              title="給与支給一覧"
              desc="全従業員の当月支給・控除・差引支給額をまとめた一覧表。"
              badge="確認用"
              badgeColor="bg-emerald-100 text-emerald-700"
              onClick={handleSummary}
              disabled={loading || confirmedCount === 0}
            />
          </div>
        </section>

        {/* ===== 仕訳データ ===== */}
        <section className="bg-white rounded-xl border border-green-100 p-5">
          <div className="flex items-center gap-2 mb-1">
            <FileSpreadsheet className="w-5 h-5 text-purple-600" />
            <h2 className="font-semibold text-green-900">仕訳データ（会計ソフト連携）</h2>
          </div>
          <p className="text-xs text-gray-400 mb-4">給与仕訳を各会計ソフトのCSV形式で出力します。</p>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-gray-600">出力形式:</span>
            {(['mf', 'yayoi', 'freee'] as JournalFormat[]).map(fmt => (
              <label key={fmt} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="journalFmt"
                  value={fmt}
                  checked={journalFmt === fmt}
                  onChange={() => setJournalFmt(fmt)}
                  className="accent-green-600"
                />
                {{ mf: 'MF会計', yayoi: '弥生会計', freee: 'freee' }[fmt]}
              </label>
            ))}
          </div>

          <button
            onClick={handleJournal}
            disabled={loading || confirmedCount === 0}
            className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-40 transition-colors"
          >
            <Download className="w-4 h-4" />
            仕訳データをダウンロード
          </button>
        </section>

        {/* ===== 給与明細書印刷 ===== */}
        <section className="bg-white rounded-xl border border-green-100 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Printer className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-green-900">給与明細書（印刷・PDF保存）</h2>
          </div>
          <p className="text-xs text-gray-400 mb-4">マネーフォワードと同じレイアウトで印刷・PDFに保存できます。</p>

          <div className="flex gap-2 mb-4">
            <button
              onClick={handlePrintAll}
              disabled={loading || calcs.length === 0}
              className="flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40 transition-colors"
            >
              <Printer className="w-4 h-4" />
              全員分を一括印刷
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-700" />
            </div>
          ) : calcs.length === 0 ? (
            <p className="text-sm text-gray-400 py-4">この月の給与計算データがありません</p>
          ) : (
            <div className="space-y-2">
              {calcs.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                  <div>
                    <span className="font-medium text-sm">{c.employee?.staff?.name ?? '不明'}</span>
                    <span className="text-xs text-gray-400 ml-2">{c.employee?.staff?.clinic?.name}</span>
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                      c.status === 'paid' ? 'bg-green-100 text-green-700'
                      : c.status === 'confirmed' ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-500'
                    }`}>
                      {c.status === 'paid' ? '振込済' : c.status === 'confirmed' ? '確定' : '下書き'}
                    </span>
                  </div>
                  <button
                    onClick={() => handlePrintOne(c)}
                    className="flex items-center gap-1.5 text-xs text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    印刷・PDF
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ===== 印刷エリア（@media printのみ表示） ===== */}
      <div ref={printRef} className="hidden print:block">
        {printAll ? (
          calcs.map((c, i) => (
            <div key={c.id} className={i > 0 ? 'print-page-break' : ''}>
              <PayslipPrint
                calc={c}
                attendance={attendances[c.payroll_employee_id]}
                companyName={COMPANY_NAME}
              />
            </div>
          ))
        ) : printTarget ? (
          <PayslipPrint
            calc={printTarget}
            attendance={attendances[printTarget.payroll_employee_id]}
            companyName={COMPANY_NAME}
          />
        ) : null}
      </div>
    </>
  )
}

function ExportCard({
  icon, title, desc, badge, badgeColor, onClick, disabled,
}: {
  icon: React.ReactNode
  title: string
  desc: string
  badge: string
  badgeColor: string
  onClick: () => void
  disabled: boolean
}) {
  return (
    <div className="border border-gray-100 rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium text-gray-900">{title}</span>
        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${badgeColor}`}>{badge}</span>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
      <button
        onClick={onClick}
        disabled={disabled}
        className="flex items-center gap-1.5 text-sm bg-green-700 text-white px-4 py-1.5 rounded-lg hover:bg-green-800 disabled:opacity-40 transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        ダウンロード
      </button>
    </div>
  )
}

function padZ(n: number): string {
  return String(n).padStart(2, '0')
}
