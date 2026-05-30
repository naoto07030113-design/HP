import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Camera path through the restaurant — exterior → entrance → dining → corridor → private room
const CAMERA_KEYFRAMES = [
  new THREE.Vector3(0,    1.72, 13.5),  // outside, far approach
  new THREE.Vector3(0.3,  1.72, 9.0),   // terrace, slight lean
  new THREE.Vector3(0,    1.72, 5.0),   // terrace close
  new THREE.Vector3(0,    1.70, 1.8),   // threshold of doorway
  new THREE.Vector3(0,    1.68, -1.0),  // just inside
  new THREE.Vector3(0,    1.66, -5.5),  // main dining entry
  new THREE.Vector3(-0.4, 1.64, -10.5), // main dining center
  new THREE.Vector3(-0.8, 1.62, -15.0), // corridor transition
  new THREE.Vector3(-1.0, 1.60, -19.5), // deep corridor
  new THREE.Vector3(-0.5, 1.60, -24.0), // private room entry
  new THREE.Vector3(0,    1.60, -27.5), // final hero
]

const LOOK_AHEAD = 0.06

export default function CameraController({ scrollRef }) {
  const { camera } = useThree()
  const smoothPos = useRef(new THREE.Vector3())
  const smoothQuat = useRef(new THREE.Quaternion())
  const tempCam = useMemo(() => new THREE.PerspectiveCamera(), [])

  const path = useMemo(() => new THREE.CatmullRomCurve3(CAMERA_KEYFRAMES, false, 'catmullrom', 0.5), [])

  useFrame(() => {
    const t = scrollRef.current ?? 0
    const tClamped = Math.max(0, Math.min(1, t))

    const pos = path.getPointAt(tClamped)

    // Look slightly ahead on path
    const lookT = Math.min(tClamped + LOOK_AHEAD, 1)
    const lookAt = path.getPointAt(lookT)
    // Add gentle organic sway
    const elapsed = performance.now() * 0.001
    lookAt.x += Math.sin(elapsed * 0.12) * 0.04
    lookAt.y += Math.sin(elapsed * 0.18) * 0.015

    tempCam.position.copy(pos)
    tempCam.lookAt(lookAt)

    // Smooth interpolation — feels heavy and luxurious
    smoothPos.current.lerp(pos, 0.06)
    smoothQuat.current.slerp(tempCam.quaternion, 0.06)

    camera.position.copy(smoothPos.current)
    camera.quaternion.copy(smoothQuat.current)
  })

  return null
}
