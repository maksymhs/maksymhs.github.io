import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import Vox from '../common/Vox'

export default function Chair({ view }) {
  const chairRef = useRef()
  const turnProgress = useRef(0)

  useFrame(() => {
    if (!chairRef.current) return
    if (view === 'controller') {
      turnProgress.current = Math.min(turnProgress.current + 0.035, 1)
    } else {
      turnProgress.current = Math.max(turnProgress.current - 0.06, 0)
    }
    const ease = 1 - Math.pow(1 - turnProgress.current, 3)
    chairRef.current.rotation.y = ease * Math.PI
    chairRef.current.visible = turnProgress.current < 0.95
  })

  return (
    <group ref={chairRef} position={[0, 0, -0.6]}>
      {/* Seat */}
      <Vox position={[0, 0.5, 0]} args={[0.6, 0.1, 0.6]} color="#e05050" castShadow />
      {/* Back */}
      <Vox position={[0, 0.9, -0.28]} args={[0.6, 0.7, 0.08]} color="#e05050" castShadow />
      {/* Back cushion detail */}
      <Vox position={[0, 0.9, -0.23]} args={[0.5, 0.6, 0.02]} color="#d04040" />
      {/* Armrests */}
      {[-0.28, 0.28].map((x, i) => (
        <group key={`arm${i}`}>
          {/* Vertical support */}
          <Vox position={[x, 0.65, 0]} args={[0.06, 0.2, 0.06]} color="#806040" />
          {/* Horizontal pad */}
          <Vox position={[x, 0.76, 0.02]} args={[0.08, 0.04, 0.4]} color="#d04040" />
        </group>
      ))}
      {/* Legs */}
      {[[-0.22, 0.22, -0.22], [0.22, 0.22, -0.22], [-0.22, 0.22, 0.22], [0.22, 0.22, 0.22]].map((pos, i) => (
        <Vox key={i} position={pos} args={[0.08, 0.45, 0.08]} color="#806040" />
      ))}
    </group>
  )
}
