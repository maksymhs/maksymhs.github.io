import React, { useMemo } from 'react'
import Vox from '../common/Vox'

export function PixelTree({ position, trunkColor = '#806030', leafColor = '#40a040' }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <Vox position={[0, 0.4, 0]} args={[0.3, 0.8, 0.3]} color={trunkColor} />
      {/* Leaves - stacked pyramid */}
      <Vox position={[0, 1.0, 0]} args={[1.2, 0.4, 1.2]} color={leafColor} />
      <Vox position={[0, 1.35, 0]} args={[0.9, 0.35, 0.9]} color={leafColor} />
      <Vox position={[0, 1.65, 0]} args={[0.6, 0.3, 0.6]} color={leafColor} />
      <Vox position={[0, 1.9, 0]} args={[0.3, 0.25, 0.3]} color={leafColor} />
    </group>
  )
}

export function VegetableGarden({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      {/* Soil bed frame */}
      <Vox position={[0, -0.02, 0]} args={[5.2, 0.08, 4.2]} color="#8b6240" />
      {/* Soil */}
      <Vox position={[0, 0.03, 0]} args={[5.0, 0.02, 4.0]} color="#7a5530" />
      {/* Row markers */}
      {[-1.5, -0.5, 0.5, 1.5].map((rz, i) => (
        <Vox key={`row${i}`} position={[0, 0.0, rz]} args={[4.8, 0.04, 0.06]} color="#5a3a1a" />
      ))}
      {/* Row 1: Tomato plants with stakes */}
      {[-2, -1, 0, 1, 2].map((rx, i) => (
        <group key={`tom${i}`} position={[rx, 0.18, -1.5]}>
          <Vox position={[0, 0.35, 0]} args={[0.04, 0.7, 0.04]} color="#a08050" />
          <Vox position={[0.06, 0.3, 0.06]} args={[0.2, 0.15, 0.2]} color="#308828" />
          <Vox position={[-0.05, 0.4, -0.04]} args={[0.18, 0.12, 0.18]} color="#38a030" />
          <Vox position={[0.08, 0.22, 0.08]} args={[0.1, 0.1, 0.1]} color="#e03030" />
          <Vox position={[-0.06, 0.35, -0.06]} args={[0.08, 0.08, 0.08]} color="#d04020" />
          {i % 2 === 0 && <Vox position={[0.02, 0.45, 0.04]} args={[0.07, 0.07, 0.07]} color="#f05040" />}
        </group>
      ))}
      {/* Row 2: Carrots */}
      {[-2.2, -1.5, -0.8, -0.1, 0.6, 1.3, 2.0].map((rx, i) => (
        <group key={`car${i}`} position={[rx, 0.18, -0.5]}>
          <Vox position={[0, 0.12, 0]} args={[0.08, 0.2, 0.08]} color="#40a030" />
          <Vox position={[0.03, 0.14, 0.02]} args={[0.06, 0.16, 0.06]} color="#38a828" />
          <Vox position={[0, 0.02, 0]} args={[0.08, 0.06, 0.08]} color="#f08020" />
        </group>
      ))}
      {/* Row 3: Cabbages */}
      {[-1.8, -0.6, 0.6, 1.8].map((rx, i) => (
        <group key={`cab${i}`} position={[rx, 0.18, 0.5]}>
          <Vox position={[0, 0.1, 0]} args={[0.3, 0.2, 0.3]} color="#48b838" />
          <Vox position={[0, 0.16, 0]} args={[0.22, 0.12, 0.22]} color="#60c848" />
          <Vox position={[0, 0.2, 0]} args={[0.14, 0.08, 0.14]} color="#70d858" />
        </group>
      ))}
      {/* Row 4: Pumpkins */}
      {[-1.5, 0, 1.5].map((rx, i) => (
        <group key={`pmp${i}`} position={[rx, 0.18, 1.5]}>
          <Vox position={[0, 0.12, 0]} args={[0.3, 0.22, 0.3]} color="#e08820" />
          <Vox position={[0, 0.18, 0]} args={[0.25, 0.16, 0.25]} color="#d07818" />
          <Vox position={[0, 0.26, 0]} args={[0.06, 0.08, 0.06]} color="#507020" />
          <Vox position={[0.15, 0.18, 0.1]} args={[0.15, 0.03, 0.03]} color="#408028" />
        </group>
      ))}
      {/* Small fence around garden */}
      <Vox position={[0, 0.3, -2.15]} args={[5.4, 0.06, 0.06]} color="#c0a060" />
      <Vox position={[0, 0.45, -2.15]} args={[5.4, 0.06, 0.06]} color="#c0a060" />
      <Vox position={[-1.6, 0.3, 2.15]} args={[2.2, 0.06, 0.06]} color="#c0a060" />
      <Vox position={[-1.6, 0.45, 2.15]} args={[2.2, 0.06, 0.06]} color="#c0a060" />
      <Vox position={[1.6, 0.3, 2.15]} args={[2.2, 0.06, 0.06]} color="#c0a060" />
      <Vox position={[1.6, 0.45, 2.15]} args={[2.2, 0.06, 0.06]} color="#c0a060" />
      <Vox position={[-2.7, 0.3, 0]} args={[0.06, 0.06, 4.36]} color="#c0a060" />
      <Vox position={[-2.7, 0.45, 0]} args={[0.06, 0.06, 4.36]} color="#c0a060" />
      <Vox position={[2.7, 0.3, 0]} args={[0.06, 0.06, 4.36]} color="#c0a060" />
      <Vox position={[2.7, 0.45, 0]} args={[0.06, 0.06, 4.36]} color="#c0a060" />
      {[[-2.7, -2.15], [2.7, -2.15], [-2.7, 2.15], [2.7, 2.15], [0, -2.15], [-0.5, 2.15], [0.5, 2.15], [-2.7, 0], [2.7, 0]].map(([px, pz], i) => (
        <Vox key={`fp${i}`} position={[px, 0.28, pz]} args={[0.08, 0.56, 0.08]} color="#b09050" />
      ))}
      {/* Watering can */}
      <group position={[2.9, 0.18, -1.8]}>
        <Vox position={[0, 0.1, 0]} args={[0.2, 0.2, 0.14]} color="#6090c0" />
        <Vox position={[0.12, 0.18, 0]} args={[0.06, 0.06, 0.04]} color="#5080b0" />
        <Vox position={[0.16, 0.15, 0]} args={[0.1, 0.03, 0.03]} color="#5080b0" />
      </group>
    </group>
  )
}

export function ExteriorVegetation() {
  const data = useMemo(() => {
    const rng = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647 } }
    const r = rng(777)
    const bushColors = ['#2d8c2d', '#2a882a', '#2e8e2e', '#268026', '#348c34']
    const bushTops = ['#35a035', '#32a032', '#38a838', '#30a030', '#3cb03c']
    const flowerColors = ['#ff6080', '#ff80a0', '#f0d040', '#ff9050', '#e060d0', '#60a0ff', '#ff4060', '#ffa040']
    const rockColors = ['#909090', '#808080', '#a0a0a0', '#989898', '#b0a898']

    const isOutside = (x, z) => Math.abs(x) > 26 || Math.abs(z) > 26
    const inRange = (v) => v > -35 && v < 35

    const bushes = []
    for (let i = 0; i < 25; i++) {
      const x = -35 + r() * 70
      const z = -35 + r() * 70
      if (!isOutside(x, z) || !inRange(x) || !inRange(z)) continue
      const s = 0.6 + r() * 0.8
      bushes.push({ x, z, s, c1: bushColors[Math.floor(r() * bushColors.length)], c2: bushTops[Math.floor(r() * bushTops.length)] })
    }

    const flowers = []
    for (let i = 0; i < 50; i++) {
      const x = -34 + r() * 68
      const z = -34 + r() * 68
      if (!isOutside(x, z)) continue
      const h = 0.15 + r() * 0.2
      flowers.push({ x, z, h, c: flowerColors[Math.floor(r() * flowerColors.length)] })
    }

    const rocks = []
    for (let i = 0; i < 15; i++) {
      const x = -34 + r() * 68
      const z = -34 + r() * 68
      if (!isOutside(x, z)) continue
      const s = 0.15 + r() * 0.35
      rocks.push({ x, z, s, c: rockColors[Math.floor(r() * rockColors.length)], ry: r() * Math.PI })
    }

    const tallGrass = []
    for (let i = 0; i < 40; i++) {
      const x = -34 + r() * 68
      const z = -34 + r() * 68
      if (!isOutside(x, z)) continue
      tallGrass.push({ x, z, h: 0.2 + r() * 0.3, c: ['#408830', '#388020', '#48a038', '#509040'][Math.floor(r() * 4)] })
    }

    const leafColors = ['#389030', '#409838', '#48b048', '#38a038', '#30a030', '#50b850', '#40a840', '#358c35']
    const trunkColors = ['#604828', '#704828', '#685020', '#604020', '#5a4020']
    const trees = []
    for (let i = 0; i < 18; i++) {
      const x = -34 + r() * 68
      const z = -34 + r() * 68
      if (!isOutside(x, z)) continue
      trees.push({ x, z, lc: leafColors[Math.floor(r() * leafColors.length)], tc: trunkColors[Math.floor(r() * trunkColors.length)] })
    }

    return { bushes, flowers, rocks, tallGrass, trees }
  }, [])

  return (
    <group>
      {data.bushes.map((b, i) => (
        <group key={`b${i}`} position={[b.x, 0, b.z]}>
          <Vox position={[0, b.s * 0.4, 0]} args={[b.s * 1.2, b.s * 0.8, b.s * 1.2]} color={b.c1} />
          <Vox position={[0, b.s * 0.7, 0]} args={[b.s * 0.85, b.s * 0.5, b.s * 0.85]} color={b.c2} />
        </group>
      ))}
      {data.flowers.map((f, i) => (
        <group key={`f${i}`} position={[f.x, 0, f.z]}>
          <Vox position={[0, f.h / 2, 0]} args={[0.04, f.h, 0.04]} color="#308020" />
          <Vox position={[0, f.h + 0.06, 0]} args={[0.15, 0.1, 0.15]} color={f.c} />
          <Vox position={[0, f.h + 0.06, 0]} args={[0.08, 0.12, 0.08]} color="#fff080" />
        </group>
      ))}
      {data.rocks.map((rk, i) => (
        <group key={`r${i}`} position={[rk.x, 0, rk.z]} rotation={[0, rk.ry, 0]}>
          <Vox position={[0, rk.s * 0.4, 0]} args={[rk.s * 1.3, rk.s * 0.8, rk.s]} color={rk.c} />
          <Vox position={[rk.s * 0.2, rk.s * 0.3, rk.s * 0.1]} args={[rk.s * 0.6, rk.s * 0.5, rk.s * 0.7]} color={rk.c} />
        </group>
      ))}
      {data.tallGrass.map((g, i) => (
        <group key={`g${i}`} position={[g.x, 0, g.z]}>
          <Vox position={[-0.04, g.h / 2, 0]} args={[0.04, g.h, 0.04]} color={g.c} />
          <Vox position={[0.04, g.h * 0.45, 0.03]} args={[0.04, g.h * 0.9, 0.04]} color={g.c} />
          <Vox position={[0, g.h * 0.4, -0.04]} args={[0.04, g.h * 0.8, 0.04]} color={g.c} />
        </group>
      ))}
      {data.trees.map((tr, i) => (
        <PixelTree key={`t${i}`} position={[tr.x, -0.1, tr.z]} leafColor={tr.lc} trunkColor={tr.tc} />
      ))}
    </group>
  )
}
