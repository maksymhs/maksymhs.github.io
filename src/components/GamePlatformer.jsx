import React, { useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { lang } from '../i18n'

const FONT = '/fonts/PressStart2P-Regular.ttf'

function RotatingSign() {
  const ref = useRef()
  useFrame((state) => {
    if (!ref.current) return
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.3
    ref.current.position.y = Math.sin(state.clock.elapsedTime) * 0.15
  })

  const title = lang === 'es' ? 'EN CONSTRUCCIÓN' : lang === 'ru' ? 'В РАЗРАБОТКЕ' : 'UNDER CONSTRUCTION'
  const sub = lang === 'es' ? '3D Jumper - Próximamente' : lang === 'ru' ? '3D Прыгун - Скоро' : '3D Jumper - Coming Soon'

  return (
    <group ref={ref}>
      <Text position={[0, 0.6, 0]} fontSize={0.5} color="#40c040" anchorX="center" anchorY="middle" font={FONT}>
        {title}
      </Text>
      <Text position={[0, -0.2, 0]} fontSize={0.2} color="#80e080" anchorX="center" anchorY="middle" font={FONT}>
        {sub}
      </Text>
      {/* Construction bars */}
      {[-1.5, -0.5, 0.5, 1.5].map((x, i) => (
        <mesh key={i} position={[x, -0.8, 0]}>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#ffcc00' : '#333'} />
        </mesh>
      ))}
    </group>
  )
}

export default function GamePlatformer() {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') window.location.href = '/' }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const back = lang === 'es' ? '← Volver' : lang === 'ru' ? '← Назад' : '← Back'

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a2e', position: 'relative' }}>
      <Canvas camera={{ position: [0, 0, 4], fov: 60 }}>
        <color attach="background" args={['#1a1a2e']} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 5, 3]} intensity={0.8} />
        <RotatingSign />
      </Canvas>
      <a
        href="/"
        style={{
          position: 'absolute', top: '16px', left: '16px',
          fontFamily: "'Press Start 2P', monospace", fontSize: '11px',
          color: '#fff', textDecoration: 'none',
          padding: '8px 16px', background: 'rgba(30,40,50,0.75)',
          border: '2px solid rgba(64,192,64,0.5)', borderRadius: '6px',
          backdropFilter: 'blur(4px)', letterSpacing: '1px', zIndex: 100,
        }}
      >
        {back}
      </a>
    </div>
  )
}
