import { Link } from 'react-router-dom'
import Navigation from '../components/ui/Navigation'

export default function RehaPage() {
  const services = [
    { title: '訪問マッサージ', desc: 'ご自宅・施設へ国家資格保有のマッサージ師が伺います。寝たきり・歩行困難な方にも安心。' },
    { title: '機能訓練', desc: '日常生活動作（ADL）の維持・改善を目的とした個別機能訓練。立つ・歩く・手を使う動作をサポート。' },
    { title: '関節可動域訓練', desc: '関節の拘縮（こうしゅく）予防・改善のためのストレッチ・運動療法。廃用症候群の予防に。' },
    { title: '疼痛緩和', desc: '慢性的な痛みや筋緊張をマッサージで和らげ、生活の質（QOL）の向上を図ります。' },
    { title: '在宅リハビリ', desc: '理学療法士・マッサージ師が連携。在宅生活を続けるための包括的なリハビリテーション。' },
    { title: '保険適用', desc: '医療保険が適用されます（医師の同意書が必要）。介護保険との併用も可。まずはご相談を。' },
  ]

  return (
    <div style={{ background: '#F8F9F5', minHeight: '100vh' }}>
      <Navigation isPage />

      <div className="clinic-hero" style={{ padding: '4rem 0 3rem' }}>
        <div className="max-w-3xl mx-auto px-5">
          <div className="label-tag mb-3">Zone 04 · 訪問リハビリ</div>
          <h1 className="jp-text font-bold mb-2" style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', color: '#1C2016', lineHeight: 1.2 }}>
            伊藤リハビリセンター
          </h1>
          <p className="jp-text mb-6" style={{ fontSize: '1rem', color: '#6AB628', fontWeight: 500 }}>
            訪問リハビリマッサージ ― ご自宅・施設へお伺いします
          </p>
          <div className="divider-green" style={{ width: '80px' }} />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-10">
        {/* Appeal banner */}
        <div
          className="mb-8"
          style={{ background: '#EFF8E8', border: '1px solid rgba(106,182,40,0.25)', borderRadius: '6px', padding: '1.5rem 2rem' }}
        >
          <div className="label-tag mb-2">こんな方にご利用いただけます</div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {[
              '寝たきりの方・要介護の方',
              '脳卒中後遺症のある方',
              '外出が困難な方',
              '筋力低下・関節拘縮の方',
              '術後リハビリが必要な方',
              '慢性的な痛みでお悩みの方',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6AB628', flexShrink: 0 }} />
                <span className="jp-text" style={{ fontSize: '0.82rem', color: '#3A4030' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-white mb-8" style={{ padding: '2rem' }}>
          <h2 className="jp-text font-bold mb-4" style={{ fontSize: '1.1rem', color: '#1C2016' }}>サービスについて</h2>
          <div className="divider-green mb-4" style={{ width: '40px' }} />
          <p className="jp-text" style={{ fontSize: '0.9rem', color: '#4A5240', lineHeight: 2 }}>
            伊藤リハビリセンターは、ご自宅や施設へ直接伺う訪問リハビリマッサージのサービスです。
            国家資格を保有したマッサージ師・機能訓練指導員が担当し、医療保険が適用されます。
            「病院には行けないけれど、身体のケアをしたい」という方のお力になります。
            お気軽にご相談ください。
          </p>
        </div>

        <h2 className="jp-text font-bold mb-5" style={{ fontSize: '1.1rem', color: '#1C2016' }}>サービスメニュー</h2>
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          {services.map((s) => (
            <div key={s.title} className="card-accent" style={{ padding: '1.2rem 1.4rem' }}>
              <div className="jp-text font-bold mb-2" style={{ fontSize: '0.92rem', color: '#1C2016' }}>{s.title}</div>
              <p className="jp-text" style={{ fontSize: '0.8rem', color: '#4A5240', lineHeight: 1.8 }}>{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Flow */}
        <div className="card-white mb-10" style={{ padding: '2rem' }}>
          <h2 className="jp-text font-bold mb-5" style={{ fontSize: '1.1rem', color: '#1C2016' }}>ご利用の流れ</h2>
          <div className="flex flex-col gap-4">
            {[
              { step: '01', title: 'まずはお電話を', desc: '0438-75-7737へお気軽にご連絡ください。' },
              { step: '02', title: '無料相談・訪問', desc: '担当者がご自宅に伺い、状態をお聞きします。' },
              { step: '03', title: '医師に同意書を依頼', desc: 'かかりつけ医から同意書を発行いただきます（サポートあり）。' },
              { step: '04', title: '訪問施術開始', desc: 'ご都合の良い日時に定期的にお伺いします。' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 items-start">
                <div
                  style={{ width: '2.2rem', height: '2.2rem', borderRadius: '50%', background: '#6AB628', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}
                >
                  {item.step}
                </div>
                <div>
                  <div className="jp-text font-bold mb-0.5" style={{ fontSize: '0.88rem', color: '#1C2016' }}>{item.title}</div>
                  <div className="jp-text" style={{ fontSize: '0.8rem', color: '#4A5240' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Access */}
        <div className="card-white mb-10" style={{ padding: '1.4rem' }}>
          <h2 className="jp-text font-bold mb-4" style={{ fontSize: '1.1rem', color: '#1C2016' }}>お問い合わせ先</h2>
          {[
            { label: '住所', value: '〒299-0211\n千葉県袖ケ浦市野里1770-3' },
            { label: 'TEL', value: '0438-75-7737' },
            { label: '受付時間', value: '8:00 〜 18:00（日曜のみ休み）' },
          ].map((r) => (
            <div key={r.label} className="info-row">
              <span className="label">{r.label}</span>
              <span style={{ whiteSpace: 'pre-line', fontSize: '0.82rem', color: '#3A4030' }}>{r.value}</span>
            </div>
          ))}
        </div>

        <div className="text-center py-6" style={{ borderTop: '1px solid #E8EDE4' }}>
          <a href="tel:0438757737" className="btn-primary mr-4" style={{ fontSize: '0.9rem' }}>
            ☎ 0438-75-7737 に電話する
          </a>
          <Link to="/" className="btn-outline">← ホームへ戻る</Link>
        </div>
      </div>
    </div>
  )
}
