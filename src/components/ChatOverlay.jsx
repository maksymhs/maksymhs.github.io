import React, { useState, useRef, useEffect, useCallback } from 'react'
import { buildSystemPrompt, PROFILE } from '../profileContext'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY
const TG_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN
const TG_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID

// Send interaction data to Telegram (silent, fire-and-forget)
function sendToTelegram(question, answer, mode) {
  if (!TG_BOT_TOKEN || !TG_CHAT_ID) return
  try {
    const ua = navigator.userAgent
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua)
    const browser = /Chrome/i.test(ua) ? 'Chrome'
      : /Firefox/i.test(ua) ? 'Firefox'
      : /Safari/i.test(ua) ? 'Safari'
      : /Edge/i.test(ua) ? 'Edge' : 'Other'
    const now = new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })
    const text = [
      `🕐 ${now}`,
      `🌍 ${navigator.language || 'unknown'}`,
      `📱 ${isMobile ? 'Móvil' : 'Desktop'} · ${browser}`,
      `🔊 ${mode === 'voice' ? 'Voz' : 'Texto'}`,
      `❓ ${question}`,
      `💬 ${answer}`
    ].join('\n')
    fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'HTML' })
    }).catch(() => {})
  } catch (e) { /* silent */ }
}

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
    welcome: "Hi! I'm Maksym, a Software Engineer specializing in backend development. Press SPACE to talk or ENTER to type!",
    idle: "Press SPACE to talk or ENTER to type!",
    listening: "I'm listening...",
    noSpeech: "I didn't hear you. Press SPACEBAR again!",
    thinking: "Let me think...",
    fallback: `I can't connect right now. Check out my LinkedIn profile: ${PROFILE.linkedinUrl}`,
    hintIdle: "[ SPACE ] Talk",
    hintType: "[ ENTER ] Type",
    hintListening: "Listening...",
    hintSkip: "[ SPACE ] Skip",
    typingPlaceholder: "Type your question...",
    speechLang: "en-US",
  },
  es: {
    welcome: "¡Hola! Soy Maksym, Ingeniero de Software especializado en desarrollo backend. ¡Pulsa ESPACIO para hablar o INTRO para escribir!",
    idle: "¡Pulsa ESPACIO para hablar o INTRO para escribir!",
    listening: "Te escucho...",
    noSpeech: "No te he oído. ¡Pulsa ESPACIO otra vez!",
    thinking: "Déjame pensar...",
    fallback: `No puedo conectarme ahora. Visita mi perfil de LinkedIn: ${PROFILE.linkedinUrl}`,
    hintIdle: "[ ESPACIO ] Hablar",
    hintType: "[ ENTER ] Escribir",
    hintListening: "Escuchando...",
    hintSkip: "[ ESPACIO ] Saltar",
    typingPlaceholder: "Escribe tu pregunta...",
    speechLang: "es-ES",
  },
  ru: {
    welcome: "Привет! Я Максим, инженер-программист, специализируюсь на бэкенд-разработке. Нажми ПРОБЕЛ чтобы говорить или ENTER чтобы написать!",
    idle: "Нажми ПРОБЕЛ чтобы говорить или ENTER чтобы написать!",
    listening: "Слушаю...",
    noSpeech: "Я тебя не услышал. Нажми ПРОБЕЛ ещё раз!",
    thinking: "Дай подумать...",
    fallback: `Не могу подключиться. Загляни в мой LinkedIn: ${PROFILE.linkedinUrl}`,
    hintIdle: "[ ПРОБЕЛ ] Говорить",
    hintType: "[ ENTER ] Написать",
    hintListening: "Слушаю...",
    hintSkip: "[ ПРОБЕЛ ] Пропустить",
    typingPlaceholder: "Напиши свой вопрос...",
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

// States: idle, listening, speaking, typing
export default function ChatOverlay() {
  const [state, setState] = useState('speaking')
  const [bubbleText, setBubbleText] = useState(t.welcome)
  const [displayText, setDisplayText] = useState('')
  const [inputText, setInputText] = useState('')
  const recognitionRef = useRef(null)
  const typewriterRef = useRef(null)
  const inputRef = useRef(null)
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


  const inputModeRef = useRef('voice')

  const respondToUser = useCallback(async (userMessage) => {
    // Show thinking state
    setBubbleText(t.thinking)
    setState('speaking')
    stateRef.current = 'speaking'

    const mode = inputModeRef.current

    // Add user message to history
    conversationRef.current.push({ role: 'user', content: userMessage })
    // Keep only last 20 messages for context
    if (conversationRef.current.length > 20) {
      conversationRef.current = conversationRef.current.slice(-20)
    }

    try {
      const reply = await askAI(conversationRef.current)
      // Add assistant reply to history
      conversationRef.current.push({ role: 'assistant', content: reply })

      setBubbleText(reply)
      setState('speaking')
      stateRef.current = 'speaking'

      // Track interaction via Telegram
      sendToTelegram(userMessage, reply, mode)
    } catch (err) {
      console.warn('AI error:', err)
      setBubbleText(t.fallback)
      setState('speaking')
      stateRef.current = 'speaking'

      sendToTelegram(userMessage, '[ERROR] ' + err.message, mode)
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
        inputModeRef.current = 'voice'
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

  // Start typing mode — from any state
  const startTyping = useCallback(() => {
    stopSpeaking()
    if (recognitionRef.current) { try { recognitionRef.current.stop() } catch(e) {} }
    setState('typing')
    stateRef.current = 'typing'
    setBubbleText('')
    setInputText('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  // Start voice — from any state
  const handleVoice = useCallback(() => {
    const s = stateRef.current
    if (s === 'typing') {
      setInputText('')
    }
    if (s === 'listening' && recognitionRef.current) {
      recognitionRef.current.stop()
      return
    }
    if (s === 'speaking') {
      stopSpeaking()
      setState('idle')
      stateRef.current = 'idle'
      setBubbleText(t.idle)
      return
    }
    startListening()
  }, [startListening])

  // Submit typed message
  const submitTyped = useCallback(() => {
    const msg = inputText.trim()
    if (!msg) return
    setState('speaking')
    stateRef.current = 'speaking'
    setBubbleText(msg)
    setInputText('')
    inputModeRef.current = 'text'
    respondToUser(msg)
  }, [inputText, respondToUser])

  // Keyboard handlers (desktop)
  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
          e.preventDefault()
          setState('idle')
          stateRef.current = 'idle'
          setBubbleText(t.idle)
          setInputText('')
        }
        return
      }

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        handleVoice()
      } else if (e.code === 'Enter' && !e.repeat) {
        e.preventDefault()
        startTyping()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleVoice, startTyping])

  const stateClass = state === 'listening' ? 'bubble-listening'
    : state === 'speaking' ? 'bubble-speaking'
    : state === 'typing' ? 'bubble-typing'
    : 'bubble-idle'

  return (
    <>
      <div className={`speech-bubble ${stateClass}`}>
        <div className="bubble-content">
          {state === 'typing' ? (
            <form className="typing-form" onSubmit={(e) => { e.preventDefault(); submitTyped() }}>
              <input
                ref={inputRef}
                className="typing-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t.typingPlaceholder}
                autoComplete="off"
              />
            </form>
          ) : (
            <span className="bubble-text">{renderTextWithLinks(displayText)}</span>
          )}
        </div>
        <div className="bubble-tail" />
      </div>

      <div className="interaction-buttons">
        <button
          className={`interaction-btn btn-voice ${state === 'listening' ? 'btn-listening' : ''}`}
          onClick={handleVoice}
          onTouchEnd={(e) => { e.preventDefault(); handleVoice() }}
          title={t.hintIdle}
        >
          {state === 'listening' ? (
            <span className="btn-label">{t.hintListening}</span>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="1" width="6" height="12" rx="3" />
              <path d="M5 10a7 7 0 0 0 14 0" />
              <line x1="12" y1="17" x2="12" y2="22" />
              <line x1="8" y1="22" x2="16" y2="22" />
            </svg>
          )}
        </button>
        <button
          className={`interaction-btn btn-type ${state === 'typing' ? 'btn-type-active' : ''}`}
          onClick={startTyping}
          onTouchEnd={(e) => { e.preventDefault(); startTyping() }}
          title={t.hintType}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <line x1="6" y1="8" x2="6" y2="8" strokeWidth="3" />
            <line x1="10" y1="8" x2="10" y2="8" strokeWidth="3" />
            <line x1="14" y1="8" x2="14" y2="8" strokeWidth="3" />
            <line x1="18" y1="8" x2="18" y2="8" strokeWidth="3" />
            <line x1="6" y1="12" x2="6" y2="12" strokeWidth="3" />
            <line x1="10" y1="12" x2="10" y2="12" strokeWidth="3" />
            <line x1="14" y1="12" x2="14" y2="12" strokeWidth="3" />
            <line x1="18" y1="12" x2="18" y2="12" strokeWidth="3" />
            <line x1="8" y1="16" x2="16" y2="16" />
          </svg>
        </button>
      </div>
    </>
  )
}
