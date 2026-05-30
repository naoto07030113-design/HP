import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function DustParticles({ count = 600 }) {
  const pointsRef = useRef()

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 14      // x — span width of restaurant
      pos[i * 3 + 1] = Math.random() * 3.2              // y — floor to ceiling
      pos[i * 3 + 2] = 14 - Math.random() * 46          // z — entire restaurant depth
      vel[i * 3 + 0] = (Math.random() - 0.5) * 0.004
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.002 - 0.0005
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.003
    }
    return { positions: pos, velocities: vel }
  }, [count])

  const sizes = useMemo(() => {
    const s = new Float32Array(count)
    for (let i = 0; i < count; i++) s[i] = Math.random() * 0.025 + 0.008
    return s
  }, [count])

  useFrame(() => {
    if (!pointsRef.current) return
    const pos = pointsRef.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] += velocities[i * 3 + 0]
      pos[i * 3 + 1] += velocities[i * 3 + 1]
      pos[i * 3 + 2] += velocities[i * 3 + 2]
      // Wrap around when out of bounds
      if (pos[i * 3 + 1] < 0) pos[i * 3 + 1] = 3.2
      if (pos[i * 3 + 1] > 3.2) pos[i * 3 + 1] = 0
      if (pos[i * 3 + 0] > 7) pos[i * 3 + 0] = -7
      if (pos[i * 3 + 0] < -7) pos[i * 3 + 0] = 7
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        color="#ffcc88"
        size={0.018}
        sizeAttenuation
        transparent
        opacity={0.35}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
