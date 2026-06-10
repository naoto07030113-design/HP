'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

export default function SignForm({ signToken, staffName }: { signToken: string; staffName: string }) {
  const [name, setName] = useState(staffName)
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSign() {
    if (!agreed || !name.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/contracts/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sign_token: signToken, signer_name: name.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '署名失敗')
      setDone(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
        <p className="text-green-900 font-bold text-lg">署名が完了しました</p>
        <p className="text-green-700 text-sm mt-2">
          {new Date().toLocaleString('ja-JP')} に電子署名が記録されました。
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-6 space-y-5">
      <h2 className="font-bold text-gray-900">電子署名</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          氏名（フルネームで入力してください）
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="例：伊藤 太郎"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={e => setAgreed(e.target.checked)}
          className="w-4 h-4 mt-0.5 accent-green-600 flex-shrink-0"
        />
        <span className="text-sm text-gray-700 leading-relaxed">
          上記の契約書の内容を確認し、同意の上で電子署名を行います。
          この署名は手書きの署名・捺印と同等の効力を持つことを了承します。
        </span>
      </label>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        onClick={handleSign}
        disabled={!agreed || !name.trim() || submitting}
        className="w-full bg-green-800 text-white py-3 rounded-xl font-semibold text-sm hover:bg-green-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? '署名処理中...' : '署名する'}
      </button>
    </div>
  )
}
