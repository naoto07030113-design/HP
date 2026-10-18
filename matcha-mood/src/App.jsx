import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Header from './components/Header.jsx'
import HeroGallery from './components/HeroGallery.jsx'
import Customizer, { ActionRow } from './components/Customizer.jsx'
import CartDrawer from './components/CartDrawer.jsx'
import Checkout from './components/Checkout.jsx'
import Toast from './components/Toast.jsx'
import FlyToCart from './components/FlyToCart.jsx'
import ProductImage from './components/ProductImage.jsx'
import Logo from './components/Logo.jsx'
import { CATEGORIES, PRODUCTS } from './data/menu.js'
import { defaultSelection, lineKey, unitPrice, yen } from './lib/order.js'

const STORAGE_KEY = 'matcha-mood-cart-v1'

function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(raw) ? raw.filter((l) => PRODUCTS.some((p) => p.id === l.productId) && l.qty > 0) : []
  } catch {
    return []
  }
}

export default function App() {
  const [[index, direction], setPage] = useState([0, 0])
  const [selections, setSelections] = useState(() => Object.fromEntries(PRODUCTS.map((p) => [p.id, defaultSelection(p)])))
  const [qty, setQty] = useState(1)
  const [cart, setCart] = useState(loadCart)
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [flights, setFlights] = useState([])
  const [bump, setBump] = useState(0)

  const imageRef = useRef(null)
  const cartRef = useRef(null)
  const railRef = useRef(null)
  const topRef = useRef(null)

  const product = PRODUCTS[index]
  const selection = selections[product.id]
  const theme = product.theme

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
    } catch {
      /* ストレージ不可の環境ではメモリのみで動作 */
    }
  }, [cart])

  const go = useCallback((next) => {
    setPage(([cur]) => {
      const n = (next + PRODUCTS.length) % PRODUCTS.length
      if (n === cur) return [cur, 0]
      // ループ端を跨ぐ場合も自然な方向にスライド
      const forward = (n - cur + PRODUCTS.length) % PRODUCTS.length <= PRODUCTS.length / 2
      return [n, forward ? 1 : -1]
    })
    setQty(1)
  }, [])
  const next = useCallback(() => go(index + 1), [go, index])
  const prev = useCallback(() => go(index - 1), [go, index])

  // サムネイルレールの選択中アイテムを中央へ
  useEffect(() => {
    const rail = railRef.current
    const el = rail?.querySelector(`[data-id="${product.id}"]`)
    if (rail && el) rail.scrollTo({ left: el.offsetLeft - rail.clientWidth / 2 + el.clientWidth / 2, behavior: 'smooth' })
  }, [product.id])

  useEffect(() => {
    const onKey = (e) => {
      if (cartOpen || checkoutOpen) return
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, cartOpen, checkoutOpen])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(t)
  }, [toast])

  const lines = useMemo(
    () =>
      cart.map((l) => {
        const p = PRODUCTS.find((x) => x.id === l.productId)
        return { ...l, product: p, unit: unitPrice(p, l.selection) }
      }),
    [cart],
  )
  const total = lines.reduce((s, l) => s + l.unit * l.qty, 0)
  const count = lines.reduce((s, l) => s + l.qty, 0)

  const addToCart = () => {
    const key = lineKey(product.id, selection)
    setCart((c) => {
      const hit = c.find((l) => l.key === key)
      if (hit) return c.map((l) => (l.key === key ? { ...l, qty: Math.min(20, l.qty + qty) } : l))
      return [...c, { key, productId: product.id, selection: { ...selection, toppings: [...selection.toppings] }, qty }]
    })

    const from = imageRef.current?.getBoundingClientRect()
    const to = cartRef.current?.getBoundingClientRect()
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (from && to && !reduce) {
      setFlights((f) => [
        ...f,
        {
          id: Date.now() + Math.random(),
          image: product.image,
          from: { x: from.left + from.width / 2, y: from.top + from.height / 2 },
          to: { x: to.left + to.width / 2, y: to.top + to.height / 2 },
        },
      ])
    } else {
      setBump((b) => b + 1)
    }
    setToast({ id: Date.now(), title: `${product.ja} × ${qty}`, image: product.image })
    setQty(1)
  }

  const landFlight = (id) => {
    setFlights((f) => f.filter((x) => x.id !== id))
    setBump((b) => b + 1)
  }

  const selectFromMenu = (i) => {
    go(i)
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-28 lg:pb-0" id="top">
      {/* 商品に合わせて変化する背景 */}
      <motion.div
        aria-hidden
        className="fixed inset-0 -z-10"
        animate={{ backgroundColor: theme.from }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
      >
        <motion.div
          className="absolute -right-[20%] -top-[10%] h-[70vh] w-[70vh] rounded-full blur-3xl"
          animate={{ backgroundColor: theme.to, scale: [1, 1.04, 1] }}
          transition={{ backgroundColor: { duration: 0.8 }, scale: { duration: 10, repeat: Infinity, ease: 'easeInOut' } }}
        />
        <motion.div
          className="absolute -bottom-[15%] -left-[15%] h-[55vh] w-[55vh] rounded-full opacity-70 blur-3xl"
          animate={{ backgroundColor: theme.blob }}
          transition={{ duration: 0.8 }}
        />
        <div className="absolute left-[8%] top-[38%] h-40 w-40 rounded-full bg-lime-soft/60 blur-2xl" />
      </motion.div>

      <Header ref={cartRef} count={count} bump={bump} onOpenCart={() => setCartOpen(true)} />

      <main ref={topRef} className="mx-auto max-w-6xl scroll-mt-16 px-4 pt-5 sm:px-6 lg:pt-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-3 flex items-center justify-between gap-4 lg:mb-4"
        >
          <p className="text-[13px] leading-relaxed tracking-[0.1em] text-matcha-950/80">
            抹茶で、ちょっといい一日を。
          </p>
          <p className="font-script text-2xl leading-none text-sakura-500">Better Days</p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14">
          <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <HeroGallery
              ref={imageRef}
              products={PRODUCTS}
              index={index}
              direction={direction}
              selection={selection}
              onPrev={prev}
              onNext={next}
              onSelectIndex={go}
            />
          </div>

          <div className="min-w-0 space-y-5">
            {/* カテゴリ + サムネイル */}
            <div className="rounded-[28px] bg-white/45 p-3 ring-1 ring-white/70 backdrop-blur-md">
              <div className="flex gap-1.5 px-1 pb-2" role="tablist" aria-label="カテゴリ">
                {CATEGORIES.map((c) => {
                  const active = product.category === c.id
                  return (
                    <button
                      key={c.id}
                      role="tab"
                      aria-selected={active}
                      onClick={() => !active && go(PRODUCTS.findIndex((p) => p.category === c.id))}
                      className="relative rounded-full px-4 py-2 text-sm"
                    >
                      {active && <motion.span layoutId="cat-pill" className="absolute inset-0 rounded-full bg-matcha-900" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                      <span className={`relative font-caps tracking-[0.18em] ${active ? 'text-lime-soft' : 'text-matcha-900'}`}>{c.label}</span>
                      <span className={`relative ml-1.5 text-[11px] ${active ? 'text-lime-soft/80' : 'text-matcha-900/55'}`}>{c.ja}</span>
                    </button>
                  )
                })}
              </div>
              <div ref={railRef} className="no-scrollbar relative flex snap-x gap-2 overflow-x-auto px-1 pb-1">
                {PRODUCTS.map((p, i) => {
                  const active = i === index
                  return (
                    <button
                      key={p.id}
                      data-id={p.id}
                      onClick={() => go(i)}
                      aria-label={`${p.ja} ${yen(p.price)}`}
                      aria-current={active}
                      className={`relative w-[84px] shrink-0 snap-center rounded-2xl p-1.5 text-left transition ${active ? 'bg-white shadow-card' : 'hover:bg-white/60'}`}
                    >
                      <ProductImage src={p.image} alt="" className={`aspect-[4/5] w-full rounded-xl transition ${active ? '' : 'opacity-80'}`} />
                      <p className="mt-1 truncate text-[11px] font-medium leading-tight">{p.ja}</p>
                      <p className="tabular text-[11px] text-matcha-900/60">{yen(p.price)}</p>
                      {active && <motion.span layoutId="rail-dot" className="absolute left-1/2 top-0.5 h-1 w-6 -translate-x-1/2 rounded-full bg-matcha-800" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* カスタマイズ */}
            <section aria-label="カスタマイズ" className="rounded-[28px] bg-white/45 p-5 ring-1 ring-white/70 backdrop-blur-md sm:p-6">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <p className="font-caps text-[10px] tracking-[0.3em] text-matcha-900/60">CUSTOMIZE</p>
                  <h2 className="font-display text-2xl text-matcha-950">あなた好みの一杯に</h2>
                </div>
                <button
                  onClick={() => setSelections((s) => ({ ...s, [product.id]: defaultSelection(product) }))}
                  className="rounded-full px-3 py-1.5 text-xs text-matcha-900/65 ring-1 ring-matcha-900/15 hover:bg-white"
                >
                  リセット
                </button>
              </div>
              <Customizer
                key={product.id}
                product={product}
                selection={selection}
                onChange={(sel) => setSelections((s) => ({ ...s, [product.id]: sel }))}
                qty={qty}
                onQty={setQty}
                onAdd={addToCart}
                theme={theme}
              />
            </section>
          </div>
        </div>

        {/* メニュー一覧（元デザインの構成） */}
        <section className="mt-16" aria-labelledby="menu-title">
          <div className="flex items-baseline gap-3">
            <h2 id="menu-title" className="font-display text-4xl text-matcha-950">MENU</h2>
            <span className="text-xs tracking-[0.2em] text-matcha-900/60">メニュー一覧</span>
          </div>
          {CATEGORIES.map((c) => (
            <div key={c.id} className="mt-6">
              <p className="mb-3 font-caps text-xs tracking-[0.3em] text-matcha-900/70">{c.label.toUpperCase()} · {c.ja}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {PRODUCTS.map((p, i) =>
                  p.category !== c.id ? null : (
                    <motion.button
                      key={p.id}
                      whileHover={{ y: -4 }}
                      onClick={() => selectFromMenu(i)}
                      className="group rounded-3xl bg-white/60 p-2.5 text-left ring-1 ring-white/70 backdrop-blur transition-shadow hover:shadow-card"
                    >
                      <div className="relative">
                        <ProductImage src={p.image} alt={p.ja} className="aspect-[4/5] w-full rounded-2xl" imgClassName="transition duration-500 group-hover:scale-105" />
                        {p.seasonal && <span className="absolute left-2 top-2 rounded-full bg-sakura-500 px-2 py-0.5 text-[10px] font-bold text-white">期間限定</span>}
                      </div>
                      <p className="mt-2 truncate font-display text-[15px] text-matcha-950">{p.name}</p>
                      <div className="flex items-baseline justify-between">
                        <p className="truncate text-[11px] text-matcha-900/65">{p.ja}</p>
                        <p className="tabular text-sm">{yen(p.price)}</p>
                      </div>
                    </motion.button>
                  ),
                )}
              </div>
            </div>
          ))}
        </section>

        <footer className="mt-16 border-t border-matcha-900/10 py-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <Logo />
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] text-matcha-950/80">
              <li className="flex items-center gap-1.5"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><path d="M5 20C5 11 11 5 20 4c0 9-6 15-15 16zM5 20l9-9" /></svg>国産抹茶使用</li>
              <li className="flex items-center gap-1.5"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" /></svg>テイクアウトOK</li>
              <li className="flex items-center gap-1.5"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><path d="M5 8h11v6a5 5 0 01-5 5h-1a5 5 0 01-5-5V8zM16 10h2a2 2 0 010 4h-2" /></svg>イートインスペースあり</li>
            </ul>
          </div>
          <p className="mt-6 text-[11px] leading-relaxed text-matcha-900/55">
            本サイトはモバイルオーダーのデモです。注文の送信・決済は行われません。表示価格は税込です。
            商品写真はメニューデザインから切り出した素材を使用しています。「仮素材」と表示された項目は写真が未提供のため仮の表示です。
          </p>
        </footer>
      </main>

      {/* モバイル用固定アクションバー */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-white/60 bg-white/70 px-4 pt-3 backdrop-blur-xl lg:hidden">
        <ActionRow qty={qty} onQty={setQty} onAdd={addToCart} total={unitPrice(product, selection) * qty} accent={theme.blob} />
      </div>

      <FlyToCart flights={flights} onDone={landFlight} />
      <Toast toast={toast} onClose={() => setToast(null)} onOpenCart={() => { setToast(null); setCartOpen(true) }} />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        lines={lines}
        total={total}
        count={count}
        onQty={(key, q) => setCart((c) => c.map((l) => (l.key === key ? { ...l, qty: q } : l)))}
        onRemove={(key) => setCart((c) => c.filter((l) => l.key !== key))}
        onClear={() => setCart([])}
        onCheckout={() => { setCartOpen(false); setCheckoutOpen(true) }}
      />
      <Checkout
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        lines={lines}
        total={total}
        onComplete={() => setCart([])}
        onFinish={() => go(0)}
      />
    </div>
  )
}
