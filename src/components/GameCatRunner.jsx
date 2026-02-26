import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { lang } from '../i18n'
import GameSplash from './GameSplash.jsx'

const LANE_COUNT = 3
const LANE_WIDTH = 2.5
const SPEED_BASE = 14
const SPAWN_INTERVAL = 0.8

// === Voxel helpers (same style as Room.jsx) ===
function Vox({ position, args = [1, 1, 1], color }) {
  return (
    <mesh position={position}>
      <boxGeometry args={args} />
      <meshLambertMaterial color={color} flatShading />
    </mesh>
  )
}

// === Cat model from Room.jsx — scaled up 3x for game visibility ===
function RunnerCat({ laneRef, jumpRef, invincibleRef }) {
  const groupRef = useRef()
  const targetX = useRef(0)
  const legsRef = useRef({ fl: null, fr: null, bl: null, br: null })
  const S = 3

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const tx = (laneRef.current - 1) * LANE_WIDTH
    targetX.current += (tx - targetX.current) * 8 * delta
    groupRef.current.position.x = targetX.current

    const t = state.clock.elapsedTime
    const j = jumpRef.current

    // Jump physics
    if (j.active) {
      j.vy -= 30 * delta
      j.y += j.vy * delta
      if (j.y <= 0) { j.y = 0; j.active = false; j.vy = 0 }
    }

    // Run animation (legs tuck when airborne)
    const airborne = j.y > 0.5
    const legSwing = airborne ? 0.6 : Math.sin(t * 14) * 0.5
    const { fl, fr, bl, br } = legsRef.current
    if (airborne) {
      if (fl) fl.rotation.x = -0.6
      if (fr) fr.rotation.x = -0.6
      if (bl) bl.rotation.x = 0.5
      if (br) br.rotation.x = 0.5
    } else {
      if (fl) fl.rotation.x = legSwing
      if (fr) fr.rotation.x = -legSwing
      if (bl) bl.rotation.x = -legSwing
      if (br) br.rotation.x = legSwing
    }

    // Tail wag
    groupRef.current.children.forEach(c => {
      if (c.userData?.isTail) c.rotation.y = Math.sin(t * 8) * 0.4
    })

    // Position Y = jump height + run bounce
    const runBounce = airborne ? 0 : Math.abs(Math.sin(t * 14)) * 0.08 * S
    groupRef.current.position.y = j.y + runBounce

    // Blink when invincible
    if (invincibleRef?.current > 0) {
      groupRef.current.visible = Math.floor(t * 12) % 2 === 0
    } else {
      groupRef.current.visible = true
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={[S, S, S]} rotation={[0, Math.PI, 0]}>
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

// === Chicken obstacle from Room.jsx — scaled up 3x ===
function ObstacleChicken({ data, speedRef }) {
  const groupRef = useRef()
  const headRef = useRef()
  const wingLRef = useRef()
  const wingRRef = useRef()
  const legLRef = useRef()
  const legRRef = useRef()
  const S = 3

  useFrame((state, delta) => {
    if (!groupRef.current) return
    groupRef.current.position.z += speedRef.current * delta
    const t = state.clock.elapsedTime + data.id * 1.3

    // Walking animation
    const legSwing = Math.sin(t * 10) * 0.5
    if (legLRef.current) legLRef.current.rotation.x = legSwing
    if (legRRef.current) legRRef.current.rotation.x = -legSwing

    // Head pecking
    if (headRef.current) {
      headRef.current.rotation.x = Math.sin(t * 8) * 0.15
    }

    // Wing flap
    if (wingLRef.current) wingLRef.current.rotation.z = Math.sin(t * 6) * 0.15 - 0.1
    if (wingRRef.current) wingRRef.current.rotation.z = -Math.sin(t * 6) * 0.15 + 0.1
  })

  return (
    <group ref={groupRef} position={[data.x, 0, data.z]} scale={[S, S, S]} rotation={[0, 0, 0]}>
      {/* Body */}
      <Vox position={[0, 0.22, 0]} args={[0.22, 0.22, 0.3]} color={data.color} />
      <Vox position={[0, 0.26, -0.02]} args={[0.2, 0.18, 0.26]} color={data.color} />
      {/* Tail feathers */}
      <Vox position={[0, 0.32, -0.18]} args={[0.08, 0.16, 0.1]} color={data.color} />
      <Vox position={[0, 0.38, -0.2]} args={[0.06, 0.1, 0.08]} color={data.color} />
      {/* Head */}
      <group ref={headRef} position={[0, 0.36, 0.18]}>
        <Vox position={[0, 0, 0]} args={[0.16, 0.16, 0.16]} color={data.color} />
        {/* Beak */}
        <Vox position={[0, -0.03, 0.1]} args={[0.06, 0.04, 0.06]} color="#e8a020" />
        {/* Comb */}
        <Vox position={[0, 0.1, 0.02]} args={[0.04, 0.08, 0.08]} color="#d03030" />
        {/* Wattle */}
        <Vox position={[0, -0.08, 0.06]} args={[0.04, 0.06, 0.03]} color="#d03030" />
        {/* Eyes */}
        <Vox position={[-0.07, 0.02, 0.07]} args={[0.04, 0.04, 0.03]} color="#101010" />
        <Vox position={[0.07, 0.02, 0.07]} args={[0.04, 0.04, 0.03]} color="#101010" />
      </group>
      {/* Wings */}
      <group ref={wingLRef} position={[-0.12, 0.24, -0.02]}>
        <Vox position={[-0.03, 0, 0]} args={[0.06, 0.14, 0.2]} color={data.color} />
      </group>
      <group ref={wingRRef} position={[0.12, 0.24, -0.02]}>
        <Vox position={[0.03, 0, 0]} args={[0.06, 0.14, 0.2]} color={data.color} />
      </group>
      {/* Legs */}
      <group ref={legLRef} position={[-0.06, 0.12, 0.02]}>
        <Vox position={[0, -0.05, 0]} args={[0.03, 0.12, 0.03]} color="#e8a020" />
        <Vox position={[0, -0.1, 0.02]} args={[0.05, 0.02, 0.06]} color="#e8a020" />
      </group>
      <group ref={legRRef} position={[0.06, 0.12, 0.02]}>
        <Vox position={[0, -0.05, 0]} args={[0.03, 0.12, 0.03]} color="#e8a020" />
        <Vox position={[0, -0.1, 0.02]} args={[0.05, 0.02, 0.06]} color="#e8a020" />
      </group>
    </group>
  )
}

// === Fish collectible ===
function FishCollectible({ data, speedRef }) {
  const meshRef = useRef()
  useFrame((state, delta) => {
    if (!meshRef.current) return
    meshRef.current.position.z += speedRef.current * delta
    meshRef.current.rotation.y = state.clock.elapsedTime * 3
    meshRef.current.position.y = 0.8 + Math.sin(state.clock.elapsedTime * 4) * 0.2
  })

  return (
    <group ref={meshRef} position={[data.x, 0.8, data.z]}>
      {/* Fish body */}
      <Vox position={[0, 0, 0]} args={[0.3, 0.5, 0.8]} color="#60a0e0" />
      {/* Tail */}
      <Vox position={[0, 0, -0.5]} args={[0.05, 0.4, 0.3]} color="#4080c0" />
      {/* Eye */}
      <Vox position={[0.16, 0.08, 0.15]} args={[0.02, 0.1, 0.1]} color="#fff" />
      <Vox position={[0.17, 0.08, 0.15]} args={[0.02, 0.06, 0.06]} color="#000" />
      <pointLight color="#60a0ff" intensity={0.8} distance={3} />
    </group>
  )
}

// === Scrolling grass ground ===
const SEGMENT_SPACING = 5
const SEGMENT_COUNT = 32
const SCROLL_LENGTH = SEGMENT_COUNT * SEGMENT_SPACING

function GrassGround({ speedRef }) {
  const scrollRef = useRef()
  const fenceX = LANE_COUNT * LANE_WIDTH / 2 + 1.5

  useFrame((_, delta) => {
    if (!scrollRef.current) return
    scrollRef.current.children.forEach(child => {
      child.position.z += speedRef.current * delta
      if (child.position.z > 15) child.position.z -= SCROLL_LENGTH
    })
  })

  return (
    <group>
      {/* Main grass — extra wide to fill screen */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -40]} receiveShadow>
        <planeGeometry args={[80, 160]} />
        <meshLambertMaterial color="#4a8c3f" flatShading />
      </mesh>
      {/* Darker grass edges */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-25, -0.06, -40]}>
        <planeGeometry args={[30, 160]} />
        <meshLambertMaterial color="#3d7a34" flatShading />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[25, -0.06, -40]}>
        <planeGeometry args={[30, 160]} />
        <meshLambertMaterial color="#3d7a34" flatShading />
      </mesh>
      {/* Path / dirt road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -40]}>
        <planeGeometry args={[LANE_COUNT * LANE_WIDTH + 1, 180]} />
        <meshLambertMaterial color="#c8b080" flatShading />
      </mesh>
      {/* Scrolling segments: lane dividers + fences */}
      <group ref={scrollRef}>
        {Array.from({ length: SEGMENT_COUNT }, (_, i) => (
          <group key={i} position={[0, 0, -i * SEGMENT_SPACING]}>
            {/* Lane dividers */}
            <Vox position={[-LANE_WIDTH / 2 - 0.3, 0, 0]} args={[0.06, 0.04, 1.5]} color="#a09060" />
            <Vox position={[LANE_WIDTH / 2 + 0.3, 0, 0]} args={[0.06, 0.04, 1.5]} color="#a09060" />
            {/* Left fence: 2 pillars + rails */}
            <Vox position={[-fenceX, 0.3, SEGMENT_SPACING * 0.4]} args={[0.15, 0.6, 0.15]} color="#8b6530" />
            <Vox position={[-fenceX, 0.3, -SEGMENT_SPACING * 0.4]} args={[0.15, 0.6, 0.15]} color="#8b6530" />
            <Vox position={[-fenceX, 0.45, 0]} args={[0.08, 0.06, SEGMENT_SPACING * 0.8 + 0.15]} color="#a07540" />
            <Vox position={[-fenceX, 0.2, 0]} args={[0.08, 0.06, SEGMENT_SPACING * 0.8 + 0.15]} color="#a07540" />
            {/* Right fence: 2 pillars + rails */}
            <Vox position={[fenceX, 0.3, SEGMENT_SPACING * 0.4]} args={[0.15, 0.6, 0.15]} color="#8b6530" />
            <Vox position={[fenceX, 0.3, -SEGMENT_SPACING * 0.4]} args={[0.15, 0.6, 0.15]} color="#8b6530" />
            <Vox position={[fenceX, 0.45, 0]} args={[0.08, 0.06, SEGMENT_SPACING * 0.8 + 0.15]} color="#a07540" />
            <Vox position={[fenceX, 0.2, 0]} args={[0.08, 0.06, SEGMENT_SPACING * 0.8 + 0.15]} color="#a07540" />
          </group>
        ))}
      </group>
    </group>
  )
}

// === Scrolling scenery (flowers, bushes) ===
function ScrollingScenery({ speedRef }) {
  const ref = useRef()
  const items = useMemo(() => {
    const arr = []
    const flowerColors = ['#ff6080', '#ffb040', '#ff80c0', '#f0e040', '#c060ff', '#60c0ff']
    for (let i = 0; i < 40; i++) {
      const side = i % 2 === 0 ? -1 : 1
      const dist = LANE_COUNT * LANE_WIDTH / 2 + 2 + Math.random() * 15
      const isBush = Math.random() < 0.3
      arr.push({
        x: side * dist,
        z: -i * 3.5,
        isBush,
        color: isBush ? '#3a8a30' : flowerColors[Math.floor(Math.random() * flowerColors.length)],
        scale: 0.3 + Math.random() * 0.4,
      })
    }
    return arr
  }, [])

  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.children.forEach(child => {
      child.position.z += speedRef.current * delta
      if (child.position.z > 15) child.position.z -= 140
    })
  })

  return (
    <group ref={ref}>
      {items.map((it, i) => (
        <group key={i} position={[it.x, 0, it.z]}>
          {it.isBush ? (
            <>
              <Vox position={[0, 0.25 * it.scale * 3, 0]} args={[0.8 * it.scale * 3, 0.5 * it.scale * 3, 0.8 * it.scale * 3]} color={it.color} />
              <Vox position={[0.15, 0.35 * it.scale * 3, 0.1]} args={[0.5 * it.scale * 3, 0.3 * it.scale * 3, 0.5 * it.scale * 3]} color="#48a040" />
            </>
          ) : (
            <>
              <Vox position={[0, 0.1, 0]} args={[0.04, 0.2, 0.04]} color="#408030" />
              <Vox position={[0, 0.22, 0]} args={[0.12 * it.scale * 2, 0.1 * it.scale * 2, 0.12 * it.scale * 2]} color={it.color} />
            </>
          )}
        </group>
      ))}
    </group>
  )
}

// === Scrolling trees ===
function ScrollingTrees({ speedRef }) {
  const ref = useRef()
  const trees = useMemo(() => {
    const t = []
    const leafColors = ['#38a038', '#48b048', '#30a030', '#50b850', '#40a040']
    // Near trees (close to path)
    for (let i = 0; i < 20; i++) {
      const side = i % 2 === 0 ? -1 : 1
      t.push({
        x: side * (LANE_COUNT * LANE_WIDTH / 2 + 3 + Math.random() * 2),
        z: -i * 7,
        trunkH: 1.2 + Math.random() * 0.8,
        leafR: 1 + Math.random() * 0.6,
        leafColor: leafColors[Math.floor(Math.random() * leafColors.length)],
      })
    }
    // Far trees (fill sides)
    for (let i = 0; i < 30; i++) {
      const side = i % 2 === 0 ? -1 : 1
      t.push({
        x: side * (LANE_COUNT * LANE_WIDTH / 2 + 8 + Math.random() * 12),
        z: -i * 4.7 - 2,
        trunkH: 1.5 + Math.random() * 1.2,
        leafR: 1.2 + Math.random() * 0.8,
        leafColor: leafColors[Math.floor(Math.random() * leafColors.length)],
      })
    }
    return t
  }, [])

  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.children.forEach(child => {
      child.position.z += speedRef.current * delta
      if (child.position.z > 15) child.position.z -= 140
    })
  })

  return (
    <group ref={ref}>
      {trees.map((tree, i) => (
        <group key={i} position={[tree.x, 0, tree.z]}>
          {/* Trunk */}
          <Vox position={[0, tree.trunkH / 2, 0]} args={[0.4, tree.trunkH, 0.4]} color="#6a4e2c" />
          {/* Leaves */}
          <Vox position={[0, tree.trunkH + tree.leafR * 0.5, 0]} args={[tree.leafR * 1.4, tree.leafR * 1.2, tree.leafR * 1.4]} color={tree.leafColor} />
          <Vox position={[0, tree.trunkH + tree.leafR * 1.1, 0]} args={[tree.leafR * 0.9, tree.leafR * 0.8, tree.leafR * 0.9]} color={tree.leafColor} />
        </group>
      ))}
    </group>
  )
}

// === Clouds ===
function ScrollingClouds({ speedRef }) {
  const ref = useRef()
  const clouds = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    x: (Math.random() - 0.5) * 20,
    y: 6 + Math.random() * 4,
    z: -i * 14,
    scale: 0.8 + Math.random() * 0.6,
  })), [])

  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.children.forEach(child => {
      child.position.z += speedRef.current * 0.3 * delta
      if (child.position.z > 15) child.position.z -= 140
    })
  })

  return (
    <group ref={ref}>
      {clouds.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={c.scale}>
          <mesh><boxGeometry args={[2, 0.6, 1]} /><meshBasicMaterial color="#fff" transparent opacity={0.8} /></mesh>
          <mesh position={[0.6, 0.2, 0]}><boxGeometry args={[1.2, 0.5, 0.8]} /><meshBasicMaterial color="#fff" transparent opacity={0.7} /></mesh>
          <mesh position={[-0.5, 0.15, 0]}><boxGeometry args={[1, 0.4, 0.7]} /><meshBasicMaterial color="#fff" transparent opacity={0.75} /></mesh>
        </group>
      ))}
    </group>
  )
}

// === Explosion VFX — feathers burst on collision ===
function Explosion({ position, color }) {
  const ref = useRef()
  const particles = useMemo(() => {
    const p = []
    const colors = ['#fff', '#ffd700', '#ff6040', color || '#f0e8d0', '#ffb060']
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2 + (Math.random() - 0.5) * 0.5
      const speed = 3 + Math.random() * 5
      p.push({
        vx: Math.cos(angle) * speed,
        vy: 2 + Math.random() * 6,
        vz: Math.sin(angle) * speed,
        size: 0.1 + Math.random() * 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }
    return p
  }, [])
  const born = useRef(null)

  useFrame((state) => {
    if (!ref.current) return
    if (born.current === null) born.current = state.clock.elapsedTime
    const age = state.clock.elapsedTime - born.current
    if (age > 1.2) { ref.current.visible = false; return }
    ref.current.children.forEach((child, i) => {
      const p = particles[i]
      child.position.x = p.vx * age
      child.position.y = p.vy * age - 15 * age * age
      child.position.z = p.vz * age
      const fade = Math.max(0, 1 - age / 1.2)
      child.scale.setScalar(fade)
    })
  })

  return (
    <group ref={ref} position={position}>
      {particles.map((p, i) => (
        <mesh key={i}>
          <boxGeometry args={[p.size, p.size, p.size]} />
          <meshBasicMaterial color={p.color} />
        </mesh>
      ))}
    </group>
  )
}

function GameScene({ onScoreUpdate, onGameOver, onHit, onRestart, gameState, livesRef }) {
  const laneRef = useRef(1)
  const jumpRef = useRef({ active: false, y: 0, vy: 0 })
  const speedRef = useRef(SPEED_BASE)
  const obstaclesRef = useRef([])
  const collectiblesRef = useRef([])
  const spawnTimerRef = useRef(0)
  const scoreTimerRef = useRef(0)
  const [obstacles, setObstacles] = useState([])
  const [collectibles, setCollectibles] = useState([])
  const [explosions, setExplosions] = useState([])
  const idRef = useRef(0)
  const distRef = useRef(0)
  const invincibleRef = useRef(0)

  useEffect(() => {
    const handleKey = (e) => {
      if (gameState.current === 'over') {
        if (e.key === 'Enter') onRestart()
        return
      }
      if (gameState.current !== 'playing') return
      if (e.key === 'ArrowLeft' || e.key === 'a') laneRef.current = Math.max(0, laneRef.current - 1)
      if (e.key === 'ArrowRight' || e.key === 'd') laneRef.current = Math.min(2, laneRef.current + 1)
      if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') && !jumpRef.current.active) {
        jumpRef.current.active = true
        jumpRef.current.vy = 12
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [gameState, onRestart])

  // Touch controls
  useEffect(() => {
    let startX = null, startY = null
    const onStart = (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY }
    const onEnd = (e) => {
      if (startX === null) return
      const dx = e.changedTouches[0].clientX - startX
      const dy = e.changedTouches[0].clientY - startY
      if (gameState.current === 'over') { if (Math.abs(dx) < 30 && Math.abs(dy) < 30) onRestart(); return }
      if (gameState.current !== 'playing') return
      if (dy < -50 && !jumpRef.current.active) {
        jumpRef.current.active = true
        jumpRef.current.vy = 12
      } else if (dx > 40) laneRef.current = Math.min(2, laneRef.current + 1)
      else if (dx < -40) laneRef.current = Math.max(0, laneRef.current - 1)
      startX = null; startY = null
    }
    window.addEventListener('touchstart', onStart)
    window.addEventListener('touchend', onEnd)
    return () => { window.removeEventListener('touchstart', onStart); window.removeEventListener('touchend', onEnd) }
  }, [gameState, onRestart])

  useFrame((_, delta) => {
    if (gameState.current !== 'playing') return

    distRef.current += speedRef.current * delta
    speedRef.current = SPEED_BASE + distRef.current * 0.003

    scoreTimerRef.current += delta
    if (scoreTimerRef.current > 0.1) {
      onScoreUpdate(prev => prev + 1)
      scoreTimerRef.current = 0
    }

    spawnTimerRef.current += delta
    const interval = Math.max(0.35, SPAWN_INTERVAL / (1 + distRef.current * 0.0015))
    if (spawnTimerRef.current > interval) {
      spawnTimerRef.current = 0
      const chickenColors = ['#f0e8d0', '#c87830', '#f0e0c0', '#d09040', '#e8d8b8']
      const roll = Math.random()

      if (roll < 0.15) {
        // Fish collectible
        const lane = Math.floor(Math.random() * LANE_COUNT)
        collectiblesRef.current.push({
          id: idRef.current++,
          x: (lane - 1) * LANE_WIDTH,
          z: -80,
        })
      } else if (roll < 0.55 || distRef.current < 200) {
        // Single chicken
        const lane = Math.floor(Math.random() * LANE_COUNT)
        obstaclesRef.current.push({
          id: idRef.current++,
          x: (lane - 1) * LANE_WIDTH,
          z: -80,
          color: chickenColors[Math.floor(Math.random() * chickenColors.length)],
        })
      } else {
        // Pair of chickens blocking 2 lanes — forces player to specific lane
        const freeLane = Math.floor(Math.random() * LANE_COUNT)
        for (let l = 0; l < LANE_COUNT; l++) {
          if (l !== freeLane) {
            obstaclesRef.current.push({
              id: idRef.current++,
              x: (l - 1) * LANE_WIDTH,
              z: -80 - (Math.random() * 2),
              color: chickenColors[Math.floor(Math.random() * chickenColors.length)],
            })
          }
        }
      }
    }

    // Invincibility cooldown
    if (invincibleRef.current > 0) invincibleRef.current -= delta

    // Check collisions — skip if cat is airborne or invincible
    const catX = (laneRef.current - 1) * LANE_WIDTH
    const airborne = jumpRef.current.y > 1.5
    const immune = invincibleRef.current > 0

    obstaclesRef.current = obstaclesRef.current.filter(obs => {
      obs.z += speedRef.current * delta
      if (obs.z > 10) return false
      if (!airborne && !immune && Math.abs(obs.x - catX) < 0.9 && Math.abs(obs.z) < 1.0) {
        // Spawn explosion at collision point
        setExplosions(prev => [...prev, { id: idRef.current++, x: obs.x, z: obs.z, color: obs.color }])
        invincibleRef.current = 1.5
        if (livesRef.current <= 1) {
          onGameOver()
        } else {
          onHit()
        }
        return false
      }
      return true
    })

    // Clean up old explosions
    setExplosions(prev => prev.slice(-6))

    collectiblesRef.current = collectiblesRef.current.filter(col => {
      col.z += speedRef.current * delta
      if (col.z > 10) return false
      if (Math.abs(col.x - catX) < 1.5 && Math.abs(col.z) < 1.5) {
        onScoreUpdate(prev => prev + 50)
        return false
      }
      return true
    })

    setObstacles([...obstaclesRef.current])
    setCollectibles([...collectiblesRef.current])
  })

  // Reset on restart
  useEffect(() => {
    if (gameState.current === 'playing') {
      obstaclesRef.current = []
      collectiblesRef.current = []
      spawnTimerRef.current = 0
      scoreTimerRef.current = 0
      distRef.current = 0
      speedRef.current = SPEED_BASE
      laneRef.current = 1
      jumpRef.current = { active: false, y: 0, vy: 0 }
      invincibleRef.current = 0
      setObstacles([])
      setCollectibles([])
      setExplosions([])
    }
  }, [gameState])

  return (
    <>
      <ambientLight intensity={0.6} color="#fff8e0" />
      <directionalLight position={[5, 10, 4]} intensity={1} color="#fff8e0" castShadow />
      <directionalLight position={[-8, 8, 2]} intensity={0.4} color="#ffe080" />
      <fog attach="fog" args={['#87ceeb', 40, 100]} />

      <GrassGround speedRef={speedRef} />
      <ScrollingTrees speedRef={speedRef} />
      <ScrollingScenery speedRef={speedRef} />
      <ScrollingClouds speedRef={speedRef} />
      <RunnerCat laneRef={laneRef} jumpRef={jumpRef} invincibleRef={invincibleRef} />

      {obstacles.map(obs => (
        <ObstacleChicken key={obs.id} data={obs} speedRef={speedRef} />
      ))}
      {collectibles.map(col => (
        <FishCollectible key={col.id} data={col} speedRef={speedRef} />
      ))}
      {explosions.map(ex => (
        <Explosion key={ex.id} position={[ex.x, 1, ex.z]} color={ex.color} />
      ))}
    </>
  )
}

const MAX_LIVES = 3

export default function GameCatRunner() {
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(MAX_LIVES)
  const [gameOver, setGameOver] = useState(false)
  const [started, setStarted] = useState(false)
  const [splashDone, setSplashDone] = useState(false)
  const gameState = useRef('idle')
  const livesRef = useRef(MAX_LIVES)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') window.location.href = '/' }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleStart = useCallback(() => {
    setScore(0)
    setLives(MAX_LIVES)
    livesRef.current = MAX_LIVES
    setGameOver(false)
    setStarted(true)
    gameState.current = 'playing'
  }, [])

  const handleHit = useCallback(() => {
    livesRef.current -= 1
    setLives(livesRef.current)
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
    title: lang === 'es' ? 'CAT RUNNER' : lang === 'ru' ? 'КОШАЧИЙ РАННЕР' : 'CAT RUNNER',
    start: lang === 'es' ? 'PULSA PARA EMPEZAR' : lang === 'ru' ? 'НАЖМИТЕ ЧТОБЫ НАЧАТЬ' : 'TAP TO START',
    controls: lang === 'es' ? (isMobile ? 'Desliza ← → esquivar, ↑ saltar' : '← → esquivar, ESPACIO saltar') : lang === 'ru' ? (isMobile ? 'Свайп ← → уклон, ↑ прыжок' : '← → уклон, ПРОБЕЛ прыжок') : (isMobile ? 'Swipe ← → dodge, ↑ jump' : '← → dodge, SPACE jump'),
    over: lang === 'es' ? '¡TE PILLARON!' : lang === 'ru' ? 'ПОЙМАЛИ!' : 'CAUGHT!',
    retry: lang === 'es' ? (isMobile ? 'Toca para reiniciar' : 'ENTER para reiniciar') : lang === 'ru' ? (isMobile ? 'Нажмите для рестарта' : 'ENTER для рестарта') : (isMobile ? 'Tap to retry' : 'ENTER to retry'),
    back: lang === 'es' ? '← Volver' : lang === 'ru' ? '← Назад' : '← Back',
    score: lang === 'es' ? 'PUNTOS' : lang === 'ru' ? 'ОЧКИ' : 'SCORE',
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#87ceeb', position: 'relative' }}>
      <Canvas shadows camera={{ position: [0, 4, 8], fov: 55 }} gl={{ antialias: false }}>
        <color attach="background" args={['#87ceeb']} />
        {started ? (
          <GameScene
            onScoreUpdate={setScore}
            onGameOver={handleGameOver}
            onHit={handleHit}
            onRestart={handleRestart}
            gameState={gameState}
            livesRef={livesRef}
          />
        ) : (
          <>
            <ambientLight intensity={0.6} color="#fff8e0" />
            <directionalLight position={[5, 10, 4]} intensity={1} color="#fff8e0" />
          </>
        )}
      </Canvas>

      {/* HUD */}
      {started && !gameOver && (
        <div style={{
          position: 'absolute', top: '20px', right: '20px',
          fontFamily: "'Press Start 2P', monospace", fontSize: '14px',
          color: '#fff', textShadow: '2px 2px 0 #000, 0 0 10px rgba(240,168,96,0.5)',
          textAlign: 'right',
        }}>
          <div>{texts.score}: {score}</div>
          <div style={{ marginTop: '8px', fontSize: '18px', letterSpacing: '4px' }}>
            {Array.from({ length: MAX_LIVES }, (_, i) => (
              <span key={i} style={{ opacity: i < lives ? 1 : 0.2, filter: i < lives ? 'none' : 'grayscale(1)' }}>
                {i < lives ? '❤️' : '🖤'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Start screen */}
      {!started && splashDone && (
        <div
          onClick={handleStart}
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontFamily: "'Press Start 2P', monospace", color: '#fff',
            background: 'rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ fontSize: isMobile ? '18px' : '28px', color: '#f0a860', textShadow: '3px 3px 0 #000', marginBottom: '30px' }}>
            {texts.title}
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '14px', color: '#fff', animation: 'pulse 1.5s ease-in-out infinite', marginBottom: '20px', textShadow: '2px 2px 0 #000' }}>
            {texts.start}
          </div>
          <div style={{ fontSize: isMobile ? '8px' : '10px', color: '#e0e0e0', textShadow: '1px 1px 0 #000' }}>
            {texts.controls}
          </div>
        </div>
      )}

      {/* Game Over screen */}
      {gameOver && (
        <div
          onClick={handleRestart}
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontFamily: "'Press Start 2P', monospace",
            background: 'rgba(0,0,0,0.5)',
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
          border: '2px solid rgba(100,140,180,0.5)', borderRadius: '6px',
          backdropFilter: 'blur(4px)', letterSpacing: '1px',
          zIndex: 100,
        }}
        onMouseEnter={(e) => (e.target.style.background = 'rgba(30,40,50,0.9)')}
        onMouseLeave={(e) => (e.target.style.background = 'rgba(30,40,50,0.75)')}
      >
        {texts.back}
      </a>

      {/* Mobile controls */}
      {isMobile && started && !gameOver && (
        <>
          <div style={{ position: 'absolute', bottom: '40px', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 30px', pointerEvents: 'none' }}>
            <button
              style={mobileBtn}
              onTouchStart={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' })) }}
            >◀</button>
            <button
              style={mobileBtn}
              onTouchStart={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })) }}
            >▶</button>
          </div>
          <div style={{ position: 'absolute', bottom: '120px', right: '25px', pointerEvents: 'none' }}>
            <button
              style={{ ...mobileBtn, width: '80px', height: '80px', fontSize: '12px', fontFamily: "'Press Start 2P', monospace" }}
              onTouchStart={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' })) }}
            >JUMP</button>
          </div>
        </>
      )}

      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      {!splashDone && (
        <GameSplash
          title="CAT RUNNER"
          subtitle={lang === 'es' ? '¡Esquiva o salta las gallinas!' : lang === 'ru' ? 'Уклоняйся или прыгай!' : 'Dodge or jump over chickens!'}
          color="#f0a860"
          onFinish={() => setSplashDone(true)}
        />
      )}
    </div>
  )
}

const mobileBtn = {
  width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(240,168,96,0.4)', border: '2px solid rgba(240,168,96,0.6)',
  borderRadius: '50%', color: '#fff', fontSize: '24px',
  touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', cursor: 'pointer',
  backdropFilter: 'blur(4px)', pointerEvents: 'auto',
}
