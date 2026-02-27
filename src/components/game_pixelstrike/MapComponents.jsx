import React from 'react'
import * as THREE from 'three'
import { MAP_WALLS, getWallType } from './MapData'

// === Voxel helper ===
export function Vox({ position, args = [1, 1, 1], color }) {
  return (
    <mesh position={position}>
      <boxGeometry args={args} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

// === StoneWall — lightweight wall with horizontal stone block lines (max 3 lines) ===
export function BrickWall({ position, args = [1, 1, 1], baseColor = '#908870', mortarColor = '#787060' }) {
  const [sx, sy, sz] = args
  const m = 0.035
  const count = Math.min(3, Math.max(1, Math.floor(sy / 1.2)))
  const spacing = sy / (count + 1)
  return (
    <group position={position}>
      <mesh><boxGeometry args={args} /><meshBasicMaterial color={baseColor} /></mesh>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} position={[0, -sy / 2 + spacing * (i + 1), 0]}>
          <boxGeometry args={[sx + 0.01, m, sz + 0.01]} />
          <meshBasicMaterial color={mortarColor} />
        </mesh>
      ))}
    </group>
  )
}

// === Crate — wooden box with cross trim ===
export function Crate({ position, args = [1, 1, 1], baseColor = '#a08040', trimColor = '#685020' }) {
  const [sx, sy, sz] = args
  const t = 0.04
  return (
    <group position={position}>
      <mesh><boxGeometry args={args} /><meshBasicMaterial color={baseColor} /></mesh>
      <mesh position={[0, sy * 0.3, 0]}><boxGeometry args={[sx + 0.01, t, sz + 0.01]} /><meshBasicMaterial color={trimColor} /></mesh>
      <mesh position={[0, -sy * 0.3, 0]}><boxGeometry args={[sx + 0.01, t, sz + 0.01]} /><meshBasicMaterial color={trimColor} /></mesh>
      <mesh position={[0, 0, sz / 2 + 0.005]}><boxGeometry args={[t, sy + 0.01, t]} /><meshBasicMaterial color={trimColor} /></mesh>
      <mesh position={[sx * 0.3, 0, sz / 2 + 0.005]}><boxGeometry args={[t, sy + 0.01, t]} /><meshBasicMaterial color={trimColor} /></mesh>
      <mesh position={[-sx * 0.3, 0, sz / 2 + 0.005]}><boxGeometry args={[t, sy + 0.01, t]} /><meshBasicMaterial color={trimColor} /></mesh>
      <mesh position={[sx / 2 + 0.005, 0, 0]}><boxGeometry args={[t, sy + 0.01, t]} /><meshBasicMaterial color={trimColor} /></mesh>
      <mesh position={[sx / 2 + 0.005, 0, sz * 0.3]}><boxGeometry args={[t, sy + 0.01, t]} /><meshBasicMaterial color={trimColor} /></mesh>
      <mesh position={[sx / 2 + 0.005, 0, -sz * 0.3]}><boxGeometry args={[t, sy + 0.01, t]} /><meshBasicMaterial color={trimColor} /></mesh>
    </group>
  )
}

// === Map geometry ===
export default function DustMap() {
  return (
    <group>
      {/* Ground — sandy desert floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[84, 84]} />
        <meshBasicMaterial color="#706848" />
      </mesh>
      {/* Ground tile grid — stone slab pattern */}
      {Array.from({ length: 21 }, (_, i) => {
        const p = -40 + i * 4
        return (
          <React.Fragment key={`g${i}`}>
            <mesh position={[p, 0.005, 0]}><boxGeometry args={[0.06, 0.01, 84]} /><meshBasicMaterial color="#605838" /></mesh>
            <mesh position={[0, 0.005, p]}><boxGeometry args={[84, 0.01, 0.06]} /><meshBasicMaterial color="#605838" /></mesh>
          </React.Fragment>
        )
      })}

      {/* Walls — use type-based coloring, crates get special treatment */}
      {MAP_WALLS.map((w, i) => {
        const t = getWallType(w)
        if (t === 'crate') return <Crate key={i} position={w.pos} args={w.size} baseColor="#b89050" trimColor="#7a5828" />
        if (t === 'tallcrate') return <Crate key={i} position={w.pos} args={w.size} baseColor="#a88040" trimColor="#6a4820" />
        if (t === 'barrel') return (
          <group key={i} position={w.pos}>
            <mesh><boxGeometry args={w.size} /><meshBasicMaterial color="#907848" /></mesh>
            <mesh><boxGeometry args={[w.size[0] + 0.01, 0.04, w.size[2] + 0.01]} /><meshBasicMaterial color="#685030" /></mesh>
            <mesh position={[0, w.size[1] * 0.3, 0]}><boxGeometry args={[w.size[0] + 0.01, 0.04, w.size[2] + 0.01]} /><meshBasicMaterial color="#685030" /></mesh>
            <mesh position={[0, -w.size[1] * 0.3, 0]}><boxGeometry args={[w.size[0] + 0.01, 0.04, w.size[2] + 0.01]} /><meshBasicMaterial color="#685030" /></mesh>
          </group>
        )
        if (t === 'platform') return <BrickWall key={i} position={w.pos} args={w.size} baseColor="#888068" mortarColor="#706850" />
        if (t === 'stairs') return <BrickWall key={i} position={w.pos} args={w.size} baseColor="#807860" mortarColor="#686048" />
        return <BrickWall key={i} position={w.pos} args={w.size} baseColor="#908870" mortarColor="#787060" />
      })}

      {/* Sky dome */}
      <mesh>
        <sphereGeometry args={[120, 32, 32]} />
        <meshBasicMaterial color="#b0d4e8" side={THREE.BackSide} />
      </mesh>
      {/* Horizon warm band */}
      <mesh>
        <sphereGeometry args={[119, 32, 16, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45]} />
        <meshBasicMaterial color="#d8d0c0" side={THREE.BackSide} transparent opacity={0.5} />
      </mesh>
      {/* Sun glow */}
      <mesh position={[40, 55, -60]}>
        <sphereGeometry args={[6, 16, 16]} />
        <meshBasicMaterial color="#fff8d0" />
      </mesh>
      {/* Sun halo */}
      <mesh position={[40, 55, -60]}>
        <sphereGeometry args={[12, 16, 16]} />
        <meshBasicMaterial color="#ffeecc" transparent opacity={0.2} />
      </mesh>

      {/* A site marker */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-22, 1.06, -26]}>
        <circleGeometry args={[2.5, 12]} />
        <meshBasicMaterial color="#cc5040" transparent opacity={0.25} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      {/* B site marker */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[24, 1.06, -20]}>
        <circleGeometry args={[2.5, 12]} />
        <meshBasicMaterial color="#4060cc" transparent opacity={0.25} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
    </group>
  )
}
