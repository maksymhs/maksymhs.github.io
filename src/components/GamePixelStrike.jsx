import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import * as THREE from 'three'
import { lang } from '../i18n'
import GameSplash from './GameSplash.jsx'

// === Voxel helper ===
function Vox({ position, args = [1, 1, 1], color, idx = 0 }) {
  return (
    <mesh position={position}>
      <boxGeometry args={args} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

// === StoneWall — lightweight wall with horizontal stone block lines (max 3 lines) ===
function BrickWall({ position, args = [1, 1, 1], baseColor = '#908870', mortarColor = '#787060' }) {
  const [sx, sy, sz] = args
  const m = 0.035
  // Max 3 horizontal lines evenly spaced
  const count = Math.min(3, Math.max(1, Math.floor(sy / 1.2)))
  const spacing = sy / (count + 1)
  return (
    <group position={position}>
      <mesh><boxGeometry args={args} /><meshBasicMaterial color={baseColor} /></mesh>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} position={[0, -sy / 2 + spacing * (i + 1), 0]}>
          <boxGeometry args={[sx + 0.01, m, sz + 0.01]} />
          <meshBasicMaterial color={mortarColor} />
        </mesh>
      ))}
    </group>
  )
}

// === Crate — wooden box with cross trim ===
function Crate({ position, args = [1, 1, 1], baseColor = '#a08040', trimColor = '#685020' }) {
  const [sx, sy, sz] = args
  const t = 0.04 // trim thickness
  return (
    <group position={position}>
      <mesh><boxGeometry args={args} /><meshBasicMaterial color={baseColor} /></mesh>
      {/* Horizontal bands */}
      <mesh position={[0, sy * 0.3, 0]}><boxGeometry args={[sx + 0.01, t, sz + 0.01]} /><meshBasicMaterial color={trimColor} /></mesh>
      <mesh position={[0, -sy * 0.3, 0]}><boxGeometry args={[sx + 0.01, t, sz + 0.01]} /><meshBasicMaterial color={trimColor} /></mesh>
      {/* Vertical bands on front/back */}
      <mesh position={[0, 0, sz / 2 + 0.005]}><boxGeometry args={[t, sy + 0.01, t]} /><meshBasicMaterial color={trimColor} /></mesh>
      <mesh position={[sx * 0.3, 0, sz / 2 + 0.005]}><boxGeometry args={[t, sy + 0.01, t]} /><meshBasicMaterial color={trimColor} /></mesh>
      <mesh position={[-sx * 0.3, 0, sz / 2 + 0.005]}><boxGeometry args={[t, sy + 0.01, t]} /><meshBasicMaterial color={trimColor} /></mesh>
      {/* Vertical bands on sides */}
      <mesh position={[sx / 2 + 0.005, 0, 0]}><boxGeometry args={[t, sy + 0.01, t]} /><meshBasicMaterial color={trimColor} /></mesh>
      <mesh position={[sx / 2 + 0.005, 0, sz * 0.3]}><boxGeometry args={[t, sy + 0.01, t]} /><meshBasicMaterial color={trimColor} /></mesh>
      <mesh position={[sx / 2 + 0.005, 0, -sz * 0.3]}><boxGeometry args={[t, sy + 0.01, t]} /><meshBasicMaterial color={trimColor} /></mesh>
    </group>
  )
}

// === DUST2 MAP ===
// Orientation: T Spawn south (+Z~35), CT Spawn north (-Z~-35), A Site NW, B Site NE
// Scale: ~80x80 units playable area
const W = 4.5 // wall height
const T = 1   // wall thickness

const MAP_WALLS = [
  // ============ OUTER BOUNDARY ============
  { pos: [0, W/2, -40], size: [82, W, T] },    // north
  { pos: [0, W/2, 40], size: [82, W, T] },     // south
  { pos: [-41, W/2, 0], size: [T, W, 80] },    // west
  { pos: [41, W/2, 0], size: [T, W, 80] },     // east

  // ============ T SPAWN AREA (south, z=28..38) ============
  // T spawn enclosure walls
  { pos: [-12, W/2, 28], size: [T, W, 6] },    // left wall of T area
  { pos: [12, W/2, 30], size: [T, W, 10] },    // right wall of T area
  { pos: [-20, W/2, 25], size: [16, W, T] },   // wall separating T from Long A entrance

  // ============ LONG A (west side, x=-28..-14, z=25..-20) ============
  // Long A corridor — left (west) wall
  { pos: [-30, W/2, 5], size: [T, W, 40] },
  // Long A corridor — right (east) wall, with gap for A cross / pit
  { pos: [-22, W/2, 15], size: [T, W, 20] },   // upper part
  { pos: [-22, W/2, -12], size: [T, W, 16] },  // lower part
  // Long A Doors (iconic double doors)
  { pos: [-26, W/2, 5], size: [T, W, 3] },     // left door panel
  { pos: [-24, W/2, 5], size: [T, W, 3] },     // right door panel
  // Long A corner wall before A site
  { pos: [-26, W/2, -20], size: [8, W, T] },

  // ============ A SITE (NW area, x=-30..-14, z=-20..-32) ============
  // A site back wall (north)
  { pos: [-22, W/2, -32], size: [18, W, T] },
  // A site left wall
  { pos: [-31, W/2, -26], size: [T, W, 12] },
  // A platform (elevated)
  { pos: [-22, 0.5, -26], size: [10, 1, 8] },
  // Goose corner (small wall)
  { pos: [-14, W/2, -30], size: [T, W, 4] },
  // A ramp from CT spawn side
  { pos: [-14, 0.25, -28], size: [4, 0.5, 4] },
  // A site boxes (iconic)
  { pos: [-25, 1, -24], size: [2, 2, 2] },     // default box
  { pos: [-19, 0.75, -22], size: [1.5, 1.5, 1.5] }, // short box
  { pos: [-27, 1.5, -28], size: [2, 3, 2] },   // tall box (headshot)
  // Barrels at A
  { pos: [-17, 0.6, -28], size: [1.2, 1.2, 1.2] },

  // ============ A SHORT / CATWALK (x=-14..-6, z=-10..-24) ============
  // Catwalk left wall
  { pos: [-14, W/2, -15], size: [T, W, 18] },
  // Catwalk right wall
  { pos: [-6, W/2, -17], size: [T, W, 14] },
  // Catwalk elevated floor
  { pos: [-10, 1, -17], size: [8, 2, 14] },
  // Catwalk stairs down to A (step blocks)
  { pos: [-10, 0.75, -24], size: [8, 1.5, 2] },
  { pos: [-10, 0.4, -25.5], size: [8, 0.8, 2] },

  // ============ MID (center, x=-8..8, z=-10..18) ============
  // Mid left wall (toward A short)
  { pos: [-6, W/2, 2], size: [T, W, 24] },     // from T mid to catwalk entrance
  // Mid right wall (toward B)
  { pos: [8, W/2, 2], size: [T, W, 24] },
  // Mid Doors (CT side, z~-8)
  { pos: [-3, W/2, -8], size: [T, W, 4] },     // left mid door
  { pos: [3, W/2, -8], size: [T, W, 4] },      // right mid door
  // Mid boxes for cover
  { pos: [0, 0.75, 0], size: [1.5, 1.5, 1.5] },
  { pos: [4, 0.75, 5], size: [1.5, 1.5, 1.5] },
  { pos: [-3, 0.75, -4], size: [1.5, 1.5, 1.5] },
  // Xbox (the iconic elevated box in mid)
  { pos: [0, 1.5, -5], size: [2, 3, 2] },

  // ============ B TUNNELS (east side, x=12..26, z=10..28) ============
  // Upper tunnel (from T spawn)
  { pos: [12, W/2, 22], size: [T, W, 12] },    // left wall
  { pos: [20, W/2, 22], size: [T, W, 12] },    // right wall
  { pos: [16, W/2, 16], size: [8, W, T] },     // tunnel turn wall
  // Lower tunnel toward B site
  { pos: [20, W/2, 10], size: [T, W, 12] },    // right wall continues
  { pos: [12, W/2, 8], size: [T, W, 8] },      // left wall continues
  // Tunnel ceiling/arch marker boxes
  { pos: [16, 0.75, 20], size: [1.5, 1.5, 1.5] }, // crate in tunnel
  { pos: [14, 0.75, 12], size: [1.5, 1.5, 1.5] }, // crate at tunnel exit

  // ============ B SITE (NE area, x=14..34, z=-8..-28) ============
  // B site enclosure walls
  { pos: [14, W/2, -8], size: [T, W, 8] },     // B entrance left
  { pos: [34, W/2, -18], size: [T, W, 24] },   // B back right wall
  { pos: [24, W/2, -30], size: [20, W, T] },   // B back wall (north)
  { pos: [14, W/2, -22], size: [T, W, 16] },   // B left wall
  // B platform (elevated plant area)
  { pos: [24, 0.5, -20], size: [12, 1, 8] },
  // B Doors / Window
  { pos: [20, W/2, -8], size: [4, W, T] },     // B doors wall (with gap)
  { pos: [30, W/2, -8], size: [8, W, T] },     // B doors wall right part
  // B site boxes
  { pos: [18, 1, -18], size: [2, 2, 2] },      // B default box
  { pos: [28, 0.75, -22], size: [1.5, 1.5, 1.5] }, // back of B box
  { pos: [30, 1.5, -16], size: [2, 3, 2] },    // tall box
  { pos: [22, 0.75, -12], size: [1.5, 1.5, 1.5] }, // close box
  // B barrels
  { pos: [16, 0.6, -14], size: [1.2, 1.2, 1.2] },
  { pos: [32, 0.6, -24], size: [1.2, 1.2, 1.2] },

  // ============ CT SPAWN (north center, x=-10..10, z=-30..-38) ============
  // CT spawn walls
  { pos: [-10, W/2, -32], size: [T, W, 8] },
  { pos: [10, W/2, -32], size: [T, W, 8] },
  { pos: [0, W/2, -36], size: [20, W, T] },
  // CT to A connector
  { pos: [-12, W/2, -32], size: [4, W, T] },
  // CT to B connector
  { pos: [12, W/2, -30], size: [4, W, T] },
  // CT boxes
  { pos: [-5, 0.75, -34], size: [1.5, 1.5, 1.5] },
  { pos: [5, 0.75, -33], size: [1.5, 1.5, 1.5] },

  // ============ CONNECTOR: MID TO B ============
  { pos: [8, W/2, -4], size: [T, W, 8] },
  { pos: [14, W/2, -4], size: [T, W, 8] },

  // ============ PIT (below A site, x=-30..-22, z=-20..-14) ============
  // Pit walls (lower area near A)
  { pos: [-30, W/2, -14], size: [T, W, 4] },
  { pos: [-22, W/2, -20], size: [T, W, 2] },
]

// Ground height zones — platforms and ramps
const ELEVATED_ZONES = [
  // A platform
  { x: [-27, -17], z: [-30, -22], y: 1 },
  // A ramp (smooth transition from ground to A platform)
  { x: [-16, -12], z: [-30, -26], y: 0.5, ramp: true },
  // Catwalk (elevated walkway)
  { x: [-14, -6], z: [-24, -10], y: 2 },
  // Catwalk stairs step 1
  { x: [-14, -6], z: [-26, -24], y: 1.5, ramp: true },
  // Catwalk stairs step 2
  { x: [-14, -6], z: [-27, -26], y: 0.8, ramp: true },
  // B platform
  { x: [18, 30], z: [-24, -16], y: 1 },
  // B ramp
  { x: [16, 18], z: [-24, -16], y: 0.5, ramp: true },
  // Mid xbox area (small elevation)
  { x: [-1, 3], z: [-7, -3], y: 0 },
]

function getGroundY(x, z, playerFeetY) {
  let maxY = 0
  // Check predefined elevated zones
  for (const zone of ELEVATED_ZONES) {
    if (x >= zone.x[0] && x <= zone.x[1] && z >= zone.z[0] && z <= zone.z[1]) {
      if (zone.y > maxY) maxY = zone.y
    }
  }
  // Check MAP_WALLS as standable surfaces (boxes, crates, platforms)
  // Player can land on top of any wall/box if they are above it
  const radius = 0.35
  for (const w of MAP_WALLS) {
    const [wx, wy, wz] = w.pos
    const [sx, sy, sz] = w.size
    const wallTop = wy + sy / 2
    // Skip tall boundary walls — not climbable
    if (sy >= W && (sx > 40 || sz > 40)) continue
    // Only consider surfaces the player is horizontally overlapping
    const hx = sx / 2 + radius, hz = sz / 2 + radius
    if (x > wx - hx && x < wx + hx && z > wz - hz && z < wz + hz) {
      // Player can stand on this if their feet are coming from above (or stepping up small heights)
      if (playerFeetY !== undefined) {
        // Allow landing from above or stepping up ≤0.6 units
        if (playerFeetY >= wallTop - 0.6 && wallTop > maxY) {
          maxY = wallTop
        }
      } else {
        if (wallTop > maxY) maxY = wallTop
      }
    }
  }
  return maxY
}

// Detect wall type
function getWallType(w) {
  const [sx, sy, sz] = w.size
  if (sx <= 1.3 && sz <= 1.3 && sy <= 1.3) return 'barrel'
  if (sy <= 2 && sx <= 2.5 && sz <= 2.5) return 'crate'
  if (sy === 3 && sx <= 2.5) return 'tallcrate'
  if (sy <= 1.1) return 'platform'
  if (sy <= 2) return 'stairs'
  return 'wall'
}

function getWallColor(i, w) {
  const t = getWallType(w)
  if (t === 'barrel') return '#887858'
  if (t === 'platform') return '#888068'
  if (t === 'stairs') return '#807860'
  return '#908870' // walls
}

// === Map geometry ===
function DustMap() {
  return (
    <group>
      {/* Ground — sandy desert floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[84, 84]} />
        <meshBasicMaterial color="#706848" />
      </mesh>
      {/* Ground tile grid — stone slab pattern */}
      {Array.from({ length: 21 }, (_, i) => {
        const p = -40 + i * 4
        return (
          <React.Fragment key={`g${i}`}>
            <mesh position={[p, 0.005, 0]}><boxGeometry args={[0.06, 0.01, 84]} /><meshBasicMaterial color="#605838" /></mesh>
            <mesh position={[0, 0.005, p]}><boxGeometry args={[84, 0.01, 0.06]} /><meshBasicMaterial color="#605838" /></mesh>
          </React.Fragment>
        )
      })}

      {/* Walls — use type-based coloring, crates get special treatment */}
      {MAP_WALLS.map((w, i) => {
        const t = getWallType(w)
        if (t === 'crate') return <Crate key={i} position={w.pos} args={w.size} baseColor="#b89050" trimColor="#7a5828" />
        if (t === 'tallcrate') return <Crate key={i} position={w.pos} args={w.size} baseColor="#a88040" trimColor="#6a4820" />
        if (t === 'barrel') return (
          <group key={i} position={w.pos}>
            <mesh><boxGeometry args={w.size} /><meshBasicMaterial color="#907848" /></mesh>
            <mesh><boxGeometry args={[w.size[0] + 0.01, 0.04, w.size[2] + 0.01]} /><meshBasicMaterial color="#685030" /></mesh>
            <mesh position={[0, w.size[1] * 0.3, 0]}><boxGeometry args={[w.size[0] + 0.01, 0.04, w.size[2] + 0.01]} /><meshBasicMaterial color="#685030" /></mesh>
            <mesh position={[0, -w.size[1] * 0.3, 0]}><boxGeometry args={[w.size[0] + 0.01, 0.04, w.size[2] + 0.01]} /><meshBasicMaterial color="#685030" /></mesh>
          </group>
        )
        if (t === 'platform') return <BrickWall key={i} position={w.pos} args={w.size} baseColor="#888068" mortarColor="#706850" />
        if (t === 'stairs') return <BrickWall key={i} position={w.pos} args={w.size} baseColor="#807860" mortarColor="#686048" />
        return <BrickWall key={i} position={w.pos} args={w.size} baseColor="#908870" mortarColor="#787060" />
      })}

      {/* Sky dome — smooth desert sky */}
      <mesh>
        <sphereGeometry args={[120, 32, 32]} />
        <meshBasicMaterial color="#b0d4e8" side={THREE.BackSide} />
      </mesh>
      {/* Horizon warm band */}
      <mesh>
        <sphereGeometry args={[119, 32, 16, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45]} />
        <meshBasicMaterial color="#d8d0c0" side={THREE.BackSide} transparent opacity={0.5} />
      </mesh>
      {/* Sun glow */}
      <mesh position={[40, 55, -60]}>
        <sphereGeometry args={[6, 16, 16]} />
        <meshBasicMaterial color="#fff8d0" />
      </mesh>
      {/* Sun halo */}
      <mesh position={[40, 55, -60]}>
        <sphereGeometry args={[12, 16, 16]} />
        <meshBasicMaterial color="#ffeecc" transparent opacity={0.2} />
      </mesh>

      {/* A site marker — painted on platform */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-22, 1.06, -26]}>
        <circleGeometry args={[2.5, 12]} />
        <meshBasicMaterial color="#cc5040" transparent opacity={0.25} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      {/* B site marker — painted on platform */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[24, 1.06, -20]}>
        <circleGeometry args={[2.5, 12]} />
        <meshBasicMaterial color="#4060cc" transparent opacity={0.25} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
    </group>
  )
}

// === Weapon Overlay — separate Canvas on top for FPS gun ===
function WeaponGun({ shootFlash, isMobile }) {
  const ref = useRef()
  const flashRef = useRef()
  const baseX = isMobile ? 0.22 : 0.3
  const baseY = isMobile ? -0.18 : -0.25
  const baseZ = isMobile ? -0.35 : -0.5
  const sc = isMobile ? 1.3 : 1

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    const recoil = shootFlash.current > 0 ? 0.06 : 0
    ref.current.position.set(baseX, baseY + Math.cos(t * 2) * 0.004, baseZ + recoil)
    ref.current.rotation.x = Math.sin(t * 1.5) * 0.003 - recoil * 1.5
    if (flashRef.current) flashRef.current.visible = shootFlash.current > 0.02
    if (shootFlash.current > 0) shootFlash.current -= 0.016
  })

  return (
    <group ref={ref} position={[baseX, baseY, baseZ]} scale={[sc, sc, sc]}>
      <mesh position={[0, 0, 0]}><boxGeometry args={[0.07, 0.09, 0.45]} /><meshLambertMaterial color="#3a3a3a" /></mesh>
      <mesh position={[0, 0.02, -0.3]}><boxGeometry args={[0.035, 0.035, 0.25]} /><meshLambertMaterial color="#4a4a4a" /></mesh>
      <mesh position={[0, 0.05, -0.42]}><boxGeometry args={[0.02, 0.04, 0.02]} /><meshLambertMaterial color="#333" /></mesh>
      <mesh position={[0, 0.06, -0.05]}><boxGeometry args={[0.04, 0.03, 0.02]} /><meshLambertMaterial color="#333" /></mesh>
      <mesh position={[0, -0.01, 0.28]}><boxGeometry args={[0.06, 0.07, 0.18]} /><meshLambertMaterial color="#6a4830" /></mesh>
      <mesh position={[0, -0.04, 0.38]}><boxGeometry args={[0.05, 0.12, 0.06]} /><meshLambertMaterial color="#6a4830" /></mesh>
      <mesh position={[0, -0.08, 0.08]}><boxGeometry args={[0.05, 0.12, 0.07]} /><meshLambertMaterial color="#5a3820" /></mesh>
      <mesh position={[0, -0.05, -0.15]}><boxGeometry args={[0.04, 0.07, 0.1]} /><meshLambertMaterial color="#6a4830" /></mesh>
      <mesh position={[0, -0.1, -0.02]}><boxGeometry args={[0.045, 0.1, 0.06]} /><meshLambertMaterial color="#2a2a2a" /></mesh>
      <mesh position={[0, -0.04, -0.18]}><boxGeometry args={[0.08, 0.08, 0.08]} /><meshLambertMaterial color="#f5dcc0" /></mesh>
      <mesh position={[0, -0.07, 0.1]}><boxGeometry args={[0.08, 0.08, 0.08]} /><meshLambertMaterial color="#f5dcc0" /></mesh>
      <mesh ref={flashRef} position={[0, 0.02, -0.46]} visible={false}>
        <boxGeometry args={[0.14, 0.14, 0.06]} />
        <meshBasicMaterial color="#ffcc00" />
      </mesh>
    </group>
  )
}

function WeaponOverlay({ shootFlash, visible, isMobile }) {
  if (!visible) return null
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 40 }}>
      <Canvas camera={{ position: [0, 0, 0], fov: isMobile ? 60 : 50, near: 0.01 }} gl={{ alpha: true, antialias: false }} style={{ background: 'transparent' }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 3, 1]} intensity={1} />
        <WeaponGun shootFlash={shootFlash} isMobile={isMobile} />
      </Canvas>
    </div>
  )
}

// === Uniform color palettes for enemies ===
const UNIFORMS = [
  { shirt: '#5a6848', pocket: '#4e5c3e', collar: '#4e5c3e', pants: '#404838', helmet: '#4a5444' },
  { shirt: '#6a5040', pocket: '#5c4438', collar: '#5c4438', pants: '#4a3828', helmet: '#5a4a3a' },
  { shirt: '#485868', pocket: '#3c4c5c', collar: '#3c4c5c', pants: '#384858', helmet: '#3a4a5a' },
  { shirt: '#686050', pocket: '#5c5444', collar: '#5c5444', pants: '#504838', helmet: '#585040' },
  { shirt: '#585858', pocket: '#4c4c4c', collar: '#4c4c4c', pants: '#3a3a3a', helmet: '#484848' },
  { shirt: '#704838', pocket: '#603828', collar: '#603828', pants: '#503020', helmet: '#604030' },
]

// Gun component removed — replaced by FPSWeapon above

// === Enemy bot — NPC style matching Room.jsx characters ===
// Connected waypoint graph for natural NPC patrol across the full map
// Each waypoint: { x, z, y (ground height), edges: [indices of connected waypoints] }
const NAV_NODES = [
  // T Spawn (0-3)
  { x: 0, z: 34, y: 0 },        // 0 T spawn center
  { x: -6, z: 32, y: 0 },       // 1 T spawn left
  { x: 6, z: 32, y: 0 },        // 2 T spawn right
  { x: 0, z: 28, y: 0 },        // 3 T spawn exit
  // Long A corridor (4-9)
  { x: -15, z: 25, y: 0 },      // 4 Long A entrance from T
  { x: -26, z: 20, y: 0 },      // 5 Long A upper
  { x: -26, z: 10, y: 0 },      // 6 Long A mid
  { x: -26, z: 0, y: 0 },       // 7 Long A doors area
  { x: -26, z: -10, y: 0 },     // 8 Long A lower
  { x: -26, z: -18, y: 0 },     // 9 Long A corner before A site
  // A site (10-14)
  { x: -22, z: -24, y: 1 },     // 10 A site platform center
  { x: -25, z: -26, y: 1 },     // 11 A site back
  { x: -18, z: -22, y: 1 },     // 12 A site front
  { x: -14, z: -28, y: 0.5 },   // 13 A ramp
  { x: -27, z: -28, y: 1 },     // 14 A tall box area
  // Catwalk / A short (15-17)
  { x: -10, z: -12, y: 2 },     // 15 Catwalk upper
  { x: -10, z: -18, y: 2 },     // 16 Catwalk mid
  { x: -10, z: -23, y: 1.5 },   // 17 Catwalk stairs down to A
  // Mid (18-23)
  { x: -3, z: 14, y: 0 },       // 18 T to mid entrance
  { x: 0, z: 10, y: 0 },        // 19 Mid upper
  { x: 0, z: 5, y: 0 },         // 20 Mid center
  { x: 0, z: 0, y: 0 },         // 21 Mid lower
  { x: 0, z: -5, y: 0 },        // 22 Mid xbox area
  { x: 3, z: -8, y: 0 },        // 23 Mid doors (CT side)
  // B tunnels (24-27)
  { x: 12, z: 26, y: 0 },       // 24 B tunnel entrance from T
  { x: 16, z: 22, y: 0 },       // 25 B upper tunnel
  { x: 16, z: 14, y: 0 },       // 26 B lower tunnel
  { x: 16, z: 6, y: 0 },        // 27 B tunnel exit
  // B site (28-32)
  { x: 20, z: -10, y: 0 },      // 28 B entrance
  { x: 18, z: -16, y: 0 },      // 29 B close
  { x: 24, z: -18, y: 1 },      // 30 B platform center
  { x: 28, z: -20, y: 1 },      // 31 B platform back
  { x: 30, z: -16, y: 0 },      // 32 B tall box side
  // CT spawn (33-36)
  { x: 0, z: -33, y: 0 },       // 33 CT center
  { x: -5, z: -34, y: 0 },      // 34 CT left
  { x: 5, z: -33, y: 0 },       // 35 CT right
  { x: 0, z: -30, y: 0 },       // 36 CT exit toward mid
  // Connector mid to B (37-38)
  { x: 11, z: -2, y: 0 },       // 37 Connector entrance
  { x: 11, z: -6, y: 0 },       // 38 Connector exit to B
  // Extra: transitions (39-42)
  { x: -6, z: -10, y: 0 },      // 39 Mid to catwalk entrance
  { x: -14, z: -20, y: 0 },     // 40 Below catwalk (ground level)
  { x: 8, z: 22, y: 0 },        // 41 T toward B tunnel split
  { x: -10, z: 25, y: 0 },      // 42 T toward Long A split
]

// Edge connections — bidirectional
const NAV_EDGES = [
  // T Spawn internal
  [0,1],[0,2],[0,3],[1,3],[2,3],
  // T Spawn exits
  [3,18],[3,42],[3,41],[2,41],
  // T to Long A
  [42,4],[4,5],[5,6],[6,7],[7,8],[8,9],
  // Long A to A site
  [9,13],[13,10],[13,12],[10,11],[10,12],[11,14],[10,14],
  // Catwalk
  [39,15],[15,16],[16,17],[17,12],[17,10],
  // Mid to Catwalk entrance
  [21,39],[22,39],
  // A site to CT
  [12,40],[40,33],[40,34],
  // Mid chain
  [18,19],[19,20],[20,21],[21,22],[22,23],
  // Mid to CT
  [23,36],[36,33],[36,34],[36,35],[33,34],[33,35],
  // T to B tunnels
  [41,24],[24,25],[25,26],[26,27],
  // B tunnel to B site
  [27,28],[28,29],[29,30],[30,31],[31,32],[29,32],[28,37],
  // Connector mid to B
  [20,37],[37,38],[38,28],
  // CT to B
  [35,38],[35,28],
]

// Build adjacency list
const NAV_ADJ = NAV_NODES.map(() => [])
for (const [a, b] of NAV_EDGES) {
  NAV_ADJ[a].push(b)
  NAV_ADJ[b].push(a)
}

// BFS to find path between two node indices
function navFindPath(fromIdx, toIdx) {
  if (fromIdx === toIdx) return [toIdx]
  const visited = new Set([fromIdx])
  const queue = [[fromIdx]]
  while (queue.length > 0) {
    const path = queue.shift()
    const curr = path[path.length - 1]
    for (const nb of NAV_ADJ[curr]) {
      if (nb === toIdx) return [...path, nb]
      if (!visited.has(nb)) {
        visited.add(nb)
        queue.push([...path, nb])
      }
    }
  }
  return null // no path
}

// Find nearest nav node to a position
function nearestNavNode(x, z) {
  let best = 0, bestD = Infinity
  for (let i = 0; i < NAV_NODES.length; i++) {
    const dx = NAV_NODES[i].x - x, dz = NAV_NODES[i].z - z
    const d = dx * dx + dz * dz
    if (d < bestD) { bestD = d; best = i }
  }
  return best
}

function randomNavNode() {
  return Math.floor(Math.random() * NAV_NODES.length)
}

function Enemy({ data }) {
  const ref = useRef()
  const flashRef = useRef()
  const legLRef = useRef()
  const legRRef = useRef()
  const bodyRef = useRef()
  const headRef = useRef()
  const armLRef = useRef()
  const armRRef = useRef()
  const prevPos = useRef({ x: data.x, z: data.z })
  const facingAngle = useRef(0)
  const u = data.uniform || UNIFORMS[0]

  // Nav AI state stored on data object (mutable)
  if (!data._ai) {
    const startNode = nearestNavNode(data.x, data.z)
    const goalNode = randomNavNode()
    const path = navFindPath(startNode, goalNode) || [startNode]
    data._ai = {
      path: path,
      pathIdx: 0,
      idle: 0,
      moveSpeed: 3 + Math.random() * 1.5,
      jumpVel: 0,
      feetY: 0,
      onGround: true,
      stuck: 0,
      runMode: Math.random() < 0.3, // 30% chance to run faster
    }
    data._pos = { x: data.x, z: data.z }
  }

  useFrame((state, delta) => {
    if (!ref.current || !data.alive) return
    const t = state.clock.elapsedTime + data.offset
    const ai = data._ai
    const pos = data._pos

    // NPC jump physics
    const GRAVITY = 15
    if (!ai.onGround) {
      ai.jumpVel -= GRAVITY * delta
      ai.feetY += ai.jumpVel * delta
    }
    const groundY = getGroundY(pos.x, pos.z, ai.feetY)
    if (ai.feetY <= groundY) {
      ai.feetY = groundY
      ai.jumpVel = 0
      ai.onGround = true
    }
    if (ai.onGround) {
      // Smooth step to ground level
      ai.feetY += (groundY - ai.feetY) * 0.3
    }

    // Idle pause
    if (ai.idle > 0) {
      ai.idle -= delta
    } else {
      // Get current target waypoint from path
      if (ai.pathIdx >= ai.path.length) {
        // Reached end of path — pick a new distant destination
        const curNode = nearestNavNode(pos.x, pos.z)
        let goalNode
        // Pick a goal at least 5 hops away for longer patrols
        for (let attempt = 0; attempt < 10; attempt++) {
          goalNode = randomNavNode()
          const p = navFindPath(curNode, goalNode)
          if (p && p.length >= 4) break
        }
        const path = navFindPath(curNode, goalNode != null ? goalNode : randomNavNode())
        ai.path = path || [curNode]
        ai.pathIdx = 0
        ai.idle = 0.3 + Math.random() * 1.0
        ai.moveSpeed = ai.runMode ? (4 + Math.random() * 2) : (2.5 + Math.random() * 1.5)
        ai.runMode = Math.random() < 0.3
      } else {
        const targetNode = NAV_NODES[ai.path[ai.pathIdx]]
        const tx = targetNode.x, tz = targetNode.z, ty = targetNode.y || 0

        const dxW = tx - pos.x
        const dzW = tz - pos.z
        const distW = Math.sqrt(dxW * dxW + dzW * dzW)

        if (distW < 1.8) {
          // Reached this waypoint — advance to next
          ai.pathIdx++
          // Short pause at some waypoints (20% chance)
          if (Math.random() < 0.2) {
            ai.idle = 0.3 + Math.random() * 0.8
          }
        } else {
          const dirX = dxW / distW
          const dirZ = dzW / distW
          const step = ai.moveSpeed * delta
          let nx = pos.x + dirX * step
          let nz = pos.z + dirZ * step

          // Jump if target is elevated and NPC is on ground
          if (ai.onGround && ty > ai.feetY + 0.3) {
            ai.jumpVel = 7
            ai.onGround = false
          }

          // Resolve collision using NPC feet height
          const [rx, rz] = resolveCollision(nx, nz, 0.4, ai.feetY)
          const didMove = Math.abs(rx - pos.x) > 0.001 || Math.abs(rz - pos.z) > 0.001
          nx = rx; nz = rz

          if (!didMove) {
            ai.stuck++
            // If stuck, try jumping over obstacle
            if (ai.stuck > 8 && ai.onGround) {
              ai.jumpVel = 7
              ai.onGround = false
              ai.stuck = 0
            }
            if (ai.stuck > 20) {
              // Really stuck — skip to next waypoint
              ai.pathIdx++
              ai.stuck = 0
            }
          } else {
            ai.stuck = 0
          }

          // Player avoidance
          const cam = state.camera.position
          const dpx = nx - cam.x, dpz = nz - cam.z
          if (dpx * dpx + dpz * dpz < 1.5) {
            nx = pos.x; nz = pos.z
          }

          // Clamp to map bounds
          nx = Math.max(-39, Math.min(39, nx))
          nz = Math.max(-39, Math.min(39, nz))

          pos.x = nx
          pos.z = nz
        }
      }
    }

    // Set enemy position
    ref.current.position.x = pos.x
    ref.current.position.y = ai.feetY
    ref.current.position.z = pos.z

    // Smooth rotation toward movement direction or toward player when close
    const cam = state.camera.position
    const dToPlayer = Math.sqrt((cam.x - pos.x) ** 2 + (cam.z - pos.z) ** 2)
    const currentTarget = ai.pathIdx < ai.path.length ? NAV_NODES[ai.path[ai.pathIdx]] : null
    let targetAngle
    if (dToPlayer < 15) {
      targetAngle = Math.atan2(cam.x - pos.x, cam.z - pos.z)
    } else if (currentTarget) {
      targetAngle = Math.atan2(currentTarget.x - pos.x, currentTarget.z - pos.z)
    } else {
      targetAngle = facingAngle.current
    }
    // Smooth turn
    let angleDiff = targetAngle - facingAngle.current
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
    facingAngle.current += angleDiff * Math.min(1, 5 * delta)
    ref.current.rotation.y = facingAngle.current

    // Walking animation
    const dx = pos.x - prevPos.current.x
    const dz = pos.z - prevPos.current.z
    const moving = Math.sqrt(dx * dx + dz * dz) > 0.001
    prevPos.current.x = pos.x
    prevPos.current.z = pos.z

    const walkCycle = Math.sin(t * 8)
    if (moving) {
      if (legLRef.current) legLRef.current.rotation.x = walkCycle * 0.5
      if (legRRef.current) legRRef.current.rotation.x = -walkCycle * 0.5
      if (bodyRef.current) {
        bodyRef.current.rotation.z = walkCycle * 0.03
        bodyRef.current.position.y = 1.05 + Math.abs(walkCycle) * 0.015
      }
      if (armLRef.current) armLRef.current.rotation.x = -walkCycle * 0.3
    } else {
      if (legLRef.current) legLRef.current.rotation.x *= 0.85
      if (legRRef.current) legRRef.current.rotation.x *= 0.85
      if (bodyRef.current) { bodyRef.current.rotation.z *= 0.9; bodyRef.current.position.y = 1.05 }
      if (armLRef.current) armLRef.current.rotation.x *= 0.85
    }

    // Head tracks player with smooth look
    if (headRef.current) {
      if (dToPlayer < 20) {
        const localAngle = targetAngle - facingAngle.current
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, Math.max(-0.6, Math.min(0.6, localAngle)), 0.1)
      } else {
        headRef.current.rotation.y *= 0.92
      }
      headRef.current.rotation.x = Math.sin(t * 0.7) * 0.04
    }

    // Right arm holds gun — recoil
    if (armRRef.current) {
      armRRef.current.rotation.x = -1.4 + (data.shooting > 0 ? 0.15 : 0)
    }

    if (flashRef.current) flashRef.current.visible = data.shooting > 0
  })

  if (!data.alive) return null

  return (
    <group ref={ref} position={[data.x, 0, data.z]}>
      {/* Legs (pivot flush with torso bottom) */}
      <group ref={legLRef} position={[-0.11, 0.83, 0]}>
        <Vox position={[0, -0.3, 0]} args={[0.18, 0.48, 0.18]} color={u.pants} />
        <Vox position={[0, -0.57, 0.03]} args={[0.2, 0.1, 0.26]} color="#303030" />
      </group>
      <group ref={legRRef} position={[0.11, 0.83, 0]}>
        <Vox position={[0, -0.3, 0]} args={[0.18, 0.48, 0.18]} color={u.pants} />
        <Vox position={[0, -0.57, 0.03]} args={[0.2, 0.1, 0.26]} color="#303030" />
      </group>

      {/* Upper body group */}
      <group ref={bodyRef} position={[0, 1.05, 0]}>
        {/* Torso */}
        <Vox position={[0, 0, 0]} args={[0.5, 0.48, 0.32]} color={u.shirt} />
        {/* Chest pockets */}
        <Vox position={[-0.12, 0.06, 0.165]} args={[0.12, 0.1, 0.01]} color={u.pocket} />
        <Vox position={[0.12, 0.06, 0.165]} args={[0.12, 0.1, 0.01]} color={u.pocket} />
        {/* Belt */}
        <Vox position={[0, -0.22, 0]} args={[0.5, 0.06, 0.34]} color="#3a3020" />
        {/* Collar */}
        <Vox position={[0, 0.22, 0.06]} args={[0.3, 0.06, 0.2]} color={u.collar} />
        {/* Neck */}
        <Vox position={[0, 0.26, 0]} args={[0.16, 0.06, 0.14]} color="#d8b890" />

        {/* Head */}
        <group ref={headRef} position={[0, 0.52, 0]}>
          <Vox position={[0, 0, 0]} args={[0.5, 0.5, 0.5]} color="#d8b890" />
          {/* Helmet */}
          <Vox position={[0, 0.28, 0]} args={[0.54, 0.1, 0.54]} color={u.helmet} />
          <Vox position={[0, 0.2, -0.1]} args={[0.54, 0.28, 0.3]} color={u.helmet} />
          <Vox position={[0, 0.22, 0.1]} args={[0.54, 0.15, 0.1]} color={u.helmet} />
          {/* Eyes */}
          {[-0.12, 0.12].map((x, i) => (
            <group key={i} position={[x, 0.02, 0.26]}>
              <Vox position={[0, 0, 0]} args={[0.12, 0.12, 0.02]} color="#ffffff" />
              <Vox position={[0.01, -0.01, 0.015]} args={[0.07, 0.07, 0.02]} color="#202020" />
              <Vox position={[0.03, 0.03, 0.02]} args={[0.03, 0.03, 0.01]} color="#ffffff" />
            </group>
          ))}
          {/* Eyebrows */}
          <Vox position={[-0.12, 0.1, 0.26]} args={[0.12, 0.03, 0.02]} color="#2a2a2a" />
          <Vox position={[0.12, 0.1, 0.26]} args={[0.12, 0.03, 0.02]} color="#2a2a2a" />
          {/* Nose */}
          <Vox position={[0, -0.04, 0.27]} args={[0.06, 0.07, 0.04]} color="#c8a878" />
          {/* Mouth */}
          <Vox position={[0, -0.14, 0.26]} args={[0.12, 0.04, 0.02]} color="#c08070" />
        </group>

        {/* Left arm (idle, swings while walking) */}
        <group ref={armLRef} position={[-0.34, 0.08, 0]}>
          <Vox position={[0, 0, 0]} args={[0.16, 0.36, 0.16]} color={u.shirt} />
          <Vox position={[0, -0.22, 0]} args={[0.12, 0.12, 0.12]} color="#d8b890" />
        </group>

        {/* Right arm (holds gun, pivots to aim forward) */}
        <group ref={armRRef} position={[0.34, 0.08, 0]} rotation={[-1.4, 0, 0]}>
          <Vox position={[0, 0, 0]} args={[0.16, 0.36, 0.16]} color={u.shirt} />
          <Vox position={[0, -0.22, 0]} args={[0.12, 0.12, 0.12]} color="#d8b890" />
          {/* Gun — AK style */}
          <Vox position={[0, -0.32, -0.02]} args={[0.06, 0.3, 0.08]} color="#444" />
          <Vox position={[0, -0.5, -0.02]} args={[0.04, 0.15, 0.06]} color="#555" />
          <Vox position={[0, -0.22, -0.06]} args={[0.08, 0.06, 0.04]} color="#3a3a3a" />
          {/* Magazine */}
          <Vox position={[0, -0.35, 0.04]} args={[0.04, 0.12, 0.06]} color="#333" />
          {/* Muzzle flash */}
          <mesh ref={flashRef} position={[0, -0.6, -0.02]} visible={false}>
            <boxGeometry args={[0.14, 0.14, 0.06]} />
            <meshBasicMaterial color="#ffcc00" />
          </mesh>
        </group>
      </group>
    </group>
  )
}

// === Enemy bullet tracer ===
function EnemyBullets({ bullets }) {
  return (
    <>
      {bullets.map(b => (
        <mesh key={b.id} position={b.pos}>
          <boxGeometry args={[0.05, 0.05, 0.3]} />
          <meshBasicMaterial color="#ff8800" />
        </mesh>
      ))}
    </>
  )
}

// === Hit marker effect ===
function HitMarkers({ markers }) {
  return (
    <>
      {markers.map(m => (
        <mesh key={m.id} position={m.pos}>
          <boxGeometry args={[0.15, 0.15, 0.15]} />
          <meshBasicMaterial color="#ff0000" transparent opacity={0.8} />
        </mesh>
      ))}
    </>
  )
}

// === Bullet holes ===
function BulletHoles({ holes }) {
  return (
    <>
      {holes.map(h => (
        <mesh key={h.id} position={h.pos} rotation={h.rot || [0, 0, 0]}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <meshBasicMaterial color="#222" />
        </mesh>
      ))}
    </>
  )
}

// === Wall collision helper (height-aware) ===
function isInsideWall(x, z, radius = 0.4, playerFeetY = 0) {
  for (const w of MAP_WALLS) {
    const [wx, wy, wz] = w.pos
    const [sx, sy, sz] = w.size
    const wallTop = wy + sy / 2
    // If player's feet are above the wall top, they are standing on it — no collision
    if (playerFeetY >= wallTop - 0.15) continue
    const hx = sx / 2 + radius, hz = sz / 2 + radius
    if (x > wx - hx && x < wx + hx && z > wz - hz && z < wz + hz) return true
  }
  return false
}

// Resolve position: push player out of any overlapping wall and return corrected [x, z]
function resolveCollision(x, z, radius = 0.4, playerFeetY = 0) {
  let rx = x, rz = z
  for (let iter = 0; iter < 3; iter++) { // iterate to resolve multiple overlaps
    let pushed = false
    for (const w of MAP_WALLS) {
      const [wx, wy, wz] = w.pos
      const [sx, sy, sz] = w.size
      const wallTop = wy + sy / 2
      // If player's feet are above the wall top, they are on it — no collision
      if (playerFeetY >= wallTop - 0.15) continue
      const hx = sx / 2 + radius, hz = sz / 2 + radius
      if (rx > wx - hx && rx < wx + hx && rz > wz - hz && rz < wz + hz) {
        // Find smallest push-out direction
        const pushLeft = (wx - hx) - rx
        const pushRight = (wx + hx) - rx
        const pushUp = (wz - hz) - rz
        const pushDown = (wz + hz) - rz
        const absL = Math.abs(pushLeft), absR = Math.abs(pushRight)
        const absU = Math.abs(pushUp), absD = Math.abs(pushDown)
        const minX = absL < absR ? pushLeft : pushRight
        const minZ = absU < absD ? pushUp : pushDown
        if (Math.abs(minX) < Math.abs(minZ)) {
          rx += minX
        } else {
          rz += minZ
        }
        pushed = true
      }
    }
    if (!pushed) break
  }
  return [rx, rz]
}

// === FPS Controller + Game Logic ===
function FPSScene({ onScoreUpdate, onGameOver, gameState, onHit, livesRef, shootFlash, isMobile, mobileMoveRef, mobileLookRef, mobileShootRef }) {
  const { camera, gl } = useThree()
  const controlsRef = useRef()
  const keysRef = useRef({ w: false, a: false, s: false, d: false, crouch: false })
  const shootCooldown = useRef(0)
  const jumpVel = useRef(0)
  const playerY = useRef(1.6)
  const onGround = useRef(true)
  const mobileYaw = useRef(0)
  const mobilePitch = useRef(0)
  const [enemies, setEnemies] = useState([])
  const enemiesRef = useRef([])
  const [hitMarkers, setHitMarkers] = useState([])
  const [bulletHoles, setBulletHoles] = useState([])
  const [enemyBullets, setEnemyBullets] = useState([])
  const enemyBulletsRef = useRef([])
  const [playerBullets, setPlayerBullets] = useState([])
  const playerBulletsRef = useRef([])
  const enemyShootTimers = useRef({})
  const idRef = useRef(0)
  const waveRef = useRef(1)
  const invincibleRef = useRef(0)
  const damageFlash = useRef(0)

  // Spawn enemies
  const spawnWave = useCallback(() => {
    const count = 3 + waveRef.current * 2
    const newEnemies = []
    // Filter spawn nodes far from player start (0, 34)
    const PLAYER_START_X = 0, PLAYER_START_Z = 34, MIN_SPAWN_DIST = 20
    const farNodes = NAV_NODES.map((n, idx) => ({ n, idx })).filter(({ n }) => {
      const dx = n.x - PLAYER_START_X, dz = n.z - PLAYER_START_Z
      return Math.sqrt(dx * dx + dz * dz) >= MIN_SPAWN_DIST
    })
    for (let i = 0; i < count && i < 10; i++) {
      const pick = farNodes.length > 0 ? farNodes[Math.floor(Math.random() * farNodes.length)] : { n: NAV_NODES[0], idx: 0 }
      const sp = pick.n
      newEnemies.push({
        id: idRef.current++,
        x: sp.x,
        z: sp.z,
        alive: true,
        offset: Math.random() * 10,
        shooting: 0,
        uniform: UNIFORMS[Math.floor(Math.random() * UNIFORMS.length)],
        _ai: null, _pos: null,
      })
    }
    enemiesRef.current = newEnemies
    setEnemies([...newEnemies])
  }, [])

  useEffect(() => {
    if (gameState.current === 'playing') {
      camera.position.set(0, 1.6, 34)
      camera.rotation.set(0, 0, 0)
      waveRef.current = 1
      spawnWave()
    }
  }, [gameState, camera, spawnWave])

  // Key handlers
  useEffect(() => {
    const onDown = (e) => {
      if (e.key === 'w' || e.key === 'ArrowUp') keysRef.current.w = true
      if (e.key === 's' || e.key === 'ArrowDown') keysRef.current.s = true
      if (e.key === 'a' || e.key === 'ArrowLeft') keysRef.current.a = true
      if (e.key === 'd' || e.key === 'ArrowRight') keysRef.current.d = true
      if (e.code === 'Space' && onGround.current) { jumpVel.current = 7.5; onGround.current = false }
      if (e.key === 'Control') keysRef.current.crouch = true
    }
    const onUp = (e) => {
      if (e.key === 'w' || e.key === 'ArrowUp') keysRef.current.w = false
      if (e.key === 's' || e.key === 'ArrowDown') keysRef.current.s = false
      if (e.key === 'a' || e.key === 'ArrowLeft') keysRef.current.a = false
      if (e.key === 'd' || e.key === 'ArrowRight') keysRef.current.d = false
      if (e.key === 'Control') keysRef.current.crouch = false
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [])

  // Shooting — use mousedown on document (pointer lock sends events to document)
  useEffect(() => {
    const onShoot = (e) => {
      if (e.button !== 0) return
      if (!document.pointerLockElement) return
      if (gameState.current !== 'playing') return
      if (shootCooldown.current > 0) return
      shootCooldown.current = 0.15
      shootFlash.current = 0.08

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)
      const dir = raycaster.ray.direction.clone()
      const origin = camera.position.clone()

      // Spawn a visible bullet tracer
      playerBulletsRef.current.push({
        id: idRef.current++,
        pos: [origin.x + dir.x * 0.5, origin.y + dir.y * 0.5 - 0.1, origin.z + dir.z * 0.5],
        dir: [dir.x, dir.y, dir.z],
        life: 1.5,
      })
    }
    document.addEventListener('mousedown', onShoot)
    return () => document.removeEventListener('mousedown', onShoot)
  }, [camera, gameState, shootFlash])

  useFrame((_, delta) => {
    if (gameState.current !== 'playing') return
    shootCooldown.current = Math.max(0, shootCooldown.current - delta)
    if (invincibleRef.current > 0) invincibleRef.current -= delta
    if (damageFlash.current > 0) damageFlash.current -= delta

    // Mobile look — apply touch deltas to camera rotation
    if (isMobile && mobileLookRef.current) {
      const lk = mobileLookRef.current
      mobileYaw.current -= lk.dx * 0.004
      mobilePitch.current -= lk.dy * 0.004
      mobilePitch.current = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, mobilePitch.current))
      camera.rotation.set(mobilePitch.current, mobileYaw.current, 0, 'YXZ')
      lk.dx = 0; lk.dy = 0
    }

    // Mobile shoot
    if (isMobile && mobileShootRef.current && shootCooldown.current <= 0) {
      mobileShootRef.current = false
      shootCooldown.current = 0.15
      shootFlash.current = 0.08
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)
      const dir = raycaster.ray.direction.clone()
      const origin = camera.position.clone()
      playerBulletsRef.current.push({
        id: idRef.current++,
        pos: [origin.x + dir.x * 0.5, origin.y + dir.y * 0.5 - 0.1, origin.z + dir.z * 0.5],
        dir: [dir.x, dir.y, dir.z],
        life: 1.5,
      })
    }

    // Movement
    const speed = 8 * delta
    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

    let nx = camera.position.x
    let nz = camera.position.z

    // Keyboard input
    if (keysRef.current.w) { nx += forward.x * speed; nz += forward.z * speed }
    if (keysRef.current.s) { nx -= forward.x * speed; nz -= forward.z * speed }
    if (keysRef.current.a) { nx -= right.x * speed; nz -= right.z * speed }
    if (keysRef.current.d) { nx += right.x * speed; nz += right.z * speed }

    // Mobile joystick input (1.8x multiplier for snappier feel)
    if (isMobile && mobileMoveRef.current) {
      const mv = mobileMoveRef.current
      const mobileSpeed = speed * 1.8
      nx += (forward.x * mv.y + right.x * mv.x) * mobileSpeed
      nz += (forward.z * mv.y + right.z * mv.x) * mobileSpeed
    }

    // Player feet Y (eye height minus 1.6)
    const eyeHeight = 1.6
    const playerFeetY = playerY.current - eyeHeight

    // Resolve collisions with wall pushback (height-aware)
    const [resolvedX, resolvedZ] = resolveCollision(nx, nz, 0.4, playerFeetY)
    camera.position.x = Math.max(-40, Math.min(40, resolvedX))
    camera.position.z = Math.max(-39, Math.min(39, resolvedZ))

    // Ground Y at final position — pass playerFeetY so we know what surfaces are reachable
    const groundY = getGroundY(camera.position.x, camera.position.z, playerFeetY)

    // Jump physics
    jumpVel.current -= 15 * delta
    playerY.current += jumpVel.current * delta
    const floorY = groundY + eyeHeight
    if (playerY.current <= floorY) {
      playerY.current = floorY
      jumpVel.current = 0
      onGround.current = true
    }
    // Smooth step up/down when walking between levels (not jumping)
    if (onGround.current) {
      const targetFloor = groundY + eyeHeight
      playerY.current += (targetFloor - playerY.current) * 0.25
    }
    // Crouch
    const targetY = keysRef.current.crouch ? playerY.current - 0.7 : playerY.current
    camera.position.y = targetY

    // Update player bullets — check enemy hits and wall collisions
    playerBulletsRef.current = playerBulletsRef.current.filter(b => {
      const speed = 60 * delta
      b.pos[0] += b.dir[0] * speed
      b.pos[1] += b.dir[1] * speed
      b.pos[2] += b.dir[2] * speed
      b.life -= delta
      if (b.life <= 0) return false
      // Wall collision
      if (isInsideWall(b.pos[0], b.pos[2], 0.05)) {
        setBulletHoles(prev => [...prev.slice(-20), { id: idRef.current++, pos: [...b.pos] }])
        return false
      }
      // Enemy hit check
      for (const enemy of enemiesRef.current) {
        if (!enemy.alive || !enemy._pos) continue
        const ex = enemy._pos.x
        const ez = enemy._pos.z
        const dx = b.pos[0] - ex, dz = b.pos[2] - ez
        if (dx * dx + dz * dz < 0.5) {
          enemy.alive = false
          onScoreUpdate(prev => prev + 100)
          setHitMarkers(prev => [...prev.slice(-5), { id: idRef.current++, pos: [ex, 1, ez] }])
          setTimeout(() => setHitMarkers(prev => prev.slice(1)), 300)
          setEnemies([...enemiesRef.current])
          const alive = enemiesRef.current.filter(e => e.alive).length
          if (alive === 0) { waveRef.current += 1; setTimeout(() => spawnWave(), 1500) }
          return false
        }
      }
      return true
    })
    setPlayerBullets(playerBulletsRef.current.map(b => ({ ...b, pos: [...b.pos] })))

    // Enemy shooting AI
    const now = performance.now() / 1000
    for (const enemy of enemiesRef.current) {
      if (!enemy.alive || !enemy._pos) continue
      const ex = enemy._pos.x
      const ez = enemy._pos.z
      const dx = camera.position.x - ex
      const dz = camera.position.z - ez
      const dist = Math.sqrt(dx * dx + dz * dz)

      if (dist < 20) {
        const timer = enemyShootTimers.current[enemy.id] || 0
        if (now - timer > (1.5 + Math.random() * 0.5)) {
          enemyShootTimers.current[enemy.id] = now
          enemy.shooting = 0.1
          // Fire bullet toward player with some inaccuracy
          const spread = 0.15
          const dirX = dx / dist + (Math.random() - 0.5) * spread
          const dirZ = dz / dist + (Math.random() - 0.5) * spread
          enemyBulletsRef.current.push({
            id: idRef.current++,
            pos: [ex, 1.0, ez],
            dir: [dirX, 0, dirZ],
            life: 2,
          })
        }
      }
      if (enemy.shooting > 0) enemy.shooting -= delta
    }

    // Update enemy bullets — wall collision + player hit
    enemyBulletsRef.current = enemyBulletsRef.current.filter(b => {
      b.pos[0] += b.dir[0] * 25 * delta
      b.pos[1] += b.dir[1] * 25 * delta
      b.pos[2] += b.dir[2] * 25 * delta
      b.life -= delta
      if (b.life <= 0) return false
      // Wall collision — bullet stops
      if (isInsideWall(b.pos[0], b.pos[2], 0.05)) return false
      // Check hit on player
      const bx = b.pos[0] - camera.position.x
      const bz = b.pos[2] - camera.position.z
      if (bx * bx + bz * bz < 0.6 && invincibleRef.current <= 0) {
        invincibleRef.current = 1.5
        damageFlash.current = 0.4
        if (livesRef.current <= 1) {
          onGameOver()
        } else {
          onHit()
        }
        return false
      }
      return true
    })
    setEnemyBullets(enemyBulletsRef.current.map(b => ({ ...b, pos: [...b.pos] })))
  })

  return (
    <>
      {!isMobile && <PointerLockControls ref={controlsRef} />}
      <ambientLight intensity={0.85} color="#ffe8c0" />
      <directionalLight position={[20, 30, 10]} intensity={0.8} color="#fff4e0" />
      <directionalLight position={[-10, 15, -5]} intensity={0.35} color="#d0e0ff" />
      <hemisphereLight args={['#90c8e8', '#c8a868', 0.4]} />
      <fog attach="fog" args={['#c8c0a8', 30, 85]} />

      <DustMap />

      {enemies.map(e => (
        <Enemy key={e.id} data={e} />
      ))}
      <HitMarkers markers={hitMarkers} />
      <BulletHoles holes={bulletHoles} />
      <EnemyBullets bullets={enemyBullets} />
      {/* Player bullet tracers */}
      {playerBullets.map(b => (
        <mesh key={b.id} position={b.pos}>
          <boxGeometry args={[0.04, 0.04, 0.25]} />
          <meshBasicMaterial color="#ffdd00" />
        </mesh>
      ))}
    </>
  )
}

// === Mobile Touch Controls — dual joystick layout ===
function MobileControls({ mobileMoveRef, mobileLookRef, mobileShootRef }) {
  const joyLRef = useRef(null)
  const knobLRef = useRef(null)
  const joyRRef = useRef(null)
  const knobRRef = useRef(null)
  const joyLOrigin = useRef({ x: 0, y: 0 })
  const joyROrigin = useRef({ x: 0, y: 0 })
  const touchIdL = useRef(null)
  const touchIdR = useRef(null)

  const KNOB_MAX = 40
  const LOOK_SENS = 5.5

  // --- Left joystick (movement) ---
  const onLStart = useCallback((e) => {
    e.preventDefault()
    const t = e.changedTouches[0]
    touchIdL.current = t.identifier
    const rect = joyLRef.current.getBoundingClientRect()
    joyLOrigin.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  }, [])

  const onLMove = useCallback((e) => {
    e.preventDefault()
    for (const t of e.changedTouches) {
      if (t.identifier === touchIdL.current) {
        let dx = t.clientX - joyLOrigin.current.x
        let dy = t.clientY - joyLOrigin.current.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > KNOB_MAX) { dx = dx / dist * KNOB_MAX; dy = dy / dist * KNOB_MAX }
        if (knobLRef.current) knobLRef.current.style.transform = `translate(${dx}px, ${dy}px)`
        mobileMoveRef.current = { x: dx / KNOB_MAX, y: -dy / KNOB_MAX }
      }
    }
  }, [mobileMoveRef])

  const onLEnd = useCallback((e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === touchIdL.current) {
        touchIdL.current = null
        mobileMoveRef.current = { x: 0, y: 0 }
        if (knobLRef.current) knobLRef.current.style.transform = 'translate(0px, 0px)'
      }
    }
  }, [mobileMoveRef])

  // --- Right joystick (look) ---
  const onRStart = useCallback((e) => {
    e.preventDefault()
    const t = e.changedTouches[0]
    touchIdR.current = t.identifier
    const rect = joyRRef.current.getBoundingClientRect()
    joyROrigin.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
  }, [])

  const onRMove = useCallback((e) => {
    e.preventDefault()
    for (const t of e.changedTouches) {
      if (t.identifier === touchIdR.current) {
        let dx = t.clientX - joyROrigin.current.x
        let dy = t.clientY - joyROrigin.current.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > KNOB_MAX) { dx = dx / dist * KNOB_MAX; dy = dy / dist * KNOB_MAX }
        if (knobRRef.current) knobRRef.current.style.transform = `translate(${dx}px, ${dy}px)`
        mobileLookRef.current.dx += dx / KNOB_MAX * LOOK_SENS
        mobileLookRef.current.dy += dy / KNOB_MAX * LOOK_SENS
      }
    }
  }, [mobileLookRef])

  const onREnd = useCallback((e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === touchIdR.current) {
        touchIdR.current = null
        if (knobRRef.current) knobRRef.current.style.transform = 'translate(0px, 0px)'
      }
    }
  }, [])

  const baseStyle = {
    position: 'absolute', borderRadius: '50%', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none',
  }
  const joyStyle = {
    ...baseStyle, width: '120px', height: '120px',
    background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70,
  }
  const knobStyle = {
    width: '50px', height: '50px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.35)', border: '2px solid rgba(255,255,255,0.5)',
    transition: 'transform 0.05s',
  }

  return (
    <>
      {/* Left joystick — movement */}
      <div ref={joyLRef} onTouchStart={onLStart} onTouchMove={onLMove} onTouchEnd={onLEnd} onTouchCancel={onLEnd}
        style={{ ...joyStyle, left: '25px', bottom: '160px' }}>
        <div ref={knobLRef} style={knobStyle} />
      </div>

      {/* Right joystick — look */}
      <div ref={joyRRef} onTouchStart={onRStart} onTouchMove={onRMove} onTouchEnd={onREnd} onTouchCancel={onREnd}
        style={{ ...joyStyle, right: '25px', bottom: '160px' }}>
        <div ref={knobRRef} style={knobStyle} />
      </div>

      {/* Shoot button — above right joystick */}
      <div
        onTouchStart={(e) => { e.preventDefault(); mobileShootRef.current = true }}
        style={{
          ...baseStyle, right: '35px', bottom: '300px', width: '70px', height: '70px',
          background: 'rgba(255,60,60,0.3)', border: '2px solid rgba(255,60,60,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 75, fontSize: '24px', color: 'rgba(255,255,255,0.8)',
        }}
      >
        🔫
      </div>

      {/* Jump button — above-left of right joystick */}
      <div
        onTouchStart={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' })) }}
        style={{
          ...baseStyle, right: '120px', bottom: '300px', width: '55px', height: '55px',
          background: 'rgba(100,200,255,0.25)', border: '2px solid rgba(100,200,255,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 75, fontSize: '16px', color: 'rgba(255,255,255,0.7)',
        }}
      >
        ⬆
      </div>
    </>
  )
}

const MAX_LIVES = 3

export default function GamePixelStrike() {
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(MAX_LIVES)
  const [gameOver, setGameOver] = useState(false)
  const [started, setStarted] = useState(false)
  const [splashDone, setSplashDone] = useState(false)
  const [locked, setLocked] = useState(false)
  const gameState = useRef('idle')
  const livesRef = useRef(MAX_LIVES)
  const damageOverlay = useRef(0)
  const shootFlash = useRef(0)

  const handleStart = useCallback(() => {
    setScore(0)
    setLives(MAX_LIVES)
    livesRef.current = MAX_LIVES
    setGameOver(false)
    setStarted(true)
    gameState.current = 'playing'
    // Auto-lock pointer on start (desktop)
    setTimeout(() => document.querySelector('canvas')?.requestPointerLock(), 100)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (locked) { setLocked(false); return }
        window.location.href = '/'
        return
      }
      if (!started && splashDone && gameState.current === 'idle') handleStart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [started, splashDone, handleStart, locked])

  useEffect(() => {
    const onChange = () => setLocked(!!document.pointerLockElement)
    document.addEventListener('pointerlockchange', onChange)
    return () => document.removeEventListener('pointerlockchange', onChange)
  }, [])

  const [damageScreen, setDamageScreen] = useState(false)

  const handleHit = useCallback(() => {
    livesRef.current -= 1
    setLives(livesRef.current)
    setDamageScreen(true)
    setTimeout(() => setDamageScreen(false), 300)
  }, [])

  const handleGameOver = useCallback(() => {
    livesRef.current = 0
    setLives(0)
    gameState.current = 'over'
    setGameOver(true)
  }, [])

  const handleRestart = useCallback(() => {
    setScore(0)
    setLives(MAX_LIVES)
    livesRef.current = MAX_LIVES
    setGameOver(false)
    gameState.current = 'playing'
    setTimeout(() => document.querySelector('canvas')?.requestPointerLock(), 100)
  }, [])

  const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  const mobileMoveRef = useRef({ x: 0, y: 0 })
  const mobileLookRef = useRef({ dx: 0, dy: 0 })
  const mobileShootRef = useRef(false)

  const texts = {
    title: 'PIXEL STRIKE',
    start: lang === 'es' ? (isMobile ? 'TOCA PARA EMPEZAR' : 'CLICK PARA EMPEZAR') : lang === 'ru' ? 'КЛИКНИТЕ ЧТОБЫ НАЧАТЬ' : (isMobile ? 'TAP TO START' : 'CLICK TO START'),
    controls: isMobile
      ? (lang === 'es' ? 'Joystick izq. mover, Derecha apuntar y disparar' : lang === 'ru' ? 'Джойстик слева двигаться, справа целиться и стрелять' : 'Left joystick move, Right side aim & shoot')
      : (lang === 'es' ? 'WASD mover, Click disparar, Espacio saltar, Ctrl agacharse, ESC salir' : lang === 'ru' ? 'WASD движение, Клик стрелять, Пробел прыжок, Ctrl присесть, ESC выход' : 'WASD move, Click shoot, Space jump, Ctrl crouch, ESC exit'),
    over: lang === 'es' ? '¡ELIMINADO!' : lang === 'ru' ? 'УБИТ!' : 'ELIMINATED!',
    retry: lang === 'es' ? 'Click para reiniciar' : lang === 'ru' ? 'Кликните для рестарта' : 'Click to retry',
    back: lang === 'es' ? '← Volver' : lang === 'ru' ? '← Назад' : '← Back',
    score: lang === 'es' ? 'PUNTOS' : lang === 'ru' ? 'ОЧКИ' : 'SCORE',
    wave: lang === 'es' ? 'OLEADA' : lang === 'ru' ? 'ВОЛНА' : 'WAVE',
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#c8c0a8', position: 'relative', cursor: started && !gameOver ? 'none' : 'auto' }}>
      <Canvas camera={{ position: [0, 1.6, 34], fov: 75, near: 0.1 }} gl={{ antialias: true, logarithmicDepthBuffer: true }}>
        <color attach="background" args={['#c8c0a8']} />
        {started && (
          <FPSScene
            onScoreUpdate={setScore}
            onGameOver={handleGameOver}
            onHit={handleHit}
            gameState={gameState}
            livesRef={livesRef}
            shootFlash={shootFlash}
            isMobile={isMobile}
            mobileMoveRef={mobileMoveRef}
            mobileLookRef={mobileLookRef}
            mobileShootRef={mobileShootRef}
          />
        )}
      </Canvas>

      {/* Weapon overlay — separate Canvas for FPS gun */}
      <WeaponOverlay shootFlash={shootFlash} visible={started && !gameOver} isMobile={isMobile} />

      {/* Crosshair */}
      {started && !gameOver && (locked || isMobile) && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          pointerEvents: 'none', zIndex: 60,
        }}>
          <div style={{ width: '20px', height: '2px', background: '#0f0', position: 'absolute', top: '-1px', left: '-10px' }} />
          <div style={{ width: '2px', height: '20px', background: '#0f0', position: 'absolute', top: '-10px', left: '-1px' }} />
        </div>
      )}

      {/* Damage red flash overlay */}
      {damageScreen && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,0,0,0.35)', pointerEvents: 'none', zIndex: 50 }} />
      )}

      {/* HUD */}
      {started && !gameOver && (
        <>
          <div style={{
            position: 'absolute', top: '20px', right: '20px',
            fontFamily: "'Press Start 2P', monospace", fontSize: '12px',
            color: '#fff', textShadow: '2px 2px 0 #000',
            textAlign: 'right',
          }}>
            <div>{texts.score}: {score}</div>
            <div style={{ marginTop: '8px', fontSize: '16px', letterSpacing: '4px' }}>
              {Array.from({ length: MAX_LIVES }, (_, i) => (
                <span key={i} style={{ opacity: i < lives ? 1 : 0.2 }}>
                  {i < lives ? '❤️' : '🖤'}
                </span>
              ))}
            </div>
          </div>
          {/* Ammo / crosshair indicator */}
          <div style={{
            position: 'absolute', bottom: '30px', right: '30px',
            fontFamily: "'Press Start 2P', monospace", fontSize: '10px',
            color: '#ffd700', textShadow: '1px 1px 0 #000',
          }}>
            ∞ AMMO
          </div>

          {/* Mobile touch controls */}
          {isMobile && <MobileControls mobileMoveRef={mobileMoveRef} mobileLookRef={mobileLookRef} mobileShootRef={mobileShootRef} />}
        </>
      )}

      {/* Start screen */}
      {!started && splashDone && (
        <div
          onClick={handleStart}
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontFamily: "'Press Start 2P', monospace", color: '#fff',
            background: 'rgba(0,0,0,0.6)',
          }}
        >
          <div style={{ fontSize: isMobile ? '18px' : '28px', color: '#ff4040', textShadow: '3px 3px 0 #000', marginBottom: '30px' }}>
            {texts.title}
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '14px', color: '#fff', animation: 'pulse 1.5s ease-in-out infinite', marginBottom: '20px', textShadow: '2px 2px 0 #000' }}>
            {texts.start}
          </div>
          <div style={{ fontSize: isMobile ? '8px' : '10px', color: '#ccc', textShadow: '1px 1px 0 #000' }}>
            {texts.controls}
          </div>
        </div>
      )}

      {/* Game Over */}
      {gameOver && (
        <div
          onClick={handleRestart}
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontFamily: "'Press Start 2P', monospace",
            background: 'rgba(0,0,0,0.7)',
          }}
        >
          <div style={{ fontSize: isMobile ? '18px' : '28px', color: '#ff4040', textShadow: '3px 3px 0 #000', marginBottom: '20px' }}>
            {texts.over}
          </div>
          <div style={{ fontSize: isMobile ? '14px' : '18px', color: '#ffd700', marginBottom: '30px', textShadow: '2px 2px 0 #000' }}>
            {texts.score}: {score}
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', color: '#fff', animation: 'pulse 1.5s ease-in-out infinite', textShadow: '1px 1px 0 #000' }}>
            {texts.retry}
          </div>
        </div>
      )}

      {/* Back button */}
      <a
        href="/"
        style={{
          position: 'absolute', top: '16px', left: '16px',
          fontFamily: "'Press Start 2P', monospace", fontSize: '11px',
          color: '#fff', textDecoration: 'none',
          padding: '8px 16px', background: 'rgba(30,40,50,0.75)',
          border: '2px solid rgba(255,64,64,0.5)', borderRadius: '6px',
          backdropFilter: 'blur(4px)', letterSpacing: '1px', zIndex: 100,
        }}
      >
        {texts.back}
      </a>

      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      {!splashDone && (
        <GameSplash
          title="PIXEL STRIKE"
          subtitle={lang === 'es' ? '¡Elimina a los enemigos!' : lang === 'ru' ? 'Уничтожь врагов!' : 'Eliminate the enemies!'}
          color="#ff4040"
          onFinish={() => setSplashDone(true)}
        />
      )}
    </div>
  )
}
