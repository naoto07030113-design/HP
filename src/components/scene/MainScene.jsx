import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

// ── Floor with subtle green grid ──────────────────────────────────
function Floor() {
  const linesH = useMemo(() => {
    const geos = []
    for (let i = 0; i <= 60; i++) {
      const z = -i
      const pts = [new THREE.Vector3(-4, -1.41, z), new THREE.Vector3(4, -1.41, z)]
      geos.push(new THREE.BufferGeometry().setFromPoints(pts))
    }
    return geos
  }, [])

  const linesV = useMemo(() => {
    const geos = []
    for (let x = -4; x <= 4; x++) {
      const pts = [new THREE.Vector3(x, -1.41, 0), new THREE.Vector3(x, -1.41, -60)]
      geos.push(new THREE.BufferGeometry().setFromPoints(pts))
    }
    return geos
  }, [])

  return (
    <group>
      {/* Floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.42, -28]}>
        <planeGeometry args={[8, 60]} />
        <meshStandardMaterial color="#EBEBEA" roughness={0.5} metalness={0.08} />
      </mesh>
      {/* Grid lines */}
      {linesH.map((geo, i) => (
        <line key={`h${i}`} geometry={geo}>
          <lineBasicMaterial color="#6AB628" transparent opacity={0.07} />
        </line>
      ))}
      {linesV.map((geo, i) => (
        <line key={`v${i}`} geometry={geo}>
          <lineBasicMaterial color="#6AB628" transparent opacity={0.07} />
        </line>
      ))}
    </group>
  )
}

// ── Ceiling ───────────────────────────────────────────────────────
function Ceiling() {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 2.3, -28]}>
      <planeGeometry args={[8, 60]} />
      <meshStandardMaterial color="#F8F8F8" roughness={0.95} />
    </mesh>
  )
}

// ── Walls ─────────────────────────────────────────────────────────
function Walls() {
  return (
    <>
      {/* Left wall */}
      <mesh position={[-4, 0.44, -28]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[60, 3.8]} />
        <meshStandardMaterial color="#F2F2F0" roughness={0.95} />
      </mesh>
      {/* Right wall */}
      <mesh position={[4, 0.44, -28]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[60, 3.8]} />
        <meshStandardMaterial color="#F2F2F0" roughness={0.95} />
      </mesh>
      {/* Back end wall */}
      <mesh position={[0, 0.44, -58]}>
        <planeGeometry args={[8, 3.8]} />
        <meshStandardMaterial color="#EEEEEC" roughness={0.95} />
      </mesh>
      {/* Front entrance frame */}
      <mesh position={[0, 0.44, 1]}>
        <planeGeometry args={[8, 3.8]} />
        <meshStandardMaterial color="#F5F5F2" roughness={0.95} />
      </mesh>
    </>
  )
}

// ── Baseboard trim (green accent line) ───────────────────────────
function Baseboards() {
  const lines = useMemo(() => [
    // Left baseboard
    [new THREE.Vector3(-3.99, -1.2, 0), new THREE.Vector3(-3.99, -1.2, -58)],
    // Right baseboard
    [new THREE.Vector3(3.99, -1.2, 0), new THREE.Vector3(3.99, -1.2, -58)],
  ], [])

  return (
    <>
      {lines.map((pts, i) => {
        const geo = new THREE.BufferGeometry().setFromPoints(pts)
        return (
          <line key={i} geometry={geo}>
            <lineBasicMaterial color="#6AB628" transparent opacity={0.5} />
          </line>
        )
      })}
    </>
  )
}

// ── Ceiling light strips ──────────────────────────────────────────
function CeilingLights() {
  const positions = [-4, -11, -18, -25, -32, -39, -46, -53]

  return (
    <>
      {positions.map((z, i) => (
        <group key={i} position={[0, 2.25, z]}>
          {/* Emissive light panel */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.8, 0.12]} />
            <meshBasicMaterial color="#D4FF80" transparent opacity={0.9} />
          </mesh>
          <pointLight color="#C8FF60" intensity={0.7} distance={6} decay={2} />
        </group>
      ))}
    </>
  )
}

// ── Door / clinic entrance glows ─────────────────────────────────
const CLINIC_DOORS = [
  { z: -10, side: 'left',  color: '#80D020', label: '本院' },
  { z: -22, side: 'right', color: '#72CC18', label: 'ストレッチ' },
  { z: -34, side: 'left',  color: '#88D828', label: 'SANRI' },
  { z: -46, side: 'right', color: '#6CC420', label: 'リハビリ' },
]

function ClinicDoor({ z, side, color }) {
  const x = side === 'left' ? -3.98 : 3.98
  const rotY = side === 'left' ? Math.PI / 2 : -Math.PI / 2
  const lightX = side === 'left' ? -2.5 : 2.5
  const doorRef = useRef()

  useFrame(({ clock }) => {
    if (!doorRef.current) return
    doorRef.current.material.opacity = 0.12 + Math.sin(clock.elapsedTime * 0.8) * 0.04
  })

  return (
    <group>
      {/* Door glow panel */}
      <mesh ref={doorRef} position={[x, 0.3, z]} rotation={[0, rotY, 0]}>
        <planeGeometry args={[2.8, 2.6]} />
        <meshBasicMaterial color={color} transparent opacity={0.14} side={THREE.DoubleSide} />
      </mesh>
      {/* Door frame top line */}
      <mesh position={[x * 0.98, 1.65, z]} rotation={[0, rotY, 0]}>
        <planeGeometry args={[2.8, 0.04]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Door frame side lines */}
      {[-1.38, 1.38].map((dx, i) => {
        const pts = side === 'left'
          ? [new THREE.Vector3(x * 0.97, -1.4, z + dx), new THREE.Vector3(x * 0.97, 1.65, z + dx)]
          : [new THREE.Vector3(x * 0.97, -1.4, z + dx), new THREE.Vector3(x * 0.97, 1.65, z + dx)]
        const geo = new THREE.BufferGeometry().setFromPoints(pts)
        return (
          <line key={i} geometry={geo}>
            <lineBasicMaterial color={color} transparent opacity={0.7} />
          </line>
        )
      })}
      {/* Room light spilling in */}
      <pointLight position={[lightX, 0.2, z]} color={color} intensity={4} distance={7} decay={2} />
      {/* Floor light pool */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[lightX * 0.6, -1.4, z]}>
        <circleGeometry args={[1.2, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.1} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ── Ambient floating dust particles ──────────────────────────────
function DustParticles({ count = 600 }) {
  const meshRef = useRef()

  const { positions, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const spd = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 7
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3.5
      pos[i * 3 + 2] = -Math.random() * 55
      spd[i] = 0.001 + Math.random() * 0.002
    }
    return { positions: pos, speeds: spd }
  }, [count])

  useFrame(() => {
    if (!meshRef.current) return
    const pos = meshRef.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += speeds[i]
      pos[i * 3]     += (Math.random() - 0.5) * 0.001
      if (pos[i * 3 + 1] > 1.8) {
        pos[i * 3 + 1] = -1.4
        pos[i * 3]     = (Math.random() - 0.5) * 7
      }
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#9AE040" transparent opacity={0.4} sizeAttenuation depthWrite={false} />
    </points>
  )
}

// ── Scroll-driven camera (straight corridor) ──────────────────────
function CameraRig({ scrollRef }) {
  const { camera } = useThree()
  const breathY = useRef(0)

  useFrame(({ clock }) => {
    const t = Math.min(Math.max(scrollRef.current, 0), 1)
    // Move straight down corridor: Z from 6 to -52
    const targetZ = 6 - t * 58
    const targetX = Math.sin(t * Math.PI * 0.5) * 0.3 // gentle sway
    breathY.current = Math.sin(clock.elapsedTime * 0.4) * 0.04

    camera.position.x += (targetX - camera.position.x) * 0.04
    camera.position.y += (0.1 + breathY.current - camera.position.y) * 0.06
    camera.position.z += (targetZ - camera.position.z) * 0.04

    camera.lookAt(camera.position.x * 0.5, 0.05, camera.position.z - 8)
  })

  return null
}

// ── Fog ──────────────────────────────────────────────────────────
function SceneFog() {
  const { scene } = useThree()
  useMemo(() => { scene.fog = new THREE.Fog('#F5F5F2', 18, 55) }, [scene])
  return null
}

// ── Main export ──────────────────────────────────────────────────
export default function MainScene({ scrollRef }) {
  return (
    <Canvas
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
      camera={{ position: [0, 0.1, 6], fov: 65, near: 0.1, far: 120 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      dpr={[1, 2]}
    >
      <SceneFog />
      <color attach="background" args={['#F5F5F2']} />

      {/* Lighting */}
      <ambientLight intensity={0.7} color="#FFFFFF" />
      <directionalLight position={[0, 6, 2]} intensity={0.8} color="#FFFFFF" castShadow />
      <directionalLight position={[0, 4, -20]} intensity={0.4} color="#E8FFD0" />
      <directionalLight position={[0, 4, -45]} intensity={0.3} color="#E8FFD0" />

      <CameraRig scrollRef={scrollRef} />

      <Suspense fallback={null}>
        <Floor />
        <Ceiling />
        <Walls />
        <Baseboards />
        <CeilingLights />
        <DustParticles />

        {CLINIC_DOORS.map((door) => (
          <ClinicDoor key={door.z} {...door} />
        ))}

        <EffectComposer multisampling={0}>
          <Bloom
            intensity={0.6}
            luminanceThreshold={0.7}
            luminanceSmoothing={0.9}
            blendFunction={BlendFunction.ADD}
            mipmapBlur
            radius={0.4}
          />
          <Vignette offset={0.25} darkness={0.35} blendFunction={BlendFunction.NORMAL} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  )
}
