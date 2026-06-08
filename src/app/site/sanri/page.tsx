import Link from 'next/link'
import { MapPin, Phone, ExternalLink, ArrowLeft, ShoppingBag, ParkingSquare } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SANRI鍼灸整骨院 | 有限会社イトーメディカルケア',
  description: '千葉県富津市イオンモール富津3Fの鍼灸整骨院。交通事故・猫背骨盤矯正・美容鍼・酸素カプセル。',
}

const BG = 'linear-gradient(135deg, #052e1e 0%, #064e3b 60%, #059669 100%)'

export default function Sanri() {
  return (
    <div className="min-h-screen bg-white">
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
      <section className="text-white py-20 md:py-28 relative overflow-hidden" style={{ background: BG }}>
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle at 20px 20px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="max-w-6xl mx-auto px-4 relative">
          <span className="text-xs text-emerald-400 tracking-widest border border-emerald-700 px-3 py-1 rounded-full">
            SANRI ACUPUNCTURE · イオンモール富津院
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-3">SANRI鍼灸整骨院</h1>
          <p className="text-emerald-300 text-base mb-4 flex items-center gap-2">
            <MapPin size={14} /> 千葉県富津市（イオンモール富津3F）
          </p>
          <p className="text-emerald-100 max-w-xl leading-relaxed mb-8">
            お買い物ついでに気軽に通える、イオンモール富津3Fの鍼灸整骨院。
            交通事故治療・猫背骨盤矯正・美容鍼・酸素カプセルまで幅広く対応します。
          </p>
          <div className="flex flex-wrap gap-2">
            {['交通事故治療', '猫背骨盤矯正', '鍼灸治療', '美容鍼', '酸素カプセル', 'ショッピングついでにOK'].map(
              (tag) => (
                <span
                  key={tag}
                  className="text-sm bg-white/10 border border-white/20 px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* ===== Services ===== */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-1" style={{ color: '#052e1e' }}>施術内容</h2>
          <p className="text-gray-400 text-xs tracking-widest mb-10">TREATMENTS</p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: '🚗',
                title: '交通事故治療',
                desc: 'むちうち・後遺症・首・腰の痛みなど交通事故による症状を専門的に治療。自賠責保険を使用するため患者様の窓口負担はありません。',
              },
              {
                icon: '🦴',
                title: '猫背・骨盤矯正',
                desc: '悪い姿勢・骨盤の歪みを根本から整え、再発しない身体づくりを目指します。猫背・O脚・反り腰・産後骨盤矯正にも対応。',
              },
              {
                icon: '🪡',
                title: '鍼灸治療',
                desc: '経絡・ツボへのアプローチで自然治癒力を高めます。イトー式指圧（垂直圧）で深部までアプローチし、腰痛・肩こりを改善。',
              },
              {
                icon: '✨',
                title: '美容鍼',
                desc: '顔への鍼施術でコラーゲン生成を促進。肌のハリ・小顔・リフトアップ・くすみ改善が期待でき、メイク乗りもよくなります。',
              },
              {
                icon: '🫧',
                title: '酸素カプセル',
                desc: '高濃度酸素環境で血中酸素量をアップ。疲労回復・免疫力向上・睡眠の質改善など多彩な効果が期待できます。',
              },
              {
                icon: '⚕️',
                title: '指圧・マッサージ',
                desc: '国家資格保持者による指圧・マッサージ。イトー式指圧で筋肉の深部まで丁寧にアプローチし、全身のコリをほぐします。',
              },
            ].map((s) => (
              <div
                key={s.title}
                className="border border-gray-100 rounded-xl p-6 hover:shadow-md hover:border-emerald-100 transition"
              >
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="font-bold text-lg mb-2" style={{ color: '#052e1e' }}>{s.title}</h3>
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
            <h2 className="text-2xl font-bold mb-1" style={{ color: '#052e1e' }}>診療時間</h2>
            <p className="text-gray-400 text-xs tracking-widest mb-6">HOURS</p>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#052e1e' }} className="text-white">
                    <th className="py-3 px-4 text-left font-medium">時間帯</th>
                    <th className="py-3 px-4 text-center font-medium">月〜木・土日</th>
                    <th className="py-3 px-4 text-center font-medium">祝日</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-500">午前</td>
                    <td className="py-3 px-4 text-center font-semibold" style={{ color: '#064e3b' }}>
                      10:00 〜 13:00
                    </td>
                    <td className="py-3 px-4 text-center font-semibold" style={{ color: '#064e3b' }}>
                      10:00 〜 13:00
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="py-3 px-4 text-gray-500">午後</td>
                    <td className="py-3 px-4 text-center font-semibold" style={{ color: '#064e3b' }}>
                      14:30 〜 20:00
                    </td>
                    <td className="py-3 px-4 text-center font-semibold" style={{ color: '#064e3b' }}>
                      14:30 〜 20:00
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="px-4 py-3 bg-red-50 text-red-600 text-xs border-t border-red-100">
                ※ 金曜日は定休日です（土日祝は営業）
              </div>
            </div>
          </div>

          {/* Access */}
          <div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: '#052e1e' }}>アクセス</h2>
            <p className="text-gray-400 text-xs tracking-widest mb-6">ACCESS</p>
            <div className="bg-white rounded-xl p-6 shadow-sm space-y-5">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 shrink-0" style={{ color: '#059669' }} />
                <div>
                  <p className="font-semibold text-sm mb-0.5" style={{ color: '#052e1e' }}>所在地</p>
                  <p className="text-gray-600 text-sm">千葉県富津市青木（イオンモール富津3F）</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone size={18} className="mt-0.5 shrink-0" style={{ color: '#059669' }} />
                <div>
                  <p className="font-semibold text-sm mb-0.5" style={{ color: '#052e1e' }}>お電話</p>
                  <a href="tel:0439321771" className="font-bold text-lg" style={{ color: '#059669' }}>
                    0439-32-1771
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ParkingSquare size={18} className="mt-0.5 shrink-0" style={{ color: '#059669' }} />
                <div>
                  <p className="font-semibold text-sm mb-0.5" style={{ color: '#052e1e' }}>駐車場</p>
                  <p className="text-gray-600 text-sm">イオンモール富津の大型駐車場をご利用いただけます（無料）</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShoppingBag size={18} className="mt-0.5 shrink-0" style={{ color: '#059669' }} />
                <div>
                  <p className="font-semibold text-sm mb-0.5" style={{ color: '#052e1e' }}>お買い物と一緒に</p>
                  <p className="text-gray-600 text-sm">施術後にショッピングも楽しめます。土日祝も営業しています。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-3" style={{ color: '#052e1e' }}>
            お気軽にご来院ください
          </h2>
          <p className="text-gray-500 text-sm mb-10">予約・詳細は公式サイトまたはお電話にてご確認ください</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="tel:0439321771"
              className="flex items-center gap-2 text-white px-8 py-4 rounded-full font-semibold transition hover:opacity-90"
              style={{ background: '#052e1e' }}
            >
              <Phone size={18} /> 電話で予約する
            </a>
            <a
              href="https://www.sanri-seikotsuin.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-8 py-4 rounded-full font-semibold border-2 transition hover:opacity-80"
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
          <p className="text-emerald-900 text-xs mt-6">© 2024 有限会社イトーメディカルケア. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  )
}
