// HPDashboard.jsx - HP management dashboard
import { useNavigate } from 'react-router-dom'
import { useHP } from '../contexts/HPContext.jsx'
import { useBlog } from '../contexts/BlogContext.jsx'

export default function HPDashboard() {
  const { company, clinics, publishPage, unpublishPage } = useHP()
  const { articles } = useBlog()
  const navigate = useNavigate()

  const publishedArticles = articles.filter(a => a.status === 'published').length
  const publishedClinics = clinics.filter(c => c.status === 'published').length

  function fmt(iso) {
    if (!iso) return '未更新'
    return new Date(iso).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white tracking-wide">HPコンテンツ管理</h1>
        <p className="text-sm text-gray-500 mt-1">会社HP・各院のウェブページを管理・編集できます</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: '管理ページ数', value: clinics.length + 1, unit: 'ページ', color: '#C9A84C' },
          { label: '公開中ページ', value: publishedClinics + (company.publishedAt ? 1 : 0), unit: 'ページ', color: '#4A8A60' },
          { label: '連携ブログ記事', value: publishedArticles, unit: '件', color: '#4ECDC4' },
          { label: '準備中ページ', value: (clinics.length + 1) - publishedClinics - (company.publishedAt ? 1 : 0), unit: 'ページ', color: '#888' },
        ].map((s, i) => (
          <div key={i} className="bg-surface border border-border rounded-lg p-4">
            <div style={{ fontSize: '1.8rem', fontWeight: '700', color: s.color, lineHeight: 1 }}>
              {s.value}
              <span style={{ fontSize: '0.9rem', fontWeight: '400', color: '#666', marginLeft: '4px' }}>{s.unit}</span>
            </div>
            <div className="text-xs text-gray-500 mt-2">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Company page card */}
      <div className="mb-6">
        <h2 className="text-sm text-gray-500 mb-3 uppercase tracking-wider">会社トップページ</h2>
        <div className="bg-surface border border-border rounded-lg p-5"
          style={{ borderLeft: '4px solid #C9A84C' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <div style={{
                  width: '28px', height: '28px', borderRadius: '6px',
                  background: 'linear-gradient(135deg, #C9A84C, #A8893F)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 'bold', color: '#000',
                }}>医</div>
                <h3 className="text-lg font-semibold text-white">{company.name}</h3>
                <StatusBadge status={company.publishedAt ? 'published' : 'draft'} />
              </div>
              <p className="text-sm text-gray-400 mb-1 ml-10">{company.tagline}</p>
              <p className="text-xs text-gray-600 ml-10">最終更新: {fmt(company.updatedAt)}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => navigate('/hp/preview/company')}
                className="px-3 py-1.5 text-xs border border-border rounded text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
              >
                プレビュー
              </button>
              <button
                onClick={() => navigate('/hp/editor/company')}
                className="px-3 py-1.5 text-xs bg-gold/15 border border-gold/30 rounded text-gold hover:bg-gold/25 transition-colors"
              >
                編集
              </button>
              <button
                onClick={() => company.publishedAt ? unpublishPage('company') : publishPage('company')}
                className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                  company.publishedAt
                    ? 'border-green-600/30 bg-green-600/10 text-green-400 hover:bg-green-600/20'
                    : 'border-gray-600 text-gray-500 hover:border-gray-400 hover:text-gray-300'
                }`}
              >
                {company.publishedAt ? '公開中' : '公開する'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Clinic cards */}
      <div>
        <h2 className="text-sm text-gray-500 mb-3 uppercase tracking-wider">系列院ページ</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {clinics.map(clinic => (
            <ClinicDashCard
              key={clinic.id}
              clinic={clinic}
              onEdit={() => navigate(`/hp/editor/${clinic.id}`)}
              onPreview={() => navigate(`/hp/preview/${clinic.id}`)}
              onPublish={() => clinic.status === 'published' ? unpublishPage(clinic.id) : publishPage(clinic.id)}
              fmt={fmt}
            />
          ))}
        </div>
      </div>

      {/* Blog sync status */}
      <div className="mt-8 bg-surface border border-border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              backgroundColor: publishedArticles > 0 ? '#4A8A60' : '#555',
              boxShadow: publishedArticles > 0 ? '0 0 8px #4A8A6080' : 'none',
            }} />
            <div>
              <p className="text-sm text-white">ブログ連携状態</p>
              <p className="text-xs text-gray-500">
                {publishedArticles > 0
                  ? `${publishedArticles}件の公開記事が各院HPのブログセクションに表示されます`
                  : 'ブログ記事を公開するとHPのブログセクションに表示されます'
                }
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/blog')}
            className="text-xs text-gold border border-gold/30 px-3 py-1.5 rounded hover:bg-gold/10 transition-colors"
          >
            ブログ管理へ
          </button>
        </div>
      </div>
    </div>
  )
}

function ClinicDashCard({ clinic, onEdit, onPreview, onPublish, fmt }) {
  const primary = clinic.theme?.primaryColor || '#2D5A3D'
  const secondary = clinic.theme?.secondaryColor || '#C9A84C'
  const isPublished = clinic.status === 'published'

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden"
      style={{ borderTop: `3px solid ${primary}` }}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {/* Color swatch */}
              <div style={{
                width: '12px', height: '12px', borderRadius: '50%',
                backgroundColor: primary,
                boxShadow: `0 0 6px ${primary}80`,
              }} />
              <h3 className="font-semibold text-white text-base">{clinic.name}</h3>
              <StatusBadge status={isPublished ? 'published' : 'draft'} />
            </div>
            <p className="text-xs text-gray-400 ml-5">{clinic.tagline}</p>
          </div>
          <div style={{
            padding: '4px 10px', borderRadius: '4px', fontSize: '11px',
            backgroundColor: `${primary}15`,
            color: secondary,
            border: `1px solid ${primary}30`,
          }}>
            {clinic.theme?.palette || 'カスタム'}
          </div>
        </div>

        {/* Services chips */}
        <div className="flex flex-wrap gap-1.5 mb-4 ml-5">
          {(clinic.services || []).slice(0, 3).map((s, i) => (
            <span key={i} style={{
              fontSize: '10px', padding: '2px 8px',
              backgroundColor: `${primary}12`,
              color: primary,
              border: `1px solid ${primary}25`,
              borderRadius: '4px',
            }}>
              {s.icon} {s.name}
            </span>
          ))}
          {(clinic.services || []).length > 3 && (
            <span className="text-xs text-gray-600">+{clinic.services.length - 3}</span>
          )}
        </div>

        <div className="text-xs text-gray-600 mb-3 ml-5">
          最終更新: {fmt(clinic.updatedAt)}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onPreview}
            className="flex-1 py-2 text-xs border border-border rounded text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
          >
            プレビュー
          </button>
          <button
            onClick={onEdit}
            className="flex-1 py-2 text-xs rounded border transition-colors"
            style={{
              backgroundColor: `${primary}15`,
              borderColor: `${primary}40`,
              color: secondary,
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = `${primary}25`}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = `${primary}15`}
          >
            編集
          </button>
          <button
            onClick={onPublish}
            className={`flex-1 py-2 text-xs rounded border transition-colors ${
              isPublished
                ? 'border-green-600/30 bg-green-600/10 text-green-400 hover:bg-green-600/20'
                : 'border-gray-600 text-gray-500 hover:border-gray-400 hover:text-gray-300'
            }`}
          >
            {isPublished ? '公開中' : '公開する'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const isPublished = status === 'published'
  return (
    <span style={{
      fontSize: '10px', padding: '2px 8px',
      borderRadius: '999px',
      backgroundColor: isPublished ? 'rgba(74,138,96,0.15)' : 'rgba(80,80,80,0.2)',
      color: isPublished ? '#4A8A60' : '#666',
      border: `1px solid ${isPublished ? 'rgba(74,138,96,0.3)' : 'rgba(80,80,80,0.3)'}`,
    }}>
      {isPublished ? '公開中' : '準備中'}
    </span>
  )
}
