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
    en: { title: 'Spring Boot', subtitle: 'Primary framework', details: 'Building microservices and REST APIs with Spring Boot.\n\nSpring Data, Spring Security, WebFlux, dependency injection.\n\nUsed across all projects for scalable, production-ready backend services.' },
    es: { title: 'Spring Boot', subtitle: 'Framework principal', details: 'Construcción de microservicios y APIs REST con Spring Boot.\n\nSpring Data, Spring Security, WebFlux, inyección de dependencias.\n\nUsado en todos los proyectos para servicios backend escalables y listos para producción.' },
    ru: { title: 'Spring Boot', subtitle: 'Основной фреймворк', details: 'Разработка микросервисов и REST API на Spring Boot.\n\nSpring Data, Spring Security, WebFlux, внедрение зависимостей.\n\nИспользовал во всех проектах для масштабируемых backend-сервисов.' },
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
    en: { title: 'DevOps & CI/CD', subtitle: 'Jenkins · SonarQube · OpenShift', details: 'CI/CD pipelines with Jenkins.\n\nCode quality gates with SonarQube.\n\nContainerized deployments on OpenShift and Docker.\n\nAutomatic builds, tests, and deployments.' },
    es: { title: 'DevOps & CI/CD', subtitle: 'Jenkins · SonarQube · OpenShift', details: 'Pipelines CI/CD con Jenkins.\n\nControl de calidad con SonarQube.\n\nDespliegues en contenedores con OpenShift y Docker.\n\nBuilds, tests y despliegues automatizados.' },
    ru: { title: 'DevOps и CI/CD', subtitle: 'Jenkins · SonarQube · OpenShift', details: 'CI/CD пайплайны с Jenkins.\n\nКонтроль качества через SonarQube.\n\nКонтейнерные деплои на OpenShift и Docker.\n\nАвтоматические сборки, тесты и деплои.' },
  },
  cloud: {
    en: { title: 'Google Cloud', subtitle: 'Cloud infrastructure', details: 'GCP services for deploying and scaling microservices.\n\nMonitoring and observability with Kibana.\n\nCloud-native architectures and serverless patterns.\n\nUsed at Paradigma Digital.' },
    es: { title: 'Google Cloud', subtitle: 'Infraestructura cloud', details: 'Servicios GCP para despliegue y escalado de microservicios.\n\nMonitorización y observabilidad con Kibana.\n\nArquitecturas cloud-native y patrones serverless.\n\nUsado en Paradigma Digital.' },
    ru: { title: 'Google Cloud', subtitle: 'Облачная инфраструктура', details: 'Сервисы GCP для деплоя и масштабирования микросервисов.\n\nМониторинг с Kibana.\n\nCloud-native архитектуры и serverless.\n\nИспользовал в Paradigma Digital.' },
  },
  testing: {
    en: { title: 'Testing', subtitle: 'JUnit · Mockito · TDD', details: 'Unit testing with JUnit 5 and Mockito.\n\nIntegration and end-to-end testing.\n\nTDD practices for reliable code.\n\nHigh code coverage across all projects.' },
    es: { title: 'Testing', subtitle: 'JUnit · Mockito · TDD', details: 'Tests unitarios con JUnit 5 y Mockito.\n\nTests de integración y end-to-end.\n\nPrácticas TDD para código fiable.\n\nAlta cobertura de código en todos los proyectos.' },
    ru: { title: 'Тестирование', subtitle: 'JUnit · Mockito · TDD', details: 'Юнит-тесты с JUnit 5 и Mockito.\n\nИнтеграционные и E2E тесты.\n\nПрактики TDD для надёжного кода.\n\nВысокое покрытие тестами во всех проектах.' },
  },
  tools: {
    en: { title: 'Tools & VCS', subtitle: 'Git · GitLab · Kibana', details: 'Git workflows: GitFlow, trunk-based development.\n\nGitLab CI pipelines and merge strategies.\n\nLog analysis and monitoring with Kibana/ELK stack.\n\nCode review and collaboration best practices.' },
    es: { title: 'Herramientas y VCS', subtitle: 'Git · GitLab · Kibana', details: 'Flujos Git: GitFlow, trunk-based development.\n\nPipelines en GitLab CI y estrategias de merge.\n\nAnálisis de logs y monitorización con Kibana/ELK.\n\nBuenas prácticas de code review y colaboración.' },
    ru: { title: 'Инструменты и VCS', subtitle: 'Git · GitLab · Kibana', details: 'Git-процессы: GitFlow, trunk-based development.\n\nGitLab CI пайплайны и стратегии мержа.\n\nАнализ логов и мониторинг с Kibana/ELK.\n\nЛучшие практики код-ревью.' },
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
