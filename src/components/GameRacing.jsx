import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'
import { lang } from '../i18n'
import GameSplash from './GameSplash.jsx'

const ROAD_WIDTH = 10
const LANE_W = ROAD_WIDTH / 3
const CAR_SPEED = 30
const STEER_SPEED = 12
const OBSTACLE_INTERVAL = 0.6

function PlayerCar({ posRef, keysRef }) {
  const meshRef = useRef()
  const tiltRef = useRef(0)

  useFrame((_, delta) => {
    if (!meshRef.current) return
    let mx = 0
    if (keysRef.current['ArrowLeft'] || keysRef.current['a']) mx = -1
    if (keysRef.current['ArrowRight'] || keysRef.current['d']) mx = 1

    posRef.current.x += mx * STEER_SPEED * delta
    posRef.current.x = Math.max(-ROAD_WIDTH / 2 + 1, Math.min(ROAD_WIDTH / 2 - 1, posRef.current.x))

    tiltRef.current += (mx * 0.15 - tiltRef.current) * 5 * delta

    meshRef.current.position.x = posRef.current.x
    meshRef.current.rotation.z = tiltRef.current
  })

  return (
    <group ref={meshRef} position={[0, 0.3, 0]}>
      {/* Car body */}
      <mesh castShadow>
        <boxGeometry args={[1.6, 0.5, 3]} />
        <meshStandardMaterial color="#ff3030" metalness={0.7} roughness={0.2} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 0.4, -0.2]} castShadow>
        <boxGeometry args={[1.2, 0.4, 1.4]} />
        <meshStandardMaterial color="#cc2020" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Windshield */}
      <mesh position={[0, 0.4, 0.5]}>
        <boxGeometry args={[1.1, 0.35, 0.05]} />
        <meshStandardMaterial color="#80c0ff" metalness={0.9} roughness={0.1} transparent opacity={0.5} />
      </mesh>
      {/* Wheels */}
      {[[-0.8, -0.1, 0.8], [0.8, -0.1, 0.8], [-0.8, -0.1, -0.8], [0.8, -0.1, -0.8]].map((pos, i) => (
        <mesh key={i} position={pos}>
          <boxGeometry args={[0.2, 0.4, 0.5]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      ))}
      {/* Headlights */}
      <mesh position={[-0.5, 0.1, 1.51]}>
        <boxGeometry args={[0.3, 0.15, 0.02]} />
        <meshBasicMaterial color="#ffff80" />
      </mesh>
      <mesh position={[0.5, 0.1, 1.51]}>
        <boxGeometry args={[0.3, 0.15, 0.02]} />
        <meshBasicMaterial color="#ffff80" />
      </mesh>
      {/* Tail lights */}
      <mesh position={[-0.5, 0.1, -1.51]}>
        <boxGeometry args={[0.3, 0.15, 0.02]} />
        <meshBasicMaterial color="#ff2020" />
      </mesh>
      <mesh position={[0.5, 0.1, -1.51]}>
        <boxGeometry args={[0.3, 0.15, 0.02]} />
        <meshBasicMaterial color="#ff2020" />
      </mesh>
      <pointLight position={[0, 0.3, 2]} color="#ffff80" intensity={2} distance={8} />
    </group>
  )
}

function EnemyCar({ data, speedRef }) {
  const meshRef = useRef()

  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.position.z += speedRef.current * delta
  })

  return (
    <group ref={meshRef} position={[data.x, 0.3, data.z]}>
      <mesh>
        <boxGeometry args={[1.4, 0.5, 2.8]} />
        <meshStandardMaterial color={data.color} metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.35, -0.1]}>
        <boxGeometry args={[1.1, 0.35, 1.2]} />
        <meshStandardMaterial color={data.cabinColor} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Tail lights */}
      <mesh position={[0, 0.1, -1.41]}>
        <boxGeometry args={[1.2, 0.1, 0.02]} />
        <meshBasicMaterial color="#ff4040" />
      </mesh>
    </group>
  )
}

function Road({ speedRef }) {
  const stripesRef = useRef()

  useFrame((_, delta) => {
    if (!stripesRef.current) return
    stripesRef.current.children.forEach(child => {
      child.position.z += speedRef.current * delta
      if (child.position.z > 20) child.position.z -= 120
    })
  })

  return (
    <group>
      {/* Road surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -30]} receiveShadow>
        <planeGeometry args={[ROAD_WIDTH + 2, 120]} />
        <meshStandardMaterial color="#333340" />
      </mesh>
      {/* Road edges */}
      <mesh position={[-(ROAD_WIDTH / 2 + 0.5), 0.05, -30]}>
        <boxGeometry args={[0.3, 0.15, 120]} />
        <meshStandardMaterial color="#ffcc00" emissive="#ff8800" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[(ROAD_WIDTH / 2 + 0.5), 0.05, -30]}>
        <boxGeometry args={[0.3, 0.15, 120]} />
        <meshStandardMaterial color="#ffcc00" emissive="#ff8800" emissiveIntensity={0.3} />
      </mesh>
      {/* Lane stripes */}
      <group ref={stripesRef}>
        {Array.from({ length: 30 }, (_, i) => (
          <group key={i}>
            <mesh position={[-LANE_W / 2 - 0.5, 0.01, -i * 4]}>
              <boxGeometry args={[0.1, 0.01, 2]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
            </mesh>
            <mesh position={[LANE_W / 2 + 0.5, 0.01, -i * 4]}>
              <boxGeometry args={[0.1, 0.01, 2]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
            </mesh>
          </group>
        ))}
      </group>
      {/* Sidewalks */}
      <mesh position={[-(ROAD_WIDTH / 2 + 1.5), 0.15, -30]}>
        <boxGeometry args={[2, 0.3, 120]} />
        <meshStandardMaterial color="#555560" />
      </mesh>
      <mesh position={[(ROAD_WIDTH / 2 + 1.5), 0.15, -30]}>
        <boxGeometry args={[2, 0.3, 120]} />
        <meshStandardMaterial color="#555560" />
      </mesh>
    </group>
  )
}

function Buildings({ speedRef }) {
  const groupRef = useRef()
  const buildings = useMemo(() => {
    const b = []
    const colors = ['#2a2040', '#302848', '#1a1830', '#252038', '#3a2858']
    const neonColors = ['#ff00ff', '#00ffff', '#ff4080', '#80ff40', '#4080ff', '#ffff00']
    for (let i = 0; i < 30; i++) {
      const side = i % 2 === 0 ? -1 : 1
      const h = 4 + Math.random() * 12
      b.push({
        x: side * (ROAD_WIDTH / 2 + 3 + Math.random() * 3),
        y: h / 2,
        z: -i * 6,
        w: 2 + Math.random() * 2,
        h,
        d: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        neon: neonColors[Math.floor(Math.random() * neonColors.length)],
        hasNeon: Math.random() < 0.6,
      })
    }
    return b
  }, [])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    groupRef.current.children.forEach(child => {
      child.position.z += speedRef.current * delta
      if (child.position.z > 20) child.position.z -= 180
    })
  })

  return (
    <group ref={groupRef}>
      {buildings.map((b, i) => (
        <group key={i} position={[b.x, b.y, b.z]}>
          <mesh>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial color={b.color} />
          </mesh>
          {/* Windows */}
          {Array.from({ length: Math.floor(b.h / 1.5) }, (_, j) => (
            <mesh key={j} position={[b.x > 0 ? -b.w / 2 - 0.01 : b.w / 2 + 0.01, -b.h / 2 + 1 + j * 1.5, 0]}>
              <planeGeometry args={[0.4, 0.5]} />
              <meshBasicMaterial color={Math.random() > 0.3 ? '#ffe080' : '#304060'} transparent opacity={0.8} />
            </mesh>
          ))}
          {/* Neon strip */}
          {b.hasNeon && (
            <mesh position={[b.x > 0 ? -b.w / 2 - 0.02 : b.w / 2 + 0.02, -b.h / 2 + 2, 0]}>
              <boxGeometry args={[0.05, 0.8, b.d * 0.8]} />
              <meshBasicMaterial color={b.neon} />
              <pointLight color={b.neon} intensity={0.5} distance={4} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

function CameraRig({ posRef }) {
  useFrame(({ camera }, delta) => {
    const tx = posRef.current.x * 0.3
    camera.position.x += (tx - camera.position.x) * 3 * delta
    camera.position.y = 3
    camera.position.z = 6
    camera.lookAt(posRef.current.x * 0.2, 1, -10)
  })
  return null
}

function GameScene({ onScoreUpdate, onGameOver, gameState }) {
  const posRef = useRef({ x: 0 })
  const keysRef = useRef({})
  const speedRef = useRef(CAR_SPEED)
  const spawnTimerRef = useRef(0)
  const scoreTimerRef = useRef(0)
  const [enemies, setEnemies] = useState([])
  const enemiesRef = useRef([])
  const idRef = useRef(0)
  const distRef = useRef(0)

  useEffect(() => {
    const down = (e) => { keysRef.current[e.key] = true }
    const up = (e) => { keysRef.current[e.key] = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  useEffect(() => {
    if (gameState.current === 'playing') {
      posRef.current = { x: 0 }
      speedRef.current = CAR_SPEED
      enemiesRef.current = []
      spawnTimerRef.current = 0
      scoreTimerRef.current = 0
      distRef.current = 0
      setEnemies([])
    }
  }, [gameState])

  useFrame((_, delta) => {
    if (gameState.current !== 'playing') return
    const dt = Math.min(delta, 0.05)

    distRef.current += speedRef.current * dt
    speedRef.current = CAR_SPEED + distRef.current * 0.01

    scoreTimerRef.current += dt
    if (scoreTimerRef.current > 0.1) {
      onScoreUpdate(prev => prev + Math.floor(speedRef.current / 10))
      scoreTimerRef.current = 0
    }

    spawnTimerRef.current += dt
    const interval = OBSTACLE_INTERVAL / (1 + distRef.current * 0.001)
    if (spawnTimerRef.current > interval) {
      spawnTimerRef.current = 0
      const lanes = [-LANE_W, 0, LANE_W]
      const lane = lanes[Math.floor(Math.random() * 3)]
      const carColors = ['#4060c0', '#c0c040', '#40c060', '#c040c0', '#c08040', '#4090c0']
      const color = carColors[Math.floor(Math.random() * carColors.length)]
      enemiesRef.current.push({
        id: idRef.current++,
        x: lane,
        z: -80,
        color,
        cabinColor: '#' + (parseInt(color.slice(1), 16) - 0x202020).toString(16).padStart(6, '0'),
      })
    }

    // Update enemies & collisions
    const px = posRef.current.x
    let hit = false
    enemiesRef.current = enemiesRef.current.filter(e => {
      e.z += speedRef.current * dt
      if (e.z > 15) return false
      const dx = Math.abs(e.x - px)
      const dz = Math.abs(e.z)
      if (dx < 1.4 && dz < 2.5) { hit = true; return false }
      return true
    })

    if (hit) {
      gameState.current = 'over'
      onGameOver()
    }

    setEnemies([...enemiesRef.current])
  })

  return (
    <>
      <ambientLight intensity={0.2} color="#4040a0" />
      <directionalLight position={[5, 15, 5]} intensity={0.4} color="#8080ff" />
      <pointLight position={[0, 5, 0]} color="#ff4080" intensity={0.5} distance={20} />
      <fog attach="fog" args={['#0a0818', 20, 80]} />
      <Stars radius={100} depth={50} count={2000} factor={4} fade speed={1} />

      <CameraRig posRef={posRef} />
      <Road speedRef={speedRef} />
      <Buildings speedRef={speedRef} />
      <PlayerCar posRef={posRef} keysRef={keysRef} />

      {enemies.map(e => (
        <EnemyCar key={e.id} data={e} speedRef={speedRef} />
      ))}
    </>
  )
}

export default function GameRacing() {
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [started, setStarted] = useState(false)
  const [splashDone, setSplashDone] = useState(false)
  const gameState = useRef('idle')

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') window.location.href = '/' }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleStart = useCallback(() => {
    setScore(0)
    setGameOver(false)
    setStarted(true)
    gameState.current = 'playing'
  }, [])

  const handleGameOver = useCallback(() => {
    gameState.current = 'over'
    setGameOver(true)
  }, [])

  const handleRestart = useCallback(() => {
    setScore(0)
    setGameOver(false)
    setStarted(false)
    setTimeout(() => {
      setStarted(true)
      gameState.current = 'playing'
    }, 100)
  }, [])

  useEffect(() => {
    const handleKey = (e) => {
      if (gameState.current === 'over' && e.key === 'Enter') handleRestart()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleRestart])

  // Touch swipe
  useEffect(() => {
    let startX = null
    const onStart = (e) => { startX = e.touches[0].clientX }
    const onEnd = (e) => {
      if (startX === null) return
      const dx = e.changedTouches[0].clientX - startX
      if (gameState.current === 'over') { if (Math.abs(dx) < 30) handleRestart(); return }
      startX = null
    }
    window.addEventListener('touchstart', onStart)
    window.addEventListener('touchend', onEnd)
    return () => { window.removeEventListener('touchstart', onStart); window.removeEventListener('touchend', onEnd) }
  }, [handleRestart])

  const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)

  const texts = {
    title: lang === 'es' ? 'CARRERA NEÓN' : lang === 'ru' ? 'НЕОНОВАЯ ГОНКА' : 'NEON RACER',
    start: lang === 'es' ? 'PULSA PARA EMPEZAR' : lang === 'ru' ? 'НАЖМИТЕ ЧТОБЫ НАЧАТЬ' : 'TAP TO START',
    controls: lang === 'es' ? (isMobile ? 'Botones ← → para esquivar' : '← → para esquivar coches') : lang === 'ru' ? (isMobile ? 'Кнопки ← → чтобы уклоняться' : '← → чтобы уклоняться') : (isMobile ? 'Buttons ← → to dodge' : '← → to dodge cars'),
    over: lang === 'es' ? '¡CHOQUE!' : lang === 'ru' ? 'АВАРИЯ!' : 'CRASH!',
    retry: lang === 'es' ? (isMobile ? 'Toca para reiniciar' : 'ENTER para reiniciar') : lang === 'ru' ? (isMobile ? 'Нажмите для рестарта' : 'ENTER для рестарта') : (isMobile ? 'Tap to retry' : 'ENTER to retry'),
    back: lang === 'es' ? '← Volver' : lang === 'ru' ? '← Назад' : '← Back',
    score: lang === 'es' ? 'PUNTOS' : lang === 'ru' ? 'ОЧКИ' : 'SCORE',
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0818', position: 'relative' }}>
      <Canvas shadows camera={{ position: [0, 3, 6], fov: 65 }} gl={{ antialias: true }}>
        <color attach="background" args={['#0a0818']} />
        {started ? (
          <GameScene
            onScoreUpdate={setScore}
            onGameOver={handleGameOver}
            gameState={gameState}
          />
        ) : (
          <>
            <ambientLight intensity={0.2} color="#4040a0" />
            <Stars radius={100} depth={50} count={2000} factor={4} fade speed={1} />
          </>
        )}
      </Canvas>

      {/* HUD */}
      {started && !gameOver && (
        <div style={{
          position: 'absolute', top: '20px', right: '20px',
          fontFamily: "'Press Start 2P', monospace", fontSize: '14px',
          color: '#ff00ff', textShadow: '0 0 10px rgba(255,0,255,0.6)',
        }}>
          {texts.score}: {score}
        </div>
      )}

      {/* Start screen */}
      {!started && (
        <div
          onClick={handleStart}
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontFamily: "'Press Start 2P', monospace", color: '#fff',
          }}
        >
          <div style={{ fontSize: isMobile ? '18px' : '28px', color: '#ff00ff', textShadow: '0 0 30px rgba(255,0,255,0.6)', marginBottom: '30px' }}>
            {texts.title}
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '14px', color: '#00ffff', animation: 'pulse 1.5s ease-in-out infinite', marginBottom: '20px' }}>
            {texts.start}
          </div>
          <div style={{ fontSize: isMobile ? '8px' : '10px', color: '#607090' }}>
            {texts.controls}
          </div>
        </div>
      )}

      {/* Game Over */}
      {gameOver && (
        <div
          onClick={handleRestart}
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontFamily: "'Press Start 2P', monospace",
            background: 'rgba(10,8,24,0.7)',
          }}
        >
          <div style={{ fontSize: isMobile ? '18px' : '28px', color: '#ff4040', textShadow: '0 0 20px rgba(255,64,64,0.6)', marginBottom: '20px' }}>
            {texts.over}
          </div>
          <div style={{ fontSize: isMobile ? '14px' : '18px', color: '#ff00ff', marginBottom: '30px' }}>
            {texts.score}: {score}
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', color: '#00ffff', animation: 'pulse 1.5s ease-in-out infinite' }}>
            {texts.retry}
          </div>
        </div>
      )}

      {/* Back button */}
      <a
        href="/"
        style={{
          position: 'absolute', top: '16px', left: '16px',
          fontFamily: "'Press Start 2P', monospace", fontSize: '11px',
          color: '#fff', textDecoration: 'none',
          padding: '8px 16px', background: 'rgba(30,40,50,0.75)',
          border: '2px solid rgba(100,140,180,0.5)', borderRadius: '6px',
          backdropFilter: 'blur(4px)', letterSpacing: '1px',
          zIndex: 100,
        }}
        onMouseEnter={(e) => (e.target.style.background = 'rgba(30,40,50,0.9)')}
        onMouseLeave={(e) => (e.target.style.background = 'rgba(30,40,50,0.75)')}
      >
        {texts.back}
      </a>

      {/* Mobile controls */}
      {isMobile && started && !gameOver && (
        <div style={{
          position: 'absolute', bottom: '40px', left: 0, right: 0,
          display: 'flex', justifyContent: 'space-between', padding: '0 30px',
          pointerEvents: 'none',
        }}>
          <button style={mobileBtn}
            onTouchStart={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' })) }}
            onTouchEnd={() => window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' }))}
          >◀</button>
          <button style={mobileBtn}
            onTouchStart={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })) }}
            onTouchEnd={() => window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }))}
          >▶</button>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      {!splashDone && (
        <GameSplash
          title={lang === 'es' ? 'CARRERA NEÓN' : lang === 'ru' ? 'НЕОНОВАЯ ГОНКА' : 'NEON RACER'}
          subtitle={lang === 'es' ? 'Esquiva el tráfico' : lang === 'ru' ? 'Уклоняйся от машин' : 'Dodge the traffic'}
          color="#ff00ff"
          onFinish={() => setSplashDone(true)}
        />
      )}
    </div>
  )
}

const mobileBtn = {
  width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,0,255,0.3)', border: '2px solid rgba(255,0,255,0.5)',
  borderRadius: '50%', color: '#fff', fontSize: '24px',
  touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', cursor: 'pointer',
  backdropFilter: 'blur(4px)', pointerEvents: 'auto',
}
