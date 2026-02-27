import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import Vox from '../common/Vox'

export function Grass() {
  return (
    <group>
      {/* Huge ground plane surrounding house */}
      <Vox position={[0, -0.3, 0]} args={[120, 0.4, 120]} color="#60b840" castShadow={false} receiveShadow />
      {/* Grass shade patches scattered around */}
      {[[-8,-8],[-15,5],[12,-12],[18,8],[-20,-15],[8,15],[-12,18],[20,-8],[0,-18],[-18,12],[15,-18],[0,18]].map(([x,z],i) => (
        <Vox key={`gp${i}`} position={[x, -0.07, z]} args={[3+i%3, 0.05, 2+i%4]} color={i%2===0?'#50a830':'#68c048'} castShadow={false} />
      ))}
      {/* Path from entrance door to vegetable garden — right angles only */}
      <Vox position={[0, -0.06, 5.5]} args={[1.4, 0.06, 3]} color="#d4b888" castShadow={false} />
      <Vox position={[0, -0.06, 7]} args={[1.4, 0.06, 1.4]} color="#ccb080" castShadow={false} />
      <Vox position={[-7.5, -0.06, 7]} args={[14, 0.06, 1.4]} color="#d4b888" castShadow={false} />
      <Vox position={[-15, -0.06, 7]} args={[1.4, 0.06, 1.4]} color="#ccb080" castShadow={false} />
      <Vox position={[-15, -0.06, -3]} args={[1.4, 0.06, 19]} color="#d4b888" castShadow={false} />
      {/* Distant hills all around */}
      <Vox position={[0, 0.5, -40]} args={[80, 2, 6]} color="#48a038" castShadow={false} />
      <Vox position={[0, 0.5, 40]} args={[80, 2, 6]} color="#48a038" castShadow={false} />
      <Vox position={[-40, 0.5, 0]} args={[6, 2, 80]} color="#48a038" castShadow={false} />
      <Vox position={[40, 0.5, 0]} args={[6, 2, 80]} color="#48a038" castShadow={false} />
      <Vox position={[-20, 1.2, -38]} args={[20, 3, 5]} color="#409030" castShadow={false} />
      <Vox position={[18, 0.8, -36]} args={[18, 2.5, 5]} color="#48a838" castShadow={false} />
      <Vox position={[-25, 1, 35]} args={[15, 2.5, 5]} color="#409030" castShadow={false} />
      <Vox position={[22, 1.3, 38]} args={[18, 3, 5]} color="#48a838" castShadow={false} />
      {/* Mountains */}
      <Vox position={[0, 2.5, -48]} args={[100, 6, 4]} color="#70a8d0" castShadow={false} />
      <Vox position={[-25, 4, -50]} args={[25, 9, 4]} color="#6098c0" castShadow={false} />
      <Vox position={[22, 3.5, -49]} args={[20, 8, 4]} color="#6898c8" castShadow={false} />
      <Vox position={[0, 3, 48]} args={[80, 5, 4]} color="#6898c0" castShadow={false} />
    </group>
  )
}

export function Flowers() {
  const flowerData = useMemo(() => {
    const flowers = []
    const colors = ['#ff6080', '#ff80a0', '#f0d040', '#ff9050', '#e060d0', '#60a0ff']
    const rng = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647 } }
    const r = rng(42)
    for (let i = 0; i < 60; i++) {
      const x = -25 + r() * 50
      const z = -25 + r() * 50
      if (Math.abs(x) < 5 && Math.abs(z) < 5) continue
      const onPath1 = x > -1 && x < 1 && z > 4 && z < 8
      const onPath2 = x > -16 && x < 1 && z > 6 && z < 8.5
      const onPath3 = x > -16 && x < -14 && z > -13 && z < 8
      if (onPath1 || onPath2 || onPath3) continue
      flowers.push({
        x, z,
        color: colors[Math.floor(r() * colors.length)],
        h: 0.15 + r() * 0.2
      })
    }
    return flowers
  }, [])

  return (
    <group>
      {flowerData.map((f, i) => (
        <group key={i} position={[f.x, 0, f.z]}>
          <Vox position={[0, f.h / 2, 0]} args={[0.04, f.h, 0.04]} color="#308020" />
          <Vox position={[0, f.h + 0.06, 0]} args={[0.14, 0.1, 0.14]} color={f.color} />
          <Vox position={[0, f.h + 0.06, 0]} args={[0.08, 0.12, 0.08]} color="#fff080" />
        </group>
      ))}
    </group>
  )
}

export function Fence() {
  const posts = (count, len) => Array.from({ length: count }).map((_, i) => ({
    offset: -len / 2 + i * (len / (count - 1))
  }))
  const fenceLen = 50
  const fenceHalf = fenceLen / 2
  const p = posts(26, fenceLen)
  return (
    <group>
      {/* Back fence */}
      <Vox position={[0, 0.35, -fenceHalf]} args={[fenceLen, 0.08, 0.08]} color="#c0a060" />
      <Vox position={[0, 0.65, -fenceHalf]} args={[fenceLen, 0.08, 0.08]} color="#c0a060" />
      {p.map((v, i) => <Vox key={`fb${i}`} position={[v.offset, 0.4, -fenceHalf]} args={[0.1, 0.8, 0.1]} color="#b09050" />)}
      {/* Front fence */}
      <Vox position={[0, 0.35, fenceHalf]} args={[fenceLen, 0.08, 0.08]} color="#c0a060" />
      <Vox position={[0, 0.65, fenceHalf]} args={[fenceLen, 0.08, 0.08]} color="#c0a060" />
      {p.map((v, i) => <Vox key={`ff${i}`} position={[v.offset, 0.4, fenceHalf]} args={[0.1, 0.8, 0.1]} color="#b09050" />)}
      {/* Left fence */}
      <Vox position={[-fenceHalf, 0.35, 0]} args={[0.08, 0.08, fenceLen]} color="#c0a060" />
      <Vox position={[-fenceHalf, 0.65, 0]} args={[0.08, 0.08, fenceLen]} color="#c0a060" />
      {p.map((v, i) => <Vox key={`fl${i}`} position={[-fenceHalf, 0.4, v.offset]} args={[0.1, 0.8, 0.1]} color="#b09050" />)}
      {/* Right fence */}
      <Vox position={[fenceHalf, 0.35, 0]} args={[0.08, 0.08, fenceLen]} color="#c0a060" />
      <Vox position={[fenceHalf, 0.65, 0]} args={[0.08, 0.08, fenceLen]} color="#c0a060" />
      {p.map((v, i) => <Vox key={`fr${i}`} position={[fenceHalf, 0.4, v.offset]} args={[0.1, 0.8, 0.1]} color="#b09050" />)}
    </group>
  )
}

export function PixelCloud({ position }) {
  const cloudRef = useRef()
  const speed = useMemo(() => 0.1 + Math.random() * 0.15, [])

  useFrame((state) => {
    if (cloudRef.current) {
      cloudRef.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * speed) * 2
    }
  })

  return (
    <group ref={cloudRef} position={position}>
      <Vox position={[0, 0, 0]} args={[1.6, 0.4, 0.6]} color="#ffffff" />
      <Vox position={[-0.5, 0.25, 0]} args={[0.8, 0.3, 0.5]} color="#ffffff" />
      <Vox position={[0.4, 0.2, 0]} args={[1.0, 0.3, 0.5]} color="#ffffff" />
      <Vox position={[0, -0.15, 0]} args={[1.2, 0.2, 0.5]} color="#f0f0f0" />
    </group>
  )
}

export function Pond({ position }) {
  return (
    <group position={position}>
      <Vox position={[0, -0.04, 0]} args={[3, 0.08, 2]} color="#70b8e0" />
      <Vox position={[0.2, -0.03, 0.1]} args={[2.4, 0.08, 1.6]} color="#80c8f0" />
      <Vox position={[-1.3, 0.05, -0.6]} args={[0.3, 0.15, 0.25]} color="#909090" />
      <Vox position={[1.4, 0.05, 0.5]} args={[0.25, 0.12, 0.3]} color="#a0a0a0" />
      <Vox position={[-0.8, 0.04, 0.9]} args={[0.35, 0.1, 0.2]} color="#888888" />
      <Vox position={[0.9, 0.04, -0.8]} args={[0.2, 0.13, 0.25]} color="#959595" />
    </group>
  )
}

export function FencedPond({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      {/* Pond basin */}
      <Vox position={[0, -0.06, 0]} args={[7.0, 0.04, 5.5]} color="#6b5a40" />
      {/* Water */}
      <Vox position={[0, -0.03, 0]} args={[6.5, 0.04, 5.0]} color="#60b0d8" />
      <Vox position={[0.3, -0.02, 0.15]} args={[5.2, 0.04, 3.8]} color="#70c0e8" />
      <Vox position={[-0.4, -0.01, -0.3]} args={[3.5, 0.04, 2.6]} color="#80d0f0" />
      {/* Rocks around */}
      <Vox position={[-3.0, 0.06, -1.8]} args={[0.5, 0.18, 0.4]} color="#909090" />
      <Vox position={[3.0, 0.05, 1.2]} args={[0.4, 0.14, 0.45]} color="#a0a0a0" />
      <Vox position={[-1.8, 0.04, 2.2]} args={[0.45, 0.12, 0.3]} color="#888888" />
      <Vox position={[2.3, 0.06, -2.0]} args={[0.35, 0.16, 0.4]} color="#959595" />
      <Vox position={[0.8, 0.05, 2.4]} args={[0.4, 0.14, 0.3]} color="#8a8a8a" />
      <Vox position={[-2.8, 0.04, 0.5]} args={[0.3, 0.12, 0.45]} color="#9a9a9a" />
      <Vox position={[3.2, 0.05, -0.5]} args={[0.35, 0.13, 0.3]} color="#929292" />
      <Vox position={[-1.0, 0.06, -2.4]} args={[0.4, 0.15, 0.35]} color="#989898" />
      {/* Lily pads */}
      <Vox position={[-0.8, 0.01, -0.5]} args={[0.3, 0.02, 0.3]} color="#48a838" />
      <Vox position={[1.0, 0.01, 0.8]} args={[0.25, 0.02, 0.25]} color="#40a030" />
      <Vox position={[-1.2, 0.01, 1.0]} args={[0.28, 0.02, 0.28]} color="#50b040" />
      <Vox position={[0.3, 0.01, -1.0]} args={[0.22, 0.02, 0.22]} color="#48b040" />
      <Vox position={[1.8, 0.01, -0.3]} args={[0.26, 0.02, 0.26]} color="#40a830" />
      {/* Lily flowers */}
      <Vox position={[-0.8, 0.06, -0.5]} args={[0.12, 0.08, 0.12]} color="#f0b0d0" />
      <Vox position={[-0.8, 0.08, -0.5]} args={[0.06, 0.06, 0.06]} color="#f0d060" />
      <Vox position={[1.0, 0.06, 0.8]} args={[0.1, 0.08, 0.1]} color="#f0c0e0" />
      <Vox position={[1.0, 0.08, 0.8]} args={[0.05, 0.05, 0.05]} color="#f0d060" />
      {/* Reeds */}
      {[[2.8, -1.2], [2.9, -1.0], [2.7, -1.3], [-2.4, 1.6], [-2.3, 1.7], [-2.5, 1.5], [3.0, 0.5], [-2.6, -1.0]].map(([rx, rz], i) => (
        <group key={`reed${i}`} position={[rx, 0, rz]}>
          <Vox position={[0, 0.2, 0]} args={[0.03, 0.4, 0.03]} color="#507030" />
          <Vox position={[0, 0.42, 0]} args={[0.05, 0.08, 0.05]} color="#806040" />
        </group>
      ))}
    </group>
  )
}

export function GardenBench({ position, rotation }) {
  return (
    <group position={position} rotation={rotation || [0, 0, 0]}>
      <Vox position={[0, 0.3, 0]} args={[0.8, 0.06, 0.35]} color="#a07840" />
      <Vox position={[0, 0.5, -0.14]} args={[0.8, 0.3, 0.06]} color="#906830" />
      {[[-0.35, 0.15, -0.12], [0.35, 0.15, -0.12], [-0.35, 0.15, 0.12], [0.35, 0.15, 0.12]].map((p, i) => (
        <Vox key={i} position={p} args={[0.06, 0.3, 0.06]} color="#705020" />
      ))}
    </group>
  )
}
