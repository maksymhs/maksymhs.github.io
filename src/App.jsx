import React, { Suspense, useState, useRef, useCallback, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import Room from './components/Room.jsx'
import Character from './components/Character.jsx'
import ChatOverlay from './components/ChatOverlay.jsx'
import OpenBook from './components/OpenBook.jsx'
import FloatingScrolls, { FloatingScrollsOverlay } from './components/FloatingScrolls.jsx'
import SplashScreen from './components/SplashScreen.jsx'

const DEFAULT_CAM = { position: [0, 2.5, 2.8], target: [0, 1.2, -0.5] }
const BOOKSHELF_CAM = { position: [2.8, 1.8, -1.5], target: [3.8, 1.4, -1.5] }
const CHEST_CAM = { position: [-1.8, 1.8, -1.8], target: [-3.2, 0.8, -3.2] }
const GITHUB_CAM = { position: [2.5, 2.2, -2.5], target: [3, 2.2, -3.95] }
const LINKEDIN_CAM = { position: [-2.5, 2.2, -2.5], target: [-3, 2.2, -3.95] }

const CAT_CAM_OFFSET = { x: 0, y: 1.2, z: 1.5 }
const CONTROLLER_CAM = { position: [0, 1.24, -0.55], target: [0, 1.22, -1.95] }
const DANCE_CAM = { position: [1.5, 1.8, 1.5], target: [0, 0.8, 0] }

const CAM_MAP = { default: DEFAULT_CAM, bookshelf: BOOKSHELF_CAM, chest: CHEST_CAM, github: GITHUB_CAM, linkedin: LINKEDIN_CAM, controller: CONTROLLER_CAM, dance: DANCE_CAM }

function CameraAnimator({ view, controlsRef, onTransitionEnd, catRef }) {
  const animating = useRef(false)
  const targetPos = useRef(new THREE.Vector3())
  const targetLook = useRef(new THREE.Vector3())
  const prevView = useRef(view)

  useFrame(({ camera }) => {
    if (prevView.current !== view) {
      prevView.current = view

      const cam = CAM_MAP[view] || DEFAULT_CAM
      if (view === 'default') {
        camera.position.set(...cam.position)
        if (controlsRef.current) {
          controlsRef.current.target.set(...cam.target)
          controlsRef.current.update()
        }
        animating.current = false
        onTransitionEnd?.()
        return
      }

      animating.current = true
    }

    // Follow cat: camera behind cat looking in its heading direction
    if (view === 'cat' && catRef?.current) {
      const cp = catRef.current.position
      const ry = catRef.current.rotation.y
      // Behind the cat (opposite of heading) + elevated
      const behindDist = 1.2
      const camHeight = 0.8
      targetPos.current.set(
        cp.x - Math.sin(ry) * behindDist,
        cp.y + camHeight,
        cp.z - Math.cos(ry) * behindDist
      )
      // Look ahead of the cat in its heading direction
      const lookAhead = 0.5
      targetLook.current.set(
        cp.x + Math.sin(ry) * lookAhead,
        cp.y + 0.25,
        cp.z + Math.cos(ry) * lookAhead
      )

      camera.position.lerp(targetPos.current, 0.04)
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLook.current, 0.04)
        controlsRef.current.update()
      }
      return
    }

    if (!animating.current) return

    const cam = CAM_MAP[view] || DEFAULT_CAM
    targetPos.current.set(...cam.position)
    targetLook.current.set(...cam.target)

    const speed = 0.05
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

function fireKey(key, type = 'keydown') {
  window.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true }))
}

const dpadBtn = {
  width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)',
  borderRadius: '8px', color: '#fff', fontSize: '18px', fontFamily: 'monospace',
  touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', cursor: 'pointer',
}

function DPad() {
  return (
    <div style={{
      position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
      zIndex: 200, pointerEvents: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
    }}>
      {/* Up */}
      <button style={dpadBtn} onTouchStart={(e) => { e.preventDefault(); fireKey('ArrowUp') }} onTouchEnd={() => fireKey('ArrowUp', 'keyup')}>▲</button>
      <div style={{ display: 'flex', gap: '4px' }}>
        {/* Left */}
        <button style={dpadBtn} onTouchStart={(e) => { e.preventDefault(); fireKey('ArrowLeft') }} onTouchEnd={() => fireKey('ArrowLeft', 'keyup')}>◀</button>
        {/* Space / Drop */}
        <button style={{ ...dpadBtn, fontSize: '10px', fontFamily: "'Press Start 2P', monospace" }} onTouchStart={(e) => { e.preventDefault(); fireKey(' ') }}>DROP</button>
        {/* Right */}
        <button style={dpadBtn} onTouchStart={(e) => { e.preventDefault(); fireKey('ArrowRight') }} onTouchEnd={() => fireKey('ArrowRight', 'keyup')}>▶</button>
      </div>
      {/* Down */}
      <button style={dpadBtn} onTouchStart={(e) => { e.preventDefault(); fireKey('ArrowDown') }} onTouchEnd={() => fireKey('ArrowDown', 'keyup')}>▼</button>
      {/* ESC button */}
      <button
        style={{ ...dpadBtn, width: 'auto', padding: '8px 16px', fontSize: '10px', fontFamily: "'Press Start 2P', monospace", marginTop: '8px' }}
        onTouchStart={(e) => { e.preventDefault(); fireKey('Escape') }}
      >
        ← EXIT
      </button>
    </div>
  )
}

export default function App() {
  const [view, setView] = useState('default')
  const controlsRef = useRef()

  const [chestOpen, setChestOpen] = useState(false)
  const [selectedBook, setSelectedBook] = useState(null)
  const [cardSelected, setCardSelected] = useState(false)
  const [gameActive, setGameActive] = useState(false)
  const catRef = useRef()
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const handleBookshelfClick = useCallback(() => {
    setView('bookshelf')
  }, [])

  const handleChestClick = useCallback(() => {
    setView('chest')
    setChestOpen(true)
  }, [])

  const handleGithubFrameClick = useCallback(() => {
    setView('github')
  }, [])

  const handleLinkedinFrameClick = useCallback(() => {
    setView('linkedin')
  }, [])

  const handleCatClick = useCallback(() => {
    setView('cat')
  }, [])

  const handleControllerClick = useCallback(() => {
    setView('controller')
  }, [])

  const handleHeadphonesClick = useCallback(() => {
    setView('dance')
  }, [])

  const handleBookClick = useCallback((bookData) => {
    setSelectedBook(bookData)
  }, [])

  const handleCloseBook = useCallback(() => {
    setSelectedBook(null)
  }, [])

  const handleBack = useCallback(() => {
    setSelectedBook(null)
    setChestOpen(false)
    setView('default')
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (selectedBook) { setSelectedBook(null); return }
        handleBack()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleBack, selectedBook])

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
            <Room onBookshelfClick={handleBookshelfClick} onChestClick={handleChestClick} chestOpen={chestOpen} onBookClick={handleBookClick} view={view} onGithubFrameClick={handleGithubFrameClick} onLinkedinFrameClick={handleLinkedinFrameClick} onBack={handleBack} onCatClick={handleCatClick} catRef={catRef} onControllerClick={handleControllerClick} onGameChange={setGameActive} onHeadphonesClick={handleHeadphonesClick} />
            <Character position={[0, 0, -0.6]} seated view={view} />
          </Suspense>

          <CameraAnimator view={view} controlsRef={controlsRef} catRef={catRef} />

          <OpenBook book={selectedBook} onClose={handleCloseBook} />
          <FloatingScrolls open={chestOpen} view={view} onCardSelect={setCardSelected} />

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

      <FloatingScrollsOverlay show={cardSelected} onClose={() => FloatingScrolls.deselect?.()} />
      <FloatingScrollsOverlay show={!!selectedBook} onClose={handleCloseBook} />
      <FloatingScrollsOverlay show={view === 'github' || view === 'linkedin' || view === 'cat' || view === 'controller' || view === 'dance'} onClose={handleBack} />
      {(view === 'github' || view === 'linkedin') && (
        <div
          onClick={() => {
            if (view === 'github') window.open('https://github.com/maksymhs', '_blank')
            if (view === 'linkedin') window.open('https://www.linkedin.com/in/herasymenko', '_blank')
            handleBack()
          }}
          style={{
            position: 'absolute', top: '70px', left: '50%', transform: 'translateX(-50%)',
            fontFamily: "'Press Start 2P', monospace", fontSize: window.innerWidth < 768 ? '9px' : '11px',
            color: '#fff', cursor: 'pointer', pointerEvents: 'auto',
            textShadow: '0 0 10px rgba(0,0,0,0.9), 2px 2px 0 #000',
            zIndex: 100, whiteSpace: 'nowrap',
            padding: '10px 20px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px',
          }}
        >
          {view === 'github' ? '[ Click ] Visit GitHub' : '[ Click ] Visit LinkedIn'}
        </div>
      )}
      {isMobile && gameActive && <DPad />}
      <ChatOverlay visible={view === 'default'} />
      <SplashScreen />

    </>
  )
}
