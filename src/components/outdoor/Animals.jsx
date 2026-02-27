import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import Vox from '../common/Vox'

export function Butterfly({ startPos }) {
  const ref = useRef()
  const speed = useMemo(() => 0.5 + Math.random() * 1, [])
  const radius = useMemo(() => 0.5 + Math.random() * 1, [])
  const color = useMemo(() => ['#ff80c0', '#80c0ff', '#ffe060', '#c080ff'][Math.floor(Math.random() * 4)], [])

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime * speed
      ref.current.position.x = startPos[0] + Math.sin(t) * radius
      ref.current.position.y = startPos[1] + Math.sin(t * 1.5) * 0.3
      ref.current.position.z = startPos[2] + Math.cos(t * 0.7) * radius
    }
  })

  return (
    <group ref={ref} position={startPos}>
      <Vox position={[-0.06, 0, 0]} args={[0.08, 0.04, 0.06]} color={color} />
      <Vox position={[0.06, 0, 0]} args={[0.08, 0.04, 0.06]} color={color} />
      <Vox position={[0, 0, 0]} args={[0.02, 0.06, 0.02]} color="#303030" />
    </group>
  )
}

export function PixelPig({ position, scale = 1, facing = 0, siblingRef, groupRef: externalRef }) {
  const ref = useRef()
  useEffect(() => { if (externalRef) externalRef.current = ref.current }, [])
  const headRef = useRef()
  const tailRef = useRef()
  const flRef = useRef()
  const frRef = useRef()
  const blRef = useRef()
  const brRef = useRef()
  const startPos = useMemo(() => [...position], [])
  const wanderAngle = useRef(facing)
  const wanderTimer = useRef(Math.random() * 10)
  const rooting = useRef(false)

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    const dt = state.clock.getDelta() || 0.016

    wanderTimer.current -= dt
    if (wanderTimer.current <= 0) {
      rooting.current = !rooting.current
      wanderTimer.current = rooting.current ? 2 + Math.random() * 3 : 1.5 + Math.random() * 2.5
      if (!rooting.current) wanderAngle.current += (Math.random() - 0.5) * 2
    }

    const walking = !rooting.current
    if (walking) {
      const spd = 0.015
      ref.current.position.x += Math.sin(wanderAngle.current) * spd
      ref.current.position.z += Math.cos(wanderAngle.current) * spd
    }
    const px = ref.current.position.x
    const pz = ref.current.position.z
    const dx = px - startPos[0]
    const dz = pz - startPos[2]
    if (dx * dx + dz * dz > 25) {
      wanderAngle.current = Math.atan2(-dx, -dz) + (Math.random() - 0.5) * 0.3
    }
    // Avoid sibling pig
    if (siblingRef?.current) {
      const sx = siblingRef.current.position.x - px
      const sz = siblingRef.current.position.z - pz
      const sd = Math.sqrt(sx * sx + sz * sz)
      if (sd < 2.0) {
        wanderAngle.current = Math.atan2(-sx, -sz) + (Math.random() - 0.5) * 0.3
        ref.current.position.x -= sx * 0.02
        ref.current.position.z -= sz * 0.02
      }
    }
    if (px > -26 && px < 26 && pz > -26 && pz < 26) {
      const dists = [px + 26, 26 - px, pz + 26, 26 - pz]
      const mi = dists.indexOf(Math.min(...dists))
      if (mi === 0) ref.current.position.x = -26
      else if (mi === 1) ref.current.position.x = 26
      else if (mi === 2) ref.current.position.z = -26
      else ref.current.position.z = 26
      wanderAngle.current += Math.PI
    }
    ref.current.position.x = Math.max(-35, Math.min(35, ref.current.position.x))
    ref.current.position.z = Math.max(-35, Math.min(35, ref.current.position.z))
    ref.current.rotation.y = wanderAngle.current

    const legSwing = walking ? Math.sin(t * 5) * 0.3 : 0
    if (flRef.current) flRef.current.rotation.x = legSwing
    if (brRef.current) brRef.current.rotation.x = legSwing
    if (frRef.current) frRef.current.rotation.x = -legSwing
    if (blRef.current) blRef.current.rotation.x = -legSwing

    if (headRef.current) {
      headRef.current.rotation.x = rooting.current
        ? Math.sin(t * 3) * 0.1 + 0.3
        : Math.sin(t * 0.8) * 0.05
    }
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(t * 6) * 0.4
      tailRef.current.rotation.x = Math.sin(t * 4) * 0.2
    }
  })

  const s = scale
  return (
    <group ref={ref} position={position} rotation={[0, facing, 0]}>
      {/* Body */}
      <Vox position={[0, 0.5 * s, 0]} args={[0.7 * s, 0.55 * s, 1.0 * s]} color="#f0a8a0" />
      <Vox position={[0, 0.55 * s, 0]} args={[0.65 * s, 0.45 * s, 0.9 * s]} color="#f0b0a8" />
      {/* Head */}
      <group ref={headRef} position={[0, 0.55 * s, 0.55 * s]}>
        <Vox position={[0, 0.05 * s, 0.1 * s]} args={[0.5 * s, 0.45 * s, 0.45 * s]} color="#f0a8a0" />
        {/* Snout */}
        <Vox position={[0, -0.02 * s, 0.32 * s]} args={[0.32 * s, 0.24 * s, 0.18 * s]} color="#e89890" />
        {/* Nostrils */}
        <Vox position={[-0.06 * s, -0.04 * s, 0.42 * s]} args={[0.06 * s, 0.06 * s, 0.04 * s]} color="#c07068" />
        <Vox position={[0.06 * s, -0.04 * s, 0.42 * s]} args={[0.06 * s, 0.06 * s, 0.04 * s]} color="#c07068" />
        {/* Eyes */}
        <Vox position={[-0.16 * s, 0.1 * s, 0.32 * s]} args={[0.12 * s, 0.12 * s, 0.06 * s]} color="#ffffff" />
        <Vox position={[0.16 * s, 0.1 * s, 0.32 * s]} args={[0.12 * s, 0.12 * s, 0.06 * s]} color="#ffffff" />
        <Vox position={[-0.16 * s, 0.09 * s, 0.36 * s]} args={[0.07 * s, 0.07 * s, 0.04 * s]} color="#101010" />
        <Vox position={[0.16 * s, 0.09 * s, 0.36 * s]} args={[0.07 * s, 0.07 * s, 0.04 * s]} color="#101010" />
        {/* Ears - floppy */}
        <Vox position={[-0.22 * s, 0.22 * s, 0.05 * s]} args={[0.14 * s, 0.18 * s, 0.1 * s]} color="#e8a098" />
        <Vox position={[0.22 * s, 0.22 * s, 0.05 * s]} args={[0.14 * s, 0.18 * s, 0.1 * s]} color="#e8a098" />
      </group>
      {/* Legs */}
      <group ref={flRef} position={[-0.2 * s, 0.2 * s, 0.35 * s]}>
        <Vox position={[0, -0.1 * s, 0]} args={[0.16 * s, 0.35 * s, 0.16 * s]} color="#e89890" />
        <Vox position={[0, -0.28 * s, 0]} args={[0.14 * s, 0.06 * s, 0.14 * s]} color="#c08078" />
      </group>
      <group ref={frRef} position={[0.2 * s, 0.2 * s, 0.35 * s]}>
        <Vox position={[0, -0.1 * s, 0]} args={[0.16 * s, 0.35 * s, 0.16 * s]} color="#e89890" />
        <Vox position={[0, -0.28 * s, 0]} args={[0.14 * s, 0.06 * s, 0.14 * s]} color="#c08078" />
      </group>
      <group ref={blRef} position={[-0.2 * s, 0.2 * s, -0.35 * s]}>
        <Vox position={[0, -0.1 * s, 0]} args={[0.16 * s, 0.35 * s, 0.16 * s]} color="#e89890" />
        <Vox position={[0, -0.28 * s, 0]} args={[0.14 * s, 0.06 * s, 0.14 * s]} color="#c08078" />
      </group>
      <group ref={brRef} position={[0.2 * s, 0.2 * s, -0.35 * s]}>
        <Vox position={[0, -0.1 * s, 0]} args={[0.16 * s, 0.35 * s, 0.16 * s]} color="#e89890" />
        <Vox position={[0, -0.28 * s, 0]} args={[0.14 * s, 0.06 * s, 0.14 * s]} color="#c08078" />
      </group>
      {/* Curly tail */}
      <group ref={tailRef} position={[0, 0.6 * s, -0.55 * s]}>
        <Vox position={[0, 0.04 * s, -0.04 * s]} args={[0.06 * s, 0.06 * s, 0.1 * s]} color="#f0a8a0" />
        <Vox position={[0, 0.08 * s, -0.08 * s]} args={[0.05 * s, 0.06 * s, 0.05 * s]} color="#e89890" />
      </group>
    </group>
  )
}

export function PixelCow({ position, color = '#f0f0f0', spotColor = '#303030', facing = 0 }) {
  const ref = useRef()
  const headRef = useRef()
  const tailRef = useRef()
  const flRef = useRef()
  const frRef = useRef()
  const blRef = useRef()
  const brRef = useRef()
  const startPos = useMemo(() => [...position], [])
  const wanderAngle = useRef(facing)
  const wanderTimer = useRef(Math.random() * 10)
  const grazing = useRef(false)

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    const dt = state.clock.getDelta() || 0.016

    wanderTimer.current -= dt
    if (wanderTimer.current <= 0) {
      grazing.current = !grazing.current
      wanderTimer.current = grazing.current ? 3 + Math.random() * 4 : 2 + Math.random() * 3
      if (!grazing.current) {
        wanderAngle.current += (Math.random() - 0.5) * 1.5
      }
    }

    const walking = !grazing.current
    if (walking) {
      const spd = 0.012
      ref.current.position.x += Math.sin(wanderAngle.current) * spd
      ref.current.position.z += Math.cos(wanderAngle.current) * spd
    }
    const px = ref.current.position.x
    const pz = ref.current.position.z
    const dx = px - startPos[0]
    const dz = pz - startPos[2]
    const distSq = dx * dx + dz * dz
    if (distSq > 36) {
      wanderAngle.current = Math.atan2(-dx, -dz) + (Math.random() - 0.5) * 0.3
    }
    if (px > -26 && px < 26 && pz > -26 && pz < 26) {
      const distToLeft = px - (-26)
      const distToRight = 26 - px
      const distToBack = pz - (-26)
      const distToFront = 26 - pz
      const minDist = Math.min(distToLeft, distToRight, distToBack, distToFront)
      if (minDist === distToLeft) ref.current.position.x = -26
      else if (minDist === distToRight) ref.current.position.x = 26
      else if (minDist === distToBack) ref.current.position.z = -26
      else ref.current.position.z = 26
      wanderAngle.current += Math.PI + (Math.random() - 0.5) * 0.5
    }
    ref.current.position.x = Math.max(-35, Math.min(35, ref.current.position.x))
    ref.current.position.z = Math.max(-35, Math.min(35, ref.current.position.z))
    ref.current.rotation.y = wanderAngle.current

    const legSwing = walking ? Math.sin(t * 4) * 0.35 : 0
    if (flRef.current) flRef.current.rotation.x = legSwing
    if (brRef.current) brRef.current.rotation.x = legSwing
    if (frRef.current) frRef.current.rotation.x = -legSwing
    if (blRef.current) blRef.current.rotation.x = -legSwing

    if (headRef.current) {
      headRef.current.rotation.x = grazing.current
        ? Math.sin(t * 2) * 0.15 + 0.25
        : Math.sin(t * 0.5) * 0.05
    }
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(t * 3) * 0.3
    }
  })

  const s = 2
  return (
    <group ref={ref} position={position} rotation={[0, facing, 0]}>
      {/* Body */}
      <Vox position={[0, 1.1, 0]} args={[1.0, 0.8, 1.8]} color={color} />
      {/* Head */}
      <group ref={headRef} position={[0, 1.3, 0.9]}>
        <Vox position={[0, 0.1, 0.2]} args={[0.7, 0.6, 0.6]} color={color} />
        {/* Snout */}
        <Vox position={[0, -0.04, 0.48]} args={[0.44, 0.32, 0.2]} color="#ffddcc" />
        {/* Nostrils */}
        <Vox position={[-0.1, -0.08, 0.6]} args={[0.06, 0.06, 0.04]} color="#604030" />
        <Vox position={[0.1, -0.08, 0.6]} args={[0.06, 0.06, 0.04]} color="#604030" />
        {/* Eyes */}
        <Vox position={[-0.22, 0.18, 0.52]} args={[0.18, 0.18, 0.08]} color="#ffffff" />
        <Vox position={[0.22, 0.18, 0.52]} args={[0.18, 0.18, 0.08]} color="#ffffff" />
        <Vox position={[-0.22, 0.17, 0.57]} args={[0.10, 0.10, 0.04]} color="#101010" />
        <Vox position={[0.22, 0.17, 0.57]} args={[0.10, 0.10, 0.04]} color="#101010" />
        {/* Ears */}
        <Vox position={[-0.4, 0.3, 0.16]} args={[0.2, 0.12, 0.16]} color={color} />
        <Vox position={[0.4, 0.3, 0.16]} args={[0.2, 0.12, 0.16]} color={color} />
        {/* Horns */}
        <Vox position={[-0.28, 0.44, 0.16]} args={[0.08, 0.2, 0.08]} color="#e8dca0" />
        <Vox position={[0.28, 0.44, 0.16]} args={[0.08, 0.2, 0.08]} color="#e8dca0" />
      </group>
      {/* Front left leg */}
      <group ref={flRef} position={[-0.3, 0.7, 0.6]}>
        <Vox position={[0, -0.3, 0]} args={[0.24, 0.6, 0.24]} color={color} />
        <Vox position={[0, -0.62, 0]} args={[0.26, 0.08, 0.26]} color="#403020" />
      </group>
      {/* Front right leg */}
      <group ref={frRef} position={[0.3, 0.7, 0.6]}>
        <Vox position={[0, -0.3, 0]} args={[0.24, 0.6, 0.24]} color={color} />
        <Vox position={[0, -0.62, 0]} args={[0.26, 0.08, 0.26]} color="#403020" />
      </group>
      {/* Back left leg */}
      <group ref={blRef} position={[-0.3, 0.7, -0.6]}>
        <Vox position={[0, -0.3, 0]} args={[0.24, 0.6, 0.24]} color={color} />
        <Vox position={[0, -0.62, 0]} args={[0.26, 0.08, 0.26]} color="#403020" />
      </group>
      {/* Back right leg */}
      <group ref={brRef} position={[0.3, 0.7, -0.6]}>
        <Vox position={[0, -0.3, 0]} args={[0.24, 0.6, 0.24]} color={color} />
        <Vox position={[0, -0.62, 0]} args={[0.26, 0.08, 0.26]} color="#403020" />
      </group>
      {/* Udder */}
      <Vox position={[0, 0.55, -0.3]} args={[0.32, 0.2, 0.24]} color="#f0b0b0" />
      {/* Tail */}
      <group ref={tailRef} position={[0, 1.4, -0.96]}>
        <Vox position={[0, -0.1, -0.12]} args={[0.08, 0.4, 0.08]} color={color} />
        <Vox position={[0, -0.3, -0.16]} args={[0.12, 0.12, 0.08]} color={spotColor} />
      </group>
    </group>
  )
}

export function PixelDonkey({ position, facing = 0 }) {
  const ref = useRef()
  const headRef = useRef()
  const tailRef = useRef()
  const flRef = useRef()
  const frRef = useRef()
  const blRef = useRef()
  const brRef = useRef()
  const earLRef = useRef()
  const earRRef = useRef()
  const startPos = useMemo(() => [...position], [])
  const wanderAngle = useRef(facing)
  const wanderTimer = useRef(Math.random() * 10)
  const grazing = useRef(false)

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    const dt = state.clock.getDelta() || 0.016

    wanderTimer.current -= dt
    if (wanderTimer.current <= 0) {
      grazing.current = !grazing.current
      wanderTimer.current = grazing.current ? 3 + Math.random() * 5 : 2 + Math.random() * 3
      if (!grazing.current) wanderAngle.current += (Math.random() - 0.5) * 1.5
    }

    const walking = !grazing.current
    if (walking) {
      const spd = 0.01
      ref.current.position.x += Math.sin(wanderAngle.current) * spd
      ref.current.position.z += Math.cos(wanderAngle.current) * spd
    }
    const px = ref.current.position.x
    const pz = ref.current.position.z
    const dx = px - startPos[0]
    const dz = pz - startPos[2]
    if (dx * dx + dz * dz > 36) {
      wanderAngle.current = Math.atan2(-dx, -dz) + (Math.random() - 0.5) * 0.3
    }
    if (px > -26 && px < 26 && pz > -26 && pz < 26) {
      const dists = [px + 26, 26 - px, pz + 26, 26 - pz]
      const mi = dists.indexOf(Math.min(...dists))
      if (mi === 0) ref.current.position.x = -26
      else if (mi === 1) ref.current.position.x = 26
      else if (mi === 2) ref.current.position.z = -26
      else ref.current.position.z = 26
      wanderAngle.current += Math.PI + (Math.random() - 0.5) * 0.5
    }
    ref.current.position.x = Math.max(-35, Math.min(35, ref.current.position.x))
    ref.current.position.z = Math.max(-35, Math.min(35, ref.current.position.z))
    ref.current.rotation.y = wanderAngle.current

    const legSwing = walking ? Math.sin(t * 4) * 0.3 : 0
    if (flRef.current) flRef.current.rotation.x = legSwing
    if (brRef.current) brRef.current.rotation.x = legSwing
    if (frRef.current) frRef.current.rotation.x = -legSwing
    if (blRef.current) blRef.current.rotation.x = -legSwing

    if (headRef.current) {
      headRef.current.rotation.x = grazing.current
        ? Math.sin(t * 2) * 0.12 + 0.3
        : Math.sin(t * 0.6) * 0.05
    }
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(t * 3.5) * 0.35
    }
    if (earLRef.current) earLRef.current.rotation.z = Math.sin(t * 1.5) * 0.15 - 0.2
    if (earRRef.current) earRRef.current.rotation.z = Math.sin(t * 1.5 + 1) * 0.15 + 0.2
  })

  return (
    <group ref={ref} position={position} rotation={[0, facing, 0]}>
      {/* Body */}
      <Vox position={[0, 1.05, 0]} args={[0.85, 0.7, 1.7]} color="#808080" />
      <Vox position={[0, 1.15, 0]} args={[0.75, 0.55, 1.5]} color="#909090" />
      {/* Belly */}
      <Vox position={[0, 0.75, 0]} args={[0.7, 0.2, 1.4]} color="#b0b0a8" />
      {/* Mane */}
      <Vox position={[0, 1.42, 0.1]} args={[0.12, 0.12, 1.0]} color="#404040" />
      {/* Head */}
      <group ref={headRef} position={[0, 1.25, 0.85]}>
        <Vox position={[0, 0.1, 0.2]} args={[0.55, 0.5, 0.55]} color="#909090" />
        {/* Muzzle */}
        <Vox position={[0, -0.05, 0.48]} args={[0.38, 0.3, 0.22]} color="#c0b8b0" />
        {/* Nostrils */}
        <Vox position={[-0.08, -0.1, 0.6]} args={[0.06, 0.06, 0.04]} color="#505050" />
        <Vox position={[0.08, -0.1, 0.6]} args={[0.06, 0.06, 0.04]} color="#505050" />
        {/* Eyes */}
        <Vox position={[-0.2, 0.16, 0.46]} args={[0.14, 0.14, 0.06]} color="#ffffff" />
        <Vox position={[0.2, 0.16, 0.46]} args={[0.14, 0.14, 0.06]} color="#ffffff" />
        <Vox position={[-0.2, 0.15, 0.5]} args={[0.08, 0.08, 0.04]} color="#201810" />
        <Vox position={[0.2, 0.15, 0.5]} args={[0.08, 0.08, 0.04]} color="#201810" />
        {/* Ears */}
        <group ref={earLRef} position={[-0.16, 0.3, 0.12]}>
          <Vox position={[0, 0.28, 0]} args={[0.14, 0.55, 0.1]} color="#808080" />
          <Vox position={[0, 0.28, 0.02]} args={[0.09, 0.45, 0.06]} color="#c0b0a0" />
        </group>
        <group ref={earRRef} position={[0.16, 0.3, 0.12]}>
          <Vox position={[0, 0.28, 0]} args={[0.14, 0.55, 0.1]} color="#808080" />
          <Vox position={[0, 0.28, 0.02]} args={[0.09, 0.45, 0.06]} color="#c0b0a0" />
        </group>
      </group>
      {/* Front left leg */}
      <group ref={flRef} position={[-0.25, 0.7, 0.55]}>
        <Vox position={[0, -0.28, 0]} args={[0.2, 0.56, 0.2]} color="#707070" />
        <Vox position={[0, -0.58, 0]} args={[0.22, 0.08, 0.22]} color="#404040" />
      </group>
      {/* Front right leg */}
      <group ref={frRef} position={[0.25, 0.7, 0.55]}>
        <Vox position={[0, -0.28, 0]} args={[0.2, 0.56, 0.2]} color="#707070" />
        <Vox position={[0, -0.58, 0]} args={[0.22, 0.08, 0.22]} color="#404040" />
      </group>
      {/* Back left leg */}
      <group ref={blRef} position={[-0.25, 0.7, -0.55]}>
        <Vox position={[0, -0.28, 0]} args={[0.2, 0.56, 0.2]} color="#707070" />
        <Vox position={[0, -0.58, 0]} args={[0.22, 0.08, 0.22]} color="#404040" />
      </group>
      {/* Back right leg */}
      <group ref={brRef} position={[0.25, 0.7, -0.55]}>
        <Vox position={[0, -0.28, 0]} args={[0.2, 0.56, 0.2]} color="#707070" />
        <Vox position={[0, -0.58, 0]} args={[0.22, 0.08, 0.22]} color="#404040" />
      </group>
      {/* Tail */}
      <group ref={tailRef} position={[0, 1.3, -0.9]}>
        <Vox position={[0, -0.12, -0.08]} args={[0.06, 0.35, 0.06]} color="#707070" />
        <Vox position={[0, -0.3, -0.1]} args={[0.1, 0.14, 0.06]} color="#404040" />
      </group>
    </group>
  )
}

export function PixelChicken({ position, color = '#f0e8d0', facing = 0, playerRef, catRef }) {
  const ref = useRef()
  const headRef = useRef()
  const wingLRef = useRef()
  const wingRRef = useRef()
  const legLRef = useRef()
  const legRRef = useRef()
  const startPos = useMemo(() => [...position], [])
  const wanderAngle = useRef(facing)
  const wanderTimer = useRef(Math.random() * 8)
  const pecking = useRef(false)
  const fleeing = useRef(false)
  const fleeTimer = useRef(0)
  const cooldown = useRef(0)

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    const dt = state.clock.getDelta() || 0.016

    if (cooldown.current > 0) {
      cooldown.current -= dt
      ref.current.rotation.y += (wanderAngle.current - ref.current.rotation.y) * 0.05
      ref.current.position.y = 0
      if (legLRef.current) legLRef.current.rotation.x = 0
      if (legRRef.current) legRRef.current.rotation.x = 0
      if (headRef.current) headRef.current.rotation.x *= 0.9
      if (wingLRef.current) wingLRef.current.rotation.z *= 0.9
      if (wingRRef.current) wingRRef.current.rotation.z *= 0.9
      return
    }

    const px = ref.current.position.x
    const pz = ref.current.position.z

    // Detect closest threat (player or cat)
    let threatDist = Infinity
    let threatX = 0, threatZ = 0
    if (playerRef?.current) {
      const tdx = px - playerRef.current.position.x
      const tdz = pz - playerRef.current.position.z
      const d = Math.sqrt(tdx * tdx + tdz * tdz)
      if (d < threatDist) { threatDist = d; threatX = tdx; threatZ = tdz }
    }
    if (catRef?.current) {
      const tdx = px - catRef.current.position.x
      const tdz = pz - catRef.current.position.z
      const d = Math.sqrt(tdx * tdx + tdz * tdz)
      if (d < threatDist) { threatDist = d; threatX = tdx; threatZ = tdz }
    }

    // Check if a position is blocked by walls
    const isBlocked = (x, z) => {
      if (x > -4.5 && x < 4.5 && z > -4.5 && z < 4.5) return true
      if (x > -17.8 && x < -12.2 && z < -12.75 && z > -17.25) return true
      if (x < -24.5 || x > 24.5 || z < -24.5 || z > 24.5) return true
      return false
    }

    // Pick best flee direction from 8 candidates
    const pickFleeAngle = (cx, cz) => {
      const threatPx = cx - threatX, threatPz = cz - threatZ
      let bestAngle = Math.atan2(threatX, threatZ)
      let bestScore = -Infinity
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        const testX = cx + Math.sin(a) * 3
        const testZ = cz + Math.cos(a) * 3
        if (isBlocked(testX, testZ)) continue
        const ddx = testX - threatPx, ddz = testZ - threatPz
        const score = ddx * ddx + ddz * ddz
        if (score > bestScore) { bestScore = score; bestAngle = a }
      }
      return bestAngle
    }

    // Flee if threat is close
    if (threatDist < 3 && !fleeing.current) {
      fleeing.current = true
      fleeTimer.current = 2.0
      wanderAngle.current = pickFleeAngle(px, pz)
      pecking.current = false
    }

    if (fleeing.current) {
      fleeTimer.current -= dt
      if (fleeTimer.current <= 0 && threatDist > 6) {
        fleeing.current = false
      }

      const nx = ref.current.position.x + Math.sin(wanderAngle.current) * 0.08
      const nz = ref.current.position.z + Math.cos(wanderAngle.current) * 0.08
      if (isBlocked(nx, nz)) {
        wanderAngle.current = pickFleeAngle(ref.current.position.x, ref.current.position.z)
      } else {
        ref.current.position.x = nx
        ref.current.position.z = nz
      }
      ref.current.position.y = Math.max(0, Math.sin(t * 12) * 0.12)
    } else {
      ref.current.position.y = 0

      wanderTimer.current -= dt
      if (wanderTimer.current <= 0) {
        pecking.current = !pecking.current
        wanderTimer.current = pecking.current ? 1.5 + Math.random() * 2.5 : 1 + Math.random() * 2
        if (!pecking.current) wanderAngle.current += (Math.random() - 0.5) * 2.5
      }

      if (!pecking.current) {
        const nx = ref.current.position.x + Math.sin(wanderAngle.current) * 0.018
        const nz = ref.current.position.z + Math.cos(wanderAngle.current) * 0.018
        if (!isBlocked(nx, nz)) {
          ref.current.position.x = nx
          ref.current.position.z = nz
        } else {
          wanderAngle.current += Math.PI * 0.5
        }
      }

      // Steer back toward start if too far
      const sdx = ref.current.position.x - startPos[0]
      const sdz = ref.current.position.z - startPos[2]
      if (sdx * sdx + sdz * sdz > 16) {
        wanderAngle.current = Math.atan2(-sdx, -sdz)
      }
    }

    // Smooth rotation
    ref.current.rotation.y += (wanderAngle.current - ref.current.rotation.y) * 0.1

    const walking = fleeing.current || !pecking.current

    // Leg animation
    const legSwing = walking ? Math.sin(t * (fleeing.current ? 20 : 10)) * (fleeing.current ? 0.7 : 0.5) : 0
    if (legLRef.current) legLRef.current.rotation.x = legSwing
    if (legRRef.current) legRRef.current.rotation.x = -legSwing

    if (headRef.current) {
      headRef.current.rotation.x = pecking.current && !fleeing.current
        ? Math.sin(t * 8) * 0.4 + 0.3
        : fleeing.current ? -0.2 : Math.sin(t * 2) * 0.08
      headRef.current.position.z = pecking.current && !fleeing.current
        ? 0.18 + Math.sin(t * 8) * 0.04
        : 0.18
    }
    const wf = fleeing.current ? 18 : 6, wa = fleeing.current ? 0.6 : 0.15
    if (wingLRef.current) wingLRef.current.rotation.z = walking ? Math.sin(t * wf) * wa - 0.1 : -0.05
    if (wingRRef.current) wingRRef.current.rotation.z = walking ? -Math.sin(t * wf) * wa + 0.1 : 0.05
  })

  return (
    <group ref={ref} position={position} rotation={[0, facing, 0]}>
      {/* Body */}
      <Vox position={[0, 0.22, 0]} args={[0.22, 0.22, 0.3]} color={color} />
      <Vox position={[0, 0.26, -0.02]} args={[0.2, 0.18, 0.26]} color={color} />
      {/* Tail feathers */}
      <Vox position={[0, 0.32, -0.18]} args={[0.08, 0.16, 0.1]} color={color} />
      <Vox position={[0, 0.38, -0.2]} args={[0.06, 0.1, 0.08]} color={color} />
      {/* Head */}
      <group ref={headRef} position={[0, 0.36, 0.18]}>
        <Vox position={[0, 0, 0]} args={[0.16, 0.16, 0.16]} color={color} />
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
        <Vox position={[-0.03, 0, 0]} args={[0.06, 0.14, 0.2]} color={color} />
      </group>
      <group ref={wingRRef} position={[0.12, 0.24, -0.02]}>
        <Vox position={[0.03, 0, 0]} args={[0.06, 0.14, 0.2]} color={color} />
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
