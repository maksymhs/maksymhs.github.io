import React, { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Vox, Head, Body } from './BodyParts'
import { outdoorCollide } from '../outdoor/collisions'

const DOOR_POS = [0, 0, 3.5]
const OUTSIDE_POS = [0, 0, 9]
const WALK_TO_DOOR_DURATION = 2.0
const EXIT_DURATION = 1.8

export default function OutdoorCharacter({ startPos, playerRef, catRef }) {
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
