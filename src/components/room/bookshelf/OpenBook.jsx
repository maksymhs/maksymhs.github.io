import React, { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

const BH = 0.52
const BW = 0.34
const BT = 0.018

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return mobile
}

export default function OpenBook({ book, onClose }) {
  const isMobile = useIsMobile()
  const scale = isMobile ? 0.45 : 1
  const camDist = isMobile ? 0.6 : 0.65
  const groupRef = useRef()
  const leftHalf = useRef()
  const rightHalf = useRef()
  const anim = useRef({ fly: 0, open: 0, done: false })
  const origin = useRef(new THREE.Vector3())
  const [showContent, setShowContent] = useState(false)
  const { camera } = useThree()

  const bookId = book?.id
  useEffect(() => {
    if (!book) return
    anim.current = { fly: 0, open: 0, done: false }
    setShowContent(false)
    if (book.worldPos) origin.current.set(...book.worldPos)
    if (groupRef.current) groupRef.current.position.copy(origin.current)
    if (leftHalf.current) leftHalf.current.rotation.y = 0
    if (rightHalf.current) rightHalf.current.rotation.y = 0
  }, [bookId])

  useFrame(() => {
    if (!groupRef.current || !book) return

    const dir = new THREE.Vector3()
    camera.getWorldDirection(dir)
    const dest = camera.position.clone().add(dir.multiplyScalar(camDist))

    const m = new THREE.Matrix4().lookAt(
      camera.position, dest, new THREE.Vector3(0, 1, 0)
    )
    const destQ = new THREE.Quaternion().setFromRotationMatrix(m)

    // Phase 1: Fly with arc
    if (anim.current.fly < 1) {
      anim.current.fly = Math.min(anim.current.fly + 0.025, 1)
    }
    const ft = anim.current.fly
    const fE = 1 - Math.pow(1 - ft, 3)

    const arcHeight = Math.sin(ft * Math.PI) * 0.3
    const pos = new THREE.Vector3().lerpVectors(origin.current, dest, fE)
    pos.y += arcHeight
    groupRef.current.position.copy(pos)
    groupRef.current.quaternion.slerpQuaternions(new THREE.Quaternion(), destQ, fE)

    // Open in V gradually during flight: starts at 15%, fully open at 100%
    const openProgress = Math.max(0, (ft - 0.15) / 0.85)
    const oE = 1 - Math.pow(1 - openProgress, 2)

    // Open from -90° (closed) to -10° (nearly flat, pages facing viewer)
    const startAngle = -Math.PI / 2
    const endAngle = -Math.PI / 18
    const vAngle = startAngle + oE * (endAngle - startAngle)
    if (leftHalf.current) leftHalf.current.rotation.y = -vAngle
    if (rightHalf.current) rightHalf.current.rotation.y = vAngle

    if (ft >= 1 && !anim.current.done) {
      anim.current.done = true
      setShowContent(true)
    }
  })

  if (!book) return null
  const color = book.color || '#e04040'
  const darkColor = new THREE.Color(color).multiplyScalar(0.6)

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      {/* Click-away plane */}
      <mesh position={[0, 0, -0.3]} onClick={(e) => { e.stopPropagation(); onClose() }}>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>

      {/* Spine (center ridge) */}
      <mesh>
        <boxGeometry args={[BT, BH + 0.005, BT * 2]} />
        <meshLambertMaterial color={darkColor} flatShading />
      </mesh>

      {/* === LEFT HALF (pivots from spine) === */}
      <group ref={leftHalf}>
        {/* Cover */}
        <mesh position={[-BW / 2, 0, 0]}>
          <boxGeometry args={[BW, BH, BT]} />
          <meshLambertMaterial color={color} flatShading />
        </mesh>
        {/* Page */}
        <mesh position={[-BW / 2, 0, BT / 2 + 0.001]}>
          <planeGeometry args={[BW * 0.92, BH * 0.92]} />
          <meshBasicMaterial color="#f5f0e2" />
        </mesh>
        {/* Border decoration */}
        {[
          [0, BH * 0.92 / 2 - 0.004, BW * 0.88, 0.003],
          [0, -BH * 0.92 / 2 + 0.004, BW * 0.88, 0.003],
          [-BW * 0.92 / 2 + 0.004, 0, 0.003, BH * 0.88],
          [BW * 0.92 / 2 - 0.004, 0, 0.003, BH * 0.88],
        ].map(([x, y, w, h], i) => (
          <mesh key={`lb${i}`} position={[-BW / 2 + x, y, BT / 2 + 0.002]}>
            <planeGeometry args={[w, h]} />
            <meshBasicMaterial color={color} opacity={0.25} transparent />
          </mesh>
        ))}
        {/* Left page content */}
        {showContent && (
          <group position={[-BW / 2, 0, BT / 2 + 0.003]}>
            <Text
              position={[0, 0.12, 0]}
              fontSize={0.02}
              color={color}
              anchorX="center"
              anchorY="middle"
              maxWidth={BW * 0.8}
              textAlign="center"
              lineHeight={1.6}
              font="/fonts/PressStart2P-Regular.ttf"
            >
              {book.title}
            </Text>
            <Text
              position={[0, 0.06, 0]}
              fontSize={0.012}
              color={color}
              anchorX="center"
              anchorY="middle"
              fillOpacity={0.35}
              font="/fonts/PressStart2P-Regular.ttf"
            >
              {'~ * ~'}
            </Text>
            <Text
              position={[0, -0.02, 0]}
              fontSize={0.011}
              color="#706858"
              anchorX="center"
              anchorY="middle"
              maxWidth={BW * 0.8}
              textAlign="center"
              lineHeight={1.8}
              font="/fonts/PressStart2P-Regular.ttf"
            >
              {book.subtitle}
            </Text>
            <mesh position={[0, -0.1, 0]}>
              <planeGeometry args={[BW * 0.45, 0.002]} />
              <meshBasicMaterial color={color} opacity={0.3} transparent />
            </mesh>
          </group>
        )}
      </group>

      {/* === RIGHT HALF (pivots from spine) === */}
      <group ref={rightHalf}>
        {/* Cover */}
        <mesh position={[BW / 2, 0, 0]}>
          <boxGeometry args={[BW, BH, BT]} />
          <meshLambertMaterial color={color} flatShading />
        </mesh>
        {/* Page */}
        <mesh position={[BW / 2, 0, BT / 2 + 0.001]}>
          <planeGeometry args={[BW * 0.92, BH * 0.92]} />
          <meshBasicMaterial color="#f8f4e8" />
        </mesh>
        {/* Border decoration */}
        {[
          [0, BH * 0.92 / 2 - 0.004, BW * 0.88, 0.003],
          [0, -BH * 0.92 / 2 + 0.004, BW * 0.88, 0.003],
          [-BW * 0.92 / 2 + 0.004, 0, 0.003, BH * 0.88],
          [BW * 0.92 / 2 - 0.004, 0, 0.003, BH * 0.88],
        ].map(([x, y, w, h], i) => (
          <mesh key={`rb${i}`} position={[BW / 2 + x, y, BT / 2 + 0.002]}>
            <planeGeometry args={[w, h]} />
            <meshBasicMaterial color={color} opacity={0.25} transparent />
          </mesh>
        ))}
        {/* Right page content */}
        {showContent && (
          <group position={[BW / 2, 0, BT / 2 + 0.003]}>
            <Text
              position={[0, 0.05, 0]}
              fontSize={0.009}
              color="#3a3828"
              anchorX="center"
              anchorY="middle"
              maxWidth={BW * 0.8}
              textAlign="center"
              lineHeight={2.2}
              font="/fonts/PressStart2P-Regular.ttf"
            >
              {book.details.replace(/\n\n/g, '\n')}
            </Text>
          </group>
        )}
      </group>

    </group>
  )
}
