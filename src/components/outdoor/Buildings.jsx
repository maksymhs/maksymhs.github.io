import React from 'react'
import Vox from '../common/Vox'

export function Roof() {
  // Room is 8x8 (±4), ceiling at y=4.02. Roof sits on top flush.
  const roofBase = 4.02
  const ridgeH = 2.6
  const overhang = 0.6
  const halfW = 4 + overhang
  const halfD = 4 + overhang
  const depth = halfD * 2 + 0.2
  const steps = 14

  return (
    <group position={[0, roofBase, 0]}>
      {/* Solid interior fill */}
      {Array.from({ length: 10 }).map((_, i) => {
        const frac = i / 9
        const y = frac * ridgeH
        const w = halfW * 2 * (1 - frac)
        if (w < 0.3) return null
        return <Vox key={`fill${i}`} position={[0, y, 0]} args={[w, ridgeH / 9, depth - 0.4]}
          color={i % 2 === 0 ? '#d8c8b0' : '#d0c0a8'} castShadow={false} />
      })}

      {/* Ridge beam */}
      <Vox position={[0, ridgeH + 0.1, 0]} args={[0.25, 0.25, depth]} color="#7a5020" />

      {/* Left slope planks */}
      {Array.from({ length: steps }).map((_, i) => {
        const frac = i / (steps - 1)
        const x = -(frac * halfW)
        const y = ridgeH - frac * ridgeH
        const pw = halfW / steps + 0.12
        return <Vox key={`rl${i}`} position={[x, y + 0.08, 0]} args={[pw, 0.2, depth]}
          color={i % 3 === 0 ? '#a07040' : i % 3 === 1 ? '#8c6030' : '#956838'} />
      })}
      {/* Right slope planks */}
      {Array.from({ length: steps }).map((_, i) => {
        const frac = i / (steps - 1)
        const x = frac * halfW
        const y = ridgeH - frac * ridgeH
        const pw = halfW / steps + 0.12
        return <Vox key={`rr${i}`} position={[x, y + 0.08, 0]} args={[pw, 0.2, depth]}
          color={i % 3 === 0 ? '#a07040' : i % 3 === 1 ? '#8c6030' : '#956838'} />
      })}

      {/* Front gable */}
      {Array.from({ length: 10 }).map((_, i) => {
        const frac = i / 9
        const w = halfW * 2 * (1 - frac) + 0.1
        const y = frac * ridgeH
        return <Vox key={`gf${i}`} position={[0, y, halfD]} args={[Math.max(w, 0.3), ridgeH / 9 + 0.02, 0.15]}
          color={i % 2 === 0 ? '#c8b090' : '#d0b898'} />
      })}
      {/* Back gable */}
      {Array.from({ length: 10 }).map((_, i) => {
        const frac = i / 9
        const w = halfW * 2 * (1 - frac) + 0.1
        const y = frac * ridgeH
        return <Vox key={`gb${i}`} position={[0, y, -halfD]} args={[Math.max(w, 0.3), ridgeH / 9 + 0.02, 0.15]}
          color={i % 2 === 0 ? '#c8b090' : '#d0b898'} />
      })}

      {/* Eaves fascia boards */}
      <Vox position={[-halfW, -0.05, 0]} args={[0.2, 0.25, depth]} color="#705020" />
      <Vox position={[halfW, -0.05, 0]} args={[0.2, 0.25, depth]} color="#705020" />
      <Vox position={[0, -0.05, halfD]} args={[halfW * 2 + 0.4, 0.25, 0.2]} color="#705020" />
      <Vox position={[0, -0.05, -halfD]} args={[halfW * 2 + 0.4, 0.25, 0.2]} color="#705020" />

      {/* Support brackets under eaves */}
      {[-3, -1, 1, 3].map((z, i) => (
        <group key={`sb${i}`}>
          <Vox position={[-halfW + 0.12, -0.2, z]} args={[0.1, 0.3, 0.1]} color="#806028" />
          <Vox position={[halfW - 0.12, -0.2, z]} args={[0.1, 0.3, 0.1]} color="#806028" />
        </group>
      ))}
    </group>
  )
}

export function ExteriorDoor({ view }) {
  return (
    <group position={[0, 0, 4.08]}>
      {/* Step */}
      <Vox position={[0, 0.04, 0.15]} args={[1.8, 0.08, 0.3]} color="#c0b090" />
    </group>
  )
}

export function ExteriorWalls() {
  return (
    <group>
      {/* === Back wall exterior === */}
      <Vox position={[-2.9, 2, -4.12]} args={[2.2, 4, 0.06]} color="#e8dcc8" castShadow={false} />
      <Vox position={[2.9, 2, -4.12]} args={[2.2, 4, 0.06]} color="#e8dcc8" castShadow={false} />
      <Vox position={[0, 3.65, -4.12]} args={[3.6, 0.7, 0.06]} color="#e8dcc8" castShadow={false} />
      <Vox position={[0, 0.35, -4.12]} args={[3.6, 0.7, 0.06]} color="#e8dcc8" castShadow={false} />

      {/* === Left wall exterior === */}
      <Vox position={[-4.12, 2, -2.9]} args={[0.06, 4, 2.2]} color="#e5d9c5" castShadow={false} />
      <Vox position={[-4.12, 2, 2.9]} args={[0.06, 4, 2.2]} color="#e5d9c5" castShadow={false} />
      <Vox position={[-4.12, 3.65, 0]} args={[0.06, 0.7, 3.6]} color="#e5d9c5" castShadow={false} />
      <Vox position={[-4.12, 0.35, 0]} args={[0.06, 0.7, 3.6]} color="#e5d9c5" castShadow={false} />

      {/* === Right wall exterior - solid === */}
      <Vox position={[4.12, 2, 0]} args={[0.06, 4, 8.2]} color="#e5d9c5" castShadow={false} />

      {/* === Front wall exterior === */}
      <Vox position={[-2.4, 2, 4.12]} args={[3.2, 4, 0.06]} color="#e8dcc8" castShadow={false} />
      <Vox position={[2.4, 2, 4.12]} args={[3.2, 4, 0.06]} color="#e8dcc8" castShadow={false} />
      <Vox position={[0, 3.4, 4.12]} args={[1.6, 1.2, 0.06]} color="#e8dcc8" castShadow={false} />
    </group>
  )
}
