import React, { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

const BH = 0.52
const BW = 0.34
const BT = 0.018

function getPageStyle(isMobile) {
  return {
    width: isMobile ? '190px' : '220px',
    height: isMobile ? '260px' : '300px',
    padding: isMobile ? '14px 12px' : '18px 16px',
    fontFamily: "'Press Start 2P', monospace",
    overflow: 'hidden',
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
  }
}

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
  const scale = isMobile ? 0.6 : 1
  const camDist = isMobile ? 0.8 : 0.7
  const distFactor = isMobile ? 0.48 : 0.58
  const pageStyle = getPageStyle(isMobile)
  const titleSize = isMobile ? '11px' : '13px'
  const subtitleSize = isMobile ? '7px' : '8px'
  const detailSize = isMobile ? '6px' : '7px'

  const groupRef = useRef()
  const leftCover = useRef()
  const rightCover = useRef()
  const leftPage = useRef()
  const rightPage = useRef()
  const spineRef = useRef()
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

    // Phase 1: Fly
    if (anim.current.fly < 1) {
      anim.current.fly = Math.min(anim.current.fly + 0.03, 1)
    }
    const ft = anim.current.fly
    const fE = 1 - Math.pow(1 - ft, 3)

    groupRef.current.position.lerpVectors(origin.current, dest, fE)
    groupRef.current.quaternion.slerpQuaternions(new THREE.Quaternion(), destQ, fE)

    // Phase 2: Open
    if (ft > 0.75 && anim.current.open < 1) {
      anim.current.open = Math.min(anim.current.open + 0.04, 1)
    }
    const ot = anim.current.open
    const oE = 1 - Math.pow(1 - ot, 2)

    const slideX = oE * (BW / 2 + BT / 2)
    if (leftCover.current) leftCover.current.position.x = -slideX
    if (rightCover.current) rightCover.current.position.x = slideX

    const pageVisible = oE > 0.15
    if (leftPage.current) leftPage.current.visible = pageVisible
    if (rightPage.current) rightPage.current.visible = pageVisible
    if (spineRef.current) spineRef.current.visible = pageVisible

    if (ot >= 1 && !anim.current.done) {
      anim.current.done = true
      setShowContent(true)
    }
  })

  if (!book) return null
  const color = book.color || '#e04040'

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      {/* Click-away plane to close */}
      <mesh position={[0, 0, -0.2]} onClick={(e) => { e.stopPropagation(); onClose() }}>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>

      {/* Left cover */}
      <mesh ref={leftCover}>
        <boxGeometry args={[BW, BH, BT]} />
        <meshLambertMaterial color={color} flatShading />
      </mesh>

      {/* Right cover */}
      <mesh ref={rightCover}>
        <boxGeometry args={[BW, BH, BT]} />
        <meshLambertMaterial color={color} flatShading />
      </mesh>

      {/* Spine */}
      <mesh ref={spineRef} visible={false}>
        <boxGeometry args={[BT, BH + 0.005, BT]} />
        <meshLambertMaterial color={new THREE.Color(color).multiplyScalar(0.5)} flatShading />
      </mesh>

      {/* Left cream page */}
      <mesh ref={leftPage} position={[-BW / 2, 0, BT / 2 + 0.001]} visible={false}>
        <planeGeometry args={[BW * 0.9, BH * 0.9]} />
        <meshBasicMaterial color="#f5f0e2" />
      </mesh>

      {/* Right cream page */}
      <mesh ref={rightPage} position={[BW / 2, 0, BT / 2 + 0.001]} visible={false}>
        <planeGeometry args={[BW * 0.9, BH * 0.9]} />
        <meshBasicMaterial color="#f5f0e2" />
      </mesh>

      {/* HTML content on left page */}
      {showContent && (
        <Html
          position={[-BW / 2, 0, BT / 2 + 0.003]}
          transform
          occlude={false}
          style={{ ...pageStyle, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
          distanceFactor={distFactor}
        >
          <div>
            <h2 style={{ fontSize: titleSize, color, lineHeight: '2', margin: '0 0 8px' }}>
              {book.title}
            </h2>
            <p style={{ fontSize: subtitleSize, color: '#706858', lineHeight: '1.8', margin: '0 0 12px' }}>
              {book.subtitle}
            </p>
            <div style={{ width: '50px', height: '2px', background: color, opacity: 0.35, margin: '0 auto' }} />
          </div>
        </Html>
      )}

      {/* HTML content on right page */}
      {showContent && (
        <Html
          position={[BW / 2, 0, BT / 2 + 0.003]}
          transform
          occlude={false}
          style={{ ...pageStyle, justifyContent: 'flex-start' }}
          distanceFactor={distFactor}
        >
          <p style={{ fontSize: detailSize, color: '#3a3828', lineHeight: '2.4', margin: 0 }}>
            {book.details.split('\n').map((line, i) => (
              <span key={i}>{line}<br /></span>
            ))}
          </p>
        </Html>
      )}

      {/* Close hint */}
      {showContent && (
        <Html
          position={[0, -(BH / 2 + 0.03), BT / 2 + 0.003]}
          transform
          occlude={false}
          distanceFactor={distFactor}
        >
          <p style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: isMobile ? '5px' : '7px', color: '#fff', opacity: 0.5,
            textAlign: 'center', pointerEvents: 'none', margin: 0, whiteSpace: 'nowrap'
          }}>
            [ ESC ] Close
          </p>
        </Html>
      )}
    </group>
  )
}
