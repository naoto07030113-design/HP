import { industries } from '../../data/industries'
import { colorSchemes } from '../../data/colorSchemes'

export function generateHTML(data) {
  const industry = data.industry || industries[0]
  const scheme = colorSchemes.find(s => s.id === data.colorSchemeId) || colorSchemes[0]

  const businessName = data.businessName || `${industry.name}のサンプル`
  const tagline = data.tagline || industry.defaultTagline
  const about = data.about || industry.defaultAbout
  const hours = data.hours || industry.defaultHours
  const phone = data.phone || ''
  const address = data.address || ''
  const email = data.email || ''

  const rawServices = data.services.filter(s => s.title.trim())
  const services = rawServices.length > 0 ? rawServices : industry.defaultServices

  const { primary, primaryDark, primaryLight, bg, border, heroBg } = scheme

  const servicesHTML = services.map((s, i) => `
    <div class="service-card" style="animation-delay:${i * 0.1}s">
      <span class="service-icon">${s.icon}</span>
      <h3>${s.title}</h3>
      <p>${s.description}</p>
    </div>`).join('')

  const socialLinks = [
    data.instagram && `<a href="https://instagram.com/${data.instagram}" class="social-link" title="Instagram">📷</a>`,
    data.twitter && `<a href="https://twitter.com/${data.twitter}" class="social-link" title="Twitter/X">🐦</a>`,
    data.facebook && `<a href="https://facebook.com/${data.facebook}" class="social-link" title="Facebook">📘</a>`,
  ].filter(Boolean).join('')

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${businessName}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:'Noto Sans JP',-apple-system,BlinkMacSystemFont,sans-serif;color:#1e293b;background:#fff;-webkit-font-smoothing:antialiased}
a{text-decoration:none}
img{max-width:100%;height:auto}

@keyframes fadeInUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}

/* ===== HEADER ===== */
header{position:sticky;top:0;z-index:100;background:rgba(255,255,255,0.92);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid ${border}}
nav{max-width:1200px;margin:0 auto;padding:0 2rem;height:4.5rem;display:flex;justify-content:space-between;align-items:center;gap:2rem}
.logo{font-size:1.2rem;font-weight:800;color:${primary};flex-shrink:0}
.nav-links{display:flex;gap:1.75rem;align-items:center}
.nav-links a{color:#475569;font-weight:500;transition:color 0.2s;font-size:0.92rem;white-space:nowrap}
.nav-links a:hover{color:${primary}}
.btn-primary{background:${primary};color:#fff !important;padding:0.55rem 1.4rem;border-radius:9999px;font-weight:700 !important;transition:background 0.2s,transform 0.2s !important;font-size:0.88rem !important}
.btn-primary:hover{background:${primaryDark} !important;transform:translateY(-1px) !important}

/* ===== HERO ===== */
.hero{min-height:88vh;background:${heroBg};display:flex;align-items:center;justify-content:center;padding:7rem 2rem 5rem;position:relative;overflow:hidden;text-align:center}
.hero-deco{position:absolute;font-size:22rem;opacity:0.04;right:-2rem;top:50%;transform:translateY(-50%);pointer-events:none;line-height:1;animation:float 6s ease-in-out infinite}
.hero-inner{position:relative;z-index:1;max-width:760px}
.hero-badge{display:inline-flex;align-items:center;gap:0.4rem;background:rgba(255,255,255,0.18);color:#fff;padding:0.4rem 1.1rem;border-radius:9999px;font-size:0.82rem;font-weight:700;margin-bottom:1.75rem;border:1px solid rgba(255,255,255,0.28);letter-spacing:0.04em}
.hero h1{font-size:clamp(2.2rem,5.5vw,4rem);font-weight:900;color:#fff;line-height:1.12;margin-bottom:1.5rem;letter-spacing:-0.03em;animation:fadeInUp 0.7s ease-out both}
.hero-tagline{font-size:clamp(1rem,2.2vw,1.2rem);color:rgba(255,255,255,0.82);line-height:1.75;margin-bottom:2.5rem;animation:fadeInUp 0.7s 0.12s ease-out both}
.hero-actions{display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;animation:fadeInUp 0.7s 0.24s ease-out both}
.hero-cta{display:inline-block;background:#fff;color:${primary};padding:0.95rem 2.4rem;border-radius:9999px;font-weight:800;font-size:1.05rem;transition:transform 0.2s,box-shadow 0.2s;box-shadow:0 4px 20px rgba(0,0,0,0.18)}
.hero-cta:hover{transform:translateY(-3px);box-shadow:0 10px 30px rgba(0,0,0,0.22)}
.hero-cta-sub{display:inline-block;background:rgba(255,255,255,0.15);color:#fff;padding:0.95rem 2rem;border-radius:9999px;font-weight:600;font-size:1rem;border:1px solid rgba(255,255,255,0.35);transition:background 0.2s}
.hero-cta-sub:hover{background:rgba(255,255,255,0.25)}
.hero-phone{margin-top:2rem;color:rgba(255,255,255,0.65);font-size:0.9rem;animation:fadeInUp 0.7s 0.36s ease-out both}
.hero-phone strong{color:#fff;font-size:1.6rem;font-weight:800;display:block;margin-top:0.2rem;letter-spacing:0.02em}

/* ===== SECTION BASE ===== */
section{padding:5.5rem 2rem}
.container{max-width:1200px;margin:0 auto}
.section-label{display:inline-block;background:${bg};color:${primary};padding:0.3rem 0.9rem;border-radius:9999px;font-size:0.75rem;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:0.9rem}
.section-title{font-size:clamp(1.6rem,3vw,2.4rem);font-weight:800;color:#1e293b;line-height:1.2;letter-spacing:-0.025em}
.section-lead{color:#64748b;font-size:1rem;line-height:1.85;margin-top:0.75rem}
.text-center{text-align:center}
.mx-auto{margin-left:auto;margin-right:auto}

/* ===== SERVICES ===== */
.services-section{background:${bg}}
.services-header{margin-bottom:3.5rem}
.services-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:1.5rem}
.service-card{background:#fff;border-radius:1.25rem;padding:2.25rem;text-align:center;box-shadow:0 2px 10px rgba(0,0,0,0.06);transition:transform 0.25s,box-shadow 0.25s;animation:fadeInUp 0.6s ease-out both}
.service-card:hover{transform:translateY(-5px);box-shadow:0 16px 32px rgba(0,0,0,0.1)}
.service-icon{font-size:3rem;display:block;margin-bottom:1.1rem}
.service-card h3{font-size:1.15rem;font-weight:700;color:#1e293b;margin-bottom:0.7rem}
.service-card p{color:#64748b;line-height:1.75;font-size:0.9rem}

/* ===== ABOUT ===== */
.about-section{background:#fff}
.about-grid{display:grid;grid-template-columns:1fr 1fr;gap:5rem;align-items:center}
.about-visual{border-radius:2rem;aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:8rem;background:${heroBg};box-shadow:0 25px 60px rgba(0,0,0,0.15)}
.about-text{color:#475569;line-height:1.95;font-size:1rem;margin:1.25rem 0 2rem}
.about-contact-items{display:flex;flex-direction:column;gap:0.9rem}
.contact-chip{display:inline-flex;align-items:flex-start;gap:0.8rem;background:${bg};border-radius:0.75rem;padding:0.75rem 1rem;border:1px solid ${border}}
.contact-chip-icon{font-size:1.2rem;flex-shrink:0;margin-top:0.05rem}
.contact-chip-text h4{font-size:0.82rem;font-weight:700;color:${primary};margin-bottom:0.1rem;text-transform:uppercase;letter-spacing:0.04em}
.contact-chip-text p{font-size:0.9rem;color:#475569;line-height:1.5;white-space:pre-line}

/* ===== CONTACT ===== */
.contact-section{background:${bg}}
.contact-grid{display:grid;grid-template-columns:1fr 1.15fr;gap:4rem;align-items:start}
.form-card{background:#fff;border-radius:1.5rem;padding:2.5rem;box-shadow:0 6px 30px rgba(0,0,0,0.08)}
.form-title{font-size:1.25rem;font-weight:700;color:#1e293b;margin-bottom:1.5rem}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
.form-group{margin-bottom:1rem}
label{display:block;font-size:0.8rem;font-weight:700;color:#475569;margin-bottom:0.35rem;letter-spacing:0.02em}
.required{color:#ef4444;margin-left:0.2rem}
input,textarea{width:100%;padding:0.75rem 1rem;border:1.5px solid #e2e8f0;border-radius:0.625rem;font-family:inherit;font-size:0.95rem;color:#1e293b;transition:border-color 0.2s,box-shadow 0.2s;outline:none;background:#fff}
input:focus,textarea:focus{border-color:${primary};box-shadow:0 0 0 3px ${primary}22}
textarea{resize:vertical;min-height:110px}
.submit-btn{width:100%;background:${primary};color:#fff;border:none;padding:1rem;border-radius:0.75rem;font-size:1rem;font-weight:700;cursor:pointer;font-family:inherit;transition:background 0.2s,transform 0.2s;margin-top:0.25rem}
.submit-btn:hover{background:${primaryDark};transform:translateY(-1px)}

/* ===== FOOTER ===== */
footer{background:#0f172a;color:rgba(255,255,255,0.6);padding:4.5rem 2rem 2.5rem}
.footer-inner{max-width:1200px;margin:0 auto}
.footer-top{display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:2.5rem;margin-bottom:3.5rem}
.footer-brand .logo{color:#fff;display:block;margin-bottom:0.75rem;font-size:1.3rem}
.footer-brand p{font-size:0.88rem;line-height:1.7;max-width:280px}
.footer-nav{display:flex;flex-direction:column;gap:0.75rem}
.footer-nav a{color:rgba(255,255,255,0.55);font-size:0.9rem;transition:color 0.2s}
.footer-nav a:hover{color:#fff}
.social-links{display:flex;gap:0.75rem;margin-top:1.25rem}
.social-link{display:inline-flex;align-items:center;justify-content:center;width:2.5rem;height:2.5rem;border-radius:50%;background:rgba(255,255,255,0.1);transition:background 0.2s;font-size:1rem}
.social-link:hover{background:${primary}}
.footer-bottom{border-top:1px solid rgba(255,255,255,0.08);padding-top:2rem;text-align:center;font-size:0.8rem;color:rgba(255,255,255,0.3)}

/* ===== RESPONSIVE ===== */
@media(max-width:900px){
  .about-grid,.contact-grid{grid-template-columns:1fr;gap:2.5rem}
  .about-visual{display:none}
  .form-row{grid-template-columns:1fr}
}
@media(max-width:640px){
  .nav-links{display:none}
  .hero{min-height:75vh;padding:5rem 1.5rem 4rem}
  section{padding:4rem 1.5rem}
  .services-grid{grid-template-columns:1fr}
  .footer-top{flex-direction:column}
}
</style>
</head>
<body>

<header>
  <nav>
    <span class="logo">${businessName}</span>
    <div class="nav-links">
      <a href="#services">サービス</a>
      <a href="#about">私たちについて</a>
      <a href="#contact">お問い合わせ</a>
      ${phone ? `<a href="tel:${phone.replace(/[^0-9]/g, '')}" class="btn-primary">${phone}</a>` : '<a href="#contact" class="btn-primary">お問い合わせ</a>'}
    </div>
  </nav>
</header>

<section class="hero">
  <div class="hero-deco">${industry.icon}</div>
  <div class="hero-inner">
    <div class="hero-badge">${industry.name}</div>
    <h1>${businessName}</h1>
    <p class="hero-tagline">${tagline}</p>
    <div class="hero-actions">
      <a href="#contact" class="hero-cta">お問い合わせ・ご予約</a>
      <a href="#services" class="hero-cta-sub">サービスを見る</a>
    </div>
    ${phone ? `<div class="hero-phone">お電話でのお問い合わせ<strong>${phone}</strong></div>` : ''}
  </div>
</section>

<section class="services-section" id="services">
  <div class="container">
    <div class="services-header text-center">
      <div class="section-label">SERVICE</div>
      <h2 class="section-title">サービス・メニュー</h2>
      <p class="section-lead mx-auto" style="max-width:520px">ご提供するサービスをご紹介します。<br>お気軽にご相談ください。</p>
    </div>
    <div class="services-grid">${servicesHTML}</div>
  </div>
</section>

<section class="about-section" id="about">
  <div class="container">
    <div class="about-grid">
      <div>
        <div class="section-label">ABOUT</div>
        <h2 class="section-title">私たちについて</h2>
        <p class="about-text">${about}</p>
        <div class="about-contact-items">
          ${phone ? `<div class="contact-chip"><span class="contact-chip-icon">📞</span><div class="contact-chip-text"><h4>電話番号</h4><p>${phone}</p></div></div>` : ''}
          ${address ? `<div class="contact-chip"><span class="contact-chip-icon">📍</span><div class="contact-chip-text"><h4>所在地</h4><p>${address}</p></div></div>` : ''}
          ${hours ? `<div class="contact-chip"><span class="contact-chip-icon">🕐</span><div class="contact-chip-text"><h4>営業時間</h4><p>${hours}</p></div></div>` : ''}
        </div>
      </div>
      <div class="about-visual">${industry.icon}</div>
    </div>
  </div>
</section>

<section class="contact-section" id="contact">
  <div class="container">
    <div class="contact-grid">
      <div>
        <div class="section-label">CONTACT</div>
        <h2 class="section-title">お問い合わせ</h2>
        <p class="section-lead" style="margin-bottom:2rem">お気軽にご連絡ください。<br>スタッフ一同、心よりお待ちしております。</p>
        ${phone ? `<div class="contact-chip" style="margin-bottom:1rem"><span class="contact-chip-icon">📞</span><div class="contact-chip-text"><h4>お電話</h4><p>${phone}</p></div></div>` : ''}
        ${address ? `<div class="contact-chip" style="margin-bottom:1rem"><span class="contact-chip-icon">📍</span><div class="contact-chip-text"><h4>住所</h4><p>${address}</p></div></div>` : ''}
        ${email ? `<div class="contact-chip" style="margin-bottom:1rem"><span class="contact-chip-icon">✉️</span><div class="contact-chip-text"><h4>メール</h4><p>${email}</p></div></div>` : ''}
        ${hours ? `<div class="contact-chip"><span class="contact-chip-icon">🕐</span><div class="contact-chip-text"><h4>営業時間</h4><p>${hours}</p></div></div>` : ''}
      </div>
      <div class="form-card">
        <h3 class="form-title">📩 メッセージを送る</h3>
        <div class="form-row">
          <div class="form-group">
            <label>お名前<span class="required">*</span></label>
            <input type="text" placeholder="山田 太郎">
          </div>
          <div class="form-group">
            <label>電話番号</label>
            <input type="tel" placeholder="03-1234-5678">
          </div>
        </div>
        <div class="form-group">
          <label>メールアドレス<span class="required">*</span></label>
          <input type="email" placeholder="example@email.com">
        </div>
        <div class="form-group">
          <label>お問い合わせ内容<span class="required">*</span></label>
          <textarea placeholder="お問い合わせ内容をご記入ください"></textarea>
        </div>
        <button class="submit-btn" onclick="alert('送信ありがとうございます！')">送信する →</button>
      </div>
    </div>
  </div>
</section>

<footer>
  <div class="footer-inner">
    <div class="footer-top">
      <div class="footer-brand">
        <span class="logo">${businessName}</span>
        <p>${tagline}</p>
        ${socialLinks ? `<div class="social-links">${socialLinks}</div>` : ''}
      </div>
      <nav class="footer-nav">
        <a href="#services">サービス・メニュー</a>
        <a href="#about">私たちについて</a>
        <a href="#contact">お問い合わせ</a>
      </nav>
    </div>
    <div class="footer-bottom">
      <p>&copy; ${new Date().getFullYear()} ${businessName}. All rights reserved.</p>
    </div>
  </div>
</footer>

<script>
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    const id=a.getAttribute('href');
    if(id==='#')return;
    e.preventDefault();
    const el=document.querySelector(id);
    if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
  });
});
const io=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}
  });
},{threshold:0.1});
document.querySelectorAll('.service-card').forEach(el=>io.observe(el));
</script>
</body>
</html>`
}
