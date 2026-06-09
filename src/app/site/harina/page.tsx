import Link from 'next/link'
import { MapPin, Phone, ExternalLink, ArrowLeft } from 'lucide-react'
import { Cormorant_Garamond, Noto_Sans_JP } from 'next/font/google'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hari-na | 美容鍼専門サロン | 有限会社イトーメディカルケア',
  description: '千葉県袖ケ浦市の美容鍼専門サロン Hari-na。肌本来の力を引き出す美容鍼・フェイシャルケア。',
}

const cormorant = Cormorant_Garamond({
  weight: ['300', '400', '500', '600'],
  subsets: ['latin'],
  display: 'swap',
})

const notoSans = Noto_Sans_JP({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  display: 'swap',
})

const menu = [
  {
    num: '01',
    title: 'フェイシャル美容鍼',
    sub: 'Facial Acupuncture',
    desc: '顔全体への美容鍼施術。コラーゲン生成を促進し、ハリ・ツヤ・小顔効果が期待できます。',
  },
  {
    num: '02',
    title: 'リフトアップ鍼',
    sub: 'Lift-Up Treatment',
    desc: 'たるみ・ほうれい線・フェイスラインに重点的にアプローチ。自然なリフトアップ効果で若々しい表情に整えます。',
  },
  {
    num: '03',
    title: '全身美容鍼',
    sub: 'Full Body Acupuncture',
    desc: '顔だけでなく全身の経絡にアプローチ。内側から身体のバランスを整え、美しさの土台をつくります。',
  },
  {
    num: '04',
    title: '美肌ケア鍼',
    sub: 'Skin Care',
    desc: '肌荒れ・ニキビ跡・くすみなど肌トラブルにアプローチ。ターンオーバーを促進し、クリアな肌へ導きます。',
  },
  {
    num: '05',
    title: '目元ケア',
    sub: 'Eye Area Care',
    desc: '目の下のクマ・目尻のシワ・目のむくみにアプローチ。疲れ目改善と目元の若返りをサポートします。',
  },
  {
    num: '06',
    title: 'デコルテケアコース',
    sub: 'Décolleté Course',
    desc: '顔からデコルテにかけてトータルケア。首・肩のコリも改善し、フェイスラインをすっきり整えます。',
  },
]

const reasons = [
  {
    title: '国家資格 はり師が担当',
    desc: '厚生労働省認定のはり師国家資格保持者が施術を担当します。安全で効果的な美容鍼をご提供します。',
  },
  {
    title: 'グループ30年の鍼灸ノウハウ',
    desc: 'イトーメディカルケアグループ30年の鍼灸経験を美容鍼に応用。東洋医学の深い知識が強みです。',
  },
  {
    title: 'お肌に寄り添うカウンセリング',
    desc: '施術前のカウンセリングを大切に。お肌の悩みや体質に合わせたオーダーメイドの施術をご提案します。',
  },
]

export default function Harina() {
  return (
    <div className={`${notoSans.className} min-h-screen`} style={{ background: '#fdf8f5' }}>
      {/* ===== Header ===== */}
      <header
        className="text-gray-800 sticky top-0 z-50"
        style={{ background: '#fdf8f5', borderBottom: '1px solid #e8d8da' }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/site"
            className="flex items-center gap-2 text-rose-400 hover:text-rose-600 transition text-xs tracking-widest"
          >
            <ArrowLeft size={13} />
            GROUP TOP
          </Link>
          <p className={`${cormorant.className} text-xl font-light tracking-[0.2em] text-gray-700`}>
            Hari-na
          </p>
          <div className="w-24" />
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="py-28 md:py-40" style={{ background: '#fdf8f5' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-xs tracking-[0.4em] text-rose-400 mb-8">HARI-NA · 美容鍼専門サロン</p>
          <h1 className={`${cormorant.className} text-7xl md:text-9xl font-light text-gray-800 mb-6`}>
            Hari-na
          </h1>
          <div className="w-12 h-px mx-auto mb-6" style={{ background: '#c4768a' }} />
          <p
            className={`${cormorant.className} text-2xl md:text-3xl font-light tracking-wider mb-8`}
            style={{ color: '#7a3a4a' }}
          >
            美しさを、鍼から。
          </p>
          <p className="text-gray-500 text-sm leading-loose max-w-md mx-auto font-light">
            薬や外側からの施術ではなく、身体の内側から肌の力を引き出す美容鍼で、
            本物の美しさをお届けします。
          </p>
          <div className="mt-10">
            <a
              href="https://sodegaura-harina-biyobari.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm tracking-widest px-10 py-4 transition"
              style={{
                background: '#7a3a4a',
                color: '#fff',
                letterSpacing: '0.15em',
              }}
            >
              ご予約はこちら
            </a>
          </div>
        </div>
      </section>

      {/* ===== What is Biyobari ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] text-rose-400 mb-3">ABOUT</p>
            <h2
              className={`${cormorant.className} text-4xl font-light`}
              style={{ color: '#3a1a24' }}
            >
              美容鍼とは
            </h2>
          </div>
          <div className="w-px h-10 mx-auto mb-10" style={{ background: '#e8d0d4' }} />
          <p className="text-gray-600 leading-loose text-sm font-light text-center max-w-2xl mx-auto">
            美容鍼灸とは、顔・首・デコルテなどに極細の鍼を刺すことで、肌細胞を活性化させ
            自然なコラーゲン生成を促す施術です。ノーニードル・薬なしで、身体の内側から
            輝く肌へと導きます。化粧品では届かない真皮層へ直接アプローチするため、
            即効性と持続性が期待できます。
          </p>
        </div>
      </section>

      {/* ===== Menu ===== */}
      <section className="py-20" style={{ background: '#fdf8f5' }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.3em] text-rose-400 mb-3">MENU</p>
            <h2
              className={`${cormorant.className} text-4xl font-light`}
              style={{ color: '#3a1a24' }}
            >
              施術メニュー
            </h2>
          </div>
          <div className="divide-y" style={{ borderColor: '#e8d0d4' }}>
            {menu.map((item) => (
              <div key={item.num} className="py-8 grid md:grid-cols-5 gap-4 items-start">
                <div className="flex items-start gap-3 md:col-span-2">
                  <span
                    className={`${cormorant.className} text-3xl font-light leading-none`}
                    style={{ color: '#e8d0d4' }}
                  >
                    {item.num}
                  </span>
                  <div>
                    <h3 className="text-sm font-medium text-gray-800 mb-0.5">{item.title}</h3>
                    <p
                      className={`${cormorant.className} text-xs font-light tracking-widest`}
                      style={{ color: '#c4768a' }}
                    >
                      {item.sub}
                    </p>
                  </div>
                </div>
                <p className="md:col-span-3 text-gray-500 text-sm leading-relaxed font-light">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Why Hari-na ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.3em] text-rose-400 mb-3">WHY HARI-NA</p>
            <h2
              className={`${cormorant.className} text-4xl font-light`}
              style={{ color: '#3a1a24' }}
            >
              Hari-naが選ばれる理由
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: '#e8d0d4' }}>
            {reasons.map((r, i) => (
              <div key={i} className="p-8 text-center">
                <p
                  className={`${cormorant.className} text-4xl font-light mb-4`}
                  style={{ color: '#e8d0d4' }}
                >
                  0{i + 1}
                </p>
                <h3 className="text-sm font-medium text-gray-800 mb-3">{r.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed font-light">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Access ===== */}
      <section className="py-20" style={{ background: '#fdf8f5' }}>
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] text-rose-400 mb-3">ACCESS</p>
            <h2
              className={`${cormorant.className} text-4xl font-light`}
              style={{ color: '#3a1a24' }}
            >
              アクセス
            </h2>
          </div>
          <div
            className="divide-y"
            style={{ borderColor: '#e8d0d4' }}
          >
            <div className="py-6 flex items-start gap-5">
              <MapPin size={15} className="mt-0.5 shrink-0" style={{ color: '#c4768a' }} />
              <div>
                <p className="text-xs tracking-widest text-gray-400 mb-1">所在地</p>
                <p className="text-sm text-gray-700 font-light">
                  千葉県袖ケ浦市（詳細は公式サイトをご確認ください）
                </p>
              </div>
            </div>
            <div className="py-6 flex items-start gap-5">
              <Phone size={15} className="mt-0.5 shrink-0" style={{ color: '#c4768a' }} />
              <div>
                <p className="text-xs tracking-widest text-gray-400 mb-1">ご予約・お問い合わせ</p>
                <p className="text-sm text-gray-700 font-light">
                  公式サイトのご予約フォームよりお申し込みください
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-24 bg-white">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="w-px h-12 mx-auto mb-8" style={{ background: '#e8d0d4' }} />
          <p
            className={`${cormorant.className} text-3xl md:text-4xl font-light mb-4`}
            style={{ color: '#3a1a24' }}
          >
            美しさへの第一歩を
          </p>
          <p className="text-gray-400 text-sm font-light mb-10 leading-relaxed">
            初めての方も安心してご来院いただけます。
            <br />
            公式サイトからご予約・詳細のご確認をお願いいたします。
          </p>
          <a
            href="https://sodegaura-harina-biyobari.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-12 py-4 text-sm tracking-[0.15em] transition hover:opacity-80"
            style={{ background: '#7a3a4a', color: '#fff' }}
          >
            公式サイトでご予約 <ExternalLink size={14} />
          </a>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="py-10 border-t" style={{ background: '#fdf8f5', borderColor: '#e8d0d4' }}>
        <div className="max-w-6xl mx-auto px-6 text-center">
          <Link href="/site" className="text-xs tracking-widest text-rose-400 hover:text-rose-600 transition">
            ← GROUP TOP（有限会社イトーメディカルケア）
          </Link>
          <p className="text-gray-300 text-xs mt-6">
            © 2024 有限会社イトーメディカルケア. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
