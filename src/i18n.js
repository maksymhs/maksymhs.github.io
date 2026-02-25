// Shared language detection — reused by ChatOverlay and Room (books)
export function detectLang() {
  const nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase()
  if (nav.startsWith('es')) return 'es'
  if (nav.startsWith('ru')) return 'ru'
  return 'en'
}

export const lang = detectLang()
