import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vox, LANE_COUNT, LANE_WIDTH } from './RunnerEntities'

const SEGMENT_SPACING = 5
const SEGMENT_COUNT = 32
const SCROLL_LENGTH = SEGMENT_COUNT * SEGMENT_SPACING

// === Scrolling grass ground ===
export function GrassGround({ speedRef }) {
  const scrollRef = useRef()
  const fenceX = LANE_COUNT * LANE_WIDTH / 2 + 1.5

  useFrame((_, delta) => {
    if (!scrollRef.current) return
    scrollRef.current.children.forEach(child => {
      child.position.z += speedRef.current * delta
      if (child.position.z > 15) child.position.z -= SCROLL_LENGTH
    })
  })

  return (
    <group>
      {/* Main grass — extra wide to fill screen */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -40]} receiveShadow>
        <planeGeometry args={[80, 160]} />
        <meshLambertMaterial color="#4a8c3f" flatShading />
      </mesh>
      {/* Darker grass edges */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-25, -0.06, -40]}>
        <planeGeometry args={[30, 160]} />
        <meshLambertMaterial color="#3d7a34" flatShading />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[25, -0.06, -40]}>
        <planeGeometry args={[30, 160]} />
        <meshLambertMaterial color="#3d7a34" flatShading />
      </mesh>
      {/* Path / dirt road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, -40]}>
        <planeGeometry args={[LANE_COUNT * LANE_WIDTH + 1, 180]} />
        <meshLambertMaterial color="#c8b080" flatShading />
      </mesh>
      {/* Scrolling segments: lane dividers + fences */}
      <group ref={scrollRef}>
        {Array.from({ length: SEGMENT_COUNT }, (_, i) => (
          <group key={i} position={[0, 0, -i * SEGMENT_SPACING]}>
            {/* Lane dividers */}
            <Vox position={[-LANE_WIDTH / 2 - 0.3, 0, 0]} args={[0.06, 0.04, 1.5]} color="#a09060" />
            <Vox position={[LANE_WIDTH / 2 + 0.3, 0, 0]} args={[0.06, 0.04, 1.5]} color="#a09060" />
            {/* Left fence */}
            <Vox position={[-fenceX, 0.3, SEGMENT_SPACING * 0.4]} args={[0.15, 0.6, 0.15]} color="#8b6530" />
            <Vox position={[-fenceX, 0.3, -SEGMENT_SPACING * 0.4]} args={[0.15, 0.6, 0.15]} color="#8b6530" />
            <Vox position={[-fenceX, 0.45, 0]} args={[0.08, 0.06, SEGMENT_SPACING * 0.8 + 0.15]} color="#a07540" />
            <Vox position={[-fenceX, 0.2, 0]} args={[0.08, 0.06, SEGMENT_SPACING * 0.8 + 0.15]} color="#a07540" />
            {/* Right fence */}
            <Vox position={[fenceX, 0.3, SEGMENT_SPACING * 0.4]} args={[0.15, 0.6, 0.15]} color="#8b6530" />
            <Vox position={[fenceX, 0.3, -SEGMENT_SPACING * 0.4]} args={[0.15, 0.6, 0.15]} color="#8b6530" />
            <Vox position={[fenceX, 0.45, 0]} args={[0.08, 0.06, SEGMENT_SPACING * 0.8 + 0.15]} color="#a07540" />
            <Vox position={[fenceX, 0.2, 0]} args={[0.08, 0.06, SEGMENT_SPACING * 0.8 + 0.15]} color="#a07540" />
          </group>
        ))}
      </group>
    </group>
  )
}

// === Scrolling scenery (flowers, bushes) ===
export function ScrollingScenery({ speedRef }) {
  const ref = useRef()
  const items = useMemo(() => {
    const arr = []
    const flowerColors = ['#ff6080', '#ffb040', '#ff80c0', '#f0e040', '#c060ff', '#60c0ff']
    for (let i = 0; i < 40; i++) {
      const side = i % 2 === 0 ? -1 : 1
      const dist = LANE_COUNT * LANE_WIDTH / 2 + 2 + Math.random() * 15
      const isBush = Math.random() < 0.3
      arr.push({
        x: side * dist,
        z: -i * 3.5,
        isBush,
        color: isBush ? '#3a8a30' : flowerColors[Math.floor(Math.random() * flowerColors.length)],
        scale: 0.3 + Math.random() * 0.4,
      })
    }
    return arr
  }, [])

  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.children.forEach(child => {
      child.position.z += speedRef.current * delta
      if (child.position.z > 15) child.position.z -= 140
    })
  })

  return (
    <group ref={ref}>
      {items.map((it, i) => (
        <group key={i} position={[it.x, 0, it.z]}>
          {it.isBush ? (
            <>
              <Vox position={[0, 0.25 * it.scale * 3, 0]} args={[0.8 * it.scale * 3, 0.5 * it.scale * 3, 0.8 * it.scale * 3]} color={it.color} />
              <Vox position={[0.15, 0.35 * it.scale * 3, 0.1]} args={[0.5 * it.scale * 3, 0.3 * it.scale * 3, 0.5 * it.scale * 3]} color="#48a040" />
            </>
          ) : (
            <>
              <Vox position={[0, 0.1, 0]} args={[0.04, 0.2, 0.04]} color="#408030" />
              <Vox position={[0, 0.22, 0]} args={[0.12 * it.scale * 2, 0.1 * it.scale * 2, 0.12 * it.scale * 2]} color={it.color} />
            </>
          )}
        </group>
      ))}
    </group>
  )
}

// === Scrolling trees ===
export function ScrollingTrees({ speedRef }) {
  const ref = useRef()
  const trees = useMemo(() => {
    const t = []
    const leafColors = ['#38a038', '#48b048', '#30a030', '#50b850', '#40a040']
    for (let i = 0; i < 20; i++) {
      const side = i % 2 === 0 ? -1 : 1
      t.push({
        x: side * (LANE_COUNT * LANE_WIDTH / 2 + 3 + Math.random() * 2),
        z: -i * 7,
        trunkH: 1.2 + Math.random() * 0.8,
        leafR: 1 + Math.random() * 0.6,
        leafColor: leafColors[Math.floor(Math.random() * leafColors.length)],
      })
    }
    for (let i = 0; i < 30; i++) {
      const side = i % 2 === 0 ? -1 : 1
      t.push({
        x: side * (LANE_COUNT * LANE_WIDTH / 2 + 8 + Math.random() * 12),
        z: -i * 4.7 - 2,
        trunkH: 1.5 + Math.random() * 1.2,
        leafR: 1.2 + Math.random() * 0.8,
        leafColor: leafColors[Math.floor(Math.random() * leafColors.length)],
      })
    }
    return t
  }, [])

  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.children.forEach(child => {
      child.position.z += speedRef.current * delta
      if (child.position.z > 15) child.position.z -= 140
    })
  })

  return (
    <group ref={ref}>
      {trees.map((tree, i) => (
        <group key={i} position={[tree.x, 0, tree.z]}>
          <Vox position={[0, tree.trunkH / 2, 0]} args={[0.4, tree.trunkH, 0.4]} color="#6a4e2c" />
          <Vox position={[0, tree.trunkH + tree.leafR * 0.5, 0]} args={[tree.leafR * 1.4, tree.leafR * 1.2, tree.leafR * 1.4]} color={tree.leafColor} />
          <Vox position={[0, tree.trunkH + tree.leafR * 1.1, 0]} args={[tree.leafR * 0.9, tree.leafR * 0.8, tree.leafR * 0.9]} color={tree.leafColor} />
        </group>
      ))}
    </group>
  )
}

// === Clouds ===
export function ScrollingClouds({ speedRef }) {
  const ref = useRef()
  const clouds = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    x: (Math.random() - 0.5) * 20,
    y: 6 + Math.random() * 4,
    z: -i * 14,
    scale: 0.8 + Math.random() * 0.6,
  })), [])

  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.children.forEach(child => {
      child.position.z += speedRef.current * 0.3 * delta
      if (child.position.z > 15) child.position.z -= 140
    })
  })

  return (
    <group ref={ref}>
      {clouds.map((c, i) => (
        <group key={i} position={[c.x, c.y, c.z]} scale={c.scale}>
          <mesh><boxGeometry args={[2, 0.6, 1]} /><meshBasicMaterial color="#fff" transparent opacity={0.8} /></mesh>
          <mesh position={[0.6, 0.2, 0]}><boxGeometry args={[1.2, 0.5, 0.8]} /><meshBasicMaterial color="#fff" transparent opacity={0.7} /></mesh>
          <mesh position={[-0.5, 0.15, 0]}><boxGeometry args={[1, 0.4, 0.7]} /><meshBasicMaterial color="#fff" transparent opacity={0.75} /></mesh>
        </group>
      ))}
    </group>
  )
}
