import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Stars, Environment } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

import ParticleField from './ParticleField'
import AcupunctureZone from './AcupunctureZone'
import RehabZone from './RehabZone'
import GroupHomeZone from './GroupHomeZone'
import BioParkZone from './BioParkZone'

// Hero architectural elements
function HeroGeometry() {
  const ringRef = useRef()
  const ring2Ref = useRef()
  const coreRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (ringRef.current) {
      ringRef.current.rotation.x = t * 0.08
      ringRef.current.rotation.y = t * 0.12
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = -t * 0.06
      ring2Ref.current.rotation.z = t * 0.09
    }
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.2
      coreRef.current.scale.setScalar(1 + Math.sin(t * 0.5) * 0.04)
    }
  })

  return (
    <group position={[0, 0, 2]}>
      {/* Central glowing core */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial
          color="#52b788"
          emissive="#52b788"
          emissiveIntensity={1.2}
          wireframe
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Primary orbit ring */}
      <mesh ref={ringRef} rotation={[0.5, 0, 0.2]}>
        <torusGeometry args={[2.2, 0.018, 16, 150]} />
        <meshStandardMaterial
          color="#c9a84c"
          emissive="#c9a84c"
          emissiveIntensity={0.8}
          metalness={0.9}
          roughness={0.05}
        />
      </mesh>

      {/* Secondary orbit ring */}
      <mesh ref={ring2Ref} rotation={[-0.3, 0.4, 0]}>
        <torusGeometry args={[3.2, 0.01, 8, 120]} />
        <meshStandardMaterial
          color="#52b788"
          emissive="#52b788"
          emissiveIntensity={0.5}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Outer halo */}
      <Float speed={0.3} rotationIntensity={0.1}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[4.5, 0.006, 8, 180]} />
          <meshStandardMaterial
            color="#1a5c3a"
            emissive="#2d8653"
            emissiveIntensity={0.4}
            transparent
            opacity={0.4}
          />
        </mesh>
      </Float>

      {/* Orbital dots */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(angle) * 2.2, Math.sin(angle) * 2.2, 0]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial
              color="#e8c97a"
              emissive="#e8c97a"
              emissiveIntensity={1.5}
            />
          </mesh>
        )
      })}
    </group>
  )
}

// Ambient floating geometry throughout the scene
function AmbientFloaters() {
  const floaters = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      position: [
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 6,
        -5 - Math.random() * 55,
      ],
      scale: 0.05 + Math.random() * 0.25,
      color: Math.random() > 0.5 ? '#1a5c3a' : '#0d3320',
      emissive: Math.random() > 0.7 ? '#52b788' : '#2d8653',
      emissiveIntensity: 0.1 + Math.random() * 0.3,
      speed: 0.1 + Math.random() * 0.3,
      delay: Math.random() * Math.PI * 2,
      type: Math.floor(Math.random() * 3),
    }))
  }, [])

  return (
    <group>
      {floaters.map((f, i) => (
        <Float key={i} speed={f.speed * 2} floatIntensity={0.3} rotationIntensity={0.2}>
          <mesh position={f.position} scale={f.scale}>
            {f.type === 0 && <octahedronGeometry args={[1, 0]} />}
            {f.type === 1 && <tetrahedronGeometry args={[1, 0]} />}
            {f.type === 2 && <icosahedronGeometry args={[1, 0]} />}
            <meshStandardMaterial
              color={f.color}
              emissive={f.emissive}
              emissiveIntensity={f.emissiveIntensity}
              metalness={0.5}
              roughness={0.3}
              transparent
              opacity={0.5}
              wireframe={Math.random() > 0.5}
            />
          </mesh>
        </Float>
      ))}
    </group>
  )
}

// Architectural floor grid
function FloorGrid() {
  const gridLines = useMemo(() => {
    const lines = []
    const count = 20
    const size = 16
    const depth = 70

    // Z lines (going into the scene)
    for (let i = 0; i <= count; i++) {
      const x = -size / 2 + (i / count) * size
      lines.push([
        new THREE.Vector3(x, -2.5, 0),
        new THREE.Vector3(x, -2.5, -depth),
      ])
    }

    // X lines (cross lines) at intervals
    for (let j = 0; j <= 30; j++) {
      const z = -(j / 30) * depth
      lines.push([
        new THREE.Vector3(-size / 2, -2.5, z),
        new THREE.Vector3(size / 2, -2.5, z),
      ])
    }

    return lines.map((pts) => new THREE.BufferGeometry().setFromPoints(pts))
  }, [])

  return (
    <group>
      {gridLines.map((geo, i) => (
        <line key={i} geometry={geo}>
          <lineBasicMaterial
            color="#1a5c3a"
            transparent
            opacity={0.08}
          />
        </line>
      ))}
    </group>
  )
}

// Wall/ceiling elements for architectural feel
function ArchitecturalWalls() {
  const leftPanels = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      z: -5 - i * 8,
      x: -7.5,
      w: 0.01,
      h: 5,
      opacity: 0.04 + Math.random() * 0.04,
    }))
  }, [])

  const rightPanels = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      z: -5 - i * 8,
      x: 7.5,
      w: 0.01,
      h: 5,
      opacity: 0.04 + Math.random() * 0.04,
    }))
  }, [])

  return (
    <group>
      {[...leftPanels, ...rightPanels].map((p, i) => (
        <mesh key={i} position={[p.x, 0, p.z]}>
          <planeGeometry args={[0.5, p.h]} />
          <meshStandardMaterial
            color="#52b788"
            transparent
            opacity={p.opacity}
            emissive="#1a5c3a"
            emissiveIntensity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

// Scroll-driven camera rig
function CameraRig({ scrollRef }) {
  const { camera } = useThree()

  const camCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.6, 10),      // 0.0 - Hero entrance
    new THREE.Vector3(-0.5, 0.5, 6),    // ~0.05 - Pull back
    new THREE.Vector3(-4.5, 0.8, 0),    // ~0.2 - Zone 1 approach
    new THREE.Vector3(-4, 0.5, -7),     // ~0.3 - Zone 1 mid
    new THREE.Vector3(1, 0, -18),       // ~0.42 - Zone 2 approach
    new THREE.Vector3(3.5, -0.2, -24),  // ~0.5 - Zone 2 mid
    new THREE.Vector3(2, 0, -30),       // ~0.58 - transition
    new THREE.Vector3(-3, 0.5, -38),    // ~0.67 - Zone 3 approach
    new THREE.Vector3(-4, 0.5, -44),    // ~0.75 - Zone 3 mid
    new THREE.Vector3(1, 0.3, -52),     // ~0.85 - Zone 4 approach
    new THREE.Vector3(-3, 0.5, -57),    // ~0.93 - Zone 4 mid
    new THREE.Vector3(0, 0.5, -62),     // 1.0 - End
  ]), [])

  const lookCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 2),
    new THREE.Vector3(-0.5, 0, 0),
    new THREE.Vector3(-3, 0, -5),
    new THREE.Vector3(-3, 0, -13),
    new THREE.Vector3(0, 0, -22),
    new THREE.Vector3(2, 0, -30),
    new THREE.Vector3(0, 0, -35),
    new THREE.Vector3(-2, 0, -44),
    new THREE.Vector3(-3, 0, -50),
    new THREE.Vector3(0, 0, -58),
    new THREE.Vector3(-1, 0, -63),
    new THREE.Vector3(0, 0, -70),
  ]), [])

  const lookTarget = useRef(new THREE.Vector3(0, 0, 2))

  useFrame(() => {
    const t = Math.min(Math.max(scrollRef.current, 0), 1)
    const targetPos = camCurve.getPoint(t)
    const targetLook = lookCurve.getPoint(t)

    camera.position.lerp(targetPos, 0.04)
    lookTarget.current.lerp(targetLook, 0.04)
    camera.lookAt(lookTarget.current)
  })

  return null
}

// Fog that changes density across zones
function SceneFog() {
  const { scene } = useThree()

  useMemo(() => {
    scene.fog = new THREE.FogExp2('#080d0b', 0.022)
  }, [scene])

  return null
}

export default function MainScene({ scrollRef }) {
  return (
    <Canvas
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
      camera={{ position: [0, 0.6, 10], fov: 60, near: 0.1, far: 200 }}
      gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      dpr={[1, 2]}
    >
      <SceneFog />

      {/* Scene background */}
      <color attach="background" args={['#080d0b']} />

      {/* Global ambient light - very dim */}
      <ambientLight intensity={0.08} color="#0d3320" />

      {/* Main directional fill */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.4}
        color="#c9f0d8"
      />

      {/* Deep scene fill */}
      <directionalLight
        position={[-5, -2, -10]}
        intensity={0.15}
        color="#1a5c3a"
      />

      {/* Camera control */}
      <CameraRig scrollRef={scrollRef} />

      {/* Environment */}
      <Stars radius={80} depth={50} count={1500} factor={2} saturation={0.3} fade speed={0.5} />

      <Suspense fallback={null}>
        {/* Ground plane grid */}
        <FloorGrid />
        <ArchitecturalWalls />

        {/* Hero entrance */}
        <HeroGeometry />

        {/* Ambient floating objects throughout */}
        <AmbientFloaters />

        {/* Global particle field */}
        <ParticleField count={3000} spread={45} />

        {/* Zone 1 — Acupuncture */}
        <AcupunctureZone />

        {/* Zone 2 — Rehabilitation */}
        <RehabZone />

        {/* Zone 3 — Group Home */}
        <GroupHomeZone />

        {/* Zone 4 — BIO PARK */}
        <BioParkZone />

        {/* Post-processing */}
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={1.4}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.8}
            blendFunction={BlendFunction.ADD}
            mipmapBlur
            radius={0.6}
          />
          <Vignette
            offset={0.3}
            darkness={0.7}
            eskil={false}
            blendFunction={BlendFunction.NORMAL}
          />
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={[0.0008, 0.0008]}
            radialModulation={false}
            modulationOffset={0}
          />
        </EffectComposer>
      </Suspense>
    </Canvas>
  )
}
