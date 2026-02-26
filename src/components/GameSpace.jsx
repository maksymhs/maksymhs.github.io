import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Text, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { lang } from '../i18n'
import GameSplash from './GameSplash.jsx'

const FONT = '/fonts/PressStart2P-Regular.ttf'
const LANE_COUNT = 3
const LANE_WIDTH = 2.5
const SPEED_BASE = 18
const SPAWN_INTERVAL = 0.7

function Ship({ laneRef }) {
  const meshRef = useRef()
  const targetX = useRef(0)

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const tx = (laneRef.current - 1) * LANE_WIDTH
    targetX.current += (tx - targetX.current) * 8 * delta
    meshRef.current.position.x = targetX.current
    meshRef.current.rotation.z = (tx - targetX.current) * 0.3
  })

  return (
    <group ref={meshRef} position={[0, 0.5, 0]}>
      {/* Body */}
      <mesh>
        <boxGeometry args={[1.2, 0.4, 2]} />
        <meshStandardMaterial color="#4090ff" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Cockpit */}
      <mesh position={[0, 0.3, -0.3]}>
        <boxGeometry args={[0.6, 0.3, 0.8]} />
        <meshStandardMaterial color="#80d0ff" metalness={0.8} roughness={0.1} transparent opacity={0.7} />
      </mesh>
      {/* Wings */}
      <mesh position={[-0.9, 0, 0.3]}>
        <boxGeometry args={[0.8, 0.1, 1.2]} />
        <meshStandardMaterial color="#3060c0" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0.9, 0, 0.3]}>
        <boxGeometry args={[0.8, 0.1, 1.2]} />
        <meshStandardMaterial color="#3060c0" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Engine glow */}
      <mesh position={[0, 0, 1.2]}>
        <boxGeometry args={[0.4, 0.3, 0.4]} />
        <meshBasicMaterial color="#ff6020" />
      </mesh>
      <pointLight position={[0, 0, 1.5]} color="#ff4010" intensity={2} distance={4} />
    </group>
  )
}

function Asteroid({ data, speedRef }) {
  const meshRef = useRef()
  const rotSpeed = useMemo(() => [
    (Math.random() - 0.5) * 4,
    (Math.random() - 0.5) * 4,
    (Math.random() - 0.5) * 4
  ], [])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.position.z += speedRef.current * delta
    meshRef.current.rotation.x += rotSpeed[0] * delta
    meshRef.current.rotation.y += rotSpeed[1] * delta
    meshRef.current.rotation.z += rotSpeed[2] * delta
  })

  const scale = data.scale || 1
  return (
    <mesh ref={meshRef} position={[data.x, data.y, data.z]}>
      <dodecahedronGeometry args={[0.6 * scale, 0]} />
      <meshStandardMaterial color={data.color || '#8a7060'} roughness={0.8} metalness={0.2} flatShading />
    </mesh>
  )
}

function Collectible({ data, speedRef }) {
  const meshRef = useRef()

  useFrame((state, delta) => {
    if (!meshRef.current) return
    meshRef.current.position.z += speedRef.current * delta
    meshRef.current.rotation.y += 3 * delta
    meshRef.current.position.y = data.y + Math.sin(state.clock.elapsedTime * 4) * 0.2
  })

  return (
    <mesh ref={meshRef} position={[data.x, data.y, data.z]}>
      <octahedronGeometry args={[0.35, 0]} />
      <meshStandardMaterial color="#ffd700" emissive="#ff8800" emissiveIntensity={0.5} metalness={0.9} roughness={0.1} />
      <pointLight color="#ffd700" intensity={1} distance={3} />
    </mesh>
  )
}

function Tunnel() {
  const tunnelRef = useRef()
  useFrame((_, delta) => {
    if (tunnelRef.current) {
      tunnelRef.current.children.forEach(child => {
        child.position.z += 20 * delta
        if (child.position.z > 10) child.position.z -= 200
      })
    }
  })

  const rings = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      z: -i * 10,
      color: i % 2 === 0 ? '#1a1040' : '#0a0820',
    }))
  }, [])

  return (
    <group ref={tunnelRef}>
      {rings.map((ring, i) => (
        <mesh key={i} position={[0, 3, ring.z]} rotation={[0, 0, Math.PI / 4]}>
          <ringGeometry args={[8, 12, 4]} />
          <meshBasicMaterial color={ring.color} side={THREE.DoubleSide} transparent opacity={0.3} />
        </mesh>
      ))}
    </group>
  )
}

function GameScene({ onScoreUpdate, onGameOver, onRestart, gameState }) {
  const laneRef = useRef(1)
  const speedRef = useRef(SPEED_BASE)
  const obstaclesRef = useRef([])
  const collectiblesRef = useRef([])
  const spawnTimerRef = useRef(0)
  const scoreTimerRef = useRef(0)
  const [obstacles, setObstacles] = useState([])
  const [collectibles, setCollectibles] = useState([])
  const idRef = useRef(0)

  useEffect(() => {
    const handleKey = (e) => {
      if (gameState.current === 'over') {
        if (e.key === 'Enter') onRestart()
        return
      }
      if (gameState.current !== 'playing') return
      if (e.key === 'ArrowLeft' || e.key === 'a') laneRef.current = Math.max(0, laneRef.current - 1)
      if (e.key === 'ArrowRight' || e.key === 'd') laneRef.current = Math.min(2, laneRef.current + 1)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [gameState, onRestart])

  // Touch controls
  useEffect(() => {
    let startX = null
    const onStart = (e) => { startX = e.touches[0].clientX }
    const onEnd = (e) => {
      if (startX === null) return
      const dx = e.changedTouches[0].clientX - startX
      if (gameState.current === 'over') { if (Math.abs(dx) < 30) onRestart(); return }
      if (gameState.current !== 'playing') return
      if (dx > 40) laneRef.current = Math.min(2, laneRef.current + 1)
      else if (dx < -40) laneRef.current = Math.max(0, laneRef.current - 1)
      startX = null
    }
    window.addEventListener('touchstart', onStart)
    window.addEventListener('touchend', onEnd)
    return () => { window.removeEventListener('touchstart', onStart); window.removeEventListener('touchend', onEnd) }
  }, [gameState, onRestart])

  useFrame((_, delta) => {
    if (gameState.current !== 'playing') return

    speedRef.current = SPEED_BASE + scoreTimerRef.current * 0.5
    scoreTimerRef.current += delta
    if (scoreTimerRef.current > 0.1) {
      onScoreUpdate(prev => prev + 1)
      scoreTimerRef.current = 0
    }

    spawnTimerRef.current += delta
    if (spawnTimerRef.current > SPAWN_INTERVAL / (1 + speedRef.current * 0.02)) {
      spawnTimerRef.current = 0
      const lane = Math.floor(Math.random() * LANE_COUNT)
      const isCollectible = Math.random() < 0.2

      if (isCollectible) {
        const col = {
          id: idRef.current++,
          x: (lane - 1) * LANE_WIDTH,
          y: 0.8,
          z: -80,
        }
        collectiblesRef.current.push(col)
        setCollectibles([...collectiblesRef.current])
      } else {
        const colors = ['#8a7060', '#6a5a4a', '#9a8070', '#5a4a3a', '#7a6a5a']
        const obs = {
          id: idRef.current++,
          x: (lane - 1) * LANE_WIDTH,
          y: 0.5 + Math.random() * 0.5,
          z: -80,
          scale: 0.8 + Math.random() * 0.8,
          color: colors[Math.floor(Math.random() * colors.length)],
        }
        obstaclesRef.current.push(obs)
        setObstacles([...obstaclesRef.current])
      }
    }

    // Check collisions
    const shipX = (laneRef.current - 1) * LANE_WIDTH
    const shipZ = 0

    obstaclesRef.current = obstaclesRef.current.filter(obs => {
      obs.z += speedRef.current * delta
      if (obs.z > 10) return false
      const dx = Math.abs(obs.x - shipX)
      const dz = Math.abs(obs.z - shipZ)
      if (dx < 1.2 && dz < 1.5) {
        onGameOver()
        return false
      }
      return true
    })

    collectiblesRef.current = collectiblesRef.current.filter(col => {
      col.z += speedRef.current * delta
      if (col.z > 10) return false
      const dx = Math.abs(col.x - shipX)
      const dz = Math.abs(col.z - shipZ)
      if (dx < 1.5 && dz < 1.5) {
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
      speedRef.current = SPEED_BASE
      laneRef.current = 1
      setObstacles([])
      setCollectibles([])
    }
  }, [gameState])

  return (
    <>
      <ambientLight intensity={0.3} color="#4060a0" />
      <directionalLight position={[5, 10, 5]} intensity={0.8} color="#8090ff" />
      <pointLight position={[0, 2, 2]} color="#4080ff" intensity={1} distance={10} />
      <fog attach="fog" args={['#050510', 20, 80]} />

      <Stars radius={100} depth={50} count={3000} factor={4} fade speed={2} />
      <Tunnel />

      {/* Lane markers */}
      {[-1, 0, 1].map(lane => (
        <group key={lane}>
          {Array.from({ length: 20 }, (_, i) => (
            <mesh key={i} position={[lane * LANE_WIDTH, 0, -i * 6]}>
              <boxGeometry args={[0.05, 0.02, 2]} />
              <meshBasicMaterial color="#2040a0" transparent opacity={0.4} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -30]}>
        <planeGeometry args={[12, 100]} />
        <meshStandardMaterial color="#080818" metalness={0.8} roughness={0.3} />
      </mesh>

      <Ship laneRef={laneRef} />

      {obstacles.map(obs => (
        <Asteroid key={obs.id} data={obs} speedRef={speedRef} />
      ))}
      {collectibles.map(col => (
        <Collectible key={col.id} data={col} speedRef={speedRef} />
      ))}
    </>
  )
}

export default function GameSpace() {
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
    gameState.current = 'playing'
  }, [])

  const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)

  const texts = {
    title: lang === 'es' ? 'CORREDOR ESPACIAL' : lang === 'ru' ? 'КОСМИЧЕСКИЙ РАННЕР' : 'SPACE RUNNER',
    start: lang === 'es' ? 'PULSA PARA EMPEZAR' : lang === 'ru' ? 'НАЖМИТЕ ЧТОБЫ НАЧАТЬ' : 'TAP TO START',
    controls: lang === 'es' ? (isMobile ? 'Desliza ← → para moverte' : '← → para moverte') : lang === 'ru' ? (isMobile ? 'Свайп ← → для движения' : '← → для движения') : (isMobile ? 'Swipe ← → to move' : '← → to move'),
    over: lang === 'es' ? 'FIN DEL JUEGO' : lang === 'ru' ? 'КОНЕЦ ИГРЫ' : 'GAME OVER',
    retry: lang === 'es' ? (isMobile ? 'Toca para reiniciar' : 'ENTER para reiniciar') : lang === 'ru' ? (isMobile ? 'Нажмите для рестарта' : 'ENTER для рестарта') : (isMobile ? 'Tap to retry' : 'ENTER to retry'),
    back: lang === 'es' ? '← Volver' : lang === 'ru' ? '← Назад' : '← Back',
    score: lang === 'es' ? 'PUNTOS' : lang === 'ru' ? 'ОЧКИ' : 'SCORE',
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050510', position: 'relative' }}>
      <Canvas camera={{ position: [0, 4, 8], fov: 65 }} gl={{ antialias: true }}>
        <color attach="background" args={['#050510']} />
        {started ? (
          <GameScene
            onScoreUpdate={setScore}
            onGameOver={handleGameOver}
            onRestart={handleRestart}
            gameState={gameState}
          />
        ) : (
          <>
            <ambientLight intensity={0.3} color="#4060a0" />
            <Stars radius={100} depth={50} count={3000} factor={4} fade speed={2} />
          </>
        )}
      </Canvas>

      {/* HUD */}
      {started && !gameOver && (
        <div style={{
          position: 'absolute', top: '20px', right: '20px',
          fontFamily: "'Press Start 2P', monospace", fontSize: '14px',
          color: '#ffd700', textShadow: '0 0 10px rgba(255,215,0,0.5)',
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
          <div style={{ fontSize: isMobile ? '18px' : '28px', color: '#4090ff', textShadow: '0 0 20px rgba(64,144,255,0.6)', marginBottom: '30px' }}>
            {texts.title}
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '14px', color: '#80b0ff', animation: 'pulse 1.5s ease-in-out infinite', marginBottom: '20px' }}>
            {texts.start}
          </div>
          <div style={{ fontSize: isMobile ? '8px' : '10px', color: '#607090' }}>
            {texts.controls}
          </div>
        </div>
      )}

      {/* Game Over screen */}
      {gameOver && (
        <div
          onClick={handleRestart}
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontFamily: "'Press Start 2P', monospace",
            background: 'rgba(5,5,16,0.7)',
          }}
        >
          <div style={{ fontSize: isMobile ? '18px' : '28px', color: '#ff4040', textShadow: '0 0 20px rgba(255,64,64,0.6)', marginBottom: '20px' }}>
            {texts.over}
          </div>
          <div style={{ fontSize: isMobile ? '14px' : '18px', color: '#ffd700', marginBottom: '30px' }}>
            {texts.score}: {score}
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', color: '#80b0ff', animation: 'pulse 1.5s ease-in-out infinite' }}>
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
        <div style={{ position: 'absolute', bottom: '40px', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 30px', pointerEvents: 'none' }}>
          <button
            style={mobileBtn}
            onTouchStart={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' })) }}
          >◀</button>
          <button
            style={mobileBtn}
            onTouchStart={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })) }}
          >▶</button>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      {!splashDone && (
        <GameSplash
          title={lang === 'es' ? 'CORREDOR ESPACIAL' : lang === 'ru' ? 'КОСМИЧЕСКИЙ РАННЕР' : 'SPACE RUNNER'}
          subtitle={lang === 'es' ? 'Esquiva asteroides' : lang === 'ru' ? 'Уклоняйся от астероидов' : 'Dodge the asteroids'}
          color="#4090ff"
          onFinish={() => setSplashDone(true)}
        />
      )}
    </div>
  )
}

const mobileBtn = {
  width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(64,144,255,0.3)', border: '2px solid rgba(64,144,255,0.5)',
  borderRadius: '50%', color: '#fff', fontSize: '24px',
  touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', cursor: 'pointer',
  backdropFilter: 'blur(4px)', pointerEvents: 'auto',
}
