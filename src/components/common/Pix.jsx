import React from 'react'

// Helper: pixel-art style flat material
export default function Pix({ color }) {
  return <meshLambertMaterial color={color} flatShading />
}
