import Link from 'next/link'
import { MapPin, Phone, ExternalLink, ArrowLeft, Train } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ストレッチ鍼灸イトー整骨院 | 有限会社イトーメディカルケア',
  description: '千葉県袖ケ浦市長浦駅前のストレッチ鍼灸院。EMS・IMC式矯正・美容鍼灸。長浦駅から徒歩7分。',
}

const BG = 'linear-gradient(135deg, #0f3d3d 0%, #0d6060 60%, #0d9488 100%)'

export default function StretchIto() {
  return (
    <div className="min-h-screen bg-white">
      {/* ===== Header ===== */}
      <header className="text-white sticky top-0 z-50 shadow-lg" style={{ background: '#0f3d3d' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link
            href="/site"
            className="flex items-center gap-2 text-teal-300 hover:text-white transition text-sm shrink-0"
          >
            <ArrowLeft size={15} />
            グループトップ
          </Link>
          <p className="flex-1 text-center text-sm font-bold">ストレッチ鍼灸イトー整骨院</p>
          <div className="w-28" />
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="text-white py-20 md:py-28 relative overflow-hidden" style={{ background: BG }}>
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle at 20px 20px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="max-w-6xl mx-auto px-4 relative">
          <span className="text-xs text-teal-300 tracking-widest border border-teal-700 px-3 py-1 rounded-full">
            STRETCH ITO SEIKOTSUIN · 長浦駅前院
          </span>
          <h1 className="text-3xl md:text-5xl font-bold mt-4 mb-3">
            ストレッチ鍼灸<br />イトー整骨院
          </h1>
          <p className="text-teal-300 text-base mb-4 flex items-center gap-2">
            <MapPin size={14} /> 千葉県袖ケ浦市長浦駅前
          </p>
          <p className="text-teal-100 max-w-xl leading-relaxed mb-8">
            ストレッチと鍼灸を融合させた独自の施術で、痛みの根本解消と再発しない身体づくりを実現。
            EMS（楽トレ）やIMC式矯正治療など最新機器も導入しています。
          </p>
          <div className="flex flex-wrap gap-2">
            {['ストレッチ鍼灸', 'EMS（楽トレ）', 'IMC式矯正', '美容鍼灸', '交通事故治療', '骨盤矯正'].map((tag) => (
              <span
                key={tag}
                className="text-sm bg-white/10 border border-white/20 px-3 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Services ===== */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-1" style={{ color: '#0f3d3d' }}>施術内容</h2>
          <p className="text-gray-400 text-xs tracking-widest mb-10">TREATMENTS</p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: '🧘',
                title: 'ストレッチ鍼灸',
                desc: 'ストレッチと鍼灸を組み合わせた当院独自の施術。筋肉の柔軟性を取り戻しながら鍼灸で自然治癒力を高め、慢性的なコリや痛みを根本から改善。',
              },
              {
                icon: '⚡',
                title: 'EMS（楽トレ）',
                desc: '寝ているだけでインナーマッスルを鍛えられる「楽トレ」を導入。体幹強化・腰痛改善・産後ケアなど幅広い効果が期待できます。',
              },
              {
                icon: '🦴',
                title: 'IMC式矯正治療',
                desc: '身体の根本的な歪みを整えるIMC式矯正。骨盤・背骨・全身のバランスを調整し、痛みが再発しない身体づくりを目指します。',
              },
              {
                icon: '✨',
                title: '美容鍼灸',
                desc: '顔・首・デコルテへのアプローチで、肌のハリ・リフトアップ・くすみ改善を実現。内側から輝く美しさをサポートします。',
              },
            ].map((s) => (
              <div
                key={s.title}
                className="border border-gray-100 rounded-xl p-6 hover:shadow-md hover:border-teal-100 transition"
              >
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="font-bold text-lg mb-2" style={{ color: '#0f3d3d' }}>{s.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Hours + Access ===== */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12">
          {/* Hours */}
          <div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: '#0f3d3d' }}>診療時間</h2>
            <p className="text-gray-400 text-xs tracking-widest mb-6">HOURS</p>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#0f3d3d' }} className="text-white">
                    <th className="py-3 px-4 text-left font-medium">時間帯</th>
                    <th className="py-3 px-4 text-center font-medium">月〜土</th>
                    <th className="py-3 px-4 text-center font-medium">日曜</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-500">午前</td>
                    <td className="py-3 px-4 text-center font-semibold" style={{ color: '#0d6060' }}>
                      9:30 〜 12:00
                    </td>
                    <td className="py-3 px-4 text-center font-semibold" style={{ color: '#0d6060' }}>
                      9:30 〜 12:00
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="py-3 px-4 text-gray-500">午後</td>
                    <td className="py-3 px-4 text-center font-semibold" style={{ color: '#0d6060' }}>
                      14:30 〜 20:00
                    </td>
                    <td className="py-3 px-4 text-center font-semibold" style={{ color: '#0d6060' }}>
                      〜 17:00
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="px-4 py-3 bg-red-50 text-red-600 text-xs border-t border-red-100">
                ※ 金曜日は定休日です
              </div>
            </div>
          </div>

          {/* Access */}
          <div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: '#0f3d3d' }}>アクセス</h2>
            <p className="text-gray-400 text-xs tracking-widest mb-6">ACCESS</p>
            <div className="bg-white rounded-xl p-6 shadow-sm space-y-5">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0" style={{ color: '#0d6060' }} />
                <div>
                  <p className="font-semibold text-sm mb-0.5" style={{ color: '#0f3d3d' }}>所在地</p>
                  <p className="text-gray-600 text-sm">〒299-0261 千葉県袖ケ浦市長浦駅前2-4-10</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={18} className="mt-0.5 shrink-0" style={{ color: '#0d6060' }} />
                <div>
                  <p className="font-semibold text-sm mb-0.5" style={{ color: '#0f3d3d' }}>お電話</p>
                  <a href="tel:0438755557" className="font-bold text-lg" style={{ color: '#0d6060' }}>
                    0438-75-5557
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Train size={18} className="mt-0.5 shrink-0" style={{ color: '#0d6060' }} />
                <div>
                  <p className="font-semibold text-sm mb-0.5" style={{ color: '#0f3d3d' }}>最寄り駅</p>
                  <p className="text-gray-600 text-sm">JR内房線 長浦駅より徒歩7分</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-3" style={{ color: '#0f3d3d' }}>
            まずはお気軽にご相談ください
          </h2>
          <p className="text-gray-500 text-sm mb-10">予約・詳細は公式サイトまたはお電話にてご確認ください</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="tel:0438755557"
              className="flex items-center gap-2 text-white px-8 py-4 rounded-full font-semibold transition hover:opacity-90"
              style={{ background: '#0f3d3d' }}
            >
              <Phone size={18} /> 電話で予約する
            </a>
            <a
              href="https://www.str-ito-chiryoin.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-4 rounded-full font-semibold border-2 transition hover:opacity-90"
              style={{ borderColor: '#0f3d3d', color: '#0f3d3d' }}
            >
              公式サイトを見る <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="text-white py-10" style={{ background: '#071e1e' }}>
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Link href="/site" className="text-teal-300 hover:text-white text-sm transition">
            ← グループトップへ戻る（有限会社イトーメディカルケア）
          </Link>
          <p className="text-teal-900 text-xs mt-6">© 2024 有限会社イトーメディカルケア. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  )
}
