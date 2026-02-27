import React, { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vox, Head, Body, SleepingHead } from './BodyParts'
import ZzzEffect from './ZzzEffect'

const BED_X = 2.8
const BED_MATTRESS_Y = 0.50
const WALK_TARGET_X = 2.8
const WALK_TARGET_Z = 1.5
const WALK_DURATION = 2.0

// Lying-flat character directly positioned on bed
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

  return (
    <group ref={groupRef} position={[BED_X, BED_MATTRESS_Y, 2.6]}>
      {/* === HEAD on pillow, rotated -90° X so face points UP, no camera tracking === */}
      <group position={[0, 0.26, 0.6]} rotation={[-Math.PI / 2 + Math.PI, Math.PI, 0]}>
        <SleepingHead position={[0, 0, 0]} />
      </group>

      {/* === NECK === */}
      <Vox position={[0, 0.18, 0.34]} args={[0.16, 0.12, 0.1]} color="#f5dcc0" />

      {/* === TORSO lying flat === */}
      <Vox position={[0, 0.16, 0]} args={[0.5, 0.24, 0.6]} color="#f0d040" />
      {/* T-shirt logo */}
      <Vox position={[-0.08, 0.29, 0.08]} args={[0.12, 0.01, 0.06]} color="#1a1a1a" />

      {/* === ARMS at sides along body === */}
      <Vox position={[-0.38, 0.14, 0]} args={[0.16, 0.16, 0.4]} color="#f0d040" />
      <Vox position={[-0.38, 0.12, -0.24]} args={[0.12, 0.12, 0.12]} color="#f5dcc0" />
      <Vox position={[0.38, 0.14, 0]} args={[0.16, 0.16, 0.4]} color="#f0d040" />
      <Vox position={[0.38, 0.12, -0.24]} args={[0.12, 0.12, 0.12]} color="#f5dcc0" />

      {/* === LEGS toward foot of bed (-Z) === */}
      <Vox position={[-0.12, 0.13, -0.48]} args={[0.18, 0.18, 0.36]} color="#3060a0" />
      <Vox position={[-0.12, 0.11, -0.72]} args={[0.2, 0.16, 0.14]} color="#e8e8e8" />
      <Vox position={[0.12, 0.13, -0.48]} args={[0.18, 0.18, 0.36]} color="#3060a0" />
      <Vox position={[0.12, 0.11, -0.72]} args={[0.2, 0.16, 0.14]} color="#e8e8e8" />
    </group>
  )
}

export default function SleepingCharacter({ startPos }) {
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
      {/* Legs — pivot at hip */}
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
