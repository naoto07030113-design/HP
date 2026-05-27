import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─────────────────────────────────────────────────────────────────
// Botanical color palette — Kew Gardens realism
// Deep, complex greens. Not saturated game-engine greens.
// ─────────────────────────────────────────────────────────────────
const LEAF_DARKS  = ['#1c3e18', '#234a1e', '#1e4220', '#283a18', '#1a3a16']
const LEAF_MIDS   = ['#2d6224', '#336828', '#2a6030', '#386a2a', '#2c6426']
const LEAF_BRIGHTS = ['#3a7830', '#428040', '#3a7248', '#4a8038', '#446040']
const BARK        = ['#2a2218', '#342a1c', '#2e2018', '#3a2820']
const SOIL        = ['#281a0c', '#301e10', '#2a1808']

function leafColor(type, idx) {
  const arr = type === 'dark' ? LEAF_DARKS : type === 'mid' ? LEAF_MIDS : LEAF_BRIGHTS
  return arr[idx % arr.length]
}

// ─────────────────────────────────────────────────────────────────
// Leaf plane — shapes a single leaf as a tapered quad
// ─────────────────────────────────────────────────────────────────
function makeLeafShape(length = 2.5, width = 0.9) {
  const shape = new THREE.Shape()
  const hw = width / 2
  shape.moveTo(0, 0)
  shape.bezierCurveTo(-hw * 1.1, length * 0.25, -hw, length * 0.65, 0, length)
  shape.bezierCurveTo(hw, length * 0.65, hw * 1.1, length * 0.25, 0, 0)
  return new THREE.ShapeGeometry(shape, 6)
}

// Cache a few leaf shapes for performance
const leafGeos = {
  large:  makeLeafShape(2.8, 1.1),
  medium: makeLeafShape(2.0, 0.82),
  small:  makeLeafShape(1.35, 0.6),
  narrow: makeLeafShape(1.8, 0.45),
}

// ─────────────────────────────────────────────────────────────────
// Tropical broad-leaf — elephant ear / Musa / Colocasia silhouette
// ─────────────────────────────────────────────────────────────────
function TropicalPlant({ position, scale = 1, seed = 0, animPhase = 0 }) {
  const groupRef = useRef()

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime * 0.25 + animPhase
    // Independent per-child sway — organic, not mechanical
    groupRef.current.children.forEach((child, i) => {
      if (child.isMesh) {
        child.rotation.z = child.userData.baseRotZ + Math.sin(t + i * 1.3) * 0.018
        child.rotation.x = child.userData.baseRotX + Math.sin(t * 0.7 + i * 0.9) * 0.012
      }
    })
  })

  const leaves = useMemo(() => [
    { geo: 'large',  pos: [0.0,  1.8, 0.0],  rx: 0.28, ry: 0.15, rz: 0.10,  type: 'dark',   idx: seed     },
    { geo: 'large',  pos: [0.4,  1.5, 0.3],  rx: 0.38, ry: 0.70, rz: 0.12,  type: 'mid',    idx: seed + 1 },
    { geo: 'large',  pos: [-0.35,1.6,-0.2],  rx: 0.22, ry:-0.60, rz:-0.08,  type: 'dark',   idx: seed + 2 },
    { geo: 'medium', pos: [0.1,  2.1, 0.0],  rx:-0.12, ry: 0.35, rz: 0.05,  type: 'mid',    idx: seed + 3 },
    { geo: 'medium', pos: [-0.5, 1.2, 0.4],  rx: 0.45, ry:-0.85, rz:-0.15,  type: 'bright', idx: seed     },
    { geo: 'medium', pos: [0.25, 0.9,-0.35], rx: 0.55, ry: 0.50, rz: 0.20,  type: 'dark',   idx: seed + 1 },
    { geo: 'small',  pos: [0.6,  0.7, 0.0],  rx: 0.60, ry: 1.10, rz: 0.25,  type: 'bright', idx: seed + 2 },
    { geo: 'small',  pos: [-0.2, 0.6,-0.5],  rx: 0.50, ry:-1.20, rz:-0.20,  type: 'mid',    idx: seed + 3 },
  ], [seed])

  return (
    <group position={position} scale={scale} ref={groupRef}>
      {leaves.map((l, i) => {
        const mesh = (
          <mesh
            key={i}
            position={l.pos}
            rotation={[l.rx, l.ry, l.rz]}
            geometry={leafGeos[l.geo]}
            castShadow
          >
            <meshStandardMaterial
              color={leafColor(l.type, l.idx)}
              side={THREE.DoubleSide}
              roughness={0.88}
              metalness={0}
            />
          </mesh>
        )
        // Store base rotations for animation
        return (
          <group key={i} userData={{ baseRotZ: l.rz, baseRotX: l.rx }}>
            <mesh
              position={l.pos}
              rotation={[l.rx, l.ry, l.rz]}
              geometry={leafGeos[l.geo]}
              castShadow
              userData={{ baseRotZ: l.rz, baseRotX: l.rx }}
            >
              <meshStandardMaterial
                color={leafColor(l.type, l.idx)}
                side={THREE.DoubleSide}
                roughness={0.88}
                metalness={0}
              />
            </mesh>
          </group>
        )
      })}
      {/* Petiole stem */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.075, 1.4, 6]} />
        <meshStandardMaterial color={BARK[seed % BARK.length]} roughness={0.96} />
      </mesh>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Shrub — dense organic cluster
// ─────────────────────────────────────────────────────────────────
function Shrub({ position, scale = 1, seed = 0 }) {
  const spheres = useMemo(() => [
    { p: [0,     0,     0],     s: 1.00, t: 'dark',   i: seed     },
    { p: [0.62,  0.18,  0],     s: 0.76, t: 'mid',    i: seed + 1 },
    { p: [-0.55, 0.14,  0.38],  s: 0.82, t: 'dark',   i: seed + 2 },
    { p: [0.20, -0.08, -0.50],  s: 0.68, t: 'mid',    i: seed + 3 },
    { p: [-0.28, 0.35,  0.22],  s: 0.62, t: 'bright', i: seed     },
    { p: [0.38,  0.25, -0.35],  s: 0.55, t: 'bright', i: seed + 1 },
    { p: [-0.18, 0.50, -0.12],  s: 0.48, t: 'mid',    i: seed + 2 },
    { p: [0.50, -0.05,  0.42],  s: 0.44, t: 'dark',   i: seed + 3 },
  ], [seed])

  return (
    <group position={position} scale={scale}>
      {spheres.map((sp, i) => (
        <mesh key={i} position={sp.p} castShadow>
          <sphereGeometry args={[sp.s, 9, 7]} />
          <meshStandardMaterial color={leafColor(sp.t, sp.i)} roughness={0.92} metalness={0} />
        </mesh>
      ))}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Canopy tree — multi-tier foliage, natural silhouette
// ─────────────────────────────────────────────────────────────────
function CanopyTree({ position, scale = 1, seed = 0 }) {
  const canopies = useMemo(() => [
    { p: [0,     3.8, 0],    s: 1.55, t: 'dark',   i: seed     },
    { p: [0.9,   3.4, 0.4],  s: 1.00, t: 'mid',    i: seed + 1 },
    { p: [-0.8,  3.5,-0.3],  s: 1.05, t: 'dark',   i: seed + 2 },
    { p: [0.3,   4.5, 0.2],  s: 0.80, t: 'bright', i: seed + 3 },
    { p: [-0.4,  4.3,-0.4],  s: 0.72, t: 'mid',    i: seed     },
    { p: [0.6,   2.9,-0.3],  s: 0.68, t: 'dark',   i: seed + 2 },
  ], [seed])

  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.16, 3.2, 8]} />
        <meshStandardMaterial color={BARK[seed % BARK.length]} roughness={0.95} />
      </mesh>
      {/* Lower trunk flare */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.20, 0.26, 0.4, 8]} />
        <meshStandardMaterial color={BARK[seed % BARK.length]} roughness={0.96} />
      </mesh>
      {/* Canopy layers */}
      {canopies.map((c, i) => (
        <mesh key={i} position={c.p} castShadow>
          <sphereGeometry args={[c.s, 10, 8]} />
          <meshStandardMaterial color={leafColor(c.t, c.i)} roughness={0.90} metalness={0} />
        </mesh>
      ))}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Columnar plant — Dracaena / Yucca crown
// ─────────────────────────────────────────────────────────────────
function ColumnarPlant({ position, scale = 1, seed = 0 }) {
  const fronds = useMemo(() => (
    Array.from({ length: 12 }, (_, i) => ({
      angle: (i / 12) * Math.PI * 2,
      tilt:  0.42 + (i % 3) * 0.12,
    }))
  ), [])

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 2.2, 0]} castShadow>
        <cylinderGeometry args={[0.10, 0.18, 4.4, 8]} />
        <meshStandardMaterial color={BARK[seed % BARK.length]} roughness={0.96} />
      </mesh>
      {fronds.map((f, i) => (
        <mesh
          key={i}
          position={[Math.cos(f.angle) * 0.4, 4.5, Math.sin(f.angle) * 0.4]}
          rotation={[f.tilt, f.angle, 0]}
          geometry={leafGeos.narrow}
          castShadow
        >
          <meshStandardMaterial
            color={leafColor('mid', seed + i)}
            side={THREE.DoubleSide}
            roughness={0.88}
          />
        </mesh>
      ))}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Fern — low, feathery, ground-level texture
// ─────────────────────────────────────────────────────────────────
function Fern({ position, scale = 1, seed = 0 }) {
  const fronds = useMemo(() => (
    Array.from({ length: 9 }, (_, i) => ({
      angle: (i / 9) * Math.PI * 2,
      tilt:  0.55 + (i % 4) * 0.1,
      len:   1.1 + (i % 3) * 0.25,
    }))
  ), [])

  return (
    <group position={position} scale={scale}>
      {fronds.map((f, i) => (
        <mesh
          key={i}
          position={[Math.cos(f.angle) * 0.2, 0.15, Math.sin(f.angle) * 0.2]}
          rotation={[f.tilt, f.angle, 0]}
          castShadow
        >
          <planeGeometry args={[0.28, f.len]} />
          <meshStandardMaterial
            color={leafColor('bright', seed + i)}
            side={THREE.DoubleSide}
            roughness={0.90}
          />
        </mesh>
      ))}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Dense ground cover patch — layered low vegetation
// ─────────────────────────────────────────────────────────────────
function GroundCover({ position, size = 3, density = 25, seed = 0 }) {
  const items = useMemo(() => (
    Array.from({ length: density }, (_, i) => ({
      x:  (Math.random() - 0.5) * size,
      z:  (Math.random() - 0.5) * size,
      s:  0.12 + (i % 5) * 0.06,
      ry: Math.random() * Math.PI * 2,
      t:  i % 3 === 0 ? 'bright' : i % 3 === 1 ? 'mid' : 'dark',
      c:  i % 5,
    }))
  ), [size, density, seed])

  return (
    <group position={position}>
      {items.map((p, i) => (
        <mesh key={i} position={[p.x, p.s * 0.5, p.z]} rotation={[0, p.ry, 0]} castShadow>
          <sphereGeometry args={[p.s, 6, 4]} />
          <meshStandardMaterial color={leafColor(p.t, seed + p.c)} roughness={0.94} />
        </mesh>
      ))}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Hanging plant basket — suspended from the roof structure
// ─────────────────────────────────────────────────────────────────
function HangingBasket({ position, seed = 0 }) {
  const trails = useMemo(() => (
    Array.from({ length: 10 }, (_, i) => {
      const angle = (i / 10) * Math.PI * 2
      const r = 0.2 + (i % 3) * 0.08
      return { angle, r, len: 0.5 + (i % 4) * 0.2 }
    })
  ), [])

  return (
    <group position={position}>
      {/* Basket pot */}
      <mesh>
        <cylinderGeometry args={[0.22, 0.18, 0.18, 8]} />
        <meshStandardMaterial color="#6a5040" roughness={0.9} />
      </mesh>
      {/* Trailing vines */}
      {trails.map((t, i) => (
        <group key={i}>
          {Array.from({ length: 4 }, (_, j) => (
            <mesh
              key={j}
              position={[
                Math.cos(t.angle) * t.r,
                -0.15 - j * t.len * 0.5,
                Math.sin(t.angle) * t.r,
              ]}
              castShadow
            >
              <sphereGeometry args={[0.10 + (j % 2) * 0.04, 5, 4]} />
              <meshStandardMaterial color={leafColor('bright', seed + i + j)} roughness={0.92} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Hanging chain */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 1.2, 4]} />
        <meshStandardMaterial color="#8a7868" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Wall climbing vine cluster
// ─────────────────────────────────────────────────────────────────
function WallVines({ x, zStart, zEnd, seed = 0 }) {
  const count = Math.floor(Math.abs(zEnd - zStart) / 2.2)

  return (
    <group>
      {Array.from({ length: count }, (_, i) => {
        const z = zStart + (i / count) * (zEnd - zStart)
        const yBase = 0.4 + (i * 0.22) % 5.0
        return (
          <group key={i}>
            <mesh position={[x, yBase, z]} castShadow>
              <sphereGeometry args={[0.16 + (i % 3) * 0.06, 6, 5]} />
              <meshStandardMaterial
                color={leafColor(i % 3 === 0 ? 'bright' : 'mid', seed + i)}
                roughness={0.93}
              />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Scene plant clusters — utility for dense placement
// ─────────────────────────────────────────────────────────────────
function PlantRow({ zValues, xL = -8.5, xR = 8.5, seed = 0 }) {
  return (
    <group>
      {zValues.map((z, i) => (
        <group key={i}>
          <TropicalPlant position={[xL, 0, z]}       scale={1.0 + (i % 3) * 0.12} seed={seed + i    } animPhase={i * 0.7} />
          <TropicalPlant position={[xR, 0, z]}       scale={1.0 + (i % 3) * 0.10} seed={seed + i + 4} animPhase={i * 0.9} />
          <Fern          position={[xL - 0.8, 0, z + 0.8]} scale={0.9}           seed={seed + i + 1} />
          <Fern          position={[xR + 0.8, 0, z + 0.8]} scale={0.85}          seed={seed + i + 2} />
          <GroundCover   position={[xL, 0, z]}       size={2.2} density={18}       seed={seed + i    } />
          <GroundCover   position={[xR, 0, z]}       size={2.2} density={18}       seed={seed + i + 2} />
        </group>
      ))}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// All 5 scenes worth of plant life
// ─────────────────────────────────────────────────────────────────
export default function PlantLife() {
  return (
    <group>
      {/* ── Scene 1: Entrance ── */}
      <TropicalPlant position={[-9, 0,  6]} scale={1.4} seed={0} animPhase={0.0} />
      <TropicalPlant position={[ 9, 0,  6]} scale={1.3} seed={3} animPhase={1.1} />
      <TropicalPlant position={[-9, 0,  2]} scale={1.1} seed={1} animPhase={0.5} />
      <TropicalPlant position={[ 9, 0,  2]} scale={1.2} seed={5} animPhase={1.7} />
      <Shrub         position={[-8, 0,  4]} scale={0.9} seed={2} />
      <Shrub         position={[ 8, 0,  4]} scale={0.9} seed={6} />
      <Fern          position={[-8.5,0, 5.5]} scale={1.0} seed={1} />
      <Fern          position={[ 8.5,0, 5.5]} scale={0.9} seed={4} />
      <GroundCover   position={[-9, 0,  4]} size={3}   density={22} seed={0} />
      <GroundCover   position={[ 9, 0,  4]} size={3}   density={22} seed={2} />
      <WallVines     x={-10.5} zStart={6}  zEnd={-4}  seed={0} />
      <WallVines     x={ 10.5} zStart={6}  zEnd={-4}  seed={4} />

      {/* ── Scene 2: Grand Hall — focal specimen trees ── */}
      <CanopyTree    position={[-8.5, 0, -8]}  scale={1.5} seed={0} />
      <CanopyTree    position={[ 8.5, 0, -8]}  scale={1.4} seed={2} />
      <CanopyTree    position={[-8,   0,-17]}  scale={1.3} seed={1} />
      <CanopyTree    position={[ 8,   0,-17]}  scale={1.5} seed={3} />
      <ColumnarPlant position={[-9,   0,-12]}  scale={1.1} seed={1} />
      <ColumnarPlant position={[ 9,   0,-12]}  scale={1.1} seed={3} />
      <TropicalPlant position={[-8.5, 0,-21]}  scale={1.3} seed={4} animPhase={2.1} />
      <TropicalPlant position={[ 8.5, 0,-21]}  scale={1.4} seed={7} animPhase={0.8} />
      <TropicalPlant position={[-9,   0, -4]}  scale={1.1} seed={2} animPhase={1.4} />
      <TropicalPlant position={[ 9,   0, -4]}  scale={1.0} seed={6} animPhase={2.6} />
      <Shrub         position={[-8,   0,-11]}  scale={1.1} seed={1} />
      <Shrub         position={[ 8,   0,-11]}  scale={1.0} seed={4} />
      <Shrub         position={[-7.5, 0,-18]}  scale={0.9} seed={2} />
      <Shrub         position={[ 7.5, 0,-18]}  scale={1.0} seed={5} />
      <Fern          position={[-8,   0,-14]}  scale={1.1} seed={0} />
      <Fern          position={[ 8,   0,-14]}  scale={1.0} seed={3} />
      <Fern          position={[-8.5, 0,-20]}  scale={0.9} seed={1} />
      <Fern          position={[ 8.5, 0,-20]}  scale={1.0} seed={4} />
      <GroundCover   position={[-8.5, 0,-10]}  size={3} density={24} seed={0} />
      <GroundCover   position={[ 8.5, 0,-10]}  size={3} density={24} seed={2} />
      <GroundCover   position={[-8.5, 0,-19]}  size={3} density={22} seed={1} />
      <GroundCover   position={[ 8.5, 0,-19]}  size={3} density={22} seed={3} />
      <WallVines     x={-10.5} zStart={-4}  zEnd={-24} seed={2} />
      <WallVines     x={ 10.5} zStart={-4}  zEnd={-24} seed={6} />
      {/* Hanging baskets */}
      <HangingBasket position={[-5, 9.5, -10]} seed={0} />
      <HangingBasket position={[ 5, 9.5, -10]} seed={3} />
      <HangingBasket position={[-5, 9.5, -18]} seed={1} />
      <HangingBasket position={[ 5, 9.5, -18]} seed={4} />

      {/* ── Scene 3: Living Path — maximum density ── */}
      <PlantRow
        zValues={[-25, -28, -31, -34, -37, -40]}
        seed={10}
      />
      <CanopyTree    position={[-8.5, 0,-27]}  scale={1.2} seed={5} />
      <CanopyTree    position={[ 8.5, 0,-34]}  scale={1.1} seed={7} />
      <ColumnarPlant position={[-9,   0,-30]}  scale={1.0} seed={4} />
      <ColumnarPlant position={[ 9,   0,-37]}  scale={1.0} seed={6} />
      <WallVines     x={-10.5} zStart={-24} zEnd={-44} seed={8} />
      <WallVines     x={ 10.5} zStart={-24} zEnd={-44} seed={12} />
      <HangingBasket position={[ 0, 9.5, -30]} seed={2} />
      <HangingBasket position={[-5, 9.5, -36]} seed={5} />
      <HangingBasket position={[ 5, 9.5, -36]} seed={7} />

      {/* ── Scene 4: Cultivation — ordered but lush backdrop ── */}
      <CanopyTree    position={[-8.5, 0,-47]}  scale={1.1} seed={0} />
      <CanopyTree    position={[ 8.5, 0,-47]}  scale={1.2} seed={2} />
      <TropicalPlant position={[-9,   0,-55]}  scale={1.2} seed={3} animPhase={1.0} />
      <TropicalPlant position={[ 9,   0,-55]}  scale={1.1} seed={6} animPhase={2.2} />
      <TropicalPlant position={[-9,   0,-63]}  scale={1.0} seed={1} animPhase={0.6} />
      <TropicalPlant position={[ 9,   0,-63]}  scale={1.1} seed={5} animPhase={1.8} />
      <Shrub         position={[-8,   0,-51]}  scale={0.8} seed={2} />
      <Shrub         position={[ 8,   0,-51]}  scale={0.85} seed={4} />
      <Fern          position={[-8.5, 0,-58]}  scale={1.0} seed={2} />
      <Fern          position={[ 8.5, 0,-58]}  scale={0.9} seed={5} />
      <GroundCover   position={[-9,   0,-53]}  size={3} density={18} seed={0} />
      <GroundCover   position={[ 9,   0,-53]}  size={3} density={18} seed={2} />
      <WallVines     x={-10.5} zStart={-44} zEnd={-66} seed={6} />
      <WallVines     x={ 10.5} zStart={-44} zEnd={-66} seed={10} />

      {/* ── Scene 5: Reflection Hall — open, majestic ── */}
      <CanopyTree    position={[-8.5, 0,-67]}  scale={1.6} seed={1} />
      <CanopyTree    position={[ 8.5, 0,-67]}  scale={1.5} seed={3} />
      <ColumnarPlant position={[-9,   0,-73]}  scale={1.3} seed={2} />
      <ColumnarPlant position={[ 9,   0,-73]}  scale={1.3} seed={4} />
      <TropicalPlant position={[-8.5, 0,-80]}  scale={1.2} seed={5} animPhase={0.4} />
      <TropicalPlant position={[ 8.5, 0,-80]}  scale={1.1} seed={7} animPhase={1.6} />
      <Shrub         position={[-7.5, 0,-70]}  scale={1.0} seed={1} />
      <Shrub         position={[ 7.5, 0,-70]}  scale={1.0} seed={3} />
      <Fern          position={[-8,   0,-75]}  scale={1.2} seed={0} />
      <Fern          position={[ 8,   0,-75]}  scale={1.1} seed={2} />
      <GroundCover   position={[-9,   0,-75]}  size={3} density={15} seed={0} />
      <GroundCover   position={[ 9,   0,-75]}  size={3} density={15} seed={2} />
      <WallVines     x={-10.5} zStart={-66} zEnd={-86} seed={4} />
      <WallVines     x={ 10.5} zStart={-66} zEnd={-86} seed={8} />
      <HangingBasket position={[-4, 9.5, -70]} seed={3} />
      <HangingBasket position={[ 4, 9.5, -70]} seed={6} />
    </group>
  )
}
