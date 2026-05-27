import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Volumetric sun shaft — cone geometry with additive blending
function SunShaft({ position, rotation, scaleXZ = 1, scaleY = 1, opacity = 0.025 }) {
  const meshRef = useRef()

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    // Very gentle breathing / flicker
    const t = clock.elapsedTime * 0.4 + position[2] * 0.05
    meshRef.current.material.opacity = opacity * (0.7 + Math.sin(t) * 0.3)
  })

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <coneGeometry args={[scaleXZ * 2.5, scaleY * 9, 6, 1, true]} />
      <meshBasicMaterial
        color="#ffe8b0"
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// Wide diffuse shaft — softer glow area
function DiffuseShaft({ position, rotation, opacity = 0.012 }) {
  const meshRef = useRef()

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const t = clock.elapsedTime * 0.25 + position[2] * 0.03
    meshRef.current.material.opacity = opacity * (0.6 + Math.sin(t) * 0.4)
  })

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      <coneGeometry args={[5, 12, 6, 1, true]} />
      <meshBasicMaterial
        color="#fff4d0"
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// The sun enters from the upper right (east morning sun)
// Shafts point downward at ~25° from vertical, angled toward -X
const SUN_ROT_X = Math.PI * 0.15   // tilt forward slightly
const SUN_ROT_Z = -Math.PI * 0.18  // lean toward the left / into the greenhouse

export default function SunShafts() {
  // Shaft positions distributed along the greenhouse length
  const shafts = [
    // [x, y, z], opacity
    { pos: [6.5,  11, -8],  rot: [SUN_ROT_X, 0, SUN_ROT_Z],       opacity: 0.028 },
    { pos: [4.0,  12, -14], rot: [SUN_ROT_X, 0, SUN_ROT_Z * 0.9], opacity: 0.024 },
    { pos: [7.0,  11, -22], rot: [SUN_ROT_X, 0, SUN_ROT_Z],       opacity: 0.022 },
    { pos: [5.0,  11, -30], rot: [SUN_ROT_X, 0, SUN_ROT_Z * 0.8], opacity: 0.018 },
    { pos: [6.0,  10, -40], rot: [SUN_ROT_X, 0, SUN_ROT_Z],       opacity: 0.016 },
    { pos: [4.5,  11, -50], rot: [SUN_ROT_X, 0, SUN_ROT_Z * 0.9], opacity: 0.015 },
    { pos: [3.0,  11, -60], rot: [SUN_ROT_X, 0, SUN_ROT_Z * 0.8], opacity: 0.014 },
    { pos: [5.5,  10, -70], rot: [SUN_ROT_X, 0, SUN_ROT_Z],       opacity: 0.013 },
  ]

  const diffuse = [
    { pos: [3,   12, -15], rot: [SUN_ROT_X * 0.5, 0, SUN_ROT_Z * 0.6] },
    { pos: [-1,  12, -35], rot: [SUN_ROT_X * 0.5, 0, SUN_ROT_Z * 0.5] },
    { pos: [2,   11, -55], rot: [SUN_ROT_X * 0.6, 0, SUN_ROT_Z * 0.7] },
    { pos: [0,   11, -72], rot: [SUN_ROT_X * 0.4, 0, SUN_ROT_Z * 0.5] },
  ]

  return (
    <group>
      {shafts.map((s, i) => (
        <SunShaft
          key={i}
          position={s.pos}
          rotation={s.rot}
          scaleXZ={0.8 + i * 0.05}
          scaleY={0.9 + i * 0.04}
          opacity={s.opacity}
        />
      ))}
      {diffuse.map((d, i) => (
        <DiffuseShaft
          key={`d${i}`}
          position={d.pos}
          rotation={d.rot}
          opacity={0.010 + i * 0.002}
        />
      ))}
    </group>
  )
}
