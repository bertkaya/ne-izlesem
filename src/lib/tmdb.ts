'use server'

// İstemcinin çağırdığı TMDB / YouTube okuma işlemleri. 'use server' sayesinde
// API anahtarları tarayıcıya hiç gitmez; her çağrı sunucuda çalışır.
// Sabitler (PROVIDERS, MOOD_TO_*) için: '@/lib/constants'

import type { MediaItem, MediaType, YoutubeVideo } from '@/types/media'
import { fetchTMDB, getDetails } from '@/lib/tmdb-api'
import { rateLimitByIp } from '@/lib/rate-limit'
import { getRegion } from '@/lib/regions'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

const MINUTE = 60_000
const REGION = getRegion().tmdbRegion
const tmdbAllowed = () => rateLimitByIp('tmdb', 120, MINUTE)

// --- 1. AKILLI ÖNERİ ---
export async function getSmartRecommendation(
  genreIds: string | string[], providers: string, type: MediaType,
  watchedIds: number[] = [], blacklistedIds: number[] = [],
  onlyTurkish: boolean = false, yearRange: string = '', sortBy: string = 'popularity.desc'
): Promise<MediaItem | null> {
  if (!(await tmdbAllowed())) return null
  const validProviders = providers.split('|').filter(id => id !== '0').join('|');
  const genresStr = Array.isArray(genreIds) ? genreIds.join(',') : genreIds;
  let fromFallback = false;

  const params: Record<string, string> = {
    with_genres: genresStr, with_watch_providers: validProviders, watch_region: REGION,
    with_watch_monetization_types: 'flatrate', sort_by: sortBy, 'vote_count.gte': '20'
  };

  if (onlyTurkish) params.with_original_language = 'tr';
  if (yearRange && yearRange.includes('-')) {
    const [s, e] = yearRange.split('-');
    params['primary_release_date.gte'] = `${s}-01-01`;
    params['primary_release_date.lte'] = `${e}-12-31`;
  }

  // 1. Önce toplam sayfa sayısını öğrenmek için 1. sayfayı çek
  params.page = '1';
  let initialData = await fetchTMDB(`/discover/${type}`, params);

  // Eğer providerlı sonuç yoksa ve fallback gerekirse:
  if (!initialData.results?.length && validProviders) {
    delete params.with_watch_providers;
    initialData = await fetchTMDB(`/discover/${type}`, params);
    fromFallback = true;
  }

  // 2. Rastgele sayfa seç (20 sayfadan fazlası çok eski/alakasız olabilir)
  const totalPages = Math.min(initialData.total_pages || 1, 20);
  const randomPage = Math.floor(Math.random() * totalPages) + 1;

  params.page = randomPage.toString();
  let data = randomPage === 1 ? initialData : await fetchTMDB(`/discover/${type}`, params);

  if (!data.results?.length && validProviders) {
    delete params.with_watch_providers;
    data = await fetchTMDB(`/discover/${type}`, params);
    fromFallback = true;
  }

  if (!data.results?.length) return null;
  const filtered = (data.results as MediaItem[]).filter(item => !watchedIds.includes(item.id) && !blacklistedIds.includes(item.id));
  if (filtered.length === 0) return null;

  const randomItem = filtered[Math.floor(Math.random() * filtered.length)];
  const details = await getDetails(randomItem.id, type);

  if (!fromFallback && validProviders) {
    const trProviders = details['watch/providers']?.results?.[REGION];
    if (!trProviders || !trProviders.flatrate) fromFallback = true;
  }

  return { ...randomItem, ...details, media_type: type, fromFallback };
}

/** Liste sonuçlarında olmayan fragman / platform bilgilerini gerektiğinde tamamlar. */
export async function getTitleDetails(id: number, type: MediaType, locale: 'tr' | 'en' = 'tr'): Promise<MediaItem | null> {
  if (!Number.isInteger(id) || !(await tmdbAllowed())) return null
  const details = await getDetails(id, type, locale === 'en' ? 'en-US' : 'tr-TR')
  if (!details.id) return null
  // Yerel dilde fragman yoksa İngilizce fragmanları da dene
  if (!details.videos?.results?.length && locale !== 'en') {
    const en = await fetchTMDB(`/${type}/${id}/videos`, { language: 'en-US' })
    if (en.results) details.videos = { results: en.results }
  }
  return { ...details, media_type: type } as MediaItem
}

/** "Benzerini Öner": TMDB önerilerinden izlenmemiş/yasaklı olmayan rastgele bir yapım. */
export async function getSimilarTitle(id: number, type: MediaType, excludeIds: number[] = [], locale: 'tr' | 'en' = 'tr'): Promise<MediaItem | null> {
  if (!Number.isInteger(id) || !(await tmdbAllowed())) return null
  const language = locale === 'en' ? 'en-US' : 'tr-TR'
  const exclude = new Set([id, ...excludeIds.filter(Number.isInteger).slice(0, 5000)])
  let data = await fetchTMDB(`/${type}/${id}/recommendations`, { language })
  if (!data.results?.length) data = await fetchTMDB(`/${type}/${id}/similar`, { language })
  const candidates = ((data.results || []) as MediaItem[]).filter(m => !exclude.has(m.id) && m.poster_path)
  if (!candidates.length) return null
  const pick = candidates[Math.floor(Math.random() * Math.min(candidates.length, 10))]
  const details = await getDetails(pick.id, type, language)
  return { ...pick, ...details, media_type: type }
}

// --- 2. DİZİ ARAMA ---
export async function searchTvShow(query: string): Promise<MediaItem | null> {
  if (!(await tmdbAllowed())) return null
  const data = await fetchTMDB('/search/tv', { query });
  if (!data.results?.length) return null;
  return { ...(await getDetails(data.results[0].id, 'tv')), media_type: 'tv' } as MediaItem;
}

export async function searchTvShowsList(query: string): Promise<MediaItem[]> {
  if (!(await tmdbAllowed())) return []
  const data = await fetchTMDB('/search/tv', { query });
  return data.results ? data.results.slice(0, 5) : [];
}

export async function getTrendingTvShows(): Promise<MediaItem[]> {
  if (!(await tmdbAllowed())) return []
  // TMDB discover + watch_region=TR: Türkiye'de popüler/erişilebilir diziler. Az oylu içerik elenir.
  const data = await fetchTMDB('/discover/tv', {
    sort_by: 'popularity.desc',
    watch_region: REGION,
    'vote_count.gte': '100',
    page: (Math.floor(Math.random() * 3) + 1).toString()
  });
  return data.results ? data.results.slice(0, 12) : [];
}

// --- 3. RASTGELE BÖLÜM ---
export async function getRandomEpisode(tvId: number | null = null, genreId: string | null = null, providers: string = ''): Promise<MediaItem | null> {
  if (!(await tmdbAllowed())) return null
  let selectedShowId = tvId;
  let showNameOverride = '';

  if (!selectedShowId) {
    const randomPage = Math.floor(Math.random() * 5) + 1;
    const validProviders = providers.split('|').filter(id => id !== '0').join('|');
    let discoverData = await fetchTMDB('/discover/tv', { with_genres: genreId || '35', with_watch_providers: validProviders, watch_region: REGION, sort_by: 'popularity.desc', page: randomPage.toString() });
    if (!discoverData.results?.length) discoverData = await fetchTMDB('/discover/tv', { with_genres: genreId || '35', watch_region: REGION, sort_by: 'popularity.desc', page: randomPage.toString() });

    if (!discoverData.results?.length) return null;
    const randomShow = discoverData.results[Math.floor(Math.random() * discoverData.results.length)];
    selectedShowId = randomShow.id; showNameOverride = randomShow.name;
  }

  const showDetails = await fetchTMDB(`/tv/${selectedShowId}`, { append_to_response: 'external_ids,videos,watch/providers' });
  if (!showDetails.seasons) return null;
  const seasons = showDetails.seasons.filter((s: { season_number: number, episode_count: number }) => s.season_number > 0 && s.episode_count > 0);
  if (seasons.length === 0) return null;
  const randomSeason = seasons[Math.floor(Math.random() * seasons.length)];
  const seasonDetails = await fetchTMDB(`/tv/${selectedShowId}/season/${randomSeason.season_number}`);
  if (!seasonDetails.episodes?.length) return null;
  const randomEpisode = seasonDetails.episodes[Math.floor(Math.random() * seasonDetails.episodes.length)];

  return {
    id: selectedShowId as number, media_type: 'tv', showName: showDetails.name || showNameOverride,
    season: randomSeason.season_number, episode: randomEpisode.episode_number,
    title: randomEpisode.name, overview: randomEpisode.overview, still_path: randomEpisode.still_path || showDetails.backdrop_path,
    poster_path: showDetails.poster_path, backdrop_path: showDetails.backdrop_path,
    vote_average: randomEpisode.vote_average, videos: showDetails.videos,
    'watch/providers': showDetails['watch/providers']
  };
}

// --- 4. KANALDAN VİDEO ---
export async function getVideoFromChannel(channelId: string): Promise<YoutubeVideo | null> {
  if (!YOUTUBE_API_KEY) return null;
  if (!/^UC[\w-]{22}$/.test(channelId)) return null;
  if (!(await rateLimitByIp('youtube', 20, MINUTE))) return null;
  try {
    const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`);
    const channelData = await channelRes.json();
    const uploadPlaylistId = channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadPlaylistId) return null;
    const vidRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadPlaylistId}&maxResults=50&key=${YOUTUBE_API_KEY}`);
    const vidData = await vidRes.json();
    if (!vidData.items?.length) return null;
    const randomVideo = vidData.items[Math.floor(Math.random() * vidData.items.length)];
    return {
      id: 0,
      title: randomVideo.snippet.title,
      url: `https://www.youtube.com/embed/${randomVideo.snippet.resourceId.videoId}?autoplay=1`,
      videoId: randomVideo.snippet.resourceId.videoId,
      description: randomVideo.snippet.description,
      duration_category: 'meal',
      mood: 'relax',
      channelTitle: randomVideo.snippet.channelTitle,
      channelId: randomVideo.snippet.channelId,
      thumbnail: randomVideo.snippet.thumbnails?.high?.url
    };
  } catch { return null; }
}

// --- 5. SWIPE MODU (TÜR ve TİP DESTEĞİ) ---
export async function getDiscoverBatch(page: number = 1, preferredGenres: string = '', type: MediaType = 'movie'): Promise<MediaItem[]> {
  if (!(await tmdbAllowed())) return []
  const params: Record<string, string> = {
    sort_by: 'popularity.desc',
    'vote_count.gte': '50',
    page: page.toString(),
    with_original_language: 'en|tr' // İngilizce ve Türkçe içerik öncelikli
  };

  if (preferredGenres && Math.random() > 0.3) params.with_genres = preferredGenres;

  const data = await fetchTMDB(`/discover/${type}`, params);
  if (!data.results) return [];

  return (data.results as MediaItem[]).map(item => ({
    ...item,
    media_type: type,
    title: item.title || item.name,
    original_title: item.original_title || (item as { original_name?: string }).original_name
  }));
}
