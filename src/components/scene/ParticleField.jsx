import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function ParticleField({ count = 2400, spread = 40 }) {
  const meshRef = useRef()
  const timeRef = useRef(0)

  const { positions, speeds, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    const sizes = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spread
      positions[i * 3 + 1] = (Math.random() - 0.5) * (spread * 0.6)
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread * 3 - 20
      speeds[i] = 0.3 + Math.random() * 0.7
      sizes[i] = 0.5 + Math.random() * 2
    }

    return { positions, speeds, sizes }
  }, [count, spread])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    timeRef.current = clock.elapsedTime

    const pos = meshRef.current.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      const idx = i * 3
      pos[idx + 1] += speeds[i] * 0.004
      pos[idx] += Math.sin(timeRef.current * 0.3 + i * 0.1) * 0.001

      if (pos[idx + 1] > spread * 0.3) {
        pos[idx + 1] = -spread * 0.3
      }
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          array={sizes}
          count={count}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#52b788"
        transparent
        opacity={0.35}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}
