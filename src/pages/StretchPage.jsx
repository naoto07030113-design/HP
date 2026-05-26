import { Link } from 'react-router-dom'
import Navigation from '../components/ui/Navigation'

export default function StretchPage() {
  const services = [
    { title: 'ストレッチマシン', desc: '最新のストレッチマシンを導入。機械によるアシストで、効率的に筋肉をほぐし柔軟性を高めます。' },
    { title: '鍼灸治療', desc: '伝統的な鍼灸で自律神経を整え、痛みや疲労を根本から改善。肩こり・腰痛・冷え性に効果的。' },
    { title: '整体・矯正', desc: '骨盤矯正・背骨調整など、歪んだ姿勢を正すことで慢性痛の解消を目指します。' },
    { title: '交通事故治療', desc: '交通事故後のむちうち・腰痛・めまいなどを保険でしっかり治療。示談前のご相談も承ります。' },
    { title: 'スポーツケア', desc: '捻挫・肉離れ・オーバーユース障害など、スポーツによるケガの早期回復をサポート。' },
    { title: '各種保険対応', desc: '健康保険・労災・自賠責対応。長浦駅前の好立地で、お仕事帰りにも通いやすい環境です。' },
  ]

  return (
    <div style={{ background: '#F8F9F5', minHeight: '100vh' }}>
      <Navigation isPage />

      <div className="clinic-hero" style={{ padding: '4rem 0 3rem' }}>
        <div className="max-w-3xl mx-auto px-5">
          <div className="label-tag mb-3">Zone 02 · ストレッチ院</div>
          <h1 className="jp-text font-bold mb-2" style={{ fontSize: 'clamp(1.8rem, 4.5vw, 3rem)', color: '#1C2016', lineHeight: 1.2 }}>
            ストレッチ鍼灸イトー整骨院
          </h1>
          <p className="jp-text mb-6" style={{ fontSize: '1rem', color: '#6AB628', fontWeight: 500 }}>
            袖ケ浦市長浦 ― ストレッチマシン導入の最新治療院
          </p>
          <div className="divider-green" style={{ width: '80px' }} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-10">
        <div className="card-white mb-8" style={{ padding: '2rem' }}>
          <h2 className="jp-text font-bold mb-4" style={{ fontSize: '1.1rem', color: '#1C2016' }}>院について</h2>
          <div className="divider-green mb-4" style={{ width: '40px' }} />
          <p className="jp-text" style={{ fontSize: '0.9rem', color: '#4A5240', lineHeight: 2 }}>
            長浦駅前という好立地に位置し、ストレッチマシンを積極的に導入した治療院です。
            機械によるアシストストレッチと、熟練スタッフによる鍼灸・整体を組み合わせることで、
            より効果的な治療を提供しています。平日20:00まで受付可能で、お仕事帰りの方にも便利です。
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
                { label: '月〜土 午前', value: '9:30 〜 12:00' },
                { label: '月〜土 午後', value: '14:30 〜 20:00' },
                { label: '日曜', value: '9:30 〜 17:00' },
                { label: '定休日', value: '金曜日' },
              ].map((r, i, arr) => (
                <div key={r.label} className="flex" style={{ borderBottom: i < arr.length - 1 ? '1px solid #E8EDE4' : 'none' }}>
                  <div className="jp-text" style={{ width: '8rem', padding: '0.75rem 1rem', background: '#EFF8E8', fontSize: '0.78rem', fontWeight: 500, color: '#4A8018', flexShrink: 0 }}>{r.label}</div>
                  <div className="jp-text" style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#1C2016' }}>{r.value}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="jp-text font-bold mb-4" style={{ fontSize: '1.1rem', color: '#1C2016' }}>アクセス</h2>
            <div className="card-white" style={{ padding: '1.2rem' }}>
              {[
                { label: '住所', value: '〒299-0246\n千葉県袖ケ浦市長浦駅前2-4-10' },
                { label: 'TEL', value: '0438-53-8853' },
                { label: 'アクセス', value: 'JR内房線 長浦駅前' },
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
          <a href="tel:0438538853" className="btn-primary mr-4" style={{ fontSize: '0.9rem' }}>
            ☎ 0438-53-8853 に電話する
          </a>
          <Link to="/" className="btn-outline">← ホームへ戻る</Link>
        </div>
      </div>
    </div>
  )
}
