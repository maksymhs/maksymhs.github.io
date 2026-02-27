import React, { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { LANE_COUNT, LANE_WIDTH, SPEED_BASE, SPAWN_INTERVAL, RunnerCat, ObstacleChicken, FishCollectible, Explosion } from './RunnerEntities'
import { GrassGround, ScrollingScenery, ScrollingTrees, ScrollingClouds } from './RunnerEnvironment'

export default function GameScene({ onScoreUpdate, onGameOver, onHit, onRestart, gameState, livesRef }) {
  const laneRef = useRef(1)
  const jumpRef = useRef({ active: false, y: 0, vy: 0 })
  const speedRef = useRef(SPEED_BASE)
  const obstaclesRef = useRef([])
  const collectiblesRef = useRef([])
  const spawnTimerRef = useRef(0)
  const scoreTimerRef = useRef(0)
  const [obstacles, setObstacles] = useState([])
  const [collectibles, setCollectibles] = useState([])
  const [explosions, setExplosions] = useState([])
  const idRef = useRef(0)
  const distRef = useRef(0)
  const invincibleRef = useRef(0)

  useEffect(() => {
    const handleKey = (e) => {
      if (gameState.current === 'over') {
        if (e.key === 'Enter') onRestart()
        return
      }
      if (gameState.current !== 'playing') return
      if (e.key === 'ArrowLeft' || e.key === 'a') laneRef.current = Math.max(0, laneRef.current - 1)
      if (e.key === 'ArrowRight' || e.key === 'd') laneRef.current = Math.min(2, laneRef.current + 1)
      if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') && !jumpRef.current.active) {
        jumpRef.current.active = true
        jumpRef.current.vy = 12
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [gameState, onRestart])

  // Touch controls
  useEffect(() => {
    let startX = null, startY = null
    const onStart = (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY }
    const onEnd = (e) => {
      if (startX === null) return
      const dx = e.changedTouches[0].clientX - startX
      const dy = e.changedTouches[0].clientY - startY
      if (gameState.current === 'over') { if (Math.abs(dx) < 30 && Math.abs(dy) < 30) onRestart(); return }
      if (gameState.current !== 'playing') return
      if (dy < -50 && !jumpRef.current.active) {
        jumpRef.current.active = true
        jumpRef.current.vy = 12
      } else if (dx > 40) laneRef.current = Math.min(2, laneRef.current + 1)
      else if (dx < -40) laneRef.current = Math.max(0, laneRef.current - 1)
      startX = null; startY = null
    }
    window.addEventListener('touchstart', onStart)
    window.addEventListener('touchend', onEnd)
    return () => { window.removeEventListener('touchstart', onStart); window.removeEventListener('touchend', onEnd) }
  }, [gameState, onRestart])

  useFrame((_, delta) => {
    if (gameState.current !== 'playing') return

    distRef.current += speedRef.current * delta
    speedRef.current = SPEED_BASE + distRef.current * 0.003

    scoreTimerRef.current += delta
    if (scoreTimerRef.current > 0.1) {
      onScoreUpdate(prev => prev + 1)
      scoreTimerRef.current = 0
    }

    spawnTimerRef.current += delta
    const interval = Math.max(0.35, SPAWN_INTERVAL / (1 + distRef.current * 0.0015))
    if (spawnTimerRef.current > interval) {
      spawnTimerRef.current = 0
      const chickenColors = ['#f0e8d0', '#c87830', '#f0e0c0', '#d09040', '#e8d8b8']
      const roll = Math.random()

      if (roll < 0.15) {
        const lane = Math.floor(Math.random() * LANE_COUNT)
        collectiblesRef.current.push({
          id: idRef.current++,
          x: (lane - 1) * LANE_WIDTH,
          z: -80,
        })
      } else if (roll < 0.55 || distRef.current < 200) {
        const lane = Math.floor(Math.random() * LANE_COUNT)
        obstaclesRef.current.push({
          id: idRef.current++,
          x: (lane - 1) * LANE_WIDTH,
          z: -80,
          color: chickenColors[Math.floor(Math.random() * chickenColors.length)],
        })
      } else {
        const freeLane = Math.floor(Math.random() * LANE_COUNT)
        for (let l = 0; l < LANE_COUNT; l++) {
          if (l !== freeLane) {
            obstaclesRef.current.push({
              id: idRef.current++,
              x: (l - 1) * LANE_WIDTH,
              z: -80 - (Math.random() * 2),
              color: chickenColors[Math.floor(Math.random() * chickenColors.length)],
            })
          }
        }
      }
    }

    if (invincibleRef.current > 0) invincibleRef.current -= delta

    const catX = (laneRef.current - 1) * LANE_WIDTH
    const airborne = jumpRef.current.y > 1.5
    const immune = invincibleRef.current > 0

    obstaclesRef.current = obstaclesRef.current.filter(obs => {
      obs.z += speedRef.current * delta
      if (obs.z > 10) return false
      if (!airborne && !immune && Math.abs(obs.x - catX) < 0.9 && Math.abs(obs.z) < 1.0) {
        setExplosions(prev => [...prev, { id: idRef.current++, x: obs.x, z: obs.z, color: obs.color }])
        invincibleRef.current = 1.5
        if (livesRef.current <= 1) {
          onGameOver()
        } else {
          onHit()
        }
        return false
      }
      return true
    })

    setExplosions(prev => prev.slice(-6))

    collectiblesRef.current = collectiblesRef.current.filter(col => {
      col.z += speedRef.current * delta
      if (col.z > 10) return false
      if (Math.abs(col.x - catX) < 1.5 && Math.abs(col.z) < 1.5) {
        onScoreUpdate(prev => prev + 50)
        return false
      }
      return true
    })

    setObstacles([...obstaclesRef.current])
    setCollectibles([...collectiblesRef.current])
  })

  // Reset on restart
  useEffect(() => {
    if (gameState.current === 'playing') {
      obstaclesRef.current = []
      collectiblesRef.current = []
      spawnTimerRef.current = 0
      scoreTimerRef.current = 0
      distRef.current = 0
      speedRef.current = SPEED_BASE
      laneRef.current = 1
      jumpRef.current = { active: false, y: 0, vy: 0 }
      invincibleRef.current = 0
      setObstacles([])
      setCollectibles([])
      setExplosions([])
    }
  }, [gameState])

  return (
    <>
      <ambientLight intensity={0.6} color="#fff8e0" />
      <directionalLight position={[5, 10, 4]} intensity={1} color="#fff8e0" castShadow />
      <directionalLight position={[-8, 8, 2]} intensity={0.4} color="#ffe080" />
      <fog attach="fog" args={['#87ceeb', 40, 100]} />

      <GrassGround speedRef={speedRef} />
      <ScrollingTrees speedRef={speedRef} />
      <ScrollingScenery speedRef={speedRef} />
      <ScrollingClouds speedRef={speedRef} />
      <RunnerCat laneRef={laneRef} jumpRef={jumpRef} invincibleRef={invincibleRef} />

      {obstacles.map(obs => (
        <ObstacleChicken key={obs.id} data={obs} speedRef={speedRef} />
      ))}
      {collectibles.map(col => (
        <FishCollectible key={col.id} data={col} speedRef={speedRef} />
      ))}
      {explosions.map(ex => (
        <Explosion key={ex.id} position={[ex.x, 1, ex.z]} color={ex.color} />
      ))}
    </>
  )
}
