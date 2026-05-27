import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sky, Environment } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

import GreenhouseShell from './GreenhouseShell'
import GreenhouseFloor from './GreenhouseFloor'
import PlantLife from './PlantLife'
import SunShafts from './SunShafts'
import AtmosphericMist from './AtmosphericMist'
import CultivationBeds from './CultivationBeds'

// ─────────────────────────────────────────────────────────────────
// Atmospheric fog — light morning greenhouse mist
// ─────────────────────────────────────────────────────────────────
function GreenhouseFog() {
  const { scene } = useThree()
  useMemo(() => {
    scene.fog = new THREE.FogExp2('#b8d4a8', 0.009)
  }, [scene])
  return null
}

// ─────────────────────────────────────────────────────────────────
// Reflecting pool — Scene 5, Reflection Hall
// ─────────────────────────────────────────────────────────────────
function ReflectionPool() {
  return (
    <group position={[0, 0.04, -72]}>
      {/* Water surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[7, 14]} />
        <meshStandardMaterial
          color="#3a5845"
          roughness={0.02}
          metalness={0.85}
          envMapIntensity={2.5}
        />
      </mesh>

      {/* Pool surround — raised stone edge */}
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[7.4, 0.12, 14.4]} />
        <meshStandardMaterial color="#9a8e7e" roughness={0.8} metalness={0.08} />
      </mesh>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Scroll-driven camera rig — human eye-level walkthrough
// ─────────────────────────────────────────────────────────────────
function CameraRig({ scrollRef }) {
  const { camera } = useThree()

  // Camera position path — gentle naturalistic movement
  const camCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,    1.8,  9.5),   // t=0.00 — before entrance
    new THREE.Vector3(0,    1.75, 5.0),   // t=0.09 — entrance approach
    new THREE.Vector3(0.4,  1.8,  0.0),   // t=0.14 — crossing the threshold
    new THREE.Vector3(-0.8, 2.0, -8.0),   // t=0.22 — grand hall opens
    new THREE.Vector3(0,    2.2, -14.0),  // t=0.30 — grand hall center, looking up
    new THREE.Vector3(1.2,  1.85,-20.0),  // t=0.37 — grand hall far
    new THREE.Vector3(0.3,  1.8, -26.0),  // t=0.44 — living path entry
    new THREE.Vector3(-1.5, 1.8, -32.5),  // t=0.53 — living path deep left
    new THREE.Vector3(0,    1.8, -39.0),  // t=0.61 — living path exit
    new THREE.Vector3(0.8,  1.8, -46.0),  // t=0.70 — cultivation entry
    new THREE.Vector3(-0.5, 1.8, -54.0),  // t=0.78 — cultivation center
    new THREE.Vector3(0.3,  1.85,-62.0),  // t=0.86 — reflection approach
    new THREE.Vector3(0,    1.9, -70.0),  // t=0.93 — reflection hall entry
    new THREE.Vector3(0,    2.0, -76.0),  // t=1.00 — final resting position
  ]), [])

  // Look-at target path — slightly ahead of camera, with gentle drift
  const lookCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,    1.7,  2.0),
    new THREE.Vector3(0,    1.7, -1.0),
    new THREE.Vector3(0,    1.7, -6.0),
    new THREE.Vector3(-0.4, 1.8, -14.0),
    new THREE.Vector3(0,    2.2, -22.0),
    new THREE.Vector3(0.8,  1.8, -27.0),
    new THREE.Vector3(0,    1.8, -33.0),
    new THREE.Vector3(-1.0, 1.8, -39.5),
    new THREE.Vector3(0,    1.8, -46.0),
    new THREE.Vector3(0.5,  1.8, -53.0),
    new THREE.Vector3(-0.3, 1.8, -61.0),
    new THREE.Vector3(0,    1.85,-68.5),
    new THREE.Vector3(0,    1.9, -76.0),
    new THREE.Vector3(0,    1.95,-83.0),
  ]), [])

  const lookTarget = useRef(new THREE.Vector3(0, 1.7, 2.0))

  useFrame(() => {
    const t = Math.min(Math.max(scrollRef.current, 0), 1)

    const targetPos = camCurve.getPoint(t)
    const targetLook = lookCurve.getPoint(t)

    // Smooth lerp — feels like a gentle walk
    camera.position.lerp(targetPos, 0.05)
    lookTarget.current.lerp(targetLook, 0.05)
    camera.lookAt(lookTarget.current)
  })

  return null
}

// ─────────────────────────────────────────────────────────────────
// Scene lighting
// ─────────────────────────────────────────────────────────────────
function GreenhouseLights() {
  return (
    <>
      {/* Primary sun — warm morning light from the upper-right */}
      <directionalLight
        position={[14, 22, 4]}
        intensity={2.8}
        color="#fffae8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={140}
        shadow-camera-left={-55}
        shadow-camera-right={55}
        shadow-camera-top={55}
        shadow-camera-bottom={-55}
        shadow-bias={-0.0008}
      />

      {/* Sky dome / hemisphere — cool sky, warm ground bounce */}
      <hemisphereLight
        skyColor="#a8cce8"
        groundColor="#4a6a30"
        intensity={0.85}
      />

      {/* Soft ambient fill */}
      <ambientLight intensity={0.12} color="#e8f4e0" />

      {/* Interior fill — soft warm bounce from the plants */}
      <pointLight position={[0, 0.8, -15]} intensity={0.35} color="#c8e8b8" distance={30} decay={2} />
      <pointLight position={[0, 0.8, -40]} intensity={0.30} color="#c8e8b8" distance={30} decay={2} />
      <pointLight position={[0, 0.8, -65]} intensity={0.28} color="#d0e8c0" distance={30} decay={2} />

      {/* Entrance backlight — rim from outside */}
      <directionalLight position={[0, 8, 20]} intensity={0.6} color="#e8f8ff" />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
// Morning sky (visible through the glass roof)
// ─────────────────────────────────────────────────────────────────
function MorningSky() {
  return (
    <Sky
      distance={450000}
      sunPosition={[100, 18, -60]}
      inclination={0.50}
      azimuth={0.22}
      turbidity={7}
      rayleigh={1.8}
      mieCoefficient={0.004}
      mieDirectionalG={0.82}
    />
  )
}

// ─────────────────────────────────────────────────────────────────
// Post-processing — subtle, natural
// ─────────────────────────────────────────────────────────────────
function PostProcessing({ isMobile }) {
  return (
    <EffectComposer multisampling={isMobile ? 0 : 2}>
      {/* Very subtle bloom for specular highlights and light scatter */}
      <Bloom
        intensity={0.35}
        luminanceThreshold={0.82}
        luminanceSmoothing={0.75}
        mipmapBlur
        radius={0.5}
        blendFunction={BlendFunction.ADD}
      />
      {/* Organic vignette — frames the view like a lens */}
      <Vignette
        offset={0.22}
        darkness={0.45}
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
      camera={{ position: [0, 1.8, 9.5], fov: 52, near: 0.1, far: 200 }}
      shadows={!isMobile}
      gl={{
        antialias: !isMobile,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.25,
        powerPreference: 'high-performance',
      }}
      dpr={isMobile ? [1, 1] : [1, 1.5]}
    >
      <GreenhouseFog />

      <Suspense fallback={null}>
        {/* Sky (visible through glass) */}
        <MorningSky />

        {/* IBL environment (reflections, ambient indirect light) */}
        <Environment preset="dawn" />

        {/* Lighting */}
        <GreenhouseLights />

        {/* Camera */}
        <CameraRig scrollRef={scrollRef} />

        {/* ── Architectural shell ── */}
        <GreenhouseShell />

        {/* ── Floor ── */}
        <GreenhouseFloor />

        {/* ── Botanical life ── */}
        <PlantLife />

        {/* ── Scene 4: Cultivation ── */}
        <CultivationBeds />

        {/* ── Scene 5: Reflection pool ── */}
        <ReflectionPool />

        {/* ── Volumetric light ── */}
        <SunShafts />

        {/* ── Atmosphere ── */}
        <AtmosphericMist isMobile={isMobile} />

        {/* ── Post-processing ── */}
        <PostProcessing isMobile={isMobile} />
      </Suspense>
    </Canvas>
  )
}
