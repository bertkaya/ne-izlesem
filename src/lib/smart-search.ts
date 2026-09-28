// Serbest metin isteğini ("90'lar korku filmi", "feel-good family movie") TMDB discover
// parametrelerine çeviren kural tabanlı analiz + veri tabanlı öneri gerekçesi.
// Saf fonksiyonlar: sunucu ve test ortamında aynı şekilde çalışır.

import { TMDB_GENRE_NAMES } from '@/lib/constants'
import type { Locale, MediaItem, MediaType } from '@/types/media'

/**
 * Terim sözdizimi:
 *  - 'war'     → tam kelime ("war" eşleşir, "award" / "software" / "warm" eşleşmez)
 *  - 'korku*'  → kelime başı ile başlayan (Türkçe ekler için: "korkunç", "korku filmi")
 */
interface GenreRule {
  key: string;
  movie: string;
  tv: string;
  label: Record<Locale, string>;
  terms: string[];
}

// Sıra önemlidir: eşit skorda listede önce gelen kazanır.
const GENRE_RULES: GenreRule[] = [
  {
    key: 'horror', movie: '27', tv: '9648|10765', label: { tr: 'korku', en: 'horror' },
    terms: ['korku*', 'korkut*', 'ürpert*', 'altıma yap*', 'slasher*', 'horror*', 'scary', 'scare', 'scares', 'spooky', 'zombi*', 'zombie*']
  },
  {
    key: 'thriller', movie: '53', tv: '9648|80', label: { tr: 'gerilim', en: 'thriller' },
    terms: ['gerilim*', 'gergin*', 'sinirlerimi boz*', 'tek mekan*', 'thriller*', 'thrilling', 'suspense*', 'edge of my seat', 'tension', 'intense', 'gripping']
  },
  {
    key: 'comedy', movie: '35', tv: '35', label: { tr: 'komedi', en: 'comedy' },
    terms: ['komik*', 'komedi*', 'gülmek*', 'gülmekten*', 'güldür*', 'karnım ağr*', 'eğlenceli*', 'kafa boşalt*', 'comedy', 'comedies', 'funny', 'laugh*', 'humor*', 'humour*', 'hilarious', 'brain-off']
  },
  {
    key: 'drama', movie: '18', tv: '18', label: { tr: 'duygusal dram', en: 'emotional drama' },
    terms: ['ağla*', 'hüngür*', 'duygusal*', 'dram', 'dramı', 'dramatik*', 'gözyaş*', 'üzgün*', 'hüzün*', 'cry', 'crying', 'tears', 'tearjerker*', 'emotional*', 'drama', 'dramas', 'heartbreak*', 'sad']
  },
  {
    key: 'feelgood', movie: '35|10749|10751', tv: '35|10751', label: { tr: 'içini ısıtan', en: 'feel-good' },
    terms: ['pamuk gibi*', 'içimi ısıt*', 'romanti*', 'aşk*', 'feel-good', 'feel good', 'warm', 'wholesome', 'cozy', 'romance', 'romantic*']
  },
  {
    key: 'action', movie: '28', tv: '10759', label: { tr: 'aksiyon', en: 'action' },
    terms: ['aksiyon*', 'vurdu kır*', 'çerezlik*', 'macera*', 'ıssız ada*', 'hayatta kal*', 'action', 'adventure*', 'popcorn', 'fight*', 'survival', 'stranded']
  },
  {
    key: 'scifi', movie: '878', tv: '10765', label: { tr: 'bilim kurgu', en: 'sci-fi' },
    terms: ['bilim kurgu*', 'bilimkurgu*', 'uzay*', 'uzaylı*', 'gelecek*', 'zaman yolculu*', 'kıyamet*', 'dünyanın sonu*', 'distopya*', 'sci-fi', 'scifi', 'science fiction', 'space', 'alien*', 'cyberpunk*', 'dystopia*', 'time travel*', 'apocalyp*', 'post-apocalyp*']
  },
  {
    key: 'mindbend', movie: '9648|878', tv: '9648|10765', label: { tr: 'beyin yakan', en: 'mind-bending' },
    terms: ['beyin yak*', 'ters köşe*', 'mind-bend*', 'mindbend*', 'twist*', 'plot twist*']
  },
  {
    key: 'crime', movie: '80', tv: '80', label: { tr: 'suç', en: 'crime' },
    terms: ['suç*', 'polis*', 'polisiye*', 'mafya*', 'soygun*', 'gangster*', 'crime', 'crimes', 'heist*', 'mafia', 'noir', 'gangster*']
  },
  {
    key: 'mystery', movie: '9648|80', tv: '9648', label: { tr: 'gizem', en: 'mystery' },
    terms: ['katil kim*', 'cinayet*', 'dedektif*', 'gizem*', 'whodunit*', 'murder*', 'detective*', 'mystery', 'mysteries']
  },
  {
    key: 'documentary', movie: '99', tv: '99', label: { tr: 'belgesel', en: 'documentary' },
    terms: ['belgesel*', 'öğren*', 'ufkumu*', 'documentar*', 'docuseries', 'nature', 'expand my mind', 'learn*']
  },
  {
    key: 'animation', movie: '16', tv: '16', label: { tr: 'animasyon', en: 'animation' },
    terms: ['anime*', 'animasyon*', 'çizgi film*', 'animation*', 'animated', 'pixar', 'ghibli']
  },
  {
    key: 'family', movie: '10751', tv: '10751', label: { tr: 'aile', en: 'family' },
    terms: ['aile*', 'ailecek', 'çocuk*', 'family', 'kids', 'children']
  },
  {
    key: 'fantasy', movie: '14', tv: '10765', label: { tr: 'fantastik', en: 'fantasy' },
    terms: ['fantasti*', 'büyülü*', 'büyücü*', 'sihir*', 'krallık*', 'ejderha*', 'fantasy', 'magic*', 'kingdom*', 'dragon*', 'wizard*']
  },
  {
    key: 'war', movie: '10752|36', tv: '10768', label: { tr: 'savaş & tarih', en: 'war & history' },
    terms: ['savaş*', 'tarih*', 'epik*', 'war', 'wars', 'wartime', 'battle*', 'historical', 'history', 'epic']
  },
  {
    key: 'western', movie: '37', tv: '37', label: { tr: 'western', en: 'western' },
    terms: ['western*', 'kovboy*', 'cowboy*', 'spaghetti']
  },
  {
    key: 'music', movie: '10402', tv: '10402', label: { tr: 'müzikal', en: 'musical' },
    terms: ['müzikal*', 'musical*', 'konser*', 'concert*']
  },
]

const LANGUAGE_RULES: { lang: string; terms: string[] }[] = [
  { lang: 'tr', terms: ['yeşilçam*', 'türk*', 'yerli*', 'turkish'] },
  { lang: 'ko', terms: ['kore*', 'korean'] },
  { lang: 'ja', terms: ['japon*', 'japanese'] },
  { lang: 'fr', terms: ['fransız*', 'french'] },
  { lang: 'es', terms: ['ispanyol*', 'spanish'] },
  { lang: 'hi', terms: ['bollywood', 'hint film*', 'indian'] },
  { lang: 'it', terms: ['italyan*', 'italian'] },
]

const QUALITY_TERMS = ['en iyi*', 'puanı yüksek*', 'kaliteli*', 'başyapıt*', 'ödüllü*', 'top 250', 'imdb', 'masterpiece*', 'best', 'acclaimed', 'award*', 'oscar*', 'cannes', 'arthouse*', 'festival*']
const RECENT_TERMS = ['yeni', 'yeni çıkan*', 'güncel*', 'vizyon*', 'bu yıl*', 'recent', 'latest', 'new', 'newest']
const RETRO_TERMS = ['eski*', 'klasik*', 'nostalji*', 'retro*', 'classic*', 'nostalgi*', 'old-school', 'old school']
const TV_TERMS = ['dizi*', 'mini dizi*', 'series', 'tv series', 'tv show*', 'miniseries', 'sitcom*']
const SHORT_TERMS = ['kısa*', 'short', '90 dk', '<90', 'under 90']

export interface PromptAnalysis {
  /** Algılanan tür anahtarı (ör. 'horror'); hiçbir tür bulunamazsa null. */
  genreKey: string | null;
  /** Seçilen mediaType için TMDB with_genres değeri ('|' = VEYA). Tür yoksa ''. */
  genreIds: string;
  mediaType: MediaType;
  sort: string;
  /** 'YYYY-YYYY' aralığı ya da ''. */
  year: string;
  minVoteCount: number;
  minVoteAverage?: number;
  originalLanguage?: string;
  maxRuntime?: number;
  /** Tespit edilen tür etiketi (gerekçe metni için), ör. { tr: 'korku', en: 'horror' }. */
  genreLabel?: Record<Locale, string>;
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const regexCache = new Map<string, RegExp>()
function termRegex(term: string): RegExp {
  let re = regexCache.get(term)
  if (!re) {
    const prefix = term.endsWith('*')
    const body = escapeRegex(prefix ? term.slice(0, -1) : term).replace(/ /g, '\\s+')
    // \b Türkçe harfleri (ı, ş, ğ...) tanımadığı için Unicode harf/rakam sınırı kullanılıyor.
    re = new RegExp(`(?<![\\p{L}\\p{N}])${body}${prefix ? '' : '(?![\\p{L}\\p{N}])'}`, 'u')
    regexCache.set(term, re)
  }
  return re
}

function countMatches(text: string, terms: string[]): number {
  return terms.reduce((n, t) => n + (termRegex(t).test(text) ? 1 : 0), 0)
}

/**
 * Hem Türkçe ("KOMİK" → "komik", "IRMAK" → "ırmak") hem de standart ("SCI-FI" → "sci-fi")
 * küçük harf dönüşümünü birlikte arar; böylece iki dilde de büyük harfli yazım eşleşir.
 */
export function normalizePrompt(text: string): string {
  const tr = text.toLocaleLowerCase('tr-TR')
  const std = text.toLowerCase()
  return tr === std ? tr : `${tr}\n${std}`
}

function detectDecade(text: string): string {
  // 90'lar, 90lar, 80’ler, 1980'ler, 2000'ler, 90s, 1990s
  const m = text.match(new RegExp(`(?<![\\p{N}])((?:19|20)?\\d0)\\s*['’]?\\s*(?:ler|lar|s)(?![\\p{L}])`, 'u'))
  if (!m) return ''
  const raw = m[1]
  let start = parseInt(raw, 10)
  if (raw.length === 2) start = start >= 30 ? 1900 + start : 2000 + start
  if (start < 1900 || start > 2090) return ''
  return `${start}-${start + 9}`
}

export function analyzePrompt(text: string, now: Date = new Date()): PromptAnalysis {
  const lower = normalizePrompt(text)

  const mediaType: MediaType = countMatches(lower, TV_TERMS) > 0 ? 'tv' : 'movie'

  // --- 1. TÜR (en çok terim eşleşen kural kazanır) ---
  let best: GenreRule | null = null
  let bestScore = 0
  for (const rule of GENRE_RULES) {
    const score = countMatches(lower, rule.terms)
    if (score > bestScore) { best = rule; bestScore = score }
  }

  // --- 2. DÖNEM ---
  const currentYear = now.getFullYear()
  let year = detectDecade(lower)
  if (!year && countMatches(lower, ['yeşilçam*'])) year = '1950-1989'
  if (!year && countMatches(lower, RECENT_TERMS)) year = `${currentYear - 2}-${currentYear}`
  if (!year && countMatches(lower, RETRO_TERMS)) year = '1970-1999'

  // --- 3. KALİTE & SIRALAMA ---
  let sort = 'popularity.desc'
  let minVoteCount = 100
  let minVoteAverage: number | undefined
  if (countMatches(lower, QUALITY_TERMS)) {
    sort = 'vote_average.desc'
    minVoteCount = 500
    minVoteAverage = 7.5
  } else if (!best) {
    // Tür anlaşılamadıysa rastgele popüler içerik yerine sevilen yapımlar
    minVoteCount = 1000
    minVoteAverage = 7
  }

  // --- 4. DİL & SÜRE ---
  const originalLanguage = LANGUAGE_RULES.find(r => countMatches(lower, r.terms) > 0)?.lang
  const maxRuntime = mediaType === 'movie' && countMatches(lower, SHORT_TERMS) ? 90 : undefined

  return {
    genreKey: best?.key ?? null,
    genreIds: best ? best[mediaType] : '',
    mediaType,
    sort,
    year,
    minVoteCount,
    minVoteAverage,
    originalLanguage,
    maxRuntime,
    genreLabel: best?.label,
  }
}

/** TMDB /discover parametreleri (api_key ve dil hariç). */
export function buildDiscoverParams(a: PromptAnalysis, opts: { page?: number; platforms?: number[] } = {}): Record<string, string> {
  const p: Record<string, string> = {
    sort_by: a.sort,
    include_adult: 'false',
    'vote_count.gte': String(a.minVoteCount),
    page: String(opts.page ?? 1),
  }
  if (a.genreIds) p.with_genres = a.genreIds
  if (a.minVoteAverage) p['vote_average.gte'] = String(a.minVoteAverage)
  if (a.originalLanguage) p.with_original_language = a.originalLanguage
  if (a.maxRuntime) p['with_runtime.lte'] = String(a.maxRuntime)
  if (a.year) {
    const [start, end] = a.year.split('-')
    const field = a.mediaType === 'movie' ? 'primary_release_date' : 'first_air_date'
    p[`${field}.gte`] = `${start}-01-01`
    p[`${field}.lte`] = `${end}-12-31`
  }
  if (opts.platforms?.length) {
    p.with_watch_providers = opts.platforms.join('|')
    p.watch_region = 'TR'
    p.with_watch_monetization_types = 'flatrate'
  }
  return p
}

function formatCount(n: number, locale: Locale): string {
  if (n >= 1000) {
    const k = (n / 1000).toFixed(n >= 10000 ? 0 : 1)
    return locale === 'tr' ? `${k.replace('.', ',')} bin` : `${k}K`
  }
  return String(n)
}

/**
 * Küratör (Gemini'siz) sonuçlar için gerçek TMDB verisinden gerekçe üretir:
 * tür, yıl, puan ve oy sayısı — uydurma bir "tadım notu" yerine doğrulanabilir bilgiler.
 */
export function buildCuratorReason(item: MediaItem, analysis: PromptAnalysis, locale: Locale, now: Date = new Date()): string {
  const isTr = locale === 'tr'
  const names = TMDB_GENRE_NAMES[locale]
  const genreIds = item.genre_ids ?? item.genres?.map(g => g.id) ?? []
  const genres = genreIds.map(id => names[id]).filter(Boolean).slice(0, 2)
  const yearStr = (item.release_date || item.first_air_date)?.slice(0, 4)
  const year = yearStr ? parseInt(yearStr, 10) : undefined
  const avg = item.vote_average ?? 0
  const count = item.vote_count ?? 0
  // Türkçe tamlama: "korku filmi", "komedi dizisi"; tür yoksa yalın "film" / "dizi"
  const kind = analysis.mediaType === 'tv'
    ? (isTr ? (genres.length ? 'dizisi' : 'dizi') : 'series')
    : (isTr ? (genres.length ? 'filmi' : 'film') : 'film')

  const lead = analysis.genreLabel
    ? (isTr ? `"${analysis.genreLabel.tr}" isteğine uygun` : `Matches your "${analysis.genreLabel.en}" craving`)
    : (isTr ? 'İzleyicilerin en sevdiklerinden' : 'An audience favourite')

  const desc = [
    year ? (isTr ? `${year} yapımı` : `a ${year}`) : '',
    genres.join(' / ').toLocaleLowerCase(isTr ? 'tr-TR' : 'en-US'),
    kind,
  ].filter(Boolean).join(' ')

  let highlight = ''
  if (avg >= 8 && count >= 500) highlight = isTr ? 'türünün en yüksek puanlılarından' : 'one of the highest-rated in its genre'
  else if (count >= 10000) highlight = isTr ? 'geniş kitlelerin favorisi' : 'a widely loved crowd favourite'
  else if (year && year >= now.getFullYear() - 2) highlight = isTr ? 'yeni çıkanlardan' : 'a recent release'
  else if (year && year < 1990) highlight = isTr ? 'nostaljik bir klasik' : 'a nostalgic classic'

  const score = avg > 0
    ? (isTr ? `TMDB puanı ${avg.toFixed(1)} (${formatCount(count, locale)} oy).` : `TMDB score ${avg.toFixed(1)} (${formatCount(count, locale)} votes).`)
    : ''

  const sentence = `${lead}: ${desc}${highlight ? `, ${highlight}` : ''}.`
  return score ? `${sentence} ${score}` : sentence
}
