// Sunucu tarafı TMDB yardımcıları. API anahtarı yalnızca sunucuda okunur;
// bu modül istemciye import edilirse anahtar tanımsız olur ve istekler boş döner.
import type { MediaItem, MediaType } from '@/types/media'
import { mapWithConcurrency } from '@/lib/concurrency'

const BASE_URL = 'https://api.themoviedb.org/3'
// NEXT_PUBLIC_TMDB_API_KEY: eski ad, ortam değişkenleri güncellenene kadar geriye dönük uyumluluk için.
const API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TmdbResponse = Record<string, any>

export function hasTmdbKey() {
  return Boolean(API_KEY)
}

export async function fetchTMDB(endpoint: string, params: Record<string, string> = {}, revalidate = 3600): Promise<TmdbResponse> {
  if (!API_KEY) return {}
  const query = new URLSearchParams({ api_key: API_KEY, language: 'tr-TR', ...params }).toString()
  // Takılan bir istek tüm öneriyi (ve Vercel fonksiyonunu) bekletmesin: 6 sn zaman aşımı, 1 tekrar
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`${BASE_URL}${endpoint}?${query}`, { next: { revalidate }, signal: AbortSignal.timeout(6000) })
      if (res.status === 429 || res.status >= 500) continue
      if (!res.ok) return {}
      return await res.json()
    } catch (e) {
      console.warn(`TMDB ${endpoint} deneme ${attempt + 1} başarısız:`, (e as Error).name)
    }
  }
  return {}
}

export async function getDetails(id: number, type: MediaType, language?: string): Promise<TmdbResponse> {
  return fetchTMDB(`/${type}/${id}`, {
    append_to_response: 'external_ids,credits,watch/providers,videos',
    ...(language ? { language } : {})
  })
}

export async function getMoviesByTitles(
  list: { title: string, type?: MediaType, year?: string, reason?: string }[],
  language?: string
): Promise<MediaItem[]> {
  // TMDB'ye aynı anda en fazla 4 istek (her başlık = arama + detay).
  const resolved = await mapWithConcurrency(list.slice(0, 8), 4, async (item): Promise<MediaItem | null> => {
    const type: MediaType = item.type === 'tv' ? 'tv' : 'movie'
    const params: Record<string, string> = { query: item.title, ...(language ? { language } : {}) }
    if (item.year) {
      if (type === 'movie') params.year = item.year
      else params.first_air_date_year = item.year
    }

    const searchRes = await fetchTMDB(`/search/${type}`, params)
    const bestMatch = searchRes.results?.[0]
    if (!bestMatch) return null
    const details = await getDetails(bestMatch.id, type, language)
    return { ...bestMatch, ...details, media_type: type, reason: item.reason, reasonSource: 'ai' }
  })
  return resolved.filter((r): r is MediaItem => r !== null)
}
