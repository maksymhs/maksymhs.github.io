import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import Vox from '../common/Vox'

export default function Chest({ onClick, open }) {
  const lidRef = useRef()
  const targetAngle = open ? -Math.PI / 2 : 0

  useFrame(() => {
    if (!lidRef.current) return
    lidRef.current.rotation.x += (targetAngle - lidRef.current.rotation.x) * 0.08
  })

  return (
    <group
      position={[-3.2, 0, -3.2]}
      rotation={[0, Math.PI / 4, 0]}
      onClick={(e) => { e.stopPropagation(); onClick?.() }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'auto')}
    >
      {/* Bottom */}
      <Vox position={[0, 0.03, 0]} args={[0.85, 0.06, 0.55]} color="#8b6914" />
      {/* Front wall */}
      <Vox position={[0, 0.28, 0.245]} args={[0.85, 0.44, 0.06]} color="#8b6914" />
      {/* Back wall */}
      <Vox position={[0, 0.28, -0.245]} args={[0.85, 0.44, 0.06]} color="#8b6914" />
      {/* Left wall */}
      <Vox position={[-0.395, 0.28, 0]} args={[0.06, 0.44, 0.55]} color="#8b6914" />
      {/* Right wall */}
      <Vox position={[0.395, 0.28, 0]} args={[0.06, 0.44, 0.55]} color="#8b6914" />
      {/* Dark interior floor */}
      <Vox position={[0, 0.07, 0]} args={[0.73, 0.02, 0.43]} color="#3a2808" />
      {/* Dark interior back wall */}
      <Vox position={[0, 0.28, -0.21]} args={[0.73, 0.40, 0.01]} color="#4a3410" />
      {/* Dark interior left wall */}
      <Vox position={[-0.36, 0.28, 0]} args={[0.01, 0.40, 0.43]} color="#4a3410" />
      {/* Dark interior right wall */}
      <Vox position={[0.36, 0.28, 0]} args={[0.01, 0.40, 0.43]} color="#4a3410" />
      {/* Dark interior front wall */}
      <Vox position={[0, 0.28, 0.21]} args={[0.73, 0.40, 0.01]} color="#4a3410" />
      {/* Front face detail */}
      <Vox position={[0, 0.25, 0.28]} args={[0.72, 0.38, 0.01]} color="#a07818" />
      {/* Metal bands */}
      <Vox position={[0, 0.12, 0.285]} args={[0.87, 0.04, 0.01]} color="#b8960c" />
      <Vox position={[0, 0.38, 0.285]} args={[0.87, 0.04, 0.01]} color="#b8960c" />
      {/* Side bands */}
      <Vox position={[-0.43, 0.25, 0]} args={[0.01, 0.52, 0.57]} color="#b8960c" />
      <Vox position={[0.43, 0.25, 0]} args={[0.01, 0.52, 0.57]} color="#b8960c" />
      {/* Lock */}
      <Vox position={[0, 0.32, 0.29]} args={[0.1, 0.1, 0.02]} color="#d4a800" />
      {/* Bottom trim */}
      <Vox position={[0, 0.01, 0]} args={[0.9, 0.02, 0.58]} color="#705010" />
      {/* Feet */}
      {[[-0.34, 0.02, -0.2], [0.34, 0.02, -0.2], [-0.34, 0.02, 0.2], [0.34, 0.02, 0.2]].map((pos, i) => (
        <Vox key={i} position={pos} args={[0.07, 0.04, 0.07]} color="#604008" />
      ))}
      {/* Lid - pivots from back edge */}
      <group position={[0, 0.5, -0.275]} ref={lidRef}>
        <Vox position={[0, 0.06, 0.275]} args={[0.85, 0.12, 0.55]} color="#9a7416" />
        {/* Lid top detail */}
        <Vox position={[0, 0.12, 0.275]} args={[0.72, 0.02, 0.42]} color="#a88020" />
        {/* Metal band on lid */}
        <Vox position={[0, 0.07, 0.555]} args={[0.87, 0.04, 0.01]} color="#b8960c" />
        {/* Hinges */}
        {[-0.3, 0.3].map((x, i) => (
          <Vox key={i} position={[x, 0.02, 0.005]} args={[0.07, 0.05, 0.05]} color="#d4a800" />
        ))}
      </group>
    </group>
  )
}
