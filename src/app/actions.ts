'use server'

import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

// --- YARDIMCI FONKSİYONLAR ---
function parseDuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  const hours = (parseInt(match?.[1] || '0')) || 0
  const minutes = (parseInt(match?.[2] || '0')) || 0
  return (hours * 60) + minutes;
}

function getCategory(minutes: number) {
  if (minutes < 8) return 'snack';
  if (minutes >= 8 && minutes < 30) return 'meal';
  return 'feast';
}

// ==========================================
// 1. YOUTUBE İÇERİK BOTU (AUTO POPULATE)
// ==========================================
export async function autoPopulateYouTube() {
  if (!YOUTUBE_API_KEY) return { success: false, message: 'API Key eksik.' };

  const searchQueries = [
    "Barış Özcan", "Ruhi Çenet", "Cem Yılmaz Stand up", "Güldür Güldür", "Gibi dizisi", "Konuşanlar",
    "TED Talks Türkçe", "Socrates Dergi", "Arzu Film", "Mark Rober", "Veritasium", "Kurzgesagt",
    "Mesut Süre İlişki Testi", "Refika'nın Mutfağı", "BBC Earth", "National Geographic TR",
    "Çok Güzel Hareketler 2", "Kısmetse Olur Komik", "Efe Aydal", "Diamond Tema Tarih", 
    "Tolga Çevik", "Hasan Can Kaya", "Oğuzhan Uğur", "Babala TV"
  ];

  let totalAdded = 0;

  for (const query of searchQueries) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/search?part=id,snippet&q=${encodeURIComponent(query)}&type=video&order=viewCount&maxResults=5&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.items) {
        const videoIds = data.items.map((i: any) => i.id.videoId).join(',');
        
        const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${YOUTUBE_API_KEY}`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();

        if (detailsData.items) {
          for (const item of detailsData.items) {
             const videoUrl = `https://www.youtube.com/watch?v=${item.id}`;
             
             const { data: existing } = await supabase.from('videos').select('id').eq('url', videoUrl).single();
             
             if (!existing) {
                const durationIso = item.contentDetails.duration;
                const minutes = parseDuration(durationIso);
                const cat = getCategory(minutes);
                
                let mood = 'relax';
                const t = item.snippet.title.toLowerCase();
                if(t.includes('komik') || t.includes('güldür') || t.includes('stand')) mood = 'funny';
                else if(t.includes('belgesel') || t.includes('nasıl') || t.includes('bilim') || t.includes('tarih')) mood = 'learn';
                else if(t.includes('film') || t.includes('dizi') || t.includes('hikaye')) mood = 'drama';

                await supabase.from('videos').insert({
                  title: item.snippet.title,
                  url: videoUrl,
                  duration_category: cat,
                  mood: mood,
                  is_approved: true
                });
                totalAdded++;
             }
          }
        }
      }
    } catch (e) {
      console.error(`Bot Hatası (${query}):`, e);
    }
  }

  return { success: true, message: `Bot tamamlandı. ${totalAdded} yeni video eklendi!` };
}

// ==========================================
// 2. ÖLÜ LINK TEMİZLEYİCİ
// ==========================================
export async function checkAndCleanDeadLinks() {
  const { data: videos } = await supabase.from('videos').select('id, url');
  if (!videos) return { success: false, message: 'Video yok.' };

  let deletedCount = 0;
  
  const chunkSize = 5;
  for (let i = 0; i < videos.length; i += chunkSize) {
      const chunk = videos.slice(i, i + chunkSize);
      await Promise.all(chunk.map(async (video) => {
          const videoId = video.url.match(/v=([^&]+)/)?.[1];
          if(videoId) {
             try {
                const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
                if (res.status === 404 || res.status === 401) {
                   await supabase.from('videos').delete().eq('id', video.id);
                   deletedCount++;
                }
             } catch (e) { console.error(e) }
          }
      }));
  }
  return { success: true, message: `${deletedCount} ölü video temizlendi.` };
}

// ==========================================
// --- 3. AI ASİSTANI (GEMINI - İSİM BAZLI) ---
export async function askGemini(prompt: string) {
  if (!GEMINI_API_KEY) return { success: false, recommendations: [] };

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemInstruction = `
      You are a movie expert. The user will ask for a recommendation.
      You MUST return a JSON object containing an array of exactly 5 specific recommendations based on their request.
      
      User Request: "${prompt}"

      If the user asks for "Yeşilçam", suggest classic Turkish movies like Tosun Paşa, Süt Kardeşler, etc.
      If the user asks for specific actors/directors, suggest their best works.

      Return format (JSON only, no markdown):
      {
        "recommendations": [
          { "title": "Movie Name 1", "type": "movie" },
          { "title": "Series Name 1", "type": "tv" },
          ...
        ]
      }
    `;

    const result = await model.generateContent(systemInstruction);
    const response = await result.response;
    const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(text);

    return { success: true, recommendations: data.recommendations };
  } catch (error) {
    console.error("AI Error:", error);
    return { success: false, recommendations: [] };
  }
}

// ==========================================
// 4. ROZET SİSTEMİ
// ==========================================
export async function checkBadges(userId: string) {
  const { count } = await supabase.from('user_history').select('*', { count: 'exact', head: true }).eq('user_id', userId);
  const totalWatched = count || 0;

  const { data: myBadges } = await supabase.from('user_badges').select('badge_id').eq('user_id', userId);
  const ownedIds = myBadges?.map(b => b.badge_id) || [];
  const newBadges = [];

  if (totalWatched >= 1 && !ownedIds.includes('starter')) {
    await supabase.from('user_badges').insert({ user_id: userId, badge_id: 'starter' });
    newBadges.push('Çırak 🐣');
  }
  if (totalWatched >= 10 && !ownedIds.includes('movie_buff')) {
    await supabase.from('user_badges').insert({ user_id: userId, badge_id: 'movie_buff' });
    newBadges.push('Sinefil 🎬');
  }
  const currentHour = new Date().getHours();
  if ((currentHour >= 0 && currentHour < 5) && !ownedIds.includes('night_owl')) {
    await supabase.from('user_badges').insert({ user_id: userId, badge_id: 'night_owl' });
    newBadges.push('Gece Kuşu 🦉');
  }

  return { newBadges };
}

// ==========================================
// 5. YOUTUBE KANAL BULUCU (PROFİL İÇİN)
// ==========================================
export async function resolveYouTubeChannel(input: string) {
  if (!YOUTUBE_API_KEY) return { success: false, message: 'API Key eksik.' };

  if (input.startsWith('UC') && input.length === 24) return { success: true, id: input };

  const handleMatch = input.match(/@([\w\-.]+)/);
  if (handleMatch && handleMatch[1]) {
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${handleMatch[1]}&key=${YOUTUBE_API_KEY}`);
      const data = await res.json();
      if (data.items?.[0]) return { success: true, id: data.items[0].id };
    } catch (e) { console.error(e) }
  }

  return { success: false, message: 'Kanal bulunamadı.' };
}

// ==========================================
// 6. TEKİL KANAL VİDEOLARI (ADMİN İÇİN)
// ==========================================
export async function fetchAndSaveChannelVideos(channelId: string) {
  if (!YOUTUBE_API_KEY) return { success: false, message: 'API Key eksik.' }

  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${channelId}&part=snippet,id&order=date&maxResults=20&type=video`
    const searchRes = await fetch(searchUrl)
    const searchData = await searchRes.json()

    if (!searchData.items) return { success: false, message: 'Kanal bulunamadı.' }

    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',')
    const videosRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?key=${YOUTUBE_API_KEY}&id=${videoIds}&part=contentDetails,snippet`)
    const videosData = await videosRes.json()

    let count = 0;
    for (const item of videosData.items) {
      const videoUrl = `https://www.youtube.com/watch?v=${item.id}`;
      const { data } = await supabase.from('videos').select('id').eq('url', videoUrl).single()
      if(!data) {
         const min = parseDuration(item.contentDetails.duration);
         await supabase.from('videos').insert({
            title: item.snippet.title,
            url: videoUrl,
            duration_category: getCategory(min),
            mood: 'relax',
            is_approved: true
         })
         count++
      }
    }
    return { success: true, message: `${count} video eklendi.` }
  } catch (error) {
    return { success: false, message: 'Hata.' }
  }
}

// ==========================================
// 7. YOUTUBE TRENDLERİ ÇEKME (HATA VERMEMESİ İÇİN EKLENDİ)
// ==========================================
export async function fetchYouTubeTrends() {
  // Bu fonksiyon Admin sayfasında kullanıldığı için export edilmesi şart
  // Şimdilik autoPopulateYouTube ile benzer işi yapıyor ama tek bir butona bağlı olabilir.
  return await autoPopulateYouTube();
}