import React, { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vox, Head, Body, SleepingHead } from './BodyParts'
import ZzzEffect from './ZzzEffect'

const SOFA_POS = [-2.8, 0, 2.5]
const SOFA_SEAT_Y = 0.55
const SOFA_WALK_X = -1.8
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

export default function SofaSleepingCharacter({ startPos }) {
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
