import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'
import GlassCard from './GlassCard'

function NodeNetwork() {
  const groupRef = useRef()

  const nodes = useMemo(() => {
    const center = { x: 0, y: 0, z: 0 }
    const pts = [center]
    const count = 10
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const r = 1.5 + Math.random() * 0.8
      pts.push({
        x: Math.cos(angle) * r,
        y: (Math.random() - 0.5) * 1.2,
        z: Math.sin(angle) * r,
      })
    }
    // Second ring
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + 0.3
      const r = 2.8 + Math.random() * 0.5
      pts.push({
        x: Math.cos(angle) * r,
        y: (Math.random() - 0.5) * 0.8,
        z: Math.sin(angle) * r,
      })
    }
    return pts
  }, [])

  const edges = useMemo(() => {
    const e = []
    // Center connects to all inner ring
    for (let i = 1; i <= 10; i++) {
      e.push([0, i])
    }
    // Inner ring connects to neighbors
    for (let i = 1; i <= 10; i++) {
      e.push([i, (i % 10) + 1])
    }
    // Some inner to outer
    for (let i = 0; i < 6; i++) {
      e.push([Math.floor(Math.random() * 10) + 1, 11 + i])
    }
    return e
  }, [])

  const lineGeometries = useMemo(() => {
    return edges.map(([a, b]) => {
      const pts = [
        new THREE.Vector3(nodes[a].x, nodes[a].y, nodes[a].z),
        new THREE.Vector3(nodes[b].x, nodes[b].y, nodes[b].z),
      ]
      return new THREE.BufferGeometry().setFromPoints(pts)
    })
  }, [nodes, edges])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = clock.elapsedTime * 0.08
  })

  return (
    <group ref={groupRef} position={[-3.5, 0, -40]}>
      {/* Nodes */}
      {nodes.map((n, i) => (
        <mesh key={i} position={[n.x, n.y, n.z]}>
          <sphereGeometry args={[i === 0 ? 0.18 : 0.09 + Math.random() * 0.06, 16, 16]} />
          <meshStandardMaterial
            color={i === 0 ? '#c9a84c' : '#52b788'}
            emissive={i === 0 ? '#c9a84c' : '#52b788'}
            emissiveIntensity={i === 0 ? 1.5 : 0.8}
          />
        </mesh>
      ))}
      {/* Edges */}
      {lineGeometries.map((geo, i) => (
        <line key={i} geometry={geo}>
          <lineBasicMaterial
            color="#52b788"
            transparent
            opacity={0.2}
          />
        </line>
      ))}
      {/* Outer ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[3.5, 0.008, 8, 80]} />
        <meshBasicMaterial color="#52b788" transparent opacity={0.15} />
      </mesh>
    </group>
  )
}

function HomeShape({ position, delay = 0 }) {
  const meshRef = useRef()

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    meshRef.current.position.y = position[1] + Math.sin(clock.elapsedTime * 0.5 + delay) * 0.1
    meshRef.current.rotation.y = clock.elapsedTime * 0.1 + delay
  })

  return (
    <mesh ref={meshRef} position={position}>
      <octahedronGeometry args={[0.4, 0]} />
      <meshStandardMaterial
        color="#c9a84c"
        emissive="#c9a84c"
        emissiveIntensity={0.6}
        metalness={0.7}
        roughness={0.2}
        transparent
        opacity={0.8}
      />
    </mesh>
  )
}

export default function GroupHomeZone() {
  return (
    <group>
      <NodeNetwork />

      {/* Floating octahedra — community nodes */}
      <HomeShape position={[3, 0.5, -38]} delay={0} />
      <HomeShape position={[4.5, -0.5, -41]} delay={1} />
      <HomeShape position={[2, 1.2, -43]} delay={2} />
      <HomeShape position={[5, 0.8, -39]} delay={0.5} />

      {/* Large encompassing sphere shell */}
      <Float speed={0.2} floatIntensity={0.15} rotationIntensity={0.1}>
        <mesh position={[-3.5, 0, -40]}>
          <sphereGeometry args={[4.5, 32, 32]} />
          <meshStandardMaterial
            color="#52b788"
            transparent
            opacity={0.03}
            side={THREE.BackSide}
            roughness={1}
          />
        </mesh>
      </Float>

      {/* Warm connection arcs */}
      {Array.from({ length: 5 }, (_, i) => {
        const pts = [
          new THREE.Vector3(Math.cos(i * 1.2) * 2, Math.sin(i * 0.8) * 0.5, i * 0.5 - 1),
          new THREE.Vector3(Math.cos(i * 1.2 + 1) * 3, Math.sin(i * 0.8 + 0.5) * 0.8, i * 0.5),
        ]
        const geo = new THREE.BufferGeometry().setFromPoints(pts)
        return (
          <group key={i} position={[2.5, 0, -40]}>
            <line geometry={geo}>
              <lineBasicMaterial color="#c9a84c" transparent opacity={0.25} />
            </line>
          </group>
        )
      })}

      {/* Lighting */}
      <pointLight position={[-3.5, 2, -40]} color="#52b788" intensity={2.5} distance={12} />
      <pointLight position={[4, 0, -40]} color="#c9a84c" intensity={1.5} distance={8} />

      {/* Info card */}
      <GlassCard
        position={[4.8, 0.5, -40]}
        rotation={[0, -0.4, 0]}
        width={4.8}
        height={3.6}
        zoneNumber={3}
        tag="Community Care"
        title="グループホーム\n在宅ケア"
        titleJp="Group Home · Community Living"
        description="A warm, network-based model of community living and home care. We create connected support ecosystems where each person is seen, heard, and cared for within the rhythm of daily life."
        features={[
          'グループホーム — Residential Care',
          '訪問看護 — Home Visit Nursing',
          '生活支援 — Daily Living Support',
          '認知症ケア — Dementia Care',
        ]}
        floatAmplitude={0.06}
        floatSpeed={0.4}
        floatOffset={2}
      />
    </group>
  )
}
