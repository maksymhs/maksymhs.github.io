import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import * as THREE from 'three'
import { lang } from '../i18n'
import GameSplash from './GameSplash.jsx'

// === Voxel helper ===
function Vox({ position, args = [1, 1, 1], color, castShadow = false }) {
  return (
    <mesh position={position} castShadow={castShadow} receiveShadow>
      <boxGeometry args={args} />
      <meshLambertMaterial color={color} flatShading />
    </mesh>
  )
}

// === Map constants ===
const WALL_H = 4
const MAP_WALLS = [
  // Outer walls
  { pos: [0, WALL_H / 2, -30], size: [60, WALL_H, 1] },
  { pos: [0, WALL_H / 2, 30], size: [60, WALL_H, 1] },
  { pos: [-30, WALL_H / 2, 0], size: [1, WALL_H, 60] },
  { pos: [30, WALL_H / 2, 0], size: [1, WALL_H, 60] },
  // Mid building (B site area)
  { pos: [10, WALL_H / 2, -10], size: [8, WALL_H, 1] },
  { pos: [14, WALL_H / 2, -6], size: [1, WALL_H, 8] },
  { pos: [6, WALL_H / 2, -6], size: [1, WALL_H, 8] },
  // Long A corridor walls
  { pos: [-10, WALL_H / 2, -5], size: [1, WALL_H, 20] },
  { pos: [-6, WALL_H / 2, -5], size: [1, WALL_H, 20] },
  // Boxes at A site
  { pos: [-15, 1, -20], size: [3, 2, 3] },
  { pos: [-18, 1, -22], size: [2, 2, 2] },
  { pos: [-12, 1.5, -18], size: [2, 3, 2] },
  // Mid corridor
  { pos: [0, WALL_H / 2, 5], size: [8, WALL_H, 1] },
  { pos: [0, WALL_H / 2, -5], size: [4, WALL_H, 1] },
  // T spawn area walls
  { pos: [5, WALL_H / 2, 20], size: [10, WALL_H, 1] },
  { pos: [-5, WALL_H / 2, 20], size: [10, WALL_H, 1] },
  // B tunnel
  { pos: [18, WALL_H / 2, 5], size: [1, WALL_H, 14] },
  { pos: [22, WALL_H / 2, 5], size: [1, WALL_H, 14] },
  // Crates scattered
  { pos: [3, 0.75, 15], size: [1.5, 1.5, 1.5] },
  { pos: [-3, 0.75, 12], size: [1.5, 1.5, 1.5] },
  { pos: [20, 0.75, -15], size: [1.5, 1.5, 1.5] },
  { pos: [20, 2, -15], size: [1.5, 1.5, 1.5] },
  { pos: [-20, 0.75, 10], size: [1.5, 1.5, 1.5] },
  { pos: [-22, 0.75, 8], size: [1.5, 1.5, 1.5] },
  { pos: [8, 0.75, 0], size: [1.5, 1.5, 1.5] },
  // Ramp
  { pos: [-20, 0.5, 0], size: [4, 1, 6] },
  // Pillars
  { pos: [0, WALL_H / 2, 0], size: [1, WALL_H, 1] },
  { pos: [15, WALL_H / 2, 15], size: [1, WALL_H, 1] },
  { pos: [-15, WALL_H / 2, 15], size: [1, WALL_H, 1] },
]

const WALL_COLORS = ['#c8b080', '#b8a070', '#d0b888', '#a89868', '#bca878']

// === Map geometry ===
function DustMap() {
  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshLambertMaterial color="#c8b480" flatShading />
      </mesh>
      {/* Ground detail patches */}
      {[[-10, 0.01, -15], [8, 0.01, 10], [-18, 0.01, 5], [15, 0.01, -5]].map((p, i) => (
        <mesh key={`gp${i}`} rotation={[-Math.PI / 2, 0, 0]} position={p}>
          <planeGeometry args={[6 + i * 2, 6 + i]} />
          <meshLambertMaterial color="#b8a470" flatShading />
        </mesh>
      ))}
      {/* Walls */}
      {MAP_WALLS.map((w, i) => (
        <Vox key={i} position={w.pos} args={w.size} color={WALL_COLORS[i % WALL_COLORS.length]} castShadow />
      ))}
      {/* Sky box - simple dome color */}
      <mesh>
        <sphereGeometry args={[80, 8, 8]} />
        <meshBasicMaterial color="#87ceeb" side={THREE.BackSide} />
      </mesh>
      {/* A site marker */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-15, 0.02, -20]}>
        <circleGeometry args={[3, 8]} />
        <meshBasicMaterial color="#ff4040" transparent opacity={0.3} />
      </mesh>
      {/* B site marker */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10, 0.02, -7]}>
        <circleGeometry args={[3, 8]} />
        <meshBasicMaterial color="#4040ff" transparent opacity={0.3} />
      </mesh>
    </group>
  )
}

// === Weapon Overlay — separate Canvas on top for FPS gun ===
function WeaponGun({ shootFlash }) {
  const ref = useRef()
  const flashRef = useRef()

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    const recoil = shootFlash.current > 0 ? 0.06 : 0
    ref.current.position.set(0.3, -0.25 + Math.cos(t * 2) * 0.004, -0.5 + recoil)
    ref.current.rotation.x = Math.sin(t * 1.5) * 0.003 - recoil * 1.5
    if (flashRef.current) flashRef.current.visible = shootFlash.current > 0.02
    if (shootFlash.current > 0) shootFlash.current -= 0.016
  })

  return (
    <group ref={ref} position={[0.3, -0.25, -0.5]}>
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

function WeaponOverlay({ shootFlash, visible }) {
  if (!visible) return null
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 40 }}>
      <Canvas camera={{ position: [0, 0, 0], fov: 50, near: 0.01 }} gl={{ alpha: true, antialias: false }} style={{ background: 'transparent' }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 3, 1]} intensity={1} />
        <WeaponGun shootFlash={shootFlash} />
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
// Pick a random walkable position on the map
function randomWaypoint() {
  for (let tries = 0; tries < 30; tries++) {
    const x = (Math.random() - 0.5) * 50
    const z = (Math.random() - 0.5) * 50
    if (!isInsideWall(x, z, 0.5)) return { x, z }
  }
  return { x: 0, z: 0 }
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

  // Waypoint AI state stored on data object (mutable)
  if (!data._wp) {
    const wp = randomWaypoint()
    data._wp = { tx: wp.x, tz: wp.z, idle: 0, moveSpeed: 2.5 + Math.random() * 2 }
    data._pos = { x: data.x, z: data.z }
  }

  useFrame((state, delta) => {
    if (!ref.current || !data.alive) return
    const t = state.clock.elapsedTime + data.offset
    const wp = data._wp
    const pos = data._pos

    // Idle pause
    if (wp.idle > 0) {
      wp.idle -= delta
    } else {
      // Walk toward waypoint
      const dxW = wp.tx - pos.x
      const dzW = wp.tz - pos.z
      const distW = Math.sqrt(dxW * dxW + dzW * dzW)

      if (distW < 1.5) {
        // Reached waypoint — pick new one, maybe pause
        const nwp = randomWaypoint()
        wp.tx = nwp.x
        wp.tz = nwp.z
        wp.idle = 0.5 + Math.random() * 2
        wp.moveSpeed = 2 + Math.random() * 2.5
      } else {
        const dirX = dxW / distW
        const dirZ = dzW / distW
        const step = wp.moveSpeed * delta
        let nx = pos.x + dirX * step
        let nz = pos.z + dirZ * step
        let moved = false

        if (!isInsideWall(nx, nz, 0.4)) {
          moved = true
        } else {
          // Try sliding along each axis
          if (!isInsideWall(nx, pos.z, 0.4)) {
            nz = pos.z; moved = true
          } else if (!isInsideWall(pos.x, nz, 0.4)) {
            nx = pos.x; moved = true
          } else {
            // Try perpendicular directions to go around wall
            const perpLX = pos.x + (-dirZ) * step
            const perpLZ = pos.z + (dirX) * step
            const perpRX = pos.x + (dirZ) * step
            const perpRZ = pos.z + (-dirX) * step
            const leftOk = !isInsideWall(perpLX, perpLZ, 0.4)
            const rightOk = !isInsideWall(perpRX, perpRZ, 0.4)
            if (leftOk && rightOk) {
              // Pick the one closer to waypoint
              const dL = (wp.tx - perpLX) ** 2 + (wp.tz - perpLZ) ** 2
              const dR = (wp.tx - perpRX) ** 2 + (wp.tz - perpRZ) ** 2
              if (dL < dR) { nx = perpLX; nz = perpLZ } else { nx = perpRX; nz = perpRZ }
              moved = true
            } else if (leftOk) {
              nx = perpLX; nz = perpLZ; moved = true
            } else if (rightOk) {
              nx = perpRX; nz = perpRZ; moved = true
            }
          }
        }

        if (!moved) {
          // Truly stuck — increment stuck counter, pick new waypoint after a few frames
          wp._stuck = (wp._stuck || 0) + 1
          if (wp._stuck > 10) {
            const nwp = randomWaypoint()
            wp.tx = nwp.x; wp.tz = nwp.z
            wp._stuck = 0
          }
          nx = pos.x; nz = pos.z
        } else {
          wp._stuck = 0
        }

        // Player avoidance
        const cam = state.camera.position
        const dpx = nx - cam.x, dpz = nz - cam.z
        if (dpx * dpx + dpz * dpz < 1.5) {
          nx = pos.x; nz = pos.z
        }

        // Clamp to map bounds
        nx = Math.max(-27, Math.min(27, nx))
        nz = Math.max(-27, Math.min(27, nz))

        pos.x = nx
        pos.z = nz
      }
    }

    ref.current.position.x = pos.x
    ref.current.position.z = pos.z

    // Smooth rotation toward movement direction or toward player when close
    const cam = state.camera.position
    const dToPlayer = Math.sqrt((cam.x - pos.x) ** 2 + (cam.z - pos.z) ** 2)
    let targetAngle
    if (dToPlayer < 15) {
      // Face player when nearby
      targetAngle = Math.atan2(cam.x - pos.x, cam.z - pos.z)
    } else {
      // Face movement direction
      targetAngle = Math.atan2(wp.tx - pos.x, wp.tz - pos.z)
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

// === Wall collision helper ===
function isInsideWall(x, z, radius = 0.4) {
  for (const w of MAP_WALLS) {
    const [wx, wy, wz] = w.pos
    const [sx, sy, sz] = w.size
    const hx = sx / 2 + radius, hz = sz / 2 + radius
    if (x > wx - hx && x < wx + hx && z > wz - hz && z < wz + hz) return true
  }
  return false
}

// === FPS Controller + Game Logic ===
function FPSScene({ onScoreUpdate, onGameOver, gameState, onHit, livesRef, shootFlash }) {
  const { camera, gl } = useThree()
  const controlsRef = useRef()
  const keysRef = useRef({ w: false, a: false, s: false, d: false, crouch: false })
  const shootCooldown = useRef(0)
  const jumpVel = useRef(0)
  const playerY = useRef(1.6)
  const onGround = useRef(true)
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
    for (let i = 0; i < count && i < 10; i++) {
      const sp = randomWaypoint()
      newEnemies.push({
        id: idRef.current++,
        x: sp.x,
        z: sp.z,
        alive: true,
        offset: Math.random() * 10,
        shooting: 0,
        uniform: UNIFORMS[Math.floor(Math.random() * UNIFORMS.length)],
        _wp: null, _pos: null,
      })
    }
    enemiesRef.current = newEnemies
    setEnemies([...newEnemies])
  }, [])

  useEffect(() => {
    if (gameState.current === 'playing') {
      camera.position.set(0, 1.6, 25)
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
      if (e.code === 'Space' && onGround.current) { jumpVel.current = 6; onGround.current = false }
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

    // WASD movement
    const speed = 8 * delta
    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

    let nx = camera.position.x
    let nz = camera.position.z
    if (keysRef.current.w) { nx += forward.x * speed; nz += forward.z * speed }
    if (keysRef.current.s) { nx -= forward.x * speed; nz -= forward.z * speed }
    if (keysRef.current.a) { nx -= right.x * speed; nz -= right.z * speed }
    if (keysRef.current.d) { nx += right.x * speed; nz += right.z * speed }

    // Collision
    if (!isInsideWall(nx, camera.position.z)) camera.position.x = nx
    if (!isInsideWall(camera.position.x, nz)) camera.position.z = nz
    camera.position.x = Math.max(-29, Math.min(29, camera.position.x))
    camera.position.z = Math.max(-29, Math.min(29, camera.position.z))

    // Jump physics
    jumpVel.current -= 15 * delta
    playerY.current += jumpVel.current * delta
    if (playerY.current <= 1.6) {
      playerY.current = 1.6
      jumpVel.current = 0
      onGround.current = true
    }
    // Crouch
    const targetY = keysRef.current.crouch ? 0.9 : playerY.current
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
      <PointerLockControls ref={controlsRef} />
      <ambientLight intensity={0.5} color="#ffe8c0" />
      <directionalLight position={[20, 30, 10]} intensity={1.2} color="#fff0d0" castShadow />
      <directionalLight position={[-10, 15, -5]} intensity={0.3} color="#c0d0ff" />
      <fog attach="fog" args={['#c0b898', 30, 80]} />

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
  }, [])

  const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)

  const texts = {
    title: 'PIXEL STRIKE',
    start: lang === 'es' ? 'CLICK PARA EMPEZAR' : lang === 'ru' ? 'КЛИКНИТЕ ЧТОБЫ НАЧАТЬ' : 'CLICK TO START',
    controls: lang === 'es' ? 'WASD mover, Click disparar, Espacio saltar, Ctrl agacharse, ESC salir' : lang === 'ru' ? 'WASD движение, Клик стрелять, Пробел прыжок, Ctrl присесть, ESC выход' : 'WASD move, Click shoot, Space jump, Ctrl crouch, ESC exit',
    over: lang === 'es' ? '¡ELIMINADO!' : lang === 'ru' ? 'УБИТ!' : 'ELIMINATED!',
    retry: lang === 'es' ? 'Click para reiniciar' : lang === 'ru' ? 'Кликните для рестарта' : 'Click to retry',
    back: lang === 'es' ? '← Volver' : lang === 'ru' ? '← Назад' : '← Back',
    score: lang === 'es' ? 'PUNTOS' : lang === 'ru' ? 'ОЧКИ' : 'SCORE',
    wave: lang === 'es' ? 'OLEADA' : lang === 'ru' ? 'ВОЛНА' : 'WAVE',
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#c0b898', position: 'relative', cursor: started && !gameOver ? 'none' : 'auto' }}>
      <Canvas shadows camera={{ position: [0, 1.6, 25], fov: 75, near: 0.01 }} gl={{ antialias: false }}>
        <color attach="background" args={['#87ceeb']} />
        {started && (
          <FPSScene
            onScoreUpdate={setScore}
            onGameOver={handleGameOver}
            onHit={handleHit}
            gameState={gameState}
            livesRef={livesRef}
            shootFlash={shootFlash}
          />
        )}
      </Canvas>

      {/* Weapon overlay — separate Canvas for FPS gun */}
      <WeaponOverlay shootFlash={shootFlash} visible={started && !gameOver} />

      {/* Crosshair */}
      {started && !gameOver && locked && (
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
          {/* Click to lock pointer hint */}
          {!locked && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Press Start 2P', monospace", fontSize: '12px',
              color: '#fff', textShadow: '2px 2px 0 #000',
              background: 'rgba(0,0,0,0.3)', cursor: 'pointer',
            }}
              onClick={() => document.querySelector('canvas')?.requestPointerLock()}
            >
              {lang === 'es' ? 'CLICK PARA APUNTAR' : lang === 'ru' ? 'КЛИКНИТЕ ДЛЯ ПРИЦЕЛА' : 'CLICK TO AIM'}
            </div>
          )}
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
