import React, { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { outdoorCollide } from './Room.jsx'

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

function Head({ position, noTrack = false }) {
  const headRef = useRef()

  useFrame((state) => {
    if (headRef.current && noTrack) {
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0, 0.1)
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, 0, 0.1)
      return
    }
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
  const g1 = useRef()
  const g2 = useRef()
  const g3 = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (g1.current) {
      const p = (t * 0.5) % 2.5
      g1.current.position.set(
        position[0] + Math.sin(t * 0.8) * 0.1,
        position[1] + p * 0.5,
        position[2]
      )
      g1.current.scale.setScalar(p < 2 ? Math.min(p * 2, 1) : Math.max(1 - (p - 2) * 2, 0))
    }
    if (g2.current) {
      const p = ((t + 0.8) * 0.5) % 2.5
      g2.current.position.set(
        position[0] + 0.2 + Math.sin(t * 0.7 + 1) * 0.08,
        position[1] + 0.2 + p * 0.5,
        position[2]
      )
      g2.current.scale.setScalar(p < 2 ? Math.min(p * 2, 1) : Math.max(1 - (p - 2) * 2, 0))
    }
    if (g3.current) {
      const p = ((t + 1.6) * 0.5) % 2.5
      g3.current.position.set(
        position[0] + 0.4 + Math.sin(t * 0.6 + 2) * 0.12,
        position[1] + 0.4 + p * 0.6,
        position[2]
      )
      g3.current.scale.setScalar(p < 2 ? Math.min(p * 2, 1) : Math.max(1 - (p - 2) * 2, 0))
    }
  })

  const FONT = '/fonts/PressStart2P-Regular.ttf'
  return (
    <group>
      <group ref={g1} position={position}>
        <Billboard>
          <Text fontSize={0.2} color="#ffffff" anchorX="center" anchorY="middle" font={FONT} material-transparent material-depthTest={false}>
            Z
          </Text>
        </Billboard>
      </group>
      <group ref={g2} position={[position[0] + 0.2, position[1] + 0.2, position[2]]}>
        <Billboard>
          <Text fontSize={0.28} color="#c0c8ff" anchorX="center" anchorY="middle" font={FONT} material-transparent material-depthTest={false}>
            Z
          </Text>
        </Billboard>
      </group>
      <group ref={g3} position={[position[0] + 0.4, position[1] + 0.4, position[2]]}>
        <Billboard>
          <Text fontSize={0.38} color="#8090e0" anchorX="center" anchorY="middle" font={FONT} material-transparent material-depthTest={false}>
            Z
          </Text>
        </Billboard>
      </group>
    </group>
  )
}

// ========== SOFA SLEEPING CHARACTER ==========
const SOFA_POS = [-2.8, 0, 2.5]
const SOFA_SEAT_Y = 0.55
const SOFA_WALK_X = -1.8  // walk to in front of sofa
const SOFA_WALK_Z = 2.5
const SOFA_WALK_DURATION = 2.0

// Seated sleeping character on sofa — static pose
function SofaSeatedCharacter() {
  const groupRef = useRef()
  const [, forceUpdate] = useState(0)

  useFrame((state) => {
    if (groupRef.current) {
      const breathe = Math.sin(state.clock.elapsedTime * 1.2) * 0.008
      groupRef.current.position.y = SOFA_SEAT_Y + breathe
    }
    forceUpdate(n => n + 1)
  })

  // Seated on sofa, facing +X (away from wall), back against sofa back
  // Sofa rotated π/2 so front faces +X in world space
  return (
    <group ref={groupRef} position={[SOFA_POS[0] + 0.2, SOFA_SEAT_Y, SOFA_POS[2]]} rotation={[0, Math.PI / 2, 0]}>
      {/* Head — tilted to one side (sleeping) */}
      <group position={[0, 0.69, 0]} rotation={[0.1, 0, 0.3]}>
        <SleepingHead position={[0, 0, 0]} />
      </group>
      {/* Body */}
      <Body position={[0, 0.24, 0]} />
      {/* Arms — resting on lap */}
      <group position={[0, 0.24, 0]}>
        <group position={[-0.34, -0.04, 0.08]}>
          <Vox position={[0, 0, 0]} args={[0.16, 0.2, 0.2]} color="#f0d040" />
          <Vox position={[0, -0.05, 0.14]} args={[0.12, 0.12, 0.12]} color="#f5dcc0" />
        </group>
        <group position={[0.34, -0.04, 0.08]}>
          <Vox position={[0, 0, 0]} args={[0.16, 0.2, 0.2]} color="#f0d040" />
          <Vox position={[0, -0.05, 0.14]} args={[0.12, 0.12, 0.12]} color="#f5dcc0" />
        </group>
      </group>
      {/* Seated legs */}
      <group position={[0, 0, 0]}>
        {[-0.11, 0.11].map((x, i) => (
          <group key={i} position={[x, 0, 0]}>
            <Vox position={[0, 0, 0.14]} args={[0.18, 0.14, 0.34]} color="#3060a0" />
            <Vox position={[0, -0.2, 0.3]} args={[0.16, 0.28, 0.16]} color="#3060a0" />
            <Vox position={[0, -0.37, 0.33]} args={[0.2, 0.1, 0.26]} color="#e8e8e8" />
          </group>
        ))}
      </group>
    </group>
  )
}

function SofaSleepingCharacter({ startPos }) {
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
      const progress = Math.min(t / SOFA_WALK_DURATION, 1)
      const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2

      walkRef.current.position.x = startPos[0] + (SOFA_WALK_X - startPos[0]) * ease
      walkRef.current.position.z = startPos[2] + (SOFA_WALK_Z - startPos[2]) * ease

      const dx = SOFA_WALK_X - startPos[0]
      const dz = SOFA_WALK_Z - startPos[2]
      walkRef.current.rotation.y = Math.atan2(dx, dz)

      const ws = 8
      walkRef.current.position.y = -0.27 + Math.abs(Math.sin(t * ws)) * 0.04
      if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(t * ws) * 0.25
      if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(t * ws + Math.PI) * 0.25
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * ws + Math.PI) * 0.3
      if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(t * ws) * 0.3

      if (progress >= 1) {
        phaseRef.current = 'seated'
        timerRef.current = 0
        setPhase('seated')
      }
    }
  })

  if (phase === 'seated') {
    return (
      <>
        <SofaSeatedCharacter />
        <ZzzEffect position={[SOFA_POS[0] + 0.3, SOFA_SEAT_Y + 1.2, SOFA_POS[2] - 0.5]} />
      </>
    )
  }

  // Walking phase
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
      <group ref={leftLegRef} position={[-0.11, 0.96, 0]}>
        <Vox position={[0, -0.18, 0]} args={[0.18, 0.32, 0.18]} color="#3060a0" />
        <Vox position={[0, -0.35, 0]} args={[0.16, 0.06, 0.16]} color="#285090" />
        <Vox position={[0, -0.48, 0]} args={[0.16, 0.22, 0.16]} color="#3060a0" />
        <Vox position={[0, -0.64, 0.03]} args={[0.2, 0.1, 0.26]} color="#e8e8e8" />
      </group>
      <group ref={rightLegRef} position={[0.11, 0.96, 0]}>
        <Vox position={[0, -0.18, 0]} args={[0.18, 0.32, 0.18]} color="#3060a0" />
        <Vox position={[0, -0.35, 0]} args={[0.16, 0.06, 0.16]} color="#285090" />
        <Vox position={[0, -0.48, 0]} args={[0.16, 0.22, 0.16]} color="#3060a0" />
        <Vox position={[0, -0.64, 0.03]} args={[0.2, 0.1, 0.26]} color="#e8e8e8" />
      </group>
    </group>
  )
}

// ========== OUTDOOR WALKING CHARACTER ==========
const DOOR_POS = [0, 0, 3.5]
const OUTSIDE_POS = [0, 0, 9]
const WALK_TO_DOOR_DURATION = 2.0
const EXIT_DURATION = 1.8

function OutdoorCharacter({ startPos, playerRef, catRef }) {
  const groupRef = useRef()
  const doorRef = useRef()
  const leftLegRef = useRef()
  const rightLegRef = useRef()
  const leftArmRef = useRef()
  const rightArmRef = useRef()
  const phaseRef = useRef('walkToDoor')
  const timerRef = useRef(0)
  const doorAngleRef = useRef(0) // 0 = closed, -π/2 = fully open
  const [phase, setPhase] = useState('walkToDoor')
  const { camera } = useThree()

  // WASD/Arrow key input
  const keysRef = useRef({ up: false, down: false, left: false, right: false, space: false })
  const headingRef = useRef(0)
  const speedRef = useRef(0)
  const jumpVel = useRef(0)
  const jumpY = useRef(0)
  const onGround = useRef(true)

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w') keysRef.current.up = true
      if (e.key === 'ArrowDown' || e.key === 's') keysRef.current.down = true
      if (e.key === 'ArrowLeft' || e.key === 'a') keysRef.current.left = true
      if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.right = true
      if (e.key === ' ' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); keysRef.current.space = true }
    }
    const onKeyUp = (e) => {
      if (e.key === 'ArrowUp' || e.key === 'w') keysRef.current.up = false
      if (e.key === 'ArrowDown' || e.key === 's') keysRef.current.down = false
      if (e.key === 'ArrowLeft' || e.key === 'a') keysRef.current.left = false
      if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.right = false
      if (e.key === ' ') keysRef.current.space = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  // Walk animation helper
  const animateWalk = (t) => {
    const ws = 8
    if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(t * ws) * 0.25
    if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(t * ws + Math.PI) * 0.25
    if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * ws + Math.PI) * 0.3
    if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(t * ws) * 0.3
    return Math.abs(Math.sin(t * ws)) * 0.04
  }

  useFrame((state, delta) => {
    timerRef.current += delta
    const t = timerRef.current

    // Sync playerRef from frame 1 so camera follows immediately
    if (playerRef && groupRef.current) playerRef.current = groupRef.current

    // Phase 1: Walk from chair to door
    if (phaseRef.current === 'walkToDoor' && groupRef.current) {
      const progress = Math.min(t / WALK_TO_DOOR_DURATION, 1)
      const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2

      groupRef.current.position.x = startPos[0] + (DOOR_POS[0] - startPos[0]) * ease
      groupRef.current.position.z = startPos[2] + (DOOR_POS[2] - startPos[2]) * ease

      const dx = DOOR_POS[0] - startPos[0]
      const dz = DOOR_POS[2] - startPos[2]
      groupRef.current.rotation.y = Math.atan2(dx, dz)

      const bob = animateWalk(t)
      groupRef.current.position.y = -0.27 + bob

      // Door starts opening when character is close (last 30% of walk)
      if (progress > 0.7) {
        const doorP = (progress - 0.7) / 0.3
        doorAngleRef.current = Math.PI / 2 * doorP
      }
      if (doorRef.current) doorRef.current.rotation.y = doorAngleRef.current

      // Cat follows behind character toward door
      if (catRef?.current && groupRef.current) {
        const behindX = groupRef.current.position.x
        const behindZ = groupRef.current.position.z - 1.2
        catRef.current.position.x += (behindX - catRef.current.position.x) * 0.04
        catRef.current.position.z += (behindZ - catRef.current.position.z) * 0.04
        const cdx = groupRef.current.position.x - catRef.current.position.x
        const cdz = groupRef.current.position.z - catRef.current.position.z
        catRef.current.rotation.y = Math.atan2(cdx, cdz)
      }

      if (progress >= 1) {
        phaseRef.current = 'exiting'
        timerRef.current = 0
      }
      return
    }

    // Phase 2: Walk through door to outside
    if (phaseRef.current === 'exiting' && groupRef.current) {
      const progress = Math.min(t / EXIT_DURATION, 1)
      const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2

      groupRef.current.position.x = DOOR_POS[0] + (OUTSIDE_POS[0] - DOOR_POS[0]) * ease
      groupRef.current.position.z = DOOR_POS[2] + (OUTSIDE_POS[2] - DOOR_POS[2]) * ease
      groupRef.current.rotation.y = 0 // face +Z (toward street)

      const bob = animateWalk(t)
      groupRef.current.position.y = -0.27 + bob

      // Door stays open for first 60%, then closes
      if (progress < 0.6) {
        doorAngleRef.current = Math.PI / 2
      } else {
        const closeP = (progress - 0.6) / 0.4
        doorAngleRef.current = Math.PI / 2 * (1 - closeP)
      }
      if (doorRef.current) doorRef.current.rotation.y = doorAngleRef.current

      // Cat follows behind character through door
      if (catRef?.current && groupRef.current) {
        const behindX = groupRef.current.position.x
        const behindZ = groupRef.current.position.z - 1.5
        catRef.current.position.x += (behindX - catRef.current.position.x) * 0.05
        catRef.current.position.z += (behindZ - catRef.current.position.z) * 0.05
        catRef.current.position.y = 0
        const cdx = groupRef.current.position.x - catRef.current.position.x
        const cdz = groupRef.current.position.z - catRef.current.position.z
        catRef.current.rotation.y = Math.atan2(cdx, cdz)
      }

      if (progress >= 1) {
        doorAngleRef.current = 0
        if (doorRef.current) doorRef.current.rotation.y = 0
        phaseRef.current = 'outdoor'
        timerRef.current = 0
        headingRef.current = 0
        setPhase('outdoor')
      }
      return
    }

    // Phase 3: Player-controllable outdoor
    if (phaseRef.current === 'outdoor' && groupRef.current) {
      const keys = keysRef.current

      const camForward = new THREE.Vector3()
      camera.getWorldDirection(camForward)
      camForward.y = 0
      camForward.normalize()
      const camRight = new THREE.Vector3().crossVectors(camForward, new THREE.Vector3(0, 1, 0)).normalize()

      let inputX = 0, inputZ = 0
      if (keys.up) { inputX += camForward.x; inputZ += camForward.z }
      if (keys.down) { inputX -= camForward.x; inputZ -= camForward.z }
      if (keys.left) { inputX -= camRight.x; inputZ -= camRight.z }
      if (keys.right) { inputX += camRight.x; inputZ += camRight.z }

      const inputLen = Math.sqrt(inputX * inputX + inputZ * inputZ)
      const hasInput = inputLen > 0.01
      if (hasInput) { inputX /= inputLen; inputZ /= inputLen }

      const maxSpeed = 0.08
      const accel = 0.006
      const decel = 0.004
      if (hasInput) {
        speedRef.current = Math.min(speedRef.current + accel, maxSpeed)
      } else {
        speedRef.current = Math.max(speedRef.current - decel, 0)
      }
      const spd = speedRef.current
      const moving = spd > 0.003

      if (hasInput) {
        const targetHeading = Math.atan2(inputX, inputZ)
        let hDiff = targetHeading - headingRef.current
        while (hDiff > Math.PI) hDiff -= Math.PI * 2
        while (hDiff < -Math.PI) hDiff += Math.PI * 2
        headingRef.current += hDiff * 0.15
      }
      groupRef.current.rotation.y = headingRef.current

      if (moving) {
        const h = headingRef.current
        const prevX = groupRef.current.position.x
        const prevZ = groupRef.current.position.z
        let nx = prevX + Math.sin(h) * spd
        let nz = prevZ + Math.cos(h) * spd
        // Use same collision system as the cat
        ;[nx, nz] = outdoorCollide(nx, nz, prevX, prevZ, jumpY.current > 0.15)
        nx = Math.max(-24, Math.min(24, nx))
        nz = Math.max(-24, Math.min(24, nz))
        groupRef.current.position.x = nx
        groupRef.current.position.z = nz
      }
      // Jump
      if (keys.space && onGround.current) {
        jumpVel.current = 0.12
        onGround.current = false
      }
      jumpVel.current -= 0.006 // gravity
      jumpY.current += jumpVel.current
      if (jumpY.current <= 0) {
        jumpY.current = 0
        jumpVel.current = 0
        onGround.current = true
      }
      // Water sink — pond at center [15, -15], size 7x5.5
      const px = groupRef.current.position.x
      const pz = groupRef.current.position.z
      const inWater = px > 11.5 && px < 18.5 && pz > -17.75 && pz < -12.25
      const waterSink = (inWater && jumpY.current === 0) ? 0.18 : 0
      groupRef.current.position.y = -0.27 + jumpY.current - waterSink

      const ws = 8
      const legAmp = moving ? 0.25 + spd * 2 : 0
      const armAmp = moving ? 0.2 + spd * 1.5 : 0
      if (leftLegRef.current) leftLegRef.current.rotation.x = moving ? Math.sin(state.clock.elapsedTime * ws) * legAmp : leftLegRef.current.rotation.x * 0.85
      if (rightLegRef.current) rightLegRef.current.rotation.x = moving ? Math.sin(state.clock.elapsedTime * ws + Math.PI) * legAmp : rightLegRef.current.rotation.x * 0.85
      if (leftArmRef.current) leftArmRef.current.rotation.x = moving ? Math.sin(state.clock.elapsedTime * ws + Math.PI) * armAmp : leftArmRef.current.rotation.x * 0.85
      if (rightArmRef.current) rightArmRef.current.rotation.x = moving ? Math.sin(state.clock.elapsedTime * ws) * armAmp : rightArmRef.current.rotation.x * 0.85

      // Cat follows player + wanders naturally
      if (catRef?.current) {
        const cx = catRef.current.position.x
        const cz = catRef.current.position.z
        const px = groupRef.current.position.x
        const pz = groupRef.current.position.z
        const ddx = px - cx
        const ddz = pz - cz
        const dist = Math.sqrt(ddx * ddx + ddz * ddz)
        const t = state.clock.elapsedTime

        let catMoving = false
        let catSpd = 0

        if (dist > 4) {
          // Too far — run to catch up
          catSpd = 0.07
          const nx0 = cx + (ddx / dist) * catSpd
          const nz0 = cz + (ddz / dist) * catSpd
          const [nx, nz] = outdoorCollide(nx0, nz0, cx, cz, false)
          catRef.current.position.x = nx
          catRef.current.position.z = nz
          catRef.current.rotation.y = Math.atan2(ddx, ddz)
          catMoving = true
        } else if (dist > 2) {
          // Follow at walk pace
          catSpd = 0.035
          const nx0 = cx + (ddx / dist) * catSpd
          const nz0 = cz + (ddz / dist) * catSpd
          const [nx, nz] = outdoorCollide(nx0, nz0, cx, cz, false)
          catRef.current.position.x = nx
          catRef.current.position.z = nz
          catRef.current.rotation.y = Math.atan2(ddx, ddz)
          catMoving = true
        } else {
          // Wander around player naturally
          const wanderRadius = 1.2
          const wanderSpeed = 0.4
          const wx = px + Math.sin(t * wanderSpeed) * wanderRadius
          const wz = pz + Math.cos(t * wanderSpeed * 0.7 + 1.5) * wanderRadius
          const wdx = wx - cx
          const wdz = wz - cz
          const wdist = Math.sqrt(wdx * wdx + wdz * wdz)
          if (wdist > 0.1) {
            catSpd = Math.min(wdist * 0.06, 0.025)
            const nx0 = cx + (wdx / wdist) * catSpd
            const nz0 = cz + (wdz / wdist) * catSpd
            const [nx, nz] = outdoorCollide(nx0, nz0, cx, cz, false)
            catRef.current.position.x = nx
            catRef.current.position.z = nz
            catRef.current.rotation.y += (Math.atan2(wdx, wdz) - catRef.current.rotation.y) * 0.08
            catMoving = catSpd > 0.005
          }
        }

        // Water sink for cat — pond center [15, -15], size ~7x5.5
        const catX = catRef.current.position.x
        const catZ = catRef.current.position.z
        const catInWater = catX > 11.5 && catX < 18.5 && catZ > -17.75 && catZ < -12.25
        catRef.current.position.y += ((catInWater ? -0.12 : 0) - catRef.current.position.y) * 0.15

        // Animate cat legs
        const legSpeed = catMoving ? (8 + catSpd * 80) : 3
        const legAmp = catMoving ? (0.2 + catSpd * 3) : 0
        const legSwing = catMoving ? Math.sin(t * legSpeed) * legAmp : 0
        const legs = catRef.current.children.filter(c => c.userData?.isLeg)
        if (legs.length >= 4) {
          legs[0].rotation.x = catMoving ? legSwing : legs[0].rotation.x * 0.85
          legs[1].rotation.x = catMoving ? -legSwing : legs[1].rotation.x * 0.85
          legs[2].rotation.x = catMoving ? -legSwing : legs[2].rotation.x * 0.85
          legs[3].rotation.x = catMoving ? legSwing : legs[3].rotation.x * 0.85
        }
        // Tail wag
        catRef.current.children.forEach(c => {
          if (c.userData?.isTail) c.rotation.y = Math.sin(t * (catMoving ? 6 : 3)) * (0.3 + catSpd * 2)
        })
      }
    }
  })

  return (
    <>
      {/* Animated door — pivots on right edge (x=+0.7) at z=3.96 */}
      <group position={[0.7, 0, 3.96]}>
        <group ref={doorRef}>
          {/* Door panel offset so pivot is at edge */}
          <Vox position={[-0.7, 1.4, 0]} args={[1.4, 2.6, 0.04]} color="#a07040" />
          {/* Handle — interior side */}
          <Vox position={[-1.2, 1.3, -0.03]} args={[0.08, 0.08, 0.06]} color="#f0c040" />
          {/* Handle — exterior side */}
          <Vox position={[-1.2, 1.3, 0.03]} args={[0.08, 0.08, 0.06]} color="#f0c040" />
        </group>
      </group>

      {/* Walking character */}
      <group ref={groupRef} position={[startPos[0], -0.27, startPos[2]]}>
        <Head position={[0, 1.65, 0]} noTrack />
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
        <group ref={leftLegRef} position={[-0.11, 0.96, 0]}>
          <Vox position={[0, -0.18, 0]} args={[0.18, 0.32, 0.18]} color="#3060a0" />
          <Vox position={[0, -0.35, 0]} args={[0.16, 0.06, 0.16]} color="#285090" />
          <Vox position={[0, -0.48, 0]} args={[0.16, 0.22, 0.16]} color="#3060a0" />
          <Vox position={[0, -0.64, 0.03]} args={[0.2, 0.1, 0.26]} color="#e8e8e8" />
        </group>
        <group ref={rightLegRef} position={[0.11, 0.96, 0]}>
          <Vox position={[0, -0.18, 0]} args={[0.18, 0.32, 0.18]} color="#3060a0" />
          <Vox position={[0, -0.35, 0]} args={[0.16, 0.06, 0.16]} color="#285090" />
          <Vox position={[0, -0.48, 0]} args={[0.16, 0.22, 0.16]} color="#3060a0" />
          <Vox position={[0, -0.64, 0.03]} args={[0.2, 0.1, 0.26]} color="#e8e8e8" />
        </group>
      </group>
    </>
  )
}

export default function Character({ position = [0, 0, 0], seated = false, view, playerRef, catRef }) {
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

  // Sofa mode: walk to sofa, sit and sleep
  if (view === 'sofa') {
    return <SofaSleepingCharacter startPos={[position[0], 0, position[2]]} />
  }

  // Walk mode: walk to door, exit, controllable outdoor character
  if (view === 'walk') {
    return <OutdoorCharacter startPos={[position[0], 0, position[2]]} playerRef={playerRef} catRef={catRef} />
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
