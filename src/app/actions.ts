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
// 1. GÜVENLİ KANALLARDAN VİDEO ÇEK
// ==========================================
export async function fetchFromSafeChannels() {
  if (!YOUTUBE_API_KEY) return { success: false, message: 'API Key eksik.' };

  const { data: channels, error } = await supabase.from('safe_channels').select('channel_id, channel_name');
  
  if (error || !channels || channels.length === 0) {
    return { success: false, message: 'Güvenli kanal listeniz boş.' };
  }

  let totalAdded = 0;

  for (const channel of channels) {
    try {
      const channelRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channel.channel_id}&key=${YOUTUBE_API_KEY}`);
      const channelData = await channelRes.json();
      const uploadPlaylistId = channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

      if (uploadPlaylistId) {
        const vidRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadPlaylistId}&maxResults=5&key=${YOUTUBE_API_KEY}`);
        const vidData = await vidRes.json();

        if (vidData.items) {
           const videoIds = vidData.items.map((i: any) => i.snippet.resourceId.videoId).join(',');
           const detailsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${YOUTUBE_API_KEY}`);
           const detailsData = await detailsRes.json();

           if (detailsData.items) {
             for (const item of detailsData.items) {
               const videoUrl = `https://www.youtube.com/watch?v=${item.id}`;
               const { data: existing } = await supabase.from('videos').select('id').eq('url', videoUrl).single();
               
               if (!existing) {
                 const min = parseDuration(item.contentDetails.duration);
                 
                 let mood = 'relax';
                 const t = item.snippet.title.toLowerCase();
                 if(t.includes('komik') || t.includes('güldür')) mood = 'funny';
                 else if(t.includes('belgesel') || t.includes('bilim') || t.includes('tarih')) mood = 'learn';
                 else if(t.includes('film') || t.includes('dizi')) mood = 'drama';

                 await supabase.from('videos').insert({
                    title: item.snippet.title,
                    url: videoUrl,
                    duration_category: getCategory(min),
                    mood: mood,
                    is_approved: false // DEĞİŞİKLİK: Artık onaya düşüyor
                 });
                 totalAdded++;
               }
             }
           }
        }
      }
    } catch (e) { console.error(e); }
  }

  return { success: true, message: `Tarama bitti. ${totalAdded} video onaya gönderildi.` };
}

// ==========================================
// 2. YOUTUBE İÇERİK BOTU (TRENDLER/ANAHTAR KELİMELER)
// ==========================================
export async function autoPopulateYouTube() {
  if (!YOUTUBE_API_KEY) return { success: false, message: 'API Key eksik.' };

  const searchQueries = [
    "Barış Özcan", "Ruhi Çenet", "Güldür Güldür", "Gibi dizisi", "Konuşanlar", 
    "TED Talks Türkçe", "Socrates Dergi", "Arzu Film", "Mark Rober", "Veritasium", 
    "Kurzgesagt", "Mesut Süre İlişki Testi", "Refika'nın Mutfağı", "BBC Earth", 
    "National Geographic TR", "Çok Güzel Hareketler 2", "Kısmetse Olur Komik", 
    "Efe Aydal", "Diamond Tema Tarih", "Tolga Çevik", "Hasan Can Kaya", "Oğuzhan Uğur", "Babala TV"
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
                const min = parseDuration(item.contentDetails.duration);
                let mood = 'relax';
                const t = item.snippet.title.toLowerCase();
                if(t.includes('komik') || t.includes('güldür')) mood = 'funny';
                else if(t.includes('belgesel') || t.includes('bilim') || t.includes('tarih')) mood = 'learn';
                else if(t.includes('film') || t.includes('dizi')) mood = 'drama';

                await supabase.from('videos').insert({
                  title: item.snippet.title,
                  url: videoUrl,
                  duration_category: getCategory(min),
                  mood: mood,
                  is_approved: false // DEĞİŞİKLİK: Onay bekliyor
                });
                totalAdded++;
             }
          }
        }
      }
    } catch (e) { console.error(e); }
  }
  return { success: true, message: `Bot tamamlandı. ${totalAdded} video onaya gönderildi!` };
}

// ==========================================
// 3. YOUTUBE KANAL BULUCU (GÜÇLENDİRİLMİŞ)
// ==========================================
export async function resolveYouTubeChannel(input: string) {
  if (!YOUTUBE_API_KEY) return { success: false, message: 'API Key eksik.' };

  if (input.startsWith('UC') && input.length === 24) return { success: true, id: input };

  let handle = '';
  const handleMatch = input.match(/@([^\/\?]+)/);
  if (handleMatch && handleMatch[1]) handle = handleMatch[1];
  else handle = input; 

  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=id,snippet&forHandle=${encodeURIComponent(handle)}&key=${YOUTUBE_API_KEY}`);
    const data = await res.json();
    if (data.items && data.items.length > 0) return { success: true, id: data.items[0].id, title: data.items[0].snippet.title };

    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=id,snippet&q=${encodeURIComponent(handle)}&type=channel&maxResults=1&key=${YOUTUBE_API_KEY}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    if (searchData.items && searchData.items.length > 0) return { success: true, id: searchData.items[0].id.channelId, title: searchData.items[0].snippet.title };

  } catch (e) { console.error(e); }
  return { success: false, message: 'Kanal bulunamadı.' };
}

// ==========================================
// 4. DİĞER İŞLEMLER
// ==========================================
export async function fetchAndSaveChannelVideos(channelId: string) {
  // Manuel ekleme fonksiyonu - Bu da artık onaya düşmeli
  if (!YOUTUBE_API_KEY) return { success: false, message: 'API Key eksik.' }
  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${channelId}&part=snippet,id&order=date&maxResults=10&type=video`
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
             title: item.snippet.title, url: videoUrl, duration_category: getCategory(min), mood: 'relax', 
             is_approved: false // DEĞİŞİKLİK: Onaya düşüyor
         })
         count++
      }
    }
    return { success: true, message: `${count} video onaya gönderildi.` }
  } catch (error) { return { success: false, message: 'Hata.' } }
}

// GÜVENLİ KANAL YÖNETİMİ
export async function addSafeChannel(channelId: string, title: string) {
  const { data: existing } = await supabase.from('safe_channels').select('id').eq('channel_id', channelId).single();
  if (existing) return { success: false, message: 'Bu kanal zaten listede.' };
  const { error } = await supabase.from('safe_channels').insert({ channel_id: channelId, channel_name: title });
  return { success: !error };
}
export async function removeSafeChannel(id: number) { await supabase.from('safe_channels').delete().eq('id', id); return { success: true }; }

// VİDEO YÖNETİMİ
export async function bulkUpdateVideos(ids: number[], updateData: any) { const { error } = await supabase.from('videos').update(updateData).in('id', ids); return { success: !error }; }
export async function checkVideoHealth() { return await checkAndCleanDeadLinks(); } // Aşağıdaki fonksiyona yönlendirme
export async function checkAndCleanDeadLinks() {
  const { data: videos } = await supabase.from('videos').select('id, url');
  if (!videos) return { success: false, message: 'Video yok.' };
  let deletedCount = 0; const chunkSize = 5;
  for (let i = 0; i < videos.length; i += chunkSize) {
      const chunk = videos.slice(i, i + chunkSize);
      await Promise.all(chunk.map(async (video) => {
          const videoId = video.url.match(/v=([^&]+)/)?.[1];
          if(videoId) { try { const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`); if (res.status === 404 || res.status === 401) { await supabase.from('videos').delete().eq('id', video.id); deletedCount++; } } catch (e) { console.error(e) } }
      }));
  }
  return { success: true, message: `${deletedCount} ölü video temizlendi.` };
}

// AI & ROZET
export async function askGemini(prompt: string) {
  if (!GEMINI_API_KEY) return { success: false, recommendations: null, params: null };
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const systemInstruction = `You are a movie expert assistant. Analyze: "${prompt}". SCENARIO 1: Specific list -> { "recommendations": [{ "title": "Movie", "type": "movie" }, ...] } SCENARIO 2: Genre/Mood -> { "params": { "genre_ids": "...", "sort_by": "...", "year_range": "...", "type": "..." } } Return ONLY valid JSON.`;
    const result = await model.generateContent(systemInstruction);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(text);
    return { success: true, recommendations: data.recommendations || null, params: data.params || null };
  } catch (error) { return { success: false, recommendations: null, params: null }; }
}

export async function checkBadges(userId: string) {
  const { count } = await supabase.from('user_history').select('*', { count: 'exact', head: true }).eq('user_id', userId);
  const totalWatched = count || 0;
  const { data: myBadges } = await supabase.from('user_badges').select('badge_id').eq('user_id', userId);
  const ownedIds = myBadges?.map(b => b.badge_id) || [];
  const newBadges = [];
  if (totalWatched >= 1 && !ownedIds.includes('starter')) { await supabase.from('user_badges').insert({ user_id: userId, badge_id: 'starter' }); newBadges.push('Çırak 🐣'); }
  if (totalWatched >= 10 && !ownedIds.includes('movie_buff')) { await supabase.from('user_badges').insert({ user_id: userId, badge_id: 'movie_buff' }); newBadges.push('Sinefil 🎬'); }
  const h = new Date().getHours(); if ((h >= 0 && h < 5) && !ownedIds.includes('night_owl')) { await supabase.from('user_badges').insert({ user_id: userId, badge_id: 'night_owl' }); newBadges.push('Gece Kuşu 🦉'); }
  return { newBadges };
}

export async function fetchYouTubeTrends() { return await autoPopulateYouTube(); }