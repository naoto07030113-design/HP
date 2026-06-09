import Link from 'next/link'
import { MapPin, Phone, ExternalLink, ArrowLeft, Train, Activity, Zap, Layers, Sparkles } from 'lucide-react'
import { Noto_Sans_JP } from 'next/font/google'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ストレッチ鍼灸イトー整骨院 | 有限会社イトーメディカルケア',
  description: '千葉県袖ケ浦市長浦駅前のストレッチ鍼灸院。EMS・IMC式矯正・美容鍼灸。長浦駅から徒歩7分。',
}

const notoSans = Noto_Sans_JP({
  weight: ['400', '500', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
})

const BG = 'linear-gradient(150deg, #051818 0%, #0c3333 40%, #0d7d7d 100%)'

const services = [
  {
    Icon: Activity,
    title: 'ストレッチ鍼灸',
    desc: 'ストレッチと鍼灸を組み合わせた当院独自の施術。筋肉の柔軟性を取り戻しながら鍼灸で自然治癒力を高め、慢性的なコリや痛みを根本から改善します。',
  },
  {
    Icon: Zap,
    title: 'EMS（楽トレ）',
    desc: '寝ているだけでインナーマッスルを鍛えられる「楽トレ」を導入。体幹強化・腰痛改善・産後ケアなど幅広い効果が期待できます。',
  },
  {
    Icon: Layers,
    title: 'IMC式矯正治療',
    desc: '身体の根本的な歪みを整えるIMC式矯正。骨盤・背骨・全身のバランスを調整し、痛みが再発しない身体づくりを目指します。',
  },
  {
    Icon: Sparkles,
    title: '美容鍼灸',
    desc: '顔・首・デコルテへのアプローチで、肌のハリ・リフトアップ・くすみ改善を実現。内側から輝く美しさをサポートします。',
  },
]

export default function StretchIto() {
  return (
    <div className={`${notoSans.className} min-h-screen bg-white`}>
      {/* ===== Header ===== */}
      <header className="text-white sticky top-0 z-50 shadow-lg" style={{ background: '#051818' }}>
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
        <div className="max-w-6xl mx-auto px-4 relative">
          <p className="text-teal-400 text-xs tracking-[0.3em] mb-4">
            STRETCH ITO SEIKOTSUIN · 長浦駅前院
          </p>
          <h1 className="font-black leading-tight mb-4">
            <span className="block text-4xl md:text-5xl">ストレッチ鍼灸</span>
            <span className="block text-4xl md:text-5xl">イトー整骨院</span>
          </h1>
          <p className="text-teal-300 text-base mb-4 flex items-center gap-2">
            <MapPin size={14} /> 千葉県袖ケ浦市長浦駅前
          </p>
          <p className="text-teal-100 max-w-xl leading-relaxed text-base mb-8">
            ストレッチと鍼灸を融合させた独自の施術で、痛みの根本解消と再発しない身体づくりを実現。
            EMS（楽トレ）やIMC式矯正治療など最新のアプローチを取り入れています。
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-xl">
            {['ストレッチ鍼灸', 'EMS（楽トレ）', 'IMC式矯正', '美容鍼灸'].map((tag) => (
              <div
                key={tag}
                className="border border-teal-600 bg-teal-900/30 text-teal-200 text-xs px-3 py-2 text-center"
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Services ===== */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-12 flex items-end gap-4">
            <h2 className="text-2xl font-black text-gray-900">施術内容</h2>
            <span className="text-gray-300 text-xs tracking-widest pb-1">TREATMENTS</span>
          </div>
          <div className="grid md:grid-cols-2 gap-px bg-gray-100">
            {services.map((s) => (
              <div key={s.title} className="bg-white p-8 hover:bg-gray-50 transition">
                <div
                  className="w-10 h-10 flex items-center justify-center mb-5"
                  style={{ background: '#0d3333', borderRadius: 0 }}
                >
                  <s.Icon size={20} className="text-teal-300" />
                </div>
                <h3 className="font-black text-lg text-gray-900 mb-3">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Hours + Access ===== */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-16">
          {/* Hours */}
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-1">診療時間</h2>
            <p className="text-gray-400 text-xs tracking-widest mb-8">HOURS</p>
            <div className="overflow-hidden border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#051818' }} className="text-white">
                    <th className="py-3 px-5 text-left font-medium">時間帯</th>
                    <th className="py-3 px-5 text-center font-medium">月〜土</th>
                    <th className="py-3 px-5 text-center font-medium">日曜</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 bg-white">
                    <td className="py-4 px-5 text-gray-500">午前</td>
                    <td
                      className="py-4 px-5 text-center font-bold"
                      style={{ color: '#0c3333' }}
                    >
                      9:30 〜 12:00
                    </td>
                    <td
                      className="py-4 px-5 text-center font-bold"
                      style={{ color: '#0c3333' }}
                    >
                      9:30 〜 12:00
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="py-4 px-5 text-gray-500">午後</td>
                    <td
                      className="py-4 px-5 text-center font-bold"
                      style={{ color: '#0c3333' }}
                    >
                      14:30 〜 20:00
                    </td>
                    <td
                      className="py-4 px-5 text-center font-bold"
                      style={{ color: '#0c3333' }}
                    >
                      〜 17:00
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="px-5 py-3 bg-red-50 text-red-600 text-xs border-t border-red-100">
                ※ 金曜日は定休日です
              </div>
            </div>
          </div>

          {/* Access */}
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-1">アクセス</h2>
            <p className="text-gray-400 text-xs tracking-widest mb-8">ACCESS</p>
            <div className="space-y-6">
              <div className="flex items-start gap-4 border-b border-gray-100 pb-6">
                <MapPin size={18} className="mt-0.5 shrink-0" style={{ color: '#0d7d7d' }} />
                <div>
                  <p className="font-bold text-sm text-gray-900 mb-1">所在地</p>
                  <p className="text-gray-500 text-sm">〒299-0261 千葉県袖ケ浦市長浦駅前2-4-10</p>
                </div>
              </div>
              <div className="flex items-start gap-4 border-b border-gray-100 pb-6">
                <Phone size={18} className="mt-0.5 shrink-0" style={{ color: '#0d7d7d' }} />
                <div>
                  <p className="font-bold text-sm text-gray-900 mb-1">お電話</p>
                  <a href="tel:0438755557" className="font-black text-xl" style={{ color: '#0c3333' }}>
                    0438-75-5557
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Train size={18} className="mt-0.5 shrink-0" style={{ color: '#0d7d7d' }} />
                <div>
                  <p className="font-bold text-sm text-gray-900 mb-1">最寄り駅</p>
                  <p className="text-gray-500 text-sm">JR内房線 長浦駅より徒歩7分</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-3">まずはお気軽にご相談ください</h2>
          <p className="text-gray-400 text-sm mb-10">予約・詳細は公式サイトまたはお電話にてご確認ください</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="tel:0438755557"
              className="flex items-center gap-2 text-white px-8 py-4 font-bold transition hover:opacity-90"
              style={{ background: '#051818' }}
            >
              <Phone size={18} /> 電話で予約する
            </a>
            <a
              href="https://www.str-ito-chiryoin.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-4 font-bold border-2 transition hover:bg-gray-50"
              style={{ borderColor: '#051818', color: '#051818' }}
            >
              公式サイトを見る <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="text-white py-10" style={{ background: '#020d0d' }}>
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Link href="/site" className="text-teal-400 hover:text-white text-sm transition">
            ← グループトップへ戻る（有限会社イトーメディカルケア）
          </Link>
          <p className="text-teal-900 text-xs mt-6">
            © 2024 有限会社イトーメディカルケア. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
