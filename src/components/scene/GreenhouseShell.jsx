import { useMemo } from 'react'
import * as THREE from 'three'

// ─────────────────────────────────────────────────────────────────
// Greenhouse structural constants
// ─────────────────────────────────────────────────────────────────
const W     = 11      // half-width (total interior = 22 units)
const EAVE  = 5.5     // eave / wall top height
const APEX  = 12.0    // ridge apex height
const Z_NEAR = 8.0    // greenhouse near face (z positive = toward camera)
const Z_FAR  = -90.0  // greenhouse far end
const DEPTH  = Z_NEAR - Z_FAR  // 98 units total depth

// Arch cross-section points (in XY, right side; mirror for left)
const ARCH_R = [
  [W,      EAVE ],  // 0 — right eave
  [7.5,    9.0  ],  // 1 — lower kneewall
  [4.0,    11.0 ],  // 2 — upper shoulder
  [0.0,    APEX ],  // 3 — apex / ridge
]

// Glass material – barely-there, lets sky show through
const GLASS_COLOR = '#b8d8b0'

// ─────────────────────────────────────────────────────────────────
// Custom buffer geometry: quad panel from two cross-section points
// ─────────────────────────────────────────────────────────────────
function makeQuadPanel(x1, y1, x2, y2, zNear, zFar) {
  const positions = new Float32Array([
    x1, y1, zNear,  x1, y1, zFar,   x2, y2, zFar,
    x1, y1, zNear,  x2, y2, zFar,   x2, y2, zNear,
    // Back face (DoubleSide via material)
  ])
  const uvs = new Float32Array([
    0, 0,  1, 0,  1, 1,
    0, 0,  1, 1,  0, 1,
  ])
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
  geo.computeVertexNormals()
  return geo
}

// ─────────────────────────────────────────────────────────────────
// Single glass panel mesh
// ─────────────────────────────────────────────────────────────────
function GlassPanel({ x1, y1, x2, y2 }) {
  const geometry = useMemo(
    () => makeQuadPanel(x1, y1, x2, y2, Z_NEAR, Z_FAR),
    [x1, y1, x2, y2]
  )
  return (
    <mesh geometry={geometry} renderOrder={2}>
      <meshStandardMaterial
        color={GLASS_COLOR}
        transparent
        opacity={0.07}
        roughness={0.04}
        metalness={0.08}
        envMapIntensity={3}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

// ─────────────────────────────────────────────────────────────────
// Structural rib: one arch segment at a given Z position
// ─────────────────────────────────────────────────────────────────
function ArchRib({ zPos }) {
  const segs = useMemo(() => {
    const s = []
    // Right side arch segments + left side (mirrored)
    for (let i = 0; i < ARCH_R.length - 1; i++) {
      const [x1, y1] = ARCH_R[i]
      const [x2, y2] = ARCH_R[i + 1]
      // Right
      s.push({ x1, y1, x2, y2, sign: 1 })
      // Left (mirror X)
      if (x1 !== 0) {
        s.push({ x1: -x1, y1, x2: -x2, y2, sign: -1 })
      }
    }
    // Vertical columns (eave to ground)
    s.push({ x1: W, y1: 0, x2: W, y2: EAVE, sign: 1, isColumn: true })
    s.push({ x1: -W, y1: 0, x2: -W, y2: EAVE, sign: -1, isColumn: true })
    return s
  }, [])

  return (
    <group position={[0, 0, zPos]}>
      {segs.map((seg, i) => {
        const dx = seg.x2 - seg.x1
        const dy = seg.y2 - seg.y1
        const len = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx)
        const cx = (seg.x1 + seg.x2) / 2
        const cy = (seg.y1 + seg.y2) / 2
        const t = seg.isColumn ? 0.12 : 0.11
        return (
          <mesh key={i} position={[cx, cy, 0]} rotation={[0, 0, angle]}>
            <boxGeometry args={[len, t, t]} />
            <meshStandardMaterial
              color="#cac6be"
              metalness={0.65}
              roughness={0.3}
            />
          </mesh>
        )
      })}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Longitudinal purlins (running the full length of the greenhouse)
// ─────────────────────────────────────────────────────────────────
function Purlins() {
  // Positions along the arch profile where horizontal purlins run
  const purlinProfiles = [
    // [x_right, y] — also mirrored for left
    [W,    EAVE  ],          // eave beam (right)
    [7.5,  9.0   ],          // lower purlin
    [4.0,  11.0  ],          // upper purlin
    [0.0,  APEX  ],          // ridge beam (center)
    [W,    0.2   ],          // base rail right
    [-W,   0.2   ],          // base rail left
  ]

  return (
    <group>
      {purlinProfiles.map(([x, y], i) => {
        const isLeft = i === 5 // base rail left already at -W
        return (
          <mesh key={i} position={[x, y, (Z_NEAR + Z_FAR) / 2]}>
            <boxGeometry args={[0.10, 0.10, DEPTH]} />
            <meshStandardMaterial
              color="#cac6be"
              metalness={0.65}
              roughness={0.30}
            />
          </mesh>
        )
      })}
      {/* Mirror right-side purlins to left (except base rail which already has both) */}
      {purlinProfiles.slice(0, 4).map(([x, y], i) => {
        if (x === 0) return null // ridge is center, skip mirror
        return (
          <mesh key={`ml-${i}`} position={[-x, y, (Z_NEAR + Z_FAR) / 2]}>
            <boxGeometry args={[0.10, 0.10, DEPTH]} />
            <meshStandardMaterial
              color="#cac6be"
              metalness={0.65}
              roughness={0.30}
            />
          </mesh>
        )
      })}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// End wall / facade — the entrance face of the greenhouse
// ─────────────────────────────────────────────────────────────────
function EntranceFacade() {
  // Fill the arch cross-section with glass
  const panels = [
    // Left half
    { x1: -W, y1: 0, x2: 0, y2: 0, flip: false },  // handled differently
  ]

  // Create entrance arch as a flat polygon
  const entranceGeo = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-W, 0)
    shape.lineTo(-W, EAVE)
    shape.lineTo(-7.5, 9.0)
    shape.lineTo(-4.0, 11.0)
    shape.lineTo(0.0, APEX)
    shape.lineTo(4.0, 11.0)
    shape.lineTo(7.5, 9.0)
    shape.lineTo(W, EAVE)
    shape.lineTo(W, 0)
    shape.closePath()

    // Cut a large arched opening in the center
    const door = new THREE.Path()
    const dw = 3.5
    door.moveTo(-dw, 0)
    door.lineTo(-dw, 4.5)
    door.absarc(0, 4.5, dw, Math.PI, 0, true)
    door.lineTo(dw, 0)
    door.closePath()
    shape.holes.push(door)

    return new THREE.ShapeGeometry(shape)
  }, [])

  // Entrance wall frame (individual glass panels with mullions)
  return (
    <group position={[0, 0, Z_NEAR]}>
      {/* Glass infill panels */}
      <mesh geometry={entranceGeo} rotation={[0, 0, 0]}>
        <meshStandardMaterial
          color={GLASS_COLOR}
          transparent
          opacity={0.08}
          roughness={0.04}
          metalness={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
          renderOrder={2}
        />
      </mesh>

      {/* Frame outline */}
      {ARCH_R.slice(0, -1).map((_, i) => {
        const [x1, y1] = ARCH_R[i]
        const [x2, y2] = ARCH_R[i + 1]
        const dx = x2 - x1; const dy = y2 - y1
        const len = Math.sqrt(dx * dx + dy * dy)
        const ang = Math.atan2(dy, dx)
        return (
          <group key={i}>
            <mesh position={[(x1 + x2) / 2, (y1 + y2) / 2, 0]} rotation={[0, 0, ang]}>
              <boxGeometry args={[len, 0.12, 0.12]} />
              <meshStandardMaterial color="#cac6be" metalness={0.65} roughness={0.3} />
            </mesh>
            <mesh position={[-(x1 + x2) / 2, (y1 + y2) / 2, 0]} rotation={[0, 0, -ang]}>
              <boxGeometry args={[len, 0.12, 0.12]} />
              <meshStandardMaterial color="#cac6be" metalness={0.65} roughness={0.3} />
            </mesh>
          </group>
        )
      })}

      {/* Vertical wall columns */}
      <mesh position={[W, EAVE / 2, 0]}>
        <boxGeometry args={[0.12, EAVE, 0.12]} />
        <meshStandardMaterial color="#cac6be" metalness={0.65} roughness={0.3} />
      </mesh>
      <mesh position={[-W, EAVE / 2, 0]}>
        <boxGeometry args={[0.12, EAVE, 0.12]} />
        <meshStandardMaterial color="#cac6be" metalness={0.65} roughness={0.3} />
      </mesh>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Far end wall
// ─────────────────────────────────────────────────────────────────
function EndWall() {
  const geo = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(-W, 0)
    shape.lineTo(-W, EAVE)
    shape.lineTo(-7.5, 9.0)
    shape.lineTo(-4.0, 11.0)
    shape.lineTo(0.0, APEX)
    shape.lineTo(4.0, 11.0)
    shape.lineTo(7.5, 9.0)
    shape.lineTo(W, EAVE)
    shape.lineTo(W, 0)
    shape.closePath()
    return new THREE.ShapeGeometry(shape)
  }, [])

  return (
    <group position={[0, 0, Z_FAR]}>
      <mesh geometry={geo}>
        <meshStandardMaterial
          color={GLASS_COLOR}
          transparent
          opacity={0.07}
          roughness={0.04}
          metalness={0.06}
          side={THREE.DoubleSide}
          depthWrite={false}
          renderOrder={2}
        />
      </mesh>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Glazing bars — fine grid lines across glass panels
// ─────────────────────────────────────────────────────────────────
function GlazingBars() {
  // Horizontal bars at regular intervals along each roof panel
  const barSpacing = 5 // every 5 units along Z
  const numBars = Math.floor(DEPTH / barSpacing)

  return (
    <group>
      {Array.from({ length: numBars }, (_, i) => {
        const z = Z_NEAR - (i + 0.5) * barSpacing
        return <ArchRib key={i} zPos={z} />
      })}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Main greenhouse shell export
// ─────────────────────────────────────────────────────────────────
export default function GreenhouseShell() {
  return (
    <group>
      {/* ── Glass roof panels ── */}
      {/* Right side: 3 panels */}
      <GlassPanel x1={W}    y1={EAVE}  x2={7.5}  y2={9.0}  />
      <GlassPanel x1={7.5}  y1={9.0}   x2={4.0}  y2={11.0} />
      <GlassPanel x1={4.0}  y1={11.0}  x2={0.0}  y2={APEX} />

      {/* Left side: 3 panels (mirrored X) */}
      <GlassPanel x1={-W}   y1={EAVE}  x2={-7.5} y2={9.0}  />
      <GlassPanel x1={-7.5} y1={9.0}   x2={-4.0} y2={11.0} />
      <GlassPanel x1={-4.0} y1={11.0}  x2={0.0}  y2={APEX} />

      {/* ── Side walls ── */}
      <GlassPanel x1={W}  y1={0} x2={W}  y2={EAVE} />
      <GlassPanel x1={-W} y1={0} x2={-W} y2={EAVE} />

      {/* ── Structural frame ── */}
      <GlazingBars />
      <Purlins />
      <EntranceFacade />
      <EndWall />
    </group>
  )
}
