import Link from 'next/link'
import { MapPin, Phone, ExternalLink, ArrowLeft, Sparkles } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hari-na（ハリナ）| 有限会社イトーメディカルケア',
  description: '千葉県袖ケ浦市の美容鍼専門サロン Hari-na。フェイシャルケア・リフトアップ・美肌。',
}

const BG = 'linear-gradient(135deg, #4c0519 0%, #881337 60%, #be185d 100%)'

export default function Harina() {
  return (
    <div className="min-h-screen bg-white">
      {/* ===== Header ===== */}
      <header className="text-white sticky top-0 z-50 shadow-lg" style={{ background: '#4c0519' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link
            href="/site"
            className="flex items-center gap-2 text-rose-300 hover:text-white transition text-sm shrink-0"
          >
            <ArrowLeft size={15} />
            グループトップ
          </Link>
          <p className="flex-1 text-center text-sm font-bold">Hari-na</p>
          <div className="w-24" />
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
          <span className="text-xs text-rose-300 tracking-widest border border-rose-700 px-3 py-1 rounded-full">
            HARI-NA · 美容鍼専門サロン
          </span>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-3">Hari-na</h1>
          <p className="text-rose-300 text-lg font-light tracking-wider mb-4 flex items-center gap-2">
            <Sparkles size={16} /> 美しさを、鍼から。
          </p>
          <p className="text-rose-100 max-w-xl leading-relaxed mb-8">
            美容鍼に特化した専門サロン。薬や外側からの施術ではなく、
            身体の内側から肌の力を引き出す美容鍼で、本物の美しさをお届けします。
          </p>
          <div className="flex flex-wrap gap-2">
            {['美容鍼', 'フェイシャルケア', 'リフトアップ', '小顔矯正', '美肌ケア', '国家資格鍼灸師'].map((tag) => (
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

      {/* ===== What is Biyobari ===== */}
      <section className="py-16 bg-rose-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#4c0519' }}>美容鍼とは</h2>
          <p className="text-gray-400 text-xs tracking-widest mb-8">ABOUT BIYOBARI</p>
          <p className="text-gray-700 leading-relaxed max-w-2xl mx-auto">
            美容鍼（美容鍼灸）とは、顔・首・デコルテなどに極細の鍼を刺すことで、
            肌細胞を活性化させ自然なコラーゲン生成を促す施術です。
            ノーニードル（注射なし）・薬なしで、身体の内側から輝く肌へと導きます。
            化粧品では届かない真皮層へ直接アプローチするため、即効性と持続性が期待できます。
          </p>
        </div>
      </section>

      {/* ===== Services ===== */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-1" style={{ color: '#4c0519' }}>施術メニュー</h2>
          <p className="text-gray-400 text-xs tracking-widest mb-10">MENU</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '✨',
                title: '美容鍼（フェイシャル）',
                desc: '顔全体への美容鍼施術。コラーゲン生成を促進し、ハリ・ツヤ・小顔効果が期待できます。',
              },
              {
                icon: '🌸',
                title: 'リフトアップ鍼',
                desc: 'たるみ・ほうれい線・フェイスラインに重点的にアプローチ。自然なリフトアップ効果で若々しい表情に。',
              },
              {
                icon: '💆',
                title: '全身美容鍼',
                desc: '顔だけでなく全身の経絡にアプローチ。内側から身体のバランスを整え、美しさの土台をつくります。',
              },
              {
                icon: '🌿',
                title: '美肌ケア鍼',
                desc: '肌荒れ・ニキビ跡・くすみなど肌トラブルにアプローチ。ターンオーバーを促進し、クリアな肌へ。',
              },
              {
                icon: '👁️',
                title: '目元ケア',
                desc: '目の下のクマ・目尻のシワ・目のむくみにアプローチ。疲れ目改善と目元の若返りをサポートします。',
              },
              {
                icon: '💎',
                title: '美容鍼＋デコルテケア',
                desc: '顔からデコルテにかけてトータルケア。首・肩のコリも改善し、フェイスラインをすっきり整えます。',
              },
            ].map((s) => (
              <div
                key={s.title}
                className="border border-rose-100 rounded-xl p-6 hover:shadow-md transition bg-white"
              >
                <div className="text-3xl mb-3">{s.icon}</div>
                <h3 className="font-bold text-base mb-2" style={{ color: '#4c0519' }}>{s.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Why Hari-na ===== */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-1 text-center" style={{ color: '#4c0519' }}>
            Hari-naが選ばれる理由
          </h2>
          <p className="text-gray-400 text-xs tracking-widest mb-10 text-center">WHY HARI-NA</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🏅',
                title: '国家資格鍼灸師が担当',
                desc: 'はり師の国家資格を持つ専門家が施術。安全で効果的な美容鍼をご提供します。',
              },
              {
                icon: '🌿',
                title: 'グループのノウハウを活用',
                desc: 'イトーメディカルケアグループ30年の鍼灸経験を美容鍼に応用。東洋医学の深い知識が強みです。',
              },
              {
                icon: '💐',
                title: '女性に寄り添うケア',
                desc: 'ゆったりとした個室空間でリラックスして施術を受けられます。お肌の悩みをお気軽にご相談ください。',
              },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-8 shadow-sm text-center">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-lg mb-3" style={{ color: '#4c0519' }}>{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Access ===== */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-1" style={{ color: '#4c0519' }}>アクセス</h2>
          <p className="text-gray-400 text-xs tracking-widest mb-6">ACCESS</p>
          <div className="bg-rose-50 rounded-xl p-6 space-y-5">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0" style={{ color: '#be185d' }} />
              <div>
                <p className="font-semibold text-sm mb-0.5" style={{ color: '#4c0519' }}>所在地</p>
                <p className="text-gray-600 text-sm">千葉県袖ケ浦市（詳細は公式サイトをご確認ください）</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone size={18} className="mt-0.5 shrink-0" style={{ color: '#be185d' }} />
              <div>
                <p className="font-semibold text-sm mb-0.5" style={{ color: '#4c0519' }}>ご予約・お問い合わせ</p>
                <p className="text-gray-600 text-sm">公式サイトよりご予約・お問い合わせください</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16" style={{ background: BG }}>
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">美しさへの第一歩を</h2>
          <p className="text-rose-200 text-sm mb-10">
            初めての方も安心。公式サイトから詳細をご確認いただき、お気軽にご予約ください。
          </p>
          <a
            href="https://sodegaura-harina-biyobari.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white px-10 py-4 rounded-full font-semibold transition hover:opacity-90"
            style={{ color: '#4c0519' }}
          >
            公式サイトでご予約 <ExternalLink size={16} />
          </a>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="text-white py-10" style={{ background: '#2d0210' }}>
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Link href="/site" className="text-rose-300 hover:text-white text-sm transition">
            ← グループトップへ戻る（有限会社イトーメディカルケア）
          </Link>
          <p className="text-rose-900 text-xs mt-6">© 2024 有限会社イトーメディカルケア. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  )
}
