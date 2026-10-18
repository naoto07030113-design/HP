import { AnimatePresence, motion } from 'framer-motion'
import ProductImage from './ProductImage.jsx'
import AnimatedPrice from './AnimatedPrice.jsx'
import { MILKS, SIZES, SWEETNESS, TOPPINGS } from '../data/menu.js'
import { unitPrice, yen } from '../lib/order.js'

function Segmented({ name, items, value, onChange, renderSub }) {
  return (
    <div role="radiogroup" aria-label={name} className="grid gap-1.5 rounded-2xl bg-white/55 p-1.5" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((it) => {
        const active = it.id === value
        return (
          <button
            key={it.id}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(it.id)}
            className="relative flex min-h-[52px] flex-col items-center justify-center rounded-xl px-1 py-2 text-sm"
          >
            {active && (
              <motion.span
                layoutId={`seg-${name}`}
                className="absolute inset-0 rounded-xl bg-matcha-900 shadow-soft"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className={`relative font-medium transition-colors ${active ? 'text-lime-soft' : 'text-matcha-950'}`}>{it.label}</span>
            {renderSub && (
              <span className={`tabular relative mt-0.5 text-[10px] transition-colors ${active ? 'text-lime-soft/80' : 'text-matcha-900/55'}`}>{renderSub(it)}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function Group({ title, en, children, hint }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="text-[13px] font-bold tracking-[0.12em] text-matcha-950">
          {title}
          <span className="ml-2 font-caps text-[10px] font-normal tracking-[0.25em] text-matcha-900/50">{en}</span>
        </h3>
        {hint && <span className="text-[11px] text-matcha-900/55">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

const deltaLabel = (d) => (d === 0 ? '±0' : d > 0 ? `+${d}` : `${d}`)

export function ActionRow({ qty, onQty, onAdd, total, accent }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center rounded-full bg-white/80 p-1 ring-1 ring-white">
        <button
          onClick={() => onQty(Math.max(1, qty - 1))}
          disabled={qty <= 1}
          aria-label="数量を減らす"
          className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-matcha-900 transition hover:bg-white disabled:opacity-30"
        >
          −
        </button>
        <span className="tabular w-6 text-center text-base font-bold" aria-live="polite">{qty}</span>
        <button
          onClick={() => onQty(Math.min(20, qty + 1))}
          disabled={qty >= 20}
          aria-label="数量を増やす"
          className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-matcha-900 transition hover:bg-white disabled:opacity-30"
        >
          +
        </button>
      </div>
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onAdd}
        className="relative flex h-14 min-w-0 flex-1 items-center justify-between gap-2 overflow-hidden rounded-full bg-matcha-900 pl-5 pr-2 text-lime-soft shadow-soft"
      >
        <span className="truncate text-[15px] font-bold tracking-[0.06em]">カートに追加</span>
        <motion.span
          animate={{ backgroundColor: accent }}
          className="flex h-10 shrink-0 items-center rounded-full px-3.5 font-display text-lg text-matcha-950"
        >
          <AnimatedPrice value={total} />
        </motion.span>
      </motion.button>
    </div>
  )
}

export default function Customizer({ product, selection, onChange, qty, onQty, onAdd, theme }) {
  const o = product.options
  const price = unitPrice(product, selection)
  const set = (patch) => onChange({ ...selection, ...patch })
  const toggleTopping = (id) =>
    set({ toppings: selection.toppings.includes(id) ? selection.toppings.filter((t) => t !== id) : [...selection.toppings, id] })

  return (
    <div className="space-y-6">
      {o.size && (
        <Group title="サイズ" en="SIZE">
          <Segmented
            name="size"
            items={SIZES}
            value={selection.size}
            onChange={(size) => set({ size })}
            renderSub={(s) => `${s.note} · ${deltaLabel(s.delta)}`}
          />
        </Group>
      )}

      {o.sweetness && (
        <Group title="甘さ" en="SWEETNESS">
          <Segmented
            name="sweetness"
            items={SWEETNESS}
            value={selection.sweetness}
            onChange={(sweetness) => set({ sweetness })}
            renderSub={(s) => '●'.repeat(s.level) + '○'.repeat(3 - s.level)}
          />
        </Group>
      )}

      {o.milk && (
        <Group title="ミルク" en="MILK">
          <Segmented
            name="milk"
            items={MILKS}
            value={selection.milk}
            onChange={(milk) => set({ milk })}
            renderSub={(m) => deltaLabel(m.delta)}
          />
        </Group>
      )}

      {o.toppings.length > 0 && (
        <Group title="トッピング" en="TOPPING" hint="複数選択できます">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {o.toppings.map((id) => {
              const t = TOPPINGS[id]
              const on = selection.toppings.includes(id)
              return (
                <motion.button
                  key={id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleTopping(id)}
                  aria-pressed={on}
                  className={`relative flex flex-col items-center rounded-2xl p-2 pb-2.5 text-center transition-colors ${on ? 'bg-white shadow-card ring-2 ring-matcha-800' : 'bg-white/55 ring-1 ring-white/60 hover:bg-white/75'}`}
                >
                  <ProductImage src={t.image} alt={t.label} className="aspect-square w-full rounded-xl" />
                  <span className="mt-1.5 text-[12px] font-medium leading-tight text-matcha-950">{t.label}</span>
                  <span className="tabular text-[11px] text-matcha-900/60">+{yen(t.delta)}</span>
                  <AnimatePresence>
                    {on && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-matcha-800 text-white"
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden><path d="M5 12l5 5 9-10" /></svg>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              )
            })}
          </div>
          {o.toppings.some((id) => !TOPPINGS[id].image) && (
            <p className="mt-2 text-[11px] leading-relaxed text-matcha-900/60">
              「仮素材」表示の項目は写真素材が未提供のため、実物写真の代わりに仮の表示をしています。
            </p>
          )}
        </Group>
      )}

      <div className="hidden lg:block">
        <ActionRow qty={qty} onQty={onQty} onAdd={onAdd} total={price * qty} accent={theme.blob} />
      </div>
    </div>
  )
}
