import Link from 'next/link'
import { MapPin, ExternalLink, Phone } from 'lucide-react'

const clinics = [
  {
    id: 'ito-seikotsuin',
    nameEn: 'ITO SEIKOTSUIN',
    subtitle: '本院',
    name: 'イトー整骨院',
    description:
      '1995年創業の本院。国家資格を持つ治療家が、鍼灸・指圧・矯正治療で根本から回復をサポートします。無料送迎サービスもご利用いただけます。',
    location: '千葉県袖ケ浦市野里',
    services: ['鍼灸治療', '指圧・マッサージ', '矯正治療', '交通事故治療'],
    bgFrom: '#14462e',
    bgTo: '#1a6b42',
    externalUrl: 'https://ito-chiryoin.com/honin/',
  },
  {
    id: 'stretch-ito',
    nameEn: 'STRETCH ITO SEIKOTSUIN',
    subtitle: '長浦駅前院',
    name: 'ストレッチ鍼灸イトー整骨院',
    description:
      'ストレッチと鍼灸を組み合わせた独自施術で、痛みの根本解消と再発しない身体づくりを目指します。',
    location: '千葉県袖ケ浦市長浦駅前',
    services: ['ストレッチ鍼灸', 'EMS（楽トレ）', 'IMC式矯正', '美容鍼灸'],
    bgFrom: '#0f4c4c',
    bgTo: '#0d7d7d',
    externalUrl: 'https://www.str-ito-chiryoin.com/',
  },
  {
    id: 'sanri',
    nameEn: 'SANRI ACUPUNCTURE',
    subtitle: 'イオンモール富津院',
    name: 'SANRI鍼灸整骨院',
    description:
      'イオンモール富津3Fにあり、お買い物ついでに気軽に通えます。交通事故治療・矯正・美容鍼まで幅広く対応。',
    location: '千葉県富津市（イオンモール富津3F）',
    services: ['交通事故治療', '猫背骨盤矯正', '美容鍼', '酸素カプセル'],
    bgFrom: '#064e3b',
    bgTo: '#059669',
    externalUrl: 'https://www.sanri-seikotsuin.com/',
  },
  {
    id: 'harina',
    nameEn: 'HARI-NA',
    subtitle: '美容鍼専門サロン',
    name: 'Hari-na',
    description:
      '美容鍼に特化した専門サロン。肌本来の力を引き出し、内側から輝く美しさをお届けします。',
    location: '千葉県袖ケ浦市',
    services: ['美容鍼', 'フェイシャルケア', 'リフトアップ'],
    bgFrom: '#881337',
    bgTo: '#be185d',
    externalUrl: 'https://sodegaura-harina-biyobari.com/',
  },
]

export default function CompanyHomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ===== Header ===== */}
      <header className="bg-green-900 text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/site" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-[10px] font-bold tracking-tight">IMC</div>
            <div className="leading-tight">
              <p className="text-[10px] text-green-400">有限会社</p>
              <p className="text-sm font-bold">イトーメディカルケア</p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#clinics" className="text-green-200 hover:text-white transition">グループ院</a>
            <a href="#about" className="text-green-200 hover:text-white transition">会社概要</a>
          </nav>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section
        className="text-white py-24 md:py-36 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a2819 0%, #14462e 50%, #1a6b42 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle at 20px 20px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="max-w-6xl mx-auto px-4 relative">
          <span className="inline-block text-green-400 text-sm tracking-widest mb-5 border border-green-700 px-3 py-1 rounded-full">
            千葉県袖ケ浦市・富津市
          </span>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            地域の健康を<br />
            <span className="text-green-400">支え続けて</span>30年
          </h1>
          <p className="text-green-200 text-lg max-w-lg leading-relaxed mb-10">
            国家資格を持つ専門家たちが、4院体制で地域の皆さまの健康をサポートしています。
            鍼灸・整骨から美容鍼まで、一人ひとりに合わせた施術を提供します。
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="#clinics"
              className="bg-green-500 hover:bg-green-400 text-white font-semibold px-8 py-3 rounded-full transition"
            >
              グループ院を見る
            </a>
            <a
              href="#about"
              className="border border-green-500 text-green-300 hover:bg-green-900/50 font-semibold px-8 py-3 rounded-full transition"
            >
              会社概要
            </a>
          </div>
        </div>
      </section>

      {/* ===== Stats Bar ===== */}
      <section className="bg-green-800 text-white py-10">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { num: '30', unit: '年', label: '創業からの歴史' },
            { num: '4', unit: '院', label: 'グループ院' },
            { num: '29', unit: '名', label: 'スタッフ数' },
            { num: '国家', unit: '資格', label: '全施術者取得' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-bold text-green-300">
                {s.num}
                <span className="text-lg">{s.unit}</span>
              </p>
              <p className="text-sm text-green-200 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Features ===== */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-green-900 mb-2">イトーメディカルケアの強み</h2>
            <p className="text-gray-400 text-xs tracking-widest">OUR STRENGTHS</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🏅',
                title: '国家資格保持スタッフ',
                desc: '柔道整復師・はり師・きゅう師・マッサージ師など、厚生労働省認定の国家資格保持者が施術にあたります。',
              },
              {
                icon: '🌿',
                title: 'オーダーメイドの施術',
                desc: 'カウンセリングを大切にし、患者様の症状・体質・生活スタイルに合わせた施術プランをご提案します。',
              },
              {
                icon: '🏥',
                title: '4院で地域密着サポート',
                desc: '袖ケ浦市・富津市の4院が連携。治療院から美容鍼サロンまで、あらゆるニーズにお応えします。',
              },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-lg text-green-900 mb-3">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Clinics ===== */}
      <section id="clinics" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-green-900 mb-2">グループ院一覧</h2>
            <p className="text-gray-400 text-xs tracking-widest">OUR CLINICS</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {clinics.map((clinic) => (
              <div
                key={clinic.id}
                className="rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div
                  className="p-8 text-white"
                  style={{ background: `linear-gradient(135deg, ${clinic.bgFrom} 0%, ${clinic.bgTo} 100%)` }}
                >
                  <p className="text-[10px] opacity-50 tracking-widest mb-2">{clinic.nameEn}</p>
                  <span className="text-xs bg-white/15 px-2 py-0.5 rounded-full mb-3 inline-block">
                    {clinic.subtitle}
                  </span>
                  <h3 className="text-xl font-bold mb-3">{clinic.name}</h3>
                  <div className="flex flex-wrap gap-1">
                    {clinic.services.map((s) => (
                      <span key={s} className="text-xs bg-white/15 border border-white/20 px-2 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-6 bg-white">
                  <p className="text-gray-600 text-sm leading-relaxed mb-4">{clinic.description}</p>
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-5">
                    <MapPin size={11} />
                    <span>{clinic.location}</span>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      href={`/site/${clinic.id}`}
                      className="flex-1 text-center bg-green-900 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-green-800 transition"
                    >
                      詳細を見る
                    </Link>
                    <a
                      href={clinic.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-green-800 border border-green-800 py-2.5 px-4 rounded-lg text-sm hover:bg-green-50 transition"
                    >
                      公式サイト <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Company Info ===== */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-green-900 mb-2">会社概要</h2>
            <p className="text-gray-400 text-xs tracking-widest">COMPANY PROFILE</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {[
                  ['会社名', '有限会社イトーメディカルケア'],
                  ['代表者', '伊藤 啓'],
                  ['設立', '1995年11月'],
                  ['資本金', '5,000,000円'],
                  ['従業員数', '約26〜29名'],
                  ['所在地', '千葉県袖ケ浦市野里1229番地'],
                  ['事業内容', '鍼灸整骨院の経営・訪問リハビリマッサージ'],
                  ['対応エリア', '千葉県袖ケ浦市・木更津市・富津市'],
                  [
                    'グループ院',
                    'イトー整骨院 / ストレッチ鍼灸イトー整骨院 / SANRI鍼灸整骨院 / Hari-na',
                  ],
                ].map(([label, value], i) => (
                  <tr
                    key={label}
                    className={`${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'} border-b border-gray-100 last:border-0`}
                  >
                    <td className="py-4 px-6 font-semibold text-green-900 w-1/3">{label}</td>
                    <td className="py-4 px-6 text-gray-600">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-green-950 text-white py-14">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold tracking-tight">IMC</div>
                <div className="leading-tight">
                  <p className="text-xs text-green-400">有限会社</p>
                  <p className="font-bold text-lg">イトーメディカルケア</p>
                </div>
              </div>
              <p className="text-green-300 text-sm leading-relaxed">
                千葉県袖ケ浦市野里1229番地
                <br />
                1995年創業 ／ 代表：伊藤 啓
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-green-400 mb-3">グループ院</p>
              <ul className="space-y-2">
                {clinics.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/site/${c.id}`}
                      className="text-sm text-green-200 hover:text-white transition flex items-center gap-2"
                    >
                      <span className="w-1 h-1 bg-green-500 rounded-full" />
                      {c.name}
                      <span className="text-green-500 text-xs">（{c.subtitle}）</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-green-800 pt-6 text-center">
            <p className="text-green-600 text-xs">
              © 2024 有限会社イトーメディカルケア. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
