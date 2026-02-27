import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vox, Head, Body } from './BodyParts'

export default function DancingCharacter({ position }) {
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
