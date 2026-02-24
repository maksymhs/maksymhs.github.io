import React, { useState, useRef, useEffect, useCallback } from 'react'
import { buildSystemPrompt, PROFILE } from '../profileContext'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY

// Detect browser language → es, en, or ru
function detectLang() {
  const nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase()
  if (nav.startsWith('es')) return 'es'
  if (nav.startsWith('ru')) return 'ru'
  return 'en'
}

const lang = detectLang()

const i18n = {
  en: {
    welcome: "Hi! I'm Maksym, a Software Engineer specializing in backend development. Press SPACEBAR to ask me anything!",
    idle: "Press SPACEBAR to talk to me!",
    listening: "I'm listening...",
    noSpeech: "I didn't hear you. Press SPACEBAR again!",
    thinking: "Let me think...",
    fallback: `I can't connect right now. Check out my LinkedIn profile: ${PROFILE.linkedinUrl}`,
    hintIdle: "[ SPACE ] Talk",
    hintListening: "Listening...",
    hintSkip: "[ SPACE ] Skip",
    speechLang: "en-US",
  },
  es: {
    welcome: "¡Hola! Soy Maksym, Ingeniero de Software especializado en desarrollo backend. ¡Pulsa ESPACIO para preguntarme lo que quieras!",
    idle: "¡Pulsa ESPACIO para hablarme!",
    listening: "Te escucho...",
    noSpeech: "No te he oído. ¡Pulsa ESPACIO otra vez!",
    thinking: "Déjame pensar...",
    fallback: `No puedo conectarme ahora. Visita mi perfil de LinkedIn: ${PROFILE.linkedinUrl}`,
    hintIdle: "[ ESPACIO ] Hablar",
    hintListening: "Escuchando...",
    hintSkip: "[ ESPACIO ] Saltar",
    speechLang: "es-ES",
  },
  ru: {
    welcome: "Привет! Я Максим, инженер-программист, специализируюсь на бэкенд-разработке. Нажми ПРОБЕЛ, чтобы задать мне вопрос!",
    idle: "Нажми ПРОБЕЛ, чтобы поговорить!",
    listening: "Слушаю...",
    noSpeech: "Я тебя не услышал. Нажми ПРОБЕЛ ещё раз!",
    thinking: "Дай подумать...",
    fallback: `Не могу подключиться. Загляни в мой LinkedIn: ${PROFILE.linkedinUrl}`,
    hintIdle: "[ ПРОБЕЛ ] Говорить",
    hintListening: "Слушаю...",
    hintSkip: "[ ПРОБЕЛ ] Пропустить",
    speechLang: "ru-RU",
  },
}

const t = i18n[lang]
const systemPrompt = buildSystemPrompt(lang)

// Call OpenRouter API
async function askAI(conversationHistory) {
  if (!OPENROUTER_KEY || OPENROUTER_KEY === 'your-api-key-here') {
    throw new Error('No API key')
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Maksym Portfolio'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-lite-001',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory
      ],
      max_tokens: 150,
      temperature: 0.7
    })
  })

  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || t.fallback
}

let speakTimer = null

function speak(text, onEnd) {
  stopSpeaking()
  const duration = Math.max(1500, text.length * 60)
  speakTimer = setTimeout(() => { if (onEnd) onEnd() }, duration)
}

function stopSpeaking() {
  if (speakTimer) { clearTimeout(speakTimer); speakTimer = null }
}

// Convert URLs in text to clickable links
function renderTextWithLinks(text) {
  if (!text) return text
  const parts = text.split(/(https?:\/\/[^\s]+)/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    /^https?:\/\//.test(part)
      ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ color: '#4090d0', textDecoration: 'underline', cursor: 'pointer' }}>{part}</a>
      : part
  )
}

// States: idle, listening, speaking
export default function ChatOverlay() {
  const [state, setState] = useState('speaking')
  const [bubbleText, setBubbleText] = useState(t.welcome)
  const [displayText, setDisplayText] = useState('')
  const recognitionRef = useRef(null)
  const typewriterRef = useRef(null)
  const stateRef = useRef('speaking')
  const welcomeDone = useRef(false)
  const conversationRef = useRef([])

  // Keep ref in sync with state
  useEffect(() => { stateRef.current = state }, [state])

  // Welcome message auto-play on mount
  useEffect(() => {
    if (welcomeDone.current) return
    welcomeDone.current = true
    speak(t.welcome, () => {
      setState('idle')
      stateRef.current = 'idle'
      setBubbleText(t.idle)
    })
  }, [])

  // Typewriter effect
  useEffect(() => {
    if (!bubbleText) { setDisplayText(''); return }
    let i = 0
    setDisplayText('')
    clearInterval(typewriterRef.current)
    typewriterRef.current = setInterval(() => {
      i++
      setDisplayText(bubbleText.slice(0, i))
      if (i >= bubbleText.length) clearInterval(typewriterRef.current)
    }, 30)
    return () => clearInterval(typewriterRef.current)
  }, [bubbleText])


  const respondToUser = useCallback(async (userMessage) => {
    // Show thinking state
    setBubbleText(t.thinking)
    setState('speaking')
    stateRef.current = 'speaking'

    // Add user message to history
    conversationRef.current.push({ role: 'user', content: userMessage })
    // Keep only last 6 messages for context
    if (conversationRef.current.length > 6) {
      conversationRef.current = conversationRef.current.slice(-6)
    }

    try {
      const reply = await askAI(conversationRef.current)
      // Add assistant reply to history
      conversationRef.current.push({ role: 'assistant', content: reply })

      setBubbleText(reply)
      setState('speaking')
      stateRef.current = 'speaking'
    } catch (err) {
      console.warn('AI error:', err)
      setBubbleText(t.fallback)
      setState('speaking')
      stateRef.current = 'speaking'
    }
  }, [])

  const startListening = useCallback(() => {
    if (!SpeechRecognition || stateRef.current !== 'idle') return

    stopSpeaking()

    const recognition = new SpeechRecognition()
    recognition.lang = t.speechLang
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setState('listening')
      stateRef.current = 'listening'
      setBubbleText(t.listening)
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      if (event.results[0].isFinal) {
        setBubbleText(transcript)
        respondToUser(transcript)
      } else {
        setBubbleText(transcript + '_')
      }
    }

    recognition.onerror = (event) => {
      console.warn('Speech error:', event.error)
      if (event.error === 'no-speech') {
        setBubbleText(t.noSpeech)
      }
      setState('idle')
      stateRef.current = 'idle'
    }

    recognition.onend = () => {
      if (stateRef.current === 'listening') {
        setState('idle')
        stateRef.current = 'idle'
        setBubbleText(t.idle)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [respondToUser])

  // Shared action for spacebar and mobile button
  const handleAction = useCallback(() => {
    const s = stateRef.current
    if (s === 'idle') {
      startListening()
    } else if (s === 'speaking') {
      stopSpeaking()
      setState('idle')
      stateRef.current = 'idle'
      setBubbleText(t.idle)
    } else if (s === 'listening' && recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [startListening])

  // Spacebar handler (desktop)
  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === 'Space' && !e.repeat && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault()
        handleAction()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleAction])

  const stateClass = state === 'listening' ? 'bubble-listening'
    : state === 'speaking' ? 'bubble-speaking'
    : 'bubble-idle'

  return (
    <>
      <div className={`speech-bubble ${stateClass}`}>
        <div className="bubble-content">
          <span className="bubble-text">{renderTextWithLinks(displayText)}</span>
        </div>
        <div className="bubble-tail" />
      </div>

      <button
        className={`interaction-btn ${state !== 'idle' ? 'btn-active' : ''} ${state === 'listening' ? 'btn-listening' : ''}`}
        onClick={handleAction}
        onTouchEnd={(e) => { e.preventDefault(); handleAction() }}
      >
        {state === 'idle' && t.hintIdle}
        {state === 'listening' && t.hintListening}
        {state === 'speaking' && t.hintSkip}
      </button>
    </>
  )
}
