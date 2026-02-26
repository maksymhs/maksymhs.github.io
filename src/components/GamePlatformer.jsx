import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'
import { lang } from '../i18n'
import GameSplash from './GameSplash.jsx'

const FONT = '/fonts/PressStart2P-Regular.ttf'
const GRAVITY = -25
const JUMP_FORCE = 12
const MOVE_SPEED = 8
const PLATFORM_SPACING = 4
const FALL_LIMIT = -10

function Player({ posRef, velRef, onGround, keysRef }) {
  const meshRef = useRef()

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const dt = Math.min(delta, 0.05)

    // Horizontal movement
    let mx = 0
    if (keysRef.current['ArrowLeft'] || keysRef.current['a']) mx -= 1
    if (keysRef.current['ArrowRight'] || keysRef.current['d']) mx += 1
    posRef.current.x += mx * MOVE_SPEED * dt

    // Clamp horizontal
    posRef.current.x = Math.max(-3, Math.min(3, posRef.current.x))

    // Jump
    if ((keysRef.current['ArrowUp'] || keysRef.current['w'] || keysRef.current[' ']) && onGround.current) {
      velRef.current.y = JUMP_FORCE
      onGround.current = false
    }

    // Gravity
    velRef.current.y += GRAVITY * dt
    posRef.current.y += velRef.current.y * dt
    posRef.current.z += velRef.current.z * dt

    meshRef.current.position.set(posRef.current.x, posRef.current.y, posRef.current.z)

    // Squash & stretch
    const vy = velRef.current.y
    const squash = Math.max(0.7, 1 - Math.abs(vy) * 0.01)
    const stretch = Math.min(1.4, 1 + Math.abs(vy) * 0.01)
    meshRef.current.scale.set(squash, stretch, squash)
  })

  return (
    <group ref={meshRef}>
      {/* Body */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.6, 0.8, 0.6]} />
        <meshStandardMaterial color="#ff6040" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#ffb090" />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.12, 1.1, 0.26]}>
        <boxGeometry args={[0.1, 0.1, 0.02]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      <mesh position={[0.12, 1.1, 0.26]}>
        <boxGeometry args={[0.1, 0.1, 0.02]} />
        <meshBasicMaterial color="#000" />
      </mesh>
      {/* Hat */}
      <mesh position={[0, 1.35, 0]}>
        <boxGeometry args={[0.6, 0.15, 0.6]} />
        <meshStandardMaterial color="#40c040" />
      </mesh>
      <pointLight position={[0, 1.5, 0]} color="#ff8040" intensity={0.5} distance={4} />
    </group>
  )
}

function Platform({ position, width, color, isMoving, moveRange, moveSpeed }) {
  const meshRef = useRef()
  const startPos = useRef(position[0])

  useFrame((state) => {
    if (!meshRef.current) return
    if (isMoving) {
      meshRef.current.position.x = startPos.current + Math.sin(state.clock.elapsedTime * (moveSpeed || 1.5)) * (moveRange || 2)
    }
  })

  return (
    <group ref={meshRef} position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, 0.4, 2]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Top grass */}
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[width, 0.05, 2]} />
        <meshStandardMaterial color={color === '#8b5e3c' ? '#4a8c3f' : '#3a7c2f'} />
      </mesh>
    </group>
  )
}

function Coin({ position, collected }) {
  const meshRef = useRef()

  useFrame((state) => {
    if (!meshRef.current || collected.current) return
    meshRef.current.rotation.y = state.clock.elapsedTime * 3
    meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.15
  })

  if (collected.current) return null

  return (
    <mesh ref={meshRef} position={position}>
      <cylinderGeometry args={[0.25, 0.25, 0.08, 8]} />
      <meshStandardMaterial color="#ffd700" emissive="#ff8800" emissiveIntensity={0.4} metalness={0.9} roughness={0.1} />
      <pointLight color="#ffd700" intensity={0.5} distance={2} />
    </mesh>
  )
}

function generatePlatforms(count) {
  const platforms = []
  const coins = []
  let z = 0

  // Starting platform
  platforms.push({ x: 0, y: 0, z: 0, width: 5, color: '#8b5e3c', isMoving: false })

  for (let i = 1; i < count; i++) {
    z -= PLATFORM_SPACING - Math.random() * 1
    const x = (Math.random() - 0.5) * 4
    const y = Math.max(0, platforms[i - 1].y + (Math.random() - 0.3) * 2)
    const width = 2 + Math.random() * 2
    const isMoving = Math.random() < 0.25 && i > 3
    const colors = ['#8b5e3c', '#6a4e2c', '#7a5e4c', '#5a3e1c']

    platforms.push({
      x, y: Math.min(y, 8), z, width,
      color: colors[Math.floor(Math.random() * colors.length)],
      isMoving,
      moveRange: 1.5 + Math.random(),
      moveSpeed: 1 + Math.random(),
    })

    // Coins above platforms
    if (Math.random() < 0.6) {
      coins.push({ x, y: Math.min(y, 8) + 1.5, z, collected: false })
    }
  }

  return { platforms, coins }
}

function CameraFollow({ posRef }) {
  useFrame(({ camera }) => {
    const tx = posRef.current.x * 0.3
    const ty = posRef.current.y + 5
    const tz = posRef.current.z + 10
    camera.position.x += (tx - camera.position.x) * 0.05
    camera.position.y += (ty - camera.position.y) * 0.05
    camera.position.z += (tz - camera.position.z) * 0.05
    camera.lookAt(posRef.current.x, posRef.current.y + 1, posRef.current.z - 5)
  })
  return null
}

function GameScene({ onScoreUpdate, onGameOver, onRestart, gameState }) {
  const posRef = useRef({ x: 0, y: 2, z: 0 })
  const velRef = useRef({ x: 0, y: 0, z: -6 })
  const onGround = useRef(false)
  const keysRef = useRef({})
  const coinRefs = useRef([])

  const { platforms, coins } = useMemo(() => generatePlatforms(60), [])
  coinRefs.current = useMemo(() => coins.map(() => ({ current: false })), [coins])

  useEffect(() => {
    const down = (e) => { keysRef.current[e.key] = true }
    const up = (e) => { keysRef.current[e.key] = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  useEffect(() => {
    if (gameState.current === 'playing') {
      posRef.current = { x: 0, y: 2, z: 0 }
      velRef.current = { x: 0, y: 0, z: -6 }
      onGround.current = false
      coinRefs.current.forEach(c => c.current = false)
    }
  }, [gameState])

  useFrame((_, delta) => {
    if (gameState.current !== 'playing') return
    const dt = Math.min(delta, 0.05)
    const p = posRef.current

    // Auto-forward
    velRef.current.z = -6 - (Math.abs(p.z) * 0.02)

    // Platform collision
    onGround.current = false
    for (const plat of platforms) {
      const halfW = plat.width / 2 + 0.3
      if (p.x > plat.x - halfW && p.x < plat.x + halfW &&
          p.z > plat.z - 1.2 && p.z < plat.z + 1.2 &&
          p.y >= plat.y + 0.2 && p.y <= plat.y + 1.5 &&
          velRef.current.y <= 0) {
        p.y = plat.y + 0.4
        velRef.current.y = 0
        onGround.current = true
        break
      }
    }

    // Coin collection
    coinRefs.current.forEach((ref, i) => {
      if (ref.current) return
      const c = coins[i]
      const dx = Math.abs(p.x - c.x)
      const dy = Math.abs(p.y - c.y)
      const dz = Math.abs(p.z - c.z)
      if (dx < 1 && dy < 1.5 && dz < 1.5) {
        ref.current = true
        onScoreUpdate(prev => prev + 100)
      }
    })

    // Fall detection
    if (p.y < FALL_LIMIT) {
      gameState.current = 'over'
      onGameOver()
    }
  })

  return (
    <>
      <ambientLight intensity={0.5} color="#ffe8c0" />
      <directionalLight position={[8, 15, 5]} intensity={1} color="#fff0d0" castShadow />
      <pointLight position={[0, 10, 0]} color="#80c0ff" intensity={0.3} />
      <fog attach="fog" args={['#87ceeb', 30, 80]} />
      <Stars radius={150} depth={50} count={1000} factor={3} fade speed={1} />

      <CameraFollow posRef={posRef} />
      <Player posRef={posRef} velRef={velRef} onGround={onGround} keysRef={keysRef} />

      {platforms.map((plat, i) => (
        <Platform
          key={i}
          position={[plat.x, plat.y, plat.z]}
          width={plat.width}
          color={plat.color}
          isMoving={plat.isMoving}
          moveRange={plat.moveRange}
          moveSpeed={plat.moveSpeed}
        />
      ))}

      {coins.map((coin, i) => (
        <Coin key={i} position={[coin.x, coin.y, coin.z]} collected={coinRefs.current[i]} />
      ))}

      {/* Decorative clouds */}
      {Array.from({ length: 15 }, (_, i) => (
        <mesh key={`cloud${i}`} position={[(Math.random() - 0.5) * 30, 8 + Math.random() * 5, -i * 12 - 10]}>
          <sphereGeometry args={[1.5 + Math.random(), 6, 6]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
        </mesh>
      ))}
    </>
  )
}

export default function GamePlatformer() {
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

  const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)

  const texts = {
    title: lang === 'es' ? 'SALTADOR 3D' : lang === 'ru' ? '3D ПРЫГУН' : '3D JUMPER',
    start: lang === 'es' ? 'PULSA PARA EMPEZAR' : lang === 'ru' ? 'НАЖМИТЕ ЧТОБЫ НАЧАТЬ' : 'TAP TO START',
    controls: lang === 'es' ? (isMobile ? 'Botones para moverte y saltar' : '← → para moverte, ESPACIO para saltar') : lang === 'ru' ? (isMobile ? 'Кнопки для движения и прыжка' : '← → движение, ПРОБЕЛ прыжок') : (isMobile ? 'Buttons to move and jump' : '← → to move, SPACE to jump'),
    over: lang === 'es' ? '¡CAÍSTE!' : lang === 'ru' ? 'УПАЛ!' : 'YOU FELL!',
    retry: lang === 'es' ? (isMobile ? 'Toca para reiniciar' : 'ENTER para reiniciar') : lang === 'ru' ? (isMobile ? 'Нажмите для рестарта' : 'ENTER для рестарта') : (isMobile ? 'Tap to retry' : 'ENTER to retry'),
    back: lang === 'es' ? '← Volver' : lang === 'ru' ? '← Назад' : '← Back',
    score: lang === 'es' ? 'PUNTOS' : lang === 'ru' ? 'ОЧКИ' : 'SCORE',
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#87ceeb', position: 'relative' }}>
      <Canvas shadows camera={{ position: [0, 5, 10], fov: 60 }} gl={{ antialias: true }}>
        <color attach="background" args={['#87ceeb']} />
        {started ? (
          <GameScene
            onScoreUpdate={setScore}
            onGameOver={handleGameOver}
            onRestart={handleRestart}
            gameState={gameState}
          />
        ) : (
          <>
            <ambientLight intensity={0.5} />
            <Stars radius={150} depth={50} count={1000} factor={3} fade speed={1} />
          </>
        )}
      </Canvas>

      {/* HUD */}
      {started && !gameOver && (
        <div style={{
          position: 'absolute', top: '20px', right: '20px',
          fontFamily: "'Press Start 2P', monospace", fontSize: '14px',
          color: '#fff', textShadow: '2px 2px 0 #000',
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
            background: 'rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ fontSize: isMobile ? '18px' : '28px', color: '#40c040', textShadow: '3px 3px 0 #000', marginBottom: '30px' }}>
            {texts.title}
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '14px', color: '#fff', animation: 'pulse 1.5s ease-in-out infinite', marginBottom: '20px', textShadow: '2px 2px 0 #000' }}>
            {texts.start}
          </div>
          <div style={{ fontSize: isMobile ? '8px' : '10px', color: '#e0e0e0', textShadow: '1px 1px 0 #000' }}>
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
            background: 'rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ fontSize: isMobile ? '18px' : '28px', color: '#ff4040', textShadow: '3px 3px 0 #000', marginBottom: '20px' }}>
            {texts.over}
          </div>
          <div style={{ fontSize: isMobile ? '14px' : '18px', color: '#ffd700', marginBottom: '30px', textShadow: '2px 2px 0 #000' }}>
            {texts.score}: {score}
          </div>
          <div style={{ fontSize: isMobile ? '9px' : '12px', color: '#fff', animation: 'pulse 1.5s ease-in-out infinite', textShadow: '1px 1px 0 #000' }}>
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
        <>
          <div style={{
            position: 'absolute', bottom: '40px', left: '20px',
            zIndex: 200, pointerEvents: 'auto', display: 'flex', gap: '8px',
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
          <div style={{
            position: 'absolute', bottom: '40px', right: '20px',
            zIndex: 200, pointerEvents: 'auto',
          }}>
            <button style={{ ...mobileBtn, width: '80px', height: '80px', fontSize: '12px', background: 'rgba(64,192,64,0.4)', border: '2px solid rgba(64,192,64,0.6)' }}
              onTouchStart={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' })) }}
              onTouchEnd={() => window.dispatchEvent(new KeyboardEvent('keyup', { key: ' ' }))}
            >JUMP</button>
          </div>
        </>
      )}

      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      {!splashDone && (
        <GameSplash
          title={lang === 'es' ? 'SALTADOR 3D' : lang === 'ru' ? '3D ПРЫГУН' : '3D JUMPER'}
          subtitle={lang === 'es' ? 'Salta entre plataformas' : lang === 'ru' ? 'Прыгай по платформам' : 'Jump across platforms'}
          color="#40c040"
          onFinish={() => setSplashDone(true)}
        />
      )}
    </div>
  )
}

const mobileBtn = {
  width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(0,0,0,0.35)', border: '2px solid rgba(255,255,255,0.4)',
  borderRadius: '50%', color: '#fff', fontSize: '22px', fontFamily: "'Press Start 2P', monospace",
  touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', cursor: 'pointer',
  backdropFilter: 'blur(4px)',
}
