import React, { Suspense, useState, useRef, useCallback, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import Room from './components/Room.jsx'
import Character from './components/Character.jsx'
import ChatOverlay from './components/ChatOverlay.jsx'

const DEFAULT_CAM = { position: [0, 2.5, 2.8], target: [0, 1.2, -0.5] }
const BOOKSHELF_CAM = { position: [2.8, 1.8, -1.5], target: [3.8, 1.4, -1.5] }
const CHEST_CAM = { position: [-1.8, 1.2, -1.8], target: [-3.2, 0.35, -3.2] }

const CAM_MAP = { default: DEFAULT_CAM, bookshelf: BOOKSHELF_CAM, chest: CHEST_CAM }

function CameraAnimator({ view, controlsRef, onTransitionEnd }) {
  const animating = useRef(false)
  const targetPos = useRef(new THREE.Vector3())
  const targetLook = useRef(new THREE.Vector3())
  const prevView = useRef(view)

  useFrame(({ camera }) => {
    if (prevView.current !== view) {
      animating.current = true
      prevView.current = view
    }

    if (!animating.current) return

    const cam = CAM_MAP[view] || DEFAULT_CAM
    targetPos.current.set(...cam.position)
    targetLook.current.set(...cam.target)

    const speed = view === 'default' ? 0.08 : 0.05
    camera.position.lerp(targetPos.current, speed)
    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLook.current, speed)
      controlsRef.current.update()
    }

    if (camera.position.distanceTo(targetPos.current) < 0.01) {
      camera.position.copy(targetPos.current)
      if (controlsRef.current) {
        controlsRef.current.target.copy(targetLook.current)
        controlsRef.current.update()
      }
      animating.current = false
      onTransitionEnd?.()
    }
  })

  return null
}

export default function App() {
  const [view, setView] = useState('default')
  const controlsRef = useRef()

  const [chestOpen, setChestOpen] = useState(false)

  const handleBookshelfClick = useCallback(() => {
    setView('bookshelf')
  }, [])

  const handleChestClick = useCallback(() => {
    setView('chest')
    setChestOpen(true)
  }, [])

  const handleBack = useCallback(() => {
    setChestOpen(false)
    setView('default')
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') handleBack()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleBack])

  return (
    <>
      <div className="canvas-container">
        {view !== 'default' && (
          <button
            onClick={handleBack}
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              zIndex: 10,
              padding: '10px 20px',
              background: 'rgba(0,0,0,0.6)',
              color: 'white',
              border: '2px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontFamily: 'monospace',
              backdropFilter: 'blur(4px)',
            }}
            onMouseEnter={(e) => (e.target.style.background = 'rgba(0,0,0,0.8)')}
            onMouseLeave={(e) => (e.target.style.background = 'rgba(0,0,0,0.6)')}
          >
            ← Volver
          </button>
        )}
        <Canvas
          shadows
          camera={{ position: [0, 2.5, 2.8], fov: 55 }}
          gl={{ antialias: false, alpha: false }}
        >
          <color attach="background" args={['#70c8f0']} />

          <ambientLight intensity={0.6} color="#fff8e0" />
          <directionalLight
            position={[5, 10, 4]}
            intensity={1.0}
            color="#fff8e0"
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-left={-8}
            shadow-camera-right={8}
            shadow-camera-top={8}
            shadow-camera-bottom={-8}
            shadow-camera-near={0.5}
            shadow-camera-far={30}
            shadow-bias={-0.002}
          />
          {/* Warm fill light from left window - no shadow */}
          <directionalLight
            position={[-8, 8, 2]}
            intensity={0.4}
            color="#ffe080"
          />
          <pointLight position={[-2, 3, -2]} intensity={0.3} color="#ffe080" distance={8} />
          <pointLight position={[2, 2, -1]} intensity={0.2} color="#80c0ff" distance={6} />

          <Suspense fallback={null}>
            <Room onBookshelfClick={handleBookshelfClick} onChestClick={handleChestClick} chestOpen={chestOpen} />
            <Character position={[0, 0, -0.6]} seated />
          </Suspense>

          <CameraAnimator view={view} controlsRef={controlsRef} />

          <OrbitControls
            ref={controlsRef}
            makeDefault
            minPolarAngle={Math.PI / 3.5}
            maxPolarAngle={Math.PI / 2.2}
            minDistance={2}
            maxDistance={4.5}
            minAzimuthAngle={-Math.PI / 2.5}
            maxAzimuthAngle={Math.PI / 2.5}
            enablePan={false}
            autoRotate={false}
            target={[0, 1.2, -0.5]}
            enableRotate={view === 'default'}
            enableZoom={view === 'default'}
          />
        </Canvas>
      </div>

      <ChatOverlay visible={view === 'default'} />
    </>
  )
}
