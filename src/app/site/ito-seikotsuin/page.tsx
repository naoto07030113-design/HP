import Link from 'next/link'
import { MapPin, Phone, ExternalLink, ArrowLeft, Car } from 'lucide-react'
import { Noto_Serif_JP } from 'next/font/google'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'イトー整骨院（本院）| 有限会社イトーメディカルケア',
  description: '千葉県袖ケ浦市野里の鍼灸整骨院。鍼灸・指圧・矯正・交通事故治療。無料送迎あり。',
}

const notoSerif = Noto_Serif_JP({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
})

const services = [
  {
    num: '01',
    title: '鍼灸治療',
    desc: '経絡・ツボへのアプローチで身体の自然治癒力を引き出します。慢性痛・自律神経・冷え性・不眠など幅広い症状に対応いたします。',
  },
  {
    num: '02',
    title: '指圧・マッサージ',
    desc: 'イトー式指圧で筋肉に対して垂直に圧をかけ、深部までしっかりアプローチ。腰痛・肩こり・疲労回復に高い効果を発揮します。',
  },
  {
    num: '03',
    title: '矯正治療',
    desc: '骨格・骨盤の歪みを整え、痛みが再発しない身体づくりを目指す根本治療。猫背・O脚・産後骨盤矯正にも対応いたします。',
  },
  {
    num: '04',
    title: '交通事故治療',
    desc: 'むちうち・頭痛・しびれなど交通事故による症状を専門的に治療。自賠責保険適用で窓口負担なしでの施術が可能です。',
  },
]

export default function ItoSeikotsuin() {
  return (
    <div className={`${notoSerif.className} min-h-screen bg-white`}>
      {/* ===== Header ===== */}
      <header className="bg-green-900 text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link
            href="/site"
            className="flex items-center gap-2 text-green-300 hover:text-white transition text-sm shrink-0"
          >
            <ArrowLeft size={15} />
            グループトップ
          </Link>
          <p className="flex-1 text-center text-sm font-bold">イトー整骨院</p>
          <div className="w-24" />
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section
        className="text-white py-24 md:py-32 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0a2819 0%, #14462e 55%, #1d7a4a 100%)' }}
      >
        <div className="max-w-6xl mx-auto px-4 relative">
          <p className="text-green-400 text-xs tracking-[0.3em] mb-6">ITO SEIKOTSUIN · 本院</p>
          <h1 className="text-5xl md:text-6xl font-bold mb-4 leading-tight">イトー整骨院</h1>
          <div className="w-10 h-0.5 bg-green-400 mb-6" />
          <p className="text-green-300 text-base mb-3 flex items-center gap-2">
            <MapPin size={14} /> 千葉県袖ケ浦市野里
          </p>
          <p className="text-green-100 max-w-xl leading-loose text-base">
            1995年の創業以来、袖ケ浦の地域に根ざし続ける本院。
            国家資格を持つ治療家が一人ひとりに寄り添い、
            鍼灸・指圧・矯正・交通事故治療など幅広く対応します。
          </p>
          <div className="flex flex-wrap gap-2 mt-8">
            {['鍼灸治療', '指圧・マッサージ', '矯正治療', '交通事故治療', '無料送迎', '個室あり'].map((tag) => (
              <span
                key={tag}
                className="text-sm border border-green-600 text-green-200 px-3 py-1 rounded-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Services ===== */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-green-900 mb-1">施術内容</h2>
            <p className="text-gray-400 text-xs tracking-widest">TREATMENTS</p>
          </div>
          <div className="divide-y divide-gray-100">
            {services.map((s) => (
              <div key={s.num} className="py-10 grid md:grid-cols-4 gap-6 items-start">
                <div className="flex items-start gap-4">
                  <span
                    className="text-3xl font-bold leading-none"
                    style={{ color: '#dcf5e6', WebkitTextStroke: '1px #1a6b42' }}
                  >
                    {s.num}
                  </span>
                  <h3 className="text-lg font-bold text-green-900 pt-0.5">{s.title}</h3>
                </div>
                <p className="md:col-span-3 text-gray-600 text-sm leading-relaxed">{s.desc}</p>
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
            <h2 className="text-2xl font-bold text-green-900 mb-1">診療時間</h2>
            <p className="text-gray-400 text-xs tracking-widest mb-8">HOURS</p>
            <div className="border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#14462e' }} className="text-white">
                    <th className="py-3 px-5 text-left font-medium">時間帯</th>
                    <th className="py-3 px-5 text-center font-medium">月〜土</th>
                    <th className="py-3 px-5 text-center font-medium">日・祝</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 bg-white">
                    <td className="py-4 px-5 text-gray-500">午前</td>
                    <td className="py-4 px-5 text-center font-semibold text-green-900">
                      9:00 〜 12:00
                    </td>
                    <td className="py-4 px-5 text-center text-gray-300">—</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="py-4 px-5 text-gray-500">午後</td>
                    <td className="py-4 px-5 text-center font-semibold text-green-900">
                      14:00 〜 19:30
                    </td>
                    <td className="py-4 px-5 text-center text-gray-300">—</td>
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
            <h2 className="text-2xl font-bold text-green-900 mb-1">アクセス</h2>
            <p className="text-gray-400 text-xs tracking-widest mb-8">ACCESS</p>
            <div className="space-y-6">
              <div className="flex items-start gap-4 border-b border-gray-100 pb-6">
                <MapPin size={18} className="text-green-700 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-green-900 mb-1">所在地</p>
                  <p className="text-gray-600 text-sm">〒299-0211 千葉県袖ケ浦市野里1770-3</p>
                </div>
              </div>
              <div className="flex items-start gap-4 border-b border-gray-100 pb-6">
                <Phone size={18} className="text-green-700 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-green-900 mb-1">お電話</p>
                  <a href="tel:0438755557" className="text-green-800 font-bold text-xl">
                    0438-75-5557
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Car size={18} className="text-green-700 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-green-900 mb-1">無料送迎サービス</p>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    ご自宅またはご自宅付近までお迎えに参ります。
                    お電話にてお気軽にご相談ください。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-green-900 mb-3">まずはお気軽にご相談ください</h2>
          <p className="text-gray-500 text-sm mb-10">予約・詳細は公式サイトまたはお電話にてご確認ください</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="tel:0438755557"
              className="flex items-center gap-2 bg-green-900 text-white px-8 py-4 font-semibold hover:bg-green-800 transition"
            >
              <Phone size={18} /> 電話で予約する
            </a>
            <a
              href="https://ito-chiryoin.com/honin/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border-2 border-green-900 text-green-900 px-8 py-4 font-semibold hover:bg-green-50 transition"
            >
              公式サイトを見る <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-green-950 text-white py-10">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Link href="/site" className="text-green-300 hover:text-white text-sm transition">
            ← グループトップへ戻る（有限会社イトーメディカルケア）
          </Link>
          <p className="text-green-800 text-xs mt-6">
            © 2024 有限会社イトーメディカルケア. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
