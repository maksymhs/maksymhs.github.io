import React, { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import Vox from '../common/Vox'

export function Bed({ onClick }) {
  return (
    <group position={[2.8, 0, 2.6]} rotation={[0, Math.PI, 0]}
      onClick={(e) => { e.stopPropagation(); onClick?.() }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'auto')}
    >
      {/* Frame */}
      <Vox position={[0, 0.25, 0]} args={[1.8, 0.12, 2.4]} color="#a07040" castShadow />
      {/* Legs */}
      {[[-0.8, 0.1, -1.1], [0.8, 0.1, -1.1], [-0.8, 0.1, 1.1], [0.8, 0.1, 1.1]].map((pos, i) => (
        <Vox key={i} position={pos} args={[0.12, 0.2, 0.12]} color="#886030" />
      ))}
      {/* Mattress */}
      <Vox position={[0, 0.38, 0]} args={[1.7, 0.14, 2.3]} color="#f0f0f8" />
      {/* Headboard */}
      <Vox position={[0, 0.7, -1.15]} args={[1.8, 0.8, 0.1]} color="#a07040" castShadow />
      <Vox position={[0, 0.7, -1.1]} args={[1.6, 0.6, 0.04]} color="#c08848" />
      {/* Pillow */}
      <Vox position={[-0.35, 0.5, -0.8]} args={[0.5, 0.12, 0.3]} color="#f8f0e0" />
      <Vox position={[0.35, 0.5, -0.8]} args={[0.5, 0.12, 0.3]} color="#f8f0e0" />
      {/* Blanket - folded at bottom */}
      <Vox position={[0, 0.48, 0.1]} args={[1.6, 0.08, 1.6]} color="#7090d0" />
      <Vox position={[0, 0.48, -0.2]} args={[1.6, 0.1, 0.4]} color="#80a0e0" />
      {/* Blanket fold at foot */}
      <Vox position={[0, 0.52, 0.85]} args={[1.6, 0.12, 0.4]} color="#6080c0" />
    </group>
  )
}

export function Sofa({ onClick }) {
  return (
    <group position={[-2.8, 0, 2.5]} rotation={[0, Math.PI / 2, 0]}
      onClick={(e) => { e.stopPropagation(); onClick?.() }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'auto')}
    >
      {/* Base/seat */}
      <Vox position={[0, 0.35, 0]} args={[1.8, 0.3, 0.8]} color="#d06050" castShadow />
      {/* Back cushion - against wall */}
      <Vox position={[0, 0.65, -0.32]} args={[1.8, 0.35, 0.2]} color="#c05040" />
      {/* Arm rests */}
      <Vox position={[-0.85, 0.5, 0]} args={[0.14, 0.35, 0.8]} color="#c05040" />
      <Vox position={[0.85, 0.5, 0]} args={[0.14, 0.35, 0.8]} color="#c05040" />
      {/* Legs */}
      {[[-0.75, 0.1, -0.3], [0.75, 0.1, -0.3], [-0.75, 0.1, 0.3], [0.75, 0.1, 0.3]].map((pos, i) => (
        <Vox key={i} position={pos} args={[0.1, 0.2, 0.1]} color="#806040" />
      ))}
      {/* Seat cushions */}
      <Vox position={[-0.4, 0.52, 0.02]} args={[0.72, 0.06, 0.68]} color="#e06858" />
      <Vox position={[0.4, 0.52, 0.02]} args={[0.72, 0.06, 0.68]} color="#e06858" />
      {/* Throw cushions */}
      <Vox position={[-0.6, 0.65, 0.05]} args={[0.28, 0.28, 0.12]} color="#f0d040" />
      <Vox position={[0.55, 0.65, 0.08]} args={[0.24, 0.24, 0.1]} color="#60c0a0" />
    </group>
  )
}

export function SideTable({ position }) {
  return (
    <group position={position}>
      {/* Top */}
      <Vox position={[0, 0.5, 0]} args={[0.5, 0.06, 0.5]} color="#a07040" />
      {/* Leg */}
      <Vox position={[0, 0.25, 0]} args={[0.12, 0.5, 0.12]} color="#886030" />
      {/* Base */}
      <Vox position={[0, 0.02, 0]} args={[0.36, 0.04, 0.36]} color="#886030" />
    </group>
  )
}

export function CoffeeTable({ onHeadphonesClick }) {
  return (
    <group position={[-1.5, 0, 2.5]} rotation={[0, Math.PI / 2, 0]}>
      {/* Top */}
      <Vox position={[0, 0.35, 0]} args={[0.9, 0.06, 0.5]} color="#b08040" />
      {/* Legs */}
      {[[-0.35, 0.16, -0.18], [0.35, 0.16, -0.18], [-0.35, 0.16, 0.18], [0.35, 0.16, 0.18]].map((pos, i) => (
        <Vox key={i} position={pos} args={[0.08, 0.32, 0.08]} color="#906830" />
      ))}
      {/* Headphones */}
      <group
        position={[-0.2, 0.4, 0]}
        onClick={(e) => { e.stopPropagation(); onHeadphonesClick?.() }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        {/* Headband */}
        <Vox position={[0, 0.1, 0]} args={[0.28, 0.03, 0.06]} color="#303030" />
        <Vox position={[-0.14, 0.06, 0]} args={[0.03, 0.1, 0.06]} color="#303030" />
        <Vox position={[0.14, 0.06, 0]} args={[0.03, 0.1, 0.06]} color="#303030" />
        {/* Left ear cup */}
        <Vox position={[-0.16, 0, 0]} args={[0.08, 0.12, 0.12]} color="#404040" />
        <Vox position={[-0.16, 0, 0.05]} args={[0.06, 0.1, 0.03]} color="#505050" />
        {/* Right ear cup */}
        <Vox position={[0.16, 0, 0]} args={[0.08, 0.12, 0.12]} color="#404040" />
        <Vox position={[0.16, 0, 0.05]} args={[0.06, 0.1, 0.03]} color="#505050" />
        {/* Cushion pads */}
        <Vox position={[-0.16, 0, 0.07]} args={[0.05, 0.08, 0.02]} color="#606060" />
        <Vox position={[0.16, 0, 0.07]} args={[0.05, 0.08, 0.02]} color="#606060" />
      </group>
      {/* Small plant on table */}
      <Vox position={[0.25, 0.42, 0]} args={[0.1, 0.08, 0.1]} color="#d07040" />
      <Vox position={[0.25, 0.5, 0]} args={[0.08, 0.08, 0.08]} color="#50b050" />
    </group>
  )
}

export function Nightstand() {
  const [lampOn, setLampOn] = useState(true)
  const [topOpen, setTopOpen] = useState(false)
  const [botOpen, setBotOpen] = useState(false)
  const [ringing, setRinging] = useState(false)
  const alarmRef = useRef(null)
  const topRef = useRef()
  const botRef = useRef()
  const topSlide = useRef(0)
  const botSlide = useRef(0)

  useFrame(() => {
    if (topRef.current) {
      const t1 = topOpen ? -0.25 : 0
      topSlide.current += (t1 - topSlide.current) * 0.1
      topRef.current.position.z = topSlide.current
    }
    if (botRef.current) {
      const t2 = botOpen ? -0.25 : 0
      botSlide.current += (t2 - botSlide.current) * 0.1
      botRef.current.position.z = botSlide.current
    }
  })

  return (
    <group position={[1.6, 0, 3.4]}>
      {/* Top */}
      <Vox position={[0, 0.5, 0]} args={[0.5, 0.06, 0.45]} color="#a07040" />
      {/* Body */}
      <Vox position={[0, 0.3, 0]} args={[0.48, 0.34, 0.43]} color="#b07838" />
      {/* Upper drawer - slides out toward room (-Z) */}
      <group
        ref={topRef}
        onClick={(e) => { e.stopPropagation(); setTopOpen(!topOpen) }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <Vox position={[0, 0.35, -0.22]} args={[0.4, 0.14, 0.02]} color="#c08848" />
        <Vox position={[0, 0.35, 0.18]} args={[0.4, 0.14, 0.02]} color="#a05820" />
        <Vox position={[-0.19, 0.35, -0.02]} args={[0.02, 0.14, 0.38]} color="#a05820" />
        <Vox position={[0.19, 0.35, -0.02]} args={[0.02, 0.14, 0.38]} color="#a05820" />
        <Vox position={[0, 0.29, -0.02]} args={[0.36, 0.02, 0.38]} color="#c08038" />
        <Vox position={[0, 0.35, -0.24]} args={[0.08, 0.04, 0.02]} color="#f0c040" />
      </group>
      {/* Lower drawer - slides out toward room (-Z) */}
      <group
        ref={botRef}
        onClick={(e) => { e.stopPropagation(); setBotOpen(!botOpen) }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <Vox position={[0, 0.2, -0.22]} args={[0.4, 0.14, 0.02]} color="#c08848" />
        <Vox position={[0, 0.2, 0.18]} args={[0.4, 0.14, 0.02]} color="#a05820" />
        <Vox position={[-0.19, 0.2, -0.02]} args={[0.02, 0.14, 0.38]} color="#a05820" />
        <Vox position={[0.19, 0.2, -0.02]} args={[0.02, 0.14, 0.38]} color="#a05820" />
        <Vox position={[0, 0.14, -0.02]} args={[0.36, 0.02, 0.38]} color="#c08038" />
        <Vox position={[0, 0.2, -0.24]} args={[0.08, 0.04, 0.02]} color="#f0c040" />
      </group>
      {/* Legs */}
      {[[-0.2, 0.06, -0.18], [0.2, 0.06, -0.18], [-0.2, 0.06, 0.18], [0.2, 0.06, 0.18]].map((pos, i) => (
        <Vox key={i} position={pos} args={[0.06, 0.12, 0.06]} color="#886030" />
      ))}
      {/* Alarm clock on top — clickable */}
      <group
        onClick={(e) => {
          e.stopPropagation()
          if (alarmRef.current) return
          setRinging(true)
          const ctx = new (window.AudioContext || window.webkitAudioContext)()
          const now = ctx.currentTime
          for (let i = 0; i < 6; i++) {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = 'square'
            osc.frequency.value = i % 2 === 0 ? 880 : 660
            gain.gain.value = 0.08
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start(now + i * 0.5)
            osc.stop(now + i * 0.5 + 0.35)
          }
          alarmRef.current = setTimeout(() => {
            setRinging(false)
            alarmRef.current = null
            ctx.close()
          }, 3000)
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <Vox position={[0.1, 0.6, 0.05]} args={[0.12, 0.1, 0.06]} color={ringing ? '#ff3030' : '#e05050'} />
        <Vox position={[0.1, 0.6, 0.08]} args={[0.08, 0.06, 0.01]} color={ringing ? '#ffff80' : '#f0f0e0'} />
      </group>
      {/* Small lamp on nightstand - clickable */}
      <group
        onClick={(e) => { e.stopPropagation(); setLampOn(!lampOn) }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        <Vox position={[-0.12, 0.58, 0]} args={[0.08, 0.06, 0.08]} color="#e0c080" />
        <Vox position={[-0.12, 0.66, 0]} args={[0.04, 0.1, 0.04]} color="#e0c080" />
        <Vox position={[-0.12, 0.74, 0]} args={[0.14, 0.06, 0.14]} color={lampOn ? '#fff0d0' : '#908070'} />
      </group>
      {lampOn && <pointLight position={[-0.12, 0.8, 0]} intensity={0.3} color="#ffe080" distance={2} />}
    </group>
  )
}

export function BedRug() {
  return (
    <group position={[1.6, 0.01, 2.2]}>
      <Vox position={[0, 0, 0]} args={[0.6, 0.02, 1.0]} color="#d0b898" castShadow={false} receiveShadow />
      <Vox position={[0, 0.005, 0]} args={[0.5, 0.02, 0.9]} color="#c0a888" castShadow={false} receiveShadow />
    </group>
  )
}
