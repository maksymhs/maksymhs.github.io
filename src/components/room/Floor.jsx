import React, { useMemo } from 'react'
import Vox from '../common/Vox'

// Wooden plank floor
export default function Floor() {
  const planks = useMemo(() => {
    const p = []
    const woodColors = ['#dfc09a', '#d4b88e', '#e5caa8', '#d8bc92', '#e0c49e', '#ccb086']
    for (let x = -4; x < 4; x++) {
      for (let z = -4; z < 4; z++) {
        const ci = (x * 3 + z * 7 + 100) % woodColors.length
        p.push({ x: x + 0.5, z: z + 0.5, color: woodColors[ci] })
      }
    }
    return p
  }, [])

  return (
    <group>
      {planks.map((pl, i) => (
        <Vox key={i} position={[pl.x, -0.05, pl.z]} args={[0.98, 0.1, 0.98]} color={pl.color} castShadow={false} receiveShadow />
      ))}
      {/* Plank lines running along Z */}
      {Array.from({ length: 9 }).map((_, i) => (
        <Vox key={`g${i}`} position={[-4 + i, -0.04, 0]} args={[0.02, 0.02, 8]} color="#b8a078" castShadow={false} />
      ))}
      {/* Cross plank joints staggered */}
      {Array.from({ length: 8 }).map((_, row) =>
        Array.from({ length: 8 }).map((_, col) => {
          const offset = col % 2 === 0 ? 0 : 0.5
          return (
            <Vox key={`j${row}_${col}`} position={[-3.5 + col, -0.04, -3.5 + row + offset]} args={[0.96, 0.02, 0.02]} color="#b8a078" castShadow={false} />
          )
        })
      )}
    </group>
  )
}
