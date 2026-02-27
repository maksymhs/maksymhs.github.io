import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import Vox from '../common/Vox'

const LOG_LINES = [
  { width: 0.50, color: '#60d0a0', x: -0.20 },
  { width: 0.85, color: '#80b0ff', x: -0.03 },
  { width: 0.65, color: '#f0d060', x: -0.13 },
  { width: 0.90, color: '#60d0a0', x: 0.00 },
  { width: 0.55, color: '#ff8080', x: -0.18 },
  { width: 0.78, color: '#80b0ff', x: -0.06 },
  { width: 0.60, color: '#c090f0', x: -0.15 },
  { width: 0.88, color: '#60d0a0', x: -0.01 },
  { width: 0.70, color: '#f0d060', x: -0.10 },
  { width: 0.48, color: '#ff8080', x: -0.21 },
  { width: 0.82, color: '#80b0ff', x: -0.04 },
  { width: 0.58, color: '#c090f0', x: -0.16 },
  { width: 0.92, color: '#60d0a0', x: 0.01 },
  { width: 0.45, color: '#f0d060', x: -0.22 },
  { width: 0.75, color: '#ff8080', x: -0.08 },
  { width: 0.68, color: '#80b0ff', x: -0.11 },
]

const GAMES = [
  { name: 'Cat Runner', color: '#f0a860', url: '/game_catrunner' },
  { name: 'Pixel Strike', color: '#ff4040', url: '/game_pixelstrike' },
  { name: '3D Jumper', color: '#40c040', url: '/game_platformer' },
]

export function Desk() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const drawerRef = useRef()
  const slideRef = useRef(0)

  useFrame(() => {
    if (!drawerRef.current) return
    const target = drawerOpen ? 0.4 : 0
    slideRef.current += (target - slideRef.current) * 0.1
    drawerRef.current.position.z = slideRef.current
  })

  return (
    <group position={[0, 0, -1.8]}>
      {/* Table top */}
      <Vox position={[0, 0.75, 0]} args={[2.4, 0.12, 1]} color="#c07830" castShadow receiveShadow />
      {/* Legs */}
      {[[-1.05, 0.37, -0.38], [1.05, 0.37, -0.38], [-1.05, 0.37, 0.38], [1.05, 0.37, 0.38]].map((pos, i) => (
        <Vox key={i} position={pos} args={[0.12, 0.75, 0.12]} color="#a06020" />
      ))}
      {/* Drawer - slides out */}
      <group
        ref={drawerRef}
        onClick={(e) => { e.stopPropagation(); setDrawerOpen(!drawerOpen) }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        {/* Front panel */}
        <Vox position={[0.6, 0.55, 0.39]} args={[0.6, 0.25, 0.04]} color="#b06828" />
        {/* Back panel */}
        <Vox position={[0.6, 0.55, -0.39]} args={[0.6, 0.25, 0.04]} color="#a05820" />
        {/* Left side */}
        <Vox position={[0.31, 0.55, 0]} args={[0.04, 0.25, 0.74]} color="#a05820" />
        {/* Right side */}
        <Vox position={[0.89, 0.55, 0]} args={[0.04, 0.25, 0.74]} color="#a05820" />
        {/* Bottom */}
        <Vox position={[0.6, 0.44, 0]} args={[0.54, 0.03, 0.74]} color="#c08038" />
        {/* Handle */}
        <Vox position={[0.6, 0.55, 0.42]} args={[0.12, 0.06, 0.04]} color="#f0c040" />
      </group>
    </group>
  )
}

export function Monitor({ onClick, view }) {
  const screenRef = useRef()
  const linesRef = useRef()
  const scrollRef = useRef(0)
  const LINE_H = 0.04
  const VISIBLE = 8
  const SCREEN_TOP = 0.57
  const SCREEN_BOT = 0.23
  const showMenu = view === 'controller'

  useFrame((state, delta) => {
    if (screenRef.current) {
      const t = state.clock.elapsedTime
      screenRef.current.material.emissive.set('#2040a0')
      screenRef.current.material.emissiveIntensity = 0.3 + Math.sin(t * 2) * 0.08
    }
    if (showMenu) return
    scrollRef.current += delta * 0.3
    if (linesRef.current) {
      const step = Math.floor(scrollRef.current / LINE_H)
      const children = linesRef.current.children
      for (let i = 0; i < children.length; i++) {
        const lineIdx = (i + step) % LOG_LINES.length
        const line = LOG_LINES[lineIdx]
        const yBase = SCREEN_TOP - i * LINE_H
        const frac = (scrollRef.current % LINE_H) / LINE_H
        const y = yBase + frac * LINE_H
        children[i].position.y = y
        children[i].position.x = line.x
        children[i].scale.x = line.width / 0.9
        children[i].material.color.set(line.color)
        children[i].visible = y >= SCREEN_BOT && y <= SCREEN_TOP + 0.01
      }
    }
  })

  return (
    <group
      position={[0, 0.82, -1.95]}
      onClick={(e) => { e.stopPropagation(); onClick?.() }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'auto')}
    >
      {/* Screen frame - chunky CRT style */}
      <Vox position={[0, 0.38, 0]} args={[1.2, 0.8, 0.3]} color="#303040" castShadow />
      {/* Screen background */}
      <mesh ref={screenRef} position={[0, 0.4, 0.16]}>
        <boxGeometry args={[0.95, 0.6, 0.02]} />
        <meshLambertMaterial color="#1a1a30" emissive="#2040a0" emissiveIntensity={0.3} flatShading />
      </mesh>
      {/* Scrolling log lines (hidden when menu active) */}
      <group ref={linesRef} visible={!showMenu}>
        {Array.from({ length: VISIBLE + 2 }).map((_, i) => (
          <mesh key={i} position={[0, SCREEN_TOP - i * LINE_H, 0.175]}>
            <boxGeometry args={[0.9, 0.02, 0.005]} />
            <meshBasicMaterial color="#60d0a0" transparent opacity={0.6} depthWrite={false} />
          </mesh>
        ))}
      </group>
      {/* Game selection menu on screen */}
      {showMenu && (
        <group position={[0, 0.4, 0.18]}>
          {/* Title */}
          <Text
            position={[0, 0.22, 0]}
            fontSize={0.045}
            color="#60d0a0"
            anchorX="center"
            anchorY="middle"
            font="/fonts/PressStart2P-Regular.ttf"
          >
            SELECT GAME
          </Text>
          {/* Decorative line under title */}
          <mesh position={[0, 0.17, 0]}>
            <planeGeometry args={[0.7, 0.004]} />
            <meshBasicMaterial color="#60d0a0" opacity={0.5} transparent />
          </mesh>
          {/* Game options */}
          {GAMES.map((game, i) => (
            <group
              key={i}
              position={[0, 0.08 - i * 0.12, 0]}
              onClick={(e) => { e.stopPropagation(); window.location.href = game.url }}
              onPointerOver={() => (document.body.style.cursor = 'pointer')}
              onPointerOut={() => (document.body.style.cursor = 'auto')}
            >
              {/* Option background */}
              <mesh position={[0, 0, -0.001]}>
                <planeGeometry args={[0.7, 0.09]} />
                <meshBasicMaterial color={game.color} opacity={0.15} transparent />
              </mesh>
              {/* Option border */}
              <mesh position={[0, 0, -0.0005]}>
                <planeGeometry args={[0.72, 0.092]} />
                <meshBasicMaterial color={game.color} opacity={0.3} transparent />
              </mesh>
              {/* Color indicator */}
              <mesh position={[-0.3, 0, 0]}>
                <planeGeometry args={[0.03, 0.06]} />
                <meshBasicMaterial color={game.color} />
              </mesh>
              {/* Game name */}
              <Text
                position={[0, 0, 0]}
                fontSize={0.03}
                color={game.color}
                anchorX="center"
                anchorY="middle"
                font="/fonts/PressStart2P-Regular.ttf"
              >
                {game.name}
              </Text>
            </group>
          ))}
          {/* Scanline effect */}
          {Array.from({ length: 12 }).map((_, i) => (
            <mesh key={`sl${i}`} position={[0, 0.27 - i * 0.045, 0.001]}>
              <planeGeometry args={[0.9, 0.002]} />
              <meshBasicMaterial color="#000000" opacity={0.15} transparent />
            </mesh>
          ))}
        </group>
      )}
      {/* Stand */}
      <Vox position={[0, 0.08, 0.05]} args={[0.2, 0.16, 0.2]} color="#404050" />
      {/* Base */}
      <Vox position={[0, 0, 0.05]} args={[0.5, 0.04, 0.3]} color="#404050" />
      {/* Power LED */}
      <Vox position={[0.45, 0.08, 0.16]} args={[0.06, 0.06, 0.02]} color="#40ff40" />
    </group>
  )
}

export function DeskItems() {
  return (
    <group>
      {/* Pencil holder */}
      <group position={[-1.0, 0.86, -1.45]}>
        <Vox position={[0, 0, 0]} args={[0.1, 0.12, 0.1]} color="#4060c0" />
        <Vox position={[-0.02, 0.1, 0]} args={[0.02, 0.1, 0.02]} color="#f0d040" />
        <Vox position={[0.02, 0.12, 0.02]} args={[0.02, 0.12, 0.02]} color="#e05050" />
        <Vox position={[0, 0.09, -0.02]} args={[0.02, 0.08, 0.02]} color="#50b050" />
      </group>
      {/* Sticky notes */}
      <Vox position={[-0.85, 0.83, -1.6]} args={[0.16, 0.01, 0.16]} color="#f0e060" />
      <Vox position={[-0.82, 0.84, -1.57]} args={[0.14, 0.01, 0.14]} color="#ff9070" />
    </group>
  )
}

export function Keyboard() {
  return (
    <group position={[0, 0.82, -1.55]}>
      {/* Keyboard base */}
      <Vox position={[0, 0, 0]} args={[0.7, 0.04, 0.25]} color="#d8d0c0" />
      {/* Key rows */}
      {[-0.08, -0.02, 0.04].map((z, row) => (
        <group key={row}>
          {Array.from({ length: 8 }).map((_, col) => (
            <Vox key={col} position={[-0.28 + col * 0.08, 0.03, z]} args={[0.06, 0.03, 0.05]} color="#e8e0d0" />
          ))}
        </group>
      ))}
      {/* Space bar */}
      <Vox position={[0, 0.03, 0.1]} args={[0.3, 0.03, 0.05]} color="#e8e0d0" />
    </group>
  )
}

export function Mouse() {
  return (
    <group position={[0.55, 0.82, -1.5]}>
      <Vox position={[0, 0, 0]} args={[0.1, 0.04, 0.14]} color="#d8d0c0" />
      <Vox position={[0, 0.03, -0.03]} args={[0.04, 0.02, 0.04]} color="#c0b8a8" />
    </group>
  )
}

export function CoffeeMug() {
  return (
    <group position={[0.75, 0.86, -1.5]}>
      {/* Mug body */}
      <Vox position={[0, 0, 0]} args={[0.1, 0.12, 0.1]} color="#f0f0e0" />
      {/* Handle */}
      <Vox position={[0.07, 0, 0]} args={[0.04, 0.08, 0.04]} color="#f0f0e0" />
      {/* Coffee inside */}
      <Vox position={[0, 0.05, 0]} args={[0.08, 0.02, 0.08]} color="#604020" />
    </group>
  )
}
