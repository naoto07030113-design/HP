import { useNavigate } from 'react-router-dom'
import { industries } from '../data/industries'

const steps = [
  { num: '01', icon: '🏢', title: '業種を選ぶ', desc: '12種類の業種からワンクリックで選択。あなたのビジネスに合った設計に自動最適化されます。' },
  { num: '02', icon: '✏️', title: '情報を入力', desc: '店名・電話番号・サービス内容など。フォームに沿って入力するだけ。コーディング知識は一切不要。' },
  { num: '03', icon: '⬇️', title: 'HTMLをダウンロード', desc: '入力完了後、完成したHTMLファイルを即ダウンロード。そのままサーバーにアップロードするだけ。' },
]

const features = [
  { icon: '⚡', title: '最速5分で完成', desc: '複雑な設定なし。テンプレート選択から完成まで最短5分。今すぐビジネスを始められます。' },
  { icon: '🎨', title: 'プロ品質のデザイン', desc: '6種類のカラーテーマ、整ったタイポグラフィ、レスポンシブ対応。素人感のないサイトが完成。' },
  { icon: '📱', title: 'スマホ完全対応', desc: '生成されたサイトはすべてモバイルファーストで設計。スマートフォンでも美しく表示されます。' },
  { icon: '🔒', title: '完全ローカル動作', desc: '入力データはブラウザ内のみで処理。外部サーバーに情報が送信されないため、安心してご利用いただけます。' },
  { icon: '💾', title: '自己完結HTMLファイル', desc: 'ダウンロードしたHTMLはひとつのファイルで完結。外部依存なし、どんなホスティングでも動作。' },
  { icon: '🌐', title: '12業種に対応', desc: '医療・飲食・美容・不動産・ITなど多様な業種に最適化されたコンテンツとデザインを自動生成。' },
]

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌐</span>
            <span className="font-black text-slate-900 text-lg tracking-tight">HP Generator</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#how" className="text-slate-500 hover:text-slate-900 font-medium text-sm transition-colors">使い方</a>
            <a href="#industries" className="text-slate-500 hover:text-slate-900 font-medium text-sm transition-colors">業種対応</a>
            <a href="#features" className="text-slate-500 hover:text-slate-900 font-medium text-sm transition-colors">機能</a>
          </div>
          <button
            onClick={() => navigate('/create')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            無料で作成を開始 →
          </button>
        </nav>
      </header>

      {/* HERO */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-100 rounded-full opacity-40 blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-100 rounded-full opacity-40 blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-sm font-bold mb-8 border border-indigo-100">
              <span>✨</span>
              <span>コーディング不要・無料・即ダウンロード</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight mb-6">
              プロ品質の<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">ホームページ</span>を<br />
              数分で作成
            </h1>

            <p className="text-lg md:text-xl text-slate-500 leading-relaxed mb-10 max-w-2xl mx-auto">
              業種を選んで、情報を入力するだけ。<br className="hidden md:block" />
              デザイナー品質のWebサイトがHTMLファイルとして完成します。
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button
                onClick={() => navigate('/create')}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-full font-black text-lg transition-all hover:shadow-2xl hover:-translate-y-1 shadow-indigo-200 shadow-xl"
              >
                今すぐ無料で作成 →
              </button>
              <a
                href="#how"
                className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 px-8 py-4 rounded-full font-bold text-lg transition-colors text-center"
              >
                使い方を見る
              </a>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 flex-wrap">
              {[
                { value: '12', label: '業種対応' },
                { value: '6', label: 'カラーテーマ' },
                { value: '5分', label: '最短完成' },
                { value: '無料', label: '完全無料' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-2xl font-black text-indigo-600">{s.value}</div>
                  <div className="text-xs text-slate-400 font-medium mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mock preview */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white">
              {/* Browser chrome */}
              <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-white rounded-md h-7 flex items-center px-3">
                  <span className="text-slate-400 text-xs">🔒 yoursite.com</span>
                </div>
              </div>
              {/* Fake website preview */}
              <div className="bg-gradient-to-br from-indigo-900 via-indigo-700 to-purple-600 h-48 flex items-center justify-center relative overflow-hidden">
                <div className="text-white/5 text-[120px] absolute right-4 top-1/2 -translate-y-1/2 leading-none font-black">🏢</div>
                <div className="text-center relative z-10 px-8">
                  <div className="text-white/70 text-xs mb-2 tracking-widest font-bold">IT・システム開発</div>
                  <div className="text-white font-black text-2xl md:text-3xl mb-2">株式会社テックソリューション</div>
                  <div className="text-white/75 text-sm">テクノロジーで、ビジネスの未来を切り開く</div>
                </div>
              </div>
              <div className="bg-indigo-50 px-8 py-6">
                <div className="grid grid-cols-3 gap-4">
                  {['🌐 Web開発', '⚙️ システム構築', '📊 DXコンサル'].map(s => (
                    <div key={s} className="bg-white rounded-xl p-4 text-center shadow-sm">
                      <div className="text-lg mb-1">{s.split(' ')[0]}</div>
                      <div className="text-xs text-slate-500 font-medium">{s.split(' ')[1]}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-center text-slate-400 text-sm mt-4">↑ 生成されるサイトのサンプル</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-indigo-100 text-indigo-600 text-xs font-black px-4 py-1.5 rounded-full mb-4 tracking-widest">HOW IT WORKS</div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">たった3ステップで完成</h2>
            <p className="text-slate-500 mt-4 text-lg">難しい操作は一切なし。誰でも簡単にプロ品質のサイトが作れます。</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-full w-8 border-t-2 border-dashed border-indigo-200 -translate-y-0.5 z-10" style={{ width: 'calc(100% - 5rem)', left: '80%' }} />
                )}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 h-full">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-xl">
                      {s.icon}
                    </div>
                    <span className="text-5xl font-black text-slate-100">{s.num}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-3">{s.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <button
              onClick={() => navigate('/create')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-full font-black text-lg transition-all hover:shadow-xl hover:-translate-y-0.5"
            >
              今すぐ作成を始める →
            </button>
          </div>
        </div>
      </section>

      {/* INDUSTRY SHOWCASE */}
      <section id="industries" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-emerald-100 text-emerald-600 text-xs font-black px-4 py-1.5 rounded-full mb-4 tracking-widest">INDUSTRIES</div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">あらゆる業種に対応</h2>
            <p className="text-slate-500 mt-4 text-lg">各業種に最適化されたコンテンツ・デザインを自動生成します。</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {industries.map(ind => (
              <button
                key={ind.id}
                onClick={() => navigate('/create')}
                className="group bg-white border-2 border-slate-100 hover:border-indigo-300 rounded-2xl p-5 text-left transition-all hover:shadow-lg hover:-translate-y-1"
                style={{ '--ind-color': ind.color }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3 transition-transform group-hover:scale-110"
                  style={{ background: ind.bgColor }}
                >
                  {ind.icon}
                </div>
                <div className="font-bold text-slate-800 text-sm leading-tight">{ind.name}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-purple-100 text-purple-600 text-xs font-black px-4 py-1.5 rounded-full mb-4 tracking-widest">FEATURES</div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">なぜ選ばれるのか</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-7 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-black text-slate-900 mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-6 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-5xl mb-6">🚀</div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
            今すぐサイトを<br />作り始めよう
          </h2>
          <p className="text-indigo-200 text-lg mb-10 leading-relaxed">
            登録不要・完全無料。業種を選んで情報を入力するだけで、<br className="hidden md:block" />
            プロ品質のホームページがすぐに完成します。
          </p>
          <button
            onClick={() => navigate('/create')}
            className="bg-white text-indigo-700 px-12 py-5 rounded-full font-black text-xl transition-all hover:shadow-2xl hover:-translate-y-1 shadow-xl"
          >
            無料で作成を開始 →
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌐</span>
            <span className="font-black text-white">HP Generator</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} HP Generator. 無料で使えるHP自動生成ツール.</p>
        </div>
      </footer>
    </div>
  )
}
