import React, { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

// Helper: pixel-art voxel
function Vox({ position, args = [1, 1, 1], color, castShadow = true }) {
  return (
    <mesh position={position} castShadow={castShadow}>
      <boxGeometry args={args} />
      <meshLambertMaterial color={color} flatShading />
    </mesh>
  )
}

const _headWorldPos = new THREE.Vector3()
const _camDir = new THREE.Vector3()

function Head({ position }) {
  const headRef = useRef()

  useFrame((state) => {
    if (headRef.current) {
      // Get head world position
      headRef.current.getWorldPosition(_headWorldPos)
      // Direction from head to camera
      _camDir.copy(state.camera.position).sub(_headWorldPos)

      // Target Y rotation (left-right)
      const targetY = Math.atan2(_camDir.x, _camDir.z)
      // Target X rotation (up-down)
      const dist = Math.sqrt(_camDir.x * _camDir.x + _camDir.z * _camDir.z)
      const targetX = -Math.atan2(_camDir.y - 0.3, dist)

      // Clamp rotations so head doesn't spin unnaturally
      const clampY = THREE.MathUtils.clamp(targetY, -0.8, 0.8)
      const clampX = THREE.MathUtils.clamp(targetX, -0.4, 0.4)

      // Smooth lerp
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, clampY, 0.05)
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, clampX, 0.05)
    }
  })

  return (
    <group ref={headRef} position={position}>
      {/* Head - blocky cube */}
      <Vox position={[0, 0, 0]} args={[0.5, 0.5, 0.5]} color="#f5dcc0" />

      {/* Hair - top */}
      <Vox position={[0, 0.28, 0]} args={[0.54, 0.1, 0.54]} color="#6a4830" />
      {/* Hair - back */}
      <Vox position={[0, 0.08, -0.24]} args={[0.54, 0.4, 0.08]} color="#6a4830" />
      {/* Hair - sides */}
      <Vox position={[-0.26, 0.1, 0]} args={[0.06, 0.3, 0.5]} color="#6a4830" />
      <Vox position={[0.26, 0.12, 0]} args={[0.06, 0.26, 0.5]} color="#6a4830" />
      {/* Fringe - swept to the right */}
      <Vox position={[-0.08, 0.22, 0.22]} args={[0.36, 0.1, 0.1]} color="#6a4830" />
      <Vox position={[-0.18, 0.2, 0.24]} args={[0.14, 0.08, 0.06]} color="#7a5838" />

      {/* Eyes - big pixel squares */}
      {[-0.12, 0.12].map((x, i) => (
        <group key={i} position={[x, 0.02, 0.26]}>
          {/* Eye white */}
          <Vox position={[0, 0, 0]} args={[0.12, 0.12, 0.02]} color="#ffffff" />
          {/* Pupil */}
          <Vox position={[0.01, -0.01, 0.015]} args={[0.07, 0.07, 0.02]} color="#202020" />
          {/* Shine */}
          <Vox position={[0.03, 0.03, 0.02]} args={[0.03, 0.03, 0.01]} color="#ffffff" />
        </group>
      ))}

      {/* Eyebrows */}
      <Vox position={[-0.12, 0.1, 0.26]} args={[0.12, 0.03, 0.02]} color="#5a3828" />
      <Vox position={[0.12, 0.1, 0.26]} args={[0.12, 0.03, 0.02]} color="#5a3828" />

      {/* Mouth - small pixel line */}
      <Vox position={[0, -0.12, 0.26]} args={[0.1, 0.03, 0.02]} color="#c08070" />

      {/* Nose */}
      <Vox position={[0, -0.04, 0.27]} args={[0.04, 0.05, 0.02]} color="#e8c8a8" />
    </group>
  )
}

function Body({ position }) {
  return (
    <group position={position}>
      {/* Torso - black t-shirt */}
      <Vox position={[0, 0, 0]} args={[0.5, 0.48, 0.32]} color="#f0d040" />

      {/* T-shirt logo (small detail) */}
      <Vox position={[-0.08, 0.08, 0.165]} args={[0.12, 0.06, 0.01]} color="#1a1a1a" />

      {/* Collar - round neck */}
      <Vox position={[0, 0.22, 0.06]} args={[0.3, 0.06, 0.2]} color="#f0d040" />
      {/* Neck */}
      <Vox position={[0, 0.26, 0]} args={[0.16, 0.06, 0.14]} color="#f5dcc0" />
    </group>
  )
}

function Arms({ position }) {
  const leftArmRef = useRef()
  const rightArmRef = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = Math.sin(t * 1.2) * 0.12
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = Math.sin(t * 1.2 + Math.PI) * 0.12
    }
  })

  return (
    <group position={position}>
      {/* Left arm */}
      <group ref={leftArmRef} position={[-0.34, 0.08, 0]}>
        <Vox position={[0, 0, 0]} args={[0.16, 0.36, 0.16]} color="#f0d040" />
        {/* Hand */}
        <Vox position={[0, -0.22, 0]} args={[0.12, 0.12, 0.12]} color="#f5dcc0" />
      </group>

      {/* Right arm */}
      <group ref={rightArmRef} position={[0.34, 0.08, 0]}>
        <Vox position={[0, 0, 0]} args={[0.16, 0.36, 0.16]} color="#f0d040" />
        {/* Hand */}
        <Vox position={[0, -0.22, 0]} args={[0.12, 0.12, 0.12]} color="#f5dcc0" />
      </group>
    </group>
  )
}

function Legs({ position }) {
  return (
    <group position={position}>
      {[-0.11, 0.11].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          {/* Leg - dark jeans */}
          <Vox position={[0, 0, 0]} args={[0.18, 0.32, 0.18]} color="#3060a0" />
          {/* Shoe - white sneakers */}
          <Vox position={[0, -0.19, 0.03]} args={[0.2, 0.1, 0.26]} color="#e8e8e8" />
        </group>
      ))}
    </group>
  )
}

function DancingCharacter({ position }) {
  const groupRef = useRef()
  const leftArmRef = useRef()
  const rightArmRef = useRef()
  const leftLegRef = useRef()
  const rightLegRef = useRef()
  const bodyRef = useRef()
  const headRef = useRef()
  const audioRef = useRef(null)

  useEffect(() => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const masterGain = ctx.createGain()
    masterGain.gain.value = 0.06
    masterGain.connect(ctx.destination)

    // Catchy melody + bass
    const melody = [
      392, 392, 440, 392, 523, 494, 0,
      392, 392, 440, 392, 587, 523, 0,
      392, 392, 784, 659, 523, 494, 440,
      698, 698, 659, 523, 587, 523, 0,
    ]
    const bass = [
      131, 131, 165, 165, 196, 196, 131, 131,
      147, 147, 165, 165, 196, 196, 147, 147,
      131, 131, 165, 165, 196, 196, 220, 220,
      175, 175, 165, 165, 147, 147, 131, 131,
    ]
    let mIdx = 0, bIdx = 0, beatCount = 0

    const playBeat = () => {
      // Melody
      const freq = melody[mIdx % melody.length]
      if (freq > 0) {
        const osc = ctx.createOscillator()
        osc.type = 'square'
        osc.frequency.value = freq
        const g = ctx.createGain()
        g.gain.setValueAtTime(0.12, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
        osc.connect(g); g.connect(masterGain)
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.12)
      }
      mIdx++
      // Bass (every 2 beats)
      if (beatCount % 2 === 0) {
        const bFreq = bass[bIdx % bass.length]
        const osc2 = ctx.createOscillator()
        osc2.type = 'triangle'
        osc2.frequency.value = bFreq
        const g2 = ctx.createGain()
        g2.gain.setValueAtTime(0.1, ctx.currentTime)
        g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
        osc2.connect(g2); g2.connect(masterGain)
        osc2.start(ctx.currentTime); osc2.stop(ctx.currentTime + 0.2)
        bIdx++
      }
      // Hi-hat (noise burst)
      if (beatCount % 3 === 0) {
        const bufSize = ctx.sampleRate * 0.02
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
        const data = buf.getChannelData(0)
        for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3
        const noise = ctx.createBufferSource()
        noise.buffer = buf
        const ng = ctx.createGain()
        ng.gain.setValueAtTime(0.06, ctx.currentTime)
        ng.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02)
        noise.connect(ng); ng.connect(masterGain)
        noise.start(ctx.currentTime)
      }
      beatCount++
    }

    const intervalId = setInterval(playBeat, 150)
    audioRef.current = { ctx, intervalId }
    return () => { clearInterval(intervalId); ctx.close() }
  }, [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const speed = 5
    const beat = t * speed
    // Dance phase cycles every ~3 seconds
    const phase = Math.floor(t / 3) % 4

    if (groupRef.current) {
      // Bounce - snappy pixel hop
      const hop = Math.abs(Math.sin(beat * 2)) * 0.06
      groupRef.current.position.y = position[1] + hop
      // Move side to side slightly
      groupRef.current.position.x = position[0] + Math.sin(beat * 0.4) * 0.15
      // Spin on phase 3
      if (phase === 3) {
        groupRef.current.rotation.y += 0.08
      } else {
        // Sway
        groupRef.current.rotation.y = Math.sin(beat * 0.5) * 0.4
      }
    }
    if (bodyRef.current) {
      // Hip sway
      bodyRef.current.rotation.z = Math.sin(beat) * 0.12
      bodyRef.current.position.x = Math.sin(beat) * 0.02
    }
    if (headRef.current) {
      // Head bob + nod
      headRef.current.rotation.z = Math.sin(beat * 1.5 + 1) * 0.15
      headRef.current.rotation.x = Math.sin(beat * 2) * 0.08
    }

    // Arms: different moves per phase
    if (leftArmRef.current && rightArmRef.current) {
      if (phase === 0) {
        // Disco pointing
        leftArmRef.current.rotation.x = Math.sin(beat) * 0.5 - 1.2
        leftArmRef.current.rotation.z = 0.3
        rightArmRef.current.rotation.x = Math.sin(beat + Math.PI) * 0.5 - 1.2
        rightArmRef.current.rotation.z = -0.3
      } else if (phase === 1) {
        // Robot arms
        leftArmRef.current.rotation.x = Math.floor(Math.sin(beat) * 2) * 0.4
        leftArmRef.current.rotation.z = Math.floor(Math.cos(beat) * 2) * 0.3 + 0.3
        rightArmRef.current.rotation.x = Math.floor(Math.sin(beat + 1) * 2) * 0.4
        rightArmRef.current.rotation.z = Math.floor(Math.cos(beat + 1) * 2) * 0.3 - 0.3
      } else if (phase === 2) {
        // Wave / raise the roof
        leftArmRef.current.rotation.x = -1.5 + Math.sin(beat * 2) * 0.3
        leftArmRef.current.rotation.z = Math.sin(beat * 3) * 0.4 + 0.2
        rightArmRef.current.rotation.x = -1.5 + Math.sin(beat * 2 + Math.PI) * 0.3
        rightArmRef.current.rotation.z = Math.sin(beat * 3 + Math.PI) * 0.4 - 0.2
      } else {
        // Spin: arms out
        leftArmRef.current.rotation.x = -0.3
        leftArmRef.current.rotation.z = 1.2
        rightArmRef.current.rotation.x = -0.3
        rightArmRef.current.rotation.z = -1.2
      }
    }

    // Legs: march + kick variations
    if (leftLegRef.current && rightLegRef.current) {
      if (phase === 2) {
        // High kicks
        leftLegRef.current.rotation.x = Math.max(0, Math.sin(beat)) * 0.8
        rightLegRef.current.rotation.x = Math.max(0, Math.sin(beat + Math.PI)) * 0.8
      } else {
        // March
        leftLegRef.current.rotation.x = Math.sin(beat) * 0.5
        rightLegRef.current.rotation.x = Math.sin(beat + Math.PI) * 0.5
      }
    }
  })

  return (
    <group ref={groupRef} position={position}>
      <group ref={headRef} position={[0, 1.5, 0]}>
        <Head position={[0, 0, 0]} />
      </group>
      <group ref={bodyRef} position={[0, 1.05, 0]}>
        <Body position={[0, 0, 0]} />
      </group>
      {/* Dancing arms */}
      <group position={[0, 1.05, 0]}>
        <group ref={leftArmRef} position={[-0.34, 0.08, 0]}>
          <Vox position={[0, 0, 0]} args={[0.16, 0.36, 0.16]} color="#f0d040" />
          <Vox position={[0, -0.22, 0]} args={[0.12, 0.12, 0.12]} color="#f5dcc0" />
        </group>
        <group ref={rightArmRef} position={[0.34, 0.08, 0]}>
          <Vox position={[0, 0, 0]} args={[0.16, 0.36, 0.16]} color="#f0d040" />
          <Vox position={[0, -0.22, 0]} args={[0.12, 0.12, 0.12]} color="#f5dcc0" />
        </group>
      </group>
      {/* Dancing legs */}
      <group position={[0, 0.55, 0]}>
        <group ref={leftLegRef} position={[-0.11, 0, 0]}>
          <Vox position={[0, 0, 0]} args={[0.18, 0.32, 0.18]} color="#3060a0" />
          <Vox position={[0, -0.19, 0.03]} args={[0.2, 0.1, 0.26]} color="#e8e8e8" />
        </group>
        <group ref={rightLegRef} position={[0.11, 0, 0]}>
          <Vox position={[0, 0, 0]} args={[0.18, 0.32, 0.18]} color="#3060a0" />
          <Vox position={[0, -0.19, 0.03]} args={[0.2, 0.1, 0.26]} color="#e8e8e8" />
        </group>
      </group>
    </group>
  )
}

// Static head for sleeping — same as Head but no camera tracking, closed eyes
function SleepingHead({ position }) {
  return (
    <group position={position}>
      <Vox position={[0, 0, 0]} args={[0.5, 0.5, 0.5]} color="#f5dcc0" />
      {/* Hair - top */}
      <Vox position={[0, 0.28, 0]} args={[0.54, 0.1, 0.54]} color="#6a4830" />
      {/* Hair - back */}
      <Vox position={[0, 0.08, -0.24]} args={[0.54, 0.4, 0.08]} color="#6a4830" />
      {/* Hair - sides */}
      <Vox position={[-0.26, 0.1, 0]} args={[0.06, 0.3, 0.5]} color="#6a4830" />
      <Vox position={[0.26, 0.12, 0]} args={[0.06, 0.26, 0.5]} color="#6a4830" />
      {/* Fringe - swept to the right */}
      <Vox position={[-0.08, 0.22, 0.22]} args={[0.36, 0.1, 0.1]} color="#6a4830" />
      <Vox position={[-0.18, 0.2, 0.24]} args={[0.14, 0.08, 0.06]} color="#7a5838" />
      {/* Closed eyes — horizontal lines */}
      <Vox position={[-0.12, 0.02, 0.26]} args={[0.12, 0.02, 0.02]} color="#5a3828" />
      <Vox position={[0.12, 0.02, 0.26]} args={[0.12, 0.02, 0.02]} color="#5a3828" />
      {/* Eyebrows */}
      <Vox position={[-0.12, 0.1, 0.26]} args={[0.12, 0.03, 0.02]} color="#5a3828" />
      <Vox position={[0.12, 0.1, 0.26]} args={[0.12, 0.03, 0.02]} color="#5a3828" />
      {/* Mouth - peaceful smile */}
      <Vox position={[0, -0.12, 0.26]} args={[0.1, 0.03, 0.02]} color="#c08070" />
      {/* Nose */}
      <Vox position={[0, -0.04, 0.27]} args={[0.04, 0.05, 0.02]} color="#e8c8a8" />
    </group>
  )
}

// ========== SLEEPING CHARACTER ==========
// Bed world pos [2.8, 0, 2.6] rotated PI → headboard at Z≈3.75, foot at Z≈1.45
// Mattress top Y≈0.50. Character lying along Z: head toward headboard (+Z)
const BED_X = 2.8
const BED_MATTRESS_Y = 0.50
const WALK_TARGET_X = 2.8
const WALK_TARGET_Z = 1.5
const WALK_DURATION = 2.0

// Lying-flat character directly positioned on bed
// Built as a single group with all parts at correct Y relative to mattress
function LyingCharacter() {
  const groupRef = useRef()
  const [, forceUpdate] = useState(0)

  useFrame((state) => {
    if (groupRef.current) {
      const breathe = Math.sin(state.clock.elapsedTime * 1.5) * 0.01
      groupRef.current.position.y = BED_MATTRESS_Y + breathe
    }
    forceUpdate(n => n + 1)
  })

  // Character lies on bed at [BED_X, mattressY, 2.6]
  // Head toward +Z (headboard), feet toward -Z
  // Y=0 is mattress surface, body rises ~0.2 above it
  return (
    <group ref={groupRef} position={[BED_X, BED_MATTRESS_Y, 2.6]}>
      {/* === HEAD on pillow, rotated -90° X so face points UP, no camera tracking === */}
      <group position={[0, 0.26, 0.6]} rotation={[-Math.PI / 2 + Math.PI, Math.PI, 0]}>
        <SleepingHead position={[0, 0, 0]} />
      </group>

      {/* === NECK === */}
      <Vox position={[0, 0.18, 0.34]} args={[0.16, 0.12, 0.1]} color="#f5dcc0" />

      {/* === TORSO lying flat — proportional to head (0.5 wide) === */}
      <Vox position={[0, 0.16, 0]} args={[0.5, 0.24, 0.6]} color="#f0d040" />
      {/* T-shirt logo */}
      <Vox position={[-0.08, 0.29, 0.08]} args={[0.12, 0.01, 0.06]} color="#1a1a1a" />

      {/* === ARMS at sides along body === */}
      {/* Left arm */}
      <Vox position={[-0.38, 0.14, 0]} args={[0.16, 0.16, 0.4]} color="#f0d040" />
      <Vox position={[-0.38, 0.12, -0.24]} args={[0.12, 0.12, 0.12]} color="#f5dcc0" />
      {/* Right arm */}
      <Vox position={[0.38, 0.14, 0]} args={[0.16, 0.16, 0.4]} color="#f0d040" />
      <Vox position={[0.38, 0.12, -0.24]} args={[0.12, 0.12, 0.12]} color="#f5dcc0" />

      {/* === LEGS toward foot of bed (-Z) === */}
      {/* Left leg */}
      <Vox position={[-0.12, 0.13, -0.48]} args={[0.18, 0.18, 0.36]} color="#3060a0" />
      <Vox position={[-0.12, 0.11, -0.72]} args={[0.2, 0.16, 0.14]} color="#e8e8e8" />
      {/* Right leg */}
      <Vox position={[0.12, 0.13, -0.48]} args={[0.18, 0.18, 0.36]} color="#3060a0" />
      <Vox position={[0.12, 0.11, -0.72]} args={[0.2, 0.16, 0.14]} color="#e8e8e8" />
    </group>
  )
}

function SleepingCharacter({ startPos }) {
  const walkRef = useRef()
  const leftLegRef = useRef()
  const rightLegRef = useRef()
  const leftArmRef = useRef()
  const rightArmRef = useRef()
  const phaseRef = useRef('walking')
  const timerRef = useRef(0)
  const [phase, setPhase] = useState('walking')
  const audioRef = useRef(null)

  // Lullaby music
  useEffect(() => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const master = ctx.createGain()
    master.gain.value = 0.04
    master.connect(ctx.destination)

    const notes = [
      392, 330, 294, 262, 294, 330, 262, 0,
      349, 294, 262, 220, 262, 294, 220, 0,
      330, 294, 262, 220, 196, 220, 262, 0,
      294, 262, 220, 196, 220, 262, 294, 0,
    ]
    let idx = 0

    const playNote = () => {
      const freq = notes[idx % notes.length]
      if (freq > 0) {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = freq
        const g = ctx.createGain()
        g.gain.setValueAtTime(0.08, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
        osc.connect(g); g.connect(master)
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.8)

        const osc2 = ctx.createOscillator()
        osc2.type = 'sine'
        osc2.frequency.value = freq * 1.5
        const g2 = ctx.createGain()
        g2.gain.setValueAtTime(0.03, ctx.currentTime)
        g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
        osc2.connect(g2); g2.connect(master)
        osc2.start(ctx.currentTime); osc2.stop(ctx.currentTime + 0.6)
      }
      idx++
    }

    const intervalId = setInterval(playNote, 500)
    audioRef.current = { ctx, intervalId }
    return () => { clearInterval(intervalId); ctx.close() }
  }, [])

  useFrame((state, delta) => {
    timerRef.current += delta
    const t = timerRef.current

    if (phaseRef.current === 'walking' && walkRef.current) {
      const progress = Math.min(t / WALK_DURATION, 1)
      const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2

      walkRef.current.position.x = startPos[0] + (WALK_TARGET_X - startPos[0]) * ease
      walkRef.current.position.z = startPos[2] + (WALK_TARGET_Z - startPos[2]) * ease

      const dx = WALK_TARGET_X - startPos[0]
      const dz = WALK_TARGET_Z - startPos[2]
      walkRef.current.rotation.y = Math.atan2(dx, dz)

      const ws = 8
      // Walk bob — slight up/down as legs swing
      walkRef.current.position.y = -0.27 + Math.abs(Math.sin(t * ws)) * 0.04
      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(t * ws) * 0.25
      if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(t * ws + Math.PI) * 0.25
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * ws + Math.PI) * 0.3
      if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(t * ws) * 0.3

      if (progress >= 1) {
        phaseRef.current = 'sleeping'
        timerRef.current = 0
        setPhase('sleeping')
      }
    }
  })

  if (phase === 'sleeping') {
    return (
      <>
        <LyingCharacter />
        <ZzzEffect position={[BED_X + 0.1, BED_MATTRESS_Y + 0.8, 3.3]} />
      </>
    )
  }

  // Walking phase: standard standing character
  return (
    <group ref={walkRef} position={startPos}>
      <Head position={[0, 1.65, 0]} />
      <Body position={[0, 1.2, 0]} />
      <group position={[0, 1.2, 0]}>
        <group ref={leftArmRef} position={[-0.34, 0.08, 0]}>
          <Vox position={[0, 0, 0]} args={[0.16, 0.36, 0.16]} color="#f0d040" />
          <Vox position={[0, -0.22, 0]} args={[0.12, 0.12, 0.12]} color="#f5dcc0" />
        </group>
        <group ref={rightArmRef} position={[0.34, 0.08, 0]}>
          <Vox position={[0, 0, 0]} args={[0.16, 0.36, 0.16]} color="#f0d040" />
          <Vox position={[0, -0.22, 0]} args={[0.12, 0.12, 0.12]} color="#f5dcc0" />
        </group>
      </group>
      {/* Legs — pivot at hip (y=0.96, flush with torso bottom) */}
      <group ref={leftLegRef} position={[-0.11, 0.96, 0]}>
        {/* Upper leg (thigh) */}
        <Vox position={[0, -0.18, 0]} args={[0.18, 0.32, 0.18]} color="#3060a0" />
        {/* Knee joint */}
        <Vox position={[0, -0.35, 0]} args={[0.16, 0.06, 0.16]} color="#285090" />
        {/* Lower leg (shin) */}
        <Vox position={[0, -0.48, 0]} args={[0.16, 0.22, 0.16]} color="#3060a0" />
        {/* Shoe */}
        <Vox position={[0, -0.64, 0.03]} args={[0.2, 0.1, 0.26]} color="#e8e8e8" />
      </group>
      <group ref={rightLegRef} position={[0.11, 0.96, 0]}>
        {/* Upper leg (thigh) */}
        <Vox position={[0, -0.18, 0]} args={[0.18, 0.32, 0.18]} color="#3060a0" />
        {/* Knee joint */}
        <Vox position={[0, -0.35, 0]} args={[0.16, 0.06, 0.16]} color="#285090" />
        {/* Lower leg (shin) */}
        <Vox position={[0, -0.48, 0]} args={[0.16, 0.22, 0.16]} color="#3060a0" />
        {/* Shoe */}
        <Vox position={[0, -0.64, 0.03]} args={[0.2, 0.1, 0.26]} color="#e8e8e8" />
      </group>
    </group>
  )
}

function ZzzEffect({ position }) {
  const z1 = useRef()
  const z2 = useRef()
  const z3 = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (z1.current) {
      const p = (t * 0.5) % 2.5
      z1.current.position.y = position[1] + p * 0.4
      z1.current.position.x = position[0] + Math.sin(t * 0.8) * 0.1
      z1.current.position.z = position[2]
      z1.current.material.opacity = p < 2 ? Math.min(p * 2, 1) : Math.max(1 - (p - 2) * 2, 0)
    }
    if (z2.current) {
      const p = ((t + 0.8) * 0.5) % 2.5
      z2.current.position.y = position[1] + 0.15 + p * 0.5
      z2.current.position.x = position[0] + 0.15 + Math.sin(t * 0.7 + 1) * 0.08
      z2.current.position.z = position[2]
      z2.current.material.opacity = p < 2 ? Math.min(p * 2, 1) : Math.max(1 - (p - 2) * 2, 0)
    }
    if (z3.current) {
      const p = ((t + 1.6) * 0.5) % 2.5
      z3.current.position.y = position[1] + 0.3 + p * 0.6
      z3.current.position.x = position[0] + 0.3 + Math.sin(t * 0.6 + 2) * 0.12
      z3.current.position.z = position[2]
      z3.current.material.opacity = p < 2 ? Math.min(p * 2, 1) : Math.max(1 - (p - 2) * 2, 0)
    }
  })

  const FONT = '/fonts/PressStart2P-Regular.ttf'
  return (
    <group>
      <Text ref={z1} position={position} fontSize={0.18} color="#ffffff" anchorX="center" anchorY="middle" font={FONT}>
        <meshBasicMaterial transparent opacity={1} />
        Z
      </Text>
      <Text ref={z2} position={[position[0] + 0.15, position[1] + 0.15, position[2]]} fontSize={0.26} color="#c0c8ff" anchorX="center" anchorY="middle" font={FONT}>
        <meshBasicMaterial transparent opacity={1} />
        Z
      </Text>
      <Text ref={z3} position={[position[0] + 0.3, position[1] + 0.3, position[2]]} fontSize={0.35} color="#8090e0" anchorX="center" anchorY="middle" font={FONT}>
        <meshBasicMaterial transparent opacity={1} />
        Z
      </Text>
    </group>
  )
}

export default function Character({ position = [0, 0, 0], seated = false, view }) {
  const groupRef = useRef()
  const turnProgress = useRef(0)

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime
      // Pixel-style bobbing (stepped, not smooth)
      const step = Math.floor(t * 3) % 2
      groupRef.current.position.y = position[1] + step * 0.02

      // Rotate toward monitor when controller view
      if (view === 'controller') {
        turnProgress.current = Math.min(turnProgress.current + 0.035, 1)
      } else {
        turnProgress.current = Math.max(turnProgress.current - 0.06, 0)
      }
      const ease = 1 - Math.pow(1 - turnProgress.current, 3)
      groupRef.current.rotation.y = ease * Math.PI
      // Hide character only after fully rotated (first-person)
      groupRef.current.visible = turnProgress.current < 0.95
    }
  })

  // Dance mode: show standing dancing character in center of room
  if (view === 'dance') {
    return <DancingCharacter position={[0, 0, 0.5]} />
  }

  // Sleep mode: walk to bed and lie down
  if (view === 'sleep') {
    return <SleepingCharacter startPos={[position[0], 0, position[2]]} />
  }

  if (seated) {
    // Chair seat top is at y ~0.55. Body (h=0.48) center at 0.55+0.24=0.79
    return (
      <group ref={groupRef} position={position}>
        <Head position={[0, 1.24, 0]} />
        <Body position={[0, 0.79, 0]} />
        {/* Arms reaching forward toward desk */}
        <group position={[0, 0.79, 0]}>
          <group position={[-0.34, 0.04, 0]}>
            <Vox position={[0, 0, 0.08]} args={[0.16, 0.16, 0.3]} color="#f0d040" />
            <Vox position={[0, 0, 0.26]} args={[0.12, 0.12, 0.12]} color="#f5dcc0" />
          </group>
          <group position={[0.34, 0.04, 0]}>
            <Vox position={[0, 0, 0.08]} args={[0.16, 0.16, 0.3]} color="#f0d040" />
            <Vox position={[0, 0, 0.26]} args={[0.12, 0.12, 0.12]} color="#f5dcc0" />
          </group>
        </group>
        {/* Seated legs - on chair seat */}
        <group position={[0, 0.55, 0]}>
          {[-0.11, 0.11].map((x, i) => (
            <group key={i} position={[x, 0, 0]}>
              {/* Upper leg - horizontal on seat */}
              <Vox position={[0, 0, 0.14]} args={[0.18, 0.14, 0.34]} color="#3060a0" />
              {/* Lower leg - hanging down */}
              <Vox position={[0, -0.2, 0.3]} args={[0.16, 0.28, 0.16]} color="#3060a0" />
              {/* Shoe - white sneakers */}
              <Vox position={[0, -0.37, 0.33]} args={[0.2, 0.1, 0.26]} color="#e8e8e8" />
            </group>
          ))}
        </group>
      </group>
    )
  }

  return (
    <group ref={groupRef} position={position}>
      <Head position={[0, 1.65, 0]} />
      <Body position={[0, 1.2, 0]} />
      <Arms position={[0, 1.2, 0]} />
      <Legs position={[0, 0.78, 0]} />
    </group>
  )
}
