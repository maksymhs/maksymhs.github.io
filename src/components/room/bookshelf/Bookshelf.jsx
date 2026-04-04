import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import Vox from '../../common/Vox'
import { lang } from '../../../i18n'

const BOOK_I18N = {
  java: {
    en: { title: 'Java', subtitle: '8+ years of experience', details: 'Core language across all professional projects since 2016.\n\nJava 8–21, Streams, Generics, Concurrency, JVM tuning.\n\nUsed at everis, Experis, Paradigma Digital, and Openbank for building robust backend systems.' },
    es: { title: 'Java', subtitle: '8+ años de experiencia', details: 'Lenguaje principal en todos los proyectos profesionales desde 2016.\n\nJava 8–21, Streams, Genéricos, Concurrencia, optimización JVM.\n\nUsado en everis, Experis, Paradigma Digital y Openbank para sistemas backend robustos.' },
    ru: { title: 'Java', subtitle: '8+ лет опыта', details: 'Основной язык во всех профессиональных проектах с 2016.\n\nJava 8–21, Streams, Generics, многопоточность, настройка JVM.\n\nИспользовал в everis, Experis, Paradigma Digital и Openbank.' },
  },
  spring: {
    en: { title: 'Spring Boot', subtitle: 'Full Spring ecosystem', details: 'Spring Boot, Spring MVC, Spring Security, Spring Data, Spring AOP.\n\nProxy-based AOP instrumentation for cross-cutting logging and security monitoring.\n\nDependency injection, auto-configuration, and production-ready patterns.\n\nUsed across all 4 companies since 2016.' },
    es: { title: 'Spring Boot', subtitle: 'Ecosistema Spring completo', details: 'Spring Boot, Spring MVC, Spring Security, Spring Data, Spring AOP.\n\nInstrumentación AOP basada en proxies para logging y monitorización de seguridad.\n\nInyección de dependencias, autoconfiguración y patrones listos para producción.\n\nUsado en las 4 empresas desde 2016.' },
    ru: { title: 'Spring Boot', subtitle: 'Полная экосистема Spring', details: 'Spring Boot, Spring MVC, Spring Security, Spring Data, Spring AOP.\n\nAOP-инструментация через прокси для логирования и security-мониторинга.\n\nВнедрение зависимостей, автоконфигурация и production-ready паттерны.\n\nИспользовал во всех 4 компаниях с 2016 года.' },
  },
  databases: {
    en: { title: 'Databases', subtitle: 'PostgreSQL · Redis · DB2 · Oracle', details: 'Schema design, complex queries, performance tuning and migrations.\n\nRedis for caching strategies.\nPostgreSQL at Paradigma Digital.\nDB2 & Oracle at everis and Experis.' },
    es: { title: 'Bases de Datos', subtitle: 'PostgreSQL · Redis · DB2 · Oracle', details: 'Diseño de esquemas, consultas complejas, optimización y migraciones.\n\nRedis para estrategias de caché.\nPostgreSQL en Paradigma Digital.\nDB2 y Oracle en everis y Experis.' },
    ru: { title: 'Базы данных', subtitle: 'PostgreSQL · Redis · DB2 · Oracle', details: 'Проектирование схем, сложные запросы, оптимизация и миграции.\n\nRedis для кэширования.\nPostgreSQL в Paradigma Digital.\nDB2 и Oracle в everis и Experis.' },
  },
  apis: {
    en: { title: 'REST & SOAP APIs', subtitle: 'API design & integration', details: 'Designing and consuming RESTful services.\n\nSOAP/WSDL integration for legacy systems.\n\nAPI documentation with Swagger/OpenAPI.\n\nVersioning strategies and contract-first development.' },
    es: { title: 'APIs REST y SOAP', subtitle: 'Diseño e integración de APIs', details: 'Diseño y consumo de servicios RESTful.\n\nIntegración SOAP/WSDL para sistemas legacy.\n\nDocumentación con Swagger/OpenAPI.\n\nEstrategias de versionado y desarrollo contract-first.' },
    ru: { title: 'REST и SOAP API', subtitle: 'Проектирование и интеграция', details: 'Проектирование и потребление REST-сервисов.\n\nИнтеграция SOAP/WSDL для legacy-систем.\n\nДокументация через Swagger/OpenAPI.\n\nСтратегии версионирования и contract-first подход.' },
  },
  devops: {
    en: { title: 'DevOps & CI/CD', subtitle: 'Jenkins · Maven · Gradle · Sonar', details: 'CI/CD pipelines with Jenkins — including Selenium E2E quality gates.\n\nBuild tooling with Maven and Gradle (multi-module projects at MWC/Experis).\n\nCode quality enforcement with SonarQube across all projects.\n\nContainerized deployments on OpenShift and Docker.\n\nGitLab CI pipelines and merge strategies.' },
    es: { title: 'DevOps & CI/CD', subtitle: 'Jenkins · Maven · Gradle · Sonar', details: 'Pipelines CI/CD con Jenkins — incluyendo tests E2E Selenium como quality gates.\n\nBuild con Maven y Gradle (proyectos multi-módulo en MWC/Experis).\n\nControl de calidad con SonarQube en todos los proyectos.\n\nDespliegues en contenedores con OpenShift y Docker.\n\nPipelines GitLab CI y estrategias de merge.' },
    ru: { title: 'DevOps и CI/CD', subtitle: 'Jenkins · Maven · Gradle · Sonar', details: 'CI/CD пайплайны с Jenkins — включая Selenium E2E quality gates.\n\nСборка с Maven и Gradle (мультимодульные проекты на МВК/Experis).\n\nКонтроль качества через SonarQube во всех проектах.\n\nКонтейнерные деплои на OpenShift и Docker.\n\nGitLab CI пайплайны и стратегии мержа.' },
  },
  cloud: {
    en: { title: 'Cloud & Infra', subtitle: 'GCP · AWS · OpenShift · Docker', details: 'AWS SQS for event-driven architecture at Openbank. AWS CloudWatch for monitoring.\n\nGoogle Cloud Platform for microservices deployment at Paradigma Digital.\n\nOpenShift container orchestration at Experis and everis.\n\nDocker for containerized deployments.' },
    es: { title: 'Cloud & Infra', subtitle: 'GCP · AWS · OpenShift · Docker', details: 'AWS SQS para arquitectura event-driven en Openbank. AWS CloudWatch para monitorización.\n\nGoogle Cloud Platform para despliegue de microservicios en Paradigma Digital.\n\nOrquestación de contenedores OpenShift en Experis y everis.\n\nDocker para despliegues contenerizados.' },
    ru: { title: 'Облако и Инфра', subtitle: 'GCP · AWS · OpenShift · Docker', details: 'AWS SQS для event-driven архитектуры в Openbank. AWS CloudWatch для мониторинга.\n\nGoogle Cloud Platform для деплоя микросервисов в Paradigma Digital.\n\nOpenShift оркестрация контейнеров в Experis и everis.\n\nDocker для контейнерных деплоев.' },
  },
  testing: {
    en: { title: 'Testing', subtitle: 'JUnit · Selenium · Mockito', details: 'Unit testing with JUnit 5 and Mockito across all projects.\n\nSelenium-based E2E functional test suites integrated into Jenkins CI/CD at Experis — one of the first teams to adopt this in the project.\n\nCode coverage and quality enforcement via SonarQube.' },
    es: { title: 'Testing', subtitle: 'JUnit · Selenium · Mockito', details: 'Testing unitario con JUnit 5 y Mockito en todos los proyectos.\n\nSuites de tests funcionales E2E con Selenium integrados en Jenkins CI/CD en Experis — uno de los primeros equipos del proyecto en adoptarlo.\n\nCobertura y calidad de código con SonarQube.' },
    ru: { title: 'Тестирование', subtitle: 'JUnit · Selenium · Mockito', details: 'Юнит-тесты с JUnit 5 и Mockito во всех проектах.\n\nSelenium E2E функциональные тесты в Jenkins CI/CD в Experis — одна из первых команд в проекте.\n\nПокрытие и качество кода через SonarQube.' },
  },
  tools: {
    en: { title: 'Observability', subtitle: 'Grafana · Kibana · AOP', details: 'Grafana dashboards and alerting pipelines built from scratch at Paradigma Digital — reduced mean time to detection for production incidents.\n\nKibana for real-time anomaly detection fed by AOP-based instrumentation.\n\nSpring Boot Actuator for health and metrics endpoints.\n\nGit workflows: GitFlow, GitLab CI pipelines.' },
    es: { title: 'Observabilidad', subtitle: 'Grafana · Kibana · AOP', details: 'Dashboards Grafana y pipelines de alertas construidos desde cero en Paradigma Digital — reducción del tiempo de detección de incidentes en producción.\n\nKibana para detección de anomalías en tiempo real alimentado por instrumentación AOP.\n\nSpring Boot Actuator para endpoints de salud y métricas.\n\nFlujos Git: GitFlow, pipelines GitLab CI.' },
    ru: { title: 'Наблюдаемость', subtitle: 'Grafana · Kibana · AOP', details: 'Grafana дашборды и алертинг-пайплайны с нуля в Paradigma Digital — сокращение времени обнаружения production-инцидентов.\n\nKibana для обнаружения аномалий в реальном времени через AOP-инструментацию.\n\nSpring Boot Actuator для health и метрик-эндпоинтов.\n\nGit-процессы: GitFlow, GitLab CI пайплайны.' },
  },
  languages: {
    en: { title: 'Languages', subtitle: '4 languages spoken', details: '🇪🇸 Spanish — Native\n🇬🇧 English — Full Professional\n🇷🇺 Russian — Native\n🇺🇦 Ukrainian — Native' },
    es: { title: 'Idiomas', subtitle: '4 idiomas', details: '🇪🇸 Español — Nativo\n🇬🇧 Inglés — Profesional completo\n🇷🇺 Ruso — Nativo\n🇺🇦 Ucraniano — Nativo' },
    ru: { title: 'Языки', subtitle: '4 языка', details: '🇪🇸 Испанский — Родной\n🇬🇧 Английский — Профессиональный\n🇷🇺 Русский — Родной\n🇺🇦 Украинский — Родной' },
  },
  education: {
    en: { title: 'Computer Science', subtitle: 'UCAM · 2015–2019', details: 'Degree in Computer Science Engineering.\n\nUniversidad Católica San Antonio de Murcia (UCAM).\n\nPublished research on collaborative workspace management for students.' },
    es: { title: 'Ingeniería Informática', subtitle: 'UCAM · 2015–2019', details: 'Grado en Ingeniería Informática.\n\nUniversidad Católica San Antonio de Murcia (UCAM).\n\nInvestigación publicada sobre gestión colaborativa de espacios de trabajo para estudiantes.' },
    ru: { title: 'Информатика', subtitle: 'UCAM · 2015–2019', details: 'Степень в области компьютерных наук.\n\nUniversidad Católica San Antonio de Murcia (UCAM).\n\nОпубликованное исследование по совместному управлению рабочими пространствами студентов.' },
  },
  publication: {
    en: { title: 'Publication', subtitle: 'University Conference 2019', details: '"Hay Sitio: A collaborative application for managing student workspaces in computer science"\n\nProceedings of the Conference on University Teaching of CS, Vol 4 (2019).' },
    es: { title: 'Publicación', subtitle: 'Congreso Universitario 2019', details: '"Hay Sitio: Aplicación colaborativa para la gestión de espacios de trabajo de estudiantes de informática"\n\nActas de las Jornadas sobre la Enseñanza Universitaria de la Informática, Vol 4 (2019).' },
    ru: { title: 'Публикация', subtitle: 'Университетская конференция 2019', details: '«Hay Sitio: Совместное приложение для управления рабочими пространствами студентов информатики»\n\nМатериалы конференции по университетскому преподаванию информатики, Том 4 (2019).' },
  },
  architecture: {
    en: { title: 'Architecture', subtitle: 'Hexagonal · Microservices · EDA', details: 'Led MVC to hexagonal architecture migration at Simyo — domain logic decoupled from infrastructure, teams evolve subsystems independently without breaking contracts.\n\nEvent-Driven Architecture with AWS SQS at Openbank.\n\nCircuit breaker patterns (Hystrix) bridging Spring Boot and COBOL mainframe at Banco Santander.\n\nClean Architecture and RESTful API design across all projects.' },
    es: { title: 'Arquitectura', subtitle: 'Hexagonal · Microservicios · EDA', details: 'Migración de MVC a arquitectura hexagonal en Simyo — lógica de dominio desacoplada de infraestructura, equipos evolucionan subsistemas sin romper contratos.\n\nArquitectura Event-Driven con AWS SQS en Openbank.\n\nPatrones circuit breaker (Hystrix) entre Spring Boot y mainframe COBOL en Banco Santander.\n\nClean Architecture y diseño RESTful API en todos los proyectos.' },
    ru: { title: 'Архитектура', subtitle: 'Гексагональная · Микросервисы · EDA', details: 'Миграция с MVC на гексагональную архитектуру в Simyo — доменная логика отделена от инфраструктуры, команды независимо развивают подсистемы.\n\nEvent-Driven архитектура с AWS SQS в Openbank.\n\nCircuit breaker паттерны (Hystrix) между Spring Boot и COBOL мейнфреймом в Banco Santander.\n\nClean Architecture и RESTful API дизайн во всех проектах.' },
  },
}

function getBookData(currentLang) {
  const l = currentLang || 'en'
  const base = [
    { id: 'java', label: 'Java', color: '#e04040', height: 0.38, shelf: 0, col: 0 },
    { id: 'spring', label: 'Spring', color: '#4080e0', height: 0.42, shelf: 0, col: 1 },
    { id: 'databases', label: 'DBs', color: '#40c060', height: 0.35, shelf: 0, col: 2 },
    { id: 'apis', label: 'APIs', color: '#e0a020', height: 0.44, shelf: 0, col: 3 },
    { id: 'devops', label: 'DevOps', color: '#a050d0', height: 0.4, shelf: 1, col: 0 },
    { id: 'cloud', label: 'Cloud', color: '#30b0a0', height: 0.36, shelf: 1, col: 1 },
    { id: 'testing', label: 'Testing', color: '#e07020', height: 0.43, shelf: 1, col: 2 },
    { id: 'tools', label: 'Git', color: '#e040a0', height: 0.37, shelf: 1, col: 3 },
    { id: 'languages', label: 'Langs', color: '#d06080', height: 0.36, shelf: 3, col: 0 },
    { id: 'education', label: 'Degree', color: '#40a0a0', height: 0.36, shelf: 3, col: 1 },
    { id: 'publication', label: 'Paper', color: '#a080d0', height: 0.36, shelf: 3, col: 2 },
    { id: 'architecture', label: 'Arch', color: '#5060d0', height: 0.40, shelf: 3, col: 3 },
  ]
  return base.map(b => ({ ...b, ...(BOOK_I18N[b.id]?.[l] || BOOK_I18N[b.id]?.en) }))
}

const SHELF_Y = [0.5, 1.3, 2.1, 2.9]

function Book({ data, basePosition, onBookClick, interactive }) {
  const groupRef = useRef()
  const [hovered, setHovered] = useState(false)
  const liftY = useRef(0)

  useFrame(() => {
    if (!groupRef.current) return
    const target = hovered && interactive ? 0.08 : 0
    liftY.current += (target - liftY.current) * 0.1
    groupRef.current.position.y = basePosition[1] + liftY.current
  })

  return (
    <group
      ref={groupRef}
      position={basePosition}
      onPointerOver={(e) => {
        if (!interactive) return
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        if (!interactive) return
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
      onClick={(e) => {
        if (!interactive) return
        e.stopPropagation()
        const worldPos = new THREE.Vector3()
        groupRef.current.getWorldPosition(worldPos)
        onBookClick?.({ ...data, worldPos: [worldPos.x, worldPos.y, worldPos.z] })
      }}
    >
      {/* Book body */}
      <mesh>
        <boxGeometry args={[0.14, data.height, 0.24]} />
        <meshLambertMaterial color={hovered && interactive ? '#ffffff' : data.color} flatShading />
      </mesh>
      {/* Spine label — on the front face (z+), vertical like a real book */}
      <group castShadow={false}>
        <Text
          position={[0, 0, 0.121]}
          rotation={[0, 0, -Math.PI / 2]}
          fontSize={0.04}
          color="#ffffff"
          fillOpacity={0.45}
          anchorX="center"
          anchorY="middle"
          maxWidth={data.height * 0.85}
          textAlign="center"
          font="/fonts/PressStart2P-Regular.ttf"
          castShadow={false}
        >
          {data.label}
        </Text>
      </group>
    </group>
  )
}

export default function Bookshelf({ onClick, onBookClick, interactive, currentLang }) {
  return (
    <group
      position={[3.8, 0, -1.5]}
      rotation={[0, -Math.PI / 2, 0]}
      onClick={(e) => { e.stopPropagation(); onClick?.() }}
      onPointerOver={() => { if (!interactive) document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { if (!interactive) document.body.style.cursor = 'auto' }}
    >
      {/* Shelf boards */}
      {SHELF_Y.map((y, i) => (
        <Vox key={i} position={[0, y, 0]} args={[0.9, 0.06, 0.4]} color="#c07830" />
      ))}
      {/* Side panels - extend to floor */}
      {[-0.45, 0.45].map((x, i) => (
        <Vox key={i} position={[x, 1.6, 0]} args={[0.06, 3.2, 0.4]} color="#a06020" />
      ))}
      {/* Interactive books */}
      {getBookData(currentLang || lang).map((book) => {
        const shelfY = SHELF_Y[book.shelf]
        const baseY = shelfY + book.height / 2 + 0.03
        const baseX = -0.28 + book.col * 0.19
        return (
          <Book
            key={book.id}
            data={book}
            basePosition={[baseX, baseY, 0]}
            onBookClick={onBookClick}
            interactive={interactive}
          />
        )
      })}
      {/* Shelf 3 - decorative items */}
      {/* Globe */}
      <Vox position={[-0.25, 2.22, 0]} args={[0.18, 0.18, 0.18]} color="#60a0d0" />
      <Vox position={[-0.25, 2.14, 0]} args={[0.1, 0.04, 0.1]} color="#a08040" />
      {/* Small storage box */}
      <Vox position={[0.05, 2.18, 0]} args={[0.2, 0.12, 0.2]} color="#d0a870" />
      <Vox position={[0.05, 2.25, 0]} args={[0.22, 0.02, 0.22]} color="#c09858" />
      {/* Trophy/vase */}
      <Vox position={[0.3, 2.16, 0]} args={[0.08, 0.08, 0.08]} color="#f0c040" />
      <Vox position={[0.3, 2.22, 0]} args={[0.12, 0.04, 0.12]} color="#f0c040" />
      {/* Leaning photo frame */}
      <Vox position={[0.3, 2.98, 0.08]} args={[0.14, 0.18, 0.02]} color="#f0e8d0" />
      <Vox position={[0.3, 2.98, 0.09]} args={[0.1, 0.14, 0.01]} color="#80c0a0" />
    </group>
  )
}
