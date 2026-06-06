// HPEditor.jsx - HP content editor with content/design/section tabs
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useHP } from '../contexts/HPContext.jsx'
import { COLOR_PALETTES } from '../lib/hpData.js'

export default function HPEditor() {
  const { pageId } = useParams()
  const navigate = useNavigate()
  const { company, clinics, updateCompany, updateClinic, publishPage, unpublishPage } = useHP()

  const isCompany = pageId === 'company'
  const clinic = isCompany ? null : clinics.find(c => c.id === pageId)

  const [activeTab, setActiveTab] = useState('content')
  const [saved, setSaved] = useState(false)

  // Local state for editing
  const [localData, setLocalData] = useState(() => {
    if (isCompany) return { ...company }
    if (clinic) return { ...clinic }
    return {}
  })

  // Sync localData when source changes
  useEffect(() => {
    if (isCompany) setLocalData({ ...company })
    else if (clinic) setLocalData({ ...clinic })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId])

  if (!isCompany && !clinic) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        ページが見つかりません
      </div>
    )
  }

  function handleSave() {
    if (isCompany) {
      updateCompany(localData)
    } else {
      updateClinic(pageId, localData)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handlePublishToggle() {
    const isPublished = isCompany ? !!company.publishedAt : clinic?.status === 'published'
    if (isPublished) unpublishPage(pageId)
    else publishPage(pageId)
  }

  const isPublished = isCompany ? !!company.publishedAt : clinic?.status === 'published'
  const pageName = isCompany ? company.name : clinic?.name

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border flex-shrink-0 flex-wrap">
        <button
          onClick={() => navigate('/hp')}
          className="text-gray-400 hover:text-white text-sm flex items-center gap-1 transition-colors"
        >
          ← HP管理
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-semibold text-white truncate">{pageName}</h1>
          <p className="text-xs text-gray-500">ページ編集</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => window.open(`/hp/preview/${pageId}`, '_blank')}
            className="px-3 py-1.5 text-xs border border-border text-gray-400 rounded hover:text-white hover:border-gray-500 transition-colors"
          >
            プレビュー
          </button>
          <button
            onClick={handleSave}
            className={`px-4 py-1.5 text-xs rounded font-medium transition-all ${
              saved
                ? 'bg-green-600/20 border border-green-600/40 text-green-400'
                : 'bg-gold/15 border border-gold/30 text-gold hover:bg-gold/25'
            }`}
          >
            {saved ? '保存済み ✓' : '保存'}
          </button>
          <button
            onClick={handlePublishToggle}
            className={`px-3 py-1.5 text-xs rounded border transition-colors ${
              isPublished
                ? 'border-green-600/30 bg-green-600/10 text-green-400 hover:bg-green-600/20'
                : 'border-gray-600 text-gray-400 hover:border-gold/40 hover:text-gold'
            }`}
          >
            {isPublished ? '公開中 — 非公開にする' : '公開する'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-4 border-b border-border flex-shrink-0">
        {['content', 'design', 'sections'].map(tab => {
          const labels = { content: 'コンテンツ', design: 'デザイン', sections: 'セクション設定' }
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-gold text-gold'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {labels[tab]}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'content' && (
          <ContentTab
            isCompany={isCompany}
            data={localData}
            onChange={setLocalData}
          />
        )}
        {activeTab === 'design' && !isCompany && (
          <DesignTab
            data={localData}
            onChange={setLocalData}
          />
        )}
        {activeTab === 'design' && isCompany && (
          <div className="text-gray-500 text-sm p-4">会社トップページのデザインは固定テーマです。</div>
        )}
        {activeTab === 'sections' && !isCompany && (
          <SectionsTab
            data={localData}
            onChange={setLocalData}
          />
        )}
        {activeTab === 'sections' && isCompany && (
          <div className="text-gray-500 text-sm p-4">会社トップページのセクションは固定構成です。</div>
        )}
      </div>
    </div>
  )
}

/* ── Content Tab ────────────────────────────────────────── */
function ContentTab({ isCompany, data, onChange }) {
  if (isCompany) {
    return <CompanyContentForm data={data} onChange={onChange} />
  }
  return <ClinicContentForm data={data} onChange={onChange} />
}

function Field({ label, type = 'text', value, onChange, multiline, placeholder }) {
  const cls = "w-full bg-surface-2 border border-border rounded px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gold/50 transition-colors"
  return (
    <div className="mb-4">
      <label className="block text-xs text-gray-400 mb-1.5 font-medium">{label}</label>
      {multiline ? (
        <textarea
          className={cls}
          style={{ minHeight: '80px', resize: 'vertical' }}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          type={type}
          className={cls}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  )
}

function CompanyContentForm({ data, onChange }) {
  function set(key) { return v => onChange(prev => ({ ...prev, [key]: v })) }
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-1">
      <div>
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-4">基本情報</h3>
        <Field label="会社名" value={data.name} onChange={set('name')} />
        <Field label="英語表記" value={data.nameEn} onChange={set('nameEn')} placeholder="Ito Medical Care Co., Ltd." />
        <Field label="キャッチコピー（日本語）" value={data.tagline} onChange={set('tagline')} />
        <Field label="キャッチコピー（英語）" value={data.taglineEn} onChange={set('taglineEn')} />
        <Field label="設立年" value={data.established} onChange={set('established')} />
        <Field label="住所エリア" value={data.address} onChange={set('address')} />
      </div>
      <div>
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-4">紹介文・理念</h3>
        <Field label="会社説明文" value={data.description} onChange={set('description')} multiline />
        <Field label="経営理念・フィロソフィー" value={data.philosophy} onChange={set('philosophy')} multiline />
        <Field label="電話番号" value={data.phone} onChange={set('phone')} />
        <Field label="メールアドレス" value={data.email} onChange={set('email')} type="email" />
      </div>
    </div>
  )
}

function ClinicContentForm({ data, onChange }) {
  function set(key) { return v => onChange(prev => ({ ...prev, [key]: v })) }

  const [openSection, setOpenSection] = useState('hero')
  const sections = [
    { id: 'hero', label: 'ヒーロー' },
    { id: 'basic', label: '基本情報' },
    { id: 'about', label: '院について' },
    { id: 'services', label: '施術内容' },
    { id: 'features', label: '選ばれる理由' },
    { id: 'hours', label: '診療時間' },
    { id: 'access', label: 'アクセス' },
    { id: 'contact', label: 'お問い合わせ' },
  ]

  return (
    <div className="flex gap-4">
      {/* Section list */}
      <div className="w-44 flex-shrink-0">
        <div className="bg-surface-2 rounded-lg overflow-hidden border border-border">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setOpenSection(s.id)}
              className={`w-full text-left px-3 py-2.5 text-sm border-b border-border last:border-0 transition-colors ${
                openSection === s.id ? 'bg-gold/10 text-gold' : 'text-gray-400 hover:text-white hover:bg-surface-3'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form area */}
      <div className="flex-1 min-w-0">
        {openSection === 'hero' && (
          <div>
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-4">ヒーローセクション</h3>
            <Field label="ページタイトル" value={data.heroTitle} onChange={set('heroTitle')} />
            <Field label="サブタイトル" value={data.heroSubtitle} onChange={set('heroSubtitle')} />
            <Field label="CTAボタン文言" value={data.heroCta} onChange={set('heroCta')} placeholder="ご予約はこちら" />
          </div>
        )}
        {openSection === 'basic' && (
          <div>
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-4">基本情報</h3>
            <Field label="院名" value={data.name} onChange={set('name')} />
            <Field label="英語名" value={data.nameEn} onChange={set('nameEn')} />
            <Field label="キャッチコピー" value={data.tagline} onChange={set('tagline')} />
            <Field label="電話番号" value={data.phone} onChange={set('phone')} />
            <Field label="Webサイト" value={data.website} onChange={set('website')} />
          </div>
        )}
        {openSection === 'about' && (
          <div>
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-4">院についての紹介文</h3>
            <Field label="紹介文（院について）" value={data.aboutText} onChange={set('aboutText')} multiline />
            <Field label="詳細説明" value={data.description} onChange={set('description')} multiline />
          </div>
        )}
        {openSection === 'services' && (
          <ServicesEditor services={data.services || []} onChange={v => set('services')(v)} />
        )}
        {openSection === 'features' && (
          <FeaturesEditor features={data.features || []} onChange={v => set('features')(v)} />
        )}
        {openSection === 'hours' && (
          <HoursEditor hours={data.hours || []} onChange={v => set('hours')(v)} />
        )}
        {openSection === 'access' && (
          <div>
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-4">アクセス情報</h3>
            <Field label="住所" value={data.address} onChange={set('address')} multiline />
            <Field label="Googleマップ URL" value={data.mapUrl} onChange={set('mapUrl')} placeholder="https://maps.google.com/..." />
          </div>
        )}
        {openSection === 'contact' && (
          <div>
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-4">お問い合わせ</h3>
            <Field label="お問い合わせテキスト" value={data.contactText} onChange={set('contactText')} multiline />
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Services Editor ─────────────────────────────────────── */
function ServicesEditor({ services, onChange }) {
  function add() {
    onChange([...services, { id: `s${Date.now()}`, name: '新しい施術', desc: '', icon: '✨' }])
  }
  function remove(i) { onChange(services.filter((_, idx) => idx !== i)) }
  function update(i, key, val) {
    onChange(services.map((s, idx) => idx === i ? { ...s, [key]: val } : s))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs text-gray-500 uppercase tracking-wider">施術内容</h3>
        <button onClick={add} className="text-xs text-gold border border-gold/30 px-3 py-1 rounded hover:bg-gold/10 transition-colors">
          + 追加
        </button>
      </div>
      <div className="space-y-3">
        {services.map((s, i) => (
          <div key={s.id || i} className="bg-surface-2 border border-border rounded-lg p-4">
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={s.icon || ''}
                onChange={e => update(i, 'icon', e.target.value)}
                className="w-14 bg-surface border border-border rounded px-2 py-1.5 text-sm text-center"
                placeholder="🎯"
              />
              <input
                type="text"
                value={s.name || ''}
                onChange={e => update(i, 'name', e.target.value)}
                className="flex-1 bg-surface border border-border rounded px-3 py-1.5 text-sm text-white"
                placeholder="施術名"
              />
              <button onClick={() => remove(i)} className="text-xs text-gray-600 hover:text-red-400 px-2 transition-colors">✕</button>
            </div>
            <textarea
              value={s.desc || ''}
              onChange={e => update(i, 'desc', e.target.value)}
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-white resize-none"
              style={{ minHeight: '60px' }}
              placeholder="施術の説明文"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Features Editor ─────────────────────────────────────── */
function FeaturesEditor({ features, onChange }) {
  function add() {
    onChange([...features, { id: `f${Date.now()}`, title: '新しい特徴', desc: '' }])
  }
  function remove(i) { onChange(features.filter((_, idx) => idx !== i)) }
  function update(i, key, val) {
    onChange(features.map((f, idx) => idx === i ? { ...f, [key]: val } : f))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs text-gray-500 uppercase tracking-wider">選ばれる理由</h3>
        <button onClick={add} className="text-xs text-gold border border-gold/30 px-3 py-1 rounded hover:bg-gold/10 transition-colors">
          + 追加
        </button>
      </div>
      <div className="space-y-3">
        {features.map((f, i) => (
          <div key={f.id || i} className="bg-surface-2 border border-border rounded-lg p-4">
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={f.title || ''}
                onChange={e => update(i, 'title', e.target.value)}
                className="flex-1 bg-surface border border-border rounded px-3 py-1.5 text-sm text-white"
                placeholder="タイトル"
              />
              <button onClick={() => remove(i)} className="text-xs text-gray-600 hover:text-red-400 px-2 transition-colors">✕</button>
            </div>
            <textarea
              value={f.desc || ''}
              onChange={e => update(i, 'desc', e.target.value)}
              className="w-full bg-surface border border-border rounded px-3 py-2 text-sm text-white resize-none"
              style={{ minHeight: '60px' }}
              placeholder="説明文"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Hours Editor ────────────────────────────────────────── */
function HoursEditor({ hours, onChange }) {
  function update(i, key, val) {
    onChange(hours.map((h, idx) => idx === i ? { ...h, [key]: val } : h))
  }
  return (
    <div>
      <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-4">診療時間</h3>
      <div className="space-y-2">
        {hours.map((h, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              type="text"
              value={h.day || ''}
              onChange={e => update(i, 'day', e.target.value)}
              className="w-32 bg-surface-2 border border-border rounded px-3 py-1.5 text-sm text-white"
            />
            <input
              type="text"
              value={h.time || ''}
              onChange={e => update(i, 'time', e.target.value)}
              className="flex-1 bg-surface-2 border border-border rounded px-3 py-1.5 text-sm text-white"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Design Tab ─────────────────────────────────────────── */
function DesignTab({ data, onChange }) {
  const theme = data.theme || {}
  function setTheme(key) { return v => onChange(prev => ({ ...prev, theme: { ...prev.theme, [key]: v } })) }

  function applyPalette(palette) {
    onChange(prev => ({
      ...prev,
      theme: {
        ...prev.theme,
        primaryColor: palette.primaryColor,
        secondaryColor: palette.secondaryColor,
        bgColor: palette.bgColor,
        textColor: palette.textColor,
        accentColor: palette.accentColor,
        palette: palette.name,
      }
    }))
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-1">
      {/* Palettes */}
      <div>
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-4">カラーパレット プリセット</h3>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {COLOR_PALETTES.map(palette => (
            <button
              key={palette.name}
              onClick={() => applyPalette(palette)}
              className={`p-3 rounded-lg border text-left transition-all ${
                theme.palette === palette.name
                  ? 'border-gold bg-gold/10'
                  : 'border-border hover:border-gray-500 bg-surface-2'
              }`}
            >
              <div className="flex gap-2 mb-2">
                {[palette.primaryColor, palette.secondaryColor, palette.bgColor].map((c, i) => (
                  <div key={i} style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    backgroundColor: c,
                    border: '1px solid rgba(255,255,255,0.1)',
                  }} />
                ))}
              </div>
              <p className="text-xs font-medium text-white">{palette.name}</p>
              <p className="text-xs text-gray-500">{palette.nameEn}</p>
            </button>
          ))}
        </div>

        {/* Manual color overrides */}
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-4">カラー手動設定</h3>
        <div className="space-y-3">
          {[
            { key: 'primaryColor', label: 'プライマリカラー' },
            { key: 'secondaryColor', label: 'セカンダリカラー' },
            { key: 'bgColor', label: '背景色' },
            { key: 'textColor', label: 'テキスト色' },
            { key: 'accentColor', label: 'アクセント色' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-3">
              <input
                type="color"
                value={theme[key] || '#888888'}
                onChange={e => setTheme(key)(e.target.value)}
                style={{
                  width: '40px', height: '32px', cursor: 'pointer',
                  border: '1px solid #2A2A2A', borderRadius: '4px',
                  backgroundColor: 'transparent', padding: '2px',
                }}
              />
              <div>
                <p className="text-xs text-gray-300">{label}</p>
                <p className="text-xs text-gray-600 font-mono">{theme[key] || '#888888'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Layout / Style options */}
      <div>
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-4">レイアウト</h3>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { id: 'standard', label: 'スタンダード', desc: '全幅セクション' },
            { id: 'card', label: 'カード型', desc: 'ボーダー付き' },
            { id: 'centered', label: 'センター型', desc: '中央寄せ' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setTheme('layout')(opt.id)}
              className={`p-3 rounded border text-left transition-all ${
                theme.layout === opt.id
                  ? 'border-gold bg-gold/10'
                  : 'border-border hover:border-gray-500 bg-surface-2'
              }`}
            >
              {/* Mini visual */}
              <div className="mb-2 h-10 rounded flex flex-col gap-1 justify-center" style={{ backgroundColor: '#1E1E1E', padding: '4px 6px' }}>
                {opt.id === 'standard' && <>
                  <div style={{ height: '3px', backgroundColor: '#444', borderRadius: '2px' }} />
                  <div style={{ height: '3px', backgroundColor: '#333', borderRadius: '2px' }} />
                </>}
                {opt.id === 'card' && <>
                  <div style={{ height: '3px', backgroundColor: '#444', borderRadius: '2px', margin: '0 4px', border: '1px solid #555' }} />
                </>}
                {opt.id === 'centered' && <>
                  <div style={{ height: '3px', backgroundColor: '#444', borderRadius: '2px', margin: '0 8px' }} />
                  <div style={{ height: '3px', backgroundColor: '#333', borderRadius: '2px', margin: '0 12px' }} />
                </>}
              </div>
              <p className="text-xs font-medium text-white">{opt.label}</p>
              <p className="text-xs text-gray-500">{opt.desc}</p>
            </button>
          ))}
        </div>

        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-4">フォントスタイル</h3>
        <div className="flex gap-2 mb-6">
          {[
            { id: 'serif', label: '明朝体', sample: '伊東治療院' },
            { id: 'sans', label: 'ゴシック体', sample: '伊東治療院' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setTheme('fontStyle')(opt.id)}
              className={`flex-1 p-3 rounded border text-center transition-all ${
                theme.fontStyle === opt.id
                  ? 'border-gold bg-gold/10'
                  : 'border-border hover:border-gray-500 bg-surface-2'
              }`}
              style={{ fontFamily: opt.id === 'serif' ? 'Georgia, serif' : 'system-ui, sans-serif' }}
            >
              <p className="text-sm text-white mb-1">{opt.sample}</p>
              <p className="text-xs text-gray-500" style={{ fontFamily: 'system-ui, sans-serif' }}>{opt.label}</p>
            </button>
          ))}
        </div>

        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-4">ヒーロースタイル</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'fullscreen', label: 'フルスクリーン' },
            { id: 'split', label: '2分割' },
            { id: 'minimal', label: 'ミニマル' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setTheme('heroStyle')(opt.id)}
              className={`p-3 rounded border text-center transition-all ${
                theme.heroStyle === opt.id
                  ? 'border-gold bg-gold/10'
                  : 'border-border hover:border-gray-500 bg-surface-2'
              }`}
            >
              <p className="text-xs font-medium text-white">{opt.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Sections Tab ───────────────────────────────────────── */
function SectionsTab({ data, onChange }) {
  const sections = data.sections || []

  function toggle(id) {
    onChange(prev => ({
      ...prev,
      sections: (prev.sections || []).map(s =>
        s.id === id ? { ...s, enabled: !s.enabled } : s
      ),
    }))
  }

  function move(id, dir) {
    const sorted = [...sections].sort((a, b) => a.order - b.order)
    const idx = sorted.findIndex(s => s.id === id)
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= sorted.length) return
    const newOrder = sorted.map((s, i) => {
      if (i === idx) return { ...s, order: sorted[newIdx].order }
      if (i === newIdx) return { ...s, order: sorted[idx].order }
      return s
    })
    onChange(prev => ({ ...prev, sections: newOrder }))
  }

  const sorted = [...sections].sort((a, b) => a.order - b.order)

  return (
    <div className="max-w-lg">
      <p className="text-xs text-gray-500 mb-4">セクションの表示/非表示と順序を設定できます</p>
      <div className="space-y-2">
        {sorted.map((section, i) => (
          <div key={section.id} className="flex items-center gap-3 bg-surface-2 border border-border rounded-lg px-4 py-3">
            {/* Reorder arrows */}
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => move(section.id, -1)}
                disabled={i === 0}
                className="text-gray-600 hover:text-gray-300 disabled:opacity-20 text-xs"
              >▲</button>
              <button
                onClick={() => move(section.id, 1)}
                disabled={i === sorted.length - 1}
                className="text-gray-600 hover:text-gray-300 disabled:opacity-20 text-xs"
              >▼</button>
            </div>

            <div className="flex-1">
              <p className="text-sm text-white">{section.name}</p>
              <p className="text-xs text-gray-600">{section.id}</p>
            </div>

            {/* Toggle */}
            <button
              onClick={() => toggle(section.id)}
              style={{
                width: '44px', height: '24px', borderRadius: '12px',
                backgroundColor: section.enabled ? '#C9A84C' : '#333',
                position: 'relative', transition: 'background-color 0.2s',
                border: 'none', cursor: 'pointer',
              }}
            >
              <div style={{
                position: 'absolute', top: '3px',
                left: section.enabled ? '23px' : '3px',
                width: '18px', height: '18px', borderRadius: '50%',
                backgroundColor: '#fff',
                transition: 'left 0.2s',
              }} />
            </button>
            <span className={`text-xs w-10 text-right ${section.enabled ? 'text-gold' : 'text-gray-600'}`}>
              {section.enabled ? 'ON' : 'OFF'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
