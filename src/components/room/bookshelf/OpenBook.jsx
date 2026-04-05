import React, { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text, Html } from '@react-three/drei'
import * as THREE from 'three'

// Desktop: two-page spread.
const BW         = 0.56   // half-page width
const BT         = 0.018
const BH_DESKTOP = 0.88

const CAM_DIST_DESKTOP = 0.95
const CAM_DIST_MOBILE  = 1.0   // mobile: page sized to fill viewport at this distance

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return mobile
}

// Left-aligned flowing text block anchored top-left, natural \n\n paragraph spacing.
function PageText({ details, fontSize, maxWidth, topX, topY, lineHeight = 1.85 }) {
  return (
    <Text
      position={[topX, topY, 0]}
      fontSize={fontSize}
      color="#3a3828"
      anchorX="left"
      anchorY="top"
      maxWidth={maxWidth}
      textAlign="left"
      lineHeight={lineHeight}
      font="/fonts/PressStart2P-Regular.ttf"
    >
      {details}
    </Text>
  )
}

export default function OpenBook({ book, onClose }) {
  const isMobile = useIsMobile()
  const { camera, size } = useThree()

  // Mobile: compute page dimensions to fill the viewport exactly at CAM_DIST_MOBILE
  const fovRad  = (camera.fov * Math.PI) / 180
  const aspect  = size.width / size.height
  const visH    = 2 * CAM_DIST_MOBILE * Math.tan(fovRad / 2)
  const visW    = visH * aspect
  const mobPageH = visH * 0.96
  const mobPageW = visW * 0.96

  const camDist = isMobile ? CAM_DIST_MOBILE : CAM_DIST_DESKTOP
  const BH      = isMobile ? mobPageH : BH_DESKTOP

  const groupRef  = useRef()
  const leftHalf  = useRef()
  const rightHalf = useRef()
  const anim      = useRef({ fly: 0, done: false })
  const origin    = useRef(new THREE.Vector3())
  const [showContent, setShowContent] = useState(false)

  const bookId = book?.id
  useEffect(() => {
    if (!book) return
    anim.current = { fly: 0, done: false }
    setShowContent(false)
    if (book.worldPos) origin.current.set(...book.worldPos)
    if (groupRef.current)  groupRef.current.position.copy(origin.current)
    if (leftHalf.current)  leftHalf.current.rotation.y  = 0
    if (rightHalf.current) rightHalf.current.rotation.y = 0
  }, [bookId])

  useFrame(() => {
    if (!groupRef.current || !book) return

    const dir  = new THREE.Vector3()
    camera.getWorldDirection(dir)
    const dest = camera.position.clone().add(dir.multiplyScalar(camDist))

    const m     = new THREE.Matrix4().lookAt(camera.position, dest, new THREE.Vector3(0, 1, 0))
    const destQ = new THREE.Quaternion().setFromRotationMatrix(m)

    if (anim.current.fly < 1) anim.current.fly = Math.min(anim.current.fly + 0.06, 1)
    const ft = anim.current.fly
    const fE = 1 - Math.pow(1 - ft, 3)

    const pos = new THREE.Vector3().lerpVectors(origin.current, dest, fE)
    if (!isMobile) pos.y += Math.sin(ft * Math.PI) * 0.3   // arc only on desktop
    groupRef.current.position.copy(pos)
    groupRef.current.quaternion.slerpQuaternions(new THREE.Quaternion(), destQ, fE)

    if (isMobile) {
      // Mobile: no spread — stays flat, facing camera
      if (rightHalf.current) rightHalf.current.rotation.y = 0
    } else {
      // Desktop: open like a book
      const oE     = 1 - Math.pow(1 - Math.max(0, (ft - 0.15) / 0.85), 2)
      const vAngle = (-Math.PI / 2) + oE * (Math.PI / 2 - Math.PI / 18)
      if (leftHalf.current)  leftHalf.current.rotation.y  = -vAngle
      if (rightHalf.current) rightHalf.current.rotation.y =  vAngle
    }

    if (ft >= 1 && !anim.current.done) { anim.current.done = true; setShowContent(true) }
  })

  if (!book) return null
  const color     = book.color || '#e04040'
  const darkColor = new THREE.Color(color).multiplyScalar(0.6)

  return (
    <group ref={groupRef}>
      {/* Click-away plane */}
      <mesh position={[0, 0, -0.4]} onClick={(e) => { e.stopPropagation(); onClose() }}>
        <planeGeometry args={[12, 12]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>

      {/* ── DESKTOP ONLY ────────────────────────────────── */}
      {!isMobile && (
        <>
          {/* Spine */}
          <mesh>
            <boxGeometry args={[BT, BH + 0.005, BT * 2]} />
            <meshLambertMaterial color={darkColor} flatShading />
          </mesh>

          {/* LEFT PAGE — title card */}
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
              [0,  BH * 0.46 - 0.004, BW * 0.88, 0.003],
              [0, -BH * 0.46 + 0.004, BW * 0.88, 0.003],
              [-BW * 0.46 + 0.004, 0, 0.003, BH * 0.88],
              [ BW * 0.46 - 0.004, 0, 0.003, BH * 0.88],
            ].map(([x, y, w, h], i) => (
              <mesh key={`lb${i}`} position={[-BW / 2 + x, y, BT / 2 + 0.002]}>
                <planeGeometry args={[w, h]} />
                <meshBasicMaterial color={color} opacity={0.25} transparent />
              </mesh>
            ))}
            {showContent && (
              <group position={[-BW / 2, 0, BT / 2 + 0.003]}>
                <Text position={[0, 0.18, 0]} fontSize={0.026} color={color} anchorX="center" anchorY="middle" maxWidth={BW * 0.85} textAlign="center" lineHeight={1.5} font="/fonts/PressStart2P-Regular.ttf">
                  {book.title}
                </Text>
                <Text position={[0, 0.08, 0]} fontSize={0.014} color={color} anchorX="center" anchorY="middle" fillOpacity={0.35} font="/fonts/PressStart2P-Regular.ttf">
                  {'~ * ~'}
                </Text>
                <Text position={[0, 0.00, 0]} fontSize={0.013} color="#706858" anchorX="center" anchorY="middle" maxWidth={BW * 0.85} textAlign="center" lineHeight={1.8} font="/fonts/PressStart2P-Regular.ttf">
                  {book.subtitle}
                </Text>
                <mesh position={[0, -0.12, 0]}>
                  <planeGeometry args={[BW * 0.5, 0.002]} />
                  <meshBasicMaterial color={color} opacity={0.3} transparent />
                </mesh>
              </group>
            )}
          </group>

          {/* RIGHT PAGE — details */}
          <group ref={rightHalf}>
            <mesh position={[BW / 2, 0, 0]}>
              <boxGeometry args={[BW, BH, BT]} />
              <meshLambertMaterial color={color} flatShading />
            </mesh>
            <mesh position={[BW / 2, 0, BT / 2 + 0.001]}>
              <planeGeometry args={[BW * 0.92, BH * 0.92]} />
              <meshBasicMaterial color="#f8f4e8" />
            </mesh>
            {[
              [0,  BH * 0.46 - 0.004, BW * 0.88, 0.003],
              [0, -BH * 0.46 + 0.004, BW * 0.88, 0.003],
              [-BW * 0.46 + 0.004, 0, 0.003, BH * 0.88],
              [ BW * 0.46 - 0.004, 0, 0.003, BH * 0.88],
            ].map(([x, y, w, h], i) => (
              <mesh key={`rb${i}`} position={[BW / 2 + x, y, BT / 2 + 0.002]}>
                <planeGeometry args={[w, h]} />
                <meshBasicMaterial color={color} opacity={0.25} transparent />
              </mesh>
            ))}
            {showContent && (
              <group position={[BW / 2, 0, BT / 2 + 0.003]}>
                <PageText
                  details={book.details}
                  fontSize={0.013}
                  maxWidth={BW * 0.85}
                  topX={-BW * 0.42}
                  topY={0.18}
                />
              </group>
            )}
          </group>
        </>
      )}

      {/* ── MOBILE ONLY — flat full-screen page, no spread animation ── */}
      {isMobile && (
        <group ref={rightHalf}>
          <mesh>
            <boxGeometry args={[mobPageW, mobPageH, BT]} />
            <meshLambertMaterial color={color} flatShading />
          </mesh>
          <mesh position={[0, 0, BT / 2 + 0.001]}>
            <planeGeometry args={[mobPageW * 0.96, mobPageH * 0.96]} />
            <meshBasicMaterial color="#f8f4e8" />
          </mesh>
          {[
            [0,  mobPageH * 0.48 - 0.003, mobPageW * 0.92, 0.002],
            [0, -mobPageH * 0.48 + 0.003, mobPageW * 0.92, 0.002],
            [-mobPageW * 0.48 + 0.003, 0, 0.002, mobPageH * 0.92],
            [ mobPageW * 0.48 - 0.003, 0, 0.002, mobPageH * 0.92],
          ].map(([x, y, w, h], i) => (
            <mesh key={`mb${i}`} position={[x, y, BT / 2 + 0.002]}>
              <planeGeometry args={[w, h]} />
              <meshBasicMaterial color={color} opacity={0.25} transparent />
            </mesh>
          ))}
          {showContent && (
            <group position={[0, 0, BT / 2 + 0.003]}>
              <Text position={[0, mobPageH * 0.38, 0]} fontSize={mobPageH * 0.028} color={color} anchorX="center" anchorY="middle" maxWidth={mobPageW * 0.88} textAlign="center" lineHeight={1.4} font="/fonts/PressStart2P-Regular.ttf">
                {book.title}
              </Text>
              <mesh position={[0, mobPageH * 0.31, 0]}>
                <planeGeometry args={[mobPageW * 0.6, 0.002]} />
                <meshBasicMaterial color={color} opacity={0.35} transparent />
              </mesh>
              <PageText
                details={book.details}
                fontSize={mobPageH * 0.015}
                maxWidth={mobPageW * 0.88}
                topX={-mobPageW * 0.44}
                topY={mobPageH * 0.28}
                lineHeight={1.9}
              />
            </group>
          )}
        </group>
      )}
    </group>
  )
}
