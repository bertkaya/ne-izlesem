const BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
// YouTube işlemleri için hem public hem server key kontrolü yapıyoruz
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY;

// --- TÜRKİYE PLATFORM KODLARI (TMDb ID'leri) ---
export const PROVIDERS = [
  { id: 8, name: 'Netflix', color: 'border-red-600 text-red-500' },
  { id: 119, name: 'Prime Video', color: 'border-blue-500 text-blue-500' },
  { id: 337, name: 'Disney+', color: 'border-blue-400 text-blue-400' },
  { id: 342, name: 'BluTV (HBO)', color: 'border-teal-500 text-teal-500' },
  { id: 188, name: 'YouTube Premium', color: 'border-red-500 text-red-500' },
  { id: 365, name: 'TV+', color: 'border-yellow-500 text-yellow-500' },
  { id: 345, name: 'TOD (beIN)', color: 'border-purple-500 text-purple-500' },
  { id: 0, name: 'Exxen', color: 'border-yellow-400 text-yellow-400' },
  { id: 0, name: 'Tabii', color: 'border-green-500 text-green-500' },
  { id: 0, name: 'Gain', color: 'border-pink-500 text-pink-500' }
];

// --- FİLM TÜR KODLARI ---
export const MOOD_TO_MOVIE_GENRE = {
  funny: '35',         // Komedi
  scary: '27,53',      // Korku, Gerilim
  emotional: '18,10749', // Dram, Romantik
  action: '28,12',     // Aksiyon, Macera
  scifi: '878,14',     // Bilim Kurgu, Fantastik
  crime: '80',         // Suç
  relax: '99'          // Belgesel
};

// --- DİZİ TÜR KODLARI ---
export const MOOD_TO_TV_GENRE = {
  funny: '35',         // Komedi
  scary: '9648,10765', // Gizem, Sci-Fi
  emotional: '18',     // Dram
  action: '10759',     // Aksiyon & Macera
  scifi: '10765',      // Bilim Kurgu & Fantastik
  crime: '80',         // Suç
  relax: '99,10764'    // Belgesel
};

// --- YARDIMCI: FETCH FONKSİYONU ---
async function fetchTMDB(endpoint: string, params: Record<string, string> = {}) {
  if (!API_KEY) { 
    console.error("TMDB API KEY EKSİK! .env.local dosyasını kontrol et."); 
    return {}; 
  }

  const query = new URLSearchParams({ api_key: API_KEY, language: 'tr-TR', ...params }).toString();
  try {
    const res = await fetch(`${BASE_URL}${endpoint}?${query}`);
    return await res.json();
  } catch (e) {
    console.error("TMDB Fetch Error:", e);
    return {};
  }
}

// --- YARDIMCI: DETAYLARI ÇEK (IMDb ID ve Linkler İçin) ---
async function getDetails(id: number, type: 'movie' | 'tv') {
  return await fetchTMDB(`/${type}/${id}`, { append_to_response: 'external_ids,credits,watch/providers' });
}

// ============================================================
// 1. AKILLI ÖNERİ MOTORU (FİLM)
// ============================================================
export async function getSmartRecommendation(
  genreIds: string, 
  providers: string, 
  type: 'movie' | 'tv', 
  watchedIds: number[] = [], 
  blacklistedIds: number[] = [],
  onlyTurkish: boolean = false // YENİ: Sadece Türk Yapımı Filtresi
) {
  const randomPage = Math.floor(Math.random() * 5) + 1;
  // ID'si 0 olanları (Exxen vb.) TMDb filtresine sokma, hata verir.
  const validProviders = providers.split('|').filter(id => id !== '0').join('|');

  const params: any = {
    with_genres: genreIds,
    with_watch_providers: validProviders,
    watch_region: 'TR',
    sort_by: 'popularity.desc',
    page: randomPage.toString(),
    'vote_count.gte': '20'
  };

  // Eğer Türkçe isteniyorsa filtreye ekle
  if (onlyTurkish) {
    params.with_original_language = 'tr';
  }

  const data = await fetchTMDB(`/discover/${type}`, params);

  if (!data.results || data.results.length === 0) return null;

  // Kullanıcının izlediklerini ve yasaklıları listeden çıkar
  const filtered = data.results.filter((item: any) => !watchedIds.includes(item.id) && !blacklistedIds.includes(item.id));

  if (filtered.length === 0) return null;

  const randomItem = filtered[Math.floor(Math.random() * filtered.length)];
  
  // Detayları (IMDb ID vb.) çek
  const details = await getDetails(randomItem.id, type);
  return { ...randomItem, ...details };
}

// ============================================================
// 2. DİZİ ARAMA (İsim ile)
// ============================================================
export async function searchTvShow(query: string) {
  const data = await fetchTMDB('/search/tv', { query: query });
  if (!data.results || data.results.length === 0) return null;
  return data.results[0]; // En iyi eşleşen sonucu döndür
}

// ============================================================
// 3. RASTGELE BÖLÜM BULUCU (DİZİ)
// ============================================================
export async function getRandomEpisode(tvId: number | null = null, genreId: string | null = null, providers: string = '') {
  let selectedShowId = tvId;
  let showNameOverride = '';

  // EĞER ID YOKSA -> TÜR'E GÖRE KEŞİF YAP VE DİZİ SEÇ
  if (!selectedShowId) {
    const randomPage = Math.floor(Math.random() * 5) + 1;
    const validProviders = providers.split('|').filter(id => id !== '0').join('|');

    const discoverData = await fetchTMDB('/discover/tv', {
      with_genres: genreId || '35', 
      with_watch_providers: validProviders,
      watch_region: 'TR',
      sort_by: 'popularity.desc',
      page: randomPage.toString()
    });
    
    if (!discoverData.results || discoverData.results.length === 0) return null;
    
    // Listeden rastgele bir dizi seç
    const randomShow = discoverData.results[Math.floor(Math.random() * discoverData.results.length)];
    selectedShowId = randomShow.id;
    showNameOverride = randomShow.name;
  }

  // DİZİNİN DETAYLARINI AL (Sezon Sayısı)
  const showDetails = await fetchTMDB(`/tv/${selectedShowId}`, { append_to_response: 'external_ids' });
  if (!showDetails.seasons) return null;

  // 0. Sezonu ve yayınlanmamış sezonları ele
  const seasons = showDetails.seasons.filter((s: any) => s.season_number > 0 && s.episode_count > 0);
  if (seasons.length === 0) return null;

  // Rastgele Sezon Seç
  const randomSeason = seasons[Math.floor(Math.random() * seasons.length)];
  
  // SEZONUN DETAYLARINI AL (Bölüm Sayısı)
  const seasonDetails = await fetchTMDB(`/tv/${selectedShowId}/season/${randomSeason.season_number}`);
  if (!seasonDetails.episodes || seasonDetails.episodes.length === 0) return null;

  // Rastgele Bölüm Seç
  const randomEpisode = seasonDetails.episodes[Math.floor(Math.random() * seasonDetails.episodes.length)];

  // Veriyi düzenle ve döndür
  return {
    id: selectedShowId,
    showName: showDetails.name || showNameOverride,
    season: randomSeason.season_number,
    episode: randomEpisode.episode_number,
    title: randomEpisode.name,
    overview: randomEpisode.overview,
    still_path: randomEpisode.still_path || showDetails.backdrop_path,
    vote_average: randomEpisode.vote_average,
    imdb_id: showDetails.external_ids?.imdb_id,
    external_ids: showDetails.external_ids
  };
}

// ============================================================
// 4. YOUTUBE KANALINDAN VIDEO ÇEKME (YENİ)
// ============================================================
export async function getVideoFromChannel(channelId: string) {
  if (!YOUTUBE_API_KEY) return null;

  try {
    // 1. Kanalın "Uploads" playlist ID'sini bul
    // YouTube'da her kanalın yüklemeleri gizli bir playlistte tutulur.
    const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`);
    const channelData = await channelRes.json();
    
    const uploadPlaylistId = channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadPlaylistId) return null;

    // 2. O playlistten son 50 videoyu çek
    const vidRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadPlaylistId}&maxResults=50&key=${YOUTUBE_API_KEY}`);
    const vidData = await vidRes.json();

    if (!vidData.items || vidData.items.length === 0) return null;

    // 3. Rastgele birini seç
    const randomVideo = vidData.items[Math.floor(Math.random() * vidData.items.length)];
    
    // Bizim uygulamanın formatına çevir
    return {
      id: 0, // DB'de yok, anlık çekildi
      title: randomVideo.snippet.title,
      url: `https://www.youtube.com/watch?v=${randomVideo.snippet.resourceId.videoId}`,
      duration_category: 'meal', 
      mood: 'relax',
      channelTitle: randomVideo.snippet.channelTitle,
      thumbnail: randomVideo.snippet.thumbnails?.high?.url
    };
  } catch (e) {
    console.error("YouTube Channel Fetch Error", e);
    return null;
  }
}