import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import * as THREE from 'three'
import {
  createMajolikaTileTexture,
  createTerracottaStoneTexture,
  createWhiteStoneTexture,
  createPlasterTexture,
  createDarkWoodTexture,
  createLinenTexture,
  createCeilingStoneTexture,
  createWickerTexture,
} from '../../utils/textures'

// ─── Geometry helpers ───────────────────────────────────────────────────────

function archWallGeometry(wallW, wallH, wallD, archW, archH, archRadius) {
  const shape = new THREE.Shape()
  shape.moveTo(-wallW / 2, 0)
  shape.lineTo(wallW / 2, 0)
  shape.lineTo(wallW / 2, wallH)
  shape.lineTo(-wallW / 2, wallH)
  shape.closePath()

  const hole = new THREE.Path()
  hole.moveTo(-archW / 2, 0)
  hole.lineTo(-archW / 2, archH - archRadius)
  hole.absarc(0, archH - archRadius, archRadius, Math.PI, 0, false)
  hole.lineTo(archW / 2, 0)
  hole.closePath()
  shape.holes.push(hole)

  return new THREE.ExtrudeGeometry(shape, { depth: wallD, bevelEnabled: false })
}

function bottleGeometry() {
  const pts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.028, 0),
    new THREE.Vector2(0.038, 0.03),
    new THREE.Vector2(0.055, 0.12),
    new THREE.Vector2(0.065, 0.32),
    new THREE.Vector2(0.068, 0.52),
    new THREE.Vector2(0.065, 0.68),
    new THREE.Vector2(0.045, 0.78),
    new THREE.Vector2(0.022, 0.86),
    new THREE.Vector2(0.018, 0.93),
    new THREE.Vector2(0.022, 0.96),
    new THREE.Vector2(0.022, 1.0),
  ]
  return new THREE.LatheGeometry(pts, 14)
}

function lanternCapGeometry() {
  const pts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.005, 0.01),
    new THREE.Vector2(0.025, 0.04),
    new THREE.Vector2(0.075, 0.07),
    new THREE.Vector2(0.10, 0.095),
    new THREE.Vector2(0.105, 0.11),
    new THREE.Vector2(0.095, 0.115),
  ]
  return new THREE.LatheGeometry(pts, 8)
}

function pendantShadeGeometry() {
  const pts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.01, 0.01),
    new THREE.Vector2(0.04, 0.07),
    new THREE.Vector2(0.12, 0.2),
    new THREE.Vector2(0.22, 0.38),
    new THREE.Vector2(0.28, 0.52),
    new THREE.Vector2(0.30, 0.58),
    new THREE.Vector2(0.295, 0.60),
  ]
  return new THREE.LatheGeometry(pts, 12)
}

function planterGeometry() {
  const pts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.18, 0),
    new THREE.Vector2(0.20, 0.02),
    new THREE.Vector2(0.22, 0.18),
    new THREE.Vector2(0.26, 0.38),
    new THREE.Vector2(0.28, 0.55),
    new THREE.Vector2(0.275, 0.58),
    new THREE.Vector2(0.28, 0.60),
    new THREE.Vector2(0.285, 0.61),
  ]
  return new THREE.LatheGeometry(pts, 16)
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function CandleLight({ position, offset = 0 }) {
  const lightRef = useRef()
  useFrame(({ clock }) => {
    if (!lightRef.current) return
    const t = clock.elapsedTime
    lightRef.current.intensity = 1.2 + Math.sin(t * 6.3 + offset) * 0.25 + Math.sin(t * 11.7 + offset * 1.4) * 0.1
  })
  return (
    <group position={position}>
      {/* Candle stick */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.012, 0.014, 0.12, 10]} />
        <meshStandardMaterial color="#f8f0dc" roughness={0.85} />
      </mesh>
      {/* Flame */}
      <mesh position={[0, 0.14, 0]}>
        <sphereGeometry args={[0.018, 8, 8]} />
        <meshStandardMaterial color="#ffcc44" emissive="#ff8800" emissiveIntensity={3} roughness={1} />
      </mesh>
      <pointLight ref={lightRef} color="#ff9944" intensity={1.2} distance={3.5} decay={2} />
    </group>
  )
}

function LanternCage({ position, scale = 1 }) {
  const ironMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1c1408', roughness: 0.65, metalness: 0.55 }), [])
  const glassMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffcc88',
    emissive: '#ff8800',
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.45,
    side: THREE.DoubleSide,
  }), [])
  const capGeo = useMemo(() => lanternCapGeometry(), [])
  const s = scale

  // Explicit cage edges: 4 corners, 4 top ring bars, 4 bottom ring bars
  const corners = [[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx,sz]) => [sx * 0.072 * s, sz * 0.072 * s])
  // Edges (pairs of consecutive corners, wrapping around)
  const edges = [[0,1],[1,2],[2,3],[3,0]]

  return (
    <group position={position}>
      {/* Vertical bars */}
      {corners.map(([bx, bz], i) => (
        <mesh key={i} position={[bx, 0, bz]} material={ironMat}>
          <boxGeometry args={[0.014 * s, 0.32 * s, 0.014 * s]} />
        </mesh>
      ))}
      {/* Horizontal ring - top (explicit 4 bars) */}
      {edges.map(([ai, bi], i) => {
        const [ax, az] = corners[ai], [bx2, bz2] = corners[bi]
        const cx = (ax + bx2) / 2, cz = (az + bz2) / 2
        const len = Math.sqrt((bx2-ax)**2 + (bz2-az)**2)
        const angle = Math.atan2(bz2 - az, bx2 - ax)
        return (
          <mesh key={`rt-${i}`} position={[cx, 0.13 * s, cz]} rotation={[0, -angle, Math.PI / 2]} material={ironMat}>
            <cylinderGeometry args={[0.008 * s, 0.008 * s, len, 6]} />
          </mesh>
        )
      })}
      {/* Horizontal ring - bottom (explicit 4 bars) */}
      {edges.map(([ai, bi], i) => {
        const [ax, az] = corners[ai], [bx2, bz2] = corners[bi]
        const cx = (ax + bx2) / 2, cz = (az + bz2) / 2
        const len = Math.sqrt((bx2-ax)**2 + (bz2-az)**2)
        const angle = Math.atan2(bz2 - az, bx2 - ax)
        return (
          <mesh key={`rb-${i}`} position={[cx, -0.13 * s, cz]} rotation={[0, -angle, Math.PI / 2]} material={ironMat}>
            <cylinderGeometry args={[0.008 * s, 0.008 * s, len, 6]} />
          </mesh>
        )
      })}
      {/* Glass panes */}
      {[0, Math.PI / 2, Math.PI, 3 * Math.PI / 2].map((rot, i) => (
        <mesh key={`glass-${i}`} rotation={[0, rot + Math.PI / 4, 0]} position={[0, 0, 0]} material={glassMat}>
          <planeGeometry args={[0.1 * s, 0.26 * s]} />
        </mesh>
      ))}
      {/* Cap */}
      <mesh geometry={capGeo} position={[0, 0.14 * s, 0]} scale={[s, s, s]} material={ironMat} />
      {/* Bottom finial */}
      <mesh position={[0, -0.16 * s, 0]} rotation={[Math.PI, 0, 0]} scale={[s * 0.6, s * 0.6, s * 0.6]} geometry={capGeo} material={ironMat} />
    </group>
  )
}

function WallLantern({ position, wallNormal = [1, 0, 0] }) {
  const lightRef = useRef()
  const ironMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1c1408', roughness: 0.6, metalness: 0.6 }), [])

  useFrame(({ clock }) => {
    if (!lightRef.current) return
    const t = clock.elapsedTime + position[0] * 3
    lightRef.current.intensity = 2.5 + Math.sin(t * 5 + 1.2) * 0.4 + Math.sin(t * 9.1) * 0.15
  })

  // Bracket curve
  const bracketCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(wallNormal[0] * 0.12, 0.06, wallNormal[2] * 0.12),
    new THREE.Vector3(wallNormal[0] * 0.22, 0.22, wallNormal[2] * 0.22),
    new THREE.Vector3(wallNormal[0] * 0.24, 0.4, wallNormal[2] * 0.24),
  ]), [wallNormal])

  const bracketGeo = useMemo(() => new THREE.TubeGeometry(bracketCurve, 16, 0.012, 8, false), [bracketCurve])

  return (
    <group position={position}>
      <mesh geometry={bracketGeo} material={ironMat} />
      {/* Lantern head at bracket end */}
      <group position={[wallNormal[0] * 0.24, 0.4, wallNormal[2] * 0.24]}>
        <LanternCage position={[0, 0, 0]} scale={0.9} />
        <pointLight ref={lightRef} color="#ff8833" intensity={2.5} distance={5} decay={2} />
      </group>
    </group>
  )
}

function HangingPendant({ position, offset = 0 }) {
  const lightRef = useRef()
  const shadeMat = useMemo(() => {
    const tex = createWickerTexture(256)
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, metalness: 0, side: THREE.DoubleSide })
  }, [])
  const shadeGeo = useMemo(() => pendantShadeGeometry(), [])
  const ironMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1c1408', roughness: 0.6, metalness: 0.5 }), [])

  useFrame(({ clock }) => {
    if (!lightRef.current) return
    const t = clock.elapsedTime + offset
    lightRef.current.intensity = 2.2 + Math.sin(t * 4.5 + 0.8) * 0.3
  })

  // Chain links
  const chainLinks = 8
  const chainSpacing = 0.09

  return (
    <group position={position}>
      {/* Chain */}
      {Array.from({ length: chainLinks }, (_, i) => (
        <mesh key={i} position={[0, i * chainSpacing + 0.05, 0]} rotation={[0, (i % 2) * Math.PI / 2, 0]} material={ironMat}>
          <torusGeometry args={[0.016, 0.005, 6, 10]} />
        </mesh>
      ))}
      {/* Shade */}
      <mesh geometry={shadeGeo} position={[0, chainLinks * chainSpacing, 0]} rotation={[Math.PI, 0, 0]} material={shadeMat} />
      {/* Bulb glow */}
      <mesh position={[0, chainLinks * chainSpacing + 0.1, 0]}>
        <sphereGeometry args={[0.045, 10, 10]} />
        <meshStandardMaterial color="#ffe8aa" emissive="#ff9933" emissiveIntensity={2.5} roughness={0.1} />
      </mesh>
      <pointLight ref={lightRef} color="#ff9944" intensity={2.2} distance={6} decay={2} position={[0, chainLinks * chainSpacing + 0.1, 0]} />
    </group>
  )
}

function DiningTable({ position, rotation = 0, small = false }) {
  const woodTex = useMemo(() => createDarkWoodTexture(256), [])
  const linenTex = useMemo(() => createLinenTexture(256), [])
  const w = small ? 0.8 : 1.1, d = small ? 0.7 : 0.7, h = 0.78

  const woodMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: woodTex, roughness: 0.72, metalness: 0.05,
  }), [woodTex])
  const linenMat = useMemo(() => new THREE.MeshStandardMaterial({
    map: linenTex, roughness: 0.92, metalness: 0,
    color: '#f5f0e5',
  }), [linenTex])
  const ironMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#18120a', roughness: 0.65, metalness: 0.45,
  }), [])

  // Table leg paths (slightly curved for bistro elegance)
  const legPositions = [
    [-w * 0.4, -d * 0.38],
    [ w * 0.4, -d * 0.38],
    [-w * 0.4,  d * 0.38],
    [ w * 0.4,  d * 0.38],
  ]

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Tabletop */}
      <mesh position={[0, h, 0]} castShadow receiveShadow material={woodMat}>
        <boxGeometry args={[w, 0.04, d]} />
      </mesh>
      {/* Tablecloth — slightly overhanging */}
      <mesh position={[0, h + 0.022, 0]} castShadow receiveShadow material={linenMat}>
        <boxGeometry args={[w + 0.12, 0.015, d + 0.12]} />
      </mesh>
      {/* Cloth side drops */}
      <mesh position={[0, h - 0.08, -(d + 0.12) / 2]} material={linenMat}>
        <boxGeometry args={[w + 0.12, 0.2, 0.012]} />
      </mesh>
      <mesh position={[0, h - 0.08, (d + 0.12) / 2]} material={linenMat}>
        <boxGeometry args={[w + 0.12, 0.2, 0.012]} />
      </mesh>
      <mesh position={[-(w + 0.12) / 2, h - 0.08, 0]} material={linenMat}>
        <boxGeometry args={[0.012, 0.2, d + 0.12]} />
      </mesh>
      <mesh position={[(w + 0.12) / 2, h - 0.08, 0]} material={linenMat}>
        <boxGeometry args={[0.012, 0.2, d + 0.12]} />
      </mesh>
      {/* Legs (iron rod style, slightly angled) */}
      {legPositions.map(([lx, lz], i) => (
        <mesh key={i} position={[lx, h / 2, lz]} rotation={[0, 0, (lx > 0 ? 0.06 : -0.06)]} material={ironMat} castShadow>
          <boxGeometry args={[0.028, h - 0.05, 0.028]} />
        </mesh>
      ))}
      {/* Cross brace */}
      <mesh position={[0, 0.28, 0]} material={ironMat}>
        <boxGeometry args={[w * 0.7, 0.018, 0.018]} />
      </mesh>
      <mesh position={[0, 0.28, 0]} rotation={[0, Math.PI / 2, 0]} material={ironMat}>
        <boxGeometry args={[d * 0.6, 0.018, 0.018]} />
      </mesh>
      {/* Candle centerpiece */}
      <CandleLight position={[0.05, h + 0.03, 0.02]} offset={position[0] * 2 + position[2] * 0.7} />
      {/* Wine glasses (simple crystal suggestion) */}
      {[[-0.22, -0.2], [0.22, -0.2], [-0.22, 0.2], [0.22, 0.2]].slice(0, small ? 2 : 4).map(([gx, gz], i) => (
        <mesh key={i} position={[gx, h + 0.06, gz]}>
          <cylinderGeometry args={[0.025, 0.012, 0.12, 8, 1, true]} />
          <meshStandardMaterial color="#d0e8f0" transparent opacity={0.25} roughness={0.05} metalness={0.1} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}

function BistroChair({ position, rotation = 0 }) {
  const ironMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#14100a', roughness: 0.6, metalness: 0.5,
  }), [])
  const seatMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#2a1e0e', roughness: 0.85,
  }), [])
  const cushionMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#7a5a28', roughness: 0.9,
  }), [])

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Seat */}
      <mesh position={[0, 0.47, 0]} material={seatMat} castShadow>
        <boxGeometry args={[0.40, 0.032, 0.38]} />
      </mesh>
      {/* Seat cushion */}
      <mesh position={[0, 0.50, 0]} material={cushionMat} castShadow>
        <boxGeometry args={[0.36, 0.038, 0.34]} />
      </mesh>
      {/* Backrest uprights */}
      <mesh position={[-0.14, 0.72, -0.17]} material={ironMat} castShadow>
        <boxGeometry args={[0.022, 0.52, 0.022]} />
      </mesh>
      <mesh position={[0.14, 0.72, -0.17]} material={ironMat} castShadow>
        <boxGeometry args={[0.022, 0.52, 0.022]} />
      </mesh>
      {/* Backrest rail - top */}
      <mesh position={[0, 0.96, -0.17]} material={ironMat} castShadow>
        <boxGeometry args={[0.38, 0.032, 0.022]} />
      </mesh>
      {/* Backrest rail - mid */}
      <mesh position={[0, 0.76, -0.17]} material={ironMat} castShadow>
        <boxGeometry args={[0.38, 0.022, 0.022]} />
      </mesh>
      {/* Decorative scroll — iron torus arcs in back */}
      <mesh position={[-0.06, 0.86, -0.17]} rotation={[Math.PI / 2, 0, 0]} material={ironMat}>
        <torusGeometry args={[0.06, 0.009, 6, 14, Math.PI]} />
      </mesh>
      <mesh position={[0.06, 0.86, -0.17]} rotation={[Math.PI / 2, 0, Math.PI]} material={ironMat}>
        <torusGeometry args={[0.06, 0.009, 6, 14, Math.PI]} />
      </mesh>
      {/* Front legs */}
      <mesh position={[-0.15, 0.23, 0.15]} rotation={[0.08, 0, -0.06]} material={ironMat} castShadow>
        <boxGeometry args={[0.022, 0.47, 0.022]} />
      </mesh>
      <mesh position={[0.15, 0.23, 0.15]} rotation={[0.08, 0, 0.06]} material={ironMat} castShadow>
        <boxGeometry args={[0.022, 0.47, 0.022]} />
      </mesh>
      {/* Back legs */}
      <mesh position={[-0.14, 0.4, -0.17]} rotation={[-0.06, 0, -0.04]} material={ironMat} castShadow>
        <boxGeometry args={[0.022, 0.82, 0.022]} />
      </mesh>
      <mesh position={[0.14, 0.4, -0.17]} rotation={[-0.06, 0, 0.04]} material={ironMat} castShadow>
        <boxGeometry args={[0.022, 0.82, 0.022]} />
      </mesh>
      {/* Stretcher bars */}
      <mesh position={[0, 0.16, 0.15]} material={ironMat}>
        <boxGeometry args={[0.30, 0.016, 0.016]} />
      </mesh>
      <mesh position={[0, 0.16, -0.17]} material={ironMat}>
        <boxGeometry args={[0.28, 0.016, 0.016]} />
      </mesh>
    </group>
  )
}

function WineBottle({ position, rotation = 0, color = '#1a3a15' }) {
  const geo = useMemo(() => bottleGeometry(), [])
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color,
    roughness: 0.15,
    metalness: 0.0,
    transparent: true,
    opacity: 0.82,
  }), [color])
  const labelMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#f0e6c8', roughness: 0.9 }), [])

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={[0.9, 0.9, 0.9]}>
      <mesh geometry={geo} material={mat} />
      {/* Label */}
      <mesh position={[0, 0.48, 0.058]}>
        <planeGeometry args={[0.09, 0.14]} />
        <primitive object={labelMat} />
      </mesh>
    </group>
  )
}

function WineRack({ position }) {
  const woodMat = useMemo(() => {
    const t = createDarkWoodTexture(256)
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.75 })
  }, [])

  const rows = 4, cols = 6
  const rw = 1.2, rh = 1.4, spacing = 0.22
  // Pre-compute bottle tilts to avoid Math.random in JSX
  const bottleTilts = useMemo(() => {
    const tilts = []
    let seed = 12345
    for (let i = 0; i < rows * cols; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff
      tilts.push((seed % 100) > 30 ? 0 : 0.15)
    }
    return tilts
  }, [])

  return (
    <group position={position}>
      {/* Frame verticals */}
      {[0, rw].map((x, i) => (
        <mesh key={i} position={[x - rw / 2, rh / 2, 0]} material={woodMat} castShadow>
          <boxGeometry args={[0.045, rh, 0.12]} />
        </mesh>
      ))}
      {/* Frame horizontals */}
      {Array.from({ length: rows + 1 }, (_, r) => (
        <mesh key={r} position={[0, r * (rh / rows), 0]} material={woodMat} castShadow>
          <boxGeometry args={[rw, 0.04, 0.12]} />
        </mesh>
      ))}
      {/* Wine bottles in rack */}
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const bx = (c - (cols - 1) / 2) * spacing
          const by = r * (rh / rows) + 0.1
          const bz = 0
          const colors = ['#1a3a15', '#1a3a15', '#1a1a40', '#3a1505', '#1a3a15']
          return (
            <WineBottle
              key={`${r}-${c}`}
              position={[bx, by, bz]}
              rotation={[bottleTilts[r * cols + c], c * 0.4, 0]}
              color={colors[(r * cols + c) % colors.length]}
            />
          )
        })
      )}
    </group>
  )
}

function LemonTree({ position }) {
  const leafPositions = useMemo(() => {
    const pts = []
    for (let i = 0; i < 300; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const r = 0.5 + Math.random() * 0.7
      pts.push(
        Math.sin(phi) * Math.cos(theta) * r,
        1.8 + Math.cos(phi) * r * 0.75 + Math.random() * 0.2,
        Math.sin(phi) * Math.sin(theta) * r
      )
    }
    return new Float32Array(pts)
  }, [])

  const lemons = useMemo(() => {
    const arr = []
    for (let i = 0; i < 18; i++) {
      const theta = Math.random() * Math.PI * 2
      const r = 0.3 + Math.random() * 0.5
      arr.push({
        x: Math.cos(theta) * r,
        y: 1.5 + Math.random() * 0.8,
        z: Math.sin(theta) * r,
      })
    }
    return arr
  }, [])

  return (
    <group position={position}>
      {/* Trunk - slightly curved */}
      {[0, 0.4, 0.8, 1.2].map((y, i) => (
        <mesh key={i} position={[i * 0.015, y + 0.25, i * 0.01]} castShadow>
          <cylinderGeometry args={[0.055 - i * 0.006, 0.065 - i * 0.005, 0.5, 8]} />
          <meshStandardMaterial color="#5a3a1a" roughness={0.9} />
        </mesh>
      ))}
      {/* Main branches */}
      {[[-0.3, 1.5, 0.1, -0.4], [0.25, 1.5, -0.1, 0.3], [0, 1.6, 0.2, 0.05]].map(([bx, by, bz, rot], i) => (
        <mesh key={i} position={[bx * 0.3, by, bz * 0.3]} rotation={[0, rot, -0.3 + i * 0.2]}>
          <cylinderGeometry args={[0.02, 0.03, 0.5, 6]} />
          <meshStandardMaterial color="#4a3015" roughness={0.9} />
        </mesh>
      ))}
      {/* Leaf cloud */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[leafPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#3d6e25" size={0.065} sizeAttenuation transparent opacity={0.85} />
      </points>
      {/* Lemons */}
      {lemons.map((l, i) => (
        <mesh key={i} position={[l.x, l.y, l.z]} rotation={[Math.random(), Math.random(), Math.random()]}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color="#e8cc30" roughness={0.7} emissive="#aaaa00" emissiveIntensity={0.08} />
        </mesh>
      ))}
    </group>
  )
}

function OliveTree({ position }) {
  const leafPositions = useMemo(() => {
    const pts = []
    for (let i = 0; i < 500; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const r = 0.6 + Math.random() * 1.0
      pts.push(
        Math.sin(phi) * Math.cos(theta) * r * 0.85,
        2.2 + Math.cos(phi) * r * 0.65 + Math.random() * 0.3,
        Math.sin(phi) * Math.sin(theta) * r
      )
    }
    return new Float32Array(pts)
  }, [])

  return (
    <group position={position}>
      {/* Gnarled trunk segments */}
      {[0, 0.5, 1.0, 1.5, 2.0].map((y, i) => (
        <mesh key={i} position={[Math.sin(y) * 0.04, y + 0.3, Math.cos(y * 0.7) * 0.03]} castShadow>
          <cylinderGeometry args={[0.08 - i * 0.008, 0.09 - i * 0.008, 0.65, 7]} />
          <meshStandardMaterial color="#3d2e1a" roughness={0.95} />
        </mesh>
      ))}
      {/* Leaf canopy */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[leafPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#5d7a30" size={0.075} sizeAttenuation transparent opacity={0.88} />
      </points>
      {/* Silver-green highlights — every 3rd point of the canopy */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[leafPositions.slice(0, 150 * 3), 3]}
          />
        </bufferGeometry>
        <pointsMaterial color="#8aaa50" size={0.045} sizeAttenuation transparent opacity={0.5} />
      </points>
    </group>
  )
}

function BougainvilleaWall({ position }) {
  const flowerPositions = useMemo(() => {
    const pts = []
    for (let i = 0; i < 400; i++) {
      pts.push(
        (Math.random() - 0.5) * 3,
        1.0 + Math.random() * 2.5,
        (Math.random() - 0.5) * 0.4
      )
    }
    return new Float32Array(pts)
  }, [])

  const leafPos = useMemo(() => {
    const pts = []
    for (let i = 0; i < 600; i++) {
      pts.push(
        (Math.random() - 0.5) * 3.2,
        0.5 + Math.random() * 3.2,
        (Math.random() - 0.5) * 0.5
      )
    }
    return new Float32Array(pts)
  }, [])

  return (
    <group position={position}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[leafPos, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#2d5a1a" size={0.06} sizeAttenuation transparent opacity={0.8} />
      </points>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[flowerPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#cc3366" size={0.055} sizeAttenuation transparent opacity={0.75} />
      </points>
      {/* Stems */}
      {[0, 0.6, -0.5, 1.0, -0.9].map((x, i) => (
        <mesh key={i} position={[x, 1.5, 0]} rotation={[0, 0, (x > 0 ? 0.2 : -0.2) * (i + 1)]}>
          <boxGeometry args={[0.012, 1.5 + Math.random() * 0.5, 0.012]} />
          <meshStandardMaterial color="#2d4a15" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

function Planter({ position }) {
  const geo = useMemo(() => planterGeometry(), [])
  const mat = useMemo(() => {
    const t = createTerracottaStoneTexture(256)
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.85, metalness: 0.05 })
  }, [])
  const soilMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2a1808', roughness: 1.0 }), [])

  return (
    <group position={position}>
      <mesh geometry={geo} material={mat} castShadow />
      {/* Soil */}
      <mesh position={[0, 0.55, 0]}>
        <circleGeometry args={[0.265, 14]} />
        <primitive object={soilMat} />
      </mesh>
    </group>
  )
}

// ─── Section: Exterior Terrace ───────────────────────────────────────────────

function ExteriorTerrace() {
  const floorTex = useMemo(() => {
    const t = createTerracottaStoneTexture(512)
    t.repeat.set(6, 8)
    return t
  }, [])
  const wallTex = useMemo(() => {
    const t = createWhiteStoneTexture(512)
    t.repeat.set(4, 2)
    return t
  }, [])

  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9, metalness: 0 }), [wallTex])

  return (
    <group>
      {/* Outdoor floor */}
      <mesh position={[0, 0, 8.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 11]} />
        <meshStandardMaterial map={floorTex} roughness={0.88} />
      </mesh>

      {/* Back wall (building facade) */}
      <mesh position={[0, 2.4, 4.5]} receiveShadow castShadow material={wallMat}>
        <boxGeometry args={[14, 5.5, 0.35]} />
      </mesh>

      {/* Side walls */}
      <mesh position={[-5.8, 2.2, 9]} receiveShadow castShadow material={wallMat}>
        <boxGeometry args={[0.3, 4.5, 10]} />
      </mesh>
      <mesh position={[5.8, 2.2, 9]} receiveShadow castShadow material={wallMat}>
        <boxGeometry args={[0.3, 4.5, 10]} />
      </mesh>

      {/* Low terrace wall */}
      <mesh position={[0, 0.5, 13.9]} receiveShadow castShadow material={wallMat}>
        <boxGeometry args={[12, 1.1, 0.28]} />
      </mesh>
      {/* Wall top cap */}
      <mesh position={[0, 1.1, 13.9]}>
        <boxGeometry args={[12, 0.09, 0.35]} />
        <meshStandardMaterial color="#c8b898" roughness={0.8} />
      </mesh>

      {/* Outdoor tables */}
      <DiningTable position={[-2.5, 0, 11.5]} small />
      <BistroChair position={[-2.5, 0, 12.8]} rotation={Math.PI} />
      <BistroChair position={[-2.5, 0, 10.2]} rotation={0} />

      <DiningTable position={[2.5, 0, 11.0]} small />
      <BistroChair position={[2.5, 0, 12.3]} rotation={Math.PI} />
      <BistroChair position={[2.5, 0, 9.7]} rotation={0} />
      <BistroChair position={[3.8, 0, 11.0]} rotation={-Math.PI / 2} />

      {/* Lemon tree left */}
      <LemonTree position={[-4.2, 0, 10.5]} />
      <Planter position={[-4.2, 0, 10.5]} />

      {/* Olive tree right */}
      <OliveTree position={[4.5, 0, 9.5]} />
      <Planter position={[4.5, 0, 9.5]} />

      {/* Bougainvillea on left wall */}
      <BougainvilleaWall position={[-5.6, 0, 9]} />

      {/* Wall lanterns on facade */}
      <WallLantern position={[-2.5, 2.2, 4.55]} wallNormal={[0, 0, 1]} />
      <WallLantern position={[2.5, 2.2, 4.55]} wallNormal={[0, 0, 1]} />

      {/* Ceramic name sign */}
      <group position={[2.8, 2.8, 4.6]}>
        <mesh>
          <boxGeometry args={[0.85, 0.55, 0.05]} />
          <meshStandardMaterial color="#f0e8d0" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[0.78, 0.48, 0.02]} />
          <meshStandardMaterial color="#e8ddc4" roughness={0.65} />
        </mesh>
      </group>

      {/* Ground shadow under trees */}
      <mesh position={[-4.2, 0.005, 10.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.2, 16]} />
        <meshStandardMaterial color="#1a0d05" transparent opacity={0.25} />
      </mesh>
    </group>
  )
}

// ─── Section: Entrance ───────────────────────────────────────────────────────

function EntranceSection() {
  const stoneTex = useMemo(() => {
    const t = createWhiteStoneTexture(512)
    t.repeat.set(3, 2)
    return t
  }, [])
  const wallMat = useMemo(() => new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.88 }), [stoneTex])

  // Arch wall geometry — wall with arched opening
  const archWallGeo = useMemo(() => archWallGeometry(10, 4.5, 0.38, 2.4, 3.6, 1.2), [])

  const ironMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#12100d', roughness: 0.55, metalness: 0.65,
  }), [])
  const glassWinMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#c8d8cc',
    transparent: true,
    opacity: 0.28,
    roughness: 0.05,
    metalness: 0.1,
    side: THREE.DoubleSide,
  }), [])

  // Stone arch molding along the arch curve
  const archMoldingPath = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 32; i++) {
      const angle = (i / 32) * Math.PI
      pts.push(new THREE.Vector3(Math.cos(angle + Math.PI) * 1.25, 2.4 + Math.sin(angle + Math.PI) * 1.25 + 1.25, 0.15))
    }
    return new THREE.CatmullRomCurve3(pts)
  }, [])
  const archMoldingGeo = useMemo(() => new THREE.TubeGeometry(archMoldingPath, 32, 0.055, 8, false), [archMoldingPath])

  return (
    <group>
      {/* Main arch wall */}
      <mesh geometry={archWallGeo} position={[0, 0, 4.3]} material={wallMat} castShadow receiveShadow />

      {/* Stone arch molding */}
      <mesh geometry={archMoldingGeo} position={[0, 0, 4.2]}>
        <meshStandardMaterial color="#c8b898" roughness={0.82} />
      </mesh>

      {/* Door frames (left and right panels of French doors, open inward) */}
      {/* Left door panel — angled open */}
      <mesh position={[-0.8, 1.7, 3.8]} rotation={[0, -1.1, 0]} material={ironMat} castShadow>
        <boxGeometry args={[0.04, 3.4, 1.0]} />
      </mesh>
      {/* Left glass pane */}
      <mesh position={[-1.1, 1.7, 3.6]} rotation={[0, -1.1, 0]} material={glassWinMat}>
        <planeGeometry args={[0.9, 3.2]} />
      </mesh>
      {/* Door cross-bars */}
      {[-0.5, 0.2, 0.9].map((y, i) => (
        <mesh key={i} position={[-1.1 + Math.sin(-1.1) * (y - 0.2) * 0.05, 1.7 + (y - 0.7), 3.6]} rotation={[0, -1.1, 0]} material={ironMat}>
          <boxGeometry args={[0.9, 0.022, 0.022]} />
        </mesh>
      ))}

      {/* Right door panel — angled open */}
      <mesh position={[0.8, 1.7, 3.8]} rotation={[0, 1.1, 0]} material={ironMat} castShadow>
        <boxGeometry args={[0.04, 3.4, 1.0]} />
      </mesh>
      <mesh position={[1.1, 1.7, 3.6]} rotation={[0, 1.1, 0]} material={glassWinMat}>
        <planeGeometry args={[0.9, 3.2]} />
      </mesh>
      {[-0.5, 0.2, 0.9].map((y, i) => (
        <mesh key={i} position={[1.1 + Math.sin(1.1) * (y - 0.2) * 0.05, 1.7 + (y - 0.7), 3.6]} rotation={[0, 1.1, 0]} material={ironMat}>
          <boxGeometry args={[0.9, 0.022, 0.022]} />
        </mesh>
      ))}

      {/* Door threshold step */}
      <mesh position={[0, 0.04, 4.0]}>
        <boxGeometry args={[2.8, 0.08, 0.5]} />
        <meshStandardMaterial color="#c0a878" roughness={0.85} />
      </mesh>

      {/* Light spill from interior — warm glow source */}
      <pointLight position={[0, 2, 2.5]} color="#ff9944" intensity={5} distance={9} decay={2} />

      {/* Umbrella canopy suggestion above entrance */}
      <mesh position={[0, 3.8, 6.5]} rotation={[0.12, 0, 0]}>
        <boxGeometry args={[3.5, 0.04, 2.2]} />
        <meshStandardMaterial color="#f5f0e0" roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// ─── Section: Main Dining Room ──────────────────────────────────────────────

function MainDiningRoom() {
  const floorTex = useMemo(() => {
    const t = createMajolikaTileTexture(512)
    t.repeat.set(5, 8)
    return t
  }, [])
  const plasterTex = useMemo(() => {
    const t = createPlasterTexture(512)
    t.repeat.set(3, 1.5)
    return t
  }, [])
  const ceilingTex = useMemo(() => {
    const t = createCeilingStoneTexture(512)
    t.repeat.set(4, 8)
    return t
  }, [])

  const plasterMat = useMemo(() => new THREE.MeshStandardMaterial({ map: plasterTex, roughness: 0.9, color: '#c4a87a' }), [plasterTex])
  const ceilMat = useMemo(() => new THREE.MeshStandardMaterial({ map: ceilingTex, roughness: 0.88, color: '#a08060' }), [ceilingTex])

  // Arch wall opening geometry for interior passage arches
  const innerArchGeo = useMemo(() => archWallGeometry(4.5, 3.4, 0.35, 2.2, 3.0, 1.1), [])

  const roomLen = 13, roomW = 9.5, roomH = 3.4

  const tableConfigs = [
    { pos: [-2.8, 0, -3], rot: 0 },
    { pos: [2.8, 0, -3], rot: 0 },
    { pos: [-2.8, 0, -7], rot: 0 },
    { pos: [2.8, 0, -7], rot: 0 },
    { pos: [-2.5, 0, -11], rot: 0.15 },
    { pos: [2.5, 0, -11], rot: -0.1 },
  ]

  const chairConfigs = [
    // Tables have chairs around them
    ...tableConfigs.flatMap(({ pos: [tx, , tz], rot }) => [
      { pos: [tx - 0.7, 0, tz], rot: Math.PI / 2 },
      { pos: [tx + 0.7, 0, tz], rot: -Math.PI / 2 },
      { pos: [tx, 0, tz - 0.55], rot: 0 },
      { pos: [tx, 0, tz + 0.55], rot: Math.PI },
    ])
  ]

  return (
    <group>
      {/* Floor */}
      <mesh position={[0, 0, -6.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[roomW, roomLen]} />
        <meshStandardMaterial map={floorTex} roughness={0.65} />
      </mesh>

      {/* Side walls */}
      <mesh position={[-roomW / 2 - 0.12, roomH / 2, -6.5]} material={plasterMat} receiveShadow castShadow>
        <boxGeometry args={[0.25, roomH, roomLen]} />
      </mesh>
      <mesh position={[roomW / 2 + 0.12, roomH / 2, -6.5]} material={plasterMat} receiveShadow castShadow>
        <boxGeometry args={[0.25, roomH, roomLen]} />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, roomH / 2, -13.2]} material={plasterMat} receiveShadow castShadow>
        <boxGeometry args={[roomW, roomH, 0.3]} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, roomH, -6.5]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[roomW, roomLen]} />
        <primitive object={ceilMat} />
      </mesh>

      {/* Arch pilasters every 4 units along walls */}
      {[-2.5, -6.5, -10.5].map((z, i) => [
        <mesh key={`pil-l-${i}`} position={[-roomW / 2 + 0.08, roomH / 2, z]} castShadow>
          <boxGeometry args={[0.2, roomH, 0.28]} />
          <meshStandardMaterial color="#c8b08a" roughness={0.82} />
        </mesh>,
        <mesh key={`pil-r-${i}`} position={[roomW / 2 - 0.08, roomH / 2, z]} castShadow>
          <boxGeometry args={[0.2, roomH, 0.28]} />
          <meshStandardMaterial color="#c8b08a" roughness={0.82} />
        </mesh>,
      ])}

      {/* Dining tables */}
      {tableConfigs.map(({ pos, rot }, i) => (
        <DiningTable key={i} position={pos} rotation={rot} />
      ))}

      {/* Chairs */}
      {chairConfigs.map(({ pos, rot }, i) => (
        <BistroChair key={i} position={pos} rotation={rot} />
      ))}

      {/* Pendant lights */}
      {[[-2.8, 3.3, -3], [2.8, 3.3, -3], [-2.8, 3.3, -7], [2.8, 3.3, -7], [0, 3.3, -10.5]].map((pos, i) => (
        <HangingPendant key={i} position={pos} offset={i * 0.7} />
      ))}

      {/* Wall lanterns */}
      <WallLantern position={[-roomW / 2 + 0.2, 2.1, -2]} wallNormal={[1, 0, 0]} />
      <WallLantern position={[-roomW / 2 + 0.2, 2.1, -7]} wallNormal={[1, 0, 0]} />
      <WallLantern position={[roomW / 2 - 0.2, 2.1, -2]} wallNormal={[-1, 0, 0]} />
      <WallLantern position={[roomW / 2 - 0.2, 2.1, -7]} wallNormal={[-1, 0, 0]} />

      {/* Wine display on back wall */}
      <WineRack position={[0, 0, -13.0]} />

      {/* Arched passage to corridor */}
      <mesh geometry={innerArchGeo} position={[-2, 0, -13.1]} material={plasterMat} castShadow />

      {/* Artwork frames on wall */}
      {[[-4.2, 1.8, -4.5], [-4.2, 1.8, -8.5], [4.2, 1.8, -4.5], [4.2, 1.8, -8.5]].map((pos, i) => (
        <group key={i} position={pos}>
          <mesh>
            <boxGeometry args={[0.65, 0.82, 0.04]} />
            <meshStandardMaterial color="#2a1a0a" roughness={0.6} metalness={0.15} />
          </mesh>
          <mesh position={[0, 0, 0.025]}>
            <boxGeometry args={[0.56, 0.72, 0.015]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#8a6a3a' : '#5a4030'} roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ─── Section: Inner Corridor ─────────────────────────────────────────────────

function InnerCorridor() {
  const plasterTex = useMemo(() => {
    const t = createPlasterTexture(512)
    t.repeat.set(2, 1.5)
    return t
  }, [])
  const floorTex = useMemo(() => {
    const t = createMajolikaTileTexture(512)
    t.repeat.set(2, 5)
    return t
  }, [])
  const ceilTex = useMemo(() => {
    const t = createCeilingStoneTexture(512)
    t.repeat.set(2, 5)
    return t
  }, [])

  const plasterMat = useMemo(() => new THREE.MeshStandardMaterial({ map: plasterTex, roughness: 0.9, color: '#b89870' }), [plasterTex])
  const ceilMat = useMemo(() => new THREE.MeshStandardMaterial({ map: ceilTex, roughness: 0.9, color: '#9a7a55' }), [ceilTex])

  const corridorLen = 8, corridorW = 4.2, corridorH = 3.2
  const zCenter = -17

  return (
    <group>
      {/* Floor */}
      <mesh position={[-1, 0, zCenter]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[corridorW, corridorLen]} />
        <meshStandardMaterial map={floorTex} roughness={0.65} />
      </mesh>

      {/* Walls */}
      <mesh position={[-1 - corridorW / 2 - 0.12, corridorH / 2, zCenter]} material={plasterMat} receiveShadow castShadow>
        <boxGeometry args={[0.25, corridorH, corridorLen]} />
      </mesh>
      <mesh position={[-1 + corridorW / 2 + 0.12, corridorH / 2, zCenter]} material={plasterMat} receiveShadow castShadow>
        <boxGeometry args={[0.25, corridorH, corridorLen]} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[-1, corridorH, zCenter]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[corridorW, corridorLen]} />
        <primitive object={ceilMat} />
      </mesh>

      {/* Wall lanterns both sides */}
      <WallLantern position={[-1 - corridorW / 2 + 0.2, 2.0, -14.5]} wallNormal={[1, 0, 0]} />
      <WallLantern position={[-1 - corridorW / 2 + 0.2, 2.0, -18.5]} wallNormal={[1, 0, 0]} />
      <WallLantern position={[-1 + corridorW / 2 - 0.2, 2.0, -15.5]} wallNormal={[-1, 0, 0]} />
      <WallLantern position={[-1 + corridorW / 2 - 0.2, 2.0, -19.5]} wallNormal={[-1, 0, 0]} />

      {/* Wine rack on left wall */}
      <WineRack position={[-1 - corridorW / 2 + 0.85, 0, -16.5]} />

      {/* Decorative tile band on lower wall */}
      {[-1 - corridorW / 2 + 0.24, -1 + corridorW / 2 - 0.24].map((wx, side) => (
        <mesh key={side} position={[wx, 0.38, zCenter]}>
          <boxGeometry args={[0.025, 0.28, corridorLen - 0.5]} />
          <meshStandardMaterial color={side === 0 ? '#2050a0' : '#2050a0'} roughness={0.65} />
        </mesh>
      ))}

      {/* Corridor ceiling arch ribs */}
      {[-14, -16, -18, -20].map((z, i) => (
        <mesh key={i} position={[-1, corridorH - 0.04, z]}>
          <boxGeometry args={[corridorW + 0.3, 0.08, 0.15]} />
          <meshStandardMaterial color="#9a7a55" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

// ─── Section: Private Dining Room ────────────────────────────────────────────

function PrivateDiningRoom() {
  const plasterTex = useMemo(() => {
    const t = createPlasterTexture(512)
    t.repeat.set(2.5, 1.2)
    return t
  }, [])
  const floorTex = useMemo(() => {
    const t = createMajolikaTileTexture(512)
    t.repeat.set(3, 4)
    return t
  }, [])
  const ceilTex = useMemo(() => {
    const t = createCeilingStoneTexture(512)
    t.repeat.set(3, 4)
    return t
  }, [])

  const plasterMat = useMemo(() => new THREE.MeshStandardMaterial({ map: plasterTex, roughness: 0.88, color: '#c4a070' }), [plasterTex])
  const ceilMat = useMemo(() => new THREE.MeshStandardMaterial({ map: ceilTex, roughness: 0.88, color: '#9a7a50' }), [ceilTex])

  const roomW = 7.5, roomH = 3.6, roomLen = 9
  const zCenter = -24.5

  const roundTableChairs = [
    { angle: 0 },
    { angle: Math.PI / 3 },
    { angle: 2 * Math.PI / 3 },
    { angle: Math.PI },
    { angle: 4 * Math.PI / 3 },
    { angle: 5 * Math.PI / 3 },
  ]

  return (
    <group>
      {/* Floor */}
      <mesh position={[0, 0, zCenter]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[roomW, roomLen]} />
        <meshStandardMaterial map={floorTex} roughness={0.6} />
      </mesh>

      {/* Walls */}
      <mesh position={[-roomW / 2 - 0.12, roomH / 2, zCenter]} material={plasterMat} receiveShadow castShadow>
        <boxGeometry args={[0.25, roomH, roomLen]} />
      </mesh>
      <mesh position={[roomW / 2 + 0.12, roomH / 2, zCenter]} material={plasterMat} receiveShadow castShadow>
        <boxGeometry args={[0.25, roomH, roomLen]} />
      </mesh>
      <mesh position={[0, roomH / 2, zCenter - roomLen / 2 - 0.12]} material={plasterMat} receiveShadow castShadow>
        <boxGeometry args={[roomW, roomH, 0.25]} />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, roomH, zCenter]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[roomW, roomLen]} />
        <primitive object={ceilMat} />
      </mesh>

      {/* Central round dining table — feature piece */}
      <group position={[0, 0, zCenter - 0.5]}>
        {/* Round tabletop */}
        <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.85, 0.85, 0.05, 24]} />
          <meshStandardMaterial color="#2e1a0c" roughness={0.68} metalness={0.05} />
        </mesh>
        {/* Tablecloth */}
        <mesh position={[0, 0.80, 0]} castShadow>
          <cylinderGeometry args={[0.95, 0.95, 0.02, 24]} />
          <meshStandardMaterial color="#f5f0e5" roughness={0.92} />
        </mesh>
        {/* Cloth drape sides */}
        <mesh position={[0, 0.68, 0]}>
          <cylinderGeometry args={[0.97, 0.99, 0.2, 24, 1, true]} />
          <meshStandardMaterial color="#f5f0e5" roughness={0.92} side={THREE.DoubleSide} />
        </mesh>
        {/* Pedestal base */}
        <mesh position={[0, 0.39, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.78, 10]} />
          <meshStandardMaterial color="#18120a" roughness={0.65} metalness={0.45} />
        </mesh>
        {/* Decorative pedestal spread */}
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.38, 0.42, 0.08, 16]} />
          <meshStandardMaterial color="#18120a" roughness={0.65} metalness={0.45} />
        </mesh>
        {/* 3-arm brace */}
        {[0, 2 * Math.PI / 3, 4 * Math.PI / 3].map((angle, i) => (
          <mesh key={i} position={[Math.cos(angle) * 0.2, 0.08, Math.sin(angle) * 0.2]} rotation={[0, -angle, 0.15]}>
            <boxGeometry args={[0.4, 0.055, 0.04]} />
            <meshStandardMaterial color="#18120a" roughness={0.65} metalness={0.45} />
          </mesh>
        ))}
        {/* Multiple candles on round table */}
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2
          return <CandleLight key={i} position={[Math.cos(a) * 0.55, 0.82, Math.sin(a) * 0.55]} offset={i * 1.2} />
        })}
        {/* Central flower arrangement */}
        <mesh position={[0, 0.88, 0]}>
          <cylinderGeometry args={[0.045, 0.035, 0.18, 10]} />
          <meshStandardMaterial color="#2a5a3a" roughness={0.85} />
        </mesh>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2
          const r = 0.04 + Math.random() * 0.03
          return (
            <mesh key={i} position={[Math.cos(a) * r, 0.92 + Math.random() * 0.04, Math.sin(a) * r]}>
              <sphereGeometry args={[0.022, 7, 7]} />
              <meshStandardMaterial
                color={i % 3 === 0 ? '#cc3344' : i % 3 === 1 ? '#ff8833' : '#f0d0a0'}
                roughness={0.9}
                emissive={i % 3 === 0 ? '#440010' : '#000'}
                emissiveIntensity={0.15}
              />
            </mesh>
          )
        })}
      </group>

      {/* Chairs around round table */}
      {roundTableChairs.map(({ angle }, i) => {
        const r = 1.1
        return (
          <BistroChair
            key={i}
            position={[Math.cos(angle) * r, 0, zCenter - 0.5 + Math.sin(angle) * r]}
            rotation={angle + Math.PI}
          />
        )
      })}

      {/* Feature chandelier */}
      <group position={[0, roomH, zCenter - 0.5]}>
        {/* Center stem */}
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.3, 8]} />
          <meshStandardMaterial color="#1a1008" roughness={0.6} metalness={0.6} />
        </mesh>
        {/* Crown ring */}
        <mesh position={[0, -0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.45, 0.025, 8, 24]} />
          <meshStandardMaterial color="#1a1008" roughness={0.55} metalness={0.65} />
        </mesh>
        {/* Arms + candles */}
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2
          const armLen = 0.45
          return (
            <group key={i} position={[Math.cos(a) * armLen, -0.3, Math.sin(a) * armLen]}>
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.01, 0.01, armLen, 6]} />
                <meshStandardMaterial color="#1a1008" roughness={0.6} metalness={0.6} />
              </mesh>
              <CandleLight position={[0, 0, 0]} offset={i * 0.8} />
            </group>
          )
        })}
        <pointLight position={[0, -0.32, 0]} color="#ff9933" intensity={4} distance={8} decay={2} />
      </group>

      {/* Wall lanterns */}
      <WallLantern position={[-roomW / 2 + 0.22, 2.0, zCenter - 1.5]} wallNormal={[1, 0, 0]} />
      <WallLantern position={[-roomW / 2 + 0.22, 2.0, zCenter + 2.0]} wallNormal={[1, 0, 0]} />
      <WallLantern position={[roomW / 2 - 0.22, 2.0, zCenter - 1.5]} wallNormal={[-1, 0, 0]} />
      <WallLantern position={[roomW / 2 - 0.22, 2.0, zCenter + 2.0]} wallNormal={[-1, 0, 0]} />

      {/* Decorative ceramic plates on walls */}
      {[[-3.2, 1.75, zCenter - 1], [-3.2, 1.75, zCenter + 0.8], [3.2, 1.75, zCenter - 1], [3.2, 1.75, zCenter + 0.8]].map((pos, i) => (
        <group key={i} position={pos}>
          <mesh>
            <cylinderGeometry args={[0.22, 0.22, 0.025, 16]} />
            <meshStandardMaterial color="#f0e8d0" roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.015, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.015, 16]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#2050a0' : '#aa3333'} roughness={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ─── Lighting & Environment ──────────────────────────────────────────────────

function SceneLighting({ scrollRef }) {
  const ambientRef = useRef()
  const sunRef = useRef()
  const interiorFillRef = useRef()

  useFrame(() => {
    const t = scrollRef.current ?? 0
    // Transition from exterior (warm daylight) to interior (amber candlelight) as we move inside
    const interiorT = Math.max(0, Math.min(1, (t - 0.1) / 0.4))

    if (ambientRef.current) {
      const extIntensity = 0.8 - interiorT * 0.55
      ambientRef.current.intensity = extIntensity
      ambientRef.current.color.setHSL(0.08, 0.5, 0.5 - interiorT * 0.15)
    }
    if (sunRef.current) {
      sunRef.current.intensity = Math.max(0, 1.8 - interiorT * 1.8)
    }
    if (interiorFillRef.current) {
      interiorFillRef.current.intensity = interiorT * 0.8
    }
  })

  return (
    <>
      {/* Global ambient */}
      <ambientLight ref={ambientRef} color="#ff9966" intensity={0.8} />

      {/* Sunset directional sun */}
      <directionalLight
        ref={sunRef}
        position={[12, 6, 18]}
        color="#ff8833"
        intensity={1.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={60}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={10}
        shadow-camera-bottom={-5}
      />

      {/* Interior warm fill */}
      <pointLight ref={interiorFillRef} position={[0, 2.5, -8]} color="#ff8844" intensity={0} distance={20} decay={1.5} />

      {/* Sky rim light */}
      <hemisphereLight skyColor="#ffaa55" groundColor="#3a2010" intensity={0.55} />

      {/* Deep interior ambient fill */}
      <pointLight position={[0, 2.5, -22]} color="#ff7722" intensity={1.5} distance={15} decay={2} />
    </>
  )
}

// ─── Outdoor Sky ──────────────────────────────────────────────────────────────

function SunsetSky() {
  return (
    <Sky
      distance={450}
      sunPosition={[10, 1.5, 20]}
      inclination={0.508}
      azimuth={0.26}
      mieCoefficient={0.006}
      mieDirectionalG={0.985}
      rayleigh={3}
      turbidity={12}
    />
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function RestaurantWorld({ scrollRef }) {
  return (
    <group>
      <SunsetSky />
      <SceneLighting scrollRef={scrollRef} />
      <ExteriorTerrace />
      <EntranceSection />
      <MainDiningRoom />
      <InnerCorridor />
      <PrivateDiningRoom />
    </group>
  )
}
