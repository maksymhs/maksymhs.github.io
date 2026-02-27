import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'

export const LANE_COUNT = 3
export const LANE_WIDTH = 2.5
export const SPEED_BASE = 14
export const SPAWN_INTERVAL = 0.8

// === Voxel helper ===
export function Vox({ position, args = [1, 1, 1], color }) {
  return (
    <mesh position={position}>
      <boxGeometry args={args} />
      <meshLambertMaterial color={color} flatShading />
    </mesh>
  )
}

// === Cat model — scaled up 3x for game visibility ===
export function RunnerCat({ laneRef, jumpRef, invincibleRef }) {
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

// === Chicken obstacle — scaled up 3x ===
export function ObstacleChicken({ data, speedRef }) {
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

    const legSwing = Math.sin(t * 10) * 0.5
    if (legLRef.current) legLRef.current.rotation.x = legSwing
    if (legRRef.current) legRRef.current.rotation.x = -legSwing
    if (headRef.current) headRef.current.rotation.x = Math.sin(t * 8) * 0.15
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
        <Vox position={[0, -0.03, 0.1]} args={[0.06, 0.04, 0.06]} color="#e8a020" />
        <Vox position={[0, 0.1, 0.02]} args={[0.04, 0.08, 0.08]} color="#d03030" />
        <Vox position={[0, -0.08, 0.06]} args={[0.04, 0.06, 0.03]} color="#d03030" />
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
export function FishCollectible({ data, speedRef }) {
  const meshRef = useRef()
  useFrame((state, delta) => {
    if (!meshRef.current) return
    meshRef.current.position.z += speedRef.current * delta
    meshRef.current.rotation.y = state.clock.elapsedTime * 3
    meshRef.current.position.y = 0.8 + Math.sin(state.clock.elapsedTime * 4) * 0.2
  })

  return (
    <group ref={meshRef} position={[data.x, 0.8, data.z]}>
      <Vox position={[0, 0, 0]} args={[0.3, 0.5, 0.8]} color="#60a0e0" />
      <Vox position={[0, 0, -0.5]} args={[0.05, 0.4, 0.3]} color="#4080c0" />
      <Vox position={[0.16, 0.08, 0.15]} args={[0.02, 0.1, 0.1]} color="#fff" />
      <Vox position={[0.17, 0.08, 0.15]} args={[0.02, 0.06, 0.06]} color="#000" />
      <pointLight color="#60a0ff" intensity={0.8} distance={3} />
    </group>
  )
}

// === Explosion VFX — feathers burst on collision ===
export function Explosion({ position, color }) {
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
