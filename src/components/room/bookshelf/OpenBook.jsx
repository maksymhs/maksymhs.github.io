import React, { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

// Desktop: two-page spread. Mobile: single full-screen page.
const BW         = 0.56   // half-page width
const BT         = 0.018
const BH_DESKTOP = 0.88   // fills ~85% of desktop screen height
const BH_MOBILE  = 1.20   // fills ~90% of portrait screen height

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return mobile
}

// Renders detail paragraphs (split on \n\n) with a thin separator line between each.
// startY=null → auto-center the block at y=0.
function ParagraphContent({ details, color, fontSize, maxWidth, startY = null, lineHeight = 1.9 }) {
  const paragraphs = details.split('\n\n').filter(Boolean)
  const charW   = fontSize * 0.76   // PressStart2P is wide — conservative estimate
  const cpLine  = Math.max(1, Math.floor(maxWidth / charW))
  const lineH   = fontSize * lineHeight
  const SEP_GAP = fontSize * 3.8    // generous gap so overlaps never happen

  const heights = paragraphs.map(p =>
    p.split('\n').reduce((acc, seg) => acc + Math.max(1, Math.ceil(seg.length / cpLine)), 0) * lineH
  )

  const totalH = heights.reduce((s, h) => s + h, 0) + SEP_GAP * (paragraphs.length - 1)
  const topY   = startY !== null ? startY : totalH / 2   // center block at y=0 by default

  const positions = []
  let y = topY
  heights.forEach(h => { positions.push(y - h / 2); y -= h + SEP_GAP })

  return (
    <>
      {paragraphs.map((para, i) => (
        <React.Fragment key={i}>
          <Text
            position={[0, positions[i], 0]}
            fontSize={fontSize}
            color="#3a3828"
            anchorX="center"
            anchorY="middle"
            maxWidth={maxWidth}
            textAlign="center"
            lineHeight={lineHeight}
            font="/fonts/PressStart2P-Regular.ttf"
          >
            {para}
          </Text>
          {i < paragraphs.length - 1 && (
            <mesh position={[0, positions[i] - heights[i] / 2 - SEP_GAP * 0.45, 0]}>
              <planeGeometry args={[maxWidth * 0.72, 0.003]} />
              <meshBasicMaterial color={color} opacity={0.35} transparent />
            </mesh>
          )}
        </React.Fragment>
      ))}
    </>
  )
}

export default function OpenBook({ book, onClose }) {
  const isMobile = useIsMobile()
  const BH      = isMobile ? BH_MOBILE : BH_DESKTOP
  const scale   = isMobile ? 0.95 : 1
  const camDist = isMobile ? 0.68 : 0.72

  const groupRef  = useRef()
  const leftHalf  = useRef()
  const rightHalf = useRef()
  const anim      = useRef({ fly: 0, done: false })
  const origin    = useRef(new THREE.Vector3())
  const [showContent, setShowContent] = useState(false)
  const { camera } = useThree()

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
    pos.y += Math.sin(ft * Math.PI) * 0.3
    groupRef.current.position.copy(pos)
    groupRef.current.quaternion.slerpQuaternions(new THREE.Quaternion(), destQ, fE)

    const oE = 1 - Math.pow(1 - Math.max(0, (ft - 0.15) / 0.85), 2)
    const vAngle = (-Math.PI / 2) + oE * (Math.PI / 2 - Math.PI / 18)
    if (leftHalf.current)  leftHalf.current.rotation.y  = -vAngle
    if (rightHalf.current) rightHalf.current.rotation.y =  vAngle

    if (ft >= 1 && !anim.current.done) { anim.current.done = true; setShowContent(true) }
  })

  if (!book) return null
  const color     = book.color || '#e04040'
  const darkColor = new THREE.Color(color).multiplyScalar(0.6)

  // Desktop right page — paragraphs auto-centered (startY=null)

  // Mobile — title sits near top, paragraphs start just below subtitle
  const mobileTitleY    = BH * 0.34
  const mobileSubtitleY = BH * 0.20
  const mobileSepLineY  = BH * 0.10
  const mobileContentY  = BH * 0.04

  // Page widths
  const mobilePageW = BW * 2.0

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
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
            {/* Border lines */}
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

          {/* RIGHT PAGE — paragraph details */}
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
                <ParagraphContent
                  details={book.details}
                  color={color}
                  fontSize={0.013}
                  maxWidth={BW * 0.85}
                  startY={null}
                />
              </group>
            )}
          </group>
        </>
      )}

      {/* ── MOBILE ONLY — single full-screen page ────────── */}
      {isMobile && (
        <group ref={rightHalf}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[mobilePageW, BH, BT]} />
            <meshLambertMaterial color={color} flatShading />
          </mesh>
          <mesh position={[0, 0, BT / 2 + 0.001]}>
            <planeGeometry args={[mobilePageW * 0.94, BH * 0.96]} />
            <meshBasicMaterial color="#f8f4e8" />
          </mesh>
          {/* Border lines */}
          {[
            [0,  BH * 0.48 - 0.004, mobilePageW * 0.90, 0.003],
            [0, -BH * 0.48 + 0.004, mobilePageW * 0.90, 0.003],
            [-mobilePageW * 0.47 + 0.004, 0, 0.003, BH * 0.92],
            [ mobilePageW * 0.47 - 0.004, 0, 0.003, BH * 0.92],
          ].map(([x, y, w, h], i) => (
            <mesh key={`mb${i}`} position={[x, y, BT / 2 + 0.002]}>
              <planeGeometry args={[w, h]} />
              <meshBasicMaterial color={color} opacity={0.25} transparent />
            </mesh>
          ))}
          {showContent && (
            <group position={[0, 0, BT / 2 + 0.003]}>
              {/* Title */}
              <Text position={[0, mobileTitleY, 0]} fontSize={0.028} color={color} anchorX="center" anchorY="middle" maxWidth={mobilePageW * 0.85} textAlign="center" lineHeight={1.4} font="/fonts/PressStart2P-Regular.ttf">
                {book.title}
              </Text>
              {/* Subtitle */}
              <Text position={[0, mobileSubtitleY, 0]} fontSize={0.015} color="#706858" anchorX="center" anchorY="middle" maxWidth={mobilePageW * 0.85} textAlign="center" lineHeight={1.7} font="/fonts/PressStart2P-Regular.ttf">
                {book.subtitle}
              </Text>
              {/* Separator */}
              <mesh position={[0, mobileSepLineY, 0]}>
                <planeGeometry args={[mobilePageW * 0.55, 0.002]} />
                <meshBasicMaterial color={color} opacity={0.35} transparent />
              </mesh>
              {/* Paragraphs with separators */}
              <ParagraphContent
                details={book.details}
                color={color}
                fontSize={0.018}
                maxWidth={mobilePageW * 0.85}
                startY={mobileContentY}
              />
            </group>
          )}
        </group>
      )}
    </group>
  )
}
