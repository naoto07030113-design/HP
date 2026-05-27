import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sky, Environment } from '@react-three/drei'
import { EffectComposer, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

import GreenhouseShell from './GreenhouseShell'
import GreenhouseFloor from './GreenhouseFloor'
import PlantLife from './PlantLife'
import SunShafts from './SunShafts'
import AtmosphericMist from './AtmosphericMist'
import CultivationBeds from './CultivationBeds'

// ─────────────────────────────────────────────────────────────────
// Gentle humidity haze — warm cream, barely perceptible
// ─────────────────────────────────────────────────────────────────
function GreenhouseFog() {
  const { scene } = useThree()
  useMemo(() => {
    // Warm cream-white haze like real greenhouse humidity
    scene.fog = new THREE.FogExp2('#dce8d4', 0.006)
  }, [scene])
  return null
}

// ─────────────────────────────────────────────────────────────────
// Reflecting pool — Scene 5, Reflection Hall
// ─────────────────────────────────────────────────────────────────
function ReflectionPool() {
  return (
    <group position={[0, 0.04, -72]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[7, 14]} />
        <meshStandardMaterial
          color="#3a5040"
          roughness={0.0}
          metalness={0.92}
          envMapIntensity={3.5}
        />
      </mesh>
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[7.5, 0.12, 14.5]} />
        <meshStandardMaterial color="#9a8e7e" roughness={0.82} metalness={0.06} />
      </mesh>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Camera rig — human walking pace, eye-level, calm progression
// ─────────────────────────────────────────────────────────────────
function CameraRig({ scrollRef }) {
  const { camera } = useThree()

  const camCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,     1.72, 9.5),   // Before entrance
    new THREE.Vector3(0,     1.72, 4.5),   // Entrance threshold
    new THREE.Vector3(0.2,   1.72, 0.0),   // Inside — first breath
    new THREE.Vector3(-0.4,  1.78,-7.0),   // Grand hall — opening upward
    new THREE.Vector3(0,     1.95,-13.5),  // Grand hall center — slight upward gaze
    new THREE.Vector3(0.8,   1.75,-19.5),  // Grand hall far
    new THREE.Vector3(0.2,   1.72,-25.5),  // Living path entry
    new THREE.Vector3(-0.9,  1.72,-31.5),  // Living path — lean left
    new THREE.Vector3(0,     1.72,-38.0),  // Living path exit
    new THREE.Vector3(0.5,   1.72,-45.0),  // Cultivation entry
    new THREE.Vector3(-0.3,  1.72,-53.5),  // Cultivation center
    new THREE.Vector3(0.2,   1.75,-61.5),  // Reflection approach
    new THREE.Vector3(0,     1.78,-69.5),  // Reflection hall
    new THREE.Vector3(0,     1.85,-75.5),  // Final still point
  ]), [])

  const lookCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,     1.65, 2.0),
    new THREE.Vector3(0,     1.65,-0.5),
    new THREE.Vector3(0,     1.65,-5.5),
    new THREE.Vector3(-0.2,  1.70,-13.0),
    new THREE.Vector3(0,     2.10,-21.0),  // Look up at the vault
    new THREE.Vector3(0.5,   1.72,-26.5),
    new THREE.Vector3(0,     1.70,-32.5),
    new THREE.Vector3(-0.6,  1.70,-39.0),
    new THREE.Vector3(0,     1.70,-45.5),
    new THREE.Vector3(0.3,   1.70,-52.5),
    new THREE.Vector3(-0.2,  1.70,-60.5),
    new THREE.Vector3(0,     1.72,-67.5),
    new THREE.Vector3(0,     1.75,-75.0),
    new THREE.Vector3(0,     1.82,-82.0),
  ]), [])

  const lookTarget = useRef(new THREE.Vector3(0, 1.65, 2.0))

  useFrame(() => {
    const t = Math.min(Math.max(scrollRef.current, 0), 1)
    const targetPos = camCurve.getPoint(t)
    const targetLook = lookCurve.getPoint(t)

    // Very gentle lerp — walking pace, unhurried
    camera.position.lerp(targetPos, 0.025)
    lookTarget.current.lerp(targetLook, 0.025)
    camera.lookAt(lookTarget.current)
  })

  return null
}

// ─────────────────────────────────────────────────────────────────
// Physically accurate greenhouse lighting
// ─────────────────────────────────────────────────────────────────
function GreenhouseLights() {
  return (
    <>
      {/* Primary morning sun — warm, directional, casting long shadows */}
      <directionalLight
        position={[12, 20, 6]}
        intensity={2.4}
        color="#fff5dc"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={130}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
        shadow-bias={-0.0006}
        shadow-normalBias={0.04}
      />

      {/* Sky dome — cool diffuse from overhead glass */}
      <hemisphereLight
        skyColor="#c0d8e8"
        groundColor="#4a5e38"
        intensity={0.75}
      />

      {/* Very soft ambient — nearly zero, just prevents pure black */}
      <ambientLight intensity={0.08} color="#f0ece4" />

      {/* Warm interior glow from plant life — very subtle */}
      <pointLight position={[0, 1.0, -14]} intensity={0.20} color="#d8ecb8" distance={28} decay={2} />
      <pointLight position={[0, 1.0, -38]} intensity={0.18} color="#d4e8b4" distance={26} decay={2} />
      <pointLight position={[0, 1.0, -62]} intensity={0.16} color="#d8ecc0" distance={26} decay={2} />

      {/* Entrance backlight — morning sky from behind camera */}
      <directionalLight position={[0, 6, 18]} intensity={0.5} color="#e4f0ff" />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
// Morning sky — warm golden-white, low sun
// ─────────────────────────────────────────────────────────────────
function MorningSky() {
  return (
    <Sky
      distance={450000}
      sunPosition={[100, 15, -55]}
      inclination={0.50}
      azimuth={0.22}
      turbidity={6}
      rayleigh={1.5}
      mieCoefficient={0.004}
      mieDirectionalG={0.84}
    />
  )
}

// ─────────────────────────────────────────────────────────────────
// Minimal post-processing — film grain feel, no sci-fi effects
// ─────────────────────────────────────────────────────────────────
function PostProcessing() {
  return (
    <EffectComposer multisampling={2}>
      {/* Gentle organic vignette — like a camera lens, not an effect */}
      <Vignette
        offset={0.18}
        darkness={0.38}
        eskil={false}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  )
}

// ─────────────────────────────────────────────────────────────────
// Main Scene
// ─────────────────────────────────────────────────────────────────
export default function MainScene({ scrollRef }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <Canvas
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
      camera={{ position: [0, 1.72, 9.5], fov: 50, near: 0.1, far: 200 }}
      shadows={!isMobile}
      gl={{
        antialias: true,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
        powerPreference: 'high-performance',
      }}
      dpr={isMobile ? [1, 1] : [1, 1.5]}
    >
      <GreenhouseFog />

      <Suspense fallback={null}>
        <MorningSky />
        <Environment preset="dawn" />
        <GreenhouseLights />
        <CameraRig scrollRef={scrollRef} />

        <GreenhouseShell />
        <GreenhouseFloor />
        <PlantLife />
        <CultivationBeds />
        <ReflectionPool />
        <SunShafts />
        <AtmosphericMist isMobile={isMobile} />

        <PostProcessing />
      </Suspense>
    </Canvas>
  )
}
