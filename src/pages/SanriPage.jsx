import { Link } from 'react-router-dom'
import Navigation from '../components/ui/Navigation'

export default function SanriPage() {
  const services = [
    { title: '鍼灸治療', desc: 'イオンモール内という便利な立地で、買い物のついでに鍼灸治療。肩こり・腰痛・自律神経の乱れに。' },
    { title: '整骨・整体', desc: '骨盤矯正・関節調整を中心に、姿勢の歪みから起こる痛みを根本から改善します。' },
    { title: '美容鍼', desc: '顔の血行を促進し、むくみ・たるみ・肌荒れに効果。自然な美しさを引き出す美容ケア。' },
    { title: '交通事故治療', desc: '事故後の痛みを早期に解決。自賠責保険対応、書類手続きのサポートも丁寧に行います。' },
    { title: 'ピタ美ンスポット', desc: '独自の施術メソッドで体の歪みを「ピタッ」と整えます。姿勢改善・ボディメイクにも。' },
    { label: '各種保険対応', title: '各種保険', desc: '健康保険・労災・自賠責対応。イオンモール富津3Fで駐車場完備。ショッピングついでに気軽に来院。' },
  ]

  return (
    <div style={{ background: '#F8F9F5', minHeight: '100vh' }}>
      <Navigation isPage />

      <div className="clinic-hero" style={{ padding: '4rem 0 3rem' }}>
        <div className="max-w-3xl mx-auto px-5">
          <div className="label-tag mb-3">Zone 03 · SANRI院</div>
          <h1 className="jp-text font-bold mb-2" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.8rem)', color: '#1C2016', lineHeight: 1.2 }}>
            ピタ美ンスポット<br />SANRI鍼灸整骨院
          </h1>
          <p className="jp-text mb-6" style={{ fontSize: '1rem', color: '#6AB628', fontWeight: 500 }}>
            富津市 イオンモール富津3F ― 商業施設内の治療院
          </p>
          <div className="divider-green" style={{ width: '80px' }} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-10">
        <div className="card-white mb-8" style={{ padding: '2rem' }}>
          <h2 className="jp-text font-bold mb-4" style={{ fontSize: '1.1rem', color: '#1C2016' }}>院について</h2>
          <div className="divider-green mb-4" style={{ width: '40px' }} />
          <p className="jp-text" style={{ fontSize: '0.9rem', color: '#4A5240', lineHeight: 2 }}>
            富津市のイオンモール富津3Fにある、アクセス抜群の治療院です。
            「ピタ美ンスポット」という独自のコンセプトのもと、鍼灸・整骨に加え美容鍼も提供。
            ショッピングのついでに気軽に立ち寄れる環境で、幅広い年齢層の方にご利用いただいています。
            大型駐車場完備で車でのアクセスも便利です。
          </p>
        </div>

        <h2 className="jp-text font-bold mb-5" style={{ fontSize: '1.1rem', color: '#1C2016' }}>診療メニュー</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          {services.map((s) => (
            <div key={s.title} className="card-accent" style={{ padding: '1.2rem 1.4rem' }}>
              <div className="jp-text font-bold mb-2" style={{ fontSize: '0.92rem', color: '#1C2016' }}>{s.title}</div>
              <p className="jp-text" style={{ fontSize: '0.8rem', color: '#4A5240', lineHeight: 1.8 }}>{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          <div>
            <h2 className="jp-text font-bold mb-4" style={{ fontSize: '1.1rem', color: '#1C2016' }}>診療時間</h2>
            <div style={{ border: '1px solid #E0E8D8', borderRadius: '4px', overflow: 'hidden' }}>
              {[
                { label: '午前', value: '10:00 〜 13:30' },
                { label: '午後', value: '14:30 〜 20:00' },
                { label: '定休日', value: '金曜日' },
              ].map((r, i, arr) => (
                <div key={r.label} className="flex" style={{ borderBottom: i < arr.length - 1 ? '1px solid #E8EDE4' : 'none' }}>
                  <div className="jp-text" style={{ width: '6rem', padding: '0.75rem 1rem', background: '#EFF8E8', fontSize: '0.8rem', fontWeight: 500, color: '#4A8018', flexShrink: 0 }}>{r.label}</div>
                  <div className="jp-text" style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#1C2016' }}>{r.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="jp-text font-bold mb-4" style={{ fontSize: '1.1rem', color: '#1C2016' }}>アクセス</h2>
            <div className="card-white" style={{ padding: '1.2rem' }}>
              {[
                { label: '住所', value: '〒293-0012\n千葉県富津市青木1丁目5番地1\nイオンモール富津3F' },
                { label: 'TEL', value: '0439-32-1771' },
                { label: '駐車場', value: 'イオンモール富津 共用駐車場' },
              ].map((r) => (
                <div key={r.label} className="info-row">
                  <span className="label">{r.label}</span>
                  <span style={{ whiteSpace: 'pre-line', fontSize: '0.82rem', color: '#3A4030' }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center py-6" style={{ borderTop: '1px solid #E8EDE4' }}>
          <a href="tel:0439321771" className="btn-primary mr-4" style={{ fontSize: '0.9rem' }}>
            ☎ 0439-32-1771 に電話する
          </a>
          <Link to="/" className="btn-outline">← ホームへ戻る</Link>
        </div>
      </div>
    </div>
  )
}
