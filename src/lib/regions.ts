// Ülke (bölge) ayarları. Şimdilik uygulama Türkiye ağırlıklı çalışır (DEFAULT_REGION).
// Faz 2: kullanıcıya ülke seçtirip bu nesneden ilgili bölgeyi kullanmak yeterli —
// TMDB platform/izleme bölgesi, YouTube trend bölgesi ve platform listesi buradan gelir.

export type RegionCode = 'TR' | 'GB' | 'US' | 'DE'

export interface StreamingProvider {
  /** TMDB watch provider ID */
  id: number
  name: string
  /** Platformun kendi arama sayfası (biliniyorsa). Yoksa TMDB/JustWatch sayfasına gidilir. */
  searchUrl?: (query: string) => string
  color: string
}

export interface RegionConfig {
  code: RegionCode
  /** TMDB watch_region ve watch/providers sonuç anahtarı */
  tmdbRegion: string
  /** YouTube regionCode (trendler) */
  youtubeRegion: string
  providers: StreamingProvider[]
}

const netflix: StreamingProvider = {
  id: 8, name: 'Netflix', color: 'border-red-600 text-red-500 bg-red-500/10',
  searchUrl: q => `https://www.netflix.com/search?q=${encodeURIComponent(q)}`,
}
const prime: StreamingProvider = {
  id: 119, name: 'Prime Video', color: 'border-blue-500 text-blue-500 bg-blue-500/10',
  searchUrl: q => `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodeURIComponent(q)}`,
}
const disney: StreamingProvider = { id: 337, name: 'Disney+', color: 'border-blue-400 text-blue-400 bg-blue-400/10' }

// Not: TR dışındaki listelerin provider ID'leri faz 2'de TMDB /watch/providers/movie?watch_region=XX ile doğrulanmalı.
export const REGIONS: Record<RegionCode, RegionConfig> = {
  TR: {
    code: 'TR', tmdbRegion: 'TR', youtubeRegion: 'TR',
    providers: [
      netflix, prime, disney,
      { id: 342, name: 'HBO Max (BluTV)', color: 'border-teal-500 text-teal-500 bg-teal-500/10' },
      { id: 365, name: 'TV+', color: 'border-yellow-500 text-yellow-500 bg-yellow-500/10' },
      { id: 345, name: 'TOD', color: 'border-purple-500 text-purple-500 bg-purple-500/10' },
    ],
  },
  GB: {
    code: 'GB', tmdbRegion: 'GB', youtubeRegion: 'GB',
    providers: [
      netflix, prime, disney,
      { id: 39, name: 'NOW', color: 'border-teal-500 text-teal-500 bg-teal-500/10' },
      { id: 38, name: 'BBC iPlayer', color: 'border-pink-500 text-pink-500 bg-pink-500/10' },
      { id: 350, name: 'Apple TV+', color: 'border-gray-400 text-gray-300 bg-gray-400/10' },
    ],
  },
  US: {
    code: 'US', tmdbRegion: 'US', youtubeRegion: 'US',
    providers: [
      netflix, prime, disney,
      { id: 1899, name: 'Max', color: 'border-indigo-500 text-indigo-400 bg-indigo-500/10' },
      { id: 15, name: 'Hulu', color: 'border-green-500 text-green-500 bg-green-500/10' },
      { id: 350, name: 'Apple TV+', color: 'border-gray-400 text-gray-300 bg-gray-400/10' },
    ],
  },
  DE: {
    code: 'DE', tmdbRegion: 'DE', youtubeRegion: 'DE',
    providers: [
      netflix, prime, disney,
      { id: 30, name: 'WOW', color: 'border-yellow-500 text-yellow-500 bg-yellow-500/10' },
      { id: 350, name: 'Apple TV+', color: 'border-gray-400 text-gray-300 bg-gray-400/10' },
    ],
  },
}

export const DEFAULT_REGION: RegionCode = 'TR'

export const getRegion = (code: RegionCode = DEFAULT_REGION): RegionConfig => REGIONS[code] ?? REGIONS[DEFAULT_REGION]
