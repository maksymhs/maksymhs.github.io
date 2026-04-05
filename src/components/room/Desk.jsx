import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
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

const PROJECTS = [
  { name: 'Algorithm Lab', color: '#34d399', url: 'https://algorithm.maksym.site' },
  { name: 'System Design', color: '#a78bfa', url: 'https://design.maksym.site' },
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

// Rainbow bar colors for sorting viz
const BAR_COLORS  = ['#f87171','#fb923c','#fbbf24','#34d399','#22d3ee','#818cf8','#e879f9']
const BAR_PHASES  = [0, 1.1, 2.3, 0.5, 1.8, 0.9, 2.7]
const BAR_SPEEDS  = [0.9, 1.3, 0.7, 1.5, 1.0, 1.2, 0.8]

// System design pipeline nodes: [x, y, label]
const SD_NODES = [
  [0,      0.21,  'CLIENT'],
  [0,      0.11,  'API'],
  [-0.12,  0.01,  'DB'],
  [0.12,   0.01,  'CACHE'],
]
const SD_EDGES = [[0,1],[1,2],[1,3]]

const CARD_H = 0.575
const CARD_W = 0.435

function Card({ color, children }) {
  return (
    <group>
      <mesh position={[0, 0, -0.004]}>
        <planeGeometry args={[CARD_W, CARD_H]} />
        <meshBasicMaterial color="#000000" opacity={0.4} transparent />
      </mesh>
      <mesh position={[0, 0, -0.003]}>
        <planeGeometry args={[CARD_W - 0.004, CARD_H - 0.004]} />
        <meshBasicMaterial color={color} opacity={0.07} transparent />
      </mesh>
      <mesh position={[0,  CARD_H/2 - 0.001, -0.002]}><planeGeometry args={[CARD_W, 0.004]} /><meshBasicMaterial color={color} opacity={0.95} transparent /></mesh>
      <mesh position={[0, -CARD_H/2 + 0.001, -0.002]}><planeGeometry args={[CARD_W, 0.004]} /><meshBasicMaterial color={color} opacity={0.35} transparent /></mesh>
      <mesh position={[-CARD_W/2 + 0.001, 0, -0.002]}><planeGeometry args={[0.004, CARD_H]} /><meshBasicMaterial color={color} opacity={0.35} transparent /></mesh>
      <mesh position={[ CARD_W/2 - 0.001, 0, -0.002]}><planeGeometry args={[0.004, CARD_H]} /><meshBasicMaterial color={color} opacity={0.35} transparent /></mesh>
      {children}
    </group>
  )
}

function AlgoCard({ hovered }) {
  const barsRef = useRef([])
  const scanRef = useRef()
  const color = '#34d399'
  const BASE_Y = 0.06

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    barsRef.current.forEach((bar, i) => {
      if (!bar) return
      const h = 0.016 + Math.abs(
        Math.sin(t * BAR_SPEEDS[i] + BAR_PHASES[i]) * 0.10 +
        Math.sin(t * BAR_SPEEDS[i] * 0.4 + i) * 0.04
      )
      bar.scale.y = h / 0.016
      bar.position.y = BASE_Y + h / 2
      bar.material.opacity = hovered ? 1.0 : 0.8
    })
    if (scanRef.current) {
      const sweep = (t % 2.5) / 2.5
      scanRef.current.position.x = -0.155 + sweep * 0.31
      scanRef.current.material.opacity = hovered
        ? 0.6 - Math.abs(sweep - 0.5)
        : 0.3 - Math.abs(sweep - 0.5) * 0.5
    }
  })

  return (
    <Card color={color}>
      {/* baseline */}
      <mesh position={[0, BASE_Y, 0.001]}><planeGeometry args={[0.38, 0.002]} /><meshBasicMaterial color={color} opacity={0.3} transparent /></mesh>
      {/* bars */}
      {BAR_COLORS.map((c, i) => (
        <mesh key={i} ref={el => barsRef.current[i] = el} position={[-0.126 + i * 0.042, BASE_Y, 0.001]}>
          <planeGeometry args={[0.030, 0.016]} />
          <meshBasicMaterial color={c} transparent opacity={0.8} />
        </mesh>
      ))}
      {/* scan highlight */}
      <mesh ref={scanRef} position={[0, BASE_Y + 0.07, 0.002]}>
        <planeGeometry args={[0.004, 0.18]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
      </mesh>
      {/* separator */}
      <mesh position={[0, -0.04, 0.001]}><planeGeometry args={[0.38, 0.0015]} /><meshBasicMaterial color={color} opacity={0.2} transparent /></mesh>
      {/* title */}
      <Text position={[0, -0.13, 0.001]} fontSize={0.036} color={color} anchorX="center" anchorY="middle" font="/fonts/PressStart2P-Regular.ttf" maxWidth={0.4} lineHeight={1.5}>
        {'ALGORITHM\nLAB'}
      </Text>
      {/* cta */}
      <Text position={[0, -0.245, 0.001]} fontSize={0.014} color={hovered ? color : '#ffffff'} anchorX="center" anchorY="middle" font="/fonts/PressStart2P-Regular.ttf" fillOpacity={hovered ? 1 : 0.3}>
        {hovered ? '[ OPEN → ]' : '· · ·'}
      </Text>
    </Card>
  )
}

function DesignCard({ hovered }) {
  const nodesRef  = useRef([])
  const edgesRef  = useRef([])
  const dot1Ref   = useRef()
  const dot2Ref   = useRef()
  const color = '#a78bfa'
  // cycle: 0-0.9 CLIENT→API, 0.9-1.8 API→DB+CACHE, 1.8-2.5 pause
  const CYCLE = 2.5

  useFrame(({ clock }) => {
    const t    = clock.elapsedTime
    const c    = t % CYCLE
    const [cx0,cy0] = SD_NODES[0]
    const [cx1,cy1] = SD_NODES[1]
    const [cx2,cy2] = SD_NODES[2]
    const [cx3,cy3] = SD_NODES[3]

    // --- dot1: CLIENT→API then API→DB ---
    if (dot1Ref.current) {
      if (c < 0.9) {
        const p = c / 0.9
        dot1Ref.current.position.set(cx0+(cx1-cx0)*p, cy0+(cy1-cy0)*p, 0.002)
        dot1Ref.current.visible = true
      } else if (c < 1.8) {
        const p = (c-0.9)/0.9
        dot1Ref.current.position.set(cx1+(cx2-cx1)*p, cy1+(cy2-cy1)*p, 0.002)
        dot1Ref.current.visible = true
      } else {
        dot1Ref.current.visible = false
      }
    }
    // --- dot2: API→CACHE (starts when dot1 reaches API) ---
    if (dot2Ref.current) {
      if (c >= 0.9 && c < 1.8) {
        const p = (c-0.9)/0.9
        dot2Ref.current.position.set(cx1+(cx3-cx1)*p, cy1+(cy3-cy1)*p, 0.002)
        dot2Ref.current.visible = true
      } else {
        dot2Ref.current.visible = false
      }
    }
    // --- node glow: flashes when packet arrives ---
    const arrivals = [0, 0.9, 1.8, 1.8] // CLIENT, API, DB, CACHE arrival times
    nodesRef.current.forEach((mesh, i) => {
      if (!mesh) return
      const dist = Math.abs((c - arrivals[i] + CYCLE) % CYCLE)
      const flash = Math.max(0, 1 - dist * 5)
      mesh.material.opacity = (hovered ? 0.3 : 0.15) + flash * 0.6
    })
    // --- edge brightness follows packet ---
    edgesRef.current.forEach((mesh, i) => {
      if (!mesh) return
      // edge 0: CLIENT→API active 0-0.9, edge 1: API→DB 0.9-1.8, edge 2: API→CACHE 0.9-1.8
      const starts = [0, 0.9, 0.9]
      const ends   = [0.9, 1.8, 1.8]
      const active = c >= starts[i] && c < ends[i]
        ? (c - starts[i]) / (ends[i] - starts[i])
        : 0
      mesh.material.opacity = (hovered ? 0.2 : 0.1) + active * 0.5
    })
  })

  return (
    <Card color={color}>
      {/* edges */}
      {SD_EDGES.map(([a, b], i) => {
        const [ax, ay] = SD_NODES[a]
        const [bx, by] = SD_NODES[b]
        const len   = Math.sqrt((bx-ax)**2 + (by-ay)**2)
        const angle = Math.atan2(by-ay, bx-ax)
        return (
          <mesh key={i} ref={el => edgesRef.current[i] = el}
            position={[(ax+bx)/2, (ay+by)/2, 0.001]} rotation={[0,0,angle]}>
            <planeGeometry args={[len - 0.035, 0.005]} />
            <meshBasicMaterial color={color} opacity={0.15} transparent />
          </mesh>
        )
      })}
      {/* nodes */}
      {SD_NODES.map(([nx, ny, label], i) => (
        <group key={i} position={[nx, ny, 0.001]}>
          <mesh position={[0, 0, -0.001]}>
            <planeGeometry args={[0.115, 0.038]} />
            <meshBasicMaterial color={color} transparent opacity={0.1} />
          </mesh>
          <mesh ref={el => nodesRef.current[i] = el}>
            <planeGeometry args={[0.11, 0.034]} />
            <meshBasicMaterial color={color} transparent opacity={0.18} />
          </mesh>
          <Text position={[0, 0, 0.002]} fontSize={0.013} color={color} anchorX="center" anchorY="middle" font="/fonts/PressStart2P-Regular.ttf">
            {label}
          </Text>
        </group>
      ))}
      {/* traveling packets */}
      <mesh ref={dot1Ref} position={[0, 0, 0.002]}>
        <planeGeometry args={[0.018, 0.018]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>
      <mesh ref={dot2Ref} position={[0, 0, 0.002]}>
        <planeGeometry args={[0.018, 0.018]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>
      {/* separator */}
      <mesh position={[0, -0.04, 0.001]}><planeGeometry args={[0.38, 0.0015]} /><meshBasicMaterial color={color} opacity={0.2} transparent /></mesh>
      {/* title */}
      <Text position={[0, -0.13, 0.001]} fontSize={0.036} color={color} anchorX="center" anchorY="middle" font="/fonts/PressStart2P-Regular.ttf" maxWidth={0.4} lineHeight={1.5}>
        {'SYSTEM\nDESIGN'}
      </Text>
      {/* cta */}
      <Text position={[0, -0.245, 0.001]} fontSize={0.014} color={hovered ? color : '#ffffff'} anchorX="center" anchorY="middle" font="/fonts/PressStart2P-Regular.ttf" fillOpacity={hovered ? 1 : 0.3}>
        {hovered ? '[ OPEN → ]' : '· · ·'}
      </Text>
    </Card>
  )
}

export function Monitor({ onClick, view }) {
  const screenRef = useRef()
  const [hoverLeft, setHoverLeft] = useState(false)
  const [hoverRight, setHoverRight] = useState(false)
  const isMonitorView = view === 'controller'

  useFrame((state) => {
    if (screenRef.current) {
      const t = state.clock.elapsedTime
      screenRef.current.material.emissiveIntensity = 0.3 + Math.sin(t * 2) * 0.08
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
        <meshLambertMaterial color="#080810" emissive="#1020a0" emissiveIntensity={0.2} flatShading />
      </mesh>
      {/* Project cards — always visible */}
      <group position={[0, 0.4, 0.18]}>
          {/* Scanlines */}
          {Array.from({ length: 18 }).map((_, i) => (
            <mesh key={`sl${i}`} position={[0, 0.29 - i * 0.034, 0.001]}>
              <planeGeometry args={[0.93, 0.002]} />
              <meshBasicMaterial color="#000000" opacity={0.10} transparent />
            </mesh>
          ))}

          {/* Algorithm Lab card — left */}
          <group
            position={[-0.236, 0, 0]}
            {...(isMonitorView && {
              onClick: (e) => { e.stopPropagation(); window.open(PROJECTS[0].url, '_blank') },
              onPointerOver: (e) => { e.stopPropagation(); setHoverLeft(true); document.body.style.cursor = 'pointer' },
              onPointerOut: () => { setHoverLeft(false); document.body.style.cursor = 'auto' },
            })}
          >
            <AlgoCard hovered={hoverLeft} />
          </group>

          {/* Divider */}
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[0.003, 0.575]} />
            <meshBasicMaterial color="#ffffff" opacity={0.06} transparent />
          </mesh>

          {/* System Design card — right */}
          <group
            position={[0.236, 0, 0]}
            {...(isMonitorView && {
              onClick: (e) => { e.stopPropagation(); window.open(PROJECTS[1].url, '_blank') },
              onPointerOver: (e) => { e.stopPropagation(); setHoverRight(true); document.body.style.cursor = 'pointer' },
              onPointerOut: () => { setHoverRight(false); document.body.style.cursor = 'auto' },
            })}
          >
            <DesignCard hovered={hoverRight} />
          </group>
        </group>

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
