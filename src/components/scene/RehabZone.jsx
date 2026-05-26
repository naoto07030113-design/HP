import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'
import GlassCard from './GlassCard'

function MotionArc({ radius, color, startAngle, endAngle, yOffset, delay, speed }) {
  const meshRef = useRef()

  const curve = useMemo(() => {
    const points = []
    const segments = 80
    for (let i = 0; i <= segments; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / segments)
      points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.5 + yOffset, 0))
    }
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [radius, startAngle, endAngle, yOffset])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    meshRef.current.rotation.z = Math.sin(clock.elapsedTime * speed + delay) * 0.08
    meshRef.current.rotation.x = Math.cos(clock.elapsedTime * speed * 0.7 + delay) * 0.04
  })

  return (
    <line ref={meshRef} geometry={curve}>
      <lineBasicMaterial color={color} transparent opacity={0.5} linewidth={2} />
    </line>
  )
}

function FlowRibbon({ position, scale = 1, color, delay = 0 }) {
  const meshRef = useRef()

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    meshRef.current.rotation.y = clock.elapsedTime * 0.15 + delay
    meshRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.3 + delay) * 0.1
  })

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <torusKnotGeometry args={[0.8, 0.06, 150, 12, 2, 3]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.3}
        metalness={0.3}
        roughness={0.4}
        transparent
        opacity={0.7}
      />
    </mesh>
  )
}

function BodySilhouette() {
  const groupRef = useRef()

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.2) * 0.15
  })

  return (
    <group ref={groupRef} position={[3, 0, -25]}>
      {/* Spine line */}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[0, -2 + i * 0.4, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial
            color="#52b788"
            emissive="#52b788"
            emissiveIntensity={0.8}
          />
        </mesh>
      ))}
      {/* Connecting lines between vertebrae */}
      {Array.from({ length: 11 }, (_, i) => {
        const pts = [
          new THREE.Vector3(0, -2 + i * 0.4, 0),
          new THREE.Vector3(0, -2 + (i + 1) * 0.4, 0),
        ]
        const geo = new THREE.BufferGeometry().setFromPoints(pts)
        return (
          <line key={`l-${i}`} geometry={geo}>
            <lineBasicMaterial color="#52b788" transparent opacity={0.3} />
          </line>
        )
      })}
      {/* Halo rings */}
      {[-1, 0, 1].map((offset, i) => (
        <mesh key={i} position={[0, offset * 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.6 + i * 0.15, 0.008, 8, 60]} />
          <meshStandardMaterial
            color="#52b788"
            emissive="#52b788"
            emissiveIntensity={0.5}
            transparent
            opacity={0.4}
          />
        </mesh>
      ))}
    </group>
  )
}

export default function RehabZone() {
  return (
    <group>
      {/* Motion arcs suggesting movement */}
      <group position={[0, 0, -26]}>
        <MotionArc radius={2.5} color="#52b788" startAngle={-Math.PI * 0.8} endAngle={Math.PI * 0.2} yOffset={0} delay={0} speed={0.3} />
        <MotionArc radius={3.2} color="#c9a84c" startAngle={-Math.PI * 0.6} endAngle={Math.PI * 0.4} yOffset={0.3} delay={1} speed={0.2} />
        <MotionArc radius={1.8} color="#74c69d" startAngle={Math.PI * 0.2} endAngle={Math.PI * 1.0} yOffset={-0.2} delay={2} speed={0.4} />
      </group>

      {/* Flow ribbons */}
      <FlowRibbon position={[4, 0.5, -24]} scale={0.8} color="#52b788" delay={0} />
      <FlowRibbon position={[-3.5, -0.5, -28]} scale={0.6} color="#c9a84c" delay={1.5} />
      <Float speed={0.4} floatIntensity={0.4} rotationIntensity={0.3}>
        <FlowRibbon position={[1, 1.5, -23]} scale={1} color="#2d8653" delay={0.8} />
      </Float>

      {/* Body silhouette */}
      <BodySilhouette />

      {/* Large architectural ring */}
      <Float speed={0.25} rotationIntensity={0.15} floatIntensity={0.2}>
        <mesh position={[0.5, 0, -27]} rotation={[0.2, 0.1, 0.1]}>
          <torusGeometry args={[3.5, 0.015, 12, 120]} />
          <meshStandardMaterial
            color="#52b788"
            emissive="#52b788"
            emissiveIntensity={0.5}
            transparent
            opacity={0.6}
          />
        </mesh>
      </Float>

      {/* Point lights */}
      <pointLight position={[0, 2, -25]} color="#52b788" intensity={3} distance={12} />
      <pointLight position={[4, 0, -24]} color="#c9a84c" intensity={1.5} distance={8} />

      {/* Info card */}
      <GlassCard
        position={[4.2, 0.3, -24]}
        rotation={[0, -0.35, 0]}
        width={4.8}
        height={3.6}
        zoneNumber={2}
        tag="Functional Rehabilitation"
        title="機能リハビリ\nデイサービス"
        titleJp="Day Service · Recovery & Mobility"
        description="Comprehensive functional rehabilitation designed around daily living. Our day-service model supports independent movement recovery with personalized care in a warm, community-centered environment."
        features={[
          '機能訓練 — Functional Training',
          '作業療法 — Occupational Therapy',
          '物理療法 — Physical Therapy',
          '日常生活動作支援 — ADL Support',
        ]}
        floatAmplitude={0.07}
        floatSpeed={0.45}
        floatOffset={1}
      />
    </group>
  )
}
