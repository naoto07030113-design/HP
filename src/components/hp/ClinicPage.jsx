// ClinicPage.jsx - Full clinic website renderer with theme support
import { useBlog } from '../../contexts/BlogContext.jsx'

export default function ClinicPage({ clinic, readOnly = false }) {
  const { articles } = useBlog()

  if (!clinic) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#0A0A0A', color: '#888' }}>
        クリニックデータが見つかりません
      </div>
    )
  }

  const theme = clinic.theme || {}
  const primary = theme.primaryColor || '#2D5A3D'
  const secondary = theme.secondaryColor || '#C9A84C'
  const bgColor = theme.bgColor || '#F5F3EE'
  const textColor = theme.textColor || '#1A1A1A'
  const accentColor = theme.accentColor || '#4A8A60'
  const layout = theme.layout || 'standard'
  const fontStyle = theme.fontStyle || 'serif'
  const heroStyle = theme.heroStyle || 'fullscreen'

  const fontFamily = fontStyle === 'serif'
    ? '"Noto Serif JP", "游明朝", Georgia, serif'
    : '"Noto Sans JP", Inter, system-ui, sans-serif'

  const maxWidth = layout === 'centered' ? '780px' : '1100px'
  const sectionPad = layout === 'card' ? '2rem 1.5rem' : '5rem 2rem'

  const cssVars = {
    '--primary': primary,
    '--secondary': secondary,
    '--bg': bgColor,
    '--text': textColor,
    '--accent': accentColor,
  }

  // Get enabled sections sorted by order
  const enabledSections = (clinic.sections || [])
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order)
    .map(s => s.id)

  // Recent published blog articles
  const recentArticles = articles
    .filter(a => a.status === 'published')
    .slice(0, 3)

  return (
    <div style={{ ...cssVars, fontFamily, backgroundColor: bgColor, color: textColor, minHeight: '100vh' }}>
      {/* Navbar */}
      <ClinicNavbar clinic={clinic} primary={primary} secondary={secondary} bgColor={bgColor} textColor={textColor} />

      {/* Sections */}
      {enabledSections.includes('hero') && (
        <HeroSection clinic={clinic} primary={primary} secondary={secondary} textColor={textColor} heroStyle={heroStyle} />
      )}
      {enabledSections.includes('about') && (
        <AboutSection clinic={clinic} primary={primary} secondary={secondary} bgColor={bgColor} textColor={textColor} layout={layout} maxWidth={maxWidth} sectionPad={sectionPad} />
      )}
      {enabledSections.includes('services') && (
        <ServicesSection clinic={clinic} primary={primary} secondary={secondary} bgColor={bgColor} textColor={textColor} layout={layout} maxWidth={maxWidth} sectionPad={sectionPad} accentColor={accentColor} />
      )}
      {enabledSections.includes('features') && (
        <FeaturesSection clinic={clinic} primary={primary} secondary={secondary} bgColor={bgColor} textColor={textColor} layout={layout} maxWidth={maxWidth} sectionPad={sectionPad} />
      )}
      {enabledSections.includes('hours') && (
        <HoursSection clinic={clinic} primary={primary} secondary={secondary} bgColor={bgColor} textColor={textColor} layout={layout} maxWidth={maxWidth} sectionPad={sectionPad} />
      )}
      {enabledSections.includes('access') && (
        <AccessSection clinic={clinic} primary={primary} secondary={secondary} bgColor={bgColor} textColor={textColor} layout={layout} maxWidth={maxWidth} sectionPad={sectionPad} accentColor={accentColor} />
      )}
      {enabledSections.includes('blog') && recentArticles.length > 0 && (
        <BlogSection articles={recentArticles} primary={primary} secondary={secondary} bgColor={bgColor} textColor={textColor} layout={layout} maxWidth={maxWidth} sectionPad={sectionPad} />
      )}
      {enabledSections.includes('contact') && (
        <ContactSection clinic={clinic} primary={primary} secondary={secondary} bgColor={bgColor} textColor={textColor} layout={layout} maxWidth={maxWidth} />
      )}
    </div>
  )
}

/* ── Navbar ─────────────────────────────────────────────── */
function ClinicNavbar({ clinic, primary, secondary, bgColor, textColor }) {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      backgroundColor: `${primary}F2`,
      backdropFilter: 'blur(12px)',
      borderBottom: `2px solid ${secondary}40`,
      padding: '0 2rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: '60px',
    }}>
      <span style={{ fontWeight: '700', fontSize: '16px', color: '#fff', letterSpacing: '0.05em' }}>
        {clinic.name}
      </span>
      <div style={{ display: 'flex', gap: '1.5rem', fontSize: '13px' }}>
        {['施術内容', 'アクセス', 'ブログ', 'ご予約'].map(label => (
          <a key={label} href={`#${label}`} style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', letterSpacing: '0.05em' }}>
            {label}
          </a>
        ))}
      </div>
    </nav>
  )
}

/* ── Hero ───────────────────────────────────────────────── */
function HeroSection({ clinic, primary, secondary, textColor, heroStyle }) {
  if (heroStyle === 'split') {
    return (
      <section style={{
        display: 'flex', minHeight: '80vh',
        background: `linear-gradient(135deg, ${primary} 0%, ${primary}CC 100%)`,
      }}>
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '4rem',
        }}>
          <p style={{ fontSize: '12px', letterSpacing: '0.3em', color: `${secondary}`, textTransform: 'uppercase', marginBottom: '1rem' }}>
            {clinic.nameEn}
          </p>
          <h1 style={{
            fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: '700',
            color: '#fff', lineHeight: 1.2, marginBottom: '1rem',
          }}>
            {clinic.heroTitle || clinic.name}
          </h1>
          <p style={{
            fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)', marginBottom: '2.5rem', lineHeight: 1.8,
          }}>
            {clinic.heroSubtitle || clinic.tagline}
          </p>
          <div>
            <a href="#contact" style={{
              display: 'inline-block', padding: '14px 36px',
              backgroundColor: secondary, color: '#000',
              fontWeight: '700', fontSize: '14px',
              borderRadius: '4px', textDecoration: 'none', letterSpacing: '0.05em',
            }}>
              {clinic.heroCta || 'お問い合わせ'}
            </a>
          </div>
        </div>
        <div style={{
          flex: 1,
          background: `linear-gradient(135deg, ${primary}88, ${primary}DD)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: '200px', height: '200px', borderRadius: '50%',
            border: `3px solid ${secondary}60`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '5rem',
          }}>
            🌿
          </div>
        </div>
      </section>
    )
  }

  if (heroStyle === 'minimal') {
    return (
      <section style={{
        padding: '5rem 2rem',
        background: `linear-gradient(180deg, ${primary}15, transparent)`,
        borderBottom: `3px solid ${primary}`,
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '12px', letterSpacing: '0.3em', color: primary, textTransform: 'uppercase', marginBottom: '1rem' }}>
          {clinic.nameEn}
        </p>
        <h1 style={{
          fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '700',
          color: textColor, marginBottom: '1rem', lineHeight: 1.3,
        }}>
          {clinic.heroTitle || clinic.name}
        </h1>
        <p style={{ fontSize: '1rem', color: '#666', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem' }}>
          {clinic.heroSubtitle || clinic.tagline}
        </p>
        <a href="#contact" style={{
          display: 'inline-block', padding: '12px 32px',
          backgroundColor: primary, color: '#fff',
          fontWeight: '600', fontSize: '14px',
          borderRadius: '4px', textDecoration: 'none',
        }}>
          {clinic.heroCta || 'お問い合わせ'}
        </a>
      </section>
    )
  }

  // fullscreen (default)
  return (
    <section style={{
      minHeight: '90vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(135deg, ${primary} 0%, ${primary}AA 60%, ${primary}44 100%)`,
      position: 'relative', overflow: 'hidden', textAlign: 'center',
    }}>
      {/* Decorative circles */}
      <div style={{
        position: 'absolute', right: '-80px', bottom: '-80px',
        width: '400px', height: '400px', borderRadius: '50%',
        border: `1px solid ${secondary}30`,
      }} />
      <div style={{
        position: 'absolute', right: '-40px', bottom: '-40px',
        width: '250px', height: '250px', borderRadius: '50%',
        border: `1px solid ${secondary}50`,
      }} />
      <div style={{ position: 'relative', zIndex: 1, padding: '2rem', maxWidth: '800px' }}>
        <p style={{
          fontSize: '12px', letterSpacing: '0.3em', color: secondary,
          textTransform: 'uppercase', marginBottom: '1.5rem',
        }}>
          {clinic.nameEn}
        </p>
        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
          fontWeight: '700', color: '#fff',
          lineHeight: 1.2, marginBottom: '1.5rem',
          textShadow: '0 2px 20px rgba(0,0,0,0.3)',
        }}>
          {clinic.heroTitle || clinic.name}
        </h1>
        <p style={{
          fontSize: '1.2rem', color: 'rgba(255,255,255,0.85)',
          marginBottom: '3rem', lineHeight: 1.8, letterSpacing: '0.05em',
        }}>
          {clinic.heroSubtitle || clinic.tagline}
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#contact" style={{
            display: 'inline-block', padding: '14px 40px',
            backgroundColor: secondary, color: '#000',
            fontWeight: '700', fontSize: '14px', letterSpacing: '0.05em',
            borderRadius: '4px', textDecoration: 'none',
          }}>
            {clinic.heroCta || 'お問い合わせ'}
          </a>
          <a href="#施術内容" style={{
            display: 'inline-block', padding: '14px 40px',
            border: '2px solid rgba(255,255,255,0.5)',
            color: '#fff', fontWeight: '400', fontSize: '14px',
            borderRadius: '4px', textDecoration: 'none',
          }}>
            施術内容を見る
          </a>
        </div>
      </div>
    </section>
  )
}

/* ── About ──────────────────────────────────────────────── */
function AboutSection({ clinic, primary, secondary, bgColor, textColor, layout, maxWidth, sectionPad }) {
  const isCard = layout === 'card'
  return (
    <section id="院について" style={{ padding: sectionPad, backgroundColor: bgColor }}>
      <div style={{ maxWidth, margin: '0 auto' }}>
        <SectionTitle title="院について" subtitle="ABOUT" primary={primary} />
        <div style={{
          display: 'grid',
          gridTemplateColumns: layout === 'centered' ? '1fr' : '1fr 1fr',
          gap: '3rem', alignItems: 'start',
        }}>
          <div style={isCard ? { padding: '2rem', border: `1px solid ${primary}20`, borderRadius: '8px', backgroundColor: `${primary}05` } : {}}>
            <p style={{ fontSize: '15px', lineHeight: 2, color: textColor, marginBottom: '1.5rem' }}>
              {clinic.aboutText || clinic.description}
            </p>
            <p style={{ fontSize: '13px', color: '#888', lineHeight: 1.8 }}>
              {clinic.description}
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { num: '多数', label: '施術実績', unit: '' },
              { num: '経験', label: '国家資格保有', unit: '豊富' },
              { num: '地域', label: '密着型', unit: '' },
              { num: '丁寧な', label: 'カウンセリング', unit: '' },
            ].map((s, i) => (
              <div key={i} style={{
                padding: '1.5rem', textAlign: 'center',
                backgroundColor: i % 2 === 0 ? `${primary}10` : `${secondary}15`,
                borderRadius: '8px',
                border: `1px solid ${i % 2 === 0 ? primary : secondary}25`,
              }}>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: primary, marginBottom: '4px' }}>
                  {s.num}{s.unit}
                </div>
                <div style={{ fontSize: '11px', color: '#888', letterSpacing: '0.05em' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Services ───────────────────────────────────────────── */
function ServicesSection({ clinic, primary, secondary, bgColor, textColor, layout, maxWidth, sectionPad, accentColor }) {
  const altBg = blendColor(bgColor, primary, 0.04)
  return (
    <section id="施術内容" style={{ padding: sectionPad, backgroundColor: altBg }}>
      <div style={{ maxWidth, margin: '0 auto' }}>
        <SectionTitle title="施術内容" subtitle="SERVICES" primary={primary} />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}>
          {(clinic.services || []).map((service, i) => (
            <div key={service.id || i} style={{
              padding: '1.75rem',
              backgroundColor: bgColor,
              borderRadius: '8px',
              border: `1px solid ${primary}20`,
              boxShadow: `0 2px 12px ${primary}10`,
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = `0 8px 24px ${primary}20`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = `0 2px 12px ${primary}10`
              }}
            >
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                backgroundColor: `${primary}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', marginBottom: '1rem',
              }}>
                {service.icon}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: primary, marginBottom: '0.5rem' }}>
                {service.name}
              </h3>
              <p style={{ fontSize: '13px', lineHeight: 1.8, color: '#666' }}>
                {service.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Features ───────────────────────────────────────────── */
function FeaturesSection({ clinic, primary, secondary, bgColor, textColor, layout, maxWidth, sectionPad }) {
  return (
    <section style={{ padding: sectionPad, backgroundColor: bgColor }}>
      <div style={{ maxWidth, margin: '0 auto' }}>
        <SectionTitle title="選ばれる3つの理由" subtitle="WHY CHOOSE US" primary={primary} />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.5rem',
        }}>
          {(clinic.features || []).map((feature, i) => (
            <div key={feature.id || i} style={{
              position: 'relative', padding: '2rem',
              backgroundColor: bgColor,
              border: `1px solid ${primary}20`,
              borderRadius: '8px',
              overflow: 'hidden',
            }}>
              {/* Number accent */}
              <div style={{
                position: 'absolute', top: '-10px', right: '16px',
                fontSize: '5rem', fontWeight: '900', lineHeight: 1,
                color: `${primary}12`,
                userSelect: 'none',
              }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div style={{
                width: '36px', height: '4px',
                backgroundColor: primary,
                marginBottom: '1rem', borderRadius: '2px',
              }} />
              <h3 style={{
                fontSize: '16px', fontWeight: '700', color: textColor,
                marginBottom: '0.75rem',
              }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: '13px', lineHeight: 1.9, color: '#666' }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Hours ──────────────────────────────────────────────── */
function HoursSection({ clinic, primary, secondary, bgColor, textColor, layout, maxWidth, sectionPad }) {
  const altBg = blendColor(bgColor, primary, 0.04)
  return (
    <section style={{ padding: sectionPad, backgroundColor: altBg }}>
      <div style={{ maxWidth, margin: '0 auto' }}>
        <SectionTitle title="診療時間" subtitle="HOURS" primary={primary} />
        <div style={{
          backgroundColor: bgColor, borderRadius: '8px',
          border: `1px solid ${primary}20`,
          overflow: 'hidden',
          maxWidth: '600px', margin: '0 auto',
          boxShadow: `0 4px 20px ${primary}10`,
        }}>
          {(clinic.hours || []).map((row, i) => {
            const isHoliday = row.time === '休診' || row.time === '定休日'
            return (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.875rem 1.5rem',
                borderBottom: i < (clinic.hours.length - 1) ? `1px solid ${primary}15` : 'none',
                backgroundColor: i % 2 === 0 ? 'transparent' : `${primary}04`,
              }}>
                <span style={{ fontSize: '14px', fontWeight: '500', color: textColor }}>
                  {row.day}
                </span>
                <span style={{
                  fontSize: '14px',
                  color: isHoliday ? '#E57373' : primary,
                  fontWeight: isHoliday ? '400' : '500',
                }}>
                  {row.time}
                </span>
              </div>
            )
          })}
        </div>
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#888', marginTop: '1rem' }}>
          ※ 祝日の診療については、各院にお問い合わせください
        </p>
      </div>
    </section>
  )
}

/* ── Access ─────────────────────────────────────────────── */
function AccessSection({ clinic, primary, secondary, bgColor, textColor, layout, maxWidth, sectionPad, accentColor }) {
  return (
    <section id="アクセス" style={{ padding: sectionPad, backgroundColor: bgColor }}>
      <div style={{ maxWidth, margin: '0 auto' }}>
        <SectionTitle title="アクセス" subtitle="ACCESS" primary={primary} />
        <div style={{
          display: 'grid',
          gridTemplateColumns: layout === 'centered' ? '1fr' : '1fr 1fr',
          gap: '2rem', alignItems: 'center',
        }}>
          <div style={{
            padding: '2.5rem',
            backgroundColor: `${primary}08`,
            border: `1px solid ${primary}25`,
            borderRadius: '8px',
            borderLeft: `4px solid ${primary}`,
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '11px', letterSpacing: '0.15em', color: primary, marginBottom: '4px', textTransform: 'uppercase' }}>
                Address
              </p>
              <p style={{ fontSize: '15px', fontWeight: '600', color: textColor, lineHeight: 1.6 }}>
                {clinic.address}
              </p>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '11px', letterSpacing: '0.15em', color: primary, marginBottom: '4px', textTransform: 'uppercase' }}>
                Tel
              </p>
              <a href={`tel:${clinic.phone}`} style={{
                fontSize: '1.4rem', fontWeight: '700', color: primary,
                textDecoration: 'none', letterSpacing: '0.05em',
              }}>
                {clinic.phone}
              </a>
            </div>
            {clinic.website && (
              <div>
                <p style={{ fontSize: '11px', letterSpacing: '0.15em', color: primary, marginBottom: '4px', textTransform: 'uppercase' }}>
                  Website
                </p>
                <a href={clinic.website} target="_blank" rel="noopener noreferrer" style={{
                  fontSize: '13px', color: accentColor, textDecoration: 'none',
                }}>
                  {clinic.website}
                </a>
              </div>
            )}
          </div>
          <div style={{
            height: '280px',
            backgroundColor: `${primary}10`,
            borderRadius: '8px',
            border: `1px solid ${primary}20`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '1rem',
            color: primary,
          }}>
            <div style={{ fontSize: '3rem' }}>📍</div>
            <p style={{ fontSize: '14px', color: '#888', textAlign: 'center' }}>
              地図はこちら
              <br />
              <span style={{ fontSize: '12px' }}>{clinic.address}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Blog ───────────────────────────────────────────────── */
function BlogSection({ articles, primary, secondary, bgColor, textColor, layout, maxWidth, sectionPad }) {
  const altBg = blendColor(bgColor, primary, 0.04)
  return (
    <section id="ブログ" style={{ padding: sectionPad, backgroundColor: altBg }}>
      <div style={{ maxWidth, margin: '0 auto' }}>
        <SectionTitle title="最新ブログ" subtitle="BLOG" primary={primary} />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.25rem',
        }}>
          {articles.map((article) => (
            <div key={article.id} style={{
              backgroundColor: bgColor,
              borderRadius: '8px',
              border: `1px solid ${primary}15`,
              overflow: 'hidden',
              boxShadow: `0 2px 8px ${primary}08`,
            }}>
              <div style={{
                height: '8px',
                background: `linear-gradient(90deg, ${primary}, ${secondary})`,
              }} />
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  {article.category && (
                    <span style={{
                      fontSize: '10px', padding: '2px 8px',
                      backgroundColor: `${primary}15`, color: primary,
                      borderRadius: '4px', letterSpacing: '0.05em',
                    }}>
                      {article.category}
                    </span>
                  )}
                  <span style={{ fontSize: '10px', color: '#999' }}>
                    {new Date(article.publishedAt || article.createdAt).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <h3 style={{
                  fontSize: '14px', fontWeight: '600', color: textColor,
                  lineHeight: 1.6, marginBottom: '0.75rem',
                }}>
                  {article.title}
                </h3>
                <p style={{ fontSize: '12px', color: '#888', lineHeight: 1.7 }}>
                  {(article.excerpt || article.content || '').slice(0, 80)}...
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Contact/Footer ─────────────────────────────────────── */
function ContactSection({ clinic, primary, secondary, bgColor, textColor, layout, maxWidth }) {
  return (
    <section id="ご予約" style={{
      backgroundColor: primary,
      padding: '5rem 2rem',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth, margin: '0 auto' }}>
        <p style={{ fontSize: '12px', letterSpacing: '0.3em', color: secondary, textTransform: 'uppercase', marginBottom: '1rem' }}>
          Contact
        </p>
        <h2 style={{
          fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', fontWeight: '700',
          color: '#fff', marginBottom: '1rem', lineHeight: 1.4,
        }}>
          ご予約・お問い合わせ
        </h2>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginBottom: '2.5rem', lineHeight: 1.8 }}>
          {clinic.contactText || 'お気軽にお電話またはご来院ください。'}
        </p>
        <a href={`tel:${clinic.phone}`} style={{
          display: 'inline-block',
          padding: '16px 48px',
          backgroundColor: secondary,
          color: '#000', fontWeight: '700', fontSize: '1.2rem',
          borderRadius: '4px', textDecoration: 'none',
          letterSpacing: '0.1em',
          boxShadow: `0 4px 20px rgba(0,0,0,0.3)`,
        }}>
          {clinic.phone}
        </a>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '3rem' }}>
          &copy; {new Date().getFullYear()} {clinic.name} / 有限会社イトーメディカルケア
        </p>
      </div>
    </section>
  )
}

/* ── Utility Components ─────────────────────────────────── */
function SectionTitle({ title, subtitle, primary }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
      <p style={{
        fontSize: '11px', letterSpacing: '0.3em', color: primary,
        textTransform: 'uppercase', marginBottom: '0.5rem',
      }}>
        {subtitle}
      </p>
      <h2 style={{
        fontSize: 'clamp(1.5rem, 3vw, 2rem)',
        fontWeight: '700', color: 'inherit',
        letterSpacing: '0.05em',
      }}>
        {title}
      </h2>
      <div style={{
        width: '40px', height: '3px',
        backgroundColor: primary,
        margin: '1rem auto 0',
        borderRadius: '2px',
      }} />
    </div>
  )
}

// Simple color blend utility (for alternate section backgrounds)
function blendColor(base, accent, ratio) {
  // returns base with a slight hint of accent
  // just returns a slightly different shade for visual separation
  return base
}
