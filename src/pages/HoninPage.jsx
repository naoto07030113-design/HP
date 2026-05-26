import { Link } from 'react-router-dom'
import Navigation from '../components/ui/Navigation'

function HoursTable() {
  const rows = [
    { label: '午前', value: '9:00 〜 12:00' },
    { label: '午後', value: '14:00 〜 19:30' },
    { label: '定休日', value: '金曜日' },
  ]
  return (
    <div style={{ border: '1px solid #E0E8D8', borderRadius: '4px', overflow: 'hidden' }}>
      {rows.map((r, i) => (
        <div
          key={r.label}
          className="flex"
          style={{ borderBottom: i < rows.length - 1 ? '1px solid #E8EDE4' : 'none' }}
        >
          <div className="jp-text" style={{ width: '6rem', padding: '0.75rem 1rem', background: '#EFF8E8', fontSize: '0.8rem', fontWeight: 500, color: '#4A8018', flexShrink: 0 }}>
            {r.label}
          </div>
          <div className="jp-text" style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#1C2016' }}>
            {r.value}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function HoninPage() {
  const services = [
    { title: '鍼灸治療', desc: '経絡・ツボへのアプローチで自然治癒力を高めます。肩こり・腰痛・冷え・不定愁訴など幅広い症状に対応。' },
    { title: '整骨・整体', desc: '骨格・筋肉・関節のバランスを整え、根本原因から改善。生活習慣による歪みを丁寧に診察します。' },
    { title: '交通事故治療', desc: '交通事故によるむちうち・腰痛は自賠責保険が適用されます。保険手続きのサポートも行います。' },
    { title: 'スポーツ障害', desc: '捻挫・打撲・肉離れなどスポーツ外傷から、オーバーユース障害まで対応。早期回復をサポート。' },
    { title: '各種保険対応', desc: '健康保険・労災保険・自賠責保険に対応。初めての方もお気軽にご相談ください。' },
    { title: 'テーピング指導', desc: '競技復帰に向けたテーピングの巻き方指導も行います。スポーツをされている方へのケアも充実。' },
  ]

  return (
    <div style={{ background: '#F8F9F5', minHeight: '100vh' }}>
      <Navigation isPage />

      {/* Hero */}
      <div className="clinic-hero" style={{ padding: '4rem 0 3rem' }}>
        <div className="max-w-3xl mx-auto px-5">
          <div className="label-tag mb-3">Zone 01 · 本院</div>
          <h1 className="jp-text font-bold mb-2" style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', color: '#1C2016', lineHeight: 1.2 }}>
            イトー鍼灸整骨院
          </h1>
          <p className="jp-text mb-6" style={{ fontSize: '1rem', color: '#6AB628', fontWeight: 500 }}>
            袖ケ浦市野里 ― 地域のかかりつけ治療院（本院）
          </p>
          <div className="divider-green" style={{ width: '80px' }} />
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-5 py-10">
        {/* About */}
        <div className="card-white mb-8" style={{ padding: '2rem' }}>
          <h2 className="jp-text font-bold mb-4" style={{ fontSize: '1.1rem', color: '#1C2016' }}>院について</h2>
          <div className="divider-green mb-4" style={{ width: '40px' }} />
          <p className="jp-text" style={{ fontSize: '0.9rem', color: '#4A5240', lineHeight: 2 }}>
            有限会社イトーメディカルケアの前身である伊藤鍼灸院として、平成7年11月に袖ヶ浦市に開業。
            地域の皆さまの健康サポーターとして、一人ひとりの患者さんに丁寧に向き合い続けてきました。
            鍼灸・整骨から交通事故・スポーツ外傷まで、幅広い症状に対応しています。
          </p>
        </div>

        {/* Services grid */}
        <h2 className="jp-text font-bold mb-5" style={{ fontSize: '1.1rem', color: '#1C2016' }}>診療メニュー</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          {services.map((s) => (
            <div key={s.title} className="card-accent" style={{ padding: '1.2rem 1.4rem' }}>
              <div className="jp-text font-bold mb-2" style={{ fontSize: '0.92rem', color: '#1C2016' }}>{s.title}</div>
              <p className="jp-text" style={{ fontSize: '0.8rem', color: '#4A5240', lineHeight: 1.8 }}>{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Hours & Access */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div>
            <h2 className="jp-text font-bold mb-4" style={{ fontSize: '1.1rem', color: '#1C2016' }}>診療時間</h2>
            <HoursTable />
          </div>
          <div>
            <h2 className="jp-text font-bold mb-4" style={{ fontSize: '1.1rem', color: '#1C2016' }}>アクセス</h2>
            <div className="card-white" style={{ padding: '1.2rem' }}>
              {[
                { label: '住所', value: '〒299-0211\n千葉県袖ケ浦市野里1770-3' },
                { label: 'TEL', value: '0438-75-5557' },
                { label: '駐車場', value: '完備' },
              ].map((r) => (
                <div key={r.label} className="info-row">
                  <span className="label">{r.label}</span>
                  <span style={{ whiteSpace: 'pre-line', fontSize: '0.82rem', color: '#3A4030' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center py-6" style={{ borderTop: '1px solid #E8EDE4' }}>
          <a href="tel:0438755557" className="btn-primary mr-4" style={{ fontSize: '0.9rem' }}>
            ☎ 0438-75-5557 に電話する
          </a>
          <Link to="/" className="btn-outline">← ホームへ戻る</Link>
        </div>
      </div>
    </div>
  )
}
