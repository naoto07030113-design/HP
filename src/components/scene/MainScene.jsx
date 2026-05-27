import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
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
// Greenhouse humidity haze
// ─────────────────────────────────────────────────────────────────
function GreenhouseFog({ isMobile }) {
  const { scene } = useThree()
  useMemo(() => {
    scene.fog = new THREE.FogExp2('#dce8d4', isMobile ? 0.008 : 0.006)
  }, [scene, isMobile])
  return null
}

// ─────────────────────────────────────────────────────────────────
// Reflecting pool
// ─────────────────────────────────────────────────────────────────
function ReflectionPool() {
  return (
    <group position={[0, 0.04, -72]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7, 14]} />
        <meshStandardMaterial color="#3a5040" roughness={0.0} metalness={0.88} />
      </mesh>
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[7.5, 0.12, 14.5]} />
        <meshStandardMaterial color="#9a8e7e" roughness={0.82} />
      </mesh>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Camera rig — human walking pace
// ─────────────────────────────────────────────────────────────────
function CameraRig({ scrollRef, isMobile }) {
  const { camera } = useThree()

  const camCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,    1.72,  9.5),
    new THREE.Vector3(0,    1.72,  4.5),
    new THREE.Vector3(0.2,  1.72,  0.0),
    new THREE.Vector3(-0.4, 1.78, -7.0),
    new THREE.Vector3(0,    1.95, -13.5),
    new THREE.Vector3(0.8,  1.75, -19.5),
    new THREE.Vector3(0.2,  1.72, -25.5),
    new THREE.Vector3(-0.9, 1.72, -31.5),
    new THREE.Vector3(0,    1.72, -38.0),
    new THREE.Vector3(0.5,  1.72, -45.0),
    new THREE.Vector3(-0.3, 1.72, -53.5),
    new THREE.Vector3(0.2,  1.75, -61.5),
    new THREE.Vector3(0,    1.78, -69.5),
    new THREE.Vector3(0,    1.85, -75.5),
  ]), [])

  const lookCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0,    1.65,  2.0),
    new THREE.Vector3(0,    1.65, -0.5),
    new THREE.Vector3(0,    1.65, -5.5),
    new THREE.Vector3(-0.2, 1.70, -13.0),
    new THREE.Vector3(0,    2.10, -21.0),
    new THREE.Vector3(0.5,  1.72, -26.5),
    new THREE.Vector3(0,    1.70, -32.5),
    new THREE.Vector3(-0.6, 1.70, -39.0),
    new THREE.Vector3(0,    1.70, -45.5),
    new THREE.Vector3(0.3,  1.70, -52.5),
    new THREE.Vector3(-0.2, 1.70, -60.5),
    new THREE.Vector3(0,    1.72, -67.5),
    new THREE.Vector3(0,    1.75, -75.0),
    new THREE.Vector3(0,    1.82, -82.0),
  ]), [])

  const lookTarget = useRef(new THREE.Vector3(0, 1.65, 2.0))

  useFrame(() => {
    const t = Math.min(Math.max(scrollRef.current, 0), 1)
    const speed = isMobile ? 0.04 : 0.025
    camera.position.lerp(camCurve.getPoint(t), speed)
    lookTarget.current.lerp(lookCurve.getPoint(t), speed)
    camera.lookAt(lookTarget.current)
  })

  return null
}

// ─────────────────────────────────────────────────────────────────
// Desktop lighting — full quality with shadows
// ─────────────────────────────────────────────────────────────────
function DesktopLights() {
  return (
    <>
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
      <hemisphereLight skyColor="#c0d8e8" groundColor="#4a5e38" intensity={0.75} />
      <ambientLight intensity={0.08} color="#f0ece4" />
      <pointLight position={[0, 1.0, -14]} intensity={0.20} color="#d8ecb8" distance={28} decay={2} />
      <pointLight position={[0, 1.0, -38]} intensity={0.18} color="#d4e8b4" distance={26} decay={2} />
      <pointLight position={[0, 1.0, -62]} intensity={0.16} color="#d8ecc0" distance={26} decay={2} />
      <directionalLight position={[0, 6, 18]} intensity={0.5} color="#e4f0ff" />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
// Mobile lighting — no shadows, slightly brighter ambient
// ─────────────────────────────────────────────────────────────────
function MobileLights() {
  return (
    <>
      {/* No castShadow — saves huge GPU memory on mobile */}
      <directionalLight position={[12, 20, 6]} intensity={2.8} color="#fff5dc" />
      <hemisphereLight skyColor="#c0d8e8" groundColor="#4a5e38" intensity={0.90} />
      {/* Higher ambient so nothing goes black on mobile */}
      <ambientLight intensity={0.25} color="#e8f0e0" />
      <directionalLight position={[0, 6, 18]} intensity={0.6} color="#e4f0ff" />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
// Morning sky — pure GLSL shader, no network requests
// ─────────────────────────────────────────────────────────────────
function MorningSky() {
  return (
    <Sky
      distance={450000}
      sunPosition={[100, 15, -55]}
      turbidity={6}
      rayleigh={1.5}
      mieCoefficient={0.004}
      mieDirectionalG={0.84}
    />
  )
}

// ─────────────────────────────────────────────────────────────────
// Desktop post-processing only
// ─────────────────────────────────────────────────────────────────
function PostProcessing() {
  return (
    <EffectComposer multisampling={0}>
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
// Desktop scene contents
// ─────────────────────────────────────────────────────────────────
function DesktopScene({ scrollRef }) {
  return (
    <>
      <MorningSky />
      <DesktopLights />
      <CameraRig scrollRef={scrollRef} isMobile={false} />
      <GreenhouseShell isMobile={false} />
      <GreenhouseFloor />
      <PlantLife isMobile={false} />
      <CultivationBeds />
      <ReflectionPool />
      <SunShafts />
      <AtmosphericMist isMobile={false} />
      <PostProcessing />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
// Mobile scene — simplified, zero network dependencies
// ─────────────────────────────────────────────────────────────────
function MobileScene({ scrollRef }) {
  return (
    <>
      {/* Sky is pure GLSL — safe on all mobile browsers */}
      <MorningSky />
      <MobileLights />
      <CameraRig scrollRef={scrollRef} isMobile={true} />
      {/* Fewer ribs, same visual */}
      <GreenhouseShell isMobile={true} />
      <GreenhouseFloor />
      {/* Simplified plant clusters */}
      <PlantLife isMobile={true} />
      <ReflectionPool />
      {/* Only floor light patches, no cone shafts */}
      <AtmosphericMist isMobile={true} />
      {/* NO EffectComposer — crashes mobile WebGL */}
      {/* NO Environment — fetches remote HDR, fails on mobile networks */}
    </>
  )
}

// ─────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────
export default function MainScene({ scrollRef, isMobile }) {
  return (
    <Canvas
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
      }}
      camera={{
        position: [0, 1.72, 9.5],
        fov: isMobile ? 65 : 50,
        near: 0.1,
        far: 150,
      }}
      shadows={isMobile ? false : 'soft'}
      gl={{
        antialias: !isMobile,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: isMobile ? 1.3 : 1.15,
        powerPreference: isMobile ? 'low-power' : 'high-performance',
        // Prevent context loss on iOS
        preserveDrawingBuffer: false,
        failIfMajorPerformanceCaveat: false,
      }}
      dpr={isMobile ? [1, 1] : [1, 1.5]}
      // Simple color background — renders immediately before sky loads
      onCreated={({ scene }) => {
        scene.background = new THREE.Color('#1a3020')
      }}
    >
      <GreenhouseFog isMobile={isMobile} />

      <Suspense fallback={null}>
        {isMobile
          ? <MobileScene scrollRef={scrollRef} />
          : <DesktopScene scrollRef={scrollRef} />
        }
      </Suspense>
    </Canvas>
  )
}
