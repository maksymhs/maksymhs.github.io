import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vox, Head, Body, Arms, Legs } from './character/BodyParts'
import DancingCharacter from './character/DancingCharacter'
import SleepingCharacter from './character/SleepingCharacter'
import SofaSleepingCharacter from './character/SofaSleepingCharacter'
import OutdoorCharacter from './character/OutdoorCharacter'

// Re-export outdoorCollide for any legacy imports
export { outdoorCollide } from './outdoor/collisions'

export default function Character({ position = [0, 0, 0], seated = false, view, playerRef, catRef }) {
  const groupRef = useRef()
  const turnProgress = useRef(0)

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime
      // Pixel-style bobbing (stepped, not smooth)
      const step = Math.floor(t * 3) % 2
      groupRef.current.position.y = position[1] + step * 0.02

      // Rotate toward monitor when controller view
      if (view === 'controller') {
        turnProgress.current = Math.min(turnProgress.current + 0.035, 1)
      } else {
        turnProgress.current = Math.max(turnProgress.current - 0.06, 0)
      }
      const ease = 1 - Math.pow(1 - turnProgress.current, 3)
      groupRef.current.rotation.y = ease * Math.PI
      // Hide character only after fully rotated (first-person)
      groupRef.current.visible = turnProgress.current < 0.95
    }
  })

  // Dance mode: show standing dancing character in center of room
  if (view === 'dance') {
    return <DancingCharacter position={[0, 0, 0.5]} />
  }

  // Sleep mode: walk to bed and lie down
  if (view === 'sleep') {
    return <SleepingCharacter startPos={[position[0], 0, position[2]]} />
  }

  // Sofa mode: walk to sofa, sit and sleep
  if (view === 'sofa') {
    return <SofaSleepingCharacter startPos={[position[0], 0, position[2]]} />
  }

  // Walk mode: walk to door, exit, controllable outdoor character
  if (view === 'walk') {
    return <OutdoorCharacter startPos={[position[0], 0, position[2]]} playerRef={playerRef} catRef={catRef} />
  }

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
