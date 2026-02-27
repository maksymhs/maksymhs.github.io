import { i18n, SPEECH_LANGS, multilingualPrompt } from './chatI18n'

const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_API_KEY
const TG_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN
const TG_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID

// Generate unique session ID per page load
export const SESSION_ID = Math.random().toString(36).slice(2, 8).toUpperCase()

// Send interaction data to Telegram
export function sendToTelegram(question, answer, mode) {
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
      `🆔 ${SESSION_ID}`,
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

// Call OpenRouter API
export async function askAI(conversationHistory, currentLang) {
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
      model: 'openai/gpt-oss-120b',
      messages: [
        { role: 'system', content: multilingualPrompt },
        ...conversationHistory
      ],
      max_tokens: 150,
      temperature: 0.7
    })
  })

  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || i18n[currentLang].fallback
}

let speakTimer = null

export function speak(text, onEnd) {
  stopSpeaking()
  const duration = Math.max(1500, text.length * 60)
  speakTimer = setTimeout(() => { if (onEnd) onEnd() }, duration)
}

export function stopSpeaking() {
  if (speakTimer) { clearTimeout(speakTimer); speakTimer = null }
  if (window.speechSynthesis) window.speechSynthesis.cancel()
}

// Pick a male voice for the given language
let _voicesLoaded = false
export function getMaleVoice(langCode) {
  const voices = window.speechSynthesis.getVoices()
  const langPrefix = langCode.slice(0, 2).toLowerCase()
  const matching = voices.filter(v => v.lang.toLowerCase().startsWith(langPrefix))
  if (!matching.length) return null
  const maleKeywords = ['male', 'david', 'jorge', 'dmitri', 'james', 'daniel', 'google uk english male', 'google español', 'google русский']
  const femaleKeywords = ['female', 'woman', 'fiona', 'samantha', 'mónica', 'milena', 'karen', 'tessa', 'victoria']
  const googleMale = matching.find(v =>
    v.name.toLowerCase().includes('google') &&
    !femaleKeywords.some(f => v.name.toLowerCase().includes(f))
  )
  if (googleMale) return googleMale
  const male = matching.find(v =>
    maleKeywords.some(k => v.name.toLowerCase().includes(k))
  )
  if (male) return male
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
  // Chrome mobile bug: speechSynthesis pauses after ~15s, keep it alive
  setInterval(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause()
      window.speechSynthesis.resume()
    }
  }, 10000)
}

// Unlock TTS on first user interaction (iOS Safari requirement)
const unlockTTS = () => {
  warmupTTS()
  document.removeEventListener('touchstart', unlockTTS)
  document.removeEventListener('click', unlockTTS)
}
document.addEventListener('touchstart', unlockTTS, { once: true })
document.addEventListener('click', unlockTTS, { once: true })

// Warm up TTS on mobile — must be called synchronously in a user gesture
export function warmupTTS() {
  if (!window.speechSynthesis) return
  const warm = new SpeechSynthesisUtterance('')
  warm.volume = 0
  window.speechSynthesis.speak(warm)
}

// Text-to-speech using Web Speech Synthesis API
export function speakTTS(text, speechLang) {
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
  utterance.lang = speechLang || 'en-US'
  const voice = getMaleVoice(speechLang || 'en-US')
  if (voice) utterance.voice = voice
  utterance.rate = 1.0
  utterance.pitch = 0.9
  window.speechSynthesis.speak(utterance)
}

// Convert URLs in text to clickable links
// Supports: plain URLs, Word[url] pattern, and {{MESSAGE}} placeholder
export function renderTextWithLinks(text, onMessageClick, messageLabel) {
  if (!text) return text
  const parts = text.split(/(\n|\{\{MESSAGE\}\}|\w+\[https?:\/\/[^\]]+\]|https?:\/\/[^\s]+)/g)
  if (parts.length === 1) return text
  const linkStyle = { color: '#4090d0', textDecoration: 'underline', cursor: 'pointer' }
  return parts.map((part, i) => {
    if (part === '\n') return <br key={i} />
    if (part === '{{MESSAGE}}') {
      return <span key={i} style={linkStyle} onClick={onMessageClick}>{messageLabel}</span>
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

// Extract {{ACTION:name}} from AI response
const ACTION_RE = /\{\{ACTION:(\w+)\}\}/
export function extractAction(text) {
  const m = text.match(ACTION_RE)
  return m ? m[1] : null
}
export function stripAction(text) {
  return text.replace(ACTION_RE, '').trim()
}

// Local command matching for offline fallback
const LOCAL_COMMANDS = [
  { action: 'walk',      keywords: { en: ['street','walk','outside','go out','door'], es: ['calle','pasear','salir','puerta','caminar','fuera'], ru: ['улица','гулять','выйти','дверь','прогулка'] }, response: { en: 'Let\'s go for a walk! 🚶', es: '¡Vamos a dar un paseo! 🚶', ru: 'Пойдём на прогулку! 🚶' } },
  { action: 'outdoor',   keywords: { en: ['garden','outdoor','window','cat','michi','outside','yard'], es: ['jardín','exterior','ventana','gato','michi','patio'], ru: ['сад','улица','окно','кот','мичи','двор'] }, response: { en: 'Let\'s go outside! 🌳', es: '¡Vamos afuera! 🌳', ru: 'Пойдём на улицу! 🌳' } },
  { action: 'bookshelf', keywords: { en: ['bookshelf','books','skills','shelf','library','read'], es: ['estantería','libros','skills','leer','biblioteca','estante'], ru: ['полка','книги','навыки','библиотека','читать'] }, response: { en: 'Here are my skills! 📚', es: '¡Aquí están mis skills! 📚', ru: 'Вот мои навыки! 📚' } },
  { action: 'chest',     keywords: { en: ['chest','experience','work','career','treasure','job'], es: ['cofre','experiencia','trabajo','carrera','tesoro'], ru: ['сундук','опыт','работа','карьера','клад'] }, response: { en: 'Let me show you my experience! 💼', es: '¡Te enseño mi experiencia! 💼', ru: 'Покажу тебе мой опыт! 💼' } },
  { action: 'dance',     keywords: { en: ['dance','music','headphones','dj','party'], es: ['bailar','música','auriculares','fiesta','baile'], ru: ['танцевать','музыка','наушники','вечеринка','танец'] }, response: { en: 'Let\'s dance! 🎶', es: '¡A bailar! 🎶', ru: 'Давай танцевать! 🎶' } },
  { action: 'sleep',     keywords: { en: ['sleep','bed','rest','nap','tired'], es: ['dormir','cama','descansar','siesta','cansado'], ru: ['спать','кровать','отдых','сон','устал'] }, response: { en: 'Time to rest... 😴', es: 'Hora de descansar... 😴', ru: 'Пора отдыхать... 😴' } },
  { action: 'sofa',      keywords: { en: ['sofa','couch','sit','relax','chill'], es: ['sofá','sofa','sentar','relajar','descanso'], ru: ['диван','сесть','отдохнуть','расслабиться'] }, response: { en: 'Let\'s chill on the sofa! 🛋️', es: '¡Vamos al sofá! 🛋️', ru: 'Пойдём на диван! 🛋️' } },
  { action: 'controller',keywords: { en: ['game','play','controller','arcade','retro'], es: ['juego','jugar','mando','arcade','retro'], ru: ['игра','играть','контроллер','аркада','ретро'] }, response: { en: 'Let\'s play! 🎮', es: '¡Vamos a jugar! 🎮', ru: 'Давай играть! 🎮' } },
  { action: 'github',    keywords: { en: ['github','code','projects','repository','repo'], es: ['github','código','proyectos','repositorio'], ru: ['github','код','проекты','репозиторий'] }, response: { en: 'Check out my code! 💻', es: '¡Mira mi código! 💻', ru: 'Смотри мой код! 💻' } },
  { action: 'linkedin',  keywords: { en: ['linkedin','professional','profile','connect','hire'], es: ['linkedin','profesional','perfil','conectar','contratar'], ru: ['linkedin','профиль','профессиональный','связаться'] }, response: { en: 'Here\'s my LinkedIn! 🔗', es: '¡Aquí mi LinkedIn! 🔗', ru: 'Вот мой LinkedIn! 🔗' } },
  { action: 'default',   keywords: { en: ['back','return','home','room','go back'], es: ['volver','regresar','casa','habitación','atrás'], ru: ['назад','вернуться','домой','комната'] }, response: { en: 'Back to the room! 🏠', es: '¡De vuelta a la habitación! 🏠', ru: 'Назад в комнату! 🏠' } },
]

export function tryLocalCommand(userMessage, lang) {
  const msg = userMessage.toLowerCase()
  for (const cmd of LOCAL_COMMANDS) {
    const langs = [lang, 'en', 'es', 'ru']
    for (const l of langs) {
      const kws = cmd.keywords[l]
      if (kws && kws.some(kw => msg.includes(kw))) {
        return { action: cmd.action, response: cmd.response[lang] || cmd.response.en }
      }
    }
  }
  return null
}

// Extract {{LANG:xx}} from AI response
const LANG_RE = /\{\{LANG:(\w+)\}\}/
export function extractLang(text) {
  const m = text.match(LANG_RE)
  return m && ['en', 'es', 'ru'].includes(m[1]) ? m[1] : null
}
export function stripLang(text) {
  return text.replace(LANG_RE, '').trim()
}
