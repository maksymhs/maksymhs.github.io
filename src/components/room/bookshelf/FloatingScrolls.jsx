import React, { useRef, useState, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { lang } from '../../../i18n'

const EXP = {
  openbank: {
    en: {
      company: 'Openbank', role: 'Software Engineer', period: 'Jun 2025 – Present',
      details: 'Santander Group digital bank — Germany market launch.\n\nJava & Spring Boot backend adapting domain model to German regulatory requirements.\n\nAWS SQS event-driven architecture for decoupled async processing.\n\nLarge multi-team enterprise codebase — ensuring architectural consistency across service boundaries.'
    },
    es: {
      company: 'Openbank', role: 'Software Engineer', period: 'Jun 2025 – Presente',
      details: 'Banco digital del Grupo Santander — lanzamiento en Alemania.\n\nBackend Java & Spring Boot adaptando modelo de dominio a requisitos regulatorios alemanes.\n\nArquitectura event-driven con AWS SQS para procesamiento async desacoplado.\n\nCodebase empresarial multi-equipo — consistencia arquitectónica entre servicios.'
    },
    ru: {
      company: 'Openbank', role: 'Software Engineer', period: 'Июн 2025 – Наст. время',
      details: 'Цифровой банк Santander Group — выход на рынок Германии.\n\nJava и Spring Boot: адаптация доменной модели под немецкие регуляторные требования.\n\nEvent-driven архитектура на AWS SQS для асинхронной обработки.\n\nКрупный мультикомандный enterprise-кодбейз — архитектурная согласованность между сервисами.'
    },
  },
  paradigma: {
    en: {
      company: 'Paradigma Digital', role: 'Software Engineer', period: 'Oct 2021 – May 2025',
      details: 'Simyo — #1 telco app in Spain (4.8 Play Store / 4.7 App Store).\n\n2x faster API via optimized aggregation.\n\nLed MVC → hexagonal architecture migration.\n\nAOP instrumentation → Kibana anomaly detection.\n\nGrafana dashboards & alerting from scratch.\n\nJava · Spring Boot · PostgreSQL · Redis · GCP · Kibana'
    },
    es: {
      company: 'Paradigma Digital', role: 'Software Engineer', period: 'Oct 2021 – May 2025',
      details: 'Simyo — app de telco #1 en España (4.8 Play Store / 4.7 App Store).\n\nRespuestas 2x más rápidas con agregación optimizada.\n\nMigración MVC → arquitectura hexagonal.\n\nInstrumentación AOP → Kibana.\n\nDashboards Grafana y alertas desde cero.\n\nJava · Spring Boot · PostgreSQL · Redis · GCP'
    },
    ru: {
      company: 'Paradigma Digital', role: 'Software Engineer', period: 'Окт 2021 – Май 2025',
      details: 'Simyo — #1 телеком-приложение Испании (4.8 Play Store).\n\nAPI ускорен в 2 раза через оптимизацию.\n\nМиграция MVC → гексагональная.\n\nAOP-инструментация → Kibana.\n\nGrafana дашборды с нуля.\n\nJava · Spring Boot · PostgreSQL · Redis · GCP'
    },
  },
  experis: {
    en: {
      company: 'Experis', role: 'Software Engineer', period: 'Nov 2019 – Oct 2021',
      details: 'Banco Santander: microservices bridging Spring Boot and legacy COBOL (TRX) mainframe.\n\nCircuit breakers (Hystrix) for fault tolerance under high-concurrency workloads.\n\nSelenium E2E test suites integrated into Jenkins CI/CD — one of the first teams in the project.\n\nFira Barcelona (MWC): COVID access control services integrating health verification APIs.\n\nTech: Java · Spring Boot · Hystrix · DB2 · Oracle · OpenShift · Jenkins · Gradle'
    },
    es: {
      company: 'Experis', role: 'Software Engineer', period: 'Nov 2019 – Oct 2021',
      details: 'Banco Santander: microservicios entre Spring Boot y mainframe COBOL (TRX) legacy.\n\nCircuit breakers (Hystrix) para tolerancia a fallos en cargas de alta concurrencia.\n\nSuites de tests E2E Selenium integrados en Jenkins CI/CD — uno de los primeros equipos del proyecto.\n\nFira Barcelona (MWC): servicios de control de acceso COVID con APIs de verificación sanitaria.\n\nTech: Java · Spring Boot · Hystrix · DB2 · Oracle · OpenShift · Jenkins · Gradle'
    },
    ru: {
      company: 'Experis', role: 'Software Engineer', period: 'Ноя 2019 – Окт 2021',
      details: 'Banco Santander: микросервисы между Spring Boot и legacy COBOL (TRX) мейнфреймом.\n\nCircuit breakers (Hystrix) для отказоустойчивости при высоких нагрузках.\n\nSelenium E2E тесты в Jenkins CI/CD — одна из первых команд в проекте.\n\nFira Barcelona (МВК): сервисы COVID-контроля доступа с интеграцией API верификации здоровья.\n\nTech: Java · Spring Boot · Hystrix · DB2 · Oracle · OpenShift · Jenkins · Gradle'
    },
  },
  everis: {
    en: {
      company: 'everis (NTT Data)', role: 'Software Engineer', period: 'Jun 2016 – Sep 2019',
      details: 'Telefónica backend — enterprise services for critical telecom infrastructure.\n\nSOAP & RESTful services for cross-system integrations.\n\nJUnit + SonarQube quality practices that reduced defect rates and became team standard.\n\nFirst professional role (3y 4m). Murcia, Spain.\n\nTech: Java · Spring Boot · DB2 · Oracle · Jenkins · SonarQube · OpenShift'
    },
    es: {
      company: 'everis (NTT Data)', role: 'Software Engineer', period: 'Jun 2016 – Sep 2019',
      details: 'Backend para Telefónica — servicios enterprise para infraestructura de telecomunicaciones crítica.\n\nServicios SOAP y RESTful para integraciones entre sistemas.\n\nPrácticas JUnit + SonarQube que redujeron defectos y se convirtieron en estándar del equipo.\n\nPrimer puesto profesional (3a 4m). Murcia, España.\n\nTech: Java · Spring Boot · DB2 · Oracle · Jenkins · SonarQube · OpenShift'
    },
    ru: {
      company: 'everis (NTT Data)', role: 'Software Engineer', period: 'Июн 2016 – Сен 2019',
      details: 'Backend для Telefónica — enterprise-сервисы для критической телеком-инфраструктуры.\n\nSOAP и RESTful сервисы для межсистемных интеграций.\n\nJUnit + SonarQube практики снизили дефектность и стали стандартом команды.\n\nПервая профессиональная позиция (3г 4м). Мурсия, Испания.\n\nTech: Java · Spring Boot · DB2 · Oracle · Jenkins · SonarQube · OpenShift'
    },
  },
}

const COLORS = ['#4080e0', '#e04040', '#40c060', '#a050d0']

const TARGETS_DESKTOP = [
  [-0.45, 0.75, 0.3],
  [-0.15, 0.95, 0.25],
  [0.15, 0.9, 0.3],
  [0.45, 0.7, 0.25],
]

const TARGETS_MOBILE = [
  [-0.28, 0.5, 0.15],
  [0.28, 0.5, 0.15],
  [-0.28, 0.95, 0.15],
  [0.28, 0.95, 0.15],
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

const BW = 0.14
const BH = 0.42
const BD = 0.24

function FloatingBook({ data, color, targetPos, delay, open, onSelect, bookScale = 1 }) {
  const groupRef = useRef()
  const anim = useRef({ rise: 0 })
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    anim.current = { rise: 0 }
  }, [open])

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const t = clock.elapsedTime

    if (open) {
      anim.current.rise = Math.min(anim.current.rise + 0.02, 1)
    } else {
      anim.current.rise = Math.max(anim.current.rise - 0.04, 0)
    }
    const d = Math.max(0, (anim.current.rise - delay * 0.12) / (1 - delay * 0.12))
    const rE = 1 - Math.pow(1 - Math.min(d, 1), 3)

    groupRef.current.position.x = THREE.MathUtils.lerp(0, targetPos[0], rE)
    groupRef.current.position.y = THREE.MathUtils.lerp(-0.3, targetPos[1] + Math.sin(t * 1.1 + delay * 2.2) * 0.022, rE)
    groupRef.current.position.z = THREE.MathUtils.lerp(0, targetPos[2], rE)

    if (rE > 0.9) {
      groupRef.current.rotation.x = Math.sin(t * 0.6 + delay * 1.4) * 0.05
      groupRef.current.rotation.z = Math.sin(t * 0.8 + delay * 2.8) * 0.04
      groupRef.current.rotation.y = hovered ? Math.sin(t * 2) * 0.08 : 0
    }

    const s = rE * bookScale
    groupRef.current.scale.set(s, s, s)
    groupRef.current.visible = rE > 0.01
  })

  const darkColor = new THREE.Color(color).multiplyScalar(0.55).getStyle()

  return (
    <group ref={groupRef} visible={false}>
      {/* Book body */}
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          const worldPos = new THREE.Vector3()
          groupRef.current.getWorldPosition(worldPos)
          onSelect([worldPos.x, worldPos.y, worldPos.z])
        }}
        onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
      >
        <boxGeometry args={[BW, BH, BD]} />
        <meshLambertMaterial color={hovered ? '#ffffff' : color} flatShading />
      </mesh>
      {/* Spine stripe */}
      <mesh position={[-BW / 2 + 0.005, 0, 0]}>
        <boxGeometry args={[0.008, BH, BD]} />
        <meshLambertMaterial color={darkColor} flatShading />
      </mesh>
      {/* Top/bottom trim */}
      {[BH / 2 - 0.01, -BH / 2 + 0.01].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <boxGeometry args={[BW + 0.002, 0.012, BD + 0.002]} />
          <meshLambertMaterial color={darkColor} flatShading />
        </mesh>
      ))}
      {/* Spine label */}
      <Text
        position={[0, 0, BD / 2 + 0.002]}
        rotation={[0, 0, -Math.PI / 2]}
        fontSize={0.038}
        color="#ffffff"
        fillOpacity={0.5}
        anchorX="center"
        anchorY="middle"
        maxWidth={BH * 0.85}
        textAlign="center"
        font="/fonts/PressStart2P-Regular.ttf"
      >
        {data.company}
      </Text>
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

export default function FloatingScrolls({ open, view, onCardClick, currentLang }) {
  const parentRef = useRef()
  const isMobile = useIsMobile()
  const targets = isMobile ? TARGETS_MOBILE : TARGETS_DESKTOP
  const cardScale = isMobile ? 0.6 : 0.82
  const isChestView = view === 'chest'

  const experiences = useMemo(() => {
    const keys = ['openbank', 'paradigma', 'experis', 'everis']
    return keys.map((k, i) => ({ ...EXP[k]?.[currentLang || lang] || EXP[k]?.en, color: COLORS[i] }))
  }, [currentLang])

  return (
    <group ref={parentRef} position={[-3.2, 0.5, -3.2]} rotation={[0, Math.PI / 4, 0]}>
      {experiences.map((exp, i) => (
        <FloatingBook
          key={i}
          data={exp}
          color={exp.color}
          targetPos={targets[i]}
          delay={i}
          open={open && isChestView}
          onSelect={(worldPos) => onCardClick?.({ ...exp, id: exp.company, title: exp.company, subtitle: exp.role + ' · ' + exp.period, worldPos })}
          bookScale={cardScale}
        />
      ))}
    </group>
  )
}
