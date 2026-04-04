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
  const scale = isMobile ? 0.9 : 1
  const camDist = isMobile ? 0.85 : 0.65
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
      anim.current.fly = Math.min(anim.current.fly + 0.06, 1)
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

      {/* Spine (center ridge) — hidden on mobile */}
      {!isMobile && (
        <mesh>
          <boxGeometry args={[BT, BH + 0.005, BT * 2]} />
          <meshLambertMaterial color={darkColor} flatShading />
        </mesh>
      )}

      {/* === LEFT HALF — hidden on mobile === */}
      {!isMobile && (
        <group ref={leftHalf}>
          <mesh position={[-BW / 2, 0, 0]}>
            <boxGeometry args={[BW, BH, BT]} />
            <meshLambertMaterial color={color} flatShading />
          </mesh>
          <mesh position={[-BW / 2, 0, BT / 2 + 0.001]}>
            <planeGeometry args={[BW * 0.92, BH * 0.92]} />
            <meshBasicMaterial color="#f5f0e2" />
          </mesh>
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
          {showContent && (
            <group position={[-BW / 2, 0, BT / 2 + 0.003]}>
              <Text position={[0, 0.12, 0]} fontSize={0.02} color={color} anchorX="center" anchorY="middle" maxWidth={BW * 0.8} textAlign="center" lineHeight={1.6} font="/fonts/PressStart2P-Regular.ttf">
                {book.title}
              </Text>
              <Text position={[0, 0.06, 0]} fontSize={0.012} color={color} anchorX="center" anchorY="middle" fillOpacity={0.35} font="/fonts/PressStart2P-Regular.ttf">
                {'~ * ~'}
              </Text>
              <Text position={[0, -0.02, 0]} fontSize={0.011} color="#706858" anchorX="center" anchorY="middle" maxWidth={BW * 0.8} textAlign="center" lineHeight={1.8} font="/fonts/PressStart2P-Regular.ttf">
                {book.subtitle}
              </Text>
              <mesh position={[0, -0.1, 0]}>
                <planeGeometry args={[BW * 0.45, 0.002]} />
                <meshBasicMaterial color={color} opacity={0.3} transparent />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* === RIGHT HALF — centered on mobile, offset on desktop === */}
      <group ref={rightHalf}>
        <mesh position={[isMobile ? 0 : BW / 2, 0, 0]}>
          <boxGeometry args={[isMobile ? BW * 1.8 : BW, BH, BT]} />
          <meshLambertMaterial color={color} flatShading />
        </mesh>
        <mesh position={[isMobile ? 0 : BW / 2, 0, BT / 2 + 0.001]}>
          <planeGeometry args={[isMobile ? BW * 1.8 * 0.92 : BW * 0.92, BH * 0.92]} />
          <meshBasicMaterial color="#f8f4e8" />
        </mesh>
        {[
          [0, BH * 0.92 / 2 - 0.004, (isMobile ? BW * 1.8 : BW) * 0.88, 0.003],
          [0, -BH * 0.92 / 2 + 0.004, (isMobile ? BW * 1.8 : BW) * 0.88, 0.003],
          [-(isMobile ? BW * 1.8 : BW) * 0.92 / 2 + 0.004, 0, 0.003, BH * 0.88],
          [(isMobile ? BW * 1.8 : BW) * 0.92 / 2 - 0.004, 0, 0.003, BH * 0.88],
        ].map(([x, y, w, h], i) => (
          <mesh key={`rb${i}`} position={[(isMobile ? 0 : BW / 2) + x, y, BT / 2 + 0.002]}>
            <planeGeometry args={[w, h]} />
            <meshBasicMaterial color={color} opacity={0.25} transparent />
          </mesh>
        ))}
        {showContent && (
          <group position={[isMobile ? 0 : BW / 2, 0, BT / 2 + 0.003]}>
            {isMobile && (
              <Text position={[0, BH * 0.32, 0]} fontSize={0.015} color={color} anchorX="center" anchorY="middle" maxWidth={BW * 1.3} textAlign="center" font="/fonts/PressStart2P-Regular.ttf">
                {book.title}
              </Text>
            )}
            <Text
              position={[0, isMobile ? -0.04 : 0.05, 0]}
              fontSize={isMobile ? 0.013 : 0.009}
              color="#3a3828"
              anchorX="center"
              anchorY="middle"
              maxWidth={isMobile ? BW * 1.3 : BW * 0.8}
              textAlign="center"
              lineHeight={1.9}
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
