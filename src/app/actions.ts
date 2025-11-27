'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// --- YARDIMCI: Süre Ayrıştırıcı ---
function parseDuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  const hours = (parseInt(match?.[1] || '0')) || 0
  const minutes = (parseInt(match?.[2] || '0')) || 0
  const seconds = (parseInt(match?.[3] || '0')) || 0
  return (hours * 60) + minutes + (seconds / 60)
}

// --- YARDIMCI: Kategori Belirleyici ---
function getCategory(minutes: number) {
  if (minutes < 8) return 'snack'       
  if (minutes >= 8 && minutes < 30) return 'meal' 
  return 'feast'                        
}

// --- 1. YOUTUBE LINK KONTROLÜ (Ölü Linkleri Bul ve Sil) ---
export async function checkAndCleanDeadLinks() {
  const { data: videos } = await supabase.from('videos').select('id, url')
  if (!videos) return { success: false, message: 'Video bulunamadı.' }

  let deletedCount = 0;

  for (const video of videos) {
    const videoId = video.url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)?.[2];
    
    if (videoId) {
      // YouTube oEmbed endpoint'ine istek atarak videonun varlığını kontrol et
      try {
        const checkUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const res = await fetch(checkUrl);
        
        if (res.status === 404 || res.status === 401) {
          await supabase.from('videos').delete().eq('id', video.id);
          deletedCount++;
        }
      } catch (e) {
        console.error("Link kontrol hatası:", e)
      }
    }
  }

  return { success: true, message: `${deletedCount} adet ölü video temizlendi.` }
}

// --- 2. YOUTUBE TRENDLERİ (HYPE) ÇEK ---
export async function fetchYouTubeTrends() {
  if (!YOUTUBE_API_KEY) return { success: false, message: 'API Key eksik (YOUTUBE_API_KEY)' };

  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&chart=mostPopular&regionCode=TR&maxResults=10&key=${YOUTUBE_API_KEY}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (!data.items) return { success: false, message: 'YouTube verisi alınamadı.' };

    let addedCount = 0;

    for (const item of data.items) {
      const videoUrl = `https://www.youtube.com/watch?v=${item.id}`;
      
      const { data: existing } = await supabase.from('videos').select('id').eq('url', videoUrl).single();
      
      if (!existing) {
        const durationIso = item.contentDetails.duration;
        const minutes = parseDuration(durationIso);
        const cat = getCategory(minutes);

        await supabase.from('videos').insert({
          title: item.snippet.title,
          url: videoUrl,
          duration_category: cat,
          mood: 'relax', 
          is_approved: true
        });
        addedCount++;
      }
    }
    return { success: true, message: `${addedCount} adet trend video eklendi.` };

  } catch (error) {
    console.error(error);
    return { success: false, message: 'YouTube bağlantı hatası.' };
  }
}

// --- 3. KANAL VİDEOLARINI ÇEK (EKSİK OLAN BU OLABİLİR) ---
export async function fetchAndSaveChannelVideos(channelId: string) {
  const apiKey = process.env.YOUTUBE_API_KEY
  if (!apiKey) return { success: false, message: 'API Key eksik!' }

  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=20&type=video`
    const searchRes = await fetch(searchUrl)
    const searchData = await searchRes.json()

    if (searchData.error || !searchData.items) {
      return { success: false, message: 'Kanal bulunamadı veya kota doldu.' }
    }

    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',')
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${videoIds}&part=contentDetails,snippet`
    const videosRes = await fetch(videosUrl)
    const videosData = await videosRes.json()

    let addedCount = 0;

    for (const item of videosData.items) {
      const title = item.snippet.title
      const videoId = item.id
      const url = `https://www.youtube.com/watch?v=${videoId}`
      const durationIso = item.contentDetails.duration
      
      const durationInMinutes = parseDuration(durationIso)
      const category = getCategory(durationInMinutes)
      
      let mood = 'relax' 
      const lowerTitle = title.toLowerCase()
      if (lowerTitle.includes('komik') || lowerTitle.includes('güldür')) mood = 'funny'
      if (lowerTitle.includes('belgesel') || lowerTitle.includes('nasıl') || lowerTitle.includes('tarih')) mood = 'learn'
      if (lowerTitle.includes('film') || lowerTitle.includes('dizi')) mood = 'drama'

      const { error } = await supabase.from('videos').insert({
          title: title,
          url: url,
          duration_category: category,
          mood: mood,
          is_approved: true
        })
        
      if (!error) addedCount++
    }

    return { success: true, message: `${addedCount} video eklendi!` }

  } catch (error) {
    console.error(error)
    return { success: false, message: 'Bir şeyler ters gitti.' }
  }
}
// --- YENİ: YOUTUBE LINKINDEN ID BULUCU ---
export async function resolveYouTubeChannel(input: string) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return { success: false, message: 'API Key eksik.' };

  let channelId = '';

  // DURUM 1: Kullanıcı direkt ID yapıştırmışsa (UC...)
  if (input.startsWith('UC') && input.length === 24) {
    return { success: true, id: input, title: 'Kanal ID' };
  }

  // DURUM 2: Kanal Linki (@kullaniciadi)
  // Örn: https://www.youtube.com/@BarisOzcan -> handle: BarisOzcan
  const handleMatch = input.match(/@([\w\-.]+)/);
  
  if (handleMatch && handleMatch[1]) {
    const handle = handleMatch[1];
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=id,snippet&forHandle=${handle}&key=${apiKey}`);
      const data = await res.json();
      
      if (data.items && data.items.length > 0) {
        return { 
          success: true, 
          id: data.items[0].id, 
          title: data.items[0].snippet.title 
        };
      }
    } catch (e) {
      console.error(e);
    }
  }

  // DURUM 3: Eski tip link (/user/username)
  // Bu çok nadir kaldı ama basit bir arama ile çözebiliriz
  // Şimdilik sadece Handle desteği yeterli ve en garantisidir.

  return { success: false, message: 'Kanal bulunamadı. Lütfen @kullaniciadi içeren linki girin.' };
}
// ... (Mevcut kodların altına)

// --- ROZET KONTROL SİSTEMİ ---
export async function checkBadges(userId: string) {
  // 1. Kullanıcının geçmişini say
  const { count } = await supabase.from('user_history').select('*', { count: 'exact', head: true }).eq('user_id', userId);
  const totalWatched = count || 0;

  // 2. Mevcut rozetlerini çek
  const { data: myBadges } = await supabase.from('user_badges').select('badge_id').eq('user_id', userId);
  const ownedBadgeIds = myBadges?.map(b => b.badge_id) || [];

  const newBadges = [];

  // --- KURAL 1: ÇIRAK (1 İzleme) ---
  if (totalWatched >= 1 && !ownedBadgeIds.includes('starter')) {
    await supabase.from('user_badges').insert({ user_id: userId, badge_id: 'starter' });
    newBadges.push('Çırak 🐣');
  }

  // --- KURAL 2: SİNEFİL (10 İzleme) ---
  if (totalWatched >= 10 && !ownedBadgeIds.includes('movie_buff')) {
    await supabase.from('user_badges').insert({ user_id: userId, badge_id: 'movie_buff' });
    newBadges.push('Sinefil 🎬');
  }

  // --- KURAL 3: GECE KUŞU (Saat 00-05 arası) ---
  const currentHour = new Date().getHours();
  if ((currentHour >= 0 && currentHour < 5) && !ownedBadgeIds.includes('night_owl')) {
    await supabase.from('user_badges').insert({ user_id: userId, badge_id: 'night_owl' });
    newBadges.push('Gece Kuşu 🦉');
  }

  return { newBadges };
}
// ... (Mevcut importların altına)
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- YENİ: GERÇEK AI ASİSTANI (GEMINI) ---
export async function askGemini(prompt: string) {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) return { success: false, params: null };

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // AI'ya rol veriyoruz: "Kullanıcı girdisini TMDb filtrelerine çevir"
    const systemInstruction = `
      You are a movie recommendation assistant. Convert the user's mood/request into TMDb API discovery parameters.
      User Input: "${prompt}"
      
      Return ONLY a JSON object with these keys (do not wrap in markdown):
      - genre_ids: string (comma separated IDs from TMDb: 28=Action, 12=Adventure, 16=Animation, 35=Comedy, 80=Crime, 99=Documentary, 18=Drama, 10751=Family, 14=Fantasy, 36=History, 27=Horror, 10402=Music, 9648=Mystery, 10749=Romance, 878=Sci-Fi, 10770=TV Movie, 53=Thriller, 10752=War, 37=Western)
      - sort_by: string (usually 'popularity.desc' or 'vote_average.desc')
      - year_range: string (optional, format 'YYYY-YYYY' or 'YYYY')
      - keywords: string (optional, english keywords for specific topics like 'space', 'dog', 'zombie')
      - type: 'movie' or 'tv' (infer from context, default 'movie')
    `;

    const result = await model.generateContent(systemInstruction);
    const response = result.response;
    const text = response.text();
    
    // JSON Temizliği (Bazen markdown ```json ... ``` içinde gelir)
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const params = JSON.parse(jsonStr);

    return { success: true, params };
  } catch (error) {
    console.error("AI Error:", error);
    return { success: false, params: null };
  }
}