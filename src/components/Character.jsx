import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
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
