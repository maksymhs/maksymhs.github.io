import React from 'react'
import Pix from './Pix'

// Helper: a single voxel box
export default function Vox({ position, args = [1, 1, 1], color, castShadow = false, receiveShadow = false }) {
  return (
    <mesh position={position} castShadow={castShadow} receiveShadow={receiveShadow}>
      <boxGeometry args={args} />
      <Pix color={color} />
    </mesh>
  )
}
