import React from 'react'
import { useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import Vox from '../common/Vox'

function GitHubMark() {
  const texture = useLoader(THREE.TextureLoader, '/images/github-mark.png')
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  texture.generateMipmaps = false
  return (
    <mesh position={[0, 0, 0.045]}>
      <planeGeometry args={[0.42, 0.42]} />
      <meshLambertMaterial map={texture} transparent flatShading />
    </mesh>
  )
}

export default function WallArt({ onGithubClick, onLinkedinClick, onBack, view }) {
  return (
    <group>
      {/* Pixel art frame 1 - GitHub logo (on right solid section of back wall) */}
      <group
        position={[3, 2.2, -3.95]}
        onClick={(e) => {
          e.stopPropagation()
          if (view === 'github') { window.open('https://github.com/maksymhs', '_blank'); onBack?.() }
          else onGithubClick?.()
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        {/* Frame */}
        <Vox position={[0, 0, 0]} args={[0.7, 0.7, 0.06]} color="#f0f0e0" />
        {/* White background */}
        <Vox position={[0, 0, 0.03]} args={[0.55, 0.55, 0.02]} color="#ffffff" />
        {/* GitHub mark texture */}
        <GitHubMark />
      </group>

      {/* Pixel art frame 2 - LinkedIn logo (on left solid section of back wall) */}
      <group
        position={[-3, 2.2, -3.95]}
        onClick={(e) => {
          e.stopPropagation()
          if (view === 'linkedin') { window.open('https://www.linkedin.com/in/herasymenko', '_blank'); onBack?.() }
          else onLinkedinClick?.()
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        {/* Frame */}
        <Vox position={[0, 0, 0]} args={[0.7, 0.7, 0.06]} color="#f0f0e0" />
        {/* Blue background with rounded corners */}
        <Vox position={[0, 0, 0.03]} args={[0.55, 0.55, 0.02]} color="#286890" />
        {/* Rounded corners cut (match frame color to simulate rounding) */}
        {[[-0.245, 0.245], [0.245, 0.245], [-0.245, -0.245], [0.245, -0.245]].map(([x, y], i) => (
          <Vox key={`rc${i}`} position={[x, y, 0.035]} args={[0.06, 0.06, 0.015]} color="#f0f0e0" />
        ))}
        {/* Letter "i" - left side */}
        {/* Dot */}
        <Vox position={[-0.12, 0.14, 0.045]} args={[0.05, 0.05, 0.01]} color="#ffffff" />
        {/* Stem */}
        {[0.07, 0.035, 0, -0.035, -0.07, -0.105].map((y, i) => (
          <Vox key={`is${i}`} position={[-0.12, y, 0.045]} args={[0.05, 0.035, 0.01]} color="#ffffff" />
        ))}
        {/* Letter "n" - right side */}
        {/* Left vertical */}
        {[0.07, 0.035, 0, -0.035, -0.07, -0.105].map((y, i) => (
          <Vox key={`nl${i}`} position={[0.0, y, 0.045]} args={[0.05, 0.035, 0.01]} color="#ffffff" />
        ))}
        {/* Top curve */}
        <Vox position={[0.05, 0.07, 0.045]} args={[0.05, 0.035, 0.01]} color="#ffffff" />
        <Vox position={[0.1, 0.07, 0.045]} args={[0.05, 0.035, 0.01]} color="#ffffff" />
        <Vox position={[0.1, 0.105, 0.045]} args={[0.05, 0.035, 0.01]} color="#ffffff" />
        {/* Right vertical */}
        {[0.035, 0, -0.035, -0.07, -0.105].map((y, i) => (
          <Vox key={`nr${i}`} position={[0.14, y, 0.045]} args={[0.05, 0.035, 0.01]} color="#ffffff" />
        ))}
      </group>
    </group>
  )
}
