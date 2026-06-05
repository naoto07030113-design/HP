import { useNavigate } from 'react-router-dom'
import { useGenerator } from '../contexts/GeneratorContext'
import { industries } from '../data/industries'
import { colorSchemes } from '../data/colorSchemes'
import { generateHTML } from '../components/generator/generateHTML'

const STEPS = ['業種選択', '基本情報', 'デザイン', 'コンテンツ', 'プレビュー']

// ─── Step 1: Industry ─────────────────────────────────────────────────────────
function Step1({ data, update, next }) {
  return (
    <div>
      <h2 className="text-2xl font-black text-slate-900 mb-2">業種を選んでください</h2>
      <p className="text-slate-500 mb-8">最も近い業種を選択してください。後から変更できます。</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {industries.map(ind => (
          <button
            key={ind.id}
            onClick={() => {
              update({
                industry: ind,
                tagline: data.tagline || ind.defaultTagline,
                about: data.about || ind.defaultAbout,
                hours: data.hours || ind.defaultHours,
                services: data.services.some(s => s.title)
                  ? data.services
                  : ind.defaultServices.map(s => ({ ...s })),
              })
              next()
            }}
            className={`group relative flex flex-col items-center gap-2.5 p-5 rounded-2xl border-2 transition-all hover:shadow-lg hover:-translate-y-0.5 text-left ${
              data.industry?.id === ind.id
                ? 'border-indigo-500 bg-indigo-50 shadow-md'
                : 'border-slate-200 bg-white hover:border-indigo-300'
            }`}
          >
            {data.industry?.id === ind.id && (
              <div className="absolute top-3 right-3 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl transition-transform group-hover:scale-110"
              style={{ background: ind.bgColor }}
            >
              {ind.icon}
            </div>
            <span className="font-bold text-slate-800 text-sm text-center leading-tight">{ind.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Step 2: Basic Info ───────────────────────────────────────────────────────
function Step2({ data, update, next, prev }) {
  const canNext = data.businessName.trim().length > 0

  return (
    <div>
      <h2 className="text-2xl font-black text-slate-900 mb-2">基本情報を入力してください</h2>
      <p className="text-slate-500 mb-8">
        <span className="text-red-500">*</span> は必須項目です
      </p>
      <div className="space-y-5 max-w-xl">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            店舗・会社名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.businessName}
            onChange={e => update({ businessName: e.target.value })}
            placeholder={`例：${data.industry?.name || ''}田中`}
            className="w-full border-2 border-slate-200 focus:border-indigo-400 rounded-xl px-4 py-3 outline-none transition-colors text-slate-900 font-medium"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            キャッチコピー・タグライン
          </label>
          <input
            type="text"
            value={data.tagline}
            onChange={e => update({ tagline: e.target.value })}
            placeholder={data.industry?.defaultTagline || '例：地域の皆さまの健康を守ります'}
            className="w-full border-2 border-slate-200 focus:border-indigo-400 rounded-xl px-4 py-3 outline-none transition-colors text-slate-900"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">電話番号</label>
            <input
              type="tel"
              value={data.phone}
              onChange={e => update({ phone: e.target.value })}
              placeholder="03-1234-5678"
              className="w-full border-2 border-slate-200 focus:border-indigo-400 rounded-xl px-4 py-3 outline-none transition-colors text-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">メールアドレス</label>
            <input
              type="email"
              value={data.email}
              onChange={e => update({ email: e.target.value })}
              placeholder="info@example.com"
              className="w-full border-2 border-slate-200 focus:border-indigo-400 rounded-xl px-4 py-3 outline-none transition-colors text-slate-900"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">住所</label>
          <input
            type="text"
            value={data.address}
            onChange={e => update({ address: e.target.value })}
            placeholder="〒150-0001 東京都渋谷区神宮前1-1-1"
            className="w-full border-2 border-slate-200 focus:border-indigo-400 rounded-xl px-4 py-3 outline-none transition-colors text-slate-900"
          />
        </div>
      </div>
      <div className="flex gap-3 mt-8">
        <button onClick={prev} className="px-6 py-3 rounded-xl border-2 border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors">← 戻る</button>
        <button
          onClick={next}
          disabled={!canNext}
          className={`flex-1 py-3 rounded-xl font-black text-white transition-all ${canNext ? 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg' : 'bg-slate-200 cursor-not-allowed text-slate-400'}`}
        >
          次へ →
        </button>
      </div>
    </div>
  )
}

// ─── Step 3: Design ───────────────────────────────────────────────────────────
function Step3({ data, update, next, prev }) {
  return (
    <div>
      <h2 className="text-2xl font-black text-slate-900 mb-2">デザインを選んでください</h2>
      <p className="text-slate-500 mb-8">カラーテーマはあとからでも変更できます。</p>

      <div className="mb-8">
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">カラーテーマ</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {colorSchemes.map(scheme => (
            <button
              key={scheme.id}
              onClick={() => update({ colorSchemeId: scheme.id })}
              className={`relative flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                data.colorSchemeId === scheme.id
                  ? 'border-indigo-500 bg-indigo-50 shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {data.colorSchemeId === scheme.id && (
                <div className="absolute top-2 right-2 w-4 h-4 bg-indigo-600 rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <div className="flex gap-1">
                {scheme.swatches.slice(0, 3).map((c, i) => (
                  <div key={i} className="w-5 h-5 rounded-full" style={{ background: c }} />
                ))}
              </div>
              <div className="text-left">
                <div className="font-bold text-slate-800 text-sm">{scheme.name}</div>
                <div className="text-xs text-slate-400">{scheme.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Color preview */}
      <div className="mb-8">
        <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">プレビュー</h3>
        {(() => {
          const scheme = colorSchemes.find(s => s.id === data.colorSchemeId) || colorSchemes[0]
          return (
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
              <div className="h-24 flex items-center justify-center" style={{ background: scheme.heroBg }}>
                <div className="text-center">
                  <div className="text-white font-black text-xl">{data.businessName || 'あなたのビジネス名'}</div>
                  <div className="text-white/70 text-sm mt-1">{data.tagline || 'キャッチコピー'}</div>
                </div>
              </div>
              <div className="p-4 flex gap-3" style={{ background: scheme.bg }}>
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex-1 bg-white rounded-xl p-3 text-center shadow-sm border" style={{ borderColor: scheme.border }}>
                    <div className="text-xs font-bold" style={{ color: scheme.text }}>サービス {i}</div>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}
      </div>

      <div className="flex gap-3">
        <button onClick={prev} className="px-6 py-3 rounded-xl border-2 border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors">← 戻る</button>
        <button onClick={next} className="flex-1 py-3 rounded-xl font-black text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg transition-all">次へ →</button>
      </div>
    </div>
  )
}

// ─── Step 4: Content ──────────────────────────────────────────────────────────
function Step4({ data, update, next, prev }) {
  const updateService = (i, field, val) => {
    const newServices = data.services.map((s, idx) => idx === i ? { ...s, [field]: val } : s)
    update({ services: newServices })
  }
  const addService = () => {
    if (data.services.length < 6) update({ services: [...data.services, { icon: '🔹', title: '', description: '' }] })
  }
  const removeService = (i) => {
    if (data.services.length > 1) update({ services: data.services.filter((_, idx) => idx !== i) })
  }

  const serviceIconOptions = ['⭐', '🔑', '💡', '🎯', '🛠️', '📋', '🏆', '✅', '🌟', '🔹', '💎', '🎪', '🌈', '🔥', '💪', '🌿', '🎁', '📱', '🖥️', '🏠', '🍽️', '💊', '🩺', '✂️', '🎓', '⚖️']

  return (
    <div>
      <h2 className="text-2xl font-black text-slate-900 mb-2">コンテンツを入力してください</h2>
      <p className="text-slate-500 mb-8">空白のままでも業種に合わせたデフォルトのコンテンツが使用されます。</p>

      <div className="space-y-6 max-w-2xl">
        {/* About */}
        <div>
          <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-3">事業紹介・会社概要</label>
          <textarea
            value={data.about}
            onChange={e => update({ about: e.target.value })}
            placeholder={data.industry?.defaultAbout || '事業の特徴や強みを入力してください...'}
            rows={4}
            className="w-full border-2 border-slate-200 focus:border-indigo-400 rounded-xl px-4 py-3 outline-none transition-colors text-slate-900 resize-none leading-relaxed"
          />
        </div>

        {/* Services */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-black text-slate-700 uppercase tracking-widest">
              サービス・メニュー（最大6件）
            </label>
            {data.services.length < 6 && (
              <button onClick={addService} className="text-indigo-600 hover:text-indigo-700 font-bold text-sm flex items-center gap-1">
                <span className="text-lg leading-none">+</span> 追加
              </button>
            )}
          </div>
          <div className="space-y-3">
            {data.services.map((service, i) => (
              <div key={i} className="flex gap-2 items-start bg-slate-50 rounded-xl p-3 border border-slate-200">
                <div className="relative">
                  <select
                    value={service.icon}
                    onChange={e => updateService(i, 'icon', e.target.value)}
                    className="appearance-none bg-white border-2 border-slate-200 rounded-xl w-14 h-14 text-2xl text-center cursor-pointer focus:border-indigo-400 outline-none"
                  >
                    {serviceIconOptions.map(ico => (
                      <option key={ico} value={ico}>{ico}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={service.title}
                    onChange={e => updateService(i, 'title', e.target.value)}
                    placeholder={data.industry?.defaultServices?.[i]?.title || 'サービス名'}
                    className="w-full border-2 border-slate-200 focus:border-indigo-400 rounded-lg px-3 py-2 outline-none text-sm font-bold text-slate-800 bg-white"
                  />
                  <input
                    type="text"
                    value={service.description}
                    onChange={e => updateService(i, 'description', e.target.value)}
                    placeholder={data.industry?.defaultServices?.[i]?.description || 'サービスの説明'}
                    className="w-full border-2 border-slate-200 focus:border-indigo-400 rounded-lg px-3 py-2 outline-none text-sm text-slate-600 bg-white"
                  />
                </div>
                {data.services.length > 1 && (
                  <button onClick={() => removeService(i)} className="text-slate-300 hover:text-red-400 transition-colors mt-1 flex-shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Hours */}
        <div>
          <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-3">営業時間</label>
          <textarea
            value={data.hours}
            onChange={e => update({ hours: e.target.value })}
            placeholder={data.industry?.defaultHours || '月〜金: 9:00-18:00\n土日祝: 定休日'}
            rows={3}
            className="w-full border-2 border-slate-200 focus:border-indigo-400 rounded-xl px-4 py-3 outline-none transition-colors text-slate-900 resize-none font-mono text-sm"
          />
        </div>

        {/* SNS */}
        <div>
          <label className="block text-sm font-black text-slate-700 uppercase tracking-widest mb-3">SNSアカウント（任意）</label>
          <div className="space-y-2">
            {[
              { key: 'instagram', icon: '📷', placeholder: 'Instagramユーザー名（@なし）' },
              { key: 'twitter', icon: '🐦', placeholder: 'Twitter/X ユーザー名（@なし）' },
              { key: 'facebook', icon: '📘', placeholder: 'Facebookページ名' },
            ].map(({ key, icon, placeholder }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xl w-8 text-center flex-shrink-0">{icon}</span>
                <input
                  type="text"
                  value={data[key]}
                  onChange={e => update({ [key]: e.target.value })}
                  placeholder={placeholder}
                  className="flex-1 border-2 border-slate-200 focus:border-indigo-400 rounded-xl px-4 py-2.5 outline-none transition-colors text-slate-900 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button onClick={prev} className="px-6 py-3 rounded-xl border-2 border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors">← 戻る</button>
        <button onClick={next} className="flex-1 py-3 rounded-xl font-black text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg transition-all">プレビューへ →</button>
      </div>
    </div>
  )
}

// ─── Step 5: Preview ──────────────────────────────────────────────────────────
function Step5({ data, prev, goToStep }) {
  const navigate = useNavigate()

  const handleDownload = () => {
    const html = generateHTML(data)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.businessName || 'website'}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const html = generateHTML(data)

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">プレビュー</h2>
          <p className="text-slate-500 text-sm mt-1">生成されたサイトを確認してください</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/preview')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            全画面
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm transition-all hover:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            HTMLダウンロード
          </button>
        </div>
      </div>

      {/* Scaled preview */}
      <div className="flex-1 relative rounded-2xl overflow-hidden border-2 border-slate-200 bg-white shadow-inner" style={{ minHeight: '500px' }}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div style={{ width: '1280px', height: '900px', transform: 'scale(0.5)', transformOrigin: 'top left' }}>
            <iframe
              srcDoc={html}
              title="サイトプレビュー"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* Edit shortcuts */}
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-400 font-medium">編集:</span>
        {['業種', '基本情報', 'デザイン', 'コンテンツ'].map((label, i) => (
          <button
            key={i}
            onClick={() => goToStep(i + 1)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-colors font-medium"
          >
            ✏️ {label}
          </button>
        ))}
        <button
          onClick={prev}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors font-medium ml-auto"
        >
          ← 戻る
        </button>
      </div>
    </div>
  )
}

// ─── Main CreatePage ───────────────────────────────────────────────────────────
export default function CreatePage() {
  const navigate = useNavigate()
  const { data, update, step, nextStep, prevStep, goToStep } = useGenerator()

  const progressPct = ((step - 1) / (STEPS.length - 1)) * 100

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-700 transition-colors font-medium text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            ホーム
          </button>
          <div className="text-slate-300">|</div>
          <div className="flex-1 flex items-center gap-1 overflow-x-auto py-1">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => i < step - 1 && goToStep(i + 1)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                    i + 1 === step
                      ? 'bg-indigo-600 text-white'
                      : i + 1 < step
                      ? 'bg-indigo-100 text-indigo-600 cursor-pointer hover:bg-indigo-200'
                      : 'text-slate-300 cursor-default'
                  }`}
                >
                  <span>{i + 1 < step ? '✓' : i + 1}</span>
                  <span className="hidden sm:inline">{label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`w-6 h-px ${i + 1 < step ? 'bg-indigo-300' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 bg-slate-100">
          <div
            className="h-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <div className={step === 5 ? 'h-full flex flex-col' : 'max-w-3xl'}>
          {step === 1 && <Step1 data={data} update={update} next={nextStep} />}
          {step === 2 && <Step2 data={data} update={update} next={nextStep} prev={prevStep} />}
          {step === 3 && <Step3 data={data} update={update} next={nextStep} prev={prevStep} />}
          {step === 4 && <Step4 data={data} update={update} next={nextStep} prev={prevStep} />}
          {step === 5 && <Step5 data={data} prev={prevStep} goToStep={goToStep} />}
        </div>
      </main>
    </div>
  )
}
