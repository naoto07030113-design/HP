import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import CameraController from './CameraController'
import RestaurantWorld from './RestaurantWorld'
import DustParticles from './DustParticles'

function PostProcessing() {
  return (
    <EffectComposer multisampling={2}>
      <Bloom
        intensity={1.1}
        luminanceThreshold={0.52}
        luminanceSmoothing={0.28}
        radius={0.75}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.28} darkness={0.68} />
    </EffectComposer>
  )
}

export default function MainScene({ scrollRef }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  return (
    <Canvas
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
      camera={{ position: [0, 1.72, 13.5], fov: 58, near: 0.1, far: 120 }}
      shadows={!isMobile}
      gl={{
        antialias: !isMobile,
        alpha: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
        powerPreference: 'high-performance',
      }}
      dpr={isMobile ? [1, 1] : [1, 1.5]}
      onCreated={({ gl }) => {
        gl.setClearColor('#0d0602')
      }}
    >
      <fogExp2 attach="fog" color="#180a04" density={0.024} />

      <Suspense fallback={null}>
        <CameraController scrollRef={scrollRef} />
        <RestaurantWorld scrollRef={scrollRef} />
        <DustParticles count={isMobile ? 200 : 500} />
        <PostProcessing />
      </Suspense>
    </Canvas>
  )
}
