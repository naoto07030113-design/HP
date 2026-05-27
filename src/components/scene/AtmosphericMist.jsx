import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─────────────────────────────────────────────────────────────────
// Greenhouse atmospheric particles — real greenhouse humidity feel
//
// Very sparse. Think: the barely-visible moisture in the air of
// a real botanical conservatory on a quiet morning.
// NOT sci-fi particles. NOT visible effects. Just presence.
// ─────────────────────────────────────────────────────────────────
export default function AtmosphericMist({ isMobile = false }) {
  const count = isMobile ? 180 : 380
  const ref = useRef()

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * 18
      pos[i * 3 + 1] = Math.random() * 10
      pos[i * 3 + 2] = -Math.random() * 88

      // Extremely slow drift — almost imperceptible
      vel[i * 3 + 0] = (Math.random() - 0.5) * 0.0004
      vel[i * 3 + 1] = 0.0002 + Math.random() * 0.0003
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.0003
    }

    return { positions: pos, velocities: vel }
  }, [count])

  useFrame(() => {
    if (!ref.current) return
    const pos = ref.current.geometry.attributes.position.array

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] += velocities[i * 3 + 0]
      pos[i * 3 + 1] += velocities[i * 3 + 1]
      pos[i * 3 + 2] += velocities[i * 3 + 2]

      // Gentle wrap
      if (pos[i * 3 + 1] > 11.0) {
        pos[i * 3 + 1] = 0.2
        pos[i * 3 + 0] = (Math.random() - 0.5) * 18
        pos[i * 3 + 2] = -Math.random() * 88
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
      </bufferGeometry>
      <pointsMaterial
        size={0.055}
        color="#eef4e8"
        transparent
        opacity={0.15}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
