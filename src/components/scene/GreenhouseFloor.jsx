import { useMemo } from 'react'
import * as THREE from 'three'

// Polished stone / concrete floor with subtle tile pattern

function StoneTiles() {
  // Central aisle — slightly lighter, more reflective (polished path)
  // Side areas — warmer stone

  return (
    <group>
      {/* Main floor slab */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.02, -41]}
        receiveShadow
      >
        <planeGeometry args={[22, 99]} />
        <meshStandardMaterial
          color="#9c8f7a"
          roughness={0.82}
          metalness={0.04}
          envMapIntensity={0.5}
        />
      </mesh>

      {/* Central polished strip (path down the middle) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, -41]}
        receiveShadow
      >
        <planeGeometry args={[3.5, 99]} />
        <meshStandardMaterial
          color="#b8aca0"
          roughness={0.45}
          metalness={0.12}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* Subtle tile grid lines — horizontal (every 1.5 units along Z) */}
      {Array.from({ length: 60 }, (_, i) => (
        <mesh
          key={`hz-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.005, -1.5 * i]}
        >
          <planeGeometry args={[22, 0.025]} />
          <meshBasicMaterial
            color="#7a6e62"
            transparent
            opacity={0.25}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Tile grid lines — vertical (every 1.5 units across X) */}
      {Array.from({ length: 15 }, (_, i) => {
        const x = -11 + i * 1.571
        return (
          <mesh
            key={`vt-${i}`}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[x, 0.005, -41]}
          >
            <planeGeometry args={[0.025, 99]} />
            <meshBasicMaterial
              color="#7a6e62"
              transparent
              opacity={0.2}
              depthWrite={false}
            />
          </mesh>
        )
      })}

      {/* Planting bed strips along both walls (slightly lower, darker soil) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-9, -0.01, -41]}
        receiveShadow
      >
        <planeGeometry args={[4, 99]} />
        <meshStandardMaterial
          color="#6a5e50"
          roughness={0.96}
          metalness={0.0}
        />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[9, -0.01, -41]}
        receiveShadow
      >
        <planeGeometry args={[4, 99]} />
        <meshStandardMaterial
          color="#6a5e50"
          roughness={0.96}
          metalness={0.0}
        />
      </mesh>
    </group>
  )
}

// Raised plinth / base along outer walls
function WallBase() {
  return (
    <group>
      <mesh position={[-11, 0.12, -41]} receiveShadow>
        <boxGeometry args={[0.35, 0.24, 99]} />
        <meshStandardMaterial color="#888278" roughness={0.85} metalness={0.05} />
      </mesh>
      <mesh position={[11, 0.12, -41]} receiveShadow>
        <boxGeometry args={[0.35, 0.24, 99]} />
        <meshStandardMaterial color="#888278" roughness={0.85} metalness={0.05} />
      </mesh>
    </group>
  )
}

export default function GreenhouseFloor() {
  return (
    <group>
      <StoneTiles />
      <WallBase />
    </group>
  )
}
