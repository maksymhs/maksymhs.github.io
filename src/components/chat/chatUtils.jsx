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
// Order matters: more specific commands first to avoid false positives
const LOCAL_COMMANDS = [
  { action: 'dance',     keywords: { en: ['dance','dancing','let\'s dance','move','groove','headphones','dj','party'], es: ['bailar','baila','bailemos','musica','música','auriculares','fiesta','baile','mueve'], ru: ['танцевать','танцуй','потанцуем','музыка','наушники','вечеринка','танец'] }, response: { en: 'Let\'s dance! 🎶', es: '¡A bailar! 🎶', ru: 'Давай танцевать! 🎶' } },
  { action: 'sleep',     keywords: { en: ['sleep','sleeping','go to sleep','bed','rest','nap','tired','lie down','goodnight'], es: ['dormir','duerme','duermete','duérmete','cama','descansar','siesta','cansado','acuestate','acuéstate','buenas noches','a dormir','echarse'], ru: ['спать','спи','ложись','кровать','отдых','сон','устал','спокойной ночи'] }, response: { en: 'Time to rest... 😴', es: 'Hora de descansar... 😴', ru: 'Пора отдыхать... 😴' } },
  { action: 'sofa',      keywords: { en: ['sofa','couch','sit down','relax','chill','sit on sofa','lay down'], es: ['sofa','sofá','sentar','sientate','siéntate','relajar','descanso','relajate','relájate','tumbarse'], ru: ['диван','сесть','отдохнуть','расслабиться','посиди'] }, response: { en: 'Let\'s chill on the sofa! �️', es: '¡Vamos al sofá! �️', ru: 'Пойдём на диван! �️' } },
  { action: 'walk',      keywords: { en: ['street','walk','go out','door','let\'s go','take a walk','stroll','go for a walk'], es: ['calle','pasear','salir','puerta','caminar','fuera','vamos','sal','paseo','anda','vamonos','vámonos'], ru: ['улица','гулять','выйти','дверь','прогулка','пойдём','выходи'] }, response: { en: 'Let\'s go for a walk! �', es: '¡Vamos a dar un paseo! �', ru: 'Пойдём на прогулку! �' } },
  { action: 'outdoor',   keywords: { en: ['garden','outdoor','window','cat','michi','outside','yard','patio'], es: ['jardin','jardín','exterior','ventana','gato','michi','patio','afuera'], ru: ['сад','окно','кот','мичи','двор','снаружи'] }, response: { en: 'Let\'s go outside! �', es: '¡Vamos afuera! �', ru: 'Пойдём на улицу! �' } },
  { action: 'bookshelf', keywords: { en: ['bookshelf','books','skills','shelf','library','read','knowledge','what do you know','what can you do','tech','technologies','tell me about you','about yourself','know','stack','what you know','your skills'], es: ['estanteria','estantería','libros','skills','leer','biblioteca','estante','conocimiento','que sabes','qué sabes','que puedes','qué puedes','tecnologias','tecnologías','cuentame','cuéntame','hablame de ti','háblame de ti','sabes','conoces','stack','habilidades','competencias'], ru: ['полка','книги','навыки','библиотека','читать','знания','что умеешь','что знаешь','технологии','расскажи о себе','стек','умения'] }, response: { en: 'Let me show you my skills! �', es: '¡Te enseño mis conocimientos! �', ru: 'Покажу тебе мои навыки! �' } },
  { action: 'chest',     keywords: { en: ['chest','experience','work','career','treasure','job','resume','cv','worked','companies','where did you work','employment','history'], es: ['cofre','experiencia','trabajo','carrera','tesoro','empleo','curriculum','currículum','cv','empresas','donde has trabajado','dónde has trabajado','trabajado','historial','trayectoria'], ru: ['сундук','опыт','работа','карьера','клад','резюме','компании','где работал','трудовой'] }, response: { en: 'Let me show you my experience! �', es: '¡Te enseño mi experiencia! �', ru: 'Покажу тебе мой опыт! �' } },
  { action: 'controller',keywords: { en: ['game','play','controller','arcade','retro','let\'s play','games'], es: ['juego','jugar','juega','mando','arcade','retro','vamos a jugar','juegos'], ru: ['игра','играть','контроллер','аркада','ретро','поиграем','игры'] }, response: { en: 'Let\'s play! 🎮', es: '¡Vamos a jugar! 🎮', ru: 'Давай играть! 🎮' } },
  { action: 'github',    keywords: { en: ['github','code','projects','repository','repo','source code'], es: ['github','codigo','código','proyectos','repositorio','codigo fuente','código fuente'], ru: ['github','код','проекты','репозиторий','исходный код'] }, response: { en: 'Check out my code! 💻', es: '¡Mira mi código! 💻', ru: 'Смотри мой код! 💻' } },
  { action: 'linkedin',  keywords: { en: ['linkedin','professional','profile','connect','hire','hiring','contact'], es: ['linkedin','profesional','perfil','conectar','contratar','contacto','contactar'], ru: ['linkedin','профиль','профессиональный','связаться','нанять','контакт'] }, response: { en: 'Here\'s my LinkedIn! 🔗', es: '¡Aquí mi LinkedIn! 🔗', ru: 'Вот мой LinkedIn! 🔗' } },
  { action: 'clock',     keywords: { en: ['meeting','schedule','calendar','book a meeting','call','appointment','agenda','availability','free time','slot'], es: ['reunion','reunión','reunirse','reu','agendar','calendario','cita','llamada','disponibilidad','hueco','agenda','quedar','quedamos'], ru: ['встреча','назначить','календарь','звонок','запись','расписание','свободен'] }, response: { en: 'Let\'s schedule a meeting! 📅', es: '¡Agendemos una reunión! 📅', ru: 'Назначим встречу! 📅' } },
  { action: 'default',   keywords: { en: ['back','return','home','room','go back','reset'], es: ['volver','regresar','casa','habitacion','habitación','atras','atrás','vuelve'], ru: ['назад','вернуться','домой','комната','обратно'] }, response: { en: 'Back to the room! 🏠', es: '¡De vuelta a la habitación! 🏠', ru: 'Назад в комнату! 🏠' } },
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
