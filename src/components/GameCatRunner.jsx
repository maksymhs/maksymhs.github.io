import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { lang } from '../i18n'
import GameSplash from './GameSplash.jsx'
import GameScene from './game_catrunner/GameScene'

const MAX_LIVES = 3

const mobileBtn = {
  width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(240,168,96,0.4)', border: '2px solid rgba(240,168,96,0.6)',
  borderRadius: '50%', color: '#fff', fontSize: '24px',
  touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', cursor: 'pointer',
  backdropFilter: 'blur(4px)', pointerEvents: 'auto',
}

export default function GameCatRunner() {
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(MAX_LIVES)
  const [gameOver, setGameOver] = useState(false)
  const [started, setStarted] = useState(false)
  const [splashDone, setSplashDone] = useState(false)
  const gameState = useRef('idle')
  const livesRef = useRef(MAX_LIVES)

  const handleStart = useCallback(() => {
    setScore(0)
    setLives(MAX_LIVES)
    livesRef.current = MAX_LIVES
    setGameOver(false)
    setStarted(true)
    gameState.current = 'playing'
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { window.location.href = '/'; return }
      if (!started && splashDone && gameState.current === 'idle') handleStart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [started, splashDone, handleStart])

  const handleHit = useCallback(() => {
    livesRef.current -= 1
    setLives(livesRef.current)
  }, [])

  const handleGameOver = useCallback(() => {
    livesRef.current = 0
    setLives(0)
    gameState.current = 'over'
    setGameOver(true)
  }, [])

  const handleRestart = useCallback(() => {
    setScore(0)
    setLives(MAX_LIVES)
    livesRef.current = MAX_LIVES
    setGameOver(false)
    gameState.current = 'playing'
  }, [])

  const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)

  const texts = {
    title: lang === 'es' ? 'CAT RUNNER' : lang === 'ru' ? 'КОШАЧИЙ РАННЕР' : 'CAT RUNNER',
    start: lang === 'es' ? 'PULSA PARA EMPEZAR' : lang === 'ru' ? 'НАЖМИТЕ ЧТОБЫ НАЧАТЬ' : 'TAP TO START',
    controls: lang === 'es' ? (isMobile ? 'Desliza ← → esquivar, ↑ saltar' : '← → esquivar, ESPACIO saltar') : lang === 'ru' ? (isMobile ? 'Свайп ← → уклон, ↑ прыжок' : '← → уклон, ПРОБЕЛ прыжок') : (isMobile ? 'Swipe ← → dodge, ↑ jump' : '← → dodge, SPACE jump'),
    over: lang === 'es' ? '¡TE PILLARON!' : lang === 'ru' ? 'ПОЙМАЛИ!' : 'CAUGHT!',
    retry: lang === 'es' ? (isMobile ? 'Toca para reiniciar' : 'ENTER para reiniciar') : lang === 'ru' ? (isMobile ? 'Нажмите для рестарта' : 'ENTER для рестарта') : (isMobile ? 'Tap to retry' : 'ENTER to retry'),
    back: lang === 'es' ? '← Volver' : lang === 'ru' ? '← Назад' : '← Back',
    score: lang === 'es' ? 'PUNTOS' : lang === 'ru' ? 'ОЧКИ' : 'SCORE',
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#87ceeb', position: 'relative' }}>
      <Canvas shadows camera={{ position: isMobile ? [0, 6, 12] : [0, 4, 8], fov: isMobile ? 60 : 55 }} gl={{ antialias: false }}>
        <color attach="background" args={['#87ceeb']} />
        {started ? (
          <GameScene
            onScoreUpdate={setScore}
            onGameOver={handleGameOver}
            onHit={handleHit}
            onRestart={handleRestart}
            gameState={gameState}
            livesRef={livesRef}
          />
        ) : (
          <>
            <ambientLight intensity={0.6} color="#fff8e0" />
            <directionalLight position={[5, 10, 4]} intensity={1} color="#fff8e0" />
          </>
        )}
      </Canvas>

      {/* HUD */}
      {started && !gameOver && (
        <div style={{
          position: 'absolute', top: '20px', right: '20px',
          fontFamily: "'Press Start 2P', monospace", fontSize: '14px',
          color: '#fff', textShadow: '2px 2px 0 #000, 0 0 10px rgba(240,168,96,0.5)',
          textAlign: 'right',
        }}>
          <div>{texts.score}: {score}</div>
          <div style={{ marginTop: '8px', fontSize: '18px', letterSpacing: '4px' }}>
            {Array.from({ length: MAX_LIVES }, (_, i) => (
              <span key={i} style={{ opacity: i < lives ? 1 : 0.2, filter: i < lives ? 'none' : 'grayscale(1)' }}>
                {i < lives ? '❤️' : '🖤'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Start screen */}
      {!started && splashDone && (
        <div
          onClick={handleStart}
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontFamily: "'Press Start 2P', monospace", color: '#fff',
            background: 'rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ fontSize: isMobile ? '18px' : '28px', color: '#f0a860', textShadow: '3px 3px 0 #000', marginBottom: '30px' }}>
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

      {/* Game Over screen */}
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
          <div style={{ position: 'absolute', bottom: '120px', right: '25px', pointerEvents: 'none' }}>
            <button
              style={{ ...mobileBtn, width: '80px', height: '80px', fontSize: '12px', fontFamily: "'Press Start 2P', monospace" }}
              onTouchStart={(e) => { e.preventDefault(); window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' })) }}
            >JUMP</button>
          </div>
        </>
      )}

      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      {!splashDone && (
        <GameSplash
          title="CAT RUNNER"
          subtitle={lang === 'es' ? '¡Esquiva o salta las gallinas!' : lang === 'ru' ? 'Уклоняйся или прыгай!' : 'Dodge or jump over chickens!'}
          color="#f0a860"
          onFinish={() => setSplashDone(true)}
        />
      )}
    </div>
  )
}
