import React, { useState, useEffect } from 'react'

export default function GameSplash({ title, subtitle, color = '#f0d860', onFinish }) {
  const [progress, setProgress] = useState(0)
  const [fadeOut, setFadeOut] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let raf
    let start = null
    const duration = 1200

    const tick = (ts) => {
      if (!start) start = ts
      const elapsed = ts - start
      const p = Math.min(100, (elapsed / duration) * 100)
      setProgress(p)
      if (p < 100) {
        raf = requestAnimationFrame(tick)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    if (progress >= 100) {
      const t1 = setTimeout(() => setFadeOut(true), 400)
      const t2 = setTimeout(() => {
        setHidden(true)
        onFinish?.()
      }, 1200)
      return () => { clearTimeout(t1); clearTimeout(t2) }
    }
  }, [progress, onFinish])

  if (hidden) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1a1a2e',
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.8s ease-out',
      pointerEvents: fadeOut ? 'none' : 'auto',
    }}>
      {/* Favicon logo */}
      <img
        src="/favicon.svg"
        alt="Logo"
        style={{
          width: 'clamp(48px, 10vw, 72px)',
          height: 'auto',
          imageRendering: 'pixelated',
          margin: '0 0 16px',
        }}
      />

      {/* Game title */}
      <h1 style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 'clamp(16px, 4vw, 28px)',
        color: color,
        margin: '0 0 12px',
        letterSpacing: '2px',
        textAlign: 'center',
        textShadow: `0 0 20px ${color}60`,
      }}>
        {title}
      </h1>

      {/* Subtitle */}
      {subtitle && (
        <p style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: 'clamp(8px, 1.5vw, 11px)',
          color: '#8a8a9e',
          margin: '0 0 40px',
          textAlign: 'center',
        }}>
          {subtitle}
        </p>
      )}

      {/* Progress bar container */}
      <div style={{
        width: 'min(240px, 60vw)',
        height: '6px',
        background: '#2a2a3e',
        borderRadius: '3px',
        overflow: 'hidden',
      }}>
        {/* Progress bar fill */}
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${color}90, ${color})`,
          borderRadius: '3px',
          transition: 'width 0.15s ease-out',
        }} />
      </div>

      {/* Percentage */}
      <p style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: '9px',
        color: '#5a5a6e',
        margin: '12px 0 0',
      }}>
        {Math.round(progress)}%
      </p>
    </div>
  )
}
