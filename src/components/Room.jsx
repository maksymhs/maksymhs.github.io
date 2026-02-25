import React, { useRef, useMemo, useState } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { SnakeGame, PongGame, TetrisGame } from './MiniGames.jsx'
import { lang } from '../i18n'

// Helper: pixel-art style flat material
function Pix({ color }) {
  return <meshLambertMaterial color={color} flatShading />
}

// Helper: a single voxel box
function Vox({ position, args = [1, 1, 1], color, castShadow = false, receiveShadow = false }) {
  return (
    <mesh position={position} castShadow={castShadow} receiveShadow={receiveShadow}>
      <boxGeometry args={args} />
      <Pix color={color} />
    </mesh>
  )
}

// Wooden plank floor
function Floor() {
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

function WindowFrame({ position, rotation, width = 2.8, height = 2.4 }) {
  const hw = width / 2
  const hh = height / 2
  const t = 0.1
  return (
    <group position={position} rotation={rotation || [0, 0, 0]}>
      {/* Glass - transparent */}
      <mesh>
        <boxGeometry args={[width, height, 0.02]} />
        <meshLambertMaterial color="#c0e8ff" transparent opacity={0.15} flatShading />
      </mesh>
      {/* Frame borders */}
      <Vox position={[0, hh + t / 2, 0.02]} args={[width + t * 2, t, 0.06]} color="#f0f0e0" />
      <Vox position={[0, -(hh + t / 2), 0.02]} args={[width + t * 2, t, 0.06]} color="#f0f0e0" />
      <Vox position={[-(hw + t / 2), 0, 0.02]} args={[t, height + t * 2, 0.06]} color="#f0f0e0" />
      <Vox position={[hw + t / 2, 0, 0.02]} args={[t, height + t * 2, 0.06]} color="#f0f0e0" />
      {/* Cross bars */}
      <Vox position={[0, 0, 0.03]} args={[width, 0.06, 0.04]} color="#f0f0e0" />
      <Vox position={[0, 0, 0.03]} args={[0.06, height, 0.04]} color="#f0f0e0" />
      {/* Sill */}
      <Vox position={[0, -(hh + t), 0.1]} args={[width + 0.3, 0.08, 0.22]} color="#f0f0e0" />
    </group>
  )
}

function Walls() {
  return (
    <group>
      {/* === BACK WALL - split around window (3.6w x 2.6h at y=2, x=0) === */}
      {/* Left side: x -4 to -1.8 */}
      <Vox position={[-2.9, 2.6, -4.05]} args={[2.2, 2.8, 0.1]} color="#d4ddd0" castShadow={false} receiveShadow />
      {/* Right side: x +1.8 to +4 */}
      <Vox position={[2.9, 2.6, -4.05]} args={[2.2, 2.8, 0.1]} color="#d4ddd0" castShadow={false} receiveShadow />
      {/* Top strip above window: y 3.3 to 4 */}
      <Vox position={[0, 3.65, -4.05]} args={[3.6, 0.7, 0.1]} color="#d4ddd0" castShadow={false} receiveShadow />
      {/* Lower wainscoting left */}
      <Vox position={[-2.9, 0.6, -4.04]} args={[2.2, 1.2, 0.08]} color="#d8cbb8" castShadow={false} receiveShadow />
      {/* Lower wainscoting right */}
      <Vox position={[2.9, 0.6, -4.04]} args={[2.2, 1.2, 0.08]} color="#d8cbb8" castShadow={false} receiveShadow />
      {/* Bottom strip below window: y 0 to 0.7 */}
      <Vox position={[0, 0.35, -4.05]} args={[3.6, 0.7, 0.1]} color="#d8cbb8" castShadow={false} receiveShadow />
      {/* Wainscoting panels - back wall */}
      {[-3.5, -2.5, 2.5, 3.5].map((x, i) => (
        <Vox key={`bwp${i}`} position={[x, 0.65, -3.98]} args={[0.7, 0.8, 0.02]} color="#cfc0a8" />
      ))}

      {/* === LEFT WALL - split around window (3.6w x 2.6h at y=2, z=0) === */}
      {/* Back section: z -4 to -1.8 */}
      <Vox position={[-4.05, 2.6, -2.9]} args={[0.1, 2.8, 2.2]} color="#d0dbc8" castShadow={false} receiveShadow />
      {/* Front section: z +1.8 to +4 */}
      <Vox position={[-4.05, 2.6, 2.9]} args={[0.1, 2.8, 2.2]} color="#d0dbc8" castShadow={false} receiveShadow />
      {/* Top strip above window: y 3.3 to 4 */}
      <Vox position={[-4.05, 3.65, 0]} args={[0.1, 0.7, 3.6]} color="#d0dbc8" castShadow={false} receiveShadow />
      {/* Lower wainscoting back */}
      <Vox position={[-4.04, 0.6, -2.9]} args={[0.08, 1.2, 2.2]} color="#d5c8b5" castShadow={false} receiveShadow />
      {/* Lower wainscoting front */}
      <Vox position={[-4.04, 0.6, 2.9]} args={[0.08, 1.2, 2.2]} color="#d5c8b5" castShadow={false} receiveShadow />
      {/* Bottom strip below window: y 0 to 0.7 */}
      <Vox position={[-4.05, 0.35, 0]} args={[0.1, 0.7, 3.6]} color="#d5c8b5" castShadow={false} receiveShadow />

      {/* === RIGHT WALL - solid with two-tone === */}
      <Vox position={[4.05, 2.6, 0]} args={[0.1, 2.8, 8]} color="#d2dbca" castShadow={false} receiveShadow />
      <Vox position={[4.04, 0.6, 0]} args={[0.08, 1.2, 8]} color="#d5c8b5" castShadow={false} receiveShadow />
      {/* Wainscoting panels - right wall */}
      {[-3, -1.8, -0.6, 0.6, 1.8, 3].map((z, i) => (
        <Vox key={`rwp${i}`} position={[3.98, 0.65, z]} args={[0.02, 0.8, 0.9]} color="#cbbfa8" />
      ))}

      {/* === FRONT WALL - solid with two-tone === */}
      <Vox position={[0, 2.6, 4.05]} args={[8, 2.8, 0.1]} color="#d4ddd0" castShadow={false} receiveShadow />
      <Vox position={[0, 0.6, 4.04]} args={[8, 1.2, 0.08]} color="#d8cbb8" castShadow={false} receiveShadow />
      {/* Wainscoting panels - front wall */}
      {[-3, -1.5, 1.5, 3].map((x, i) => (
        <Vox key={`fwp${i}`} position={[x, 0.65, 3.98]} args={[0.9, 0.8, 0.02]} color="#cfc0a8" />
      ))}
      {/* Door frame decoration */}
      <Vox position={[0, 1.4, 3.96]} args={[1.0, 2.6, 0.04]} color="#a07040" />
      <Vox position={[0, 2.78, 3.96]} args={[1.2, 0.1, 0.04]} color="#906030" />
      {/* Door handle */}
      <Vox position={[0.35, 1.3, 3.93]} args={[0.08, 0.08, 0.06]} color="#f0c040" />

      {/* === DADO RAIL - all walls === */}
      <Vox position={[0, 1.22, -3.97]} args={[8, 0.08, 0.04]} color="#f0e8d8" />
      <Vox position={[-3.97, 1.22, 0]} args={[0.04, 0.08, 8]} color="#f0e8d8" />
      <Vox position={[3.97, 1.22, 0]} args={[0.04, 0.08, 8]} color="#f0e8d8" />
      <Vox position={[0, 1.22, 3.97]} args={[8, 0.08, 0.04]} color="#f0e8d8" />

      {/* === CROWN MOLDING - all walls top === */}
      <Vox position={[0, 3.95, -3.97]} args={[8, 0.1, 0.06]} color="#f0ece0" />
      <Vox position={[-3.97, 3.95, 0]} args={[0.06, 0.1, 8]} color="#f0ece0" />
      <Vox position={[3.97, 3.95, 0]} args={[0.06, 0.1, 8]} color="#f0ece0" />
      <Vox position={[0, 3.95, 3.97]} args={[8, 0.1, 0.06]} color="#f0ece0" />

      {/* Ceiling */}
      <Vox position={[0, 4.02, 0]} args={[8, 0.08, 8]} color="#f8f4ed" castShadow={false} receiveShadow />

      {/* Baseboard trim - all walls */}
      <Vox position={[0, 0.06, -3.97]} args={[8, 0.12, 0.05]} color="#c0b49c" />
      <Vox position={[-3.97, 0.06, 0]} args={[0.05, 0.12, 8]} color="#c0b49c" />
      <Vox position={[3.97, 0.06, 0]} args={[0.05, 0.12, 8]} color="#c0b49c" />
      <Vox position={[0, 0.06, 3.97]} args={[8, 0.12, 0.05]} color="#c0b49c" />

      {/* Big window - back wall */}
      <WindowFrame position={[0, 2, -3.99]} width={3.6} height={2.6} />

      {/* Big window - left wall */}
      <WindowFrame position={[-3.99, 2, 0]} rotation={[0, Math.PI / 2, 0]} width={3.6} height={2.6} />
    </group>
  )
}

function Desk() {
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
  { name: 'Snake', color: '#40c040' },
  { name: 'Pong', color: '#4080e0' },
  { name: 'Tetris', color: '#e04040' },
]

function Monitor({ onClick, view, onGameChange }) {
  const screenRef = useRef()
  const linesRef = useRef()
  const scrollRef = useRef(0)
  const [activeGame, setActiveGame] = useState(null)
  const LINE_H = 0.04
  const VISIBLE = 8
  const SCREEN_TOP = 0.57
  const SCREEN_BOT = 0.23
  const showMenu = view === 'controller' && !activeGame
  const showGame = view === 'controller' && activeGame

  // Reset game when leaving controller view
  React.useEffect(() => {
    if (view !== 'controller') setActiveGame(null)
  }, [view])

  // Notify parent when game changes
  React.useEffect(() => {
    onGameChange?.(!!activeGame)
  }, [activeGame, onGameChange])

  useFrame((state, delta) => {
    if (screenRef.current) {
      const t = state.clock.elapsedTime
      screenRef.current.material.emissive.set('#2040a0')
      screenRef.current.material.emissiveIntensity = 0.3 + Math.sin(t * 2) * 0.08
    }
    if (showMenu || showGame) return
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
      {/* Scrolling log lines (hidden when menu/game active) */}
      <group ref={linesRef} visible={!showMenu && !showGame}>
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
              onClick={(e) => { e.stopPropagation(); setActiveGame(game.name.toLowerCase()) }}
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
      {/* Active game on screen */}
      {showGame && (
        <group position={[0, 0.4, 0.18]}>
          {activeGame === 'snake' && <SnakeGame onExit={() => setActiveGame(null)} />}
          {activeGame === 'pong' && <PongGame onExit={() => setActiveGame(null)} />}
          {activeGame === 'tetris' && <TetrisGame onExit={() => setActiveGame(null)} />}
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

function DeskItems() {
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

function Keyboard() {
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

function Mouse() {
  return (
    <group position={[0.55, 0.82, -1.5]}>
      <Vox position={[0, 0, 0]} args={[0.1, 0.04, 0.14]} color="#d8d0c0" />
      <Vox position={[0, 0.03, -0.03]} args={[0.04, 0.02, 0.04]} color="#c0b8a8" />
    </group>
  )
}

function Chair({ view }) {
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

const BOOK_I18N = {
  java: {
    en: { title: 'Java', subtitle: '8+ years of experience', details: 'Core language across all professional projects since 2016.\n\nJava 8–21, Streams, Generics, Concurrency, JVM tuning.\n\nUsed at everis, Experis, Paradigma Digital, and Openbank for building robust backend systems.' },
    es: { title: 'Java', subtitle: '8+ años de experiencia', details: 'Lenguaje principal en todos los proyectos profesionales desde 2016.\n\nJava 8–21, Streams, Genéricos, Concurrencia, optimización JVM.\n\nUsado en everis, Experis, Paradigma Digital y Openbank para sistemas backend robustos.' },
    ru: { title: 'Java', subtitle: '8+ лет опыта', details: 'Основной язык во всех профессиональных проектах с 2016.\n\nJava 8–21, Streams, Generics, многопоточность, настройка JVM.\n\nИспользовал в everis, Experis, Paradigma Digital и Openbank.' },
  },
  spring: {
    en: { title: 'Spring Boot', subtitle: 'Primary framework', details: 'Building microservices and REST APIs with Spring Boot.\n\nSpring Data, Spring Security, WebFlux, dependency injection.\n\nUsed across all projects for scalable, production-ready backend services.' },
    es: { title: 'Spring Boot', subtitle: 'Framework principal', details: 'Construcción de microservicios y APIs REST con Spring Boot.\n\nSpring Data, Spring Security, WebFlux, inyección de dependencias.\n\nUsado en todos los proyectos para servicios backend escalables y listos para producción.' },
    ru: { title: 'Spring Boot', subtitle: 'Основной фреймворк', details: 'Разработка микросервисов и REST API на Spring Boot.\n\nSpring Data, Spring Security, WebFlux, внедрение зависимостей.\n\nИспользовал во всех проектах для масштабируемых backend-сервисов.' },
  },
  databases: {
    en: { title: 'Databases', subtitle: 'PostgreSQL · Redis · DB2 · Oracle', details: 'Schema design, complex queries, performance tuning and migrations.\n\nRedis for caching strategies.\nPostgreSQL at Paradigma Digital.\nDB2 & Oracle at everis and Experis.' },
    es: { title: 'Bases de Datos', subtitle: 'PostgreSQL · Redis · DB2 · Oracle', details: 'Diseño de esquemas, consultas complejas, optimización y migraciones.\n\nRedis para estrategias de caché.\nPostgreSQL en Paradigma Digital.\nDB2 y Oracle en everis y Experis.' },
    ru: { title: 'Базы данных', subtitle: 'PostgreSQL · Redis · DB2 · Oracle', details: 'Проектирование схем, сложные запросы, оптимизация и миграции.\n\nRedis для кэширования.\nPostgreSQL в Paradigma Digital.\nDB2 и Oracle в everis и Experis.' },
  },
  apis: {
    en: { title: 'REST & SOAP APIs', subtitle: 'API design & integration', details: 'Designing and consuming RESTful services.\n\nSOAP/WSDL integration for legacy systems.\n\nAPI documentation with Swagger/OpenAPI.\n\nVersioning strategies and contract-first development.' },
    es: { title: 'APIs REST y SOAP', subtitle: 'Diseño e integración de APIs', details: 'Diseño y consumo de servicios RESTful.\n\nIntegración SOAP/WSDL para sistemas legacy.\n\nDocumentación con Swagger/OpenAPI.\n\nEstrategias de versionado y desarrollo contract-first.' },
    ru: { title: 'REST и SOAP API', subtitle: 'Проектирование и интеграция', details: 'Проектирование и потребление REST-сервисов.\n\nИнтеграция SOAP/WSDL для legacy-систем.\n\nДокументация через Swagger/OpenAPI.\n\nСтратегии версионирования и contract-first подход.' },
  },
  devops: {
    en: { title: 'DevOps & CI/CD', subtitle: 'Jenkins · SonarQube · OpenShift', details: 'CI/CD pipelines with Jenkins.\n\nCode quality gates with SonarQube.\n\nContainerized deployments on OpenShift and Docker.\n\nAutomatic builds, tests, and deployments.' },
    es: { title: 'DevOps & CI/CD', subtitle: 'Jenkins · SonarQube · OpenShift', details: 'Pipelines CI/CD con Jenkins.\n\nControl de calidad con SonarQube.\n\nDespliegues en contenedores con OpenShift y Docker.\n\nBuilds, tests y despliegues automatizados.' },
    ru: { title: 'DevOps и CI/CD', subtitle: 'Jenkins · SonarQube · OpenShift', details: 'CI/CD пайплайны с Jenkins.\n\nКонтроль качества через SonarQube.\n\nКонтейнерные деплои на OpenShift и Docker.\n\nАвтоматические сборки, тесты и деплои.' },
  },
  cloud: {
    en: { title: 'Google Cloud', subtitle: 'Cloud infrastructure', details: 'GCP services for deploying and scaling microservices.\n\nMonitoring and observability with Kibana.\n\nCloud-native architectures and serverless patterns.\n\nUsed at Paradigma Digital.' },
    es: { title: 'Google Cloud', subtitle: 'Infraestructura cloud', details: 'Servicios GCP para despliegue y escalado de microservicios.\n\nMonitorización y observabilidad con Kibana.\n\nArquitecturas cloud-native y patrones serverless.\n\nUsado en Paradigma Digital.' },
    ru: { title: 'Google Cloud', subtitle: 'Облачная инфраструктура', details: 'Сервисы GCP для деплоя и масштабирования микросервисов.\n\nМониторинг с Kibana.\n\nCloud-native архитектуры и serverless.\n\nИспользовал в Paradigma Digital.' },
  },
  testing: {
    en: { title: 'Testing', subtitle: 'JUnit · Mockito · TDD', details: 'Unit testing with JUnit 5 and Mockito.\n\nIntegration and end-to-end testing.\n\nTDD practices for reliable code.\n\nHigh code coverage across all projects.' },
    es: { title: 'Testing', subtitle: 'JUnit · Mockito · TDD', details: 'Tests unitarios con JUnit 5 y Mockito.\n\nTests de integración y end-to-end.\n\nPrácticas TDD para código fiable.\n\nAlta cobertura de código en todos los proyectos.' },
    ru: { title: 'Тестирование', subtitle: 'JUnit · Mockito · TDD', details: 'Юнит-тесты с JUnit 5 и Mockito.\n\nИнтеграционные и E2E тесты.\n\nПрактики TDD для надёжного кода.\n\nВысокое покрытие тестами во всех проектах.' },
  },
  tools: {
    en: { title: 'Tools & VCS', subtitle: 'Git · GitLab · Kibana', details: 'Git workflows: GitFlow, trunk-based development.\n\nGitLab CI pipelines and merge strategies.\n\nLog analysis and monitoring with Kibana/ELK stack.\n\nCode review and collaboration best practices.' },
    es: { title: 'Herramientas y VCS', subtitle: 'Git · GitLab · Kibana', details: 'Flujos Git: GitFlow, trunk-based development.\n\nPipelines en GitLab CI y estrategias de merge.\n\nAnálisis de logs y monitorización con Kibana/ELK.\n\nBuenas prácticas de code review y colaboración.' },
    ru: { title: 'Инструменты и VCS', subtitle: 'Git · GitLab · Kibana', details: 'Git-процессы: GitFlow, trunk-based development.\n\nGitLab CI пайплайны и стратегии мержа.\n\nАнализ логов и мониторинг с Kibana/ELK.\n\nЛучшие практики код-ревью.' },
  },
  languages: {
    en: { title: 'Languages', subtitle: '4 languages spoken', details: '🇪🇸 Spanish — Native\n🇬🇧 English — Full Professional\n🇷🇺 Russian — Native\n🇺🇦 Ukrainian — Native' },
    es: { title: 'Idiomas', subtitle: '4 idiomas', details: '🇪🇸 Español — Nativo\n🇬🇧 Inglés — Profesional completo\n🇷🇺 Ruso — Nativo\n🇺🇦 Ucraniano — Nativo' },
    ru: { title: 'Языки', subtitle: '4 языка', details: '🇪🇸 Испанский — Родной\n🇬🇧 Английский — Профессиональный\n🇷🇺 Русский — Родной\n🇺🇦 Украинский — Родной' },
  },
  education: {
    en: { title: 'Computer Science', subtitle: 'UCAM · 2015–2019', details: 'Degree in Computer Science Engineering.\n\nUniversidad Católica San Antonio de Murcia (UCAM).\n\nPublished research on collaborative workspace management for students.' },
    es: { title: 'Ingeniería Informática', subtitle: 'UCAM · 2015–2019', details: 'Grado en Ingeniería Informática.\n\nUniversidad Católica San Antonio de Murcia (UCAM).\n\nInvestigación publicada sobre gestión colaborativa de espacios de trabajo para estudiantes.' },
    ru: { title: 'Информатика', subtitle: 'UCAM · 2015–2019', details: 'Степень в области компьютерных наук.\n\nUniversidad Católica San Antonio de Murcia (UCAM).\n\nОпубликованное исследование по совместному управлению рабочими пространствами студентов.' },
  },
  publication: {
    en: { title: 'Publication', subtitle: 'University Conference 2019', details: '"Hay Sitio: A collaborative application for managing student workspaces in computer science"\n\nProceedings of the Conference on University Teaching of CS, Vol 4 (2019).' },
    es: { title: 'Publicación', subtitle: 'Congreso Universitario 2019', details: '"Hay Sitio: Aplicación colaborativa para la gestión de espacios de trabajo de estudiantes de informática"\n\nActas de las Jornadas sobre la Enseñanza Universitaria de la Informática, Vol 4 (2019).' },
    ru: { title: 'Публикация', subtitle: 'Университетская конференция 2019', details: '«Hay Sitio: Совместное приложение для управления рабочими пространствами студентов информатики»\n\nМатериалы конференции по университетскому преподаванию информатики, Том 4 (2019).' },
  },
}

function getBookData(currentLang) {
  const l = currentLang || 'en'
  const base = [
    { id: 'java', label: 'Java', color: '#e04040', height: 0.38, shelf: 0, col: 0 },
    { id: 'spring', label: 'Spring', color: '#4080e0', height: 0.42, shelf: 0, col: 1 },
    { id: 'databases', label: 'DBs', color: '#40c060', height: 0.35, shelf: 0, col: 2 },
    { id: 'apis', label: 'APIs', color: '#e0a020', height: 0.44, shelf: 0, col: 3 },
    { id: 'devops', label: 'DevOps', color: '#a050d0', height: 0.4, shelf: 1, col: 0 },
    { id: 'cloud', label: 'Cloud', color: '#30b0a0', height: 0.36, shelf: 1, col: 1 },
    { id: 'testing', label: 'Testing', color: '#e07020', height: 0.43, shelf: 1, col: 2 },
    { id: 'tools', label: 'Git', color: '#e040a0', height: 0.37, shelf: 1, col: 3 },
    { id: 'languages', label: 'Langs', color: '#d06080', height: 0.36, shelf: 3, col: 0 },
    { id: 'education', label: 'Degree', color: '#40a0a0', height: 0.36, shelf: 3, col: 1 },
    { id: 'publication', label: 'Paper', color: '#a080d0', height: 0.36, shelf: 3, col: 2 },
  ]
  return base.map(b => ({ ...b, ...(BOOK_I18N[b.id]?.[l] || BOOK_I18N[b.id]?.en) }))
}

const SHELF_Y = [0.5, 1.3, 2.1, 2.9]

function Book({ data, basePosition, onBookClick, interactive }) {
  const groupRef = useRef()
  const [hovered, setHovered] = useState(false)
  const liftY = useRef(0)

  useFrame(() => {
    if (!groupRef.current) return
    const target = hovered && interactive ? 0.08 : 0
    liftY.current += (target - liftY.current) * 0.1
    groupRef.current.position.y = basePosition[1] + liftY.current
  })

  return (
    <group
      ref={groupRef}
      position={basePosition}
      onPointerOver={(e) => {
        if (!interactive) return
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        if (!interactive) return
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
      onClick={(e) => {
        if (!interactive) return
        e.stopPropagation()
        const worldPos = new THREE.Vector3()
        groupRef.current.getWorldPosition(worldPos)
        onBookClick?.({ ...data, worldPos: [worldPos.x, worldPos.y, worldPos.z] })
      }}
    >
      {/* Book body */}
      <mesh>
        <boxGeometry args={[0.14, data.height, 0.24]} />
        <meshLambertMaterial color={hovered && interactive ? '#ffffff' : data.color} flatShading />
      </mesh>
      {/* Spine label — on the front face (z+), vertical like a real book */}
      <group castShadow={false}>
        <Text
          position={[0, 0, 0.121]}
          rotation={[0, 0, -Math.PI / 2]}
          fontSize={0.04}
          color="#ffffff"
          fillOpacity={0.45}
          anchorX="center"
          anchorY="middle"
          maxWidth={data.height * 0.85}
          textAlign="center"
          font="/fonts/PressStart2P-Regular.ttf"
          castShadow={false}
        >
          {data.label}
        </Text>
      </group>
    </group>
  )
}

function Bookshelf({ onClick, onBookClick, interactive }) {
  return (
    <group
      position={[3.8, 0, -1.5]}
      rotation={[0, -Math.PI / 2, 0]}
      onClick={(e) => { e.stopPropagation(); onClick?.() }}
      onPointerOver={() => { if (!interactive) document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { if (!interactive) document.body.style.cursor = 'auto' }}
    >
      {/* Shelf boards */}
      {SHELF_Y.map((y, i) => (
        <Vox key={i} position={[0, y, 0]} args={[0.9, 0.06, 0.4]} color="#c07830" />
      ))}
      {/* Side panels - extend to floor */}
      {[-0.45, 0.45].map((x, i) => (
        <Vox key={i} position={[x, 1.6, 0]} args={[0.06, 3.2, 0.4]} color="#a06020" />
      ))}
      {/* Interactive books */}
      {getBookData(lang).map((book) => {
        const shelfY = SHELF_Y[book.shelf]
        const baseY = shelfY + book.height / 2 + 0.03
        const baseX = -0.28 + book.col * 0.19
        return (
          <Book
            key={book.id}
            data={book}
            basePosition={[baseX, baseY, 0]}
            onBookClick={onBookClick}
            interactive={interactive}
          />
        )
      })}
      {/* Shelf 3 - decorative items */}
      {/* Globe */}
      <Vox position={[-0.25, 2.22, 0]} args={[0.18, 0.18, 0.18]} color="#60a0d0" />
      <Vox position={[-0.25, 2.14, 0]} args={[0.1, 0.04, 0.1]} color="#a08040" />
      {/* Small storage box */}
      <Vox position={[0.05, 2.18, 0]} args={[0.2, 0.12, 0.2]} color="#d0a870" />
      <Vox position={[0.05, 2.25, 0]} args={[0.22, 0.02, 0.22]} color="#c09858" />
      {/* Trophy/vase */}
      <Vox position={[0.3, 2.16, 0]} args={[0.08, 0.08, 0.08]} color="#f0c040" />
      <Vox position={[0.3, 2.22, 0]} args={[0.12, 0.04, 0.12]} color="#f0c040" />
      {/* Leaning photo frame */}
      <Vox position={[0.3, 2.98, 0.08]} args={[0.14, 0.18, 0.02]} color="#f0e8d0" />
      <Vox position={[0.3, 2.98, 0.09]} args={[0.1, 0.14, 0.01]} color="#80c0a0" />
    </group>
  )
}

function Chest({ onClick, open }) {
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

function Plant({ position }) {
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

function Rug() {
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

function CoffeeMug() {
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

function GitHubMark() {
  const texture = useLoader(THREE.TextureLoader, '/images/github-mark.png')
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.generateMipmaps = false
  return (
    <mesh position={[0, 0, 0.045]}>
      <planeGeometry args={[0.42, 0.42]} />
      <meshLambertMaterial map={texture} transparent flatShading />
    </mesh>
  )
}

function WallArt({ onGithubClick, onLinkedinClick, onBack, view }) {
  return (
    <group>
      {/* Pixel art frame 1 - GitHub logo (on right solid section of back wall) */}
      <group
        position={[3, 2.2, -3.95]}
        onClick={(e) => {
          e.stopPropagation()
          if (view === 'github') { window.open('https://github.com/maksymhs', '_blank'); onBack?.() }
          else onGithubClick?.()
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        {/* Frame */}
        <Vox position={[0, 0, 0]} args={[0.7, 0.7, 0.06]} color="#f0f0e0" />
        {/* White background */}
        <Vox position={[0, 0, 0.03]} args={[0.55, 0.55, 0.02]} color="#ffffff" />
        {/* GitHub mark texture */}
        <GitHubMark />
      </group>

      {/* Pixel art frame 2 - LinkedIn logo (on left solid section of back wall) */}
      <group
        position={[-3, 2.2, -3.95]}
        onClick={(e) => {
          e.stopPropagation()
          if (view === 'linkedin') { window.open('https://www.linkedin.com/in/herasymenko', '_blank'); onBack?.() }
          else onLinkedinClick?.()
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        {/* Frame */}
        <Vox position={[0, 0, 0]} args={[0.7, 0.7, 0.06]} color="#f0f0e0" />
        {/* Blue background with rounded corners */}
        <Vox position={[0, 0, 0.03]} args={[0.55, 0.55, 0.02]} color="#286890" />
        {/* Rounded corners cut (match frame color to simulate rounding) */}
        {[[-0.245, 0.245], [0.245, 0.245], [-0.245, -0.245], [0.245, -0.245]].map(([x, y], i) => (
          <Vox key={`rc${i}`} position={[x, y, 0.035]} args={[0.06, 0.06, 0.015]} color="#f0f0e0" />
        ))}
        {/* Letter "i" - left side */}
        {/* Dot */}
        <Vox position={[-0.12, 0.14, 0.045]} args={[0.05, 0.05, 0.01]} color="#ffffff" />
        {/* Stem */}
        {[0.07, 0.035, 0, -0.035, -0.07, -0.105].map((y, i) => (
          <Vox key={`is${i}`} position={[-0.12, y, 0.045]} args={[0.05, 0.035, 0.01]} color="#ffffff" />
        ))}
        {/* Letter "n" - right side */}
        {/* Left vertical */}
        {[0.07, 0.035, 0, -0.035, -0.07, -0.105].map((y, i) => (
          <Vox key={`nl${i}`} position={[0.0, y, 0.045]} args={[0.05, 0.035, 0.01]} color="#ffffff" />
        ))}
        {/* Top curve */}
        <Vox position={[0.05, 0.07, 0.045]} args={[0.05, 0.035, 0.01]} color="#ffffff" />
        <Vox position={[0.1, 0.07, 0.045]} args={[0.05, 0.035, 0.01]} color="#ffffff" />
        <Vox position={[0.1, 0.105, 0.045]} args={[0.05, 0.035, 0.01]} color="#ffffff" />
        {/* Right vertical */}
        {[0.035, 0, -0.035, -0.07, -0.105].map((y, i) => (
          <Vox key={`nr${i}`} position={[0.14, y, 0.045]} args={[0.05, 0.035, 0.01]} color="#ffffff" />
        ))}
      </group>
    </group>
  )
}

function Lamp() {
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

// Furniture bounding boxes [minX, maxX, minZ, maxZ] with padding for cat
const obstacles = [
  [-1.4, 1.4, -2.5, -1.1],   // Desk
  [-0.5, 0.5, -1.1, -0.1],   // Chair
  [1.7, 3.9, 1.2, 3.9],      // Bed
  [-3.4, -2.2, 1.4, 3.6],    // Sofa
  [3.2, 4.0, -2.1, -0.9],    // Bookshelf
  [-3.8, -2.5, -3.8, -2.5],  // Chest (diagonal in corner)
  [-3.6, -3.0, -1.8, -1.2],  // Plant (left wall)
  [1.2, 1.8, -3.8, -3.2],   // Plant (back wall)
  [-2.5, -1.1, 2.1, 2.9],    // Coffee table
  [-3.7, -3.1, 0.8, 1.6],    // Floor lamp
  [1.2, 2.0, 3.0, 3.8],      // Nightstand
]

function isInsideObstacle(x, z) {
  for (const [x1, x2, z1, z2] of obstacles) {
    if (x >= x1 && x <= x2 && z >= z1 && z <= z2) return true
  }
  return false
}

function Cat({ onClick, catRef: externalRef }) {
  const catRef = externalRef || useRef()
  const legsRef = useRef({ fl: null, fr: null, bl: null, br: null })
  // Waypoints designed to walk AROUND furniture in a clear path
  const waypoints = useMemo(() => [
    [1.5, 0],        // In front of desk, right side
    [1.5, 0.7],      // Walk right
    [1.5, -0.5],     // Move toward back wall
    [2.5, -0.5],     // Toward bookshelf gap
    [2.8, -2.5],     // Past bookshelf near back-right corner
    [1.8, -3.2],     // Along back wall
    [0, -3.2],       // Center back wall
    [-1.8, -3.2],    // Left side back wall
    [-2.5, -3.2],    // Near back-left corner (avoid chest)
    [-2.5, -2.5],    // Around chest (front)
    [-3.2, -0.8],    // Past chest toward left wall
    [-3.2, 0.5],     // Mid left wall
    [-1.8, 0.5],     // Toward center
    [-1, 1.2],       // Center of room
    [-0.5, 1.8],     // Between coffee table and bed
    [0.5, 1.8],      // Cross center toward bed side
    [1.5, 0.5],      // Loop back near desk
    [0.5, 0],        // Back to front of desk
  ], [])
  const stateRef = useRef({ wp: 0, waiting: 0 })

  useFrame((state) => {
    if (!catRef.current) return
    const s = stateRef.current
    const t = state.clock.elapsedTime

    if (s.waiting > 0) {
      s.waiting -= 0.016
      catRef.current.children.forEach(c => {
        if (c.userData?.isTail) c.rotation.y = Math.sin(t * 3) * 0.3
      })
      // Reset legs when idle
      const { fl, fr, bl, br } = legsRef.current
      if (fl) fl.rotation.x *= 0.9
      if (fr) fr.rotation.x *= 0.9
      if (bl) bl.rotation.x *= 0.9
      if (br) br.rotation.x *= 0.9
      return
    }

    const [tx, tz] = waypoints[s.wp]
    const cx = catRef.current.position.x
    const cz = catRef.current.position.z
    const dx = tx - cx
    const dz = tz - cz
    const dist = Math.sqrt(dx * dx + dz * dz)

    if (dist < 0.15) {
      s.wp = (s.wp + 1) % waypoints.length
      s.waiting = 0.8 + Math.random() * 1.5
      return
    }

    const speed = 0.014
    const nx = cx + (dx / dist) * speed
    const nz = cz + (dz / dist) * speed

    // Collision check — skip to next waypoint if blocked
    if (isInsideObstacle(nx, nz)) {
      s.wp = (s.wp + 1) % waypoints.length
      s.waiting = 0.3
      return
    }

    catRef.current.position.x = nx
    catRef.current.position.z = nz
    catRef.current.rotation.y = Math.atan2(dx, dz)

    const legSwing = Math.sin(t * 8) * 0.3
    const { fl, fr, bl, br } = legsRef.current
    if (fl) fl.rotation.x = legSwing
    if (fr) fr.rotation.x = -legSwing
    if (bl) bl.rotation.x = -legSwing
    if (br) br.rotation.x = legSwing

    catRef.current.children.forEach(c => {
      if (c.userData?.isTail) c.rotation.y = Math.sin(t * 4) * 0.4
    })
  })

  return (
    <group
      ref={catRef}
      position={[1.5, 0, 1]}
      onClick={(e) => { e.stopPropagation(); onClick?.() }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'auto')}
    >
      {/* Body */}
      <Vox position={[0, 0.22, 0]} args={[0.2, 0.16, 0.34]} color="#f0a860" />
      {/* Stripes */}
      <Vox position={[0, 0.28, -0.05]} args={[0.22, 0.04, 0.06]} color="#d09040" />
      <Vox position={[0, 0.28, 0.08]} args={[0.22, 0.04, 0.06]} color="#d09040" />
      {/* Head */}
      <Vox position={[0, 0.32, 0.2]} args={[0.2, 0.18, 0.18]} color="#f0b068" />
      {/* Ears */}
      <Vox position={[-0.07, 0.44, 0.2]} args={[0.05, 0.07, 0.05]} color="#f0a860" />
      <Vox position={[0.07, 0.44, 0.2]} args={[0.05, 0.07, 0.05]} color="#f0a860" />
      <Vox position={[-0.07, 0.44, 0.2]} args={[0.03, 0.04, 0.03]} color="#ffb0b0" />
      <Vox position={[0.07, 0.44, 0.2]} args={[0.03, 0.04, 0.03]} color="#ffb0b0" />
      {/* Eyes */}
      <Vox position={[-0.05, 0.34, 0.3]} args={[0.04, 0.04, 0.02]} color="#204020" />
      <Vox position={[0.05, 0.34, 0.3]} args={[0.04, 0.04, 0.02]} color="#204020" />
      {/* Nose */}
      <Vox position={[0, 0.3, 0.3]} args={[0.025, 0.02, 0.02]} color="#ffb0b0" />
      {/* Front left leg */}
      <group ref={el => { if (legsRef.current) legsRef.current.fl = el }} position={[-0.07, 0.08, 0.1]}>
        <Vox position={[0, 0, 0]} args={[0.06, 0.16, 0.06]} color="#e8a050" />
      </group>
      {/* Front right leg */}
      <group ref={el => { if (legsRef.current) legsRef.current.fr = el }} position={[0.07, 0.08, 0.1]}>
        <Vox position={[0, 0, 0]} args={[0.06, 0.16, 0.06]} color="#e8a050" />
      </group>
      {/* Back left leg */}
      <group ref={el => { if (legsRef.current) legsRef.current.bl = el }} position={[-0.07, 0.08, -0.1]}>
        <Vox position={[0, 0, 0]} args={[0.06, 0.16, 0.06]} color="#e8a050" />
      </group>
      {/* Back right leg */}
      <group ref={el => { if (legsRef.current) legsRef.current.br = el }} position={[0.07, 0.08, -0.1]}>
        <Vox position={[0, 0, 0]} args={[0.06, 0.16, 0.06]} color="#e8a050" />
      </group>
      {/* Tail */}
      <group userData={{ isTail: true }}>
        <Vox position={[0, 0.28, -0.22]} args={[0.05, 0.05, 0.1]} color="#e09848" />
        <Vox position={[0, 0.34, -0.28]} args={[0.04, 0.06, 0.06]} color="#e09848" />
      </group>
    </group>
  )
}

// ========== COZY FURNITURE ==========

function Bed() {
  return (
    <group position={[2.8, 0, 2.6]} rotation={[0, Math.PI, 0]}>
      {/* Frame */}
      <Vox position={[0, 0.25, 0]} args={[1.8, 0.12, 2.4]} color="#a07040" castShadow />
      {/* Legs */}
      {[[-0.8, 0.1, -1.1], [0.8, 0.1, -1.1], [-0.8, 0.1, 1.1], [0.8, 0.1, 1.1]].map((pos, i) => (
        <Vox key={i} position={pos} args={[0.12, 0.2, 0.12]} color="#886030" />
      ))}
      {/* Mattress */}
      <Vox position={[0, 0.38, 0]} args={[1.7, 0.14, 2.3]} color="#f0f0f8" />
      {/* Headboard */}
      <Vox position={[0, 0.7, -1.15]} args={[1.8, 0.8, 0.1]} color="#a07040" castShadow />
      <Vox position={[0, 0.7, -1.1]} args={[1.6, 0.6, 0.04]} color="#c08848" />
      {/* Pillow */}
      <Vox position={[-0.35, 0.5, -0.8]} args={[0.5, 0.12, 0.3]} color="#f8f0e0" />
      <Vox position={[0.35, 0.5, -0.8]} args={[0.5, 0.12, 0.3]} color="#f8f0e0" />
      {/* Blanket - folded at bottom */}
      <Vox position={[0, 0.48, 0.1]} args={[1.6, 0.08, 1.6]} color="#7090d0" />
      <Vox position={[0, 0.48, -0.2]} args={[1.6, 0.1, 0.4]} color="#80a0e0" />
      {/* Blanket fold at foot */}
      <Vox position={[0, 0.52, 0.85]} args={[1.6, 0.12, 0.4]} color="#6080c0" />
    </group>
  )
}

function Sofa() {
  return (
    <group position={[-2.8, 0, 2.5]} rotation={[0, Math.PI / 2, 0]}>
      {/* Base/seat */}
      <Vox position={[0, 0.35, 0]} args={[1.8, 0.3, 0.8]} color="#d06050" castShadow />
      {/* Back cushion - against wall */}
      <Vox position={[0, 0.65, -0.32]} args={[1.8, 0.35, 0.2]} color="#c05040" />
      {/* Arm rests */}
      <Vox position={[-0.85, 0.5, 0]} args={[0.14, 0.35, 0.8]} color="#c05040" />
      <Vox position={[0.85, 0.5, 0]} args={[0.14, 0.35, 0.8]} color="#c05040" />
      {/* Legs */}
      {[[-0.75, 0.1, -0.3], [0.75, 0.1, -0.3], [-0.75, 0.1, 0.3], [0.75, 0.1, 0.3]].map((pos, i) => (
        <Vox key={i} position={pos} args={[0.1, 0.2, 0.1]} color="#806040" />
      ))}
      {/* Seat cushions */}
      <Vox position={[-0.4, 0.52, 0.02]} args={[0.72, 0.06, 0.68]} color="#e06858" />
      <Vox position={[0.4, 0.52, 0.02]} args={[0.72, 0.06, 0.68]} color="#e06858" />
      {/* Throw cushions */}
      <Vox position={[-0.6, 0.65, 0.05]} args={[0.28, 0.28, 0.12]} color="#f0d040" />
      <Vox position={[0.55, 0.65, 0.08]} args={[0.24, 0.24, 0.1]} color="#60c0a0" />
    </group>
  )
}


function SideTable({ position }) {
  return (
    <group position={position}>
      {/* Top */}
      <Vox position={[0, 0.5, 0]} args={[0.5, 0.06, 0.5]} color="#a07040" />
      {/* Leg */}
      <Vox position={[0, 0.25, 0]} args={[0.12, 0.5, 0.12]} color="#886030" />
      {/* Base */}
      <Vox position={[0, 0.02, 0]} args={[0.36, 0.04, 0.36]} color="#886030" />
    </group>
  )
}

function WallClock() {
  const minuteRef = useRef()
  const hourRef = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    // Rotate the pivot groups — the hands extend in +y from the pivot
    // rotation.x spins them in the YZ plane (correct for right wall)
    if (minuteRef.current) minuteRef.current.rotation.x = -t * 0.5
    if (hourRef.current) hourRef.current.rotation.x = -t * 0.04
  })

  return (
    <group position={[3.9, 2.8, -2.8]}>
      {/* Clock body - round face */}
      <Vox position={[0, 0, 0]} args={[0.08, 0.6, 0.6]} color="#f8f0e0" />
      {/* Frame border */}
      <Vox position={[-0.01, 0.28, 0]} args={[0.1, 0.06, 0.58]} color="#c08040" />
      <Vox position={[-0.01, -0.28, 0]} args={[0.1, 0.06, 0.58]} color="#c08040" />
      <Vox position={[-0.01, 0, 0.28]} args={[0.1, 0.58, 0.06]} color="#c08040" />
      <Vox position={[-0.01, 0, -0.28]} args={[0.1, 0.58, 0.06]} color="#c08040" />
      {/* Hour marks - 12(top), 6(bottom), 3(+z), 9(-z) */}
      <Vox position={[-0.05, 0.22, 0]} args={[0.02, 0.05, 0.03]} color="#404040" />
      <Vox position={[-0.05, -0.22, 0]} args={[0.02, 0.05, 0.03]} color="#404040" />
      <Vox position={[-0.05, 0, 0.22]} args={[0.02, 0.03, 0.05]} color="#404040" />
      <Vox position={[-0.05, 0, -0.22]} args={[0.02, 0.03, 0.05]} color="#404040" />
      {/* Center hub */}
      <Vox position={[-0.06, 0, 0]} args={[0.03, 0.06, 0.06]} color="#303030" />
      {/* Minute hand pivot - long, thin */}
      <group ref={minuteRef} position={[-0.07, 0, 0]}>
        <Vox position={[0, 0.1, 0]} args={[0.015, 0.2, 0.02]} color="#202020" />
      </group>
      {/* Hour hand pivot - shorter, thicker */}
      <group ref={hourRef} position={[-0.08, 0, 0]}>
        <Vox position={[0, 0.065, 0]} args={[0.02, 0.14, 0.025]} color="#404040" />
      </group>
    </group>
  )
}

function Poster() {
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
    // Each bulb cycles through colors at its own offset, slow speed
    const colorIdx = Math.floor((t * 0.4 + index * 0.7) % XMAS_COLORS.length)
    const color = XMAS_COLORS[colorIdx]
    // Gentle blink: fade between 0.4 and 1.0
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

function FairyLights() {
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

function WallShelf() {
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


function CoffeeTable({ onHeadphonesClick }) {
  return (
    <group position={[-1.8, 0, 2.5]}>
      {/* Top */}
      <Vox position={[0, 0.35, 0]} args={[0.9, 0.06, 0.5]} color="#b08040" />
      {/* Legs */}
      {[[-0.35, 0.16, -0.18], [0.35, 0.16, -0.18], [-0.35, 0.16, 0.18], [0.35, 0.16, 0.18]].map((pos, i) => (
        <Vox key={i} position={pos} args={[0.08, 0.32, 0.08]} color="#906830" />
      ))}
      {/* Headphones */}
      <group
        position={[-0.2, 0.4, 0]}
        onClick={(e) => { e.stopPropagation(); onHeadphonesClick?.() }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        {/* Headband */}
        <Vox position={[0, 0.1, 0]} args={[0.28, 0.03, 0.06]} color="#303030" />
        <Vox position={[-0.14, 0.06, 0]} args={[0.03, 0.1, 0.06]} color="#303030" />
        <Vox position={[0.14, 0.06, 0]} args={[0.03, 0.1, 0.06]} color="#303030" />
        {/* Left ear cup */}
        <Vox position={[-0.16, 0, 0]} args={[0.08, 0.12, 0.12]} color="#404040" />
        <Vox position={[-0.16, 0, 0.05]} args={[0.06, 0.1, 0.03]} color="#505050" />
        {/* Right ear cup */}
        <Vox position={[0.16, 0, 0]} args={[0.08, 0.12, 0.12]} color="#404040" />
        <Vox position={[0.16, 0, 0.05]} args={[0.06, 0.1, 0.03]} color="#505050" />
        {/* Cushion pads */}
        <Vox position={[-0.16, 0, 0.07]} args={[0.05, 0.08, 0.02]} color="#606060" />
        <Vox position={[0.16, 0, 0.07]} args={[0.05, 0.08, 0.02]} color="#606060" />
      </group>
      {/* Small plant on table */}
      <Vox position={[0.25, 0.42, 0]} args={[0.1, 0.08, 0.1]} color="#d07040" />
      <Vox position={[0.25, 0.5, 0]} args={[0.08, 0.08, 0.08]} color="#50b050" />
    </group>
  )
}

function CeilingLamp() {
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

function Curtain({ position, rotation }) {
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

function FloorLamp() {
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

function LivingRug() {
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

function BedRug() {
  return (
    <group position={[1.6, 0.01, 2.2]}>
      <Vox position={[0, 0, 0]} args={[0.6, 0.02, 1.0]} color="#d0b898" castShadow={false} receiveShadow />
      <Vox position={[0, 0.005, 0]} args={[0.5, 0.02, 0.9]} color="#c0a888" castShadow={false} receiveShadow />
    </group>
  )
}

function Nightstand() {
  const [lampOn, setLampOn] = useState(true)
  return (
    <group position={[1.6, 0, 3.4]}>
      {/* Top */}
      <Vox position={[0, 0.5, 0]} args={[0.5, 0.06, 0.45]} color="#a07040" />
      {/* Body */}
      <Vox position={[0, 0.3, 0]} args={[0.48, 0.34, 0.43]} color="#b07838" />
      {/* Drawer */}
      <Vox position={[0, 0.35, 0.22]} args={[0.4, 0.14, 0.02]} color="#c08848" />
      <Vox position={[0, 0.35, 0.24]} args={[0.08, 0.04, 0.02]} color="#f0c040" />
      <Vox position={[0, 0.2, 0.22]} args={[0.4, 0.14, 0.02]} color="#c08848" />
      <Vox position={[0, 0.2, 0.24]} args={[0.08, 0.04, 0.02]} color="#f0c040" />
      {/* Legs */}
      {[[-0.2, 0.06, -0.18], [0.2, 0.06, -0.18], [-0.2, 0.06, 0.18], [0.2, 0.06, 0.18]].map((pos, i) => (
        <Vox key={i} position={pos} args={[0.06, 0.12, 0.06]} color="#886030" />
      ))}
      {/* Alarm clock on top */}
      <Vox position={[0.1, 0.6, 0.05]} args={[0.12, 0.1, 0.06]} color="#e05050" />
      <Vox position={[0.1, 0.6, 0.08]} args={[0.08, 0.06, 0.01]} color="#f0f0e0" />
      {/* Small lamp on nightstand - clickable */}
      <group
        onClick={(e) => { e.stopPropagation(); setLampOn(!lampOn) }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <Vox position={[-0.12, 0.58, 0]} args={[0.08, 0.06, 0.08]} color="#e0c080" />
        <Vox position={[-0.12, 0.66, 0]} args={[0.04, 0.1, 0.04]} color="#e0c080" />
        <Vox position={[-0.12, 0.74, 0]} args={[0.14, 0.06, 0.14]} color={lampOn ? '#fff0d0' : '#908070'} />
      </group>
      {lampOn && <pointLight position={[-0.12, 0.8, 0]} intensity={0.3} color="#ffe080" distance={2} />}
    </group>
  )
}

// ========== OUTDOOR LANDSCAPE ==========

function PixelTree({ position, trunkColor = '#806030', leafColor = '#40a040' }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <Vox position={[0, 0.4, 0]} args={[0.3, 0.8, 0.3]} color={trunkColor} />
      {/* Leaves - stacked pyramid */}
      <Vox position={[0, 1.0, 0]} args={[1.2, 0.4, 1.2]} color={leafColor} />
      <Vox position={[0, 1.35, 0]} args={[0.9, 0.35, 0.9]} color={leafColor} />
      <Vox position={[0, 1.65, 0]} args={[0.6, 0.3, 0.6]} color={leafColor} />
      <Vox position={[0, 1.9, 0]} args={[0.3, 0.25, 0.3]} color={leafColor} />
    </group>
  )
}

function PixelCloud({ position }) {
  const cloudRef = useRef()
  const speed = useMemo(() => 0.1 + Math.random() * 0.15, [])

  useFrame((state) => {
    if (cloudRef.current) {
      cloudRef.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * speed) * 2
    }
  })

  return (
    <group ref={cloudRef} position={position}>
      <Vox position={[0, 0, 0]} args={[1.6, 0.4, 0.6]} color="#ffffff" />
      <Vox position={[-0.5, 0.25, 0]} args={[0.8, 0.3, 0.5]} color="#ffffff" />
      <Vox position={[0.4, 0.2, 0]} args={[1.0, 0.3, 0.5]} color="#ffffff" />
      <Vox position={[0, -0.15, 0]} args={[1.2, 0.2, 0.5]} color="#f0f0f0" />
    </group>
  )
}

function Sun() {
  const sunRef = useRef()

  useFrame((state) => {
    if (sunRef.current) {
      sunRef.current.rotation.z = state.clock.elapsedTime * 0.1
    }
  })

  return (
    <group ref={sunRef} position={[6, 8, -12]}>
      {/* Sun body */}
      <Vox position={[0, 0, 0]} args={[1.4, 1.4, 0.3]} color="#ffe040" />
      <Vox position={[0, 0, 0]} args={[1.0, 1.8, 0.2]} color="#ffe040" />
      <Vox position={[0, 0, 0]} args={[1.8, 1.0, 0.2]} color="#ffe040" />
      {/* Rays - diagonal */}
      <Vox position={[0.7, 0.7, 0]} args={[0.6, 0.2, 0.15]} color="#fff080" />
      <Vox position={[-0.7, 0.7, 0]} args={[0.6, 0.2, 0.15]} color="#fff080" />
      <Vox position={[0.7, -0.7, 0]} args={[0.6, 0.2, 0.15]} color="#fff080" />
      <Vox position={[-0.7, -0.7, 0]} args={[0.6, 0.2, 0.15]} color="#fff080" />
      {/* Glow */}
      <pointLight intensity={2} color="#ffe060" distance={30} />
    </group>
  )
}

function Grass() {
  return (
    <group>
      {/* Main ground plane - extends very far */}
      <Vox position={[0, -0.3, -20]} args={[80, 0.4, 50]} color="#60b840" castShadow={false} receiveShadow />
      {/* Extra ground to left side */}
      <Vox position={[-20, -0.3, 0]} args={[50, 0.4, 80]} color="#58b038" castShadow={false} receiveShadow />
      {/* Shade patches */}
      <Vox position={[-5, -0.08, -7]} args={[4, 0.05, 3]} color="#50a830" castShadow={false} />
      <Vox position={[4, -0.08, -9]} args={[3, 0.05, 4]} color="#68c048" castShadow={false} />
      <Vox position={[-10, -0.08, -6]} args={[5, 0.05, 3]} color="#58b038" castShadow={false} />
      <Vox position={[8, -0.08, -14]} args={[6, 0.05, 4]} color="#50a830" castShadow={false} />
      <Vox position={[-14, -0.08, 2]} args={[5, 0.05, 4]} color="#68c048" castShadow={false} />
      {/* Path */}
      <Vox position={[0, -0.08, -8]} args={[1.2, 0.05, 8]} color="#d4b888" castShadow={false} />
      {/* Distant hills */}
      <Vox position={[0, 0.5, -30]} args={[60, 2, 6]} color="#48a038" castShadow={false} />
      <Vox position={[-15, 1.2, -34]} args={[20, 3, 5]} color="#409030" castShadow={false} />
      <Vox position={[12, 0.8, -32]} args={[18, 2.5, 5]} color="#48a838" castShadow={false} />
      {/* Very distant mountains */}
      <Vox position={[0, 2.5, -40]} args={[80, 6, 4]} color="#70a8d0" castShadow={false} />
      <Vox position={[-20, 4, -42]} args={[25, 9, 4]} color="#6098c0" castShadow={false} />
      <Vox position={[18, 3.5, -41]} args={[20, 8, 4]} color="#6898c8" castShadow={false} />
    </group>
  )
}

function Flowers() {
  const flowerData = useMemo(() => {
    const flowers = []
    const colors = ['#ff6080', '#ff80a0', '#f0d040', '#ff9050', '#e060d0', '#60a0ff']
    for (let i = 0; i < 20; i++) {
      flowers.push({
        x: -12 + Math.random() * 24,
        z: -5 - Math.random() * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        h: 0.15 + Math.random() * 0.2
      })
    }
    return flowers
  }, [])

  return (
    <group>
      {flowerData.map((f, i) => (
        <group key={i} position={[f.x, 0, f.z]}>
          {/* Stem */}
          <Vox position={[0, f.h / 2, 0]} args={[0.04, f.h, 0.04]} color="#308020" />
          {/* Flower head */}
          <Vox position={[0, f.h + 0.06, 0]} args={[0.14, 0.1, 0.14]} color={f.color} />
          <Vox position={[0, f.h + 0.06, 0]} args={[0.08, 0.12, 0.08]} color="#fff080" />
        </group>
      ))}
    </group>
  )
}

function Fence() {
  return (
    <group position={[0, 0, -4.8]}>
      {/* Horizontal rail */}
      <Vox position={[0, 0.35, 0]} args={[14, 0.08, 0.08]} color="#c0a060" />
      <Vox position={[0, 0.65, 0]} args={[14, 0.08, 0.08]} color="#c0a060" />
      {/* Vertical posts */}
      {Array.from({ length: 15 }).map((_, i) => (
        <Vox key={i} position={[-7 + i * 1, 0.4, 0]} args={[0.1, 0.8, 0.1]} color="#b09050" />
      ))}
    </group>
  )
}

function Butterfly({ startPos }) {
  const ref = useRef()
  const speed = useMemo(() => 0.5 + Math.random() * 1, [])
  const radius = useMemo(() => 0.5 + Math.random() * 1, [])
  const color = useMemo(() => ['#ff80c0', '#80c0ff', '#ffe060', '#c080ff'][Math.floor(Math.random() * 4)], [])

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime * speed
      ref.current.position.x = startPos[0] + Math.sin(t) * radius
      ref.current.position.y = startPos[1] + Math.sin(t * 1.5) * 0.3
      ref.current.position.z = startPos[2] + Math.cos(t * 0.7) * radius
    }
  })

  return (
    <group ref={ref} position={startPos}>
      <Vox position={[-0.06, 0, 0]} args={[0.08, 0.04, 0.06]} color={color} />
      <Vox position={[0.06, 0, 0]} args={[0.08, 0.04, 0.06]} color={color} />
      <Vox position={[0, 0, 0]} args={[0.02, 0.06, 0.02]} color="#303030" />
    </group>
  )
}

function LeftValley() {
  return (
    <group position={[-8, -0.1, 0]}>
      {/* Rolling green valley ground */}
      <Vox position={[0, -0.1, 0]} args={[30, 0.3, 40]} color="#5cb840" castShadow={false} />
      {/* Gentle hills */}
      <Vox position={[-3, 0.3, -4]} args={[8, 0.8, 6]} color="#58b038" castShadow={false} />
      <Vox position={[-5, 0.5, 4]} args={[6, 1.2, 8]} color="#50a830" castShadow={false} />
      <Vox position={[0, 0.2, 8]} args={[10, 0.6, 6]} color="#5aad38" castShadow={false} />
      <Vox position={[-8, 0.6, -2]} args={[6, 1.4, 10]} color="#4a9e30" castShadow={false} />
      <Vox position={[-6, 0.4, -10]} args={[8, 1.0, 5]} color="#52a835" castShadow={false} />

      {/* Distant tree line (far, small, blueish-green) */}
      {[[-12, -8], [-10, -6], [-8, -5], [-6, -7], [-4, -9], [-11, 3], [-9, 5], [-7, 7], [-5, 6], [-3, 8], [-13, 0], [-11, -2]].map(([x, z], i) => (
        <group key={`ft${i}`} position={[x, 1.2 + Math.sin(i) * 0.3, z]}>
          <Vox position={[0, -0.3, 0]} args={[0.12, 0.6, 0.12]} color="#4a3520" castShadow={false} />
          <Vox position={[0, 0.1, 0]} args={[0.6, 0.5, 0.6]} color="#3a8838" castShadow={false} />
          <Vox position={[0, 0.45, 0]} args={[0.4, 0.35, 0.4]} color="#3a8838" castShadow={false} />
          <Vox position={[0, 0.7, 0]} args={[0.2, 0.25, 0.2]} color="#408838" castShadow={false} />
        </group>
      ))}

      {/* Mid trees (medium distance, richer green) */}
      {[[-5, -3], [-3, 1], [-6, 5], [-4, -6], [-2, 3], [-7, 0], [-1, -1]].map(([x, z], i) => (
        <group key={`mt${i}`} position={[x, 0.8 + Math.sin(i * 2) * 0.3, z]}>
          <Vox position={[0, 0, 0]} args={[0.2, 0.7, 0.2]} color="#604020" castShadow={false} />
          <Vox position={[0, 0.55, 0]} args={[0.9, 0.45, 0.9]} color="#40a040" castShadow={false} />
          <Vox position={[0, 0.9, 0]} args={[0.65, 0.35, 0.65]} color="#48a848" castShadow={false} />
          <Vox position={[0, 1.15, 0]} args={[0.35, 0.25, 0.35]} color="#50b050" castShadow={false} />
        </group>
      ))}

      {/* Near trees (close, detailed, bright green) */}
      {[[-1, -2], [0, 2], [-2, 6], [-1, -5]].map(([x, z], i) => (
        <group key={`nt${i}`} position={[x, 0.5 + Math.sin(i * 3) * 0.2, z]}>
          <Vox position={[0, 0, 0]} args={[0.25, 0.9, 0.25]} color="#705028" castShadow={false} />
          <Vox position={[0, 0.7, 0]} args={[1.1, 0.5, 1.1]} color="#48b048" castShadow={false} />
          <Vox position={[0, 1.1, 0]} args={[0.8, 0.4, 0.8]} color="#50b850" castShadow={false} />
          <Vox position={[0, 1.4, 0]} args={[0.5, 0.3, 0.5]} color="#58c058" castShadow={false} />
          <Vox position={[0, 1.65, 0]} args={[0.25, 0.2, 0.25]} color="#60c860" castShadow={false} />
        </group>
      ))}

      {/* Flowers scattered in valley */}
      {[[0, -1], [-2, 2], [-4, 0], [-1, 4], [-3, -3], [0, 6], [-5, -5]].map(([x, z], i) => {
        const c = ['#ff7088', '#f0d040', '#e070d0', '#80a0ff', '#ff9050'][i % 5]
        return (
          <group key={`vf${i}`} position={[x + Math.sin(i) * 0.5, 0.15, z]}>
            <Vox position={[0, 0, 0]} args={[0.04, 0.12, 0.04]} color="#308020" castShadow={false} />
            <Vox position={[0, 0.1, 0]} args={[0.1, 0.06, 0.1]} color={c} castShadow={false} />
          </group>
        )
      })}

      {/* Distant soft horizon hills */}
      <Vox position={[-14, 1, 0]} args={[8, 2.5, 30]} color="#90b898" castShadow={false} />
      <Vox position={[-16, 1.5, -6]} args={[6, 3.5, 12]} color="#88b090" castShadow={false} />
      <Vox position={[-15, 1.2, 8]} args={[7, 3, 10]} color="#8cb898" castShadow={false} />
    </group>
  )
}

function Outdoor() {
  return (
    <group>
      <Sun />
      <Grass />
      <Fence />
      <Flowers />
      <LeftValley />

      {/* Clouds - spread across sky */}
      <PixelCloud position={[-4, 7, -14]} />
      <PixelCloud position={[5, 8, -16]} />
      <PixelCloud position={[0, 6.5, -12]} />
      <PixelCloud position={[-8, 7.5, -18]} />
      <PixelCloud position={[12, 7, -22]} />
      <PixelCloud position={[-15, 8, -25]} />
      <PixelCloud position={[-10, 6, -10]} />

      {/* Trees behind back wall - near */}
      <PixelTree position={[-6, -0.1, -8]} />
      <PixelTree position={[-3, -0.1, -10]} trunkColor="#704828" leafColor="#38a038" />
      <PixelTree position={[2, -0.1, -9]} leafColor="#48b048" />
      <PixelTree position={[5, -0.1, -7]} trunkColor="#685020" leafColor="#30a030" />
      <PixelTree position={[8, -0.1, -11]} leafColor="#50b850" />

      {/* Trees beside left wall */}
      <PixelTree position={[-7, -0.1, -2]} leafColor="#48b848" />
      <PixelTree position={[-8, -0.1, 1]} trunkColor="#704828" leafColor="#38a038" />
      <PixelTree position={[-9, -0.1, 3]} leafColor="#50b050" />

      {/* Mid-distance trees */}
      <PixelTree position={[-10, -0.1, -12]} leafColor="#38a038" />
      <PixelTree position={[10, -0.1, -13]} leafColor="#48b048" />
      <PixelTree position={[0, -0.1, -15]} trunkColor="#685020" leafColor="#50b850" />
      <PixelTree position={[-5, -0.1, -16]} leafColor="#40a840" />
      <PixelTree position={[7, -0.1, -17]} trunkColor="#704828" leafColor="#38a838" />
      <PixelTree position={[-12, -0.1, -8]} leafColor="#48b048" />
      <PixelTree position={[12, -0.1, -9]} trunkColor="#685020" leafColor="#50b050" />

      {/* Far trees */}
      <PixelTree position={[-8, -0.1, -20]} leafColor="#389030" />
      <PixelTree position={[4, -0.1, -22]} leafColor="#409838" />
      <PixelTree position={[-14, -0.1, -18]} trunkColor="#604020" leafColor="#389030" />
      <PixelTree position={[14, -0.1, -20]} leafColor="#409038" />
      <PixelTree position={[0, -0.1, -24]} trunkColor="#604020" leafColor="#388830" />
      <PixelTree position={[-18, -0.1, -14]} leafColor="#409838" />

      {/* Butterflies */}
      <Butterfly startPos={[-5, 1.5, -6]} />
      <Butterfly startPos={[3, 2, -7]} />
      <Butterfly startPos={[-2, 1.8, -8]} />
      <Butterfly startPos={[-8, 1.2, -5]} />
    </group>
  )
}

export default function Room({ onBookshelfClick, onChestClick, chestOpen, onBookClick, view, onGithubFrameClick, onLinkedinFrameClick, onBack, onCatClick, catRef, onControllerClick, onGameChange, onHeadphonesClick }) {
  return (
    <group>
      <Floor />
      <Walls />
      <Desk />
      <Monitor onClick={onControllerClick} view={view} onGameChange={onGameChange} />
      <DeskItems />
      <Keyboard />
      <Mouse />
      <Chair view={view} />
      <Bookshelf onClick={onBookshelfClick} onBookClick={onBookClick} interactive={view === 'bookshelf'} />
      <Chest onClick={onChestClick} open={chestOpen} />
      <Bed />
      <BedRug />
      <Sofa />
      <Nightstand />
      <CoffeeTable onHeadphonesClick={onHeadphonesClick} />
      <CeilingLamp />
      <FloorLamp />
      <WallClock />
      <Poster />
      <FairyLights />
      <WallShelf />
      <Curtain position={[0, 2, -3.97]} />
      <Curtain position={[-3.97, 2, 0]} rotation={[0, Math.PI / 2, 0]} />
      <Plant position={[-3.3, 0, -1.5]} />
      <Plant position={[1.5, 0, -3.5]} />
      <Rug />
      <LivingRug />
      <CoffeeMug />
      <WallArt onGithubClick={onGithubFrameClick} onLinkedinClick={onLinkedinFrameClick} onBack={onBack} view={view} />
      <Lamp />
      <Cat onClick={onCatClick} catRef={catRef} />
      <Outdoor />
    </group>
  )
}
