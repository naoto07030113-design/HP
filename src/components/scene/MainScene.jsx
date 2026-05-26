import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, DepthOfField, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

// ── Polished marble floor with tile grid ─────────────────────────
function CorridorFloor() {
  const gridH = useMemo(() => {
    return Array.from({ length: 58 }, (_, i) => {
      const z = -i
      return new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-3.5, 0, z),
        new THREE.Vector3(3.5, 0, z),
      ])
    })
  }, [])
  const gridV = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const x = -3.5 + i
      return new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, 0, 0),
        new THREE.Vector3(x, 0, -57),
      ])
    })
  }, [])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.4, -27]} receiveShadow>
        <planeGeometry args={[7.5, 58]} />
        <meshPhysicalMaterial
          color="#EFEEEA"
          roughness={0.1}
          metalness={0.05}
          reflectivity={0.6}
          envMapIntensity={0.5}
        />
      </mesh>
      <group position={[0, -1.395, 0]}>
        {gridH.map((geo, i) => (
          <line key={`h${i}`} geometry={geo}>
            <lineBasicMaterial color="#D8D6D0" transparent opacity={0.35} />
          </line>
        ))}
        {gridV.map((geo, i) => (
          <line key={`v${i}`} geometry={geo}>
            <lineBasicMaterial color="#D8D6D0" transparent opacity={0.35} />
          </line>
        ))}
      </group>
    </group>
  )
}

// ── Walls with recessed panel detail ─────────────────────────────
function CorridorWall({ side }) {
  const x = side === 'left' ? -3.55 : 3.55
  const rotY = side === 'left' ? Math.PI / 2 : -Math.PI / 2
  const panelZs = useMemo(() => {
    return Array.from({ length: 22 }, (_, i) => -1.5 - i * 2.6)
  }, [])

  return (
    <group>
      {/* Base wall */}
      <mesh position={[x, 0.45, -27]} rotation={[0, rotY, 0]} receiveShadow>
        <planeGeometry args={[57, 3.9]} />
        <meshStandardMaterial color="#F3F2EE" roughness={0.96} metalness={0} />
      </mesh>
      {/* Panel top rails */}
      {panelZs.map((z, i) => (
        <mesh key={i} position={[x * 0.996, 1.65, z]}>
          <boxGeometry args={[0.04, 0.06, 2.0]} />
          <meshStandardMaterial color="#E6E4DF" roughness={0.98} />
        </mesh>
      ))}
      {/* Panel bottom rails */}
      {panelZs.map((z, i) => (
        <mesh key={i} position={[x * 0.996, -0.55, z]}>
          <boxGeometry args={[0.04, 0.06, 2.0]} />
          <meshStandardMaterial color="#E6E4DF" roughness={0.98} />
        </mesh>
      ))}
      {/* Green baseboard strip */}
      <mesh position={[x * 0.995, -1.22, -27]}>
        <boxGeometry args={[0.03, 0.2, 57]} />
        <meshStandardMaterial color="#6AB628" emissive="#6AB628" emissiveIntensity={0.25} roughness={0.4} />
      </mesh>
      {/* Ceiling cove line */}
      <mesh position={[x * 0.995, 2.12, -27]}>
        <boxGeometry args={[0.03, 0.06, 57]} />
        <meshStandardMaterial color="#DFFFB0" emissive="#CCFF80" emissiveIntensity={0.6} roughness={0.3} />
      </mesh>
    </group>
  )
}

// ── Ceiling with twin light strips ───────────────────────────────
function CorridorCeiling() {
  const stripXs = [-1.6, 1.6]
  const lightZs = [-3, -10, -18, -26, -34, -42, -50]

  return (
    <group>
      {/* Ceiling plane */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 2.3, -27]}>
        <planeGeometry args={[7.5, 58]} />
        <meshStandardMaterial color="#F8F7F4" roughness={0.97} />
      </mesh>
      {/* Light strips (emissive) */}
      {stripXs.map((sx, si) => (
        <group key={si}>
          <mesh position={[sx, 2.28, -27]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.18, 56]} />
            <meshBasicMaterial color="#EEFF90" transparent opacity={0.95} />
          </mesh>
          {lightZs.map((z, li) => (
            <pointLight
              key={li}
              position={[sx, 2.1, z]}
              color="#D8FF60"
              intensity={1.0}
              distance={8}
              decay={2}
            />
          ))}
        </group>
      ))}
    </group>
  )
}

// ── Glass clinic room entrance ────────────────────────────────────
function ClinicRoom({ z, side, warmColor = '#FFB050', accentColor = '#6AB628' }) {
  const glowRef = useRef()
  const x = side === 'left' ? -3.55 : 3.55
  const roomX = side === 'left' ? -5.0 : 5.0
  const rotY = side === 'left' ? Math.PI / 2 : -Math.PI / 2
  const doorW = 2.6
  const doorH = 3.4

  useFrame(({ clock }) => {
    if (!glowRef.current) return
    glowRef.current.intensity = 3.5 + Math.sin(clock.elapsedTime * 0.6) * 0.4
  })

  return (
    <group position={[0, 0, z]}>
      {/* Wood frame — vertical */}
      {[-doorW / 2, doorW / 2].map((dz, i) => (
        <mesh key={i} position={[x * 0.994, 0.4, dz]} castShadow>
          <boxGeometry args={[0.08, doorH + 0.2, 0.18]} />
          <meshStandardMaterial color="#7A5230" roughness={0.7} metalness={0.02} />
        </mesh>
      ))}
      {/* Wood frame — top */}
      <mesh position={[x * 0.994, doorH / 2 - 0.3, 0]} castShadow>
        <boxGeometry args={[0.08, 0.2, doorW + 0.2]} />
        <meshStandardMaterial color="#7A5230" roughness={0.7} metalness={0.02} />
      </mesh>

      {/* Glass pane */}
      <mesh position={[x * 0.992, 0.4, 0]} rotation={[0, rotY, 0]}>
        <planeGeometry args={[doorW, doorH]} />
        <meshPhysicalMaterial
          color="#ECF8EC"
          roughness={0.02}
          metalness={0}
          transmission={0.82}
          ior={1.5}
          thickness={0.06}
          transparent
          opacity={0.93}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Warm room box behind glass */}
      <mesh position={[roomX, 0.4, 0]}>
        <boxGeometry args={[1.2, doorH, doorW]} />
        <meshStandardMaterial
          color={warmColor}
          emissive={warmColor}
          emissiveIntensity={0.5}
          roughness={0.9}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Room furniture silhouettes (simple) */}
      <mesh position={[roomX * 0.85, -0.7, 0.4]}>
        <boxGeometry args={[0.4, 0.6, 0.8]} />
        <meshStandardMaterial color="#4A3018" roughness={0.9} emissive="#2A1808" emissiveIntensity={0.3} />
      </mesh>

      {/* Primary room glow light */}
      <pointLight
        ref={glowRef}
        position={[roomX * 0.7, 0.5, 0]}
        color={warmColor}
        intensity={3.5}
        distance={7}
        decay={2}
      />

      {/* Floor glow pool */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[x * 0.55, -1.39, 0]}>
        <planeGeometry args={[1.8, doorW * 1.1]} />
        <meshBasicMaterial color={warmColor} transparent opacity={0.18} depthWrite={false} />
      </mesh>

      {/* Accent strip on door frame */}
      <mesh position={[x * 0.993, -1.3, 0]}>
        <boxGeometry args={[0.025, 0.1, doorW + 0.3]} />
        <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.6} roughness={0.3} />
      </mesh>
    </group>
  )
}

// ── Backlit end of corridor (depth illusion) ──────────────────────
function CorridorEnd() {
  return (
    <group position={[0, 0, -57]}>
      <mesh>
        <planeGeometry args={[7.5, 3.9]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.85} />
      </mesh>
      <pointLight position={[0, 0.5, 2]} color="#FFFFFF" intensity={8} distance={30} decay={2} />
    </group>
  )
}

// ── Ambient dust ─────────────────────────────────────────────────
function DustMotes({ count = 400 }) {
  const ref = useRef()
  const { pos, spd } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const spd = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 6.5
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3.5
      pos[i * 3 + 2] = -Math.random() * 54
      spd[i] = 0.0008 + Math.random() * 0.0015
    }
    return { pos, spd }
  }, [count])

  useFrame(() => {
    if (!ref.current) return
    const arr = ref.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += spd[i]
      arr[i * 3]     += (Math.random() - 0.5) * 0.0008
      if (arr[i * 3 + 1] > 1.8) {
        arr[i * 3 + 1] = -1.3
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
      <pointsMaterial size={0.025} color="#C8FF80" transparent opacity={0.45} sizeAttenuation depthWrite={false} />
    </points>
  )
}

// ── Scroll-driven walk camera ─────────────────────────────────────
function CameraRig({ scrollRef }) {
  const { camera, size } = useThree()
  const walkCycle = useRef(0)

  useMemo(() => {
    camera.fov = size.width < 600 ? 82 : 65
    camera.updateProjectionMatrix()
  }, [camera, size.width])

  useFrame(({ clock }) => {
    const t = Math.min(Math.max(scrollRef.current, 0), 1)
    const targetZ = 5.5 - t * 60
    walkCycle.current = clock.elapsedTime
    const bobY = Math.sin(walkCycle.current * 2.4) * 0.022
    const bobX = Math.sin(walkCycle.current * 1.2) * 0.009

    camera.position.x += (bobX - camera.position.x) * 0.05
    camera.position.y += (0.08 + bobY - camera.position.y) * 0.055
    camera.position.z += (targetZ - camera.position.z) * 0.04

    camera.lookAt(camera.position.x * 0.25, 0.08, camera.position.z - 10)
  })

  return null
}

// ── Atmospheric fog ───────────────────────────────────────────────
function SceneFog() {
  const { scene } = useThree()
  useMemo(() => { scene.fog = new THREE.Fog('#F2F1ED', 20, 52) }, [scene])
  return null
}

// ── Main export ──────────────────────────────────────────────────
const ROOMS = [
  { z: -10, side: 'left',  warm: '#FFA030', accent: '#6AB628' },
  { z: -22, side: 'right', warm: '#FFB850', accent: '#6AB628' },
  { z: -34, side: 'left',  warm: '#FFC060', accent: '#6AB628' },
  { z: -46, side: 'right', warm: '#FFB040', accent: '#6AB628' },
]

export default function MainScene({ scrollRef }) {
  return (
    <Canvas
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
      camera={{ position: [0, 0.08, 5.5], fov: 65, near: 0.1, far: 120 }}
      shadows
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.25,
      }}
      dpr={[1, 2]}
    >
      <SceneFog />
      <color attach="background" args={['#F2F1ED']} />

      {/* Global lights */}
      <ambientLight intensity={0.55} color="#FDFCF8" />
      <directionalLight
        position={[0, 8, 4]}
        intensity={0.9}
        color="#FFF8F0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
      />
      {/* Cool back light from far end (depth) */}
      <directionalLight position={[0, 2, -55]} intensity={0.5} color="#EEEEE8" />

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

        <EffectComposer multisampling={0}>
          <DepthOfField
            focusDistance={0.008}
            focalLength={0.055}
            bokehScale={2.5}
            height={600}
          />
          <Bloom
            intensity={0.8}
            luminanceThreshold={0.6}
            luminanceSmoothing={0.85}
            blendFunction={BlendFunction.ADD}
            mipmapBlur
            radius={0.45}
          />
          <Vignette offset={0.22} darkness={0.45} blendFunction={BlendFunction.NORMAL} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  )
}
