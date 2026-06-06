// HPPreview.jsx - Full-screen preview page (outside Layout, no sidebar)
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useHP } from '../contexts/HPContext.jsx'
import CompanyTopPage from '../components/hp/CompanyTopPage.jsx'
import ClinicPage from '../components/hp/ClinicPage.jsx'

export default function HPPreview() {
  const { pageId } = useParams()
  const navigate = useNavigate()
  const { company, clinics, publishPage, unpublishPage } = useHP()

  // Allow navigating between pages in preview mode
  const [previewPageId, setPreviewPageId] = useState(pageId)

  const isCompany = previewPageId === 'company'
  const clinic = isCompany ? null : clinics.find(c => c.id === previewPageId)

  const isPublished = isCompany ? !!company.publishedAt : clinic?.status === 'published'
  const [publishMsg, setPublishMsg] = useState('')

  function handlePublishToggle() {
    if (isPublished) {
      unpublishPage(previewPageId)
      setPublishMsg('非公開にしました')
    } else {
      publishPage(previewPageId)
      setPublishMsg('公開しました！')
    }
    setTimeout(() => setPublishMsg(''), 2000)
  }

  function handleClinicClick(clinicId) {
    setPreviewPageId(clinicId)
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Floating control bar */}
      <div style={{
        position: 'fixed', top: '16px', right: '16px', zIndex: 9999,
        display: 'flex', alignItems: 'center', gap: '8px',
        backgroundColor: 'rgba(10,10,10,0.92)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(201,168,76,0.3)',
        borderRadius: '8px',
        padding: '8px 12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}>
        {/* Preview mode indicator */}
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          backgroundColor: '#C9A84C',
          boxShadow: '0 0 8px #C9A84C80',
        }} />
        <span style={{ fontSize: '11px', color: '#888', letterSpacing: '0.05em' }}>
          プレビューモード
        </span>

        {/* Breadcrumb */}
        {!isCompany && (
          <>
            <span style={{ color: '#444', fontSize: '11px' }}>|</span>
            <button
              onClick={() => setPreviewPageId('company')}
              style={{
                fontSize: '11px', color: '#C9A84C', background: 'none',
                border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              会社HP
            </button>
            <span style={{ color: '#444', fontSize: '11px' }}>›</span>
            <span style={{ fontSize: '11px', color: '#999' }}>
              {clinic?.name || ''}
            </span>
          </>
        )}

        <span style={{ color: '#444', fontSize: '11px' }}>|</span>

        {publishMsg ? (
          <span style={{ fontSize: '11px', color: '#4A8A60' }}>{publishMsg}</span>
        ) : (
          <button
            onClick={handlePublishToggle}
            style={{
              fontSize: '11px', padding: '4px 12px',
              borderRadius: '4px', cursor: 'pointer', border: 'none',
              backgroundColor: isPublished ? 'rgba(74,138,96,0.2)' : 'rgba(201,168,76,0.2)',
              color: isPublished ? '#4A8A60' : '#C9A84C',
              letterSpacing: '0.05em',
            }}
          >
            {isPublished ? '公開中 — 非公開にする' : '公開する'}
          </button>
        )}

        <button
          onClick={() => navigate(`/hp/editor/${previewPageId}`)}
          style={{
            fontSize: '11px', padding: '4px 12px',
            borderRadius: '4px', cursor: 'pointer',
            backgroundColor: 'rgba(201,168,76,0.15)',
            border: '1px solid rgba(201,168,76,0.3)',
            color: '#C9A84C', letterSpacing: '0.05em',
          }}
        >
          ← 編集に戻る
        </button>
      </div>

      {/* Page content */}
      {isCompany ? (
        <CompanyTopPage
          company={company}
          clinics={clinics}
          onClinicClick={handleClinicClick}
        />
      ) : clinic ? (
        <ClinicPage clinic={clinic} readOnly={true} />
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100vh', backgroundColor: '#0A0A0A', color: '#888',
          flexDirection: 'column', gap: '1rem',
        }}>
          <p>ページが見つかりません</p>
          <button
            onClick={() => navigate('/hp')}
            style={{
              padding: '8px 20px', borderRadius: '4px', cursor: 'pointer',
              backgroundColor: '#C9A84C', color: '#000', border: 'none',
            }}
          >
            HP管理に戻る
          </button>
        </div>
      )}
    </div>
  )
}
