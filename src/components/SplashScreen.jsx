import React, { useState, useEffect } from 'react'
import { useProgress } from '@react-three/drei'

export default function SplashScreen({ onFinish }) {
  const { progress } = useProgress()
  const [fadeOut, setFadeOut] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (progress >= 100) {
      // Small delay before fade-out for polish
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

      {/* Name */}
      <h1 style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: 'clamp(14px, 3vw, 22px)',
        color: '#e0d8c0',
        margin: '0 0 40px',
        letterSpacing: '2px',
        textAlign: 'center',
      }}>
        Maksym
      </h1>

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
          background: 'linear-gradient(90deg, #d4a800, #f0d860)',
          borderRadius: '3px',
          transition: 'width 0.3s ease-out',
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
