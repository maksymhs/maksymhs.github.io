import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Vox } from './MapComponents'
import { getGroundY, resolveCollision } from './MapData'
import { NAV_NODES, NAV_ADJ, navFindPath, nearestNavNode, randomNavNode } from './NavGraph'

// === Uniform color palettes for enemies ===
export const UNIFORMS = [
  { shirt: '#5a6848', pocket: '#4e5c3e', collar: '#4e5c3e', pants: '#404838', helmet: '#4a5444' },
  { shirt: '#6a5040', pocket: '#5c4438', collar: '#5c4438', pants: '#4a3828', helmet: '#5a4a3a' },
  { shirt: '#485868', pocket: '#3c4c5c', collar: '#3c4c5c', pants: '#384858', helmet: '#3a4a5a' },
  { shirt: '#686050', pocket: '#5c5444', collar: '#5c5444', pants: '#504838', helmet: '#585040' },
  { shirt: '#585858', pocket: '#4c4c4c', collar: '#4c4c4c', pants: '#3a3a3a', helmet: '#484848' },
  { shirt: '#704838', pocket: '#603828', collar: '#603828', pants: '#503020', helmet: '#604030' },
]

export function Enemy({ data }) {
  const ref = useRef()
  const flashRef = useRef()
  const legLRef = useRef()
  const legRRef = useRef()
  const bodyRef = useRef()
  const headRef = useRef()
  const armLRef = useRef()
  const armRRef = useRef()
  const prevPos = useRef({ x: data.x, z: data.z })
  const facingAngle = useRef(0)
  const u = data.uniform || UNIFORMS[0]

  // Nav AI state stored on data object (mutable)
  if (!data._ai) {
    const startNode = nearestNavNode(data.x, data.z)
    const goalNode = randomNavNode()
    const path = navFindPath(startNode, goalNode) || [startNode]
    data._ai = {
      path: path,
      pathIdx: 0,
      idle: 0,
      moveSpeed: 3 + Math.random() * 1.5,
      jumpVel: 0,
      feetY: 0,
      onGround: true,
      stuck: 0,
      runMode: Math.random() < 0.3,
    }
    data._pos = { x: data.x, z: data.z }
  }

  useFrame((state, delta) => {
    if (!ref.current || !data.alive) return
    const t = state.clock.elapsedTime + data.offset
    const ai = data._ai
    const pos = data._pos

    // NPC jump physics
    const GRAVITY = 15
    if (!ai.onGround) {
      ai.jumpVel -= GRAVITY * delta
      ai.feetY += ai.jumpVel * delta
    }
    const groundY = getGroundY(pos.x, pos.z, ai.feetY)
    if (ai.feetY <= groundY) {
      ai.feetY = groundY
      ai.jumpVel = 0
      ai.onGround = true
    }
    if (ai.onGround) {
      ai.feetY += (groundY - ai.feetY) * 0.3
    }

    // Idle pause
    if (ai.idle > 0) {
      ai.idle -= delta
    } else {
      if (ai.pathIdx >= ai.path.length) {
        const curNode = nearestNavNode(pos.x, pos.z)
        let goalNode
        for (let attempt = 0; attempt < 10; attempt++) {
          goalNode = randomNavNode()
          const p = navFindPath(curNode, goalNode)
          if (p && p.length >= 4) break
        }
        const path = navFindPath(curNode, goalNode != null ? goalNode : randomNavNode())
        ai.path = path || [curNode]
        ai.pathIdx = 0
        ai.idle = 0.3 + Math.random() * 1.0
        ai.moveSpeed = ai.runMode ? (4 + Math.random() * 2) : (2.5 + Math.random() * 1.5)
        ai.runMode = Math.random() < 0.3
      } else {
        const targetNode = NAV_NODES[ai.path[ai.pathIdx]]
        const tx = targetNode.x, tz = targetNode.z, ty = targetNode.y || 0

        const dxW = tx - pos.x
        const dzW = tz - pos.z
        const distW = Math.sqrt(dxW * dxW + dzW * dzW)

        if (distW < 1.8) {
          ai.pathIdx++
          if (Math.random() < 0.2) {
            ai.idle = 0.3 + Math.random() * 0.8
          }
        } else {
          const dirX = dxW / distW
          const dirZ = dzW / distW
          const step = ai.moveSpeed * delta
          let nx = pos.x + dirX * step
          let nz = pos.z + dirZ * step

          if (ai.onGround && ty > ai.feetY + 0.3) {
            ai.jumpVel = 7
            ai.onGround = false
          }

          const [rx, rz] = resolveCollision(nx, nz, 0.4, ai.feetY)
          const didMove = Math.abs(rx - pos.x) > 0.001 || Math.abs(rz - pos.z) > 0.001
          nx = rx; nz = rz

          if (!didMove) {
            ai.stuck++
            if (ai.stuck > 8 && ai.onGround) {
              ai.jumpVel = 7
              ai.onGround = false
              ai.stuck = 0
            }
            if (ai.stuck > 20) {
              ai.pathIdx++
              ai.stuck = 0
            }
          } else {
            ai.stuck = 0
          }

          // Player avoidance
          const cam = state.camera.position
          const dpx = nx - cam.x, dpz = nz - cam.z
          if (dpx * dpx + dpz * dpz < 1.5) {
            nx = pos.x; nz = pos.z
          }

          nx = Math.max(-39, Math.min(39, nx))
          nz = Math.max(-39, Math.min(39, nz))

          pos.x = nx
          pos.z = nz
        }
      }
    }

    ref.current.position.x = pos.x
    ref.current.position.y = ai.feetY
    ref.current.position.z = pos.z

    // Smooth rotation toward movement direction or toward player when close
    const cam = state.camera.position
    const dToPlayer = Math.sqrt((cam.x - pos.x) ** 2 + (cam.z - pos.z) ** 2)
    const currentTarget = ai.pathIdx < ai.path.length ? NAV_NODES[ai.path[ai.pathIdx]] : null
    let targetAngle
    if (dToPlayer < 15) {
      targetAngle = Math.atan2(cam.x - pos.x, cam.z - pos.z)
    } else if (currentTarget) {
      targetAngle = Math.atan2(currentTarget.x - pos.x, currentTarget.z - pos.z)
    } else {
      targetAngle = facingAngle.current
    }
    let angleDiff = targetAngle - facingAngle.current
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
    facingAngle.current += angleDiff * Math.min(1, 5 * delta)
    ref.current.rotation.y = facingAngle.current

    // Walking animation
    const dx = pos.x - prevPos.current.x
    const dz = pos.z - prevPos.current.z
    const moving = Math.sqrt(dx * dx + dz * dz) > 0.001
    prevPos.current.x = pos.x
    prevPos.current.z = pos.z

    const walkCycle = Math.sin(t * 8)
    if (moving) {
      if (legLRef.current) legLRef.current.rotation.x = walkCycle * 0.5
      if (legRRef.current) legRRef.current.rotation.x = -walkCycle * 0.5
      if (bodyRef.current) {
        bodyRef.current.rotation.z = walkCycle * 0.03
        bodyRef.current.position.y = 1.05 + Math.abs(walkCycle) * 0.015
      }
      if (armLRef.current) armLRef.current.rotation.x = -walkCycle * 0.3
    } else {
      if (legLRef.current) legLRef.current.rotation.x *= 0.85
      if (legRRef.current) legRRef.current.rotation.x *= 0.85
      if (bodyRef.current) { bodyRef.current.rotation.z *= 0.9; bodyRef.current.position.y = 1.05 }
      if (armLRef.current) armLRef.current.rotation.x *= 0.85
    }

    // Head tracks player
    if (headRef.current) {
      if (dToPlayer < 20) {
        const localAngle = targetAngle - facingAngle.current
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, Math.max(-0.6, Math.min(0.6, localAngle)), 0.1)
      } else {
        headRef.current.rotation.y *= 0.92
      }
      headRef.current.rotation.x = Math.sin(t * 0.7) * 0.04
    }

    // Right arm holds gun — recoil
    if (armRRef.current) {
      armRRef.current.rotation.x = -1.4 + (data.shooting > 0 ? 0.15 : 0)
    }

    if (flashRef.current) flashRef.current.visible = data.shooting > 0
  })

  if (!data.alive) return null

  return (
    <group ref={ref} position={[data.x, 0, data.z]}>
      {/* Legs */}
      <group ref={legLRef} position={[-0.11, 0.83, 0]}>
        <Vox position={[0, -0.3, 0]} args={[0.18, 0.48, 0.18]} color={u.pants} />
        <Vox position={[0, -0.57, 0.03]} args={[0.2, 0.1, 0.26]} color="#303030" />
      </group>
      <group ref={legRRef} position={[0.11, 0.83, 0]}>
        <Vox position={[0, -0.3, 0]} args={[0.18, 0.48, 0.18]} color={u.pants} />
        <Vox position={[0, -0.57, 0.03]} args={[0.2, 0.1, 0.26]} color="#303030" />
      </group>

      {/* Upper body group */}
      <group ref={bodyRef} position={[0, 1.05, 0]}>
        <Vox position={[0, 0, 0]} args={[0.5, 0.48, 0.32]} color={u.shirt} />
        <Vox position={[-0.12, 0.06, 0.165]} args={[0.12, 0.1, 0.01]} color={u.pocket} />
        <Vox position={[0.12, 0.06, 0.165]} args={[0.12, 0.1, 0.01]} color={u.pocket} />
        <Vox position={[0, -0.22, 0]} args={[0.5, 0.06, 0.34]} color="#3a3020" />
        <Vox position={[0, 0.22, 0.06]} args={[0.3, 0.06, 0.2]} color={u.collar} />
        <Vox position={[0, 0.26, 0]} args={[0.16, 0.06, 0.14]} color="#d8b890" />

        {/* Head */}
        <group ref={headRef} position={[0, 0.52, 0]}>
          <Vox position={[0, 0, 0]} args={[0.5, 0.5, 0.5]} color="#d8b890" />
          <Vox position={[0, 0.28, 0]} args={[0.54, 0.1, 0.54]} color={u.helmet} />
          <Vox position={[0, 0.2, -0.1]} args={[0.54, 0.28, 0.3]} color={u.helmet} />
          <Vox position={[0, 0.22, 0.1]} args={[0.54, 0.15, 0.1]} color={u.helmet} />
          {[-0.12, 0.12].map((x, i) => (
            <group key={i} position={[x, 0.02, 0.26]}>
              <Vox position={[0, 0, 0]} args={[0.12, 0.12, 0.02]} color="#ffffff" />
              <Vox position={[0.01, -0.01, 0.015]} args={[0.07, 0.07, 0.02]} color="#202020" />
              <Vox position={[0.03, 0.03, 0.02]} args={[0.03, 0.03, 0.01]} color="#ffffff" />
            </group>
          ))}
          <Vox position={[-0.12, 0.1, 0.26]} args={[0.12, 0.03, 0.02]} color="#2a2a2a" />
          <Vox position={[0.12, 0.1, 0.26]} args={[0.12, 0.03, 0.02]} color="#2a2a2a" />
          <Vox position={[0, -0.04, 0.27]} args={[0.06, 0.07, 0.04]} color="#c8a878" />
          <Vox position={[0, -0.14, 0.26]} args={[0.12, 0.04, 0.02]} color="#c08070" />
        </group>

        {/* Left arm */}
        <group ref={armLRef} position={[-0.34, 0.08, 0]}>
          <Vox position={[0, 0, 0]} args={[0.16, 0.36, 0.16]} color={u.shirt} />
          <Vox position={[0, -0.22, 0]} args={[0.12, 0.12, 0.12]} color="#d8b890" />
        </group>

        {/* Right arm (holds gun) */}
        <group ref={armRRef} position={[0.34, 0.08, 0]} rotation={[-1.4, 0, 0]}>
          <Vox position={[0, 0, 0]} args={[0.16, 0.36, 0.16]} color={u.shirt} />
          <Vox position={[0, -0.22, 0]} args={[0.12, 0.12, 0.12]} color="#d8b890" />
          <Vox position={[0, -0.32, -0.02]} args={[0.06, 0.3, 0.08]} color="#444" />
          <Vox position={[0, -0.5, -0.02]} args={[0.04, 0.15, 0.06]} color="#555" />
          <Vox position={[0, -0.22, -0.06]} args={[0.08, 0.06, 0.04]} color="#3a3a3a" />
          <Vox position={[0, -0.35, 0.04]} args={[0.04, 0.12, 0.06]} color="#333" />
          <mesh ref={flashRef} position={[0, -0.6, -0.02]} visible={false}>
            <boxGeometry args={[0.14, 0.14, 0.06]} />
            <meshBasicMaterial color="#ffcc00" />
          </mesh>
        </group>
      </group>
    </group>
  )
}

// === Enemy bullet tracer ===
export function EnemyBullets({ bullets }) {
  return (
    <>
      {bullets.map(b => (
        <mesh key={b.id} position={b.pos}>
          <boxGeometry args={[0.05, 0.05, 0.3]} />
          <meshBasicMaterial color="#ff8800" />
        </mesh>
      ))}
    </>
  )
}

// === Hit marker effect ===
export function HitMarkers({ markers }) {
  return (
    <>
      {markers.map(m => (
        <mesh key={m.id} position={m.pos}>
          <boxGeometry args={[0.15, 0.15, 0.15]} />
          <meshBasicMaterial color="#ff0000" transparent opacity={0.8} />
        </mesh>
      ))}
    </>
  )
}

// === Bullet holes ===
export function BulletHoles({ holes }) {
  return (
    <>
      {holes.map(h => (
        <mesh key={h.id} position={h.pos} rotation={h.rot || [0, 0, 0]}>
          <boxGeometry args={[0.08, 0.08, 0.08]} />
          <meshBasicMaterial color="#222" />
        </mesh>
      ))}
    </>
  )
}
