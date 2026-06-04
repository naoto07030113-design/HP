import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { INDUSTRY_LIST } from '../../lib/utils.js'
import { useProspects } from '../../contexts/ProspectContext.jsx'

const COL_MAP = {
  '店舗名': 'store_name', 'name': 'store_name', '名前': 'store_name',
  '住所': 'address', 'address': 'address',
  '電話番号': 'phone', '電話': 'phone', 'tel': 'phone', 'phone': 'phone',
  '評価': 'rating', 'rating': 'rating',
  '口コミ数': 'review_count', '口コミ': 'review_count', 'reviews': 'review_count',
  'HP': 'website_url', 'ホームページ': 'website_url', 'url': 'website_url', 'website': 'website_url',
  '業種': 'industry',
  '営業担当': 'assigned_to', '担当': 'assigned_to',
}

function mapRow(row) {
  const mapped = {}
  Object.entries(row).forEach(([key, val]) => {
    const normalKey = key.trim()
    const field = COL_MAP[normalKey] || COL_MAP[normalKey.toLowerCase()]
    if (field) mapped[field] = val
  })
  return mapped
}

export default function CSVImporter() {
  const { dispatch } = useProspects()
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [importing, setImporting] = useState(false)
  const [done, setDone] = useState(0)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  function parseFile(file) {
    if (!file) return
    if (!file.name.endsWith('.csv')) { setError('CSVファイルを選択してください'); return }
    setError('')
    setPreview(null)
    setDone(0)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: (result) => {
        const rows = result.data.map(mapRow)
        setPreview({ rows, filename: file.name, total: rows.length })
      },
      error: () => setError('CSVの読み込みに失敗しました'),
    })
  }

  function handleFile(e) { parseFile(e.target.files[0]) }
  function handleDrop(e) {
    e.preventDefault(); setDragging(false)
    parseFile(e.dataTransfer.files[0])
  }

  function doImport() {
    if (!preview) return
    setImporting(true)
    setTimeout(() => {
      const validated = preview.rows.map(r => ({
        ...r,
        rating: r.rating ? parseFloat(r.rating) : null,
        review_count: r.review_count ? parseInt(r.review_count) : 0,
        industry: INDUSTRY_LIST.includes(r.industry) ? r.industry : '整骨院',
        status: '未接触',
        deal_value: 150000,
      }))
      dispatch({ type: 'BULK_ADD', payload: validated })
      setDone(validated.length)
      setPreview(null)
      setImporting(false)
    }, 800)
  }

  const SAMPLE_CSV = `店舗名,住所,電話番号,評価,口コミ数,HP,業種
テスト整骨院,東京都渋谷区1-2-3,03-1234-5678,4.2,45,,整骨院
テスト美容室,大阪府大阪市北区2-3-4,06-1234-5678,3.8,22,https://example.com,美容室`

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = 'sample.csv'; a.click()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-all duration-200 ${
          dragging ? 'border-gold bg-gold-muted' : 'border-border hover:border-border-light hover:bg-surface-2/50'
        }`}
      >
        <input ref={inputRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
        <div className="text-2xl mb-3">📥</div>
        <div className="text-sm text-white mb-1">CSVファイルをドラッグ&ドロップ</div>
        <div className="text-xs text-gray-500">または クリックしてファイルを選択</div>
      </div>

      {/* Error */}
      {error && (
        <div className="card p-3 border-red-900 bg-red-900/10 text-red-400 text-sm">{error}</div>
      )}

      {/* Done */}
      {done > 0 && (
        <div className="card p-3 border-green-900 bg-green-900/10 text-green-400 text-sm">
          ✓ {done}件のデータを取り込みました
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-white">{preview.filename}</div>
            <span className="text-xs text-gray-500">{preview.total}件</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[500px]">
              <thead>
                <tr className="border-b border-border">
                  {['store_name','industry','rating','review_count','website_url'].map(col => (
                    <th key={col} className="px-2 py-1.5 text-left text-gray-500 font-medium">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {preview.rows.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    <td className="px-2 py-1.5 text-gray-300">{row.store_name || '—'}</td>
                    <td className="px-2 py-1.5 text-gray-400">{row.industry || '—'}</td>
                    <td className="px-2 py-1.5 text-gray-400">{row.rating || '—'}</td>
                    <td className="px-2 py-1.5 text-gray-400">{row.review_count || '—'}</td>
                    <td className="px-2 py-1.5 text-gray-400 truncate max-w-[120px]">{row.website_url || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.total > 5 && (
            <div className="text-xs text-gray-600">…他 {preview.total - 5}件</div>
          )}
          <div className="flex gap-2">
            <button onClick={() => setPreview(null)} className="btn-ghost flex-1">キャンセル</button>
            <button onClick={doImport} disabled={importing} className="btn-gold flex-1 flex items-center justify-center gap-2">
              {importing ? <><span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />取込中…</> : `${preview.total}件を取込む`}
            </button>
          </div>
        </div>
      )}

      {/* Guide */}
      <div className="card p-4 space-y-2">
        <div className="text-xs font-medium text-gray-400">対応カラム</div>
        <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
          {Object.entries(COL_MAP).filter(([k], i, a) => a.findIndex(([,v]) => v === a[i][1]) === i).map(([k, v]) => (
            <div key={v}><span className="text-gray-400">{k}</span> → {v}</div>
          ))}
        </div>
        <button onClick={downloadSample} className="text-xs text-gold hover:text-gold-light transition-colors mt-1">
          📄 サンプルCSVをダウンロード
        </button>
      </div>
    </div>
  )
}
