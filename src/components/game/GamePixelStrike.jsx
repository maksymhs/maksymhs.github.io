import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { lang } from '../../i18n'
import GameSplash from './GameSplash.jsx'
import FPSScene from './pixelstrike/FPSScene'
import WeaponOverlay from './pixelstrike/Weapon'
import MobileControls from './pixelstrike/MobileControls'

const MAX_LIVES = 3

export default function GamePixelStrike() {
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(MAX_LIVES)
  const [gameOver, setGameOver] = useState(false)
  const [started, setStarted] = useState(false)
  const [splashDone, setSplashDone] = useState(false)
  const [locked, setLocked] = useState(false)
  const gameState = useRef('idle')
  const livesRef = useRef(MAX_LIVES)
  const damageOverlay = useRef(0)
  const shootFlash = useRef(0)

  const handleStart = useCallback(() => {
    setScore(0)
    setLives(MAX_LIVES)
    livesRef.current = MAX_LIVES
    setGameOver(false)
    setStarted(true)
    gameState.current = 'playing'
    setTimeout(() => document.querySelector('canvas')?.requestPointerLock(), 100)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (locked) { setLocked(false); return }
        window.location.href = '/'
        return
      }
      if (!started && splashDone && gameState.current === 'idle') handleStart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [started, splashDone, handleStart, locked])

  useEffect(() => {
    const onChange = () => setLocked(!!document.pointerLockElement)
    document.addEventListener('pointerlockchange', onChange)
    return () => document.removeEventListener('pointerlockchange', onChange)
  }, [])

  const [damageScreen, setDamageScreen] = useState(false)

  const handleHit = useCallback(() => {
    livesRef.current -= 1
    setLives(livesRef.current)
    setDamageScreen(true)
    setTimeout(() => setDamageScreen(false), 300)
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
    setTimeout(() => document.querySelector('canvas')?.requestPointerLock(), 100)
  }, [])

  const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  const mobileMoveRef = useRef({ x: 0, y: 0 })
  const mobileLookRef = useRef({ dx: 0, dy: 0 })
  const mobileShootRef = useRef(false)

  const texts = {
    title: 'PIXEL STRIKE',
    start: lang === 'es' ? (isMobile ? 'TOCA PARA EMPEZAR' : 'CLICK PARA EMPEZAR') : lang === 'ru' ? 'КЛИКНИТЕ ЧТОБЫ НАЧАТЬ' : (isMobile ? 'TAP TO START' : 'CLICK TO START'),
    controls: isMobile
      ? (lang === 'es' ? 'Joystick izq. mover, Derecha apuntar y disparar' : lang === 'ru' ? 'Джойстик слева двигаться, справа целиться и стрелять' : 'Left joystick move, Right side aim & shoot')
      : (lang === 'es' ? 'WASD mover, Click disparar, Espacio saltar, Ctrl agacharse, ESC salir' : lang === 'ru' ? 'WASD движение, Клик стрелять, Пробел прыжок, Ctrl присесть, ESC выход' : 'WASD move, Click shoot, Space jump, Ctrl crouch, ESC exit'),
    over: lang === 'es' ? '¡ELIMINADO!' : lang === 'ru' ? 'УБИТ!' : 'ELIMINATED!',
    retry: lang === 'es' ? 'Click para reiniciar' : lang === 'ru' ? 'Кликните для рестарта' : 'Click to retry',
    back: lang === 'es' ? '← Volver' : lang === 'ru' ? '← Назад' : '← Back',
    score: lang === 'es' ? 'PUNTOS' : lang === 'ru' ? 'ОЧКИ' : 'SCORE',
    wave: lang === 'es' ? 'OLEADA' : lang === 'ru' ? 'ВОЛНА' : 'WAVE',
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#c8c0a8', position: 'relative', cursor: started && !gameOver ? 'none' : 'auto' }}>
      <Canvas camera={{ position: [0, 1.6, 34], fov: 75, near: 0.1 }} gl={{ antialias: true, logarithmicDepthBuffer: true }}>
        <color attach="background" args={['#c8c0a8']} />
        {started && (
          <FPSScene
            onScoreUpdate={setScore}
            onGameOver={handleGameOver}
            onHit={handleHit}
            gameState={gameState}
            livesRef={livesRef}
            shootFlash={shootFlash}
            isMobile={isMobile}
            mobileMoveRef={mobileMoveRef}
            mobileLookRef={mobileLookRef}
            mobileShootRef={mobileShootRef}
          />
        )}
      </Canvas>

      {/* Weapon overlay — separate Canvas for FPS gun */}
      <WeaponOverlay shootFlash={shootFlash} visible={started && !gameOver} isMobile={isMobile} />

      {/* Crosshair */}
      {started && !gameOver && (locked || isMobile) && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          pointerEvents: 'none', zIndex: 60,
        }}>
          <div style={{ width: '20px', height: '2px', background: '#0f0', position: 'absolute', top: '-1px', left: '-10px' }} />
          <div style={{ width: '2px', height: '20px', background: '#0f0', position: 'absolute', top: '-10px', left: '-1px' }} />
        </div>
      )}

      {/* Damage red flash overlay */}
      {damageScreen && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,0,0,0.35)', pointerEvents: 'none', zIndex: 50 }} />
      )}

      {/* HUD */}
      {started && !gameOver && (
        <>
          <div style={{
            position: 'absolute', top: '20px', right: '20px',
            fontFamily: "'Press Start 2P', monospace", fontSize: '12px',
            color: '#fff', textShadow: '2px 2px 0 #000',
            textAlign: 'right',
          }}>
            <div>{texts.score}: {score}</div>
            <div style={{ marginTop: '8px', fontSize: '16px', letterSpacing: '4px' }}>
              {Array.from({ length: MAX_LIVES }, (_, i) => (
                <span key={i} style={{ opacity: i < lives ? 1 : 0.2 }}>
                  {i < lives ? '❤️' : '🖤'}
                </span>
              ))}
            </div>
          </div>
          {/* Ammo indicator */}
          <div style={{
            position: 'absolute', bottom: '30px', right: '30px',
            fontFamily: "'Press Start 2P', monospace", fontSize: '10px',
            color: '#ffd700', textShadow: '1px 1px 0 #000',
          }}>
            ∞ AMMO
          </div>

          {/* Mobile touch controls */}
          {isMobile && <MobileControls mobileMoveRef={mobileMoveRef} mobileLookRef={mobileLookRef} mobileShootRef={mobileShootRef} />}
        </>
      )}

      {/* Start screen */}
      {!started && splashDone && (
        <div
          onClick={handleStart}
          style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontFamily: "'Press Start 2P', monospace", color: '#fff',
            background: 'rgba(0,0,0,0.6)',
          }}
        >
          <div style={{ fontSize: isMobile ? '18px' : '28px', color: '#ff4040', textShadow: '3px 3px 0 #000', marginBottom: '30px' }}>
            {texts.title}
          </div>
          <div style={{ fontSize: isMobile ? '10px' : '14px', color: '#fff', animation: 'pulse 1.5s ease-in-out infinite', marginBottom: '20px', textShadow: '2px 2px 0 #000' }}>
            {texts.start}
          </div>
          <div style={{ fontSize: isMobile ? '8px' : '10px', color: '#ccc', textShadow: '1px 1px 0 #000' }}>
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
            background: 'rgba(0,0,0,0.7)',
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
          border: '2px solid rgba(255,64,64,0.5)', borderRadius: '6px',
          backdropFilter: 'blur(4px)', letterSpacing: '1px', zIndex: 100,
        }}
      >
        {texts.back}
      </a>

      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
      {!splashDone && (
        <GameSplash
          title="PIXEL STRIKE"
          subtitle={lang === 'es' ? '¡Elimina a los enemigos!' : lang === 'ru' ? 'Уничтожь врагов!' : 'Eliminate the enemies!'}
          color="#ff4040"
          onFinish={() => setSplashDone(true)}
        />
      )}
    </div>
  )
}
