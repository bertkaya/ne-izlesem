const BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;

export const PROVIDERS = [
  { id: 8, name: 'Netflix', color: 'border-red-600 text-red-500' },
  { id: 119, name: 'Prime Video', color: 'border-blue-500 text-blue-500' },
  { id: 337, name: 'Disney+', color: 'border-blue-400 text-blue-400' },
  { id: 342, name: 'BluTV (HBO)', color: 'border-teal-500 text-teal-500' },
  { id: 188, name: 'YouTube Premium', color: 'border-red-500 text-red-500' },
  { id: 365, name: 'TV+', color: 'border-yellow-500 text-yellow-500' },
  { id: 345, name: 'TOD', color: 'border-purple-500 text-purple-500' }
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
  try { return await (await fetch(`${BASE_URL}${endpoint}?${query}`)).json(); } catch (e) { return {}; }
}

async function getDetails(id: number, type: 'movie' | 'tv') {
  return await fetchTMDB(`/${type}/${id}`, { append_to_response: 'external_ids,credits,watch/providers,videos' });
}

// --- 1. AKILLI ÖNERİ (FİLTRELİ) ---
export async function getSmartRecommendation(
  genreIds: string, providers: string, type: 'movie' | 'tv', 
  watchedIds: number[] = [], blacklistedIds: number[] = [], 
  onlyTurkish: boolean = false, yearRange: string = '', sortBy: string = 'popularity.desc'
) {
  const randomPage = Math.floor(Math.random() * 5) + 1;
  const validProviders = providers.split('|').filter(id => id !== '0').join('|');

  const params: any = {
    with_genres: genreIds, with_watch_providers: validProviders, watch_region: 'TR',
    sort_by: sortBy, page: randomPage.toString(), 'vote_count.gte': '20'
  };

  if (onlyTurkish) params.with_original_language = 'tr';
  if (yearRange) {
    if(yearRange === '2023-2025') params['primary_release_date.gte'] = '2023-01-01';
    else if(yearRange.includes('-')) { const [s, e] = yearRange.split('-'); params['primary_release_date.gte'] = `${s}-01-01`; params['primary_release_date.lte'] = `${e}-12-31`; }
  }

  const data = await fetchTMDB(`/discover/${type}`, params);
  if (!data.results || data.results.length === 0) return null;

  const filtered = data.results.filter((item: any) => !watchedIds.includes(item.id) && !blacklistedIds.includes(item.id));
  if (filtered.length === 0) return null;

  const randomItem = filtered[Math.floor(Math.random() * filtered.length)];
  const details = await getDetails(randomItem.id, type);
  return { ...randomItem, ...details };
}

// --- 2. AI İÇİN İSİMDEN FİLM BULMA (YEŞİLÇAM VB.) ---
export async function getMoviesByTitles(list: { title: string, type: 'movie' | 'tv' }[]) {
  const results = [];
  for (const item of list) {
    try {
      const searchRes = await fetchTMDB(`/search/${item.type}`, { query: item.title });
      if (searchRes.results && searchRes.results.length > 0) {
        const bestMatch = searchRes.results[0];
        const details = await getDetails(bestMatch.id, item.type);
        results.push({ ...bestMatch, ...details });
      }
    } catch (e) { console.error(e); }
  }
  return results;
}

// --- 3. DİZİ ARAMA ---
export async function searchTvShow(query: string) {
  const data = await fetchTMDB('/search/tv', { query: query });
  if (!data.results || data.results.length === 0) return null;
  return await getDetails(data.results[0].id, 'tv');
}

// --- 4. RASTGELE BÖLÜM ---
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
    selectedShowId = randomShow.id; showNameOverride = randomShow.name;
  }

  const showDetails = await fetchTMDB(`/tv/${selectedShowId}`, { append_to_response: 'external_ids,videos' });
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
    vote_average: randomEpisode.vote_average, imdb_id: showDetails.external_ids?.imdb_id, external_ids: showDetails.external_ids, videos: showDetails.videos
  };
}

// --- 5. YOUTUBE KANAL VİDEOSU ---
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
      id: 0, title: randomVideo.snippet.title, url: `https://www.youtube.com/watch?v=${randomVideo.snippet.resourceId.videoId}`,
      duration_category: 'meal', mood: 'relax', channelTitle: randomVideo.snippet.channelTitle, thumbnail: randomVideo.snippet.thumbnails?.high?.url
    };
  } catch (e) { return null; }
}

// --- 6. SWIPE MODU (BATCH FETCH) ---
export async function getDiscoverBatch(page: number = 1) {
  const randomPage = Math.floor(Math.random() * 10) + page; 
  const data = await fetchTMDB('/discover/movie', {
    sort_by: 'popularity.desc', 'vote_count.gte': '100', page: randomPage.toString(), with_original_language: 'en|tr'
  });
  return data.results || [];
}