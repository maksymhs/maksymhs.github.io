import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

// Helper: pixel-art voxel
function Vox({ position, args = [1, 1, 1], color, castShadow = true }) {
  return (
    <mesh position={position} castShadow={castShadow}>
      <boxGeometry args={args} />
      <meshLambertMaterial color={color} flatShading />
    </mesh>
  )
}

function Head({ position }) {
  const headRef = useRef()

  useFrame((state) => {
    if (headRef.current) {
      const t = state.clock.elapsedTime
      headRef.current.rotation.y = Math.sin(t * 0.5) * 0.15
      headRef.current.rotation.z = Math.sin(t * 0.3) * 0.05
    }
  })

  return (
    <group ref={headRef} position={position}>
      {/* Head - blocky cube */}
      <Vox position={[0, 0, 0]} args={[0.5, 0.5, 0.5]} color="#f5dcc0" />

      {/* Hair - top */}
      <Vox position={[0, 0.28, 0]} args={[0.54, 0.1, 0.54]} color="#6a4830" />
      {/* Hair - back */}
      <Vox position={[0, 0.08, -0.24]} args={[0.54, 0.4, 0.08]} color="#6a4830" />
      {/* Hair - sides */}
      <Vox position={[-0.26, 0.1, 0]} args={[0.06, 0.3, 0.5]} color="#6a4830" />
      <Vox position={[0.26, 0.12, 0]} args={[0.06, 0.26, 0.5]} color="#6a4830" />
      {/* Fringe - swept to the right */}
      <Vox position={[-0.08, 0.22, 0.22]} args={[0.36, 0.1, 0.1]} color="#6a4830" />
      <Vox position={[-0.18, 0.2, 0.24]} args={[0.14, 0.08, 0.06]} color="#7a5838" />

      {/* Eyes - big pixel squares */}
      {[-0.12, 0.12].map((x, i) => (
        <group key={i} position={[x, 0.02, 0.26]}>
          {/* Eye white */}
          <Vox position={[0, 0, 0]} args={[0.12, 0.12, 0.02]} color="#ffffff" />
          {/* Pupil */}
          <Vox position={[0.01, -0.01, 0.015]} args={[0.07, 0.07, 0.02]} color="#202020" />
          {/* Shine */}
          <Vox position={[0.03, 0.03, 0.02]} args={[0.03, 0.03, 0.01]} color="#ffffff" />
        </group>
      ))}

      {/* Eyebrows */}
      <Vox position={[-0.12, 0.1, 0.26]} args={[0.12, 0.03, 0.02]} color="#5a3828" />
      <Vox position={[0.12, 0.1, 0.26]} args={[0.12, 0.03, 0.02]} color="#5a3828" />

      {/* Mouth - small pixel line */}
      <Vox position={[0, -0.12, 0.26]} args={[0.1, 0.03, 0.02]} color="#c08070" />

      {/* Nose */}
      <Vox position={[0, -0.04, 0.27]} args={[0.04, 0.05, 0.02]} color="#e8c8a8" />
    </group>
  )
}

function Body({ position }) {
  return (
    <group position={position}>
      {/* Torso - black t-shirt */}
      <Vox position={[0, 0, 0]} args={[0.5, 0.48, 0.32]} color="#f0d040" />

      {/* T-shirt logo (small detail) */}
      <Vox position={[-0.08, 0.08, 0.165]} args={[0.12, 0.06, 0.01]} color="#1a1a1a" />

      {/* Collar - round neck */}
      <Vox position={[0, 0.22, 0.06]} args={[0.3, 0.06, 0.2]} color="#f0d040" />
      {/* Neck */}
      <Vox position={[0, 0.26, 0]} args={[0.16, 0.06, 0.14]} color="#f5dcc0" />
    </group>
  )
}

function Arms({ position }) {
  const leftArmRef = useRef()
  const rightArmRef = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = Math.sin(t * 1.2) * 0.12
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = Math.sin(t * 1.2 + Math.PI) * 0.12
    }
  })

  return (
    <group position={position}>
      {/* Left arm */}
      <group ref={leftArmRef} position={[-0.34, 0.08, 0]}>
        <Vox position={[0, 0, 0]} args={[0.16, 0.36, 0.16]} color="#f0d040" />
        {/* Hand */}
        <Vox position={[0, -0.22, 0]} args={[0.12, 0.12, 0.12]} color="#f5dcc0" />
      </group>

      {/* Right arm */}
      <group ref={rightArmRef} position={[0.34, 0.08, 0]}>
        <Vox position={[0, 0, 0]} args={[0.16, 0.36, 0.16]} color="#f0d040" />
        {/* Hand */}
        <Vox position={[0, -0.22, 0]} args={[0.12, 0.12, 0.12]} color="#f5dcc0" />
      </group>
    </group>
  )
}

function Legs({ position }) {
  return (
    <group position={position}>
      {[-0.11, 0.11].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          {/* Leg - dark jeans */}
          <Vox position={[0, 0, 0]} args={[0.18, 0.32, 0.18]} color="#3060a0" />
          {/* Shoe - white sneakers */}
          <Vox position={[0, -0.19, 0.03]} args={[0.2, 0.1, 0.26]} color="#e8e8e8" />
        </group>
      ))}
    </group>
  )
}

export default function Character({ position = [0, 0, 0], seated = false }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime
      // Pixel-style bobbing (stepped, not smooth)
      const step = Math.floor(t * 3) % 2
      groupRef.current.position.y = position[1] + step * 0.02
    }
  })

  if (seated) {
    // Chair seat top is at y ~0.55. Body (h=0.48) center at 0.55+0.24=0.79
    return (
      <group ref={groupRef} position={position}>
        <Head position={[0, 1.24, 0]} />
        <Body position={[0, 0.79, 0]} />
        {/* Arms reaching forward toward desk */}
        <group position={[0, 0.79, 0]}>
          <group position={[-0.34, 0.04, 0]}>
            <Vox position={[0, 0, 0.08]} args={[0.16, 0.16, 0.3]} color="#f0d040" />
            <Vox position={[0, 0, 0.26]} args={[0.12, 0.12, 0.12]} color="#f5dcc0" />
          </group>
          <group position={[0.34, 0.04, 0]}>
            <Vox position={[0, 0, 0.08]} args={[0.16, 0.16, 0.3]} color="#f0d040" />
            <Vox position={[0, 0, 0.26]} args={[0.12, 0.12, 0.12]} color="#f5dcc0" />
          </group>
        </group>
        {/* Seated legs - on chair seat */}
        <group position={[0, 0.55, 0]}>
          {[-0.11, 0.11].map((x, i) => (
            <group key={i} position={[x, 0, 0]}>
              {/* Upper leg - horizontal on seat */}
              <Vox position={[0, 0, 0.14]} args={[0.18, 0.14, 0.34]} color="#3060a0" />
              {/* Lower leg - hanging down */}
              <Vox position={[0, -0.2, 0.3]} args={[0.16, 0.28, 0.16]} color="#3060a0" />
              {/* Shoe - white sneakers */}
              <Vox position={[0, -0.37, 0.33]} args={[0.2, 0.1, 0.26]} color="#e8e8e8" />
            </group>
          ))}
        </group>
      </group>
    )
  }

  return (
    <group ref={groupRef} position={position}>
      <Head position={[0, 1.65, 0]} />
      <Body position={[0, 1.2, 0]} />
      <Arms position={[0, 1.2, 0]} />
      <Legs position={[0, 0.78, 0]} />
    </group>
  )
}
