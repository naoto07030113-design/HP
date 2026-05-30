import * as THREE from 'three'

function seededRng(seed) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function createMajolikaTileTexture(size = 512) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const tileCount = 4
  const ts = size / tileCount

  for (let ty = 0; ty < tileCount; ty++) {
    for (let tx = 0; tx < tileCount; tx++) {
      const px = tx * ts, py = ty * ts
      const cx = px + ts / 2, cy = py + ts / 2

      ctx.fillStyle = '#f2eedd'
      ctx.fillRect(px, py, ts, ts)

      const variant = (tx + ty) % 4

      if (variant === 0) {
        // Central rose motif
        ctx.strokeStyle = '#1c3d8a'
        ctx.lineWidth = 1.5
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2
          ctx.beginPath()
          ctx.moveTo(cx, cy)
          const px2 = cx + Math.cos(a) * ts * 0.32
          const py2 = cy + Math.sin(a) * ts * 0.32
          ctx.bezierCurveTo(
            cx + Math.cos(a + 0.4) * ts * 0.2, cy + Math.sin(a + 0.4) * ts * 0.2,
            px2 - Math.cos(a) * ts * 0.1, py2 - Math.sin(a) * ts * 0.1,
            px2, py2
          )
          ctx.stroke()
        }
        ctx.beginPath()
        ctx.arc(cx, cy, ts * 0.1, 0, Math.PI * 2)
        ctx.fillStyle = '#2a5fc4'
        ctx.fill()
      } else if (variant === 1) {
        // Cross/diamond
        ctx.fillStyle = '#c8e0f8'
        ctx.beginPath()
        ctx.moveTo(cx, py + 6)
        ctx.lineTo(px + ts - 6, cy)
        ctx.lineTo(cx, py + ts - 6)
        ctx.lineTo(px + 6, cy)
        ctx.closePath()
        ctx.fill()
        ctx.strokeStyle = '#1c3d8a'
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(cx, cy, ts * 0.12, 0, Math.PI * 2)
        ctx.fillStyle = '#1c3d8a'
        ctx.fill()
        const corners = [[px+8,py+8],[px+ts-8,py+8],[px+8,py+ts-8],[px+ts-8,py+ts-8]]
        corners.forEach(([cx2, cy2]) => {
          ctx.beginPath()
          ctx.arc(cx2, cy2, 4, 0, Math.PI * 2)
          ctx.fillStyle = '#2a5fc4'
          ctx.fill()
        })
      } else if (variant === 2) {
        // Fleur de lis style
        ctx.fillStyle = '#d8eaf8'
        ctx.beginPath()
        ctx.arc(cx, cy, ts * 0.28, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#1c3d8a'
        ctx.lineWidth = 1
        ctx.stroke()
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2 + Math.PI / 4
          ctx.beginPath()
          ctx.moveTo(cx + Math.cos(a) * ts * 0.28, cy + Math.sin(a) * ts * 0.28)
          ctx.lineTo(cx + Math.cos(a) * ts * 0.45, cy + Math.sin(a) * ts * 0.45)
          ctx.lineWidth = 2
          ctx.strokeStyle = '#2a5fc4'
          ctx.stroke()
        }
      } else {
        // Wave/scroll pattern
        ctx.strokeStyle = '#2a5fc4'
        ctx.lineWidth = 1.5
        for (let row = 0; row < 3; row++) {
          const ry = py + ts * 0.25 + row * ts * 0.25
          ctx.beginPath()
          ctx.moveTo(px + 4, ry)
          for (let xi = 0; xi < ts - 8; xi += 2) {
            ctx.lineTo(px + 4 + xi, ry + Math.sin((xi / (ts - 8)) * Math.PI * 2) * 6)
          }
          ctx.stroke()
        }
      }

      // Tile border
      ctx.strokeStyle = '#2040a0'
      ctx.lineWidth = 2
      ctx.strokeRect(px + 3, py + 3, ts - 6, ts - 6)

      // Grout
      ctx.fillStyle = '#c8c0b0'
      ctx.fillRect(px, py, 3, ts)
      ctx.fillRect(px, py, ts, 3)
    }
  }

  const t = new THREE.CanvasTexture(canvas)
  t.wrapS = THREE.RepeatWrapping
  t.wrapT = THREE.RepeatWrapping
  return t
}

export function createTerracottaStoneTexture(size = 512) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const rng = seededRng(42)

  ctx.fillStyle = '#a06535'
  ctx.fillRect(0, 0, size, size)

  // Stone blocks in offset rows
  const bw = 90, bh = 55
  let row = 0
  for (let y = 0; y < size + bh; y += bh) {
    const xoff = (row % 2) * (bw * 0.5)
    for (let x = -bw + xoff; x < size + bw; x += bw) {
      const jx = (rng() - 0.5) * 6
      const jy = (rng() - 0.5) * 4
      const sw = bw - 5 + (rng() - 0.5) * 10
      const sh = bh - 4 + (rng() - 0.5) * 6
      const b = 0.8 + rng() * 0.4
      const r = Math.min(255, Math.floor(175 * b))
      const g = Math.min(255, Math.floor(112 * b))
      const gb = Math.min(255, Math.floor(54 * b))
      ctx.fillStyle = `rgb(${r},${g},${gb})`
      const rad = 3
      ctx.beginPath()
      ctx.roundRect(x + jx + 3, y + jy + 2, sw - 6, sh - 4, rad)
      ctx.fill()
      // Subtle edge shading
      ctx.strokeStyle = `rgba(80,45,15,0.3)`
      ctx.lineWidth = 1
      ctx.stroke()
    }
    row++
  }

  // Surface noise
  for (let i = 0; i < 4000; i++) {
    const x = rng() * size, y = rng() * size, r = rng() * 2
    const v = rng() > 0.5 ? 1.15 : 0.85
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${Math.floor(160*v)},${Math.floor(100*v)},${Math.floor(45*v)},0.15)`
    ctx.fill()
  }

  const t = new THREE.CanvasTexture(canvas)
  t.wrapS = THREE.RepeatWrapping
  t.wrapT = THREE.RepeatWrapping
  return t
}

export function createWhiteStoneTexture(size = 512) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const rng = seededRng(99)

  ctx.fillStyle = '#e2d8c8'
  ctx.fillRect(0, 0, size, size)

  // Stone blocks
  const bw = 100, bh = 60
  let row = 0
  for (let y = 0; y < size + bh; y += bh) {
    const xoff = (row % 2) * (bw * 0.5)
    for (let x = -bw + xoff; x < size + bw; x += bw) {
      const b = 0.88 + rng() * 0.24
      const base = 210
      const r = Math.min(255, Math.floor(base * b))
      const g = Math.min(255, Math.floor((base - 8) * b))
      const gb = Math.min(255, Math.floor((base - 20) * b))
      ctx.fillStyle = `rgb(${r},${g},${gb})`
      ctx.beginPath()
      ctx.roundRect(x + 3, y + 2, bw - 7, bh - 5, 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(140,120,95,0.4)'
      ctx.lineWidth = 1
      ctx.stroke()
    }
    row++
  }

  // Surface texture noise
  for (let i = 0; i < 6000; i++) {
    const x = rng() * size, y = rng() * size
    const r = rng() * 2.5
    const v = rng() > 0.5 ? 1.1 : 0.9
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(190,170,140,${rng() * 0.12})`
    ctx.fill()
  }

  const t = new THREE.CanvasTexture(canvas)
  t.wrapS = THREE.RepeatWrapping
  t.wrapT = THREE.RepeatWrapping
  return t
}

export function createPlasterTexture(size = 512) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const rng = seededRng(77)

  ctx.fillStyle = '#d4bfa0'
  ctx.fillRect(0, 0, size, size)

  for (let i = 0; i < 12000; i++) {
    const x = rng() * size, y = rng() * size
    const r = rng() * 3.5
    const v = rng()
    let col
    if (v > 0.75) col = `rgba(210,185,150,${rng() * 0.1})`
    else if (v > 0.45) col = `rgba(175,145,110,${rng() * 0.08})`
    else col = `rgba(230,210,180,${rng() * 0.06})`
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = col
    ctx.fill()
  }

  // Fine cracks
  for (let i = 0; i < 8; i++) {
    ctx.strokeStyle = 'rgba(130,105,75,0.12)'
    ctx.lineWidth = 0.5
    ctx.beginPath()
    let cx = rng() * size, cy = rng() * size
    ctx.moveTo(cx, cy)
    for (let j = 0; j < 15; j++) {
      cx += (rng() - 0.5) * 18
      cy += rng() * 12
      ctx.lineTo(cx, cy)
    }
    ctx.stroke()
  }

  const t = new THREE.CanvasTexture(canvas)
  t.wrapS = THREE.RepeatWrapping
  t.wrapT = THREE.RepeatWrapping
  return t
}

export function createDarkWoodTexture(size = 512) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const rng = seededRng(11)

  const grad = ctx.createLinearGradient(0, 0, size, 0)
  grad.addColorStop(0, '#2a1508')
  grad.addColorStop(0.25, '#3d2010')
  grad.addColorStop(0.5, '#2e1a0c')
  grad.addColorStop(0.75, '#3d2010')
  grad.addColorStop(1, '#2a1508')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, size, size)

  // Grain lines
  for (let i = 0; i < 60; i++) {
    const xStart = (i / 60) * size
    ctx.strokeStyle = `rgba(${Math.floor(60 + rng()*40)},${Math.floor(25 + rng()*20)},${Math.floor(5 + rng()*10)},0.35)`
    ctx.lineWidth = rng() * 1.5 + 0.3
    ctx.beginPath()
    ctx.moveTo(xStart, 0)
    let cx = xStart
    for (let y = 0; y < size; y += 8) {
      cx += (rng() - 0.5) * 4
      ctx.lineTo(cx, y)
    }
    ctx.stroke()
  }

  // Highlight grain
  for (let i = 0; i < 20; i++) {
    const x = rng() * size
    ctx.strokeStyle = `rgba(90,55,20,0.15)`
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.moveTo(x, 0)
    let cx = x
    for (let y = 0; y < size; y += 4) {
      cx += (rng() - 0.5) * 2
      ctx.lineTo(cx, y)
    }
    ctx.stroke()
  }

  const t = new THREE.CanvasTexture(canvas)
  t.wrapS = THREE.RepeatWrapping
  t.wrapT = THREE.RepeatWrapping
  return t
}

export function createLinenTexture(size = 256) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const rng = seededRng(33)

  ctx.fillStyle = '#f5f0e5'
  ctx.fillRect(0, 0, size, size)

  for (let i = 0; i < size; i += 2) {
    ctx.strokeStyle = `rgba(200,188,165,${rng() * 0.12 + 0.04})`
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, size)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(size, i)
    ctx.stroke()
  }

  for (let i = 0; i < 15; i++) {
    ctx.strokeStyle = 'rgba(185,170,145,0.06)'
    ctx.lineWidth = 0.6
    ctx.beginPath()
    const sx = rng() * size
    ctx.moveTo(sx, 0)
    ctx.bezierCurveTo(
      rng() * size, size * 0.33,
      rng() * size, size * 0.66,
      rng() * size, size
    )
    ctx.stroke()
  }

  const t = new THREE.CanvasTexture(canvas)
  t.wrapS = THREE.RepeatWrapping
  t.wrapT = THREE.RepeatWrapping
  return t
}

export function createCeilingStoneTexture(size = 512) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const rng = seededRng(55)

  ctx.fillStyle = '#c4ae90'
  ctx.fillRect(0, 0, size, size)

  for (let i = 0; i < 8000; i++) {
    const x = rng() * size, y = rng() * size, r = rng() * 3
    const v = rng() > 0.5 ? 1.1 : 0.9
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${Math.floor(180*v)},${Math.floor(155*v)},${Math.floor(118*v)},0.12)`
    ctx.fill()
  }

  // Stone joints
  const bw = 120, bh = 80
  ctx.strokeStyle = 'rgba(90,70,50,0.35)'
  ctx.lineWidth = 2
  let row = 0
  for (let y = bh; y < size; y += bh) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke()
    const off = (row % 2) * (bw * 0.5)
    for (let x = off; x < size; x += bw) {
      ctx.beginPath(); ctx.moveTo(x, y - bh); ctx.lineTo(x, y); ctx.stroke()
    }
    row++
  }

  const t = new THREE.CanvasTexture(canvas)
  t.wrapS = THREE.RepeatWrapping
  t.wrapT = THREE.RepeatWrapping
  return t
}

export function createWickerTexture(size = 256) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const rng = seededRng(88)

  ctx.fillStyle = '#8b6914'
  ctx.fillRect(0, 0, size, size)

  const spacing = 12
  ctx.lineWidth = 5
  for (let i = -size; i < size * 2; i += spacing) {
    ctx.strokeStyle = `rgba(${Math.floor(100 + rng()*30)},${Math.floor(75 + rng()*20)},${Math.floor(10 + rng()*15)},0.8)`
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i + size, size)
    ctx.stroke()
  }

  ctx.lineWidth = 4
  for (let i = -size; i < size * 2; i += spacing) {
    ctx.strokeStyle = `rgba(${Math.floor(140 + rng()*20)},${Math.floor(100 + rng()*20)},${Math.floor(20 + rng()*15)},0.5)`
    ctx.beginPath()
    ctx.moveTo(i + size, 0)
    ctx.lineTo(i, size)
    ctx.stroke()
  }

  const t = new THREE.CanvasTexture(canvas)
  t.wrapS = THREE.RepeatWrapping
  t.wrapT = THREE.RepeatWrapping
  return t
}
