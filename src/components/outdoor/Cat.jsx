import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Vox from '../common/Vox'
import { isInsideObstacle, outdoorCollide } from './collisions'

export default function Cat({ onClick, catRef: externalRef, view }) {
  const catRef = externalRef || useRef()
  const { camera } = useThree()
  const legsRef = useRef({ fl: null, fr: null, bl: null, br: null })
  const keysRef = useRef({ up: false, down: false, left: false, right: false, space: false })
  const outdoorInitRef = useRef(false)
  const walkInitRef = useRef(false)
  const jumpRef = useRef({ phase: null, startTime: 0, startPos: [0, 0, 0] })
  const catVelRef = useRef({ y: 0, fx: 0, fz: 0, grounded: true })
  const catHeadingRef = useRef(-Math.PI / 2)
  const catSpeedRef = useRef(0)
  // Waypoints designed to walk AROUND furniture in a clear path
  const waypoints = useMemo(() => [
    [1.5, 0],        // In front of desk, right side
    [1.5, 0.7],      // Walk right
    [1.5, -0.5],     // Move toward back wall
    [2.5, -0.5],     // Toward bookshelf gap
    [2.8, -2.5],     // Past bookshelf near back-right corner
    [1.8, -3.2],     // Along back wall
    [0, -3.2],       // Center back wall
    [-1.8, -3.2],    // Left side back wall
    [-2.5, -3.2],    // Near back-left corner (avoid chest)
    [-2.5, -2.5],    // Around chest (front)
    [-3.2, -0.8],    // Past chest toward left wall
    [-3.2, 0.5],     // Mid left wall
    [-1.8, 0.5],     // Toward center
    [-1, 1.2],       // Center of room
    [-0.5, 1.8],     // Between coffee table and bed
    [0.5, 1.8],      // Cross center toward bed side
    [1.5, 0.5],      // Loop back near desk
    [0.5, 0],        // Back to front of desk
  ], [])
  const stateRef = useRef({ wp: 0, waiting: 0 })

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

  useFrame((state) => {
    if (!catRef.current) return
    const t = state.clock.elapsedTime

    // Outdoor mode
    if (view === 'outdoor') {
      // Start walk+jump animation on first frame
      if (!outdoorInitRef.current) {
        const cp = catRef.current.position
        jumpRef.current = { phase: 'walk', startTime: t, startPos: [cp.x, cp.y, cp.z] }
        outdoorInitRef.current = true
      }

      const j = jumpRef.current
      // Phase 1: Walk toward the window base (x=-3.5, z=0)
      if (j.phase === 'walk') {
        const walkDuration = 1.2
        const elapsed = t - j.startTime
        const p = Math.min(elapsed / walkDuration, 1)

        const sx = j.startPos[0], sz = j.startPos[2]
        const windowX = -3.5, windowZ = 0
        catRef.current.position.x = sx + (windowX - sx) * p
        catRef.current.position.z = sz + (windowZ - sz) * p
        catRef.current.position.y = 0
        // Face the window
        const dx = windowX - catRef.current.position.x
        const dz = windowZ - catRef.current.position.z
        if (Math.abs(dx) > 0.01 || Math.abs(dz) > 0.01) {
          catRef.current.rotation.y = Math.atan2(dx, dz)
        } else {
          catRef.current.rotation.y = -Math.PI / 2
        }

        // Walk leg animation
        const legSwing = Math.sin(t * 10) * 0.4
        const { fl, fr, bl, br } = legsRef.current
        if (fl) fl.rotation.x = legSwing
        if (fr) fr.rotation.x = -legSwing
        if (bl) bl.rotation.x = -legSwing
        if (br) br.rotation.x = legSwing
        catRef.current.children.forEach(c => {
          if (c.userData?.isTail) c.rotation.y = Math.sin(t * 5) * 0.3
        })

        if (p >= 1) {
          j.phase = 'jump'
          j.startTime = t
          j.startPos = [catRef.current.position.x, 0, catRef.current.position.z]
        }
        return
      }

      // Phase 2: Forward leap through window - natural arc
      if (j.phase === 'jump') {
        const jumpDuration = 0.9
        const elapsed = t - j.startTime
        const p = Math.min(elapsed / jumpDuration, 1)

        const sx = j.startPos[0], sz = j.startPos[2]
        const endX = -6.5, endZ = 0
        // Ease-in-out for horizontal (slow start, fast middle, slow end)
        const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2
        catRef.current.position.x = sx + (endX - sx) * eased
        catRef.current.position.z = sz + (endZ - sz) * eased
        // Parabolic arc: -4h(p)(p-1) peaks at p=0.5
        catRef.current.position.y = -4 * 1.6 * p * (p - 1)
        catRef.current.rotation.y = -Math.PI / 2

        // Legs: stretch back during rise, tuck during fall
        const { fl, fr, bl, br } = legsRef.current
        if (p < 0.5) {
          // Rising: legs stretch back
          if (fl) fl.rotation.x = -0.8 * (p * 2)
          if (fr) fr.rotation.x = -0.8 * (p * 2)
          if (bl) bl.rotation.x = 0.6 * (p * 2)
          if (br) br.rotation.x = 0.6 * (p * 2)
        } else {
          // Falling: legs tuck forward for landing
          const fp = (p - 0.5) * 2
          if (fl) fl.rotation.x = -0.8 + 1.2 * fp
          if (fr) fr.rotation.x = -0.8 + 1.2 * fp
          if (bl) bl.rotation.x = 0.6 - 0.9 * fp
          if (br) br.rotation.x = 0.6 - 0.9 * fp
        }
        catRef.current.children.forEach(c => {
          if (c.userData?.isTail) c.rotation.y = Math.sin(t * 8) * 0.5
        })

        if (p >= 1) {
          j.phase = 'done'
          catRef.current.position.y = 0
          catHeadingRef.current = -Math.PI / 2
        }
        return
      }

      // === GTA-style player controls ===
      const keys = keysRef.current
      const vel = catVelRef.current

      // Get camera's forward/right vectors projected on XZ plane
      const camForward = new THREE.Vector3()
      camera.getWorldDirection(camForward)
      camForward.y = 0
      camForward.normalize()
      const camRight = new THREE.Vector3().crossVectors(camForward, new THREE.Vector3(0, 1, 0)).normalize()

      // Input direction relative to camera
      let inputX = 0, inputZ = 0
      if (keys.up) { inputX += camForward.x; inputZ += camForward.z }
      if (keys.down) { inputX -= camForward.x; inputZ -= camForward.z }
      if (keys.left) { inputX -= camRight.x; inputZ -= camRight.z }
      if (keys.right) { inputX += camRight.x; inputZ += camRight.z }

      const inputLen = Math.sqrt(inputX * inputX + inputZ * inputZ)
      const hasInput = inputLen > 0.01
      if (hasInput) { inputX /= inputLen; inputZ /= inputLen }

      // Acceleration / deceleration
      const maxSpeed = 0.12
      const accel = 0.008
      const decel = 0.006
      if (hasInput) {
        catSpeedRef.current = Math.min(catSpeedRef.current + accel, maxSpeed)
      } else {
        catSpeedRef.current = Math.max(catSpeedRef.current - decel, 0)
      }
      const spd = catSpeedRef.current
      const moving = spd > 0.005

      // Smooth heading: cat rotates toward movement direction
      if (hasInput) {
        const targetHeading = Math.atan2(inputX, inputZ)
        let hDiff = targetHeading - catHeadingRef.current
        while (hDiff > Math.PI) hDiff -= Math.PI * 2
        while (hDiff < -Math.PI) hDiff += Math.PI * 2
        catHeadingRef.current += hDiff * 0.18
      }
      catRef.current.rotation.y = catHeadingRef.current

      // Move in facing direction at current speed (grounded only)
      if (moving && vel.grounded) {
        const prevX = catRef.current.position.x
        const prevZ = catRef.current.position.z
        const h = catHeadingRef.current
        let nx = prevX + Math.sin(h) * spd
        let nz = prevZ + Math.cos(h) * spd
        // Collision check (grounded)
        ;[nx, nz] = outdoorCollide(nx, nz, prevX, prevZ, false)
        nx = Math.max(-24, Math.min(24, nx))
        nz = Math.max(-24, Math.min(24, nz))
        catRef.current.position.x = nx
        catRef.current.position.z = nz
      }

      // Jump: directional if moving, vertical if standing still
      if (keys.space && vel.grounded) {
        vel.y = 0.15
        vel.grounded = false
        if (moving) {
          const h = catHeadingRef.current
          vel.fx = Math.sin(h) * spd * 1.5
          vel.fz = Math.cos(h) * spd * 1.5
        } else {
          vel.fx = 0
          vel.fz = 0
        }
      }
      if (!vel.grounded) {
        vel.y -= 0.008
        catRef.current.position.y += vel.y
        // Airborne movement with collision (walls always block, ground obstacles skippable)
        const prevX = catRef.current.position.x
        const prevZ = catRef.current.position.z
        let nx = prevX + vel.fx
        let nz = prevZ + vel.fz
        const airborne = catRef.current.position.y > 0.6
        ;[nx, nz] = outdoorCollide(nx, nz, prevX, prevZ, airborne)
        nx = Math.max(-24, Math.min(24, nx))
        nz = Math.max(-24, Math.min(24, nz))
        catRef.current.position.x = nx
        catRef.current.position.z = nz
        if (catRef.current.position.y <= 0) {
          catRef.current.position.y = 0
          vel.y = 0
          vel.fx = 0
          vel.fz = 0
          vel.grounded = true
        }
      }

      // Water sink — pond center [15, -15], size ~7x5.5
      if (vel.grounded) {
        const cwx = catRef.current.position.x
        const cwz = catRef.current.position.z
        const catInPond = cwx > 11.5 && cwx < 18.5 && cwz > -17.75 && cwz < -12.25
        catRef.current.position.y += ((catInPond ? -0.12 : 0) - catRef.current.position.y) * 0.15
      }

      // Leg animation
      const isAir = !vel.grounded
      const legSpeed = isAir ? 16 : (8 + spd * 80)
      const legAmp = isAir ? 0.7 : (0.2 + spd * 3)
      const legSwing = moving || isAir ? Math.sin(t * legSpeed) * legAmp : 0
      const { fl, fr, bl, br } = legsRef.current
      if (fl) fl.rotation.x = moving || isAir ? legSwing : fl.rotation.x * 0.85
      if (fr) fr.rotation.x = moving || isAir ? -legSwing : fr.rotation.x * 0.85
      if (bl) bl.rotation.x = moving || isAir ? -legSwing : bl.rotation.x * 0.85
      if (br) br.rotation.x = moving || isAir ? legSwing : br.rotation.x * 0.85

      catRef.current.children.forEach(c => {
        if (c.userData?.isTail) c.rotation.y = Math.sin(t * (moving ? 6 : 3)) * (0.3 + spd * 2)
      })
      return
    }

    // Reset when leaving outdoor
    if (outdoorInitRef.current && view !== 'outdoor') {
      outdoorInitRef.current = false
      jumpRef.current.phase = null
      catVelRef.current = { y: 0, fx: 0, fz: 0, grounded: true }
      catSpeedRef.current = 0
      catRef.current.position.set(1.5, 0, 1)
    }

    // Reset cat when leaving walk mode
    if (walkInitRef.current && view !== 'walk') {
      walkInitRef.current = false
      catRef.current.position.set(1.5, 0, 1)
      catRef.current.rotation.y = 0
    }

    // In walk mode, mark as active and skip indoor logic
    if (view === 'walk') {
      walkInitRef.current = true
      return
    }

    // Indoor autonomous waypoint walking
    const s = stateRef.current

    if (s.waiting > 0) {
      s.waiting -= 0.016
      catRef.current.children.forEach(c => {
        if (c.userData?.isTail) c.rotation.y = Math.sin(t * 3) * 0.3
      })
      // Reset legs when idle
      const { fl, fr, bl, br } = legsRef.current
      if (fl) fl.rotation.x *= 0.9
      if (fr) fr.rotation.x *= 0.9
      if (bl) bl.rotation.x *= 0.9
      if (br) br.rotation.x *= 0.9
      return
    }

    const [tx, tz] = waypoints[s.wp]
    const cx = catRef.current.position.x
    const cz = catRef.current.position.z
    const dx = tx - cx
    const dz = tz - cz
    const dist = Math.sqrt(dx * dx + dz * dz)

    if (dist < 0.15) {
      s.wp = (s.wp + 1) % waypoints.length
      s.waiting = 0.8 + Math.random() * 1.5
      return
    }

    const speed = 0.014
    const nx = cx + (dx / dist) * speed
    const nz = cz + (dz / dist) * speed

    // Collision check — skip to next waypoint if blocked
    if (isInsideObstacle(nx, nz)) {
      s.wp = (s.wp + 1) % waypoints.length
      s.waiting = 0.3
      return
    }

    catRef.current.position.x = nx
    catRef.current.position.z = nz
    catRef.current.rotation.y = Math.atan2(dx, dz)

    const legSwing = Math.sin(t * 8) * 0.3
    const { fl, fr, bl, br } = legsRef.current
    if (fl) fl.rotation.x = legSwing
    if (fr) fr.rotation.x = -legSwing
    if (bl) bl.rotation.x = -legSwing
    if (br) br.rotation.x = legSwing

    catRef.current.children.forEach(c => {
      if (c.userData?.isTail) c.rotation.y = Math.sin(t * 4) * 0.4
    })
  })

  return (
    <group
      ref={catRef}
      position={[1.5, 0, 1]}
      onClick={(e) => { e.stopPropagation(); onClick?.() }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'auto')}
    >
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
