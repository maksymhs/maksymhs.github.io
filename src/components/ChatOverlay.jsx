import React, { useState, useRef, useEffect, useCallback } from 'react'
import { buildSystemPrompt, PROFILE } from '../profileContext'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY
const TG_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN
const TG_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID

// Send interaction data to Telegram
function sendToTelegram(question, answer, mode) {
  if (!TG_BOT_TOKEN || !TG_CHAT_ID) return Promise.reject(new Error('No Telegram config'))
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
    return fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'HTML' })
    })
  } catch (e) { return Promise.reject(e) }
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
    welcome: "Hi! I'm Maksym, a Software Engineer specializing in backend development.\nPress SPACE to talk or ENTER to type!",
    idle: "Press SPACE to talk or ENTER to type!",
    listening: "I'm listening...",
    noSpeech: "I didn't hear you. Press SPACEBAR again!",
    thinking: "Let me think...",
    fallback: `I can't connect right now. Check out my profile on LinkedIn[${PROFILE.linkedinUrl}] or leave me a {{MESSAGE}}`,
    hintIdle: "[ SPACE ] Talk",
    hintType: "[ ENTER ] Type",
    hintListening: "Listening...",
    hintSkip: "[ SPACE ] Skip",
    typingPlaceholder: "Type your question...",
    dmPlaceholder: "Write your message to Maksym...",
    dmSent: "Message sent! Thanks for reaching out.",
    dmError: "Couldn't send the message. Try LinkedIn[${PROFILE.linkedinUrl}] instead.",
    messageLabel: "Message",
    speechLang: "en-US",
  },
  es: {
    welcome: "¡Hola! Soy Maksym, Ingeniero de Software especializado en desarrollo backend.\n¡Pulsa ESPACIO para hablar o INTRO para escribir!",
    idle: "¡Pulsa ESPACIO para hablar o INTRO para escribir!",
    listening: "Te escucho...",
    noSpeech: "No te he oído. ¡Pulsa ESPACIO otra vez!",
    thinking: "Déjame pensar...",
    fallback: `No puedo conectarme ahora. Visita mi perfil en LinkedIn[${PROFILE.linkedinUrl}] o déjame un {{MESSAGE}}`,
    hintIdle: "[ ESPACIO ] Hablar",
    hintType: "[ ENTER ] Escribir",
    hintListening: "Escuchando...",
    hintSkip: "[ ESPACIO ] Saltar",
    typingPlaceholder: "Escribe tu pregunta...",
    dmPlaceholder: "Escribe tu mensaje para Maksym...",
    dmSent: "¡Mensaje enviado! Gracias por escribirme.",
    dmError: `No pude enviar el mensaje. Prueba por LinkedIn[${PROFILE.linkedinUrl}].`,
    messageLabel: "Mensaje",
    speechLang: "es-ES",
  },
  ru: {
    welcome: "Привет! Я Максим, инженер-программист, специализируюсь на бэкенд-разработке.\nНажми ПРОБЕЛ чтобы говорить или ENTER чтобы написать!",
    idle: "Нажми ПРОБЕЛ чтобы говорить или ENTER чтобы написать!",
    listening: "Слушаю...",
    noSpeech: "Я тебя не услышал. Нажми ПРОБЕЛ ещё раз!",
    thinking: "Дай подумать...",
    fallback: `Не могу подключиться. Загляни в мой LinkedIn[${PROFILE.linkedinUrl}] или оставь {{MESSAGE}}`,
    hintIdle: "[ ПРОБЕЛ ] Говорить",
    hintType: "[ ENTER ] Написать",
    hintListening: "Слушаю...",
    hintSkip: "[ ПРОБЕЛ ] Пропустить",
    typingPlaceholder: "Напиши свой вопрос...",
    dmPlaceholder: "Напиши сообщение для Максима...",
    dmSent: "Сообщение отправлено! Спасибо что написал.",
    dmError: `Не удалось отправить. Попробуй через LinkedIn[${PROFILE.linkedinUrl}].`,
    messageLabel: "Сообщение",
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
  if (window.speechSynthesis) window.speechSynthesis.cancel()
}

// Pick a male voice for the given language
let _voicesLoaded = false
function getMaleVoice(langCode) {
  const voices = window.speechSynthesis.getVoices()
  const langPrefix = langCode.slice(0, 2).toLowerCase()
  // Filter voices matching the language
  const matching = voices.filter(v => v.lang.toLowerCase().startsWith(langPrefix))
  if (!matching.length) return null
  // Prefer Google male voices (Chrome provides these)
  const maleKeywords = ['male', 'david', 'jorge', 'dmitri', 'james', 'daniel', 'google uk english male', 'google español', 'google русский']
  const femaleKeywords = ['female', 'woman', 'fiona', 'samantha', 'mónica', 'milena', 'karen', 'tessa', 'victoria']
  // Try Google voices first (they sound best in Chrome)
  const googleMale = matching.find(v =>
    v.name.toLowerCase().includes('google') &&
    !femaleKeywords.some(f => v.name.toLowerCase().includes(f))
  )
  if (googleMale) return googleMale
  // Try any explicitly male voice
  const male = matching.find(v =>
    maleKeywords.some(k => v.name.toLowerCase().includes(k))
  )
  if (male) return male
  // Try any non-female voice
  const nonFemale = matching.find(v =>
    !femaleKeywords.some(f => v.name.toLowerCase().includes(f))
  )
  if (nonFemale) return nonFemale
  return matching[0]
}

// Preload voices (Chrome loads them async)
if (window.speechSynthesis) {
  window.speechSynthesis.getVoices()
  window.speechSynthesis.onvoiceschanged = () => { _voicesLoaded = true }
}

// Text-to-speech using Web Speech Synthesis API
function speakTTS(text) {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  // Clean text: remove URLs, markdown, special patterns
  const clean = text
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/\{\{MESSAGE\}\}/g, '')
    .replace(/\w+\[https?:\/\/[^\]]+\]/g, (m) => m.match(/^(\w+)/)?.[1] || '')
    .trim()
  if (!clean) return
  const utterance = new SpeechSynthesisUtterance(clean)
  utterance.lang = t.speechLang
  const voice = getMaleVoice(t.speechLang)
  if (voice) utterance.voice = voice
  utterance.rate = 1.0
  utterance.pitch = 0.9
  window.speechSynthesis.speak(utterance)
}

// Convert URLs in text to clickable links
// Supports: plain URLs, Word[url] pattern, and {{MESSAGE}} placeholder
function renderTextWithLinks(text, onMessageClick) {
  if (!text) return text
  const parts = text.split(/(\n|\{\{MESSAGE\}\}|\w+\[https?:\/\/[^\]]+\]|https?:\/\/[^\s]+)/g)
  if (parts.length === 1) return text
  const linkStyle = { color: '#4090d0', textDecoration: 'underline', cursor: 'pointer' }
  return parts.map((part, i) => {
    if (part === '\n') return <br key={i} />
    if (part === '{{MESSAGE}}') {
      return <span key={i} style={linkStyle} onClick={onMessageClick}>{t.messageLabel}</span>
    }
    const labeled = part.match(/^(\w+)\[(https?:\/\/[^\]]+)\]$/)
    if (labeled) {
      return <a key={i} href={labeled[2]} target="_blank" rel="noopener noreferrer" style={linkStyle}>{labeled[1]}</a>
    }
    if (/^https?:\/\//.test(part)) {
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={linkStyle}>{part}</a>
    }
    return part
  })
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
      // Keep welcome message visible until user interacts
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
  const directMessageRef = useRef(false)

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

      // Speak aloud only if user used voice
      if (mode === 'voice') speakTTS(reply)

      // Track interaction via Telegram
      sendToTelegram(userMessage, reply, mode)
    } catch (err) {
      console.warn('AI error:', err)
      setBubbleText(t.fallback)
      setState('speaking')
      stateRef.current = 'speaking'

      if (mode === 'voice') speakTTS(t.fallback)

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

  const hiddenInputRef = useRef(null)

  // Start typing mode — from any state
  const startTyping = useCallback(() => {
    stopSpeaking()
    if (recognitionRef.current) { try { recognitionRef.current.stop() } catch(e) {} }
    directMessageRef.current = false
    // Focus hidden input synchronously to keep mobile keyboard gesture chain
    if (hiddenInputRef.current) hiddenInputRef.current.focus()
    setState('typing')
    stateRef.current = 'typing'
    setBubbleText('')
    setInputText('')
  }, [])

  // Transfer focus to real input once typing state renders
  useEffect(() => {
    if (state === 'typing' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [state])

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
    }
    startListening()
  }, [startListening])

  // Start direct message mode — opens typing with DM placeholder
  const startDirectMessage = useCallback(() => {
    stopSpeaking()
    if (recognitionRef.current) { try { recognitionRef.current.stop() } catch(e) {} }
    directMessageRef.current = true
    if (hiddenInputRef.current) hiddenInputRef.current.focus()
    setState('typing')
    stateRef.current = 'typing'
    setBubbleText('')
    setInputText('')
  }, [])

  // Submit typed message
  const submitTyped = useCallback(() => {
    const msg = inputText.trim()
    if (!msg) return
    setInputText('')

    if (directMessageRef.current) {
      // Direct message to Telegram
      directMessageRef.current = false
      setState('speaking')
      stateRef.current = 'speaking'
      setBubbleText(t.thinking)
      sendToTelegram(msg, '[DIRECT MESSAGE]', 'text')
        .then(() => {
          setBubbleText(t.dmSent)
        })
        .catch(() => {
          setBubbleText(t.dmError)
        })
      return
    }

    setState('speaking')
    stateRef.current = 'speaking'
    setBubbleText(msg)
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
                placeholder={directMessageRef.current ? t.dmPlaceholder : t.typingPlaceholder}
                autoComplete="off"
              />
            </form>
          ) : (
            <span className="bubble-text">{renderTextWithLinks(displayText, startDirectMessage)}</span>
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
      {/* Hidden input to capture mobile keyboard focus synchronously */}
      <input
        ref={hiddenInputRef}
        style={{ position: 'fixed', left: -9999, top: -9999, opacity: 0, width: 0, height: 0 }}
        tabIndex={-1}
        aria-hidden="true"
      />
    </>
  )
}
