'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Papa from 'papaparse'
import { AppLayout } from '@/components/layout/app-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react'

const CSV_COLUMNS = ['事業者名', '業種', '住所', '電話', 'メール', 'HP', 'GoogleMapURL']

type CsvRow = Record<string, string>

export default function ImportPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<CsvRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ count: number } | null>(null)
  const [error, setError] = useState('')

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setError('')
    setResult(null)

    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setHeaders(results.meta.fields ?? [])
        setRows(results.data)
      },
      error: (err) => {
        setError(`CSVの読み込みに失敗しました: ${err.message}`)
      },
    })
  }

  async function handleImport() {
    if (rows.length === 0) return
    setImporting(true)
    setError('')
    try {
      const res = await fetch('/api/businesses/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'インポートに失敗しました')
      }
      const data = await res.json()
      setResult({ count: data.count })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'インポートに失敗しました')
    } finally {
      setImporting(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/businesses">
              <ArrowLeft className="h-4 w-4 mr-1" />
              戻る
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CSVインポート</h1>
            <p className="text-sm text-gray-500">事業者情報を一括登録します</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">CSVフォーマット</CardTitle>
            <CardDescription>以下の列名で作成してください（1行目はヘッダー行）</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {CSV_COLUMNS.map((col) => (
                <Badge key={col} variant="outline" className="font-mono text-xs">
                  {col}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              ※「事業者名」は必須項目です。その他の列は空白でも問題ありません。
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">ファイルを選択</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-gray-700">
                CSVファイルをクリックして選択
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {fileName || 'UTF-8エンコードのCSVファイル'}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFile}
                className="hidden"
              />
            </div>

            {error && (
              <div className="flex gap-2 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {result && (
              <div className="flex gap-2 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                {result.count}件の事業者をインポートしました
                <Link href="/businesses" className="underline ml-auto">
                  一覧を見る
                </Link>
              </div>
            )}

            {rows.length > 0 && !result && (
              <>
                <div className="rounded-lg border overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">
                      プレビュー ({rows.length}件)
                    </span>
                  </div>
                  <div className="overflow-x-auto max-h-60">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          {headers.map((h) => (
                            <th key={h} className="text-left px-3 py-2 font-medium text-gray-600 whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {rows.slice(0, 10).map((row, i) => (
                          <tr key={i}>
                            {headers.map((h) => (
                              <td key={h} className="px-3 py-2 text-gray-700 whitespace-nowrap max-w-xs truncate">
                                {row[h] ?? ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {rows.length > 10 && (
                      <p className="text-xs text-gray-500 text-center py-2">
                        他 {rows.length - 10}件...
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => { setRows([]); setFileName(''); }}
                  >
                    クリア
                  </Button>
                  <Button onClick={handleImport} disabled={importing}>
                    {importing ? 'インポート中...' : `${rows.length}件をインポート`}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
