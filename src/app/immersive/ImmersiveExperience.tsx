'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { scenes } from './scenes'
import styles from './immersive.module.css'

export default function ImmersiveExperience() {
  const stageRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const sceneRefs = useRef<(HTMLElement | null)[]>([])

  const [entered, setEntered] = useState(false)
  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(0)
  const [sound, setSound] = useState(false)

  // パーティクル描画ループから参照する最新のactive
  const activeRef = useRef(0)
  useEffect(() => {
    activeRef.current = active
  }, [active])

  // ルートのCSS変数（光の色）を現在シーンに同期
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (rootRef.current) {
      rootRef.current.style.setProperty('--glow', scenes[active].glow)
    }
  }, [active])

  // どのシーンが画面中央に来たかを監視
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const i = sceneRefs.current.indexOf(e.target as HTMLElement)
          if (e.isIntersecting && i !== -1) {
            e.target.classList.add(styles.active)
            setActive(i)
          } else {
            e.target.classList.remove(styles.active)
          }
        })
      },
      { root: stage, threshold: 0.55 }
    )
    sceneRefs.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [])

  // スクロール進行バー + 背景のパララックス
  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const max = stage.scrollHeight - stage.clientHeight
        setProgress(max > 0 ? stage.scrollTop / max : 0)
        const vh = stage.clientHeight
        sceneRefs.current.forEach((el) => {
          if (!el) return
          const bg = el.querySelector<HTMLElement>(`.${styles.bg}`)
          if (!bg) return
          const rel = (el.offsetTop - stage.scrollTop) / vh // -1..1付近
          bg.style.transform = `scale(1.16) translateY(${rel * -6}%)`
        })
      })
    }
    stage.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      stage.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  // カーソル追従の光
  useEffect(() => {
    const el = cursorRef.current
    if (!el) return
    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let cx = x
    let cy = y
    let raf = 0
    const move = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
    }
    const loop = () => {
      cx += (x - cx) * 0.12
      cy += (y - cy) * 0.12
      el.style.transform = `translate(${cx}px, ${cy}px)`
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('pointermove', move)
    loop()
    return () => {
      window.removeEventListener('pointermove', move)
      cancelAnimationFrame(raf)
    }
  }, [])

  // 光の粒（パーティクル）
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let w = 0
    let h = 0
    let dpr = Math.min(window.devicePixelRatio || 1, 2)
    const resize = () => {
      w = window.innerWidth
      h = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const count = Math.min(90, Math.floor(window.innerWidth / 14))
    type P = { x: number; y: number; r: number; vy: number; vx: number; a: number; tw: number }
    const ps: P[] = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.8 + 0.4,
      vy: -(Math.random() * 0.32 + 0.06),
      vx: (Math.random() - 0.5) * 0.18,
      a: Math.random() * 0.6 + 0.2,
      tw: Math.random() * Math.PI * 2,
    }))

    let raf = 0
    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      const glow = scenes[activeRef.current].glow
      for (const p of ps) {
        p.y += p.vy
        p.x += p.vx
        p.tw += 0.04
        if (p.y < -10) {
          p.y = h + 10
          p.x = Math.random() * w
        }
        if (p.x < -10) p.x = w + 10
        if (p.x > w + 10) p.x = -10
        const a = p.a * (0.55 + 0.45 * Math.sin(p.tw))
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${glow}, ${a})`
        ctx.shadowColor = `rgba(${glow}, ${a})`
        ctx.shadowBlur = 8
        ctx.fill()
      }
      ctx.shadowBlur = 0
      raf = requestAnimationFrame(draw)
    }
    if (!reduce) draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(raf)
    }
  }, [])

  // アンビエント音（WebAudioで生成する静かなドローン）
  const audioRef = useRef<{ ctx: AudioContext; master: GainNode } | null>(null)
  useEffect(() => {
    if (!sound) {
      if (audioRef.current) {
        const { ctx, master } = audioRef.current
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6)
        setTimeout(() => ctx.close(), 800)
        audioRef.current = null
      }
      return
    }
    const Ctx = window.AudioContext || (window as any).webkitAudioContext
    if (!Ctx) return
    const ctx: AudioContext = new Ctx()
    const master = ctx.createGain()
    master.gain.value = 0
    master.connect(ctx.destination)
    master.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 1.5)

    // 重なり合うサイン波で温かい持続音をつくる
    const freqs = [55, 82.4, 110, 164.8]
    const oscs = freqs.map((f, i) => {
      const o = ctx.createOscillator()
      o.type = i % 2 === 0 ? 'sine' : 'triangle'
      o.frequency.value = f
      const g = ctx.createGain()
      g.gain.value = 0.25 / (i + 1)
      // ゆらぎ
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.05 + i * 0.02
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = g.gain.value * 0.6
      lfo.connect(lfoGain).connect(g.gain)
      o.connect(g).connect(master)
      o.start()
      lfo.start()
      return o
    })

    audioRef.current = { ctx, master }
    return () => {
      oscs.forEach((o) => {
        try {
          o.stop()
        } catch {}
      })
    }
  }, [sound])

  const goTo = useCallback((i: number) => {
    const el = sceneRefs.current[i]
    const stage = stageRef.current
    if (el && stage) stage.scrollTo({ top: el.offsetTop, behavior: 'smooth' })
  }, [])

  const enter = useCallback(() => {
    setEntered(true)
    setSound(true)
  }, [])

  return (
    <div ref={rootRef} className={styles.root} style={{ ['--glow' as any]: scenes[0].glow }}>
      {/* イントロ */}
      <div className={`${styles.intro} ${entered ? styles.introHidden : ''}`}>
        <p className={styles.introKicker}>IMMERSIVE DIGITAL ART</p>
        <h1 className={styles.introTitle}>夜に灯る家</h1>
        <p className={styles.introSub}>
          黄昏の邸宅を、光と影でたどる。スクロールして、4つの情景を旅してください。
        </p>
        <button className={styles.enter} onClick={enter}>
          ENTER ▸
        </button>
      </div>

      {/* 進行バー */}
      <div className={styles.progress} style={{ width: `${progress * 100}%` }} />

      {/* 固定UI */}
      <div className={styles.brand}>
        <b>HIKARI</b>&nbsp;&nbsp;NO&nbsp;IE
      </div>
      <button
        className={styles.sound}
        onClick={() => setSound((s) => !s)}
        aria-pressed={sound}
      >
        <span className={`${styles.eq} ${sound ? styles.eqOn : ''}`}>
          <i /><i /><i /><i />
        </span>
        {sound ? 'SOUND ON' : 'SOUND OFF'}
      </button>

      {/* ドットナビ */}
      <nav className={styles.nav} aria-label="シーン">
        {scenes.map((s, i) => (
          <button
            key={s.id}
            className={`${styles.dot} ${i === active ? styles.dotActive : ''}`}
            onClick={() => goTo(i)}
            aria-label={s.title}
            aria-current={i === active}
          />
        ))}
      </nav>

      {/* エフェクトレイヤー */}
      <canvas ref={canvasRef} className={styles.particles} aria-hidden />
      <div ref={cursorRef} className={styles.cursorGlow} aria-hidden />
      <div className={styles.grain} aria-hidden />

      <div className={styles.scrollHint} style={{ opacity: active === scenes.length - 1 ? 0 : 1 }}>
        SCROLL
        <span />
      </div>

      {/* シーン本体 */}
      <div ref={stageRef} className={styles.stage}>
        {scenes.map((s, i) => (
          <section
            key={s.id}
            ref={(el) => {
              sceneRefs.current[i] = el
            }}
            className={styles.scene}
            style={{ ['--glow' as any]: s.glow }}
          >
            <div className={styles.bg} style={{ backgroundImage: `url(${s.image})` }} />
            <div className={styles.vignette} />
            <div className={styles.copy}>
              <p className={styles.kicker}>{s.kicker}</p>
              <h2 className={styles.title}>{s.title}</h2>
              <p className={styles.body}>{s.body}</p>
            </div>
            <div className={styles.indexTag}>{s.index}</div>
          </section>
        ))}
      </div>
    </div>
  )
}
