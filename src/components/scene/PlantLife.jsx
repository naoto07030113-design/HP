import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─────────────────────────────────────────────────────────────────
// Color palette for botanical realism
// ─────────────────────────────────────────────────────────────────
const GREENS = [
  '#1e4018', '#2d6224', '#3a7a30', '#4a8c3a',
  '#246020', '#5a9848', '#6ab050', '#3d5a2a',
]

function randGreen(seed = 0) {
  return GREENS[seed % GREENS.length]
}

// ─────────────────────────────────────────────────────────────────
// Broad leaf — large tropical leaf as a curved plane
// ─────────────────────────────────────────────────────────────────
function BroadLeaf({ position, rotation, scale = 1, colorIdx = 0 }) {
  const geo = useMemo(() => {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.bezierCurveTo(-0.3, 0.8, -0.8, 1.8, 0, 3.0)
    shape.bezierCurveTo(0.8, 1.8, 0.3, 0.8, 0, 0)
    return new THREE.ShapeGeometry(shape, 8)
  }, [])

  return (
    <mesh
      position={position}
      rotation={rotation}
      scale={scale}
      geometry={geo}
      castShadow
    >
      <meshStandardMaterial
        color={randGreen(colorIdx)}
        side={THREE.DoubleSide}
        roughness={0.88}
        metalness={0}
      />
    </mesh>
  )
}

// ─────────────────────────────────────────────────────────────────
// Large tropical / elephant-ear plant
// ─────────────────────────────────────────────────────────────────
function TropicalPlant({ position, scale = 1, colorOffset = 0 }) {
  const groupRef = useRef()

  // Gentle leaf sway
  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime * 0.3 + colorOffset
    groupRef.current.rotation.y = Math.sin(t) * 0.015
    groupRef.current.children.forEach((child, i) => {
      child.rotation.z = Math.sin(t + i * 0.8) * 0.02
    })
  })

  const leaves = useMemo(() => [
    { pos: [0,   1.6, 0],    rot: [0.25,  0.0,  0.15], s: scale * 1.2, c: colorOffset     },
    { pos: [0.4, 1.2, 0.3],  rot: [0.35,  0.6,  0.1],  s: scale * 1.0, c: colorOffset + 1 },
    { pos: [-0.3,1.4,-0.2],  rot: [0.2,  -0.5,  0.2],  s: scale * 1.1, c: colorOffset + 2 },
    { pos: [0,   2.0, 0],    rot: [-0.1,  0.3,  0.0],  s: scale * 0.9, c: colorOffset + 3 },
    { pos: [-0.5,1.0, 0.1],  rot: [0.4,  -0.8, -0.1],  s: scale * 0.85,c: colorOffset + 1 },
    { pos: [0.2, 0.8,-0.3],  rot: [0.5,   0.4,  0.25], s: scale * 0.8, c: colorOffset + 4 },
  ], [scale, colorOffset])

  return (
    <group position={position} ref={groupRef}>
      {leaves.map((l, i) => (
        <BroadLeaf
          key={i}
          position={l.pos}
          rotation={l.rot}
          scale={l.s}
          colorIdx={l.c}
        />
      ))}
      {/* Stem */}
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.09, 1.2, 7]} />
        <meshStandardMaterial color="#2a3820" roughness={0.95} />
      </mesh>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Rounded shrub cluster
// ─────────────────────────────────────────────────────────────────
function Shrub({ position, scale = 1, colorOffset = 0 }) {
  const spheres = useMemo(() => [
    { p: [0,    0,    0],    s: 1.0,  c: 0 },
    { p: [0.55, 0.15, 0],   s: 0.72, c: 1 },
    { p: [-0.5, 0.12, 0.3], s: 0.78, c: 2 },
    { p: [0.15,-0.1, -0.45],s: 0.65, c: 0 },
    { p: [-0.2, 0.3,  0.2], s: 0.60, c: 3 },
    { p: [0.3,  0.2, -0.3], s: 0.55, c: 1 },
  ], [])

  return (
    <group position={position} scale={scale}>
      {spheres.map((sp, i) => (
        <mesh key={i} position={sp.p} castShadow>
          <sphereGeometry args={[sp.s, 8, 6]} />
          <meshStandardMaterial
            color={randGreen(colorOffset + sp.c)}
            roughness={0.92}
            metalness={0}
          />
        </mesh>
      ))}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Small tree / palm silhouette
// ─────────────────────────────────────────────────────────────────
function SmallTree({ position, scale = 1, colorOffset = 0 }) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.14, 3.0, 8]} />
        <meshStandardMaterial color="#2a2018" roughness={0.95} />
      </mesh>
      {/* Main canopy sphere */}
      <mesh position={[0, 3.5, 0]} castShadow>
        <sphereGeometry args={[1.4, 10, 8]} />
        <meshStandardMaterial
          color={randGreen(colorOffset)}
          roughness={0.9}
          metalness={0}
        />
      </mesh>
      {/* Secondary canopy bulges */}
      <mesh position={[0.8, 3.1, 0.3]} castShadow>
        <sphereGeometry args={[0.9, 8, 6]} />
        <meshStandardMaterial
          color={randGreen(colorOffset + 1)}
          roughness={0.9}
        />
      </mesh>
      <mesh position={[-0.7, 3.2, -0.4]} castShadow>
        <sphereGeometry args={[0.85, 8, 6]} />
        <meshStandardMaterial
          color={randGreen(colorOffset + 2)}
          roughness={0.9}
        />
      </mesh>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Tall columnar plant (like a Dracaena or Yucca)
// ─────────────────────────────────────────────────────────────────
function TallColumnPlant({ position, scale = 1, colorOffset = 0 }) {
  const fronds = useMemo(() => (
    Array.from({ length: 10 }, (_, i) => {
      const angle = (i / 10) * Math.PI * 2
      const tilt = 0.45 + Math.random() * 0.3
      return { angle, tilt }
    })
  ), [])

  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 2.0, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.18, 4.0, 8]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.95} />
      </mesh>
      {/* Fronds at the top */}
      {fronds.map((f, i) => (
        <mesh
          key={i}
          position={[
            Math.cos(f.angle) * 0.5,
            4.2,
            Math.sin(f.angle) * 0.5,
          ]}
          rotation={[
            f.tilt,
            f.angle,
            0,
          ]}
          castShadow
        >
          <planeGeometry args={[0.3, 2.2]} />
          <meshStandardMaterial
            color={randGreen(colorOffset + i)}
            side={THREE.DoubleSide}
            roughness={0.88}
          />
        </mesh>
      ))}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Dense ground cover patch
// ─────────────────────────────────────────────────────────────────
function GroundCover({ position, size = 3, density = 20, colorOffset = 0 }) {
  const patches = useMemo(() => (
    Array.from({ length: density }, (_, i) => ({
      x: (Math.random() - 0.5) * size,
      z: (Math.random() - 0.5) * size,
      s: 0.15 + Math.random() * 0.35,
      ry: Math.random() * Math.PI * 2,
      c: i % 5,
    }))
  ), [size, density])

  return (
    <group position={position}>
      {patches.map((p, i) => (
        <mesh key={i} position={[p.x, p.s * 0.4, p.z]} rotation={[0, p.ry, 0]}>
          <sphereGeometry args={[p.s, 6, 4]} />
          <meshStandardMaterial
            color={randGreen(colorOffset + p.c)}
            roughness={0.95}
          />
        </mesh>
      ))}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Wall climbing / hanging vine
// ─────────────────────────────────────────────────────────────────
function WallVine({ x, zStart, zEnd, side = 1 }) {
  const segments = useMemo(() => {
    const count = Math.floor(Math.abs(zEnd - zStart) / 2.5)
    return Array.from({ length: count }, (_, i) => {
      const z = zStart + (i / count) * (zEnd - zStart)
      const yBase = 0.5 + i * 0.3
      const yHeight = 0.8 + Math.random() * 1.5
      return { z, yBase: Math.min(yBase, 5.2), yHeight, idx: i }
    })
  }, [zStart, zEnd])

  return (
    <group>
      {segments.map((seg, i) => (
        <mesh
          key={i}
          position={[x, seg.yBase + seg.yHeight * 0.5, seg.z]}
          rotation={[
            (Math.random() - 0.5) * 0.4,
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.5,
          ]}
          castShadow
        >
          <sphereGeometry args={[0.18 + Math.random() * 0.12, 6, 5]} />
          <meshStandardMaterial
            color={randGreen(i + 2)}
            roughness={0.92}
          />
        </mesh>
      ))}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Scene 1 – Entrance planting
// ─────────────────────────────────────────────────────────────────
function EntrancePlanting() {
  return (
    <group>
      {/* Flanking large plants at the entrance */}
      <TropicalPlant position={[-9, 0, 5]}  scale={1.3} colorOffset={0} />
      <TropicalPlant position={[9,  0, 5]}  scale={1.2} colorOffset={3} />
      <TropicalPlant position={[-9, 0, 1]}  scale={1.0} colorOffset={1} />
      <TropicalPlant position={[9,  0, 1]}  scale={1.1} colorOffset={4} />
      <Shrub         position={[-8, 0, 3]}  scale={0.8} colorOffset={2} />
      <Shrub         position={[8,  0, 3]}  scale={0.9} colorOffset={5} />
      <GroundCover   position={[-9, 0, 3]}  size={2.5}  density={15}    colorOffset={0} />
      <GroundCover   position={[9,  0, 3]}  size={2.5}  density={15}    colorOffset={2} />
      <WallVine      x={-10.5} zStart={6} zEnd={-4} />
      <WallVine      x={10.5}  zStart={6} zEnd={-4} />
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Scene 2 – Grand Hall (large focal plants)
// ─────────────────────────────────────────────────────────────────
function GrandHallPlanting() {
  return (
    <group>
      {/* Large signature trees flanking the central path */}
      <SmallTree      position={[-8.5, 0, -8]}  scale={1.4} colorOffset={0} />
      <SmallTree      position={[8.5,  0, -8]}  scale={1.3} colorOffset={2} />
      <SmallTree      position={[-8,   0, -16]} scale={1.2} colorOffset={1} />
      <SmallTree      position={[8,    0, -16]} scale={1.5} colorOffset={3} />
      <TallColumnPlant position={[-9, 0, -12]} scale={1.0} colorOffset={1} />
      <TallColumnPlant position={[9,  0, -12]} scale={1.0} colorOffset={3} />
      <TropicalPlant  position={[-8.5, 0, -20]} scale={1.3} colorOffset={2} />
      <TropicalPlant  position={[8.5,  0, -20]} scale={1.4} colorOffset={5} />
      <TropicalPlant  position={[-9,   0, -5]}  scale={1.1} colorOffset={0} />
      <TropicalPlant  position={[9,    0, -5]}  scale={1.0} colorOffset={4} />

      {/* Dense shrub undergrowth */}
      <Shrub position={[-8, 0, -11]} scale={1.1} colorOffset={1} />
      <Shrub position={[8,  0, -11]} scale={1.0} colorOffset={3} />
      <Shrub position={[-7, 0, -17]} scale={0.9} colorOffset={0} />
      <Shrub position={[7,  0, -17]} scale={1.0} colorOffset={2} />

      {/* Ground cover */}
      <GroundCover position={[-9, 0, -10]} size={3} density={20} colorOffset={0} />
      <GroundCover position={[9,  0, -10]} size={3} density={20} colorOffset={2} />
      <GroundCover position={[-9, 0, -18]} size={3} density={18} colorOffset={1} />
      <GroundCover position={[9,  0, -18]} size={3} density={18} colorOffset={3} />

      <WallVine x={-10.5} zStart={-4} zEnd={-24} />
      <WallVine x={10.5}  zStart={-4} zEnd={-24} />
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Scene 3 – The Living Path (densest vegetation)
// ─────────────────────────────────────────────────────────────────
function LivingPathPlanting() {
  // Create a corridor feel with plants crowding both sides
  const zPositions = [-24, -27, -30, -33, -36, -39, -42]

  return (
    <group>
      {zPositions.map((z, i) => (
        <group key={i}>
          <TropicalPlant position={[-8.5, 0, z]}  scale={1.0 + i * 0.05}  colorOffset={i    } />
          <TropicalPlant position={[8.5,  0, z]}  scale={1.0 + i * 0.04}  colorOffset={i + 2} />
          <Shrub         position={[-8,   0, z+1.5]} scale={0.9}          colorOffset={i + 1} />
          <Shrub         position={[8,    0, z+1.5]} scale={0.85}         colorOffset={i + 3} />
          <GroundCover   position={[-9, 0, z+0.5]}   size={2.5} density={16} colorOffset={i} />
          <GroundCover   position={[9,  0, z+0.5]}   size={2.5} density={16} colorOffset={i+1} />
        </group>
      ))}
      <TallColumnPlant position={[-9, 0, -28]} scale={1.1} colorOffset={0} />
      <TallColumnPlant position={[9,  0, -34]} scale={1.0} colorOffset={2} />
      <SmallTree       position={[-8, 0, -38]} scale={1.2} colorOffset={1} />
      <SmallTree       position={[8,  0, -32]} scale={1.1} colorOffset={3} />
      <WallVine x={-10.5} zStart={-24} zEnd={-44} />
      <WallVine x={10.5}  zStart={-24} zEnd={-44} />
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Scene 4 – Cultivation (neat, productive plants)
// ─────────────────────────────────────────────────────────────────
function CultivationPlanting() {
  return (
    <group>
      {/* Background trees */}
      <SmallTree     position={[-9, 0, -46]} scale={1.0} colorOffset={0} />
      <SmallTree     position={[9,  0, -46]} scale={1.1} colorOffset={2} />
      <TropicalPlant position={[-9, 0, -55]} scale={1.1} colorOffset={1} />
      <TropicalPlant position={[9,  0, -55]} scale={1.0} colorOffset={4} />
      <TropicalPlant position={[-9, 0, -62]} scale={0.9} colorOffset={3} />
      <TropicalPlant position={[9,  0, -62]} scale={1.0} colorOffset={0} />
      <Shrub         position={[-8, 0, -50]} scale={0.8} colorOffset={2} />
      <Shrub         position={[8,  0, -50]} scale={0.8} colorOffset={1} />
      <GroundCover   position={[-9, 0, -52]} size={3} density={14} colorOffset={0} />
      <GroundCover   position={[9,  0, -52]} size={3} density={14} colorOffset={2} />
      <WallVine x={-10.5} zStart={-44} zEnd={-65} />
      <WallVine x={10.5}  zStart={-44} zEnd={-65} />
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Scene 5 – Reflection Hall (open, airy, elegant)
// ─────────────────────────────────────────────────────────────────
function ReflectionPlanting() {
  return (
    <group>
      {/* Graceful sentinel trees */}
      <SmallTree     position={[-8, 0, -66]} scale={1.5} colorOffset={0} />
      <SmallTree     position={[8,  0, -66]} scale={1.4} colorOffset={2} />
      <TallColumnPlant position={[-9, 0, -72]} scale={1.2} colorOffset={1} />
      <TallColumnPlant position={[9,  0, -72]} scale={1.2} colorOffset={3} />
      <TropicalPlant position={[-8.5, 0, -78]} scale={1.1} colorOffset={2} />
      <TropicalPlant position={[8.5,  0, -78]} scale={1.0} colorOffset={5} />
      <Shrub         position={[-7, 0, -69]} scale={0.9} colorOffset={1} />
      <Shrub         position={[7,  0, -69]} scale={0.9} colorOffset={3} />
      <GroundCover   position={[-9, 0, -74]} size={3} density={12} colorOffset={0} />
      <GroundCover   position={[9,  0, -74]} size={3} density={12} colorOffset={2} />
      <WallVine x={-10.5} zStart={-65} zEnd={-85} />
      <WallVine x={10.5}  zStart={-65} zEnd={-85} />
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Master plant life component
// ─────────────────────────────────────────────────────────────────
export default function PlantLife() {
  return (
    <group>
      <EntrancePlanting />
      <GrandHallPlanting />
      <LivingPathPlanting />
      <CultivationPlanting />
      <ReflectionPlanting />
    </group>
  )
}
