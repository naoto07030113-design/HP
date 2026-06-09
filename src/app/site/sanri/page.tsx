import Link from 'next/link'
import { MapPin, Phone, ExternalLink, ArrowLeft, ShoppingBag, ParkingSquare, Car, Activity, Sparkles, Wind, Heart, Layers } from 'lucide-react'
import { Noto_Sans_JP } from 'next/font/google'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SANRI鍼灸整骨院 | 有限会社イトーメディカルケア',
  description: '千葉県富津市イオンモール富津3Fの鍼灸整骨院。交通事故・猫背骨盤矯正・美容鍼・酸素カプセル。',
}

const notoSans = Noto_Sans_JP({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
})

const services = [
  {
    Icon: Car,
    title: '交通事故治療',
    desc: 'むちうち・後遺症・首・腰の痛みなど交通事故による症状を専門的に治療。自賠責保険を使用するため患者様の窓口負担はありません。',
  },
  {
    Icon: Layers,
    title: '猫背・骨盤矯正',
    desc: '悪い姿勢・骨盤の歪みを根本から整え、再発しない身体づくりを目指します。猫背・O脚・反り腰・産後骨盤矯正にも対応。',
  },
  {
    Icon: Activity,
    title: '鍼灸治療',
    desc: '経絡・ツボへのアプローチで自然治癒力を高めます。イトー式指圧（垂直圧）で深部までアプローチし、腰痛・肩こりを改善します。',
  },
  {
    Icon: Sparkles,
    title: '美容鍼',
    desc: '顔への鍼施術でコラーゲン生成を促進。肌のハリ・小顔・リフトアップ・くすみ改善が期待でき、メイク乗りもよくなります。',
  },
  {
    Icon: Wind,
    title: '酸素カプセル',
    desc: '高濃度酸素環境で血中酸素量をアップ。疲労回復・免疫力向上・睡眠の質改善など多彩な効果が期待できます。',
  },
  {
    Icon: Heart,
    title: '指圧・マッサージ',
    desc: '国家資格保持者によるイトー式指圧・マッサージ。筋肉の深部まで丁寧にアプローチし、全身のコリをほぐします。',
  },
]

export default function Sanri() {
  return (
    <div className={`${notoSans.className} min-h-screen bg-white`}>
      {/* ===== Header ===== */}
      <header className="text-white sticky top-0 z-50 shadow-lg" style={{ background: '#052e1e' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link
            href="/site"
            className="flex items-center gap-2 text-emerald-300 hover:text-white transition text-sm shrink-0"
          >
            <ArrowLeft size={15} />
            グループトップ
          </Link>
          <p className="flex-1 text-center text-sm font-bold">SANRI鍼灸整骨院</p>
          <div className="w-28" />
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section
        className="text-white py-20 md:py-28"
        style={{ background: 'linear-gradient(135deg, #052e1e 0%, #064e3b 60%, #059669 100%)' }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-emerald-400 text-xs tracking-[0.3em] mb-4">
            SANRI ACUPUNCTURE · イオンモール富津院
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">SANRI鍼灸整骨院</h1>
          <p className="text-emerald-300 text-base mb-4 flex items-center gap-2">
            <MapPin size={14} /> 千葉県富津市（イオンモール富津3F）
          </p>
          <p className="text-emerald-100 max-w-xl leading-relaxed mb-8">
            お買い物ついでに気軽に通える、イオンモール富津3Fの鍼灸整骨院。
            交通事故治療・猫背骨盤矯正・美容鍼・酸素カプセルまで幅広く対応します。
          </p>
          {/* 特徴バッジ */}
          <div className="flex flex-wrap gap-3">
            {[
              { Icon: ShoppingBag, text: 'ショッピングついでにOK' },
              { Icon: ParkingSquare, text: '大型駐車場完備' },
              { Icon: Car, text: '交通事故治療対応' },
            ].map((b) => (
              <div
                key={b.text}
                className="flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 text-sm"
              >
                <b.Icon size={14} className="text-emerald-300" />
                {b.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Services ===== */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">施術内容</h2>
            <p className="text-gray-400 text-xs tracking-widest">TREATMENTS</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {services.map((s) => (
              <div
                key={s.title}
                className="border border-gray-100 rounded-xl p-6 hover:shadow-md hover:border-emerald-100 transition"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
                  style={{ background: '#e6f7f0' }}
                >
                  <s.Icon size={18} style={{ color: '#064e3b' }} />
                </div>
                <h3 className="font-bold text-base text-gray-900 mb-2">{s.title}</h3>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-1">診療時間</h2>
            <p className="text-gray-400 text-xs tracking-widest mb-8">HOURS</p>
            <div className="border border-gray-200 overflow-hidden rounded-xl">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#052e1e' }} className="text-white">
                    <th className="py-3 px-5 text-left font-medium">時間帯</th>
                    <th className="py-3 px-5 text-center font-medium">月〜木・土日</th>
                    <th className="py-3 px-5 text-center font-medium">祝日</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 bg-white">
                    <td className="py-4 px-5 text-gray-500">午前</td>
                    <td className="py-4 px-5 text-center font-semibold" style={{ color: '#064e3b' }}>
                      10:00 〜 13:00
                    </td>
                    <td className="py-4 px-5 text-center font-semibold" style={{ color: '#064e3b' }}>
                      10:00 〜 13:00
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="py-4 px-5 text-gray-500">午後</td>
                    <td className="py-4 px-5 text-center font-semibold" style={{ color: '#064e3b' }}>
                      14:30 〜 20:00
                    </td>
                    <td className="py-4 px-5 text-center font-semibold" style={{ color: '#064e3b' }}>
                      14:30 〜 20:00
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="px-5 py-3 bg-red-50 text-red-600 text-xs border-t border-red-100 rounded-b-xl">
                ※ 金曜日は定休日（土日祝は営業）
              </div>
            </div>
          </div>

          {/* Access */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">アクセス</h2>
            <p className="text-gray-400 text-xs tracking-widest mb-8">ACCESS</p>
            <div className="space-y-5">
              {[
                {
                  Icon: MapPin,
                  label: '所在地',
                  value: '千葉県富津市青木（イオンモール富津3F）',
                },
                {
                  Icon: Phone,
                  label: 'お電話',
                  value: '0439-32-1771',
                  isPhone: true,
                },
                {
                  Icon: ParkingSquare,
                  label: '駐車場',
                  value: 'イオンモール富津の大型駐車場をご利用いただけます（無料）',
                },
                {
                  Icon: ShoppingBag,
                  label: '施術後のお買い物',
                  value: '施術後にショッピングも楽しめます。土日祝も営業中。',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-4 border-b border-gray-100 pb-5 last:border-0"
                >
                  <item.Icon size={17} className="mt-0.5 shrink-0" style={{ color: '#059669' }} />
                  <div>
                    <p className="font-semibold text-sm text-gray-900 mb-0.5">{item.label}</p>
                    {item.isPhone ? (
                      <a href="tel:0439321771" className="font-bold text-xl" style={{ color: '#064e3b' }}>
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-gray-500 text-sm">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">お気軽にご来院ください</h2>
          <p className="text-gray-400 text-sm mb-10">予約・詳細は公式サイトまたはお電話にてご確認ください</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="tel:0439321771"
              className="flex items-center gap-2 text-white px-8 py-4 font-semibold rounded-full transition hover:opacity-90"
              style={{ background: '#052e1e' }}
            >
              <Phone size={18} /> 電話で予約する
            </a>
            <a
              href="https://www.sanri-seikotsuin.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-4 font-semibold border-2 rounded-full transition hover:bg-gray-50"
              style={{ borderColor: '#052e1e', color: '#052e1e' }}
            >
              公式サイトを見る <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="text-white py-10" style={{ background: '#021a10' }}>
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Link href="/site" className="text-emerald-400 hover:text-white text-sm transition">
            ← グループトップへ戻る（有限会社イトーメディカルケア）
          </Link>
          <p className="text-emerald-900 text-xs mt-6">
            © 2024 有限会社イトーメディカルケア. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
