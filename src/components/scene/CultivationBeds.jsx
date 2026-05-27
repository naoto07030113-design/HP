import { useMemo } from 'react'
import * as THREE from 'three'

// ─────────────────────────────────────────────────────────────────
// Individual raised growing bed
// ─────────────────────────────────────────────────────────────────
function RaisedBed({ position, rotation = [0, 0, 0], width = 2.4, length = 7, cropType = 0 }) {
  const cropColors = ['#3a7828', '#4a8c30', '#2d6020', '#5a9840', '#3d7030']
  const cropColor = cropColors[cropType % cropColors.length]

  // Generate crop row positions
  const cropRows = useMemo(() => {
    const rows = []
    const cols = Math.floor(width / 0.45) - 1
    const zSlots = Math.floor(length / 0.6) - 1
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < zSlots; row++) {
        rows.push({
          x: -width / 2 + 0.45 + col * 0.45,
          z: -length / 2 + 0.65 + row * 0.6,
          s: 0.12 + Math.random() * 0.08,
        })
      }
    }
    return rows
  }, [width, length])

  return (
    <group position={position} rotation={rotation}>
      {/* Bed frame (dark wood) */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width + 0.15, 0.65, length + 0.15]} />
        <meshStandardMaterial color="#3a2810" roughness={0.92} metalness={0} />
      </mesh>

      {/* Soil surface */}
      <mesh position={[0, 0.33, 0]} receiveShadow>
        <boxGeometry args={[width, 0.04, length]} />
        <meshStandardMaterial color="#281a0c" roughness={1.0} metalness={0} />
      </mesh>

      {/* Crop plants */}
      {cropRows.map((crop, i) => (
        <mesh key={i} position={[crop.x, 0.35 + crop.s, crop.z]} castShadow>
          <sphereGeometry args={[crop.s, 6, 5]} />
          <meshStandardMaterial
            color={cropColor}
            roughness={0.9}
            metalness={0}
          />
        </mesh>
      ))}

      {/* Drip irrigation tube along top */}
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.018, 0.018, length, 6]} />
        <meshStandardMaterial color="#404040" roughness={0.7} metalness={0.3} />
      </mesh>
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Vertical growing rack (wall-mounted hydroponic system)
// ─────────────────────────────────────────────────────────────────
function HydroponicRack({ position, rotation = [0, 0, 0] }) {
  const tiers = 4
  const tierHeight = 0.85

  return (
    <group position={position} rotation={rotation}>
      {/* Back frame */}
      <mesh>
        <boxGeometry args={[0.08, tiers * tierHeight + 0.4, 5]} />
        <meshStandardMaterial color="#484840" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Horizontal trays */}
      {Array.from({ length: tiers }, (_, tier) => (
        <group key={tier} position={[0.4, tier * tierHeight + 0.4, 0]}>
          {/* Tray */}
          <mesh>
            <boxGeometry args={[0.7, 0.08, 4.5]} />
            <meshStandardMaterial color="#505845" metalness={0.3} roughness={0.6} />
          </mesh>
          {/* Plants in tray */}
          {Array.from({ length: 12 }, (_, j) => (
            <mesh key={j} position={[0, 0.15, -2.0 + j * 0.38]} castShadow>
              <sphereGeometry args={[0.10 + Math.random() * 0.05, 6, 4]} />
              <meshStandardMaterial
                color={tier % 2 === 0 ? '#4a8c30' : '#3a6a20'}
                roughness={0.9}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Asparagus mound (characteristic elongated mounds)
// ─────────────────────────────────────────────────────────────────
function AsparagusRow({ position }) {
  return (
    <group position={position}>
      {/* Mound */}
      <mesh receiveShadow>
        <cylinderGeometry args={[0.3, 0.45, 0.22, 8]} />
        <meshStandardMaterial color="#3a2810" roughness={1.0} />
      </mesh>
      {/* Asparagus spears emerging */}
      {Array.from({ length: 5 }, (_, i) => {
        const angle = (i / 5) * Math.PI * 2
        const r = 0.12
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * r, 0.25, Math.sin(angle) * r]}
            castShadow
          >
            <cylinderGeometry args={[0.018, 0.025, 0.5 + Math.random() * 0.4, 5]} />
            <meshStandardMaterial color="#4a7830" roughness={0.9} />
          </mesh>
        )
      })}
    </group>
  )
}

// ─────────────────────────────────────────────────────────────────
// Full cultivation zone (Scene 4)
// ─────────────────────────────────────────────────────────────────
export default function CultivationBeds() {
  // Raised beds down both sides
  const leftBeds = [
    { z: -47, cropType: 0 },
    { z: -55, cropType: 1 },
    { z: -63, cropType: 2 },
  ]
  const rightBeds = [
    { z: -50, cropType: 3 },
    { z: -58, cropType: 4 },
    { z: -66, cropType: 0 },
  ]

  return (
    <group>
      {/* Left raised beds */}
      {leftBeds.map((bed, i) => (
        <RaisedBed
          key={`l${i}`}
          position={[-8, 0.33, bed.z]}
          cropType={bed.cropType}
        />
      ))}

      {/* Right raised beds */}
      {rightBeds.map((bed, i) => (
        <RaisedBed
          key={`r${i}`}
          position={[8, 0.33, bed.z]}
          cropType={bed.cropType}
        />
      ))}

      {/* Wall-mounted hydroponic racks */}
      <HydroponicRack position={[-10.4, 0.4, -52]} rotation={[0, Math.PI / 2, 0]} />
      <HydroponicRack position={[10.4,  0.4, -52]} rotation={[0, -Math.PI / 2, 0]} />
      <HydroponicRack position={[-10.4, 0.4, -62]} rotation={[0, Math.PI / 2, 0]} />

      {/* Asparagus rows */}
      {Array.from({ length: 8 }, (_, i) => (
        <AsparagusRow key={i} position={[-5 + (i % 4) * 2.4, 0, -56 - Math.floor(i / 4) * 3]} />
      ))}

      {/* Irrigation header pipe */}
      <mesh position={[0, 2.2, -55]}>
        <cylinderGeometry args={[0.03, 0.03, 18, 8]} />
        <meshStandardMaterial color="#3a3a38" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  )
}
