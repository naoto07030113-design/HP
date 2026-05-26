import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

export default function GlassCard({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  width = 5,
  height = 3.5,
  zoneNumber,
  tag,
  title,
  titleJp,
  description,
  features = [],
  floatAmplitude = 0.08,
  floatSpeed = 0.4,
  floatOffset = 0,
}) {
  const groupRef = useRef()

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    groupRef.current.position.y =
      position[1] + Math.sin(clock.elapsedTime * floatSpeed + floatOffset) * floatAmplitude
  })

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Glass backing panel */}
      <mesh renderOrder={1}>
        <planeGeometry args={[width, height]} />
        <meshPhysicalMaterial
          color="#0a1a12"
          transparent
          opacity={0.55}
          roughness={0.05}
          metalness={0}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>

      {/* Subtle inner glow plane */}
      <mesh position={[0, 0, -0.01]} renderOrder={0}>
        <planeGeometry args={[width * 1.1, height * 1.1]} />
        <meshBasicMaterial
          color={new THREE.Color(0.1, 0.4, 0.25)}
          transparent
          opacity={0.06}
          depthWrite={false}
        />
      </mesh>

      {/* Top gold border line */}
      <mesh position={[0, height / 2 - 0.005, 0.001]}>
        <planeGeometry args={[width, 0.01]} />
        <meshBasicMaterial color={new THREE.Color(0.79, 0.66, 0.3)} transparent opacity={0.7} />
      </mesh>

      {/* Bottom thin line */}
      <mesh position={[0, -(height / 2 - 0.005), 0.001]}>
        <planeGeometry args={[width, 0.003]} />
        <meshBasicMaterial color={new THREE.Color(0.79, 0.66, 0.3)} transparent opacity={0.3} />
      </mesh>

      {/* Left thin vertical accent */}
      <mesh position={[-(width / 2 - 0.005), 0, 0.001]}>
        <planeGeometry args={[0.003, height]} />
        <meshBasicMaterial color={new THREE.Color(0.79, 0.66, 0.3)} transparent opacity={0.3} />
      </mesh>

      {/* HTML content overlay */}
      <Html
        position={[0, 0, 0.02]}
        transform
        distanceFactor={6}
        zIndexRange={[100, 0]}
        style={{ width: `${width * 80}px`, pointerEvents: 'none' }}
      >
        <div className="zone-html">
          <div className="zone-number">0{zoneNumber}</div>
          <div className="zone-tag">{tag}</div>
          <h2>{title}</h2>
          <div className="jp-title">{titleJp}</div>
          <div className="divider" />
          <p>{description}</p>
          {features.length > 0 && (
            <ul className="feature-list">
              {features.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
          )}
          <div className="cta-link">詳細を見る</div>
        </div>
      </Html>
    </group>
  )
}
