import React, { useState, useRef, useEffect, useCallback } from 'react'
import { lang as initialLang } from '../i18n'
import { i18n, SPEECH_LANGS } from './chat/chatI18n'
import {
  sendToTelegram, askAI, speak, stopSpeaking, warmupTTS, speakTTS,
  renderTextWithLinks, extractAction, stripAction, extractLang, stripLang, tryLocalCommand
} from './chat/chatUtils'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

// States: idle, listening, speaking, typing
export default function ChatOverlay({ visible = true, onAction, onLangChange }) {
  const [currentLang, setCurrentLang] = useState(initialLang)
  const langRef = useRef(initialLang)
  const t = i18n[currentLang] || i18n.en

  const [state, setState] = useState('speaking')
  const [bubbleText, setBubbleText] = useState(i18n[initialLang].welcome)
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
    const curLang = langRef.current
    const curT = i18n[curLang] || i18n.en
    const mode = inputModeRef.current
    const speechLang = SPEECH_LANGS[curLang] || 'en-US'

    // Try local command matching FIRST for instant action responses
    const localMatch = tryLocalCommand(userMessage, curLang)
    if (localMatch) {
      setBubbleText(localMatch.response)
      setState('speaking')
      stateRef.current = 'speaking'
      if (mode === 'voice') speakTTS(localMatch.response, speechLang)
      if (localMatch.action && onAction) {
        setTimeout(() => onAction(localMatch.action), 1800)
      }
      sendToTelegram(userMessage, '[LOCAL] ' + localMatch.response, mode)
      return
    }

    // No local match — ask OpenRouter for a richer response
    setBubbleText(curT.thinking)
    setState('speaking')
    stateRef.current = 'speaking'

    // Add user message to history
    conversationRef.current.push({ role: 'user', content: userMessage })
    // Keep only last 20 messages for context
    if (conversationRef.current.length > 20) {
      conversationRef.current = conversationRef.current.slice(-20)
    }

    try {
      const reply = await askAI(conversationRef.current, curLang)
      // Add assistant reply to history
      conversationRef.current.push({ role: 'assistant', content: reply })

      // Extract language tag and switch if needed
      const detectedLang = extractLang(reply)
      if (detectedLang && detectedLang !== langRef.current) {
        langRef.current = detectedLang
        setCurrentLang(detectedLang)
        if (onLangChange) onLangChange(detectedLang)
      }
      const replyLang = detectedLang || curLang
      const replySpeechLang = SPEECH_LANGS[replyLang] || 'en-US'

      // Extract and execute action command if present
      const action = extractAction(reply)
      let cleanReply = stripAction(reply)
      cleanReply = stripLang(cleanReply)

      setBubbleText(cleanReply)
      setState('speaking')
      stateRef.current = 'speaking'

      // Speak aloud only if user used voice
      if (mode === 'voice') speakTTS(cleanReply, replySpeechLang)

      // Trigger the action after a short delay so user reads the response
      if (action && onAction) {
        setTimeout(() => onAction(action), 1800)
      }

      // Track interaction via Telegram
      sendToTelegram(userMessage, cleanReply, mode)
    } catch (err) {
      console.warn('AI error:', err)
      const errT = i18n[langRef.current] || i18n.en
      setBubbleText(errT.fallback)
      setState('speaking')
      stateRef.current = 'speaking'
      if (mode === 'voice') speakTTS(errT.fallback, SPEECH_LANGS[langRef.current] || 'en-US')
      sendToTelegram(userMessage, '[ERROR] ' + err.message, mode)
    }
  }, [onAction, onLangChange])

  const startListening = useCallback(() => {
    if (!SpeechRecognition || stateRef.current !== 'idle') return

    stopSpeaking()

    const recognition = new SpeechRecognition()
    recognition.lang = SPEECH_LANGS[langRef.current] || 'en-US'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setState('listening')
      stateRef.current = 'listening'
      const curT = i18n[langRef.current] || i18n.en
      setBubbleText(curT.listening)
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
        const curT = i18n[langRef.current] || i18n.en
        setBubbleText(curT.noSpeech)
      }
      setState('idle')
      stateRef.current = 'idle'
    }

    recognition.onend = () => {
      if (stateRef.current === 'listening') {
        setState('idle')
        stateRef.current = 'idle'
        const curT = i18n[langRef.current] || i18n.en
        setBubbleText(curT.idle)
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
    warmupTTS() // Unlock speechSynthesis on mobile within user gesture
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
      const curT = i18n[langRef.current] || i18n.en
      setBubbleText(curT.thinking)
      sendToTelegram(msg, '[DIRECT MESSAGE]', 'text')
        .then(() => {
          setBubbleText(curT.dmSent)
        })
        .catch(() => {
          setBubbleText(curT.dmError)
        })
      return
    }

    setState('speaking')
    stateRef.current = 'speaking'
    setBubbleText(msg)
    inputModeRef.current = 'text'
    respondToUser(msg)
  }, [inputText, respondToUser])

  // Keyboard handlers (desktop) — only active when overlay is visible (default view)
  useEffect(() => {
    const handleKey = (e) => {
      if (!visible) return

      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
          e.preventDefault()
          setState('idle')
          stateRef.current = 'idle'
          const curT = i18n[langRef.current] || i18n.en
          setBubbleText(curT.idle)
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
  }, [visible, handleVoice, startTyping])

  const stateClass = state === 'listening' ? 'bubble-listening'
    : state === 'speaking' ? 'bubble-speaking'
    : state === 'typing' ? 'bubble-typing'
    : 'bubble-idle'

  const overlayStyle = {
    opacity: visible ? 1 : 0,
    pointerEvents: visible ? 'auto' : 'none',
    transition: 'opacity 0.4s ease',
  }

  return (
    <div style={overlayStyle}>
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
            <span className="bubble-text">{renderTextWithLinks(displayText, startDirectMessage, t.messageLabel)}</span>
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
    </div>
  )
}
