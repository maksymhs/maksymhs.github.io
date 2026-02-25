import React, { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, Text } from '@react-three/drei'
import * as THREE from 'three'
import { lang } from '../i18n'

const EXP = {
  openbank: {
    en: {
      company: 'Openbank', role: 'Software Engineer', period: 'Jun 2025 – Present',
      details: 'Digital bank of Santander Group.\n\nBackend microservices with Java & Spring Boot.\n\nScalable financial APIs & cloud architecture.\n\nCI/CD pipelines & automated testing.\n\nAgile methodology in fintech environment.'
    },
    es: {
      company: 'Openbank', role: 'Software Engineer', period: 'Jun 2025 – Presente',
      details: 'Banco digital del Grupo Santander.\n\nMicroservicios backend con Java y Spring Boot.\n\nAPIs financieras escalables y arquitectura cloud.\n\nPipelines CI/CD y testing automatizado.\n\nMetodologia agil en entorno fintech.'
    },
    ru: {
      company: 'Openbank', role: 'Software Engineer', period: 'Июн 2025 – Наст. время',
      details: 'Цифровой банк группы Santander.\n\nBackend-микросервисы на Java и Spring Boot.\n\nМасштабируемые финансовые API и облако.\n\nCI/CD пайплайны и автотесты.\n\nAgile-методология в финтех-среде.'
    },
  },
  paradigma: {
    en: {
      company: 'Paradigma Digital', role: 'Software Engineer', period: 'Oct 2021 – May 2025',
      details: '3 years 8 months.\n\nFull-cycle development, analysis & incident resolution.\n\nJava, Spring Boot, PostgreSQL, Redis.\n\nREST APIs & microservices architecture.\n\nJUnit testing & code quality with Sonar.\n\nGoogle Cloud, Jenkins CI/CD, Kibana monitoring.'
    },
    es: {
      company: 'Paradigma Digital', role: 'Software Engineer', period: 'Oct 2021 – May 2025',
      details: '3 anos y 8 meses.\n\nDesarrollo integral, analisis y resolucion de incidencias.\n\nJava, Spring Boot, PostgreSQL, Redis.\n\nAPIs REST y arquitectura de microservicios.\n\nTesting JUnit y calidad con Sonar.\n\nGoogle Cloud, Jenkins CI/CD, monitorizacion Kibana.'
    },
    ru: {
      company: 'Paradigma Digital', role: 'Software Engineer', period: 'Окт 2021 – Май 2025',
      details: '3 года 8 месяцев.\n\nПолный цикл разработки, анализ и решение инцидентов.\n\nJava, Spring Boot, PostgreSQL, Redis.\n\nREST API и микросервисная архитектура.\n\nJUnit тесты и качество кода через Sonar.\n\nGoogle Cloud, Jenkins CI/CD, мониторинг Kibana.'
    },
  },
  experis: {
    en: {
      company: 'Experis', role: 'Backend Developer', period: 'Nov 2019 – Oct 2021',
      details: '2 years.\n\nBackend services for enterprise clients.\n\nJava, Spring Boot, DB2 & Oracle databases.\n\nSOAP & REST service integration.\n\nUnit testing with JUnit, code analysis.\n\nJenkins, Sonar, OpenShift deployment.'
    },
    es: {
      company: 'Experis', role: 'Backend Developer', period: 'Nov 2019 – Oct 2021',
      details: '2 anos.\n\nServicios backend para clientes empresariales.\n\nJava, Spring Boot, bases de datos DB2 y Oracle.\n\nIntegracion de servicios SOAP y REST.\n\nTesting unitario con JUnit, analisis de codigo.\n\nJenkins, Sonar, despliegue en OpenShift.'
    },
    ru: {
      company: 'Experis', role: 'Backend Developer', period: 'Ноя 2019 – Окт 2021',
      details: '2 года.\n\nBackend-сервисы для корпоративных клиентов.\n\nJava, Spring Boot, базы данных DB2 и Oracle.\n\nИнтеграция SOAP и REST сервисов.\n\nЮнит-тесты JUnit, анализ кода.\n\nJenkins, Sonar, деплой в OpenShift.'
    },
  },
  everis: {
    en: {
      company: 'everis (NTT Data)', role: 'Backend Developer', period: 'Jun 2016 – Sep 2019',
      details: '3 years 4 months. Murcia, Spain.\n\nFirst professional role after university.\n\nJava, Spring Boot, DB2 & Oracle.\n\nSOAP & REST services development.\n\nJUnit testing, Jenkins & Sonar pipelines.\n\nOpenShift container orchestration.'
    },
    es: {
      company: 'everis (NTT Data)', role: 'Backend Developer', period: 'Jun 2016 – Sep 2019',
      details: '3 anos y 4 meses. Murcia, Espana.\n\nPrimer puesto profesional tras la universidad.\n\nJava, Spring Boot, DB2 y Oracle.\n\nDesarrollo de servicios SOAP y REST.\n\nTesting JUnit, pipelines Jenkins y Sonar.\n\nOrquestacion de contenedores OpenShift.'
    },
    ru: {
      company: 'everis (NTT Data)', role: 'Backend Developer', period: 'Июн 2016 – Сен 2019',
      details: '3 года 4 месяца. Мурсия, Испания.\n\nПервая профессиональная позиция после университета.\n\nJava, Spring Boot, DB2 и Oracle.\n\nРазработка SOAP и REST сервисов.\n\nJUnit тесты, пайплайны Jenkins и Sonar.\n\nОркестрация контейнеров OpenShift.'
    },
  },
}

const COLORS = ['#d4a800', '#c09020', '#b08018', '#a07010']
const CW = 0.16
const CH = 0.22
const CT = 0.006

const TARGETS_DESKTOP = [
  [-0.38, 0.85, 0.85],
  [-0.13, 1.05, 0.95],
  [0.13, 1.0, 0.9],
  [0.38, 0.8, 0.8],
]

const TARGETS_MOBILE = [
  [-0.18, 0.65, 0.8],
  [0.18, 0.65, 0.8],
  [-0.18, 0.9, 0.85],
  [0.18, 0.9, 0.85],
]

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return mobile
}

function MagicCard({ data, color, targetPos, delay, open, onSelect, selected, anySelected, parentRef, cardScale = 1 }) {
  const groupRef = useRef()
  const innerRef = useRef()
  const glowRef = useRef()
  const anim = useRef({ rise: 0, flip: 0, zoom: 0 })
  const [hovered, setHovered] = useState(false)
  const [showBack, setShowBack] = useState(false)
  const { camera } = useThree()

  useEffect(() => {
    anim.current = { rise: 0, flip: 0, zoom: 0 }
    setShowBack(false)
  }, [open])

  useEffect(() => {
    if (!selected) {
      // Delay hiding back until flip animation returns past 90°
      const timer = setTimeout(() => setShowBack(false), 400)
      return () => clearTimeout(timer)
    }
  }, [selected])

  useFrame(({ clock }) => {
    if (!groupRef.current || !innerRef.current) return
    const t = clock.elapsedTime

    // Rise from chest
    if (open) {
      anim.current.rise = Math.min(anim.current.rise + 0.02, 1)
    } else {
      anim.current.rise = Math.max(anim.current.rise - 0.04, 0)
    }
    const d = Math.max(0, (anim.current.rise - delay * 0.12) / (1 - delay * 0.12))
    const rE = 1 - Math.pow(1 - Math.min(d, 1), 3)

    // Base floating position
    const bx = THREE.MathUtils.lerp(0, targetPos[0], rE)
    const by = THREE.MathUtils.lerp(-0.3, targetPos[1], rE)
    const bz = THREE.MathUtils.lerp(0, targetPos[2], rE)

    // Compute camera center in parent local space
    const camDir = new THREE.Vector3()
    camera.getWorldDirection(camDir)
    const camCenter = camera.position.clone().add(camDir.multiplyScalar(1.2))
    if (parentRef?.current) {
      parentRef.current.worldToLocal(camCenter)
    }

    // Camera position in local space (for lookAt)
    const camLocal = camera.position.clone()
    if (parentRef?.current) {
      parentRef.current.worldToLocal(camLocal)
    }

    // Zoom animation
    const tZoom = selected ? 1 : 0
    anim.current.zoom += (tZoom - anim.current.zoom) * 0.08
    const zm = anim.current.zoom

    // Flip animation
    const tFlip = selected ? Math.PI : 0
    anim.current.flip += (tFlip - anim.current.flip) * 0.07

    // Show back text once flip passes 90°
    if (anim.current.flip > Math.PI * 0.45 && selected) {
      setShowBack(true)
    }

    // Position: lerp between floating pos and camera center
    groupRef.current.position.x = THREE.MathUtils.lerp(bx, camCenter.x, zm)
    groupRef.current.position.y = THREE.MathUtils.lerp(
      by + (rE > 0.9 && !selected ? Math.sin(t * 1.2 + delay * 2.5) * 0.018 : 0),
      camCenter.y,
      zm
    )
    groupRef.current.position.z = THREE.MathUtils.lerp(bz, camCenter.z, zm)

    // Idle tilt or face camera when selected
    if (zm < 0.05 && rE > 0.9) {
      // Reset to euler-based idle tilt
      groupRef.current.quaternion.identity()
      groupRef.current.rotation.x = Math.sin(t * 0.7 + delay * 1.5) * 0.06
      groupRef.current.rotation.z = Math.sin(t * 0.9 + delay * 3) * 0.04
      groupRef.current.rotation.y = 0
    } else if (zm >= 0.05) {
      // Face the camera: compute world-space quaternion then convert to local
      const cardWorldPos = new THREE.Vector3()
      groupRef.current.getWorldPosition(cardWorldPos)
      const lookM = new THREE.Matrix4().lookAt(camera.position, cardWorldPos, new THREE.Vector3(0, 1, 0))
      const worldQ = new THREE.Quaternion().setFromRotationMatrix(lookM)
      // Remove parent's world rotation to get local rotation
      const parentWorldQ = new THREE.Quaternion()
      if (parentRef?.current) parentRef.current.getWorldQuaternion(parentWorldQ)
      const localQ = parentWorldQ.clone().invert().multiply(worldQ)
      groupRef.current.quaternion.slerp(localQ, 0.12)
    }

    // Flip inner group
    innerRef.current.rotation.y = anim.current.flip

    // Scale: rise + zoom (bigger when selected)
    const s = rE * cardScale * (1 + zm * 1.8)
    groupRef.current.scale.set(s, s, s)
    groupRef.current.visible = rE > 0.01

    // Glow pulse
    if (glowRef.current) {
      const pulse = 0.3 + Math.sin(t * 2 + delay) * 0.15 + (hovered ? 0.3 : 0) + zm * 0.4
      glowRef.current.material.opacity = pulse * rE
      glowRef.current.scale.set(1 + Math.sin(t * 1.5 + delay) * 0.05, 1 + Math.sin(t * 1.8 + delay) * 0.05, 1)
    }
  })

  const showFront = selected ? !showBack : true

  return (
    <group ref={groupRef} visible={false}>
      <group ref={innerRef}>
        {/* Card body */}
        <mesh
          onClick={(e) => { e.stopPropagation(); onSelect() }}
          onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer' }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
        >
          <boxGeometry args={[CW, CH, CT]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={hovered && !selected ? 0.4 : 0.15}
            roughness={0.4}
            metalness={0.6}
            flatShading
          />
        </mesh>

        {/* Gold frame - front */}
        {[
          [0, CH / 2 - 0.006, CT / 2 + 0.001, CW - 0.01, 0.004],
          [0, -CH / 2 + 0.006, CT / 2 + 0.001, CW - 0.01, 0.004],
          [-CW / 2 + 0.004, 0, CT / 2 + 0.001, 0.004, CH - 0.01],
          [CW / 2 - 0.004, 0, CT / 2 + 0.001, 0.004, CH - 0.01],
        ].map(([x, y, z, w, h], i) => (
          <mesh key={i} position={[x, y, z]}>
            <boxGeometry args={[w, h, 0.001]} />
            <meshStandardMaterial color="#f0d860" emissive="#f0d860" emissiveIntensity={0.2} metalness={0.8} roughness={0.3} />
          </mesh>
        ))}

        {/* Corner gems */}
        {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([sx,sy], i) => (
          <mesh key={`gem${i}`} position={[sx * (CW/2 - 0.012), sy * (CH/2 - 0.012), CT/2 + 0.002]}>
            <boxGeometry args={[0.008, 0.008, 0.003]} />
            <meshStandardMaterial color="#ff6030" emissive="#ff4020" emissiveIntensity={0.5} />
          </mesh>
        ))}

        {/* Front: company name — 3D Text so it doesn't bleed through other cards */}
        {showFront && (
          <Text
            position={[0, 0, CT / 2 + 0.003]}
            fontSize={0.013}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            maxWidth={CW * 0.85}
            textAlign="center"
            font="/fonts/PressStart2P-Regular.ttf"
            outlineWidth={0.0012}
            outlineColor="#000000"
          >
            {data.company}
          </Text>
        )}

        {/* Back: full details — only shown after flip past 90° */}
        {showBack && (
          <Html
            position={[0, 0, -CT / 2 - 0.003]}
            rotation={[0, Math.PI, 0]}
            transform
            occlude={false}
            distanceFactor={0.5}
            style={{ pointerEvents: 'none', width: '180px', imageRendering: 'pixelated' }}
          >
            <div style={{
              fontFamily: "'Press Start 2P', monospace",
              background: 'linear-gradient(180deg, #fdf8e8, #f0e8d0)',
              border: '2px solid ' + color,
              padding: '12px 10px',
              boxShadow: '0 0 12px rgba(200,160,30,0.3), 3px 3px 0 #000',
              WebkitFontSmoothing: 'none',
              MozOsxFontSmoothing: 'unset',
            }}>
              <p style={{ fontSize: '8px', color, margin: '0 0 4px', fontWeight: 'bold' }}>{data.role}</p>
              <p style={{ fontSize: '6px', color: '#5a4820', margin: '0 0 8px', fontWeight: 'bold' }}>
                {data.company} · {data.period}
              </p>
              <div style={{ width: '40px', height: '2px', background: color, opacity: 0.35, margin: '0 0 8px' }} />
              <p style={{ fontSize: '6px', color: '#1a1010', lineHeight: '2.2', margin: 0, fontWeight: 'bold' }}>
                {data.details.split('\n').map((line, i) => (
                  <span key={i}>{line}<br /></span>
                ))}
              </p>
            </div>
          </Html>
        )}
      </group>

      {/* Magical glow behind card */}
      <mesh ref={glowRef} position={[0, 0, -0.01]}>
        <planeGeometry args={[CW + 0.04, CH + 0.04]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

    </group>
  )
}

export function FloatingScrollsOverlay({ show, onClose }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  if (!show) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', bottom: isMobile ? '20px' : '30px', left: '50%', transform: 'translateX(-50%)',
        fontFamily: "'Press Start 2P', monospace", fontSize: isMobile ? '11px' : '12px',
        color: '#fff', cursor: 'pointer', pointerEvents: 'auto',
        textShadow: '0 0 10px rgba(0,0,0,0.9), 2px 2px 0 #000',
        zIndex: 100, whiteSpace: 'nowrap',
        padding: isMobile ? '10px 20px' : '6px 12px',
        background: 'rgba(0,0,0,0.4)', borderRadius: '4px',
      }}
    >
      {isMobile ? 'Tap to close' : '[ ESC ] Close'}
    </div>
  )
}

export default function FloatingScrolls({ open, view, onCardSelect }) {
  const [selectedIdx, setSelectedIdx] = useState(null)
  const parentRef = useRef()
  const isMobile = useIsMobile()
  const targets = isMobile ? TARGETS_MOBILE : TARGETS_DESKTOP
  const cardScale = isMobile ? 0.7 : 1
  const isChestView = view === 'chest'

  useEffect(() => {
    if (!open) setSelectedIdx(null)
  }, [open])

  useEffect(() => {
    onCardSelect?.(selectedIdx !== null)
  }, [selectedIdx, onCardSelect])

  // Escape to deselect card
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && selectedIdx !== null) {
        e.stopPropagation()
        setSelectedIdx(null)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [selectedIdx])

  const experiences = useMemo(() => {
    const keys = ['openbank', 'paradigma', 'experis', 'everis']
    return keys.map(k => EXP[k]?.[lang] || EXP[k]?.en)
  }, [])

  // Expose deselect for overlay click
  FloatingScrolls.deselect = () => setSelectedIdx(null)

  return (
    <group ref={parentRef} position={[-3.2, 0.5, -3.2]} rotation={[0, Math.PI / 4, 0]} onPointerMissed={() => setSelectedIdx(null)}>
      {experiences.map((exp, i) => (
        <MagicCard
          key={i}
          data={exp}
          color={COLORS[i]}
          targetPos={targets[i]}
          delay={i}
          open={open && isChestView}
          onSelect={() => setSelectedIdx(selectedIdx === i ? null : i)}
          selected={selectedIdx === i}
          anySelected={selectedIdx !== null}
          parentRef={parentRef}
          cardScale={cardScale}
        />
      ))}
    </group>
  )
}
