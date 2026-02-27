import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { PointerLockControls } from '@react-three/drei'
import * as THREE from 'three'
import DustMap from './MapComponents'
import { getGroundY, isInsideWall, resolveCollision } from './MapData'
import { NAV_NODES, nearestNavNode, randomNavNode, navFindPath } from './NavGraph'
import { Enemy, EnemyBullets, HitMarkers, BulletHoles, UNIFORMS } from './Enemy'

export default function FPSScene({ onScoreUpdate, onGameOver, gameState, onHit, livesRef, shootFlash, isMobile, mobileMoveRef, mobileLookRef, mobileShootRef }) {
  const { camera, gl } = useThree()
  const controlsRef = useRef()
  const keysRef = useRef({ w: false, a: false, s: false, d: false, crouch: false })
  const shootCooldown = useRef(0)
  const jumpVel = useRef(0)
  const playerY = useRef(1.6)
  const onGround = useRef(true)
  const mobileYaw = useRef(0)
  const mobilePitch = useRef(0)
  const [enemies, setEnemies] = useState([])
  const enemiesRef = useRef([])
  const [hitMarkers, setHitMarkers] = useState([])
  const [bulletHoles, setBulletHoles] = useState([])
  const [enemyBullets, setEnemyBullets] = useState([])
  const enemyBulletsRef = useRef([])
  const [playerBullets, setPlayerBullets] = useState([])
  const playerBulletsRef = useRef([])
  const enemyShootTimers = useRef({})
  const idRef = useRef(0)
  const waveRef = useRef(1)
  const invincibleRef = useRef(0)
  const damageFlash = useRef(0)

  // Spawn enemies
  const spawnWave = useCallback(() => {
    const count = 3 + waveRef.current * 2
    const newEnemies = []
    const PLAYER_START_X = 0, PLAYER_START_Z = 34, MIN_SPAWN_DIST = 20
    const farNodes = NAV_NODES.map((n, idx) => ({ n, idx })).filter(({ n }) => {
      const dx = n.x - PLAYER_START_X, dz = n.z - PLAYER_START_Z
      return Math.sqrt(dx * dx + dz * dz) >= MIN_SPAWN_DIST
    })
    for (let i = 0; i < count && i < 10; i++) {
      const pick = farNodes.length > 0 ? farNodes[Math.floor(Math.random() * farNodes.length)] : { n: NAV_NODES[0], idx: 0 }
      const sp = pick.n
      newEnemies.push({
        id: idRef.current++,
        x: sp.x,
        z: sp.z,
        alive: true,
        offset: Math.random() * 10,
        shooting: 0,
        uniform: UNIFORMS[Math.floor(Math.random() * UNIFORMS.length)],
        _ai: null, _pos: null,
      })
    }
    enemiesRef.current = newEnemies
    setEnemies([...newEnemies])
  }, [])

  useEffect(() => {
    if (gameState.current === 'playing') {
      camera.position.set(0, 1.6, 34)
      camera.rotation.set(0, 0, 0)
      waveRef.current = 1
      spawnWave()
    }
  }, [gameState, camera, spawnWave])

  // Key handlers
  useEffect(() => {
    const onDown = (e) => {
      if (e.key === 'w' || e.key === 'ArrowUp') keysRef.current.w = true
      if (e.key === 's' || e.key === 'ArrowDown') keysRef.current.s = true
      if (e.key === 'a' || e.key === 'ArrowLeft') keysRef.current.a = true
      if (e.key === 'd' || e.key === 'ArrowRight') keysRef.current.d = true
      if (e.code === 'Space' && onGround.current) { jumpVel.current = 7.5; onGround.current = false }
      if (e.key === 'Control') keysRef.current.crouch = true
    }
    const onUp = (e) => {
      if (e.key === 'w' || e.key === 'ArrowUp') keysRef.current.w = false
      if (e.key === 's' || e.key === 'ArrowDown') keysRef.current.s = false
      if (e.key === 'a' || e.key === 'ArrowLeft') keysRef.current.a = false
      if (e.key === 'd' || e.key === 'ArrowRight') keysRef.current.d = false
      if (e.key === 'Control') keysRef.current.crouch = false
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [])

  // Shooting — use mousedown on document (pointer lock sends events to document)
  useEffect(() => {
    const onShoot = (e) => {
      if (e.button !== 0) return
      if (!document.pointerLockElement) return
      if (gameState.current !== 'playing') return
      if (shootCooldown.current > 0) return
      shootCooldown.current = 0.15
      shootFlash.current = 0.08

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)
      const dir = raycaster.ray.direction.clone()
      const origin = camera.position.clone()

      playerBulletsRef.current.push({
        id: idRef.current++,
        pos: [origin.x + dir.x * 0.5, origin.y + dir.y * 0.5 - 0.1, origin.z + dir.z * 0.5],
        dir: [dir.x, dir.y, dir.z],
        life: 1.5,
      })
    }
    document.addEventListener('mousedown', onShoot)
    return () => document.removeEventListener('mousedown', onShoot)
  }, [camera, gameState, shootFlash])

  useFrame((_, delta) => {
    if (gameState.current !== 'playing') return
    shootCooldown.current = Math.max(0, shootCooldown.current - delta)
    if (invincibleRef.current > 0) invincibleRef.current -= delta
    if (damageFlash.current > 0) damageFlash.current -= delta

    // Mobile look
    if (isMobile && mobileLookRef.current) {
      const lk = mobileLookRef.current
      mobileYaw.current -= lk.dx * 0.004
      mobilePitch.current -= lk.dy * 0.004
      mobilePitch.current = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, mobilePitch.current))
      camera.rotation.set(mobilePitch.current, mobileYaw.current, 0, 'YXZ')
      lk.dx = 0; lk.dy = 0
    }

    // Mobile shoot
    if (isMobile && mobileShootRef.current && shootCooldown.current <= 0) {
      mobileShootRef.current = false
      shootCooldown.current = 0.15
      shootFlash.current = 0.08
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)
      const dir = raycaster.ray.direction.clone()
      const origin = camera.position.clone()
      playerBulletsRef.current.push({
        id: idRef.current++,
        pos: [origin.x + dir.x * 0.5, origin.y + dir.y * 0.5 - 0.1, origin.z + dir.z * 0.5],
        dir: [dir.x, dir.y, dir.z],
        life: 1.5,
      })
    }

    // Movement
    const speed = 8 * delta
    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0
    forward.normalize()
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

    let nx = camera.position.x
    let nz = camera.position.z

    if (keysRef.current.w) { nx += forward.x * speed; nz += forward.z * speed }
    if (keysRef.current.s) { nx -= forward.x * speed; nz -= forward.z * speed }
    if (keysRef.current.a) { nx -= right.x * speed; nz -= right.z * speed }
    if (keysRef.current.d) { nx += right.x * speed; nz += right.z * speed }

    // Mobile joystick input
    if (isMobile && mobileMoveRef.current) {
      const mv = mobileMoveRef.current
      const mobileSpeed = speed * 1.8
      nx += (forward.x * mv.y + right.x * mv.x) * mobileSpeed
      nz += (forward.z * mv.y + right.z * mv.x) * mobileSpeed
    }

    const eyeHeight = 1.6
    const playerFeetY = playerY.current - eyeHeight

    const [resolvedX, resolvedZ] = resolveCollision(nx, nz, 0.4, playerFeetY)
    camera.position.x = Math.max(-40, Math.min(40, resolvedX))
    camera.position.z = Math.max(-39, Math.min(39, resolvedZ))

    const groundY = getGroundY(camera.position.x, camera.position.z, playerFeetY)

    // Jump physics
    jumpVel.current -= 15 * delta
    playerY.current += jumpVel.current * delta
    const floorY = groundY + eyeHeight
    if (playerY.current <= floorY) {
      playerY.current = floorY
      jumpVel.current = 0
      onGround.current = true
    }
    if (onGround.current) {
      const targetFloor = groundY + eyeHeight
      playerY.current += (targetFloor - playerY.current) * 0.25
    }
    const targetY = keysRef.current.crouch ? playerY.current - 0.7 : playerY.current
    camera.position.y = targetY

    // Update player bullets
    playerBulletsRef.current = playerBulletsRef.current.filter(b => {
      const speed = 60 * delta
      b.pos[0] += b.dir[0] * speed
      b.pos[1] += b.dir[1] * speed
      b.pos[2] += b.dir[2] * speed
      b.life -= delta
      if (b.life <= 0) return false
      if (isInsideWall(b.pos[0], b.pos[2], 0.05)) {
        setBulletHoles(prev => [...prev.slice(-20), { id: idRef.current++, pos: [...b.pos] }])
        return false
      }
      for (const enemy of enemiesRef.current) {
        if (!enemy.alive || !enemy._pos) continue
        const ex = enemy._pos.x
        const ez = enemy._pos.z
        const dx = b.pos[0] - ex, dz = b.pos[2] - ez
        if (dx * dx + dz * dz < 0.5) {
          enemy.alive = false
          onScoreUpdate(prev => prev + 100)
          setHitMarkers(prev => [...prev.slice(-5), { id: idRef.current++, pos: [ex, 1, ez] }])
          setTimeout(() => setHitMarkers(prev => prev.slice(1)), 300)
          setEnemies([...enemiesRef.current])
          const alive = enemiesRef.current.filter(e => e.alive).length
          if (alive === 0) { waveRef.current += 1; setTimeout(() => spawnWave(), 1500) }
          return false
        }
      }
      return true
    })
    setPlayerBullets(playerBulletsRef.current.map(b => ({ ...b, pos: [...b.pos] })))

    // Enemy shooting AI
    const now = performance.now() / 1000
    for (const enemy of enemiesRef.current) {
      if (!enemy.alive || !enemy._pos) continue
      const ex = enemy._pos.x
      const ez = enemy._pos.z
      const dx = camera.position.x - ex
      const dz = camera.position.z - ez
      const dist = Math.sqrt(dx * dx + dz * dz)

      if (dist < 20) {
        const timer = enemyShootTimers.current[enemy.id] || 0
        if (now - timer > (1.5 + Math.random() * 0.5)) {
          enemyShootTimers.current[enemy.id] = now
          enemy.shooting = 0.1
          const spread = 0.15
          const dirX = dx / dist + (Math.random() - 0.5) * spread
          const dirZ = dz / dist + (Math.random() - 0.5) * spread
          enemyBulletsRef.current.push({
            id: idRef.current++,
            pos: [ex, 1.0, ez],
            dir: [dirX, 0, dirZ],
            life: 2,
          })
        }
      }
      if (enemy.shooting > 0) enemy.shooting -= delta
    }

    // Update enemy bullets
    enemyBulletsRef.current = enemyBulletsRef.current.filter(b => {
      b.pos[0] += b.dir[0] * 25 * delta
      b.pos[1] += b.dir[1] * 25 * delta
      b.pos[2] += b.dir[2] * 25 * delta
      b.life -= delta
      if (b.life <= 0) return false
      if (isInsideWall(b.pos[0], b.pos[2], 0.05)) return false
      const bx = b.pos[0] - camera.position.x
      const bz = b.pos[2] - camera.position.z
      if (bx * bx + bz * bz < 0.6 && invincibleRef.current <= 0) {
        invincibleRef.current = 1.5
        damageFlash.current = 0.4
        if (livesRef.current <= 1) {
          onGameOver()
        } else {
          onHit()
        }
        return false
      }
      return true
    })
    setEnemyBullets(enemyBulletsRef.current.map(b => ({ ...b, pos: [...b.pos] })))
  })

  return (
    <>
      {!isMobile && <PointerLockControls ref={controlsRef} />}
      <ambientLight intensity={0.85} color="#ffe8c0" />
      <directionalLight position={[20, 30, 10]} intensity={0.8} color="#fff4e0" />
      <directionalLight position={[-10, 15, -5]} intensity={0.35} color="#d0e0ff" />
      <hemisphereLight args={['#90c8e8', '#c8a868', 0.4]} />
      <fog attach="fog" args={['#c8c0a8', 30, 85]} />

      <DustMap />

      {enemies.map(e => (
        <Enemy key={e.id} data={e} />
      ))}
      <HitMarkers markers={hitMarkers} />
      <BulletHoles holes={bulletHoles} />
      <EnemyBullets bullets={enemyBullets} />
      {playerBullets.map(b => (
        <mesh key={b.id} position={b.pos}>
          <boxGeometry args={[0.04, 0.04, 0.25]} />
          <meshBasicMaterial color="#ffdd00" />
        </mesh>
      ))}
    </>
  )
}
