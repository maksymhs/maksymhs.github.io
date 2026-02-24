import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Room from './components/Room.jsx'
import Character from './components/Character.jsx'
import ChatOverlay from './components/ChatOverlay.jsx'

export default function App() {
  return (
    <>
      <div className="canvas-container">
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
            <Room />
            <Character position={[0, 0, -0.6]} seated />
          </Suspense>

          <OrbitControls
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
          />
        </Canvas>
      </div>

      <ChatOverlay />
    </>
  )
}
