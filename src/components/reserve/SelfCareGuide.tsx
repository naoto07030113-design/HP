'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Play, Pause, RotateCcw, SkipForward, Sparkles, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * 予約完了後に案内する「来院までの1分セルフケア」。
 * 20秒 × 3種類を順に再生する。手順は文章で示し、イラストは使わない。
 * 医療行為ではなく日常のセルフケアの範囲にとどめ、痛むときは中止するよう明記する。
 */

type Care = {
  id: string
  title: string
  lead: string
  hint: string
  seconds: number
}

const CARES: Care[] = [
  {
    id: 'shoulder',
    title: '肩まわし',
    lead: '両肩をゆっくり大きく回します',
    hint: '肩甲骨を寄せるように、後ろ回しでゆっくりと',
    seconds: 20,
  },
  {
    id: 'neck',
    title: '首のストレッチ',
    lead: '首を左右にゆっくり倒します',
    hint: '反対の肩は下げたまま、痛くない範囲で',
    seconds: 20,
  },
  {
    id: 'breath',
    title: '深呼吸',
    lead: '広がりに合わせて息を吸って、吐きます',
    hint: '鼻から4秒吸って、口から6秒かけて吐く',
    seconds: 20,
  },
]

const TOTAL = CARES.reduce((s, c) => s + c.seconds, 0)

// ── 本体 ────────────────────────────────────────────────
export function SelfCareGuide() {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const [remaining, setRemaining] = useState(CARES[0].seconds)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const care = CARES[index]

  const clear = useCallback(() => {
    if (timer.current) { clearInterval(timer.current); timer.current = null }
  }, [])

  useEffect(() => clear, [clear])

  useEffect(() => {
    if (!running) { clear(); return }
    timer.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev > 0.1) return Math.max(0, prev - 0.1)
        // 次の種目へ。最後まで終わったら完了状態にする
        setIndex((i) => {
          if (i + 1 < CARES.length) {
            setRemaining(CARES[i + 1].seconds)
            return i + 1
          }
          setRunning(false)
          setDone(true)
          return i
        })
        return 0
      })
    }, 100)
    return clear
  }, [running, clear])

  function start() { setDone(false); setRunning(true) }
  function reset() {
    clear(); setRunning(false); setDone(false); setIndex(0); setRemaining(CARES[0].seconds)
  }
  function skip() {
    if (index + 1 < CARES.length) { setIndex(index + 1); setRemaining(CARES[index + 1].seconds) }
    else { setRunning(false); setDone(true); setRemaining(0) }
  }

  const elapsed = CARES.slice(0, index).reduce((s, c) => s + c.seconds, 0) + (care.seconds - remaining)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rs-press flex items-center gap-3 bg-white/72 backdrop-blur-md rounded-2xl border border-emerald-100 shadow-sm p-4 text-left hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5"
      >
        <span className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-emerald-700" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-bold text-emerald-950">来院までの1分セルフケア</span>
          <span className="block text-xs text-stone-500 mt-0.5">肩まわし・首・深呼吸を順番にご案内します</span>
        </span>
        <ChevronDown className="w-5 h-5 text-stone-400 flex-shrink-0" />
      </button>
    )
  }

  return (
    <section className="bg-white/72 backdrop-blur-md rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-sky-400 to-amber-300" />
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-bold text-emerald-950">来院までの1分セルフケア</h3>
          <button
            onClick={() => { reset(); setOpen(false) }}
            className="text-xs text-stone-500 hover:text-stone-800 underline underline-offset-2"
          >
            閉じる
          </button>
        </div>

        {done ? (
          <div className="text-center py-6 space-y-2">
            <p className="text-lg font-black text-emerald-900">おつかれさまでした</p>
            <p className="text-sm text-stone-500">ご来院の際は、気になるところをお気軽にお伝えください</p>
            <button
              onClick={reset}
              className="rs-press inline-flex items-center gap-1.5 mt-2 px-4 py-2 rounded-xl border border-emerald-200 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
            >
              <RotateCcw className="w-4 h-4" />
              もう一度
            </button>
          </div>
        ) : (
          <>
            {/* 残り時間と手順（イラストは置かず、文字で読ませる） */}
            <div className="text-center py-1" aria-live="polite">
              <p className="text-xs font-bold text-emerald-700 tracking-[0.2em]">
                {index + 1} / {CARES.length}
              </p>
              <p className="text-xl font-black text-emerald-950 mt-1">{care.title}</p>
              <p className="text-sm text-stone-600 mt-1.5 leading-snug">{care.lead}</p>
              <p
                className={cn(
                  'text-6xl font-black tabular-nums mt-3 leading-none transition-colors',
                  remaining <= 3 ? 'text-amber-600' : 'text-emerald-800',
                )}
              >
                {Math.ceil(remaining)}
                <span className="text-base font-bold text-stone-400 ml-1.5">秒</span>
              </p>
            </div>

            <p className="text-xs text-stone-600 bg-emerald-50/70 rounded-xl px-3 py-2.5 text-center leading-relaxed">
              {care.hint}
            </p>

            {/* 全体の進み具合 */}
            <div className="h-1.5 rounded-full bg-stone-200/70 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-[width] duration-100 ease-linear"
                style={{ width: `${(elapsed / TOTAL) * 100}%` }}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => (running ? setRunning(false) : start())}
                className="rs-press flex-1 h-11 rounded-xl bg-emerald-800 text-white font-bold hover:bg-emerald-700 flex items-center justify-center gap-2"
              >
                {running ? <><Pause className="w-4 h-4" />一時停止</> : <><Play className="w-4 h-4" />{remaining === care.seconds && index === 0 ? 'はじめる' : '再開する'}</>}
              </button>
              <button
                onClick={skip}
                className="rs-press h-11 px-4 rounded-xl border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 flex items-center gap-1.5"
              >
                <SkipForward className="w-4 h-4" />
                次へ
              </button>
              <button
                onClick={reset}
                aria-label="最初からやり直す"
                className="rs-press h-11 w-11 rounded-xl border border-stone-200 text-stone-500 hover:bg-stone-50 flex items-center justify-center"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-stone-400 leading-relaxed">
              痛みが出る場合はすぐに中止してください。強い痛みやしびれがあるときは、無理をせず来院時にご相談ください。
            </p>
          </>
        )}
      </div>
    </section>
  )
}
