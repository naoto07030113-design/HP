import { useMemo } from 'react'
import * as THREE from 'three'

// ─────────────────────────────────────────────────────────────────
// Greenhouse structural constants
// Victorian-style palm house proportions — like Kew's Temperate House
// ─────────────────────────────────────────────────────────────────
const W     = 11       // half-width (22 total interior)
const EAVE  = 5.5      // eave / wall-top height
const APEX  = 12.0     // ridge apex
const Z_NEAR = 8.0     // greenhouse near face
const Z_FAR  = -90.0   // far end
const DEPTH  = Z_NEAR - Z_FAR

// Arch cross-section — right side
const ARCH_R = [
  [W,      EAVE ],   // eave
  [7.5,    9.0  ],   // lower shoulder
  [4.0,    11.0 ],   // upper shoulder
  [0.0,    APEX ],   // ridge
]

// ─────────────────────────────────────────────────────────────────
// Flat glass panel — custom quad between two XY cross-section pts
// ─────────────────────────────────────────────────────────────────
function makeQuadPanel(x1, y1, x2, y2, zNear, zFar) {
  const positions = new Float32Array([
    x1, y1, zNear,  x1, y1, zFar,   x2, y2, zFar,
    x1, y1, zNear,  x2, y2, zFar,   x2, y2, zNear,
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
// Glass panel — near-invisible, just catches reflections
// Real Victorian greenhouse glass: clear, slightly warm tint
// ─────────────────────────────────────────────────────────────────
function GlassPanel({ x1, y1, x2, y2 }) {
  const geometry = useMemo(
    () => makeQuadPanel(x1, y1, x2, y2, Z_NEAR, Z_FAR),
    [x1, y1, x2, y2]
  )
  return (
    <mesh geometry={geometry} renderOrder={2}>
      <meshStandardMaterial
        color="#e0ede0"
        transparent
        opacity={0.055}
        roughness={0.02}
        metalness={0.05}
        envMapIntensity={4}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

// ─────────────────────────────────────────────────────────────────
// Structural arch rib — the load-bearing cast-iron/steel arches
// Typical Victorian greenhouse: white-painted iron
// ─────────────────────────────────────────────────────────────────
function ArchRib({ zPos }) {
  const segs = useMemo(() => {
    const s = []
    for (let i = 0; i < ARCH_R.length - 1; i++) {
      const [x1, y1] = ARCH_R[i]
      const [x2, y2] = ARCH_R[i + 1]
      s.push({ x1, y1, x2, y2 })
      if (x1 !== 0) s.push({ x1: -x1, y1, x2: -x2, y2 })
    }
    // Eave to ground columns
    s.push({ x1: W, y1: 0, x2: W, y2: EAVE })
    s.push({ x1: -W, y1: 0, x2: -W, y2: EAVE })
    return s
  }, [])

  const mat = <meshStandardMaterial color="#d8d4cc" metalness={0.58} roughness={0.38} />

  return (
    <group position={[0, 0, zPos]}>
      {segs.map((seg, i) => {
        const dx = seg.x2 - seg.x1
        const dy = seg.y2 - seg.y1
        const len = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx)
        return (
          <mesh key={i} position={[(seg.x1 + seg.x2) / 2, (seg.y1 + seg.y2) / 2, 0]} rotation={[0, 0, angle]}>
            <boxGeometry args={[len, 0.11, 0.11]} />
            {mat}
          </mesh>
        )
      })}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Longitudinal purlins + ridge + eave beams
// ─────────────────────────────────────────────────────────────────
function Purlins() {
  const rails = [
    { x:  W,    y: EAVE  },  // right eave
    { x: -W,    y: EAVE  },  // left eave
    { x:  7.5,  y: 9.0   },  // right mid purlin
    { x: -7.5,  y: 9.0   },  // left mid purlin
    { x:  4.0,  y: 11.0  },  // right upper
    { x: -4.0,  y: 11.0  },  // left upper
    { x:  0.0,  y: APEX  },  // ridge
    { x:  W,    y: 0.18  },  // right base
    { x: -W,    y: 0.18  },  // left base
    // Quarter purlins between ribs
    { x:  9.0,  y: 7.0   },
    { x: -9.0,  y: 7.0   },
    { x:  5.8,  y: 10.1  },
    { x: -5.8,  y: 10.1  },
    { x:  2.0,  y: 11.65 },
    { x: -2.0,  y: 11.65 },
  ]

  const zCenter = (Z_NEAR + Z_FAR) / 2

  return (
    <group>
      {rails.map((r, i) => (
        <mesh key={i} position={[r.x, r.y, zCenter]}>
          <boxGeometry args={[0.09, 0.09, DEPTH]} />
          <meshStandardMaterial color="#d8d4cc" metalness={0.58} roughness={0.38} />
        </mesh>
      ))}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Entrance facade — arched glass front wall
// ─────────────────────────────────────────────────────────────────
function EntranceFacade() {
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

    // Central arched door opening
    const door = new THREE.Path()
    const dw = 3.2
    door.moveTo(-dw, 0)
    door.lineTo(-dw, 4.2)
    door.absarc(0, 4.2, dw, Math.PI, 0, true)
    door.lineTo(dw, 0)
    door.closePath()
    shape.holes.push(door)

    return new THREE.ShapeGeometry(shape)
  }, [])

  return (
    <group position={[0, 0, Z_NEAR]}>
      <mesh geometry={entranceGeo} renderOrder={2}>
        <meshStandardMaterial
          color="#e0ede0"
          transparent
          opacity={0.07}
          roughness={0.02}
          metalness={0.05}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Entrance arch frame */}
      {ARCH_R.slice(0, -1).map((_, i) => {
        const [x1, y1] = ARCH_R[i]; const [x2, y2] = ARCH_R[i + 1]
        const len = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
        const ang = Math.atan2(y2 - y1, x2 - x1)
        return (
          <group key={i}>
            <mesh position={[(x1 + x2) / 2, (y1 + y2) / 2, 0]} rotation={[0, 0, ang]}>
              <boxGeometry args={[len, 0.11, 0.11]} />
              <meshStandardMaterial color="#d8d4cc" metalness={0.58} roughness={0.38} />
            </mesh>
            <mesh position={[-(x1 + x2) / 2, (y1 + y2) / 2, 0]} rotation={[0, 0, -ang]}>
              <boxGeometry args={[len, 0.11, 0.11]} />
              <meshStandardMaterial color="#d8d4cc" metalness={0.58} roughness={0.38} />
            </mesh>
          </group>
        )
      })}
      {/* Wall columns */}
      <mesh position={[W, EAVE / 2, 0]}>
        <boxGeometry args={[0.11, EAVE, 0.11]} />
        <meshStandardMaterial color="#d8d4cc" metalness={0.58} roughness={0.38} />
      </mesh>
      <mesh position={[-W, EAVE / 2, 0]}>
        <boxGeometry args={[0.11, EAVE, 0.11]} />
        <meshStandardMaterial color="#d8d4cc" metalness={0.58} roughness={0.38} />
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
    shape.moveTo(-W, 0); shape.lineTo(-W, EAVE)
    shape.lineTo(-7.5, 9.0); shape.lineTo(-4.0, 11.0)
    shape.lineTo(0.0, APEX)
    shape.lineTo(4.0, 11.0); shape.lineTo(7.5, 9.0)
    shape.lineTo(W, EAVE); shape.lineTo(W, 0)
    shape.closePath()
    return new THREE.ShapeGeometry(shape)
  }, [])

  return (
    <group position={[0, 0, Z_FAR]}>
      <mesh geometry={geo} renderOrder={2}>
        <meshStandardMaterial
          color="#e0ede0"
          transparent
          opacity={0.06}
          roughness={0.02}
          metalness={0.04}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Arch ribs — every 5 units (desktop) or 10 units (mobile)
// ─────────────────────────────────────────────────────────────────
function AllArchRibs({ isMobile }) {
  const spacing = isMobile ? 10 : 5
  const count   = Math.floor(DEPTH / spacing)
  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <ArchRib key={i} zPos={Z_NEAR - (i + 0.5) * spacing} />
      ))}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Main greenhouse shell
// ─────────────────────────────────────────────────────────────────
export default function GreenhouseShell({ isMobile = false }) {
  return (
    <group>
      {/* Glass roof panels */}
      <GlassPanel x1={W}    y1={EAVE}  x2={7.5}  y2={9.0}  />
      <GlassPanel x1={7.5}  y1={9.0}   x2={4.0}  y2={11.0} />
      <GlassPanel x1={4.0}  y1={11.0}  x2={0.0}  y2={APEX} />
      <GlassPanel x1={-W}   y1={EAVE}  x2={-7.5} y2={9.0}  />
      <GlassPanel x1={-7.5} y1={9.0}   x2={-4.0} y2={11.0} />
      <GlassPanel x1={-4.0} y1={11.0}  x2={0.0}  y2={APEX} />

      {/* Side walls */}
      <GlassPanel x1={W}  y1={0} x2={W}  y2={EAVE} />
      <GlassPanel x1={-W} y1={0} x2={-W} y2={EAVE} />

      {/* Structural steel */}
      <AllArchRibs isMobile={isMobile} />
      <Purlins />
      <EntranceFacade />
      <EndWall />
    </group>
  )
}
