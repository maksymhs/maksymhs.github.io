import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import Vox from '../common/Vox'

function WindowFrame({ position, rotation, width = 2.8, height = 2.4, onClick, open }) {
  const hw = width / 2
  const hh = height / 2
  const t = 0.1
  const slideRef = useRef()
  const progressRef = useRef(0)

  useFrame((_, delta) => {
    const target = open ? 1 : 0
    const diff = target - progressRef.current
    // Ease-out cubic: fast start, slow finish
    const speed = Math.max(0.4 * delta, Math.abs(diff) * 2.5 * delta)
    if (Math.abs(diff) < 0.002) {
      progressRef.current = target
    } else {
      progressRef.current += Math.sign(diff) * speed
    }
    if (slideRef.current) {
      slideRef.current.position.y = progressRef.current * height
      // Once fully open, hide sliding panel so it doesn't poke above roof
      if (progressRef.current >= 0.99 && open) {
        slideRef.current.visible = false
      } else {
        slideRef.current.visible = true
      }
    }
  })

  return (
    <group position={position} rotation={rotation || [0, 0, 0]}>
      {/* Sliding panel (glass + cross bars + bottom bar) - slides up */}
      <group ref={slideRef}>
        {/* Glass - transparent, clickable */}
        <mesh
          onClick={(e) => { e.stopPropagation(); onClick?.() }}
          onPointerOver={() => onClick && (document.body.style.cursor = 'pointer')}
          onPointerOut={() => onClick && (document.body.style.cursor = 'auto')}
        >
          <boxGeometry args={[width, height, 0.02]} />
          <meshLambertMaterial color="#c0e8ff" transparent opacity={0.15} flatShading />
        </mesh>
        {/* Horizontal cross bar */}
        <Vox position={[0, 0, 0.03]} args={[width, 0.06, 0.04]} color="#f0f0e0" />
        {/* Vertical cross bar */}
        <Vox position={[0, 0, 0.03]} args={[0.06, height, 0.04]} color="#f0f0e0" />
        {/* Bottom bar (slides up with glass) */}
        <Vox position={[0, -(hh + t / 2), 0.02]} args={[width + t * 2, t, 0.06]} color="#f0f0e0" />
      </group>
      {/* Frame borders (fixed) */}
      <Vox position={[0, hh + t / 2, 0.02]} args={[width + t * 2, t, 0.06]} color="#f0f0e0" />
      <Vox position={[-(hw + t / 2), 0, 0.02]} args={[t, height + t * 2, 0.06]} color="#f0f0e0" />
      <Vox position={[hw + t / 2, 0, 0.02]} args={[t, height + t * 2, 0.06]} color="#f0f0e0" />
      {/* Sill (fixed) */}
      <Vox position={[0, -(hh + t), 0.1]} args={[width + 0.3, 0.08, 0.22]} color="#f0f0e0" />
    </group>
  )
}

export default function Walls({ onWindowClick, windowOpen, onDoorClick, view }) {
  return (
    <group>
      {/* === BACK WALL - split around window (3.6w x 2.6h at y=2, x=0) === */}
      {/* Left side: x -4 to -1.8 */}
      <Vox position={[-2.9, 2.6, -4.05]} args={[2.2, 2.8, 0.1]} color="#d4ddd0" castShadow={false} receiveShadow />
      {/* Right side: x +1.8 to +4 */}
      <Vox position={[2.9, 2.6, -4.05]} args={[2.2, 2.8, 0.1]} color="#d4ddd0" castShadow={false} receiveShadow />
      {/* Top strip above window: y 3.3 to 4 */}
      <Vox position={[0, 3.65, -4.05]} args={[3.6, 0.7, 0.1]} color="#d4ddd0" castShadow={false} receiveShadow />
      {/* Lower wainscoting left */}
      <Vox position={[-2.9, 0.6, -4.04]} args={[2.2, 1.2, 0.08]} color="#d8cbb8" castShadow={false} receiveShadow />
      {/* Lower wainscoting right */}
      <Vox position={[2.9, 0.6, -4.04]} args={[2.2, 1.2, 0.08]} color="#d8cbb8" castShadow={false} receiveShadow />
      {/* Bottom strip below window: y 0 to 0.7 */}
      <Vox position={[0, 0.35, -4.05]} args={[3.6, 0.7, 0.1]} color="#d8cbb8" castShadow={false} receiveShadow />
      {/* Wainscoting panels - back wall */}
      {[-3.5, -2.5, 2.5, 3.5].map((x, i) => (
        <Vox key={`bwp${i}`} position={[x, 0.65, -3.98]} args={[0.7, 0.8, 0.02]} color="#cfc0a8" />
      ))}

      {/* === LEFT WALL - split around window (3.6w x 2.6h at y=2, z=0) === */}
      {/* Back section: z -4 to -1.8 */}
      <Vox position={[-4.05, 2.6, -2.9]} args={[0.1, 2.8, 2.2]} color="#d0dbc8" castShadow={false} receiveShadow />
      {/* Front section: z +1.8 to +4 */}
      <Vox position={[-4.05, 2.6, 2.9]} args={[0.1, 2.8, 2.2]} color="#d0dbc8" castShadow={false} receiveShadow />
      {/* Top strip above window: y 3.3 to 4 */}
      <Vox position={[-4.05, 3.65, 0]} args={[0.1, 0.7, 3.6]} color="#d0dbc8" castShadow={false} receiveShadow />
      {/* Lower wainscoting back */}
      <Vox position={[-4.04, 0.6, -2.9]} args={[0.08, 1.2, 2.2]} color="#d5c8b5" castShadow={false} receiveShadow />
      {/* Lower wainscoting front */}
      <Vox position={[-4.04, 0.6, 2.9]} args={[0.08, 1.2, 2.2]} color="#d5c8b5" castShadow={false} receiveShadow />
      {/* Bottom strip below window: y 0 to 0.7 */}
      <Vox position={[-4.05, 0.35, 0]} args={[0.1, 0.7, 3.6]} color="#d5c8b5" castShadow={false} receiveShadow />

      {/* === RIGHT WALL - solid with two-tone === */}
      <Vox position={[4.05, 2.6, 0]} args={[0.1, 2.8, 8]} color="#d2dbca" castShadow={false} receiveShadow />
      <Vox position={[4.04, 0.6, 0]} args={[0.08, 1.2, 8]} color="#d5c8b5" castShadow={false} receiveShadow />
      {/* Wainscoting panels - right wall */}
      {[-3, -1.8, -0.6, 0.6, 1.8, 3].map((z, i) => (
        <Vox key={`rwp${i}`} position={[3.98, 0.65, z]} args={[0.02, 0.8, 0.9]} color="#cbbfa8" />
      ))}

      {/* === FRONT WALL - split around door (1.6w x 2.8h at x=0) === */}
      {/* Left section: x -4 to -0.8 */}
      <Vox position={[-2.4, 2.6, 4.05]} args={[3.2, 2.8, 0.1]} color="#d4ddd0" castShadow={false} receiveShadow />
      {/* Right section: x +0.8 to +4 */}
      <Vox position={[2.4, 2.6, 4.05]} args={[3.2, 2.8, 0.1]} color="#d4ddd0" castShadow={false} receiveShadow />
      {/* Top strip above door */}
      <Vox position={[0, 3.65, 4.05]} args={[1.6, 0.7, 0.1]} color="#d4ddd0" castShadow={false} receiveShadow />
      {/* Lower wainscoting left of door */}
      <Vox position={[-2.4, 0.6, 4.04]} args={[3.2, 1.2, 0.08]} color="#d8cbb8" castShadow={false} receiveShadow />
      {/* Lower wainscoting right of door */}
      <Vox position={[2.4, 0.6, 4.04]} args={[3.2, 1.2, 0.08]} color="#d8cbb8" castShadow={false} receiveShadow />
      {/* Wainscoting panels - front wall (avoid door area) */}
      {[-3, -1.5, 1.5, 3].map((x, i) => (
        <Vox key={`fwp${i}`} position={[x, 0.65, 3.98]} args={[0.9, 0.8, 0.02]} color="#cfc0a8" />
      ))}
      {/* Door frame decoration — clickable */}
      <group
        onClick={(e) => { e.stopPropagation(); onDoorClick?.() }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        {/* Static door panel — hidden when animated door is active */}
        {view !== 'walk' && <Vox position={[0, 1.4, 3.96]} args={[1.4, 2.6, 0.04]} color="#a07040" />}
        {view !== 'walk' && <Vox position={[-0.5, 1.3, 3.93]} args={[0.08, 0.08, 0.06]} color="#f0c040" />}
        {view !== 'walk' && <Vox position={[-0.5, 1.3, 3.99]} args={[0.08, 0.08, 0.06]} color="#f0c040" />}
        {/* Door frame top — always visible */}
        <Vox position={[0, 2.78, 3.96]} args={[1.6, 0.1, 0.04]} color="#906030" />
      </group>

      {/* Door opening wall thickness — seals gap between interior and exterior walls */}
      {/* Left jamb — floor to ceiling */}
      <Vox position={[-0.8, 2, 4.075]} args={[0.25, 4, 0.3]} color="#d4ddd0" castShadow={false} />
      {/* Right jamb */}
      <Vox position={[0.8, 2, 4.075]} args={[0.25, 4, 0.3]} color="#d4ddd0" castShadow={false} />
      {/* Top lintel — fills entire gap above door */}
      <Vox position={[0, 3.3, 4.075]} args={[1.85, 1.5, 0.3]} color="#d4ddd0" castShadow={false} />
      {/* Floor threshold */}
      <Vox position={[0, 0.01, 4.075]} args={[1.6, 0.06, 0.3]} color="#c0b090" castShadow={false} />

      {/* === DADO RAIL - all walls === */}
      {/* Back wall dado rail - split around window (gap x -1.8 to 1.8) */}
      <Vox position={[-2.9, 1.22, -3.97]} args={[2.2, 0.08, 0.04]} color="#f0e8d8" />
      <Vox position={[2.9, 1.22, -3.97]} args={[2.2, 0.08, 0.04]} color="#f0e8d8" />
      {/* Left wall dado rail - split around window (gap z -1.8 to 1.8) */}
      <Vox position={[-3.97, 1.22, -2.9]} args={[0.04, 0.08, 2.2]} color="#f0e8d8" />
      <Vox position={[-3.97, 1.22, 2.9]} args={[0.04, 0.08, 2.2]} color="#f0e8d8" />
      <Vox position={[3.97, 1.22, 0]} args={[0.04, 0.08, 8]} color="#f0e8d8" />
      {/* Front wall dado rail - split around door (gap x -0.8 to 0.8) */}
      <Vox position={[-2.4, 1.22, 3.97]} args={[3.2, 0.08, 0.04]} color="#f0e8d8" />
      <Vox position={[2.4, 1.22, 3.97]} args={[3.2, 0.08, 0.04]} color="#f0e8d8" />

      {/* === CROWN MOLDING - all walls top === */}
      <Vox position={[0, 3.95, -3.97]} args={[8, 0.1, 0.06]} color="#f0ece0" />
      <Vox position={[-3.97, 3.95, 0]} args={[0.06, 0.1, 8]} color="#f0ece0" />
      <Vox position={[3.97, 3.95, 0]} args={[0.06, 0.1, 8]} color="#f0ece0" />
      {/* Front wall crown molding - split around door */}
      <Vox position={[-2.4, 3.95, 3.97]} args={[3.2, 0.1, 0.06]} color="#f0ece0" />
      <Vox position={[2.4, 3.95, 3.97]} args={[3.2, 0.1, 0.06]} color="#f0ece0" />

      {/* Ceiling */}
      <Vox position={[0, 4.02, 0]} args={[8, 0.08, 8]} color="#f8f4ed" castShadow={false} receiveShadow />

      {/* Baseboard trim - all walls */}
      {/* Back wall baseboard - split around window */}
      <Vox position={[-2.9, 0.06, -3.97]} args={[2.2, 0.12, 0.05]} color="#c0b49c" />
      <Vox position={[2.9, 0.06, -3.97]} args={[2.2, 0.12, 0.05]} color="#c0b49c" />
      {/* Left wall baseboard - split around window */}
      <Vox position={[-3.97, 0.06, -2.9]} args={[0.05, 0.12, 2.2]} color="#c0b49c" />
      <Vox position={[-3.97, 0.06, 2.9]} args={[0.05, 0.12, 2.2]} color="#c0b49c" />
      <Vox position={[3.97, 0.06, 0]} args={[0.05, 0.12, 8]} color="#c0b49c" />
      {/* Front wall baseboard - split around door */}
      <Vox position={[-2.4, 0.06, 3.97]} args={[3.2, 0.12, 0.05]} color="#c0b49c" />
      <Vox position={[2.4, 0.06, 3.97]} args={[3.2, 0.12, 0.05]} color="#c0b49c" />

      {/* Big window - back wall */}
      <WindowFrame position={[0, 2, -3.99]} width={3.6} height={2.6} />

      {/* Big window - left wall - clickable */}
      <WindowFrame position={[-3.99, 2, 0]} rotation={[0, Math.PI / 2, 0]} width={3.6} height={2.6} onClick={onWindowClick} open={windowOpen} />
    </group>
  )
}
