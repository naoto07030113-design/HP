import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'
import GlassCard from './GlassCard'

function DNAHelix({ position = [0, 0, 0], length = 5 }) {
  const groupRef = useRef()

  const { strand1Pts, strand2Pts, rungs } = useMemo(() => {
    const s1 = []
    const s2 = []
    const r = []
    const segments = 60

    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const y = (t - 0.5) * length
      const angle = t * Math.PI * 6
      const radius = 0.4

      s1.push(new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius))
      s2.push(new THREE.Vector3(Math.cos(angle + Math.PI) * radius, y, Math.sin(angle + Math.PI) * radius))

      if (i % 8 === 0) {
        r.push({ a: s1[s1.length - 1].clone(), b: s2[s2.length - 1].clone() })
      }
    }

    return {
      strand1Pts: new THREE.BufferGeometry().setFromPoints(s1),
      strand2Pts: new THREE.BufferGeometry().setFromPoints(s2),
      rungs: r,
    }
  }, [length])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = clock.elapsedTime * 0.12
  })

  return (
    <group ref={groupRef} position={position}>
      {/* Strand 1 */}
      <line geometry={strand1Pts}>
        <lineBasicMaterial color="#52b788" transparent opacity={0.8} linewidth={2} />
      </line>
      {/* Strand 2 */}
      <line geometry={strand2Pts}>
        <lineBasicMaterial color="#c9a84c" transparent opacity={0.8} linewidth={2} />
      </line>
      {/* Base pair rungs */}
      {rungs.map((rung, i) => {
        const pts = [rung.a, rung.b]
        const geo = new THREE.BufferGeometry().setFromPoints(pts)
        return (
          <group key={i}>
            <line geometry={geo}>
              <lineBasicMaterial color="#74c69d" transparent opacity={0.4} />
            </line>
            <mesh position={rung.a}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial color="#52b788" emissive="#52b788" emissiveIntensity={1} />
            </mesh>
            <mesh position={rung.b}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshStandardMaterial color="#c9a84c" emissive="#c9a84c" emissiveIntensity={1} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function OrganicLeaf({ position, rotation, scale = 1, delay = 0 }) {
  const meshRef = useRef()

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    meshRef.current.rotation.z = rotation[2] + Math.sin(clock.elapsedTime * 0.4 + delay) * 0.08
    meshRef.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.35 + delay) * 0.08
  })

  return (
    <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
      <coneGeometry args={[0.3, 1.2, 6]} />
      <meshStandardMaterial
        color="#1a5c3a"
        emissive="#2d8653"
        emissiveIntensity={0.4}
        roughness={0.7}
        metalness={0.1}
        transparent
        opacity={0.85}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function BioGlowSphere({ position, r = 0.3, color = '#52b788', delay = 0, speed = 0.3 }) {
  const meshRef = useRef()

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const scale = 1 + Math.sin(clock.elapsedTime * speed + delay) * 0.15
    meshRef.current.scale.setScalar(scale)
    meshRef.current.material.emissiveIntensity = 0.6 + Math.sin(clock.elapsedTime * speed * 1.5 + delay) * 0.4
  })

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[r, 20, 20]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.8}
        transparent
        opacity={0.7}
      />
    </mesh>
  )
}

function GrowthParticles({ position = [0, 0, 0] }) {
  const meshRef = useRef()

  const { positions, velocities } = useMemo(() => {
    const count = 300
    const pos = new Float32Array(count * 3)
    const vel = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = Math.random() * 2
      pos[i * 3] = Math.cos(angle) * r
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3
      pos[i * 3 + 2] = Math.sin(angle) * r
      vel[i * 3] = (Math.random() - 0.5) * 0.003
      vel[i * 3 + 1] = 0.005 + Math.random() * 0.008
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.003
    }

    return { positions: pos, velocities: vel }
  }, [])

  useFrame(() => {
    if (!meshRef.current) return
    const pos = meshRef.current.geometry.attributes.position.array
    const count = pos.length / 3

    for (let i = 0; i < count; i++) {
      pos[i * 3] += velocities[i * 3]
      pos[i * 3 + 1] += velocities[i * 3 + 1]
      pos[i * 3 + 2] += velocities[i * 3 + 2]

      if (pos[i * 3 + 1] > 2.5) {
        pos[i * 3 + 1] = -1.5
        pos[i * 3] = (Math.random() - 0.5) * 4
        pos[i * 3 + 2] = (Math.random() - 0.5) * 4
      }
    }
    meshRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={meshRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={positions.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#52b788" transparent opacity={0.6} sizeAttenuation depthWrite={false} />
    </points>
  )
}

export default function BioParkZone() {
  return (
    <group>
      {/* DNA Helixes */}
      <DNAHelix position={[-2, 0, -56]} length={5} />
      <DNAHelix position={[1.5, 0.5, -58]} length={3.5} />

      {/* Organic leaf/plant forms */}
      <OrganicLeaf position={[-4.5, -1, -54]} rotation={[0.3, 0, -0.3]} scale={1.2} delay={0} />
      <OrganicLeaf position={[-3.8, -0.5, -53]} rotation={[0.1, 0.5, 0.4]} scale={0.8} delay={0.7} />
      <OrganicLeaf position={[5, -1, -56]} rotation={[0.2, -0.3, 0.3]} scale={1} delay={1.4} />
      <OrganicLeaf position={[4.2, -0.8, -58]} rotation={[-0.2, 0.4, -0.5]} scale={0.7} delay={2} />
      <OrganicLeaf position={[0, -1.2, -60]} rotation={[0.1, 0, 0.1]} scale={1.4} delay={0.3} />
      <OrganicLeaf position={[2, -1, -62]} rotation={[0.2, -0.2, -0.3]} scale={0.9} delay={1} />

      {/* Bioluminescent glow spheres */}
      <BioGlowSphere position={[-4, 1, -55]} r={0.2} color="#52b788" delay={0} speed={0.4} />
      <BioGlowSphere position={[4, 0.5, -57]} r={0.15} color="#74c69d" delay={1} speed={0.5} />
      <BioGlowSphere position={[0, 2, -59]} r={0.25} color="#2d8653" delay={2} speed={0.3} />
      <BioGlowSphere position={[-2.5, -0.5, -60]} r={0.12} color="#52b788" delay={0.5} speed={0.6} />
      <BioGlowSphere position={[3, 1.5, -54]} r={0.18} color="#c9a84c" delay={1.5} speed={0.35} />

      {/* Growth particle system */}
      <GrowthParticles position={[0, -0.5, -57]} />

      {/* Large architectural sphere - the bio dome */}
      <Float speed={0.15} floatIntensity={0.1} rotationIntensity={0.05}>
        <mesh position={[0, 0, -57]}>
          <sphereGeometry args={[5.5, 40, 40]} />
          <meshStandardMaterial
            color="#052213"
            transparent
            opacity={0.25}
            side={THREE.BackSide}
            roughness={1}
            emissive="#1a5c3a"
            emissiveIntensity={0.08}
          />
        </mesh>
      </Float>

      {/* Structural grid inside dome */}
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2
        const pts = [
          new THREE.Vector3(0, -5, 0),
          new THREE.Vector3(Math.cos(angle) * 5.5, 0, Math.sin(angle) * 5.5),
          new THREE.Vector3(0, 5, 0),
        ]
        const geo = new THREE.BufferGeometry().setFromPoints(pts)
        return (
          <group key={i} position={[0, 0, -57]}>
            <line geometry={geo}>
              <lineBasicMaterial color="#52b788" transparent opacity={0.08} />
            </line>
          </group>
        )
      })}

      {/* Equator ring */}
      <mesh position={[0, 0, -57]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[5.5, 0.01, 8, 100]} />
        <meshBasicMaterial color="#52b788" transparent opacity={0.15} />
      </mesh>

      {/* Lighting */}
      <pointLight position={[0, 2, -57]} color="#52b788" intensity={4} distance={15} />
      <pointLight position={[-3, 0, -55]} color="#2d8653" intensity={2} distance={10} />
      <pointLight position={[3, 0, -58]} color="#c9a84c" intensity={1.5} distance={8} />

      {/* Info card */}
      <GlassCard
        position={[-5, 0.3, -55]}
        rotation={[0, 0.45, 0]}
        width={4.8}
        height={3.8}
        zoneNumber={4}
        tag="Future Healthcare Agriculture"
        title="BIO PARK\n農業×医療"
        titleJp="The Living Future of Health"
        description="Where biotechnology meets nature. BIO PARK integrates precision agriculture, genomics, and therapeutic horticulture into a vision of healthcare that grows from the earth — nurturing both body and ecosystem."
        features={[
          '薬草栽培 — Medicinal Herb Farming',
          'ゲノム農業 — Genomic Agriculture',
          '治療的園芸 — Horticultural Therapy',
          'バイオ研究 — Biomedical Research',
        ]}
        floatAmplitude={0.08}
        floatSpeed={0.3}
        floatOffset={3}
      />
    </group>
  )
}
