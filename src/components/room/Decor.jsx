import React, { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import Vox from '../common/Vox'

export function Plant({ position }) {
  return (
    <group position={position}>
      {/* Pot - blocky */}
      <Vox position={[0, 0.12, 0]} args={[0.24, 0.24, 0.24]} color="#d07040" />
      <Vox position={[0, 0.26, 0]} args={[0.28, 0.04, 0.28]} color="#c06030" />
      {/* Soil */}
      <Vox position={[0, 0.25, 0]} args={[0.22, 0.02, 0.22]} color="#504030" />
      {/* Stem */}
      <Vox position={[0, 0.42, 0]} args={[0.06, 0.3, 0.06]} color="#308030" />
      {/* Pixel leaves - stacked blocks */}
      <Vox position={[0, 0.62, 0]} args={[0.3, 0.12, 0.3]} color="#50c050" />
      <Vox position={[0, 0.72, 0]} args={[0.22, 0.1, 0.22]} color="#60d060" />
      <Vox position={[0, 0.8, 0]} args={[0.12, 0.08, 0.12]} color="#70e070" />
      {/* Side leaves */}
      <Vox position={[-0.16, 0.55, 0]} args={[0.1, 0.08, 0.14]} color="#48b848" />
      <Vox position={[0.16, 0.58, 0]} args={[0.1, 0.08, 0.14]} color="#48b848" />
    </group>
  )
}

export function Rug() {
  const pixels = useMemo(() => {
    const p = []
    const w = 6
    const h = 4
    for (let x = 0; x < w; x++) {
      for (let z = 0; z < h; z++) {
        const isBorder = x === 0 || x === w - 1 || z === 0 || z === h - 1
        const isInnerBorder = !isBorder && (x === 1 || x === w - 2 || z === 1 || z === h - 2)
        const color = isBorder ? '#c8785c' : isInnerBorder ? '#d89878' : ((x + z) % 2 === 0 ? '#e8c8a0' : '#e0b888')
        p.push({ x: (x - w / 2 + 0.5) * 0.5, z: (z - h / 2 + 0.5) * 0.5, color })
      }
    }
    return p
  }, [])

  return (
    <group position={[0, 0.01, -0.8]}>
      {pixels.map((px, i) => (
        <Vox key={i} position={[px.x, 0, px.z]} args={[0.49, 0.02, 0.49]} color={px.color} castShadow={false} receiveShadow />
      ))}
    </group>
  )
}

export function LivingRug() {
  const pixels = useMemo(() => {
    const p = []
    const w = 5
    const h = 3
    for (let x = 0; x < w; x++) {
      for (let z = 0; z < h; z++) {
        const isBorder = x === 0 || x === w - 1 || z === 0 || z === h - 1
        const color = isBorder ? '#a07868' : ((x + z) % 2 === 0 ? '#d8c8b0' : '#c8b8a0')
        p.push({ x: (x - w / 2 + 0.5) * 0.5, z: (z - h / 2 + 0.5) * 0.5, color })
      }
    }
    return p
  }, [])

  return (
    <group position={[-2.2, 0.01, 2.5]}>
      {pixels.map((px, i) => (
        <Vox key={i} position={[px.x, 0, px.z]} args={[0.49, 0.02, 0.49]} color={px.color} castShadow={false} receiveShadow />
      ))}
    </group>
  )
}

export function WallClock({ onClick }) {
  const minuteRef = useRef()
  const hourRef = useRef()
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (minuteRef.current) minuteRef.current.rotation.x = -t * 0.5
    if (hourRef.current) hourRef.current.rotation.x = -t * 0.04
  })

  return (
    <group
      position={[3.9, 2.8, -2.8]}
      onClick={onClick}
      onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
    >
      {/* Clock body - round face */}
      <Vox position={[0, 0, 0]} args={[0.08, 0.6, 0.6]} color={hovered ? '#fff8e8' : '#f8f0e0'} />
      {/* Frame border */}
      <Vox position={[-0.01, 0.28, 0]} args={[0.1, 0.06, 0.58]} color="#c08040" />
      <Vox position={[-0.01, -0.28, 0]} args={[0.1, 0.06, 0.58]} color="#c08040" />
      <Vox position={[-0.01, 0, 0.28]} args={[0.1, 0.58, 0.06]} color="#c08040" />
      <Vox position={[-0.01, 0, -0.28]} args={[0.1, 0.58, 0.06]} color="#c08040" />
      {/* Hour marks */}
      <Vox position={[-0.05, 0.22, 0]} args={[0.02, 0.05, 0.03]} color="#404040" />
      <Vox position={[-0.05, -0.22, 0]} args={[0.02, 0.05, 0.03]} color="#404040" />
      <Vox position={[-0.05, 0, 0.22]} args={[0.02, 0.03, 0.05]} color="#404040" />
      <Vox position={[-0.05, 0, -0.22]} args={[0.02, 0.03, 0.05]} color="#404040" />
      {/* Center hub */}
      <Vox position={[-0.06, 0, 0]} args={[0.03, 0.06, 0.06]} color="#303030" />
      {/* Minute hand pivot */}
      <group ref={minuteRef} position={[-0.07, 0, 0]}>
        <Vox position={[0, 0.1, 0]} args={[0.015, 0.2, 0.02]} color="#202020" />
      </group>
      {/* Hour hand pivot */}
      <group ref={hourRef} position={[-0.08, 0, 0]}>
        <Vox position={[0, 0.065, 0]} args={[0.02, 0.14, 0.025]} color="#404040" />
      </group>
    </group>
  )
}

export function Poster() {
  return (
    <group position={[3.98, 2.2, 1.5]}>
      {/* Frame */}
      <Vox position={[0, 0, 0]} args={[0.04, 0.9, 0.7]} color="#f0e8d0" />
      {/* Pixel mountain scene */}
      <Vox position={[0.02, -0.2, 0]} args={[0.02, 0.3, 0.6]} color="#60b840" />
      <Vox position={[0.02, 0.1, -0.1]} args={[0.02, 0.4, 0.2]} color="#7090c0" />
      <Vox position={[0.02, 0.05, 0.15]} args={[0.02, 0.3, 0.25]} color="#6888b8" />
      <Vox position={[0.02, 0.32, 0]} args={[0.02, 0.14, 0.6]} color="#80c8f0" />
      {/* Sun in poster */}
      <Vox position={[0.02, 0.3, 0.2]} args={[0.02, 0.1, 0.1]} color="#f0d040" />
    </group>
  )
}

export function WallShelf() {
  return (
    <group position={[3.95, 1.8, 0.5]}>
      {/* Shelf board */}
      <Vox position={[0, 0, 0]} args={[0.06, 0.06, 1.0]} color="#a07040" />
      {/* Brackets */}
      <Vox position={[-0.04, -0.08, -0.35]} args={[0.04, 0.12, 0.04]} color="#886030" />
      <Vox position={[-0.04, -0.08, 0.35]} args={[0.04, 0.12, 0.04]} color="#886030" />
      {/* Items on shelf */}
      {/* Small cactus */}
      <Vox position={[-0.04, 0.08, -0.3]} args={[0.08, 0.08, 0.08]} color="#d07040" />
      <Vox position={[-0.04, 0.16, -0.3]} args={[0.06, 0.1, 0.06]} color="#40a040" />
      <Vox position={[-0.08, 0.2, -0.3]} args={[0.04, 0.06, 0.04]} color="#40a040" />
      {/* Photo frame */}
      <Vox position={[-0.02, 0.1, 0]} args={[0.04, 0.14, 0.12]} color="#f0e8d0" />
      <Vox position={[-0.01, 0.1, 0]} args={[0.02, 0.1, 0.08]} color="#80a0c0" />
      {/* Candle */}
      <Vox position={[-0.04, 0.08, 0.3]} args={[0.06, 0.1, 0.06]} color="#f0e8d0" />
      <Vox position={[-0.04, 0.15, 0.3]} args={[0.02, 0.04, 0.02]} color="#f0c040" />
      <pointLight position={[-0.04, 0.2, 0.3]} intensity={0.2} color="#ffe060" distance={1.5} />
    </group>
  )
}

export function Curtain({ position, rotation }) {
  return (
    <group position={position} rotation={rotation || [0, 0, 0]}>
      {/* Left curtain */}
      <Vox position={[-1.6, 0, 0.06]} args={[0.5, 2.8, 0.04]} color="#d8c0a0" />
      <Vox position={[-1.6, -0.1, 0.08]} args={[0.45, 2.6, 0.02]} color="#cbb498" />
      {/* Right curtain */}
      <Vox position={[1.6, 0, 0.06]} args={[0.5, 2.8, 0.04]} color="#d8c0a0" />
      <Vox position={[1.6, -0.1, 0.08]} args={[0.45, 2.6, 0.02]} color="#cbb498" />
      {/* Rod */}
      <Vox position={[0, 1.45, 0.08]} args={[3.8, 0.06, 0.06]} color="#a08060" />
      {/* Rod ends */}
      <Vox position={[-1.92, 1.45, 0.08]} args={[0.08, 0.08, 0.08]} color="#c0a070" />
      <Vox position={[1.92, 1.45, 0.08]} args={[0.08, 0.08, 0.08]} color="#c0a070" />
    </group>
  )
}
