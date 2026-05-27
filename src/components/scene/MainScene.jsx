import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { MeshReflectorMaterial, SoftShadows } from '@react-three/drei'
import {
  EffectComposer,
  Bloom,
  DepthOfField,
  Vignette,
  ChromaticAberration,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

// Soft PCF shadows — called once at module level

// ── Volumetric light shaft (two crossed gradient planes) ──────────
function LightShaft({ x, z }) {
  const tex = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    const g = ctx.createLinearGradient(0, 0, 0, 256)
    g.addColorStop(0,    'rgba(205, 255, 70, 0.20)')
    g.addColorStop(0.45, 'rgba(205, 255, 70, 0.06)')
    g.addColorStop(1,    'rgba(205, 255, 70, 0.00)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 64, 256)
    return new THREE.CanvasTexture(canvas)
  }, [])

  return (
    <group position={[x, 0.45, z]}>
      {[0, Math.PI / 2].map((ry, i) => (
        <mesh key={i} rotation={[0, ry, 0]}>
          <planeGeometry args={[0.26, 3.8]} />
          <meshBasicMaterial
            map={tex}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

// ── Polished mirror floor (MeshReflectorMaterial) ─────────────────
function CorridorFloor() {
  const gridH = useMemo(() =>
    Array.from({ length: 58 }, (_, i) =>
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-3.5, 0, -i),
        new THREE.Vector3(3.5,  0, -i),
      ])
    ), [])
  const gridV = useMemo(() =>
    Array.from({ length: 8 }, (_, i) =>
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-3.5 + i, 0,   0),
        new THREE.Vector3(-3.5 + i, 0, -57),
      ])
    ), [])

  return (
    <group>
      {/* Reflective floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, -27]}>
        <planeGeometry args={[7.5, 58]} />
        <MeshReflectorMaterial
          blur={[500, 150]}
          resolution={512}
          mixBlur={1.5}
          mixStrength={2.4}
          roughness={0.1}
          depthScale={1.4}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#EDECEA"
          metalness={0.07}
        />
      </mesh>
      {/* Subtle tile grid overlay */}
      <group position={[0, -1.392, 0]}>
        {gridH.map((geo, i) => (
          <line key={`h${i}`} geometry={geo}>
            <lineBasicMaterial color="#BCBAB4" transparent opacity={0.16} />
          </line>
        ))}
        {gridV.map((geo, i) => (
          <line key={`v${i}`} geometry={geo}>
            <lineBasicMaterial color="#BCBAB4" transparent opacity={0.16} />
          </line>
        ))}
      </group>
    </group>
  )
}

// ── Walls: wainscoting + panel rails + cove light ─────────────────
function CorridorWall({ side }) {
  const x    = side === 'left' ? -3.55 : 3.55
  const rotY = side === 'left' ?  Math.PI / 2 : -Math.PI / 2
  const panels = useMemo(() =>
    Array.from({ length: 22 }, (_, i) => -1.5 - i * 2.6), [])

  return (
    <group>
      {/* Upper wall */}
      <mesh position={[x, 1.1, -27]} rotation={[0, rotY, 0]} receiveShadow>
        <planeGeometry args={[57, 2.5]} />
        <meshStandardMaterial color="#F3F2EC" roughness={0.97} metalness={0} />
      </mesh>
      {/* Wainscoting lower wall */}
      <mesh position={[x, -0.45, -27]} rotation={[0, rotY, 0]}>
        <planeGeometry args={[57, 1.9]} />
        <meshStandardMaterial color="#EAE8E2" roughness={0.98} metalness={0} />
      </mesh>

      {/* Chair rail */}
      <mesh position={[x * 0.9965, 0.32, -27]}>
        <boxGeometry args={[0.055, 0.1, 57]} />
        <meshStandardMaterial color="#D5D2CB" roughness={0.88} metalness={0.06} />
      </mesh>

      {/* Panel vertical dividers */}
      {panels.map((z, i) => (
        <mesh key={`pv${i}`} position={[x * 0.9965, -0.18, z]}>
          <boxGeometry args={[0.038, 2.2, 0.12]} />
          <meshStandardMaterial color="#DDDAD2" roughness={0.94} />
        </mesh>
      ))}
      {/* Panel top rails */}
      {panels.map((z, i) => (
        <mesh key={`pt${i}`} position={[x * 0.9965, 1.55, z]}>
          <boxGeometry args={[0.038, 0.055, 2.05]} />
          <meshStandardMaterial color="#DDDAD2" roughness={0.94} />
        </mesh>
      ))}
      {/* Panel bottom rails */}
      {panels.map((z, i) => (
        <mesh key={`pb${i}`} position={[x * 0.9965, -0.9, z]}>
          <boxGeometry args={[0.038, 0.055, 2.05]} />
          <meshStandardMaterial color="#DDDAD2" roughness={0.94} />
        </mesh>
      ))}

      {/* Green baseboard brand strip */}
      <mesh position={[x * 0.9955, -1.22, -27]}>
        <boxGeometry args={[0.032, 0.22, 57]} />
        <meshStandardMaterial
          color="#6AB628"
          emissive="#6AB628"
          emissiveIntensity={0.34}
          roughness={0.28}
        />
      </mesh>

      {/* Crown molding */}
      <mesh position={[x * 0.9955, 2.12, -27]}>
        <boxGeometry args={[0.055, 0.13, 57]} />
        <meshStandardMaterial color="#E5E3DC" roughness={0.93} metalness={0.02} />
      </mesh>

      {/* Cove light — junction glow */}
      <mesh position={[x * 0.9948, 2.205, -27]}>
        <boxGeometry args={[0.028, 0.055, 57]} />
        <meshStandardMaterial
          color="#D8FF88"
          emissive="#CCFF68"
          emissiveIntensity={0.9}
          roughness={0.22}
        />
      </mesh>
    </group>
  )
}

// ── Ceiling with troffers ─────────────────────────────────────────
function CorridorCeiling() {
  const lightZs = [-3, -10, -18, -26, -34, -42, -50]

  return (
    <group>
      {/* Ceiling plane */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 2.3, -27]}>
        <planeGeometry args={[7.5, 58]} />
        <meshStandardMaterial color="#F4F3EF" roughness={0.97} />
      </mesh>

      {[-1.6, 1.6].map((sx, si) => (
        <group key={si}>
          {/* Metal troffer housing */}
          <mesh position={[sx, 2.275, -27]}>
            <boxGeometry args={[0.24, 0.055, 55]} />
            <meshStandardMaterial color="#D8D7D0" roughness={0.45} metalness={0.2} />
          </mesh>
          {/* Emissive diffuser strip */}
          <mesh position={[sx, 2.302, -27]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.15, 54]} />
            <meshBasicMaterial color="#ECFF88" transparent opacity={0.98} />
          </mesh>
          {/* Point lights */}
          {lightZs.map((z, li) => (
            <pointLight
              key={li}
              position={[sx, 2.1, z]}
              color="#D0FF48"
              intensity={1.35}
              distance={9.5}
              decay={2}
            />
          ))}
        </group>
      ))}
    </group>
  )
}

// ── Clinic room entrance — architectural detail ───────────────────
function ClinicRoom({ z, side, warmColor = '#FFB050' }) {
  const glowRef = useRef()
  const x       = side === 'left' ? -3.55 :  3.55
  const roomX   = side === 'left' ? -5.4  :  5.4
  const rotY    = side === 'left' ? Math.PI / 2 : -Math.PI / 2
  const doorW   = 2.4
  const doorH   = 3.15
  const acc     = '#6AB628'

  useFrame(({ clock }) => {
    if (!glowRef.current) return
    glowRef.current.intensity = 3.0 + Math.sin(clock.elapsedTime * 0.48) * 0.32
  })

  return (
    <group position={[0, 0, z]}>
      {/* Door surround — thick wood frame */}
      {[-doorW / 2, doorW / 2].map((dz, i) => (
        <mesh key={i} position={[x * 0.993, 0.28, dz]} castShadow receiveShadow>
          <boxGeometry args={[0.14, doorH + 0.3, 0.24]} />
          <meshStandardMaterial color="#60401C" roughness={0.62} metalness={0.06} />
        </mesh>
      ))}
      <mesh position={[x * 0.993, doorH / 2 - 0.22, 0]} castShadow>
        <boxGeometry args={[0.14, 0.26, doorW + 0.32]} />
        <meshStandardMaterial color="#60401C" roughness={0.62} metalness={0.06} />
      </mesh>
      {/* Threshold sill */}
      <mesh position={[x * 0.992, -1.34, 0]}>
        <boxGeometry args={[0.09, 0.06, doorW + 0.32]} />
        <meshStandardMaterial color="#886640" roughness={0.45} metalness={0.28} />
      </mesh>

      {/* Glass — upper clear */}
      <mesh position={[x * 0.99, 0.65, 0]} rotation={[0, rotY, 0]}>
        <planeGeometry args={[doorW, doorH * 0.68]} />
        <meshPhysicalMaterial
          color="#E8F6E8"
          roughness={0.02}
          metalness={0}
          transmission={0.88}
          ior={1.52}
          thickness={0.05}
          transparent
          opacity={0.93}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Glass — lower frosted */}
      <mesh position={[x * 0.99, -0.75, 0]} rotation={[0, rotY, 0]}>
        <planeGeometry args={[doorW, doorH * 0.27]} />
        <meshPhysicalMaterial
          color="#E2F2E2"
          roughness={0.45}
          metalness={0}
          transmission={0.48}
          ior={1.52}
          transparent
          opacity={0.97}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Door handle bar */}
      <mesh position={[x * 0.988, -0.08, side === 'left' ? -0.52 : 0.52]}>
        <boxGeometry args={[0.02, 0.04, 0.25]} />
        <meshStandardMaterial color="#A89880" roughness={0.12} metalness={0.92} />
      </mesh>

      {/* Room interior box */}
      <mesh position={[roomX, 0.42, 0]}>
        <boxGeometry args={[2.0, doorH, doorW]} />
        <meshStandardMaterial
          color={warmColor}
          emissive={warmColor}
          emissiveIntensity={0.42}
          roughness={0.94}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Furniture silhouettes */}
      {/* Examination table */}
      <mesh position={[roomX * 0.7, -0.9, -0.2]}>
        <boxGeometry args={[1.25, 0.09, 0.55]} />
        <meshStandardMaterial color="#22160A" roughness={0.88} emissive="#180E06" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[roomX * 0.7, -1.2, -0.2]}>
        <boxGeometry args={[0.52, 0.55, 0.06]} />
        <meshStandardMaterial color="#22160A" roughness={0.88} emissive="#180E06" emissiveIntensity={0.4} />
      </mesh>
      {/* Storage cabinet */}
      <mesh position={[roomX * 0.9, -0.32, 0.62]}>
        <boxGeometry args={[0.38, 1.55, 0.36]} />
        <meshStandardMaterial color="#1A1408" roughness={0.92} emissive="#120E06" emissiveIntensity={0.35} />
      </mesh>
      {/* Desk */}
      <mesh position={[roomX * 0.9, -0.72, -0.65]}>
        <boxGeometry args={[0.38, 0.07, 0.52]} />
        <meshStandardMaterial color="#22160A" roughness={0.84} emissive="#150E06" emissiveIntensity={0.35} />
      </mesh>
      {/* Monitor */}
      <mesh position={[roomX * 0.89, -0.42, -0.65]}>
        <boxGeometry args={[0.32, 0.25, 0.04]} />
        <meshStandardMaterial color="#040808" roughness={0.18} metalness={0.65} emissive="#0C1406" emissiveIntensity={0.55} />
      </mesh>
      {/* Stool */}
      <mesh position={[roomX * 0.72, -1.1, 0.38]}>
        <cylinderGeometry args={[0.16, 0.16, 0.07, 14]} />
        <meshStandardMaterial color="#1C1610" roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Primary room glow light */}
      <pointLight
        ref={glowRef}
        position={[roomX * 0.62, 0.55, 0]}
        color={warmColor}
        intensity={3.0}
        distance={8}
        decay={2}
      />
      {/* Secondary ceiling light */}
      <pointLight
        position={[roomX * 0.8, 1.45, 0]}
        color="#FFF8EE"
        intensity={0.7}
        distance={4}
        decay={2}
      />

      {/* Floor glow pool */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x * 0.5, -1.385, 0]}>
        <planeGeometry args={[2.1, doorW * 1.2]} />
        <meshBasicMaterial color={warmColor} transparent opacity={0.22} depthWrite={false} />
      </mesh>

      {/* Accent strip — green brand at threshold */}
      <mesh position={[x * 0.991, -1.27, 0]}>
        <boxGeometry args={[0.02, 0.085, doorW + 0.32]} />
        <meshStandardMaterial color={acc} emissive={acc} emissiveIntensity={0.78} roughness={0.22} />
      </mesh>

      {/* Wall sign panel above door */}
      <mesh position={[x * 0.992, 1.74, 0]}>
        <boxGeometry args={[0.07, 0.3, 1.65]} />
        <meshStandardMaterial color="#192012" roughness={0.38} metalness={0.22} emissive="#0C1008" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[x * 0.99, 1.86, 0]}>
        <boxGeometry args={[0.025, 0.012, 1.65]} />
        <meshStandardMaterial color={acc} emissive={acc} emissiveIntensity={0.95} />
      </mesh>
    </group>
  )
}

// ── Corridor end — vanishing-point glow ──────────────────────────
function CorridorEnd() {
  return (
    <group position={[0, 0.45, -57]}>
      <mesh>
        <planeGeometry args={[7.5, 3.9]} />
        <meshBasicMaterial color="#F5F4EF" transparent opacity={0.93} />
      </mesh>
      <mesh position={[0, 0, -0.12]}>
        <planeGeometry args={[3.2, 2.6]} />
        <meshBasicMaterial color="#FFF6D8" transparent opacity={0.35} depthWrite={false} />
      </mesh>
      <pointLight position={[0, 0.4, 1.8]} color="#FFFFFF" intensity={12} distance={28} decay={2} />
    </group>
  )
}

// ── Ambient dust motes ────────────────────────────────────────────
function DustMotes({ count = 300 }) {
  const ref = useRef()
  const { pos, spd } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const spd = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 6.5
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3.5
      pos[i * 3 + 2] = -Math.random() * 54
      spd[i] = 0.00055 + Math.random() * 0.0009
    }
    return { pos, spd }
  }, [count])

  useFrame(() => {
    if (!ref.current) return
    const arr = ref.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += spd[i]
      arr[i * 3]     += (Math.random() - 0.5) * 0.00048
      if (arr[i * 3 + 1] > 1.85) {
        arr[i * 3 + 1] = -1.4
        arr[i * 3]     = (Math.random() - 0.5) * 6.5
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={pos} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#B8FF66" transparent opacity={0.36} sizeAttenuation depthWrite={false} />
    </points>
  )
}

// ── Cinematic walk camera with head-bob ───────────────────────────
function CameraRig({ scrollRef }) {
  const { camera, size } = useThree()
  const cycle = useRef(0)

  useMemo(() => {
    camera.fov = size.width < 600 ? 76 : 60
    camera.updateProjectionMatrix()
  }, [camera, size.width])

  useFrame(({ clock }) => {
    const t   = Math.min(Math.max(scrollRef.current, 0), 1)
    const tgt = 5.5 - t * 60
    cycle.current = clock.elapsedTime
    const bobY = Math.sin(cycle.current * 2.1) * 0.016
    const bobX = Math.sin(cycle.current * 1.05) * 0.006

    camera.position.x += (bobX         - camera.position.x) * 0.038
    camera.position.y += (0.05 + bobY  - camera.position.y) * 0.048
    camera.position.z += (tgt          - camera.position.z) * 0.033

    camera.lookAt(camera.position.x * 0.18, 0.05, camera.position.z - 13)
  })

  return null
}

// ── Atmospheric fog ───────────────────────────────────────────────
function SceneFog() {
  const { scene } = useThree()
  useMemo(() => { scene.fog = new THREE.Fog('#EDECEA', 16, 52) }, [scene])
  return null
}

// ── Scene data ────────────────────────────────────────────────────
const ROOMS = [
  { z: -10, side: 'left',  warmColor: '#FF9418' },
  { z: -22, side: 'right', warmColor: '#FFAD38' },
  { z: -34, side: 'left',  warmColor: '#FFB848' },
  { z: -46, side: 'right', warmColor: '#FF9C28' },
]

const SHAFTS = [
  [-1.6, -3],  [1.6, -3],
  [-1.6, -10], [1.6, -10],
  [-1.6, -18], [1.6, -18],
  [-1.6, -26], [1.6, -26],
  [-1.6, -34], [1.6, -34],
  [-1.6, -42], [1.6, -42],
  [-1.6, -50], [1.6, -50],
]

// ── Main export ───────────────────────────────────────────────────
export default function MainScene({ scrollRef }) {
  return (
    <Canvas
      shadows
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
      camera={{ position: [0, 0.05, 5.5], fov: 60, near: 0.1, far: 120 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.12,
      }}
      dpr={[1, 1.5]}
    >
      <SoftShadows size={25} samples={16} focus={0.5} />
      <SceneFog />
      <color attach="background" args={['#EDECEA']} />

      {/* Global illumination */}
      <ambientLight intensity={0.35} color="#FFF8F2" />
      <directionalLight
        position={[0, 8, 2]}
        intensity={1.05}
        color="#FFF8F0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.5}
        shadow-camera-far={65}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      {/* Back-fill from corridor end */}
      <directionalLight position={[0, 1, -58]} intensity={0.72} color="#EEE6D4" />

      <CameraRig scrollRef={scrollRef} />

      <Suspense fallback={null}>
        <CorridorFloor />
        <CorridorWall side="left" />
        <CorridorWall side="right" />
        <CorridorCeiling />
        <CorridorEnd />
        <DustMotes />

        {ROOMS.map((r) => (
          <ClinicRoom key={r.z} {...r} />
        ))}

        {SHAFTS.map(([x, z], i) => (
          <LightShaft key={i} x={x} z={z} />
        ))}

        <EffectComposer multisampling={0}>
          <DepthOfField
            focusDistance={0.009}
            focalLength={0.058}
            bokehScale={2.2}
            height={600}
          />
          <Bloom
            intensity={1.15}
            luminanceThreshold={0.5}
            luminanceSmoothing={0.78}
            blendFunction={BlendFunction.ADD}
            mipmapBlur
            radius={0.52}
          />
          <ChromaticAberration
            offset={new THREE.Vector2(0.00055, 0.00055)}
            blendFunction={BlendFunction.NORMAL}
          />
          <Vignette offset={0.3} darkness={0.62} blendFunction={BlendFunction.NORMAL} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  )
}
