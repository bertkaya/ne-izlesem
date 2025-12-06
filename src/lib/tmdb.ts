const BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;

// --- PLATFORMLAR (RENK KODLARIYLA) ---
export const PROVIDERS = [
  { id: 8, name: 'Netflix', color: 'border-red-600 text-red-500 bg-red-500/10' },
  { id: 119, name: 'Prime Video', color: 'border-blue-500 text-blue-500 bg-blue-500/10' },
  { id: 337, name: 'Disney+', color: 'border-blue-400 text-blue-400 bg-blue-400/10' },
  { id: 342, name: 'HBO Max (BluTV)', color: 'border-teal-500 text-teal-500 bg-teal-500/10' },
  { id: 365, name: 'TV+', color: 'border-yellow-500 text-yellow-500 bg-yellow-500/10' },
  { id: 345, name: 'TOD', color: 'border-purple-500 text-purple-500 bg-purple-500/10' }
];

export const MOOD_TO_MOVIE_GENRE = {
  funny: '35', scary: '27,53', emotional: '18,10749', action: '28,12', scifi: '878,14', crime: '80', relax: '99',
  fantasy: '14,12', history: '36', war: '10752', western: '37', music: '10402', mystery: '9648',
  anime: '16', family: '10751', doc: '99'
};

export const MOOD_TO_TV_GENRE = {
  funny: '35', scary: '9648,10765', emotional: '18', action: '10759', scifi: '10765', crime: '80', relax: '99,10764',
  fantasy: '10765', war: '10768', soap: '10766', kids: '10762', reality: '10764',
  anime: '16', family: '10751', doc: '99'
};

export const MOOD_TO_YOUTUBE_KEYWORDS = {
  funny: ['Güldür Güldür', 'Konuşanlar', 'Stand up', 'Komik Anlar', 'Cem Yılmaz'],
  eat: ['Sokak Lezzetleri', 'Yemek Yeme', 'Mukbang', 'Gurme', 'Kebap', 'Burger'],
  classic: ['Vine Compilation', 'Efsane Replikler', 'Beyaz Show Komik', 'Unutulmaz Anlar'],
  pets: ['Komik Kediler', 'Yavru Köpek', 'Sevimli Hayvanlar', 'Kedi Videoları'],
  relax: ['Doğa Yürüyüşü', 'Rahatlatıcı Müzik', 'Manzara 4K', 'Restorasyon'],
  learn: ['Barış Özcan', 'Ruhi Çenet', 'Belgesel', 'Nasıl Yapılır', 'TEDx'],
  drama: ['Kısa Film', 'Dramatik Sahne', 'Hayat Hikayesi']
};

async function fetchTMDB(endpoint: string, params: Record<string, string> = {}) {
  if (!API_KEY) return {};
  const query = new URLSearchParams({ api_key: API_KEY, language: 'tr-TR', ...params }).toString();
  try { return await (await fetch(`${BASE_URL}${endpoint}?${query}`)).json(); } catch (e) { return {}; }
}

async function getDetails(id: number, type: 'movie' | 'tv') {
  return await fetchTMDB(`/${type}/${id}`, { append_to_response: 'external_ids,credits,watch/providers,videos' });
}

// --- 1. AKILLI ÖNERİ ---
export async function getSmartRecommendation(
  genreIds: string | string[], providers: string, type: 'movie' | 'tv',
  watchedIds: number[] = [], blacklistedIds: number[] = [],
  onlyTurkish: boolean = false, yearRange: string = '', sortBy: string = 'popularity.desc'
) {
  const validProviders = providers.split('|').filter(id => id !== '0').join('|');
  const genresStr = Array.isArray(genreIds) ? genreIds.join(',') : genreIds;
  let fromFallback = false;

  const params: any = {
    with_genres: genresStr, with_watch_providers: validProviders, watch_region: 'TR',
    with_watch_monetization_types: 'flatrate', sort_by: sortBy, 'vote_count.gte': '20'
  };

  if (onlyTurkish) params.with_original_language = 'tr';
  if (yearRange) {
    if (yearRange === '2023-2025') params['primary_release_date.gte'] = '2023-01-01';
    else if (yearRange.includes('-')) { const [s, e] = yearRange.split('-'); params['primary_release_date.gte'] = `${s}-01-01`; params['primary_release_date.lte'] = `${e}-12-31`; }
  }

  // 1. Önce toplam sayfa sayısını öğrenmek için 1. sayfayı çek
  // Bu işlem (Discovery) 2 API çağrısı gerektirir ama boş sonuç dönme riskini (sayfa 50 yoksa) sıfırlar.
  params.page = '1';
  let initialData = await fetchTMDB(`/discover/${type}`, params);

  // Eğer providerlı sonuç yoksa ve fallback gerekirse:
  if (!initialData.results || initialData.results.length === 0) {
    if (validProviders) {
      delete params.with_watch_providers;
      initialData = await fetchTMDB(`/discover/${type}`, params);
      fromFallback = true;
    }
  }

  // 2. Rastgele Sayfa seç (Maksimum 50 sayfa - TMDB limiti 500 ama performans için 20-30 ideal)
  const totalPages = Math.min(initialData.total_pages || 1, 20); // 20 sayfadan fazlasına gitme, çok eski/alakasız olabilir
  const randomPage = Math.floor(Math.random() * totalPages) + 1;

  params.page = randomPage.toString();
  let data = randomPage === 1 ? initialData : await fetchTMDB(`/discover/${type}`, params);


  if (!data.results || data.results.length === 0) {
    if (validProviders) {
      delete params.with_watch_providers;
      data = await fetchTMDB(`/discover/${type}`, params);
      fromFallback = true;
    }
  }

  if (!data.results || data.results.length === 0) return null;
  const filtered = data.results.filter((item: any) => !watchedIds.includes(item.id) && !blacklistedIds.includes(item.id));
  if (filtered.length === 0) return null;

  const randomItem = filtered[Math.floor(Math.random() * filtered.length)];
  const details = await getDetails(randomItem.id, type);

  if (!fromFallback && validProviders) {
    const trProviders = details['watch/providers']?.results?.TR;
    if (!trProviders || !trProviders.flatrate) fromFallback = true;
  }

  return { ...randomItem, ...details, fromFallback };
}

// --- 2. DİZİ ARAMA ---
export async function searchTvShow(query: string) {
  const data = await fetchTMDB('/search/tv', { query: query });
  if (!data.results || data.results.length === 0) return null;
  return await getDetails(data.results[0].id, 'tv');
}

export async function searchTvShowsList(query: string) {
  const data = await fetchTMDB('/search/tv', { query: query });
  return data.results ? data.results.slice(0, 5) : [];
}

export async function getTrendingTvShows() {
  // IMDB Popular charts logic implementation via TMDB
  // User requested to pull from IMDB (which shows most popular/trending).
  // TMDB's discover API with watch_region=TR ensures we only get things popular/available here.
  // We filter by Vote Count to avoid junk.
  const data = await fetchTMDB('/discover/tv', {
    sort_by: 'popularity.desc',
    watch_region: 'TR',
    'vote_count.gte': '100',
    page: (Math.floor(Math.random() * 3) + 1).toString() // Random page 1-3
  });
  return data.results ? data.results.slice(0, 12) : []; // Increased to 12 for better fill
}

// --- 3. RASTGELE BÖLÜM ---
export async function getRandomEpisode(tvId: number | null = null, genreId: string | null = null, providers: string = '') {
  let selectedShowId = tvId;
  let showNameOverride = '';

  if (!selectedShowId) {
    const randomPage = Math.floor(Math.random() * 5) + 1;
    const validProviders = providers.split('|').filter(id => id !== '0').join('|');
    let discoverData = await fetchTMDB('/discover/tv', { with_genres: genreId || '35', with_watch_providers: validProviders, watch_region: 'TR', sort_by: 'popularity.desc', page: randomPage.toString() });
    if (!discoverData.results || discoverData.results.length === 0) discoverData = await fetchTMDB('/discover/tv', { with_genres: genreId || '35', watch_region: 'TR', sort_by: 'popularity.desc', page: randomPage.toString() });

    if (!discoverData.results || discoverData.results.length === 0) return null;
    const randomShow = discoverData.results[Math.floor(Math.random() * discoverData.results.length)];
    selectedShowId = randomShow.id; showNameOverride = randomShow.name;
  }

  const showDetails = await fetchTMDB(`/tv/${selectedShowId}`, { append_to_response: 'external_ids,videos,watch/providers' });
  if (!showDetails.seasons) return null;
  const seasons = showDetails.seasons.filter((s: any) => s.season_number > 0 && s.episode_count > 0);
  if (seasons.length === 0) return null;
  const randomSeason = seasons[Math.floor(Math.random() * seasons.length)];
  const seasonDetails = await fetchTMDB(`/tv/${selectedShowId}/season/${randomSeason.season_number}`);
  if (!seasonDetails.episodes || seasonDetails.episodes.length === 0) return null;
  const randomEpisode = seasonDetails.episodes[Math.floor(Math.random() * seasonDetails.episodes.length)];

  return {
    id: selectedShowId, showName: showDetails.name || showNameOverride, season: randomSeason.season_number, episode: randomEpisode.episode_number,
    title: randomEpisode.name, overview: randomEpisode.overview, still_path: randomEpisode.still_path || showDetails.backdrop_path,
    vote_average: randomEpisode.vote_average, imdb_id: showDetails.external_ids?.imdb_id, external_ids: showDetails.external_ids, videos: showDetails.videos,
    'watch/providers': showDetails['watch/providers']
  };
}

// ... (existing code)

export async function getVideoFromChannel(channelId: string) {
  if (!YOUTUBE_API_KEY) return null;
  try {
    const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`);
    const channelData = await channelRes.json();
    const uploadPlaylistId = channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadPlaylistId) return null;
    const vidRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadPlaylistId}&maxResults=50&key=${YOUTUBE_API_KEY}`);
    const vidData = await vidRes.json();
    if (!vidData.items || vidData.items.length === 0) return null;
    const randomVideo = vidData.items[Math.floor(Math.random() * vidData.items.length)];
    return {
      id: 0,
      title: randomVideo.snippet.title,
      url: `https://www.youtube.com/embed/${randomVideo.snippet.resourceId.videoId}?autoplay=1`, // Embed URL format
      videoId: randomVideo.snippet.resourceId.videoId,
      description: randomVideo.snippet.description, // Added description
      duration_category: 'meal',
      mood: 'relax',
      channelTitle: randomVideo.snippet.channelTitle,
      thumbnail: randomVideo.snippet.thumbnails?.high?.url
    };
  } catch (e) { return null; }
}

// --- 5. SWIPE MODU (GÜNCELLENDİ: TÜR ve TİP DESTEĞİ) ---
export async function getDiscoverBatch(page: number = 1, preferredGenres: string = '', type: 'movie' | 'tv' = 'movie') {
  const params: any = {
    sort_by: 'popularity.desc',
    'vote_count.gte': '50',
    page: page.toString(),
    with_original_language: 'en|tr' // Prefer English and Turkish content
  };

  if (preferredGenres && Math.random() > 0.3) params.with_genres = preferredGenres;

  // Ensure we don't just loop small numbers if page is high
  // Add some randomness but respect the page increment from the caller

  const data = await fetchTMDB(`/discover/${type}`, params);

  if (!data.results) return [];

  return data.results.map((item: any) => ({
    ...item,
    title: item.title || item.name,
    original_title: item.original_title || item.original_name
  }));
}

export async function getMoviesByTitles(list: { title: string, type: 'movie' | 'tv', year?: string, reason?: string }[]) {
  const results = [];
  for (const item of list) {
    try {
      const params: any = { query: item.title };
      if (item.year) {
        if (item.type === 'movie') params.year = item.year;
        else params.first_air_date_year = item.year;
      }

      const searchRes = await fetchTMDB(`/search/${item.type}`, params);

      if (searchRes.results && searchRes.results.length > 0) {
        // Find best match (prefer exact title match if possible)
        const bestMatch = searchRes.results[0]; // Default to first
        // Optional: Loop through to find exact title match if strictness needed

        const details = await getDetails(bestMatch.id, item.type);
        results.push({ ...bestMatch, ...details, reason: item.reason });
      }
    } catch (e) {
      console.error(`Error fetching matching title for ${item.title}:`, e);
    }
  }
  return results;
}