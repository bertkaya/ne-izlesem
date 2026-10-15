// Uygulama genelinde kullanılan TMDB / YouTube veri tipleri.
// TMDB alanlarının tamamı değil, yalnızca uygulamanın okuduğu alanlar tanımlıdır.

export type MediaType = 'movie' | 'tv';
export type Locale = 'tr' | 'en';

export interface TmdbVideo {
  key: string;
  site: string;
  type: string;
}

export interface TmdbProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface TmdbProviderRegion {
  link?: string;
  flatrate?: TmdbProvider[];
  rent?: TmdbProvider[];
  buy?: TmdbProvider[];
}

/** Film, dizi ya da rastgele bölüm — kartlarda gösterilen her şey. */
export interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  still_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  runtime?: number;
  media_type?: MediaType;
  videos?: { results?: TmdbVideo[] };
  'watch/providers'?: { results?: Record<string, TmdbProviderRegion> };
  /** Sommelier gerekçesi (AI ya da veri tabanlı küratör). */
  reason?: string;
  /** Gerekçenin kaynağı: 'ai' = Gemini, 'curator' = TMDB verisinden üretildi. */
  reasonSource?: 'ai' | 'curator';
  /** Seçilen platformda bulunamadığı için genel öneriye düşüldü. */
  fromFallback?: boolean;
  // Rastgele bölüm alanları
  showName?: string;
  season?: number;
  episode?: number;
}

export interface YoutubeVideo {
  id: number | string;
  videoId?: string;
  title: string;
  url: string;
  duration_category?: string;
  /** Gerçek süre (saniye); veritabanı videolarında olmayabilir */
  durationSeconds?: number;
  mood?: string;
  language?: string | null;
  channelTitle?: string;
  channelId?: string;
  description?: string;
  thumbnail?: string;
}

export interface AiSuggestionOptions {
  /** Önerilmemesi gereken TMDB ID'leri (izlenenler + kara liste). */
  excludeIds?: number[];
  /** Kullanıcının abonelik platformları (TMDB provider ID'leri). */
  platforms?: number[];
}

export interface AiSuggestionResult {
  success: boolean;
  results: MediaItem[];
  source?: 'ai' | 'curator';
  error?: 'rate_limited' | 'empty' | 'unavailable';
}

export const displayTitle = (m: Pick<MediaItem, 'title' | 'name'>): string => m.title || m.name || '';

export const releaseYear = (m: Pick<MediaItem, 'release_date' | 'first_air_date'>): string | undefined =>
  (m.release_date || m.first_air_date)?.split('-')[0] || undefined;
