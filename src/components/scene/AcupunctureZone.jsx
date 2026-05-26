import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'
import GlassCard from './GlassCard'

function MeridianLine({ start, end, color = '#c9a84c', opacity = 0.3 }) {
  const points = useMemo(() => [new THREE.Vector3(...start), new THREE.Vector3(...end)], [start, end])
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points])

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={opacity} linewidth={1} />
    </line>
  )
}

function NeedleCluster({ position = [0, 0, 0] }) {
  const needles = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      x: (Math.random() - 0.5) * 4,
      y: -0.5 + Math.random() * 0.2,
      z: (Math.random() - 0.5) * 3,
      h: 0.8 + Math.random() * 2.5,
      tilt: (Math.random() - 0.5) * 0.15,
      delay: Math.random() * Math.PI * 2,
    }))
  }, [])

  const groupRef = useRef()

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.children.forEach((child, i) => {
      if (needles[i]) {
        child.position.y =
          needles[i].y + Math.sin(clock.elapsedTime * 0.6 + needles[i].delay) * 0.04
      }
    })
  })

  return (
    <group position={position} ref={groupRef}>
      {needles.map((n, i) => (
        <mesh
          key={i}
          position={[n.x, n.y + n.h / 2, n.z]}
          rotation={[n.tilt, 0, (Math.random() - 0.5) * 0.05]}
        >
          <cylinderGeometry args={[0.004, 0.008, n.h, 6]} />
          <meshStandardMaterial
            color="#e8c97a"
            emissive="#c9a84c"
            emissiveIntensity={0.4}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      ))}
    </group>
  )
}

function MeridianDisc() {
  const discRef = useRef()

  const meridianPoints = useMemo(() => {
    const pts = []
    const bodies = [
      [0, 0], [0, 0.8], [0, 1.5], [-0.3, 0.5], [0.3, 0.5],
      [-0.5, -0.2], [0.5, -0.2], [-0.8, 0.2], [0.8, 0.2],
    ]
    bodies.forEach(([x, y]) => {
      pts.push({ x: x * 1.2, y: y * 1.5, r: 0.05 + Math.random() * 0.04 })
    })
    return pts
  }, [])

  useFrame(({ clock }) => {
    if (!discRef.current) return
    discRef.current.rotation.y = Math.sin(clock.elapsedTime * 0.15) * 0.1
  })

  return (
    <group ref={discRef} position={[2.5, 0, -13]}>
      {/* Glowing points */}
      {meridianPoints.map((pt, i) => (
        <mesh key={i} position={[pt.x, pt.y, 0]}>
          <sphereGeometry args={[pt.r, 12, 12]} />
          <meshStandardMaterial
            color="#c9a84c"
            emissive="#c9a84c"
            emissiveIntensity={1.5 + Math.sin(i) * 0.5}
          />
        </mesh>
      ))}
      {/* Meridian connection lines */}
      {meridianPoints.slice(0, -1).map((pt, i) => (
        <MeridianLine
          key={i}
          start={[meridianPoints[i].x, meridianPoints[i].y, 0]}
          end={[meridianPoints[(i + 2) % meridianPoints.length].x, meridianPoints[(i + 2) % meridianPoints.length].y, 0]}
          opacity={0.2}
        />
      ))}
      {/* Large torus ring around body */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.2, 0.01, 8, 80]} />
        <meshBasicMaterial color="#c9a84c" transparent opacity={0.2} />
      </mesh>
    </group>
  )
}

export default function AcupunctureZone() {
  return (
    <group>
      {/* Needle clusters */}
      <NeedleCluster position={[-4, -1.5, -12]} />
      <NeedleCluster position={[-2.5, -1.5, -16]} />
      <NeedleCluster position={[1, -1.5, -10]} />

      {/* Meridian body diagram */}
      <MeridianDisc />

      {/* Floating large torus - symbol of acupuncture rings */}
      <Float speed={0.5} rotationIntensity={0.2} floatIntensity={0.3}>
        <mesh position={[-0.5, 0.5, -11]} rotation={[0.3, 0.5, 0.2]}>
          <torusGeometry args={[1.8, 0.025, 16, 120]} />
          <meshStandardMaterial
            color="#c9a84c"
            emissive="#c9a84c"
            emissiveIntensity={0.6}
            metalness={0.8}
            roughness={0.1}
            transparent
            opacity={0.8}
          />
        </mesh>
      </Float>

      <Float speed={0.3} rotationIntensity={0.1} floatIntensity={0.2}>
        <mesh position={[-0.5, 0.5, -11]} rotation={[0.3, 0.5, 0.2]}>
          <torusGeometry args={[2.5, 0.01, 8, 100]} />
          <meshStandardMaterial
            color="#52b788"
            emissive="#52b788"
            emissiveIntensity={0.3}
            transparent
            opacity={0.4}
          />
        </mesh>
      </Float>

      {/* Horizontal grid of meridian lines */}
      {Array.from({ length: 8 }, (_, i) => (
        <MeridianLine
          key={`h-${i}`}
          start={[-6, -1.8 + i * 0.5, -14]}
          end={[6, -1.8 + i * 0.5, -14]}
          opacity={0.06}
          color="#52b788"
        />
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <MeridianLine
          key={`v-${i}`}
          start={[-5.5 + i * 1, -2.5, -14]}
          end={[-5.5 + i * 1, 2.5, -14]}
          opacity={0.06}
          color="#52b788"
        />
      ))}

      {/* Gold point lights for this zone */}
      <pointLight position={[-4, 2, -12]} color="#c9a84c" intensity={2} distance={10} />
      <pointLight position={[3, 1, -14]} color="#52b788" intensity={1.5} distance={8} />

      {/* Info card */}
      <GlassCard
        position={[-4.5, 0.2, -10]}
        rotation={[0, 0.3, 0]}
        width={4.8}
        height={3.6}
        zoneNumber={1}
        tag="Acupuncture & Manual Therapy"
        title="鍼灸・手技療法"
        titleJp="Traditional Healing Reimagined"
        description="Ancient Japanese acupuncture traditions fused with precision manual therapy. Our practitioners blend meridian science with evidence-based myofascial techniques for whole-body restoration."
        features={[
          '鍼灸治療 — Acupuncture Treatment',
          '整体・マッサージ — Manual Therapy',
          '経絡調整 — Meridian Balancing',
          '灸治療 — Moxibustion',
        ]}
        floatAmplitude={0.06}
        floatSpeed={0.35}
        floatOffset={0}
      />
    </group>
  )
}
