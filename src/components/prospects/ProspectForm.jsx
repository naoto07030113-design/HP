import { useState } from 'react'
import { INDUSTRY_LIST, STATUS_LIST } from '../../lib/utils.js'

const EMPTY = {
  store_name: '',
  address: '',
  phone: '',
  website_url: '',
  rating: '',
  review_count: '',
  industry: '整骨院',
  assigned_to: '',
  status: '未接触',
  deal_value: '',
  first_contact_date: '',
  last_contact_date: '',
  notes: '',
}

export default function ProspectForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => initial ? { ...EMPTY, ...initial } : EMPTY)
  const [errors, setErrors] = useState({})

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: '' }))
  }

  function validate() {
    const errs = {}
    if (!form.store_name.trim()) errs.store_name = '店舗名は必須です'
    if (form.rating && (isNaN(form.rating) || form.rating < 0 || form.rating > 5)) errs.rating = '0〜5で入力してください'
    if (form.review_count && (isNaN(form.review_count) || form.review_count < 0)) errs.review_count = '0以上の数値を入力してください'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    onSubmit({
      ...form,
      rating: form.rating ? parseFloat(form.rating) : null,
      review_count: form.review_count ? parseInt(form.review_count) : 0,
      deal_value: form.deal_value ? parseInt(form.deal_value) : 0,
    })
  }

  const Field = ({ label, name, type = 'text', placeholder, list, half }) => (
    <div className={half ? 'col-span-1' : 'col-span-2'}>
      <label className="label">{label}</label>
      {list ? (
        <select value={form[name]} onChange={e => set(name, e.target.value)} className="input-field">
          {list.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={form[name]}
          onChange={e => set(name, e.target.value)}
          placeholder={placeholder}
          className={`input-field ${errors[name] ? 'border-red-700' : ''}`}
        />
      )}
      {errors[name] && <div className="text-xs text-red-400 mt-1">{errors[name]}</div>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="店舗名 *" name="store_name" placeholder="○○整骨院" />
        <Field label="業種" name="industry" list={INDUSTRY_LIST} half />
        <Field label="営業ステータス" name="status" list={STATUS_LIST} half />
        <Field label="住所" name="address" placeholder="東京都新宿区…" />
        <Field label="電話番号" name="phone" placeholder="03-XXXX-XXXX" half />
        <Field label="評価 (0〜5)" name="rating" placeholder="4.2" half />
        <Field label="口コミ数" name="review_count" placeholder="50" half />
        <Field label="ホームページURL" name="website_url" placeholder="https://example.com" />
        <Field label="営業担当" name="assigned_to" placeholder="山田太郎" half />
        <Field label="予測売上 (円)" name="deal_value" placeholder="150000" half />
        <Field label="初回接触日" name="first_contact_date" type="date" half />
        <Field label="最終接触日" name="last_contact_date" type="date" half />
        <div className="col-span-2">
          <label className="label">備考</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="メモ…"
            className="input-field h-20 resize-none"
          />
        </div>
      </div>

      <div className="flex gap-2 mt-5">
        <button type="button" onClick={onCancel} className="btn-ghost flex-1">
          キャンセル
        </button>
        <button type="submit" className="btn-gold flex-1">
          {initial ? '更新する' : '追加する'}
        </button>
      </div>
    </form>
  )
}
