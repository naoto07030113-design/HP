// CompanyTopPage.jsx - Premium dark company homepage with gold accents

export default function CompanyTopPage({ company, clinics, onClinicClick }) {
  const publishedClinics = clinics.filter(c => c.status === 'published').length

  return (
    <div style={{ fontFamily: '"Noto Sans JP", Inter, system-ui, sans-serif', backgroundColor: '#0A0A0A', color: '#F5F5F5', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        backgroundColor: 'rgba(10,10,10,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(201,168,76,0.2)',
        padding: '0 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '64px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '6px',
            background: 'linear-gradient(135deg, #C9A84C, #A8893F)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 'bold', color: '#000',
          }}>医</div>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#E2C97E', letterSpacing: '0.05em' }}>
            {company.name}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '2rem', fontSize: '13px', color: '#999' }}>
          <a href="#clinics" style={{ color: '#999', textDecoration: 'none' }}>各院のご案内</a>
          <a href="#philosophy" style={{ color: '#999', textDecoration: 'none' }}>経営理念</a>
          <a href="#contact" style={{ color: '#999', textDecoration: 'none' }}>お問い合わせ</a>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #0A0A0A 0%, #141414 50%, #0F0F0A 100%)',
        position: 'relative', overflow: 'hidden',
        paddingTop: '64px',
      }}>
        {/* Decorative background lines */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 60px, #C9A84C 60px, #C9A84C 61px), repeating-linear-gradient(90deg, transparent, transparent 60px, #C9A84C 60px, #C9A84C 61px)',
        }} />
        {/* Gold circle accent */}
        <div style={{
          position: 'absolute', right: '-200px', top: '50%', transform: 'translateY(-50%)',
          width: '600px', height: '600px', borderRadius: '50%',
          border: '1px solid rgba(201,168,76,0.1)',
          boxShadow: '0 0 200px rgba(201,168,76,0.05)',
        }} />
        <div style={{
          position: 'absolute', right: '-100px', top: '50%', transform: 'translateY(-50%)',
          width: '400px', height: '400px', borderRadius: '50%',
          border: '1px solid rgba(201,168,76,0.15)',
        }} />

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: '900px', padding: '2rem' }}>
          <div style={{
            display: 'inline-block', marginBottom: '1.5rem',
            padding: '6px 20px', borderRadius: '999px',
            border: '1px solid rgba(201,168,76,0.4)',
            backgroundColor: 'rgba(201,168,76,0.08)',
            fontSize: '12px', letterSpacing: '0.15em', color: '#C9A84C',
            textTransform: 'uppercase',
          }}>
            {company.established} &nbsp;|&nbsp; Chiba, Japan
          </div>

          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 4rem)',
            fontWeight: '300',
            letterSpacing: '0.08em',
            lineHeight: 1.2,
            marginBottom: '0.75rem',
            color: '#F5F5F5',
          }}>
            {company.name}
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.5rem)',
            color: '#C9A84C',
            letterSpacing: '0.1em',
            marginBottom: '1rem',
            fontWeight: '300',
          }}>
            {company.tagline}
          </p>
          <p style={{ fontSize: '14px', color: '#666', letterSpacing: '0.05em', marginBottom: '3rem' }}>
            {company.taglineEn}
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="#clinics"
              style={{
                display: 'inline-block', padding: '14px 36px',
                background: 'linear-gradient(135deg, #C9A84C, #A8893F)',
                color: '#000', fontWeight: '600', fontSize: '14px',
                borderRadius: '4px', textDecoration: 'none', letterSpacing: '0.05em',
              }}
            >
              各院のご案内
            </a>
            <a
              href="#philosophy"
              style={{
                display: 'inline-block', padding: '14px 36px',
                border: '1px solid rgba(201,168,76,0.5)',
                color: '#C9A84C', fontWeight: '400', fontSize: '14px',
                borderRadius: '4px', textDecoration: 'none', letterSpacing: '0.05em',
              }}
            >
              経営理念
            </a>
          </div>

          {/* Stats */}
          <div style={{
            display: 'flex', gap: '3rem', justifyContent: 'center',
            marginTop: '5rem', paddingTop: '2rem',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            {[
              { num: clinics.length, label: '系列院' },
              { num: publishedClinics, label: '公開中' },
              { num: '千葉県', label: '拠点エリア' },
            ].map((stat, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: '300', color: '#C9A84C', letterSpacing: '0.05em' }}>
                  {typeof stat.num === 'number' ? stat.num : stat.num}
                  {typeof stat.num === 'number' && <span style={{ fontSize: '1rem' }}>院</span>}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', letterSpacing: '0.1em' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Clinics section */}
      <section id="clinics" style={{
        padding: '6rem 2rem',
        backgroundColor: '#0D0D0D',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{
              display: 'inline-block', marginBottom: '1rem',
              width: '40px', height: '2px',
              background: 'linear-gradient(90deg, #C9A84C, transparent)',
            }} />
            <h2 style={{
              fontSize: '2rem', fontWeight: '300', letterSpacing: '0.15em', color: '#F5F5F5',
            }}>
              各院のご案内
            </h2>
            <p style={{ fontSize: '13px', color: '#666', marginTop: '0.5rem', letterSpacing: '0.05em' }}>
              OUR CLINICS
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
            gap: '1.5rem',
          }}>
            {clinics.map((clinic) => (
              <ClinicCard
                key={clinic.id}
                clinic={clinic}
                onClick={() => onClinicClick && onClinicClick(clinic.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy section */}
      <section id="philosophy" style={{
        padding: '6rem 2rem',
        background: 'linear-gradient(135deg, #0A0A0A, #111108)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', left: '-100px', top: '50%', transform: 'translateY(-50%)',
          width: '400px', height: '400px', borderRadius: '50%',
          border: '1px solid rgba(201,168,76,0.08)',
        }} />
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <p style={{
            fontSize: '11px', letterSpacing: '0.3em', color: '#C9A84C',
            textTransform: 'uppercase', marginBottom: '2rem',
          }}>
            Philosophy
          </p>
          <blockquote style={{
            fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
            fontWeight: '300', lineHeight: 1.8,
            color: '#E2C97E',
            borderLeft: '3px solid #C9A84C',
            paddingLeft: '2rem',
            textAlign: 'left',
            margin: '0 auto 2rem',
          }}>
            {company.philosophy}
          </blockquote>
          <p style={{
            fontSize: '15px', lineHeight: 1.9, color: '#888',
            textAlign: 'left',
          }}>
            {company.description}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" style={{
        padding: '3rem 2rem',
        borderTop: '1px solid rgba(201,168,76,0.15)',
        backgroundColor: '#090909',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                width: '24px', height: '24px', borderRadius: '4px',
                background: 'linear-gradient(135deg, #C9A84C, #A8893F)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '10px', fontWeight: 'bold', color: '#000',
              }}>医</div>
              <span style={{ fontSize: '13px', color: '#C9A84C', fontWeight: '500' }}>{company.name}</span>
            </div>
            <p style={{ fontSize: '12px', color: '#555' }}>{company.address}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '11px', color: '#444', letterSpacing: '0.05em' }}>
              &copy; {new Date().getFullYear()} {company.name}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function ClinicCard({ clinic, onClick }) {
  const isPublished = clinic.status === 'published'
  const primary = clinic.theme?.primaryColor || '#2D5A3D'
  const secondary = clinic.theme?.secondaryColor || '#C9A84C'

  return (
    <div
      style={{
        backgroundColor: '#141414',
        border: '1px solid #2A2A2A',
        borderRadius: '8px',
        overflow: 'hidden',
        transition: 'border-color 0.2s, transform 0.2s',
        cursor: 'pointer',
        position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = primary
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#2A2A2A'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Color bar */}
      <div style={{
        height: '4px',
        background: `linear-gradient(90deg, ${primary}, ${secondary})`,
      }} />

      <div style={{ padding: '1.75rem' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              {/* Color swatch */}
              <div style={{
                width: '12px', height: '12px', borderRadius: '50%',
                backgroundColor: primary,
                boxShadow: `0 0 8px ${primary}80`,
              }} />
              <h3 style={{
                fontSize: '1.2rem', fontWeight: '600', color: '#F5F5F5',
                letterSpacing: '0.03em',
              }}>
                {clinic.name}
              </h3>
            </div>
            <p style={{ fontSize: '11px', color: '#555', letterSpacing: '0.1em' }}>
              {clinic.nameEn}
            </p>
          </div>
          <span style={{
            fontSize: '10px', padding: '3px 10px',
            borderRadius: '999px',
            backgroundColor: isPublished ? 'rgba(74,138,96,0.15)' : 'rgba(80,80,80,0.2)',
            color: isPublished ? '#4A8A60' : '#666',
            border: `1px solid ${isPublished ? 'rgba(74,138,96,0.3)' : 'rgba(80,80,80,0.3)'}`,
            letterSpacing: '0.05em', whiteSpace: 'nowrap',
          }}>
            {isPublished ? '公開中' : '準備中'}
          </span>
        </div>

        {/* Tagline */}
        <p style={{
          fontSize: '14px', color: '#AAA', lineHeight: 1.6,
          marginBottom: '1.25rem',
          borderLeft: `3px solid ${primary}`,
          paddingLeft: '12px',
        }}>
          {clinic.tagline}
        </p>

        {/* Services chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '1.5rem' }}>
          {(clinic.services || []).slice(0, 4).map((s, i) => (
            <span key={i} style={{
              fontSize: '11px', padding: '3px 10px',
              borderRadius: '4px',
              backgroundColor: `${primary}18`,
              color: secondary,
              border: `1px solid ${primary}30`,
              letterSpacing: '0.03em',
            }}>
              {s.icon} {s.name}
            </span>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onClick}
          style={{
            width: '100%', padding: '10px',
            backgroundColor: `${primary}15`,
            border: `1px solid ${primary}40`,
            borderRadius: '4px',
            color: secondary,
            fontSize: '13px', fontWeight: '500',
            cursor: 'pointer', letterSpacing: '0.05em',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = `${primary}30`}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = `${primary}15`}
        >
          詳しく見る →
        </button>
      </div>
    </div>
  )
}
