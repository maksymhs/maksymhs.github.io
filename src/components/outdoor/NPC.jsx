import React, { useRef, useState, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import Vox from '../common/Vox'
import { lang } from '../../i18n'

const NPC_DIALOGUES = {
  en: [
    "Hey there! Have you checked out the bookshelf inside? Each book is a different project!",
    "There's a game console on the desk — try Cat Runner, Pixel Strike or 3D Jumper!",
    "Click the headphones on the desk... you won't regret it!",
    "Michi knocked my coffee off the table this morning. Again.",
    "That cat once sat on the keyboard and deleted an entire file. True story.",
    "If you click on Michi, you can take him for a walk! He loves it out here.",
    "Try clicking the door from inside — you can walk around the whole garden!",
    "Michi likes to chase the butterflies around here. He never catches them though.",
    "There's a treasure chest inside with skill cards — try to collect them all!",
    "I saw Michi chasing a bug on the screen yesterday. He thought it was real!",
    "Click on the window from inside to come out here with the cat!",
    "The frames on the back wall? One goes to GitHub, the other to LinkedIn!",
  ],
  es: [
    "¡Ey! ¿Has mirado la estantería dentro? ¡Cada libro es un proyecto diferente!",
    "Hay una consola de juegos en el escritorio — ¡prueba Cat Runner, Pixel Strike o 3D Jumper!",
    "Haz clic en los auriculares del escritorio... ¡no te arrepentirás!",
    "Michi me ha tirado el café de la mesa esta mañana. Otra vez.",
    "Ese gato una vez se sentó en el teclado y borró un archivo entero. Historia real.",
    "Si haces clic en Michi, ¡puedes sacarlo a pasear! Le encanta estar aquí fuera.",
    "Prueba a hacer clic en la puerta desde dentro — ¡puedes pasear por todo el jardín!",
    "A Michi le encanta perseguir las mariposas por aquí. Nunca las pilla.",
    "Hay un cofre del tesoro dentro con cartas de habilidades — ¡intenta coleccionarlas!",
    "Ayer vi a Michi persiguiendo un bug en la pantalla. ¡Pensaba que era real!",
    "¡Haz clic en la ventana desde dentro para salir aquí con el gato!",
    "¿Los cuadros de la pared del fondo? Uno va a GitHub y otro a LinkedIn.",
  ],
  ru: [
    "Привет! Ты видел книжную полку внутри? Каждая книга — это отдельный проект!",
    "На столе есть игровая приставка — попробуй Cat Runner, Pixel Strike или 3D Jumper!",
    "Кликни на наушники на столе... не пожалеешь!",
    "Мичи опрокинул мне кофе со стола сегодня утром. Опять.",
    "Этот кот однажды сел на клавиатуру и удалил целый файл. Реальная история.",
    "Если кликнешь на Мичи, можешь погулять с ним! Ему нравится тут гулять.",
    "Попробуй кликнуть на дверь изнутри — можно гулять по всему саду!",
    "Мичи любит гоняться за бабочками тут. Правда, ни разу не поймал.",
    "Внутри есть сундук с картами навыков — попробуй собрать все!",
    "Вчера видел, как Мичи гонялся за багом на экране. Думал, он настоящий!",
    "Кликни на окно изнутри, чтобы выйти сюда с котом!",
    "Рамки на задней стене? Одна ведёт на GitHub, другая на LinkedIn!",
  ],
}

export default function NPCCharacter({ position, rotation, playerRef, catRef, view, onNpcNear, npcInteractRef, currentLang }) {
  const headRef = useRef()
  const bodyRef = useRef()
  const bubbleRef = useRef()
  const wasNear = useRef(false)
  const topicIdx = useRef(0)
  const lineIdx = useRef(0)
  const viewRef = useRef(view)
  const [bubbleText, setBubbleText] = useState(null)
  const dialogues = NPC_DIALOGUES[currentLang || lang] || NPC_DIALOGUES.en
  const _targetWorldPos = useMemo(() => new THREE.Vector3(), [])
  const _npcWorldPos = useMemo(() => new THREE.Vector3(), [])
  const _localTarget = useMemo(() => new THREE.Vector3(), [])
  const advanceDialogue = useRef(null)

  // Keep viewRef always in sync
  useEffect(() => { viewRef.current = view }, [view])

  useFrame(() => {
    if (!bodyRef.current) return
    const v = viewRef.current
    const canTalk = v === 'outdoor' || v === 'walk'
    const isOutdoor = canTalk || v === 'cat'

    // Hide bubble immediately if not in walk/outdoor
    if (bubbleRef.current) {
      bubbleRef.current.visible = canTalk && wasNear.current && !!bubbleText
    }

    if (!isOutdoor) {
      wasNear.current = false
      if (headRef.current) {
        headRef.current.rotation.y *= 0.9
        headRef.current.rotation.x *= 0.9
      }
      return
    }

    // Find closest target for head tracking, but only player for dialogue
    bodyRef.current.getWorldPosition(_npcWorldPos)
    let closestDist = Infinity
    let targetPos = null
    let playerDist = Infinity

    if (playerRef?.current) {
      const px = playerRef.current.position.x
      const pz = playerRef.current.position.z
      playerDist = Math.sqrt((px - _npcWorldPos.x) ** 2 + (pz - _npcWorldPos.z) ** 2)
      if (playerDist < closestDist) { closestDist = playerDist; targetPos = playerRef.current.position }
    }
    if (catRef?.current) {
      const cx = catRef.current.position.x
      const cz = catRef.current.position.z
      const d = Math.sqrt((cx - _npcWorldPos.x) ** 2 + (cz - _npcWorldPos.z) ** 2)
      if (d < closestDist) { closestDist = d; targetPos = catRef.current.position }
    }

    // Dialogue only triggered by player proximity
    const isNear = playerDist < 3

    // Head tracks closest target (player or cat) using worldToLocal
    if (headRef.current && targetPos && closestDist < 8) {
      _targetWorldPos.set(targetPos.x, (targetPos.y || 0) + 0.8, targetPos.z)
      _localTarget.copy(_targetWorldPos)
      bodyRef.current.worldToLocal(_localTarget)
      const targetY = THREE.MathUtils.clamp(Math.atan2(_localTarget.x, _localTarget.z), -1.4, 1.4)
      const targetX = THREE.MathUtils.clamp(-Math.atan2(_localTarget.y - 1.18, Math.sqrt(_localTarget.x ** 2 + _localTarget.z ** 2)), -0.5, 0.5)
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetY, 0.12)
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, targetX, 0.1)
    } else if (headRef.current) {
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, 0, 0.06)
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0, 0.06)
    }

    // Dialogue only in walk/outdoor (not cat)
    if (canTalk && isNear && !wasNear.current) {
      topicIdx.current = Math.floor(Math.random() * dialogues.length)
      lineIdx.current = 0
      setBubbleText(dialogues[topicIdx.current])
      onNpcNear?.(true)
    }
    if (!isNear && wasNear.current) {
      onNpcNear?.(false)
    }
    wasNear.current = isNear
  })

  const cycleDialogue = () => {
    if (viewRef.current !== 'outdoor' && viewRef.current !== 'walk') return
    if (!wasNear.current) return
    lineIdx.current = (lineIdx.current + 1) % dialogues.length
    const nextIdx = (topicIdx.current + lineIdx.current) % dialogues.length
    setBubbleText(dialogues[nextIdx])
  }

  // Keep advanceDialogue ref up to date for E key and mobile tap
  advanceDialogue.current = cycleDialogue
  if (npcInteractRef) npcInteractRef.current = cycleDialogue

  // E key to interact
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'e' || e.key === 'E') {
        advanceDialogue.current?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleClick = (e) => {
    e.stopPropagation()
    cycleDialogue()
  }

  return (
    <group position={position} rotation={rotation || [0, 0, 0]} ref={bodyRef}>
      <group
        onClick={handleClick}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = 'auto')}
      >
        {/* === SEATED NPC === */}
        {/* Upper legs (thighs) */}
        <Vox position={[-0.11, 0.32, 0.1]} args={[0.18, 0.16, 0.32]} color="#3060a0" />
        <Vox position={[0.11, 0.32, 0.1]} args={[0.18, 0.16, 0.32]} color="#3060a0" />
        {/* Lower legs */}
        <Vox position={[-0.11, 0.1, 0.26]} args={[0.18, 0.32, 0.18]} color="#3060a0" />
        <Vox position={[0.11, 0.1, 0.26]} args={[0.18, 0.32, 0.18]} color="#3060a0" />
        {/* Shoes */}
        <Vox position={[-0.11, -0.05, 0.3]} args={[0.2, 0.1, 0.26]} color="#505050" />
        <Vox position={[0.11, -0.05, 0.3]} args={[0.2, 0.1, 0.26]} color="#505050" />

        {/* Torso — green sweater */}
        <Vox position={[0, 0.64, 0]} args={[0.5, 0.48, 0.32]} color="#408040" />
        {/* Collar */}
        <Vox position={[0, 0.86, 0.06]} args={[0.3, 0.06, 0.2]} color="#357035" />
        {/* Neck */}
        <Vox position={[0, 0.9, 0]} args={[0.16, 0.06, 0.14]} color="#e8c8a0" />

        {/* Arms */}
        <Vox position={[-0.34, 0.56, 0.06]} args={[0.16, 0.36, 0.16]} color="#408040" />
        <Vox position={[0.34, 0.56, 0.06]} args={[0.16, 0.36, 0.16]} color="#408040" />
        {/* Hands */}
        <Vox position={[-0.34, 0.4, 0.12]} args={[0.12, 0.12, 0.12]} color="#e8c8a0" />
        <Vox position={[0.34, 0.4, 0.12]} args={[0.12, 0.12, 0.12]} color="#e8c8a0" />

        {/* Head */}
        <group ref={headRef} position={[0, 1.18, 0]}>
          <Vox position={[0, 0, 0]} args={[0.5, 0.5, 0.5]} color="#e8c8a0" />
          {/* Grey hair */}
          <Vox position={[0, 0.28, 0]} args={[0.54, 0.1, 0.54]} color="#b0b0b0" />
          <Vox position={[0, 0.08, -0.24]} args={[0.54, 0.4, 0.08]} color="#b0b0b0" />
          <Vox position={[-0.26, 0.1, 0]} args={[0.06, 0.3, 0.5]} color="#b0b0b0" />
          <Vox position={[0.26, 0.1, 0]} args={[0.06, 0.3, 0.5]} color="#b0b0b0" />
          {/* Hat */}
          <Vox position={[0, 0.36, 0]} args={[0.58, 0.08, 0.58]} color="#704828" />
          <Vox position={[0, 0.42, 0]} args={[0.42, 0.06, 0.42]} color="#704828" />
          {/* Eyes */}
          {[-0.12, 0.12].map((x, i) => (
            <group key={i} position={[x, 0.02, 0.26]}>
              <Vox position={[0, 0, 0]} args={[0.12, 0.12, 0.02]} color="#ffffff" />
              <Vox position={[0.01, -0.01, 0.015]} args={[0.07, 0.07, 0.02]} color="#303030" />
              <Vox position={[0.03, 0.03, 0.02]} args={[0.03, 0.03, 0.01]} color="#ffffff" />
            </group>
          ))}
          {/* Glasses bridge */}
          <Vox position={[0, 0.02, 0.27]} args={[0.08, 0.02, 0.02]} color="#808080" />
          {/* Eyebrows */}
          <Vox position={[-0.12, 0.1, 0.26]} args={[0.12, 0.03, 0.02]} color="#909090" />
          <Vox position={[0.12, 0.1, 0.26]} args={[0.12, 0.03, 0.02]} color="#909090" />
          {/* Nose */}
          <Vox position={[0, -0.04, 0.27]} args={[0.04, 0.05, 0.02]} color="#d8b890" />
          {/* Mustache */}
          <Vox position={[0, -0.1, 0.26]} args={[0.18, 0.04, 0.02]} color="#a0a0a0" />
          {/* Smile */}
          <Vox position={[0, -0.15, 0.26]} args={[0.1, 0.03, 0.02]} color="#c08070" />
        </group>
      </group>

      {/* 3D Speech bubble above head */}
      {bubbleText && (
        <Billboard position={[0, 2.3, 0]} ref={bubbleRef} visible={false}>
          <group>
            {/* Border/shadow */}
            <mesh position={[0.04, -0.04, -0.01]}>
              <planeGeometry args={[2.6, 0.8]} />
              <meshBasicMaterial color="#000000" transparent opacity={0.7} />
            </mesh>
            {/* Main bubble bg */}
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[2.6, 0.8]} />
              <meshBasicMaterial color="#fffff8" />
            </mesh>
            {/* Border top */}
            <mesh position={[0, 0.4, 0.001]}>
              <planeGeometry args={[2.6, 0.04]} />
              <meshBasicMaterial color="#408040" />
            </mesh>
            {/* Border bottom */}
            <mesh position={[0, -0.4, 0.001]}>
              <planeGeometry args={[2.6, 0.04]} />
              <meshBasicMaterial color="#408040" />
            </mesh>
            {/* Border left */}
            <mesh position={[-1.3, 0, 0.001]}>
              <planeGeometry args={[0.04, 0.8]} />
              <meshBasicMaterial color="#408040" />
            </mesh>
            {/* Border right */}
            <mesh position={[1.3, 0, 0.001]}>
              <planeGeometry args={[0.04, 0.8]} />
              <meshBasicMaterial color="#408040" />
            </mesh>
            {/* Pointer */}
            <mesh position={[0, -0.46, 0]} rotation={[0, 0, Math.PI]}>
              <coneGeometry args={[0.08, 0.12, 4]} />
              <meshBasicMaterial color="#408040" />
            </mesh>
            <Text
              position={[0, 0, 0.01]}
              fontSize={0.09}
              maxWidth={2.3}
              textAlign="center"
              color="#1a1a2e"
              anchorX="center"
              anchorY="middle"
            >
              {bubbleText}
            </Text>
          </group>
        </Billboard>
      )}
    </group>
  )
}
