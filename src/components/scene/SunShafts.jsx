import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─────────────────────────────────────────────────────────────────
// Komorebi — dappled sunlight patch on the floor
// The most defining quality of light inside a real greenhouse
// ─────────────────────────────────────────────────────────────────
function KomorebiPatch({ position, rx = 1.2, rz = 0.7, rotation = 0, opacity = 0.09, phaseOffset = 0 }) {
  const ref = useRef()

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime * 0.22 + phaseOffset
    // Very slow gentle flicker — like clouds briefly passing
    ref.current.material.opacity = opacity * (0.75 + Math.sin(t) * 0.25)
  })

  return (
    <mesh
      ref={ref}
      rotation={[-Math.PI / 2, 0, rotation]}
      position={position}
    >
      <ellipseGeometry args={[rx, rz, 16]} />
      <meshBasicMaterial
        color="#ffedaa"
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// ─────────────────────────────────────────────────────────────────
// Narrow sun shaft — slender column of light between panes
// Much more subtle than before; real shafts are barely visible
// ─────────────────────────────────────────────────────────────────
function SunShaft({ position, rotX = 0.12, rotZ = -0.20, opacity = 0.016 }) {
  const ref = useRef()

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime * 0.18 + position[2] * 0.04
    ref.current.material.opacity = opacity * (0.6 + Math.sin(t) * 0.4)
  })

  return (
    <mesh ref={ref} position={position} rotation={[rotX, 0, rotZ]}>
      <coneGeometry args={[1.2, 10, 5, 1, true]} />
      <meshBasicMaterial
        color="#fff8d8"
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// ─────────────────────────────────────────────────────────────────
// Wall-stripe light — where sun hits vertical wall glass
// ─────────────────────────────────────────────────────────────────
function WallStripe({ position, width = 0.5, height = 4.0, opacity = 0.06 }) {
  const ref = useRef()

  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.elapsedTime * 0.15 + position[2] * 0.05
    ref.current.material.opacity = opacity * (0.7 + Math.sin(t) * 0.3)
  })

  return (
    <mesh ref={ref} position={position}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        color="#fff5c0"
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

export default function SunShafts() {
  // Floor light pools distributed naturally along the greenhouse path
  // Sun comes from upper-right (east), casting elongated ellipses on the floor
  const floorPatches = [
    { pos: [4.5,  0.02, -5],   rx: 1.5, rz: 0.8, rot: 0.3,  op: 0.10, ph: 0.0  },
    { pos: [3.0,  0.02, -10],  rx: 2.0, rz: 1.0, rot: 0.2,  op: 0.09, ph: 1.2  },
    { pos: [5.5,  0.02, -14],  rx: 1.2, rz: 0.6, rot: 0.35, op: 0.11, ph: 2.4  },
    { pos: [2.5,  0.02, -18],  rx: 1.8, rz: 0.9, rot: 0.25, op: 0.08, ph: 0.8  },
    { pos: [4.0,  0.02, -23],  rx: 1.6, rz: 0.75,rot: 0.3,  op: 0.09, ph: 1.8  },
    { pos: [6.0,  0.02, -28],  rx: 1.0, rz: 0.55,rot: 0.4,  op: 0.10, ph: 3.0  },
    { pos: [3.5,  0.02, -33],  rx: 1.7, rz: 0.8, rot: 0.28, op: 0.08, ph: 0.5  },
    { pos: [5.0,  0.02, -38],  rx: 1.3, rz: 0.65,rot: 0.32, op: 0.09, ph: 2.1  },
    { pos: [4.0,  0.02, -44],  rx: 1.5, rz: 0.7, rot: 0.3,  op: 0.08, ph: 1.4  },
    { pos: [2.0,  0.02, -50],  rx: 1.4, rz: 0.75,rot: 0.25, op: 0.07, ph: 0.9  },
    { pos: [5.5,  0.02, -56],  rx: 1.2, rz: 0.6, rot: 0.35, op: 0.08, ph: 2.6  },
    { pos: [3.0,  0.02, -62],  rx: 1.6, rz: 0.8, rot: 0.28, op: 0.07, ph: 1.7  },
    { pos: [4.5,  0.02, -68],  rx: 1.8, rz: 0.9, rot: 0.22, op: 0.08, ph: 3.2  },
    { pos: [2.5,  0.02, -74],  rx: 1.5, rz: 0.7, rot: 0.30, op: 0.07, ph: 0.6  },
  ]

  // Narrow shafts through roof pane gaps — much fewer, very subtle
  const shafts = [
    { pos: [5.5,  10.5, -10], op: 0.014 },
    { pos: [4.0,  11.0, -22], op: 0.012 },
    { pos: [6.0,  10.5, -36], op: 0.011 },
    { pos: [4.5,  10.5, -52], op: 0.010 },
    { pos: [5.0,  10.5, -68], op: 0.009 },
  ]

  return (
    <group>
      {/* Komorebi — dappled sunlight on the floor */}
      {floorPatches.map((p, i) => (
        <KomorebiPatch
          key={i}
          position={p.pos}
          rx={p.rx}
          rz={p.rz}
          rotation={p.rot}
          opacity={p.op}
          phaseOffset={p.ph}
        />
      ))}

      {/* Subtle vertical shafts */}
      {shafts.map((s, i) => (
        <SunShaft
          key={`s${i}`}
          position={s.pos}
          opacity={s.op}
        />
      ))}

      {/* Wall light stripes — sun hitting the vertical glass panes */}
      <WallStripe position={[10.5,  2.5, -8]}  height={5} opacity={0.05} />
      <WallStripe position={[10.5,  2.5, -24]} height={4.5} opacity={0.045} />
      <WallStripe position={[10.5,  2.5, -42]} height={4} opacity={0.04} />
      <WallStripe position={[10.5,  2.5, -60]} height={4} opacity={0.04} />
    </group>
  )
}
