const BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

export const PROVIDERS = [
  { id: 8, name: 'Netflix', color: 'border-red-600 text-red-500' },
  { id: 119, name: 'Prime Video', color: 'border-blue-500 text-blue-500' },
  { id: 337, name: 'Disney+', color: 'border-blue-400 text-blue-400' },
  { id: 342, name: 'BluTV', color: 'border-teal-500 text-teal-500' },
  { id: 188, name: 'YouTube Premium', color: 'border-red-500 text-red-500' },
  { id: 365, name: 'TV+', color: 'border-yellow-500 text-yellow-500' },
  { id: 345, name: 'TOD (beIN)', color: 'border-purple-500 text-purple-500' },
  { id: 0, name: 'Gain', color: 'border-pink-500 text-pink-500' },
  { id: 0, name: 'Exxen', color: 'border-yellow-400 text-yellow-400' },
  { id: 0, name: 'Tabii', color: 'border-green-500 text-green-500' }
];

export const MOOD_TO_MOVIE_GENRE = {
  funny: '35', scary: '27,53', emotional: '18,10749', action: '28,12', scifi: '878,14', crime: '80', relax: '99'
};
export const MOOD_TO_TV_GENRE = {
  funny: '35', scary: '9648,10765', emotional: '18', action: '10759', scifi: '10765', crime: '80', relax: '99,10764'
};

async function fetchTMDB(endpoint: string, params: Record<string, string> = {}) {
  if (!API_KEY) return {};
  const query = new URLSearchParams({ api_key: API_KEY, language: 'tr-TR', ...params }).toString();
  try {
    const res = await fetch(`${BASE_URL}${endpoint}?${query}`);
    return await res.json();
  } catch (e) { return {}; }
}

// --- FİLM DETAYLARI (IMDb ID ve Rotten Tomatoes Simülasyonu için) ---
async function getDetails(id: number, type: 'movie' | 'tv') {
  // append_to_response=external_ids sayesinde IMDb ID'sini alıyoruz
  const data = await fetchTMDB(`/${type}/${id}`, { append_to_response: 'external_ids,credits' });
  return data;
}

// --- AKILLI ÖNERİ (FİLM) ---
export async function getSmartRecommendation(genreIds: string, providers: string, type: 'movie' | 'tv', watchedIds: number[] = [], blacklistedIds: number[] = []) {
  const randomPage = Math.floor(Math.random() * 5) + 1;
  const validProviders = providers.split('|').filter(id => id !== '0').join('|');

  const data = await fetchTMDB(`/discover/${type}`, {
    with_genres: genreIds, with_watch_providers: validProviders, watch_region: 'TR',
    sort_by: 'popularity.desc', page: randomPage.toString(), 'vote_count.gte': '50'
  });

  if (!data.results || data.results.length === 0) return null;

  // FİLTRELEME: İzlenenleri ve Yasaklıları listeden çıkar
  const filtered = data.results.filter((item: any) => !watchedIds.includes(item.id) && !blacklistedIds.includes(item.id));

  if (filtered.length === 0) return null; // Hepsi izlenmişse null dön (Frontend tekrar denesin)

  const randomItem = filtered[Math.floor(Math.random() * filtered.length)];
  
  // Detayları çek (IMDb için)
  const details = await getDetails(randomItem.id, type);
  return { ...randomItem, ...details }; // İki veriyi birleştir
}

// --- DİZİ ARAMA ---
export async function searchTvShow(query: string) {
  const data = await fetchTMDB('/search/tv', { query: query });
  return (data.results && data.results.length > 0) ? data.results[0] : null;
}

// --- RANDOM BÖLÜM ---
export async function getRandomEpisode(tvId: number | null = null, genreId: string | null = null, providers: string = '') {
  let selectedShowId = tvId;
  let showNameOverride = '';

  if (!selectedShowId) {
    const randomPage = Math.floor(Math.random() * 5) + 1;
    const validProviders = providers.split('|').filter(id => id !== '0').join('|');
    const discoverData = await fetchTMDB('/discover/tv', {
      with_genres: genreId || '35', with_watch_providers: validProviders, watch_region: 'TR',
      sort_by: 'popularity.desc', page: randomPage.toString()
    });
    if (!discoverData.results || discoverData.results.length === 0) return null;
    const randomShow = discoverData.results[Math.floor(Math.random() * discoverData.results.length)];
    selectedShowId = randomShow.id;
    showNameOverride = randomShow.name;
  }

  const showDetails = await fetchTMDB(`/tv/${selectedShowId}`, { append_to_response: 'external_ids' });
  if (!showDetails.seasons) return null;
  const seasons = showDetails.seasons.filter((s: any) => s.season_number > 0 && s.episode_count > 0);
  if (seasons.length === 0) return null;

  const randomSeason = seasons[Math.floor(Math.random() * seasons.length)];
  const seasonDetails = await fetchTMDB(`/tv/${selectedShowId}/season/${randomSeason.season_number}`);
  if (!seasonDetails.episodes || seasonDetails.episodes.length === 0) return null;

  const randomEpisode = seasonDetails.episodes[Math.floor(Math.random() * seasonDetails.episodes.length)];

  return {
    id: selectedShowId,
    showName: showDetails.name || showNameOverride,
    season: randomSeason.season_number,
    episode: randomEpisode.episode_number,
    title: randomEpisode.name,
    overview: randomEpisode.overview,
    still_path: randomEpisode.still_path || showDetails.backdrop_path,
    vote_average: randomEpisode.vote_average,
    imdb_id: showDetails.external_ids?.imdb_id, // Dizinin IMDb ID'si
    external_ids: showDetails.external_ids
  };
}
// ... (Üst kısımlar, PROVIDERS ve MOOD listeleri AYNI KALSIN) ...

const BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

// --- EKLENEN KISIM: PROVIDERS ve MOOD Listelerini buraya tekrar yazmıyorum, silme sakın! ---
// ... (PROVIDERS, MOOD_TO_MOVIE_GENRE, MOOD_TO_TV_GENRE kodları burada olmalı) ...
// Eğer elinde yoksa önceki cevabımdan alabilirsin.

async function fetchTMDB(endpoint: string, params: Record<string, string> = {}) {
  if (!API_KEY) return {};
  const query = new URLSearchParams({ api_key: API_KEY, language: 'tr-TR', ...params }).toString();
  try { return await (await fetch(`${BASE_URL}${endpoint}?${query}`)).json(); } catch (e) { return {}; }
}

async function getDetails(id: number, type: 'movie' | 'tv') {
  return await fetchTMDB(`/${type}/${id}`, { append_to_response: 'external_ids,credits,watch/providers' });
}

// --- GÜNCELLENMİŞ ÖNERİ FONKSİYONU ---
export async function getSmartRecommendation(
  genreIds: string, 
  providers: string, 
  type: 'movie' | 'tv', 
  watchedIds: number[] = [], 
  blacklistedIds: number[] = [],
  onlyTurkish: boolean = false // YENİ PARAMETRE
) {
  const randomPage = Math.floor(Math.random() * 5) + 1;
  const validProviders = providers.split('|').filter(id => id !== '0').join('|');

  const params: any = {
    with_genres: genreIds,
    with_watch_providers: validProviders,
    watch_region: 'TR',
    sort_by: 'popularity.desc',
    page: randomPage.toString(),
    'vote_count.gte': '20'
  };

  // SADECE TÜRK YAPIMI FİLTRESİ
  if (onlyTurkish) {
    params.with_original_language = 'tr';
  }

  const data = await fetchTMDB(`/discover/${type}`, params);

  if (!data.results || data.results.length === 0) return null;

  const filtered = data.results.filter((item: any) => !watchedIds.includes(item.id) && !blacklistedIds.includes(item.id));
  if (filtered.length === 0) return null;

  const randomItem = filtered[Math.floor(Math.random() * filtered.length)];
  const details = await getDetails(randomItem.id, type);
  
  return { ...randomItem, ...details };
}

// ... (searchTvShow ve getRandomEpisode AYNI KALSIN) ...
// Not: getRandomEpisode içinde de Türkçe mantığı eklenebilir ama sitcomlarda TR az olduğu için şimdilik filmde bıraktık.