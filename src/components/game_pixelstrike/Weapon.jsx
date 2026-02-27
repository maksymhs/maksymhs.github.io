import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'

function WeaponGun({ shootFlash, isMobile }) {
  const ref = useRef()
  const flashRef = useRef()
  const baseX = isMobile ? 0.22 : 0.3
  const baseY = isMobile ? -0.18 : -0.25
  const baseZ = isMobile ? -0.35 : -0.5
  const sc = isMobile ? 1.3 : 1

  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    const recoil = shootFlash.current > 0 ? 0.06 : 0
    ref.current.position.set(baseX, baseY + Math.cos(t * 2) * 0.004, baseZ + recoil)
    ref.current.rotation.x = Math.sin(t * 1.5) * 0.003 - recoil * 1.5
    if (flashRef.current) flashRef.current.visible = shootFlash.current > 0.02
    if (shootFlash.current > 0) shootFlash.current -= 0.016
  })

  return (
    <group ref={ref} position={[baseX, baseY, baseZ]} scale={[sc, sc, sc]}>
      <mesh position={[0, 0, 0]}><boxGeometry args={[0.07, 0.09, 0.45]} /><meshLambertMaterial color="#3a3a3a" /></mesh>
      <mesh position={[0, 0.02, -0.3]}><boxGeometry args={[0.035, 0.035, 0.25]} /><meshLambertMaterial color="#4a4a4a" /></mesh>
      <mesh position={[0, 0.05, -0.42]}><boxGeometry args={[0.02, 0.04, 0.02]} /><meshLambertMaterial color="#333" /></mesh>
      <mesh position={[0, 0.06, -0.05]}><boxGeometry args={[0.04, 0.03, 0.02]} /><meshLambertMaterial color="#333" /></mesh>
      <mesh position={[0, -0.01, 0.28]}><boxGeometry args={[0.06, 0.07, 0.18]} /><meshLambertMaterial color="#6a4830" /></mesh>
      <mesh position={[0, -0.04, 0.38]}><boxGeometry args={[0.05, 0.12, 0.06]} /><meshLambertMaterial color="#6a4830" /></mesh>
      <mesh position={[0, -0.08, 0.08]}><boxGeometry args={[0.05, 0.12, 0.07]} /><meshLambertMaterial color="#5a3820" /></mesh>
      <mesh position={[0, -0.05, -0.15]}><boxGeometry args={[0.04, 0.07, 0.1]} /><meshLambertMaterial color="#6a4830" /></mesh>
      <mesh position={[0, -0.1, -0.02]}><boxGeometry args={[0.045, 0.1, 0.06]} /><meshLambertMaterial color="#2a2a2a" /></mesh>
      <mesh position={[0, -0.04, -0.18]}><boxGeometry args={[0.08, 0.08, 0.08]} /><meshLambertMaterial color="#f5dcc0" /></mesh>
      <mesh position={[0, -0.07, 0.1]}><boxGeometry args={[0.08, 0.08, 0.08]} /><meshLambertMaterial color="#f5dcc0" /></mesh>
      <mesh ref={flashRef} position={[0, 0.02, -0.46]} visible={false}>
        <boxGeometry args={[0.14, 0.14, 0.06]} />
        <meshBasicMaterial color="#ffcc00" />
      </mesh>
    </group>
  )
}

export default function WeaponOverlay({ shootFlash, visible, isMobile }) {
  if (!visible) return null
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 40 }}>
      <Canvas camera={{ position: [0, 0, 0], fov: isMobile ? 60 : 50, near: 0.01 }} gl={{ alpha: true, antialias: false }} style={{ background: 'transparent' }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 3, 1]} intensity={1} />
        <WeaponGun shootFlash={shootFlash} isMobile={isMobile} />
      </Canvas>
    </div>
  )
}
