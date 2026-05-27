import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Floating atmospheric particles — mist, pollen, dust
export default function AtmosphericMist({ isMobile = false }) {
  const count = isMobile ? 400 : 900
  const ref = useRef()

  // Initialize particle positions spread across the full greenhouse
  const { positions, velocities, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)
    const siz = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      // Distributed across greenhouse volume
      pos[i * 3 + 0] = (Math.random() - 0.5) * 19     // x: -9.5 to 9.5
      pos[i * 3 + 1] = Math.random() * 10.5            // y: 0 to 10.5
      pos[i * 3 + 2] = -Math.random() * 90             // z: 0 to -90

      // Very slow drift upward with slight random horizontal wander
      vel[i * 3 + 0] = (Math.random() - 0.5) * 0.0008
      vel[i * 3 + 1] = 0.0004 + Math.random() * 0.0006
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.0005

      siz[i] = 0.015 + Math.random() * 0.04
    }

    return { positions: pos, velocities: vel, sizes: siz }
  }, [count])

  useFrame(() => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] += velocities[i * 3 + 0]
      pos[i * 3 + 1] += velocities[i * 3 + 1]
      pos[i * 3 + 2] += velocities[i * 3 + 2]

      // Wrap vertically (reset when particle rises too high)
      if (pos[i * 3 + 1] > 11.5) {
        pos[i * 3 + 1] = 0.1
        pos[i * 3 + 0] = (Math.random() - 0.5) * 19
        pos[i * 3 + 2] = -Math.random() * 90
      }
    }

    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
          count={count}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#e8f0e0"
        transparent
        opacity={0.25}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
