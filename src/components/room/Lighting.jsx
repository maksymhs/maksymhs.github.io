import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Vox from '../common/Vox'

export function Lamp() {
  const [on, setOn] = useState(true)
  return (
    <group
      position={[-0.9, 0.82, -1.9]}
      onClick={(e) => { e.stopPropagation(); setOn(!on) }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'auto')}
    >
      {/* Base */}
      <Vox position={[0, 0, 0]} args={[0.16, 0.06, 0.16]} color="#f0c040" />
      {/* Stem */}
      <Vox position={[0, 0.25, 0]} args={[0.06, 0.5, 0.06]} color="#f0c040" />
      {/* Shade - blocky trapezoid look */}
      <Vox position={[0, 0.52, 0]} args={[0.28, 0.06, 0.28]} color={on ? '#fff0c0' : '#908878'} />
      <Vox position={[0, 0.56, 0]} args={[0.24, 0.06, 0.24]} color={on ? '#fff0c0' : '#888070'} />
      <Vox position={[0, 0.6, 0]} args={[0.2, 0.06, 0.2]} color={on ? '#fff0c0' : '#807868'} />
      {/* Lamp light */}
      {on && <pointLight position={[0, 0.45, 0]} intensity={0.8} color="#ffe080" distance={3} />}
    </group>
  )
}

export function CeilingLamp() {
  return (
    <group position={[0, 3.95, -0.5]}>
      {/* Mount */}
      <Vox position={[0, 0, 0]} args={[0.2, 0.06, 0.2]} color="#303030" />
      {/* Rod */}
      <Vox position={[0, -0.2, 0]} args={[0.04, 0.35, 0.04]} color="#404040" />
      {/* Shade */}
      <Vox position={[0, -0.42, 0]} args={[0.6, 0.06, 0.6]} color="#f8e8c8" />
      <Vox position={[0, -0.48, 0]} args={[0.7, 0.06, 0.7]} color="#f0dbb8" />
      <Vox position={[0, -0.54, 0]} args={[0.75, 0.06, 0.75]} color="#e8d0a8" />
      {/* Warm light */}
      <pointLight position={[0, -0.6, 0]} intensity={1.0} color="#ffe8c0" distance={6} />
    </group>
  )
}

export function FloorLamp() {
  const [on, setOn] = useState(true)
  return (
    <group
      position={[-3.4, 0, 1.2]}
      onClick={(e) => { e.stopPropagation(); setOn(!on) }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'auto')}
    >
      {/* Base */}
      <Vox position={[0, 0.04, 0]} args={[0.3, 0.08, 0.3]} color="#404040" />
      {/* Pole */}
      <Vox position={[0, 0.8, 0]} args={[0.06, 1.5, 0.06]} color="#505050" />
      {/* Shade */}
      <Vox position={[0, 1.6, 0]} args={[0.4, 0.06, 0.4]} color={on ? '#f8e0b0' : '#908070'} />
      <Vox position={[0, 1.54, 0]} args={[0.35, 0.06, 0.35]} color={on ? '#f0d8a8' : '#887868'} />
      <Vox position={[0, 1.48, 0]} args={[0.3, 0.06, 0.3]} color={on ? '#e8d0a0' : '#807060'} />
      {/* Warm glow */}
      {on && <pointLight position={[0, 1.4, 0]} intensity={0.6} color="#ffe0a0" distance={4} />}
    </group>
  )
}

const XMAS_COLORS = [
  new THREE.Color('#ff3030'), new THREE.Color('#30ff30'), new THREE.Color('#3060ff'),
  new THREE.Color('#ffdd00'), new THREE.Color('#ff30ff'), new THREE.Color('#30ffdd')
]

function ChristmasBulb({ position, index }) {
  const meshRef = useRef()
  const lightRef = useRef()
  const hasLight = index % 3 === 0

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const colorIdx = Math.floor((t * 0.4 + index * 0.7) % XMAS_COLORS.length)
    const color = XMAS_COLORS[colorIdx]
    const blink = 0.7 + Math.sin(t * 1.5 + index * 1.1) * 0.3
    if (meshRef.current) {
      meshRef.current.material.color.copy(color)
      meshRef.current.material.opacity = blink
    }
    if (hasLight && lightRef.current) {
      lightRef.current.color.copy(color)
      lightRef.current.intensity = 0.15 * blink
    }
  })

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <boxGeometry args={[0.06, 0.06, 0.06]} />
        <meshBasicMaterial color="#ff3030" transparent opacity={1} />
      </mesh>
      {hasLight && <pointLight ref={lightRef} intensity={0.15} color="#ff3030" distance={1.2} />}
    </group>
  )
}

export function FairyLights() {
  return (
    <group>
      {/* String along back wall top */}
      {Array.from({ length: 12 }).map((_, i) => {
        const x = -3.2 + i * 0.55
        const sag = Math.sin((i / 11) * Math.PI) * 0.15
        return <ChristmasBulb key={`b${i}`} position={[x, 3.5 - sag, -3.9]} index={i} />
      })}
      {/* String along right wall top */}
      {Array.from({ length: 12 }).map((_, i) => {
        const z = -3.2 + i * 0.55
        const sag = Math.sin((i / 11) * Math.PI) * 0.15
        return <ChristmasBulb key={`r${i}`} position={[3.9, 3.5 - sag, z]} index={i + 12} />
      })}
    </group>
  )
}
