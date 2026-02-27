import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text, Billboard } from '@react-three/drei'

const FONT = '/fonts/PressStart2P-Regular.ttf'

export default function ZzzEffect({ position }) {
  const g1 = useRef()
  const g2 = useRef()
  const g3 = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (g1.current) {
      const p = (t * 0.5) % 2.5
      g1.current.position.set(
        position[0] + Math.sin(t * 0.8) * 0.1,
        position[1] + p * 0.5,
        position[2]
      )
      g1.current.scale.setScalar(p < 2 ? Math.min(p * 2, 1) : Math.max(1 - (p - 2) * 2, 0))
    }
    if (g2.current) {
      const p = ((t + 0.8) * 0.5) % 2.5
      g2.current.position.set(
        position[0] + 0.2 + Math.sin(t * 0.7 + 1) * 0.08,
        position[1] + 0.2 + p * 0.5,
        position[2]
      )
      g2.current.scale.setScalar(p < 2 ? Math.min(p * 2, 1) : Math.max(1 - (p - 2) * 2, 0))
    }
    if (g3.current) {
      const p = ((t + 1.6) * 0.5) % 2.5
      g3.current.position.set(
        position[0] + 0.4 + Math.sin(t * 0.6 + 2) * 0.12,
        position[1] + 0.4 + p * 0.6,
        position[2]
      )
      g3.current.scale.setScalar(p < 2 ? Math.min(p * 2, 1) : Math.max(1 - (p - 2) * 2, 0))
    }
  })

  return (
    <group>
      <group ref={g1} position={position}>
        <Billboard>
          <Text fontSize={0.2} color="#ffffff" anchorX="center" anchorY="middle" font={FONT} material-transparent material-depthTest={false}>
            Z
          </Text>
        </Billboard>
      </group>
      <group ref={g2} position={[position[0] + 0.2, position[1] + 0.2, position[2]]}>
        <Billboard>
          <Text fontSize={0.28} color="#c0c8ff" anchorX="center" anchorY="middle" font={FONT} material-transparent material-depthTest={false}>
            Z
          </Text>
        </Billboard>
      </group>
      <group ref={g3} position={[position[0] + 0.4, position[1] + 0.4, position[2]]}>
        <Billboard>
          <Text fontSize={0.38} color="#8090e0" anchorX="center" anchorY="middle" font={FONT} material-transparent material-depthTest={false}>
            Z
          </Text>
        </Billboard>
      </group>
    </group>
  )
}
