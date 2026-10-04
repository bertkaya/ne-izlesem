// YouTube video süresi, kategori ve açıklama yardımcıları (saf fonksiyonlar, test edilebilir).

export type DurationCategory = 'snack' | 'meal' | 'feast'

/** ISO 8601 süresi (PT1H2M3S) → saniye. Canlı yayınlar "P0D" döner → 0. */
export function parseDurationSeconds(iso: string | undefined): number {
  const m = iso?.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  if (!m) return 0
  const [, d, h, min, s] = m.map(v => parseInt(v || '0', 10))
  return d * 86400 + h * 3600 + min * 60 + s
}

/** Atıştır < 2 dk, Doyur 2–20 dk, Ziyafet > 20 dk */
export function durationCategory(seconds: number): DurationCategory {
  if (seconds < 120) return 'snack'
  if (seconds <= 20 * 60) return 'meal'
  return 'feast'
}

/** YouTube aramasının videoDuration filtresi: short < 4 dk, medium 4–20 dk, long > 20 dk */
export const YOUTUBE_DURATION_FILTER: Record<DurationCategory, 'short' | 'medium' | 'long'> = {
  snack: 'short',
  meal: 'medium',
  feast: 'long',
}

/** Canlı yayın ya da süresi bilinmeyen video (yemek süresine göre öneriye uygun değil). */
export function isLiveOrUnknown(item: { contentDetails?: { duration?: string }, snippet?: { liveBroadcastContent?: string } }): boolean {
  if (item.snippet?.liveBroadcastContent && item.snippet.liveBroadcastContent !== 'none') return true
  return parseDurationSeconds(item.contentDetails?.duration) === 0
}

/** 754 → "12:34", 3725 → "1:02:05" */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const mm = h ? String(m).padStart(2, '0') : String(m)
  return `${h ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`
}

/** Açıklamadaki bağlantıları, hashtag satırlarını ve fazla boşlukları temizler. */
export function cleanDescription(text: string | undefined, maxLength = 280): string {
  if (!text) return ''
  const cleaned = text
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\b(?:www\.)?[\w-]+\.(?:com|net|org|to|ly|gl|be|link|io|tv)\/\S*/gi, '')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !/^(#\S+\s*)+$/.test(l) && !/^[-–—•:|]+$/.test(l))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength).trimEnd()}…` : cleaned
}

/** Türkçe karakter ya da Türkçe dil etiketi var mı? */
export function detectVideoLanguage(snippet: { title?: string, description?: string, defaultAudioLanguage?: string, defaultLanguage?: string } | undefined): 'tr' | 'en' {
  const lang = snippet?.defaultAudioLanguage || snippet?.defaultLanguage
  if (lang) return lang.toLowerCase().startsWith('tr') ? 'tr' : 'en'
  return /[ğüşıöçĞÜŞİÖÇ]/.test(`${snippet?.title || ''} ${snippet?.description || ''}`) ? 'tr' : 'en'
}
