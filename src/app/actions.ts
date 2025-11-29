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

function extractVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// ==========================================
// 1. YOUTUBE İÇERİK BOTU
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
                const durationIso = item.contentDetails.duration;
                const minutes = parseDuration(durationIso);
                const cat = getCategory(minutes);
                
                let mood = 'relax';
                const t = item.snippet.title.toLowerCase();
                if(t.includes('komik') || t.includes('güldür') || t.includes('stand')) mood = 'funny';
                else if(t.includes('belgesel') || t.includes('bilim') || t.includes('tarih')) mood = 'learn';
                else if(t.includes('film') || t.includes('dizi')) mood = 'drama';

                await supabase.from('videos').insert({
                  title: item.snippet.title,
                  url: videoUrl,
                  duration_category: cat,
                  mood: mood,
                  is_approved: false // Onay beklesin
                });
                totalAdded++;
             }
          }
        }
      }
    } catch (e) { console.error(e); }
  }
  return { success: true, message: `Bot tamamlandı. ${totalAdded} video onaya gönderildi.` };
}

// ============================================================
// 2. GELİŞMİŞ ÖLÜ LINK TEMİZLEYİCİ (TERMINATOR MODE) 🤖💥
// ============================================================
export async function checkAndCleanDeadLinks() {
  if (!YOUTUBE_API_KEY) return { success: false, message: 'API Key eksik.' };

  // 1. Tüm videoları çek
  const { data: allVideos } = await supabase.from('videos').select('id, url');
  if (!allVideos || allVideos.length === 0) return { success: false, message: 'Veritabanı boş.' };

  let deletedCount = 0;
  const validVideosMap = new Map<string, number>(); // ID -> DB ID Eşleşmesi
  const videoIdsToCheck: string[] = [];

  // 2. URL'lerden YouTube ID'lerini ayıkla
  for (const v of allVideos) {
    const yId = extractVideoId(v.url);
    if (yId) {
      validVideosMap.set(yId, v.id);
      videoIdsToCheck.push(yId);
    } else {
      // Eğer YouTube ID'si bile ayrıştırılamıyorsa (bozuk link) direkt sil
      await supabase.from('videos').delete().eq('id', v.id);
      deletedCount++;
    }
  }

  // 3. 50'şerli gruplar halinde YouTube API'ye sor (Batch Check)
  const chunkSize = 50;
  for (let i = 0; i < videoIdsToCheck.length; i += chunkSize) {
    const chunk = videoIdsToCheck.slice(i, i + chunkSize);
    const idsString = chunk.join(',');

    try {
      // Sadece 'id' ve 'status' bilgisini istiyoruz (Hız için)
      const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=id,status&id=${idsString}&key=${YOUTUBE_API_KEY}`;
      const res = await fetch(apiUrl);
      const data = await res.json();

      // YouTube'dan dönen geçerli ID'lerin listesi
      const returnedIds = new Set(data.items?.map((item: any) => item.id) || []);

      // 4. KONTROL ZAMANI
      for (const sentId of chunk) {
        const dbId = validVideosMap.get(sentId);
        if (!dbId) continue;

        let shouldDelete = false;

        // Kural A: YouTube bu ID'yi hiç döndürmedi mi? (Video silinmiş)
        if (!returnedIds.has(sentId)) {
          shouldDelete = true;
        } else {
          // Kural B: Video var ama erişilebilir mi?
          const videoItem = data.items.find((it: any) => it.id === sentId);
          if (videoItem) {
            const isEmbeddable = videoItem.status.embeddable;
            const privacyStatus = videoItem.status.privacyStatus; // 'public', 'unlisted', 'private'
            
            // Eğer embed kapalıysa veya video gizliyse SİL
            if (isEmbeddable === false || privacyStatus === 'private') {
              shouldDelete = true;
            }
          }
        }

        if (shouldDelete) {
          await supabase.from('videos').delete().eq('id', dbId);
          deletedCount++;
        }
      }

    } catch (error) {
      console.error("Link Kontrol Hatası:", error);
    }
  }

  return { success: true, message: `Tarama bitti. ${deletedCount} adet geçersiz video silindi.` };
}

// ==========================================
// 3. AI ASİSTANI
// ==========================================
export async function askGemini(prompt: string) {
  if (!GEMINI_API_KEY) return { success: false, recommendations: null, params: null };

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const systemInstruction = `
      You are a movie expert assistant. Analyze: "${prompt}"
      SCENARIO 1: Specific list -> { "recommendations": [{ "title": "Movie", "type": "movie" }, ...] }
      SCENARIO 2: Genre/Mood -> { "params": { "genre_ids": "...", "sort_by": "...", "year_range": "...", "type": "..." } }
      Return ONLY valid JSON.
    `;

    const result = await model.generateContent(systemInstruction);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(text);

    return { success: true, recommendations: data.recommendations || null, params: data.params || null };
  } catch (error) { return { success: false, recommendations: null, params: null }; }
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

  if (totalWatched >= 1 && !ownedIds.includes('starter')) { await supabase.from('user_badges').insert({ user_id: userId, badge_id: 'starter' }); newBadges.push('Çırak 🐣'); }
  if (totalWatched >= 10 && !ownedIds.includes('movie_buff')) { await supabase.from('user_badges').insert({ user_id: userId, badge_id: 'movie_buff' }); newBadges.push('Sinefil 🎬'); }
  const h = new Date().getHours(); if ((h >= 0 && h < 5) && !ownedIds.includes('night_owl')) { await supabase.from('user_badges').insert({ user_id: userId, badge_id: 'night_owl' }); newBadges.push('Gece Kuşu 🦉'); }

  return { newBadges };
}

// ==========================================
// 5. YOUTUBE KANAL BULUCU
// ==========================================
export async function resolveYouTubeChannel(input: string) {
  if (!YOUTUBE_API_KEY) return { success: false, message: 'API Key eksik.' };
  if (input.startsWith('UC') && input.length === 24) return { success: true, id: input };

  let handle = '';
  const handleMatch = input.match(/@([^\/\?]+)/);
  if (handleMatch && handleMatch[1]) handle = handleMatch[1]; else handle = input; 

  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(handle)}&key=${YOUTUBE_API_KEY}`);
    const data = await res.json();
    if (data.items && data.items.length > 0) return { success: true, id: data.items[0].id };

    const sUrl = `https://www.googleapis.com/youtube/v3/search?part=id&q=${encodeURIComponent(handle)}&type=channel&maxResults=1&key=${YOUTUBE_API_KEY}`;
    const sRes = await fetch(sUrl);
    const sData = await sRes.json();
    if (sData.items && sData.items.length > 0) return { success: true, id: sData.items[0].id.channelId };
  } catch (e) { console.error(e); }
  return { success: false, message: 'Kanal bulunamadı.' };
}

// ==========================================
// 6. GÜVENLİ KANAL ÇEKİCİ
// ==========================================
export async function fetchFromSafeChannels() {
  if (!YOUTUBE_API_KEY) return { success: false, message: 'API Key eksik.' };
  const { data: channels } = await supabase.from('safe_channels').select('channel_id');
  if (!channels || channels.length === 0) return { success: false, message: 'Liste boş.' };

  let total = 0;
  for (const channel of channels) {
    try {
      const cRes = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channel.channel_id}&key=${YOUTUBE_API_KEY}`);
      const cData = await cRes.json();
      const plId = cData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

      if (plId) {
        const vRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${plId}&maxResults=5&key=${YOUTUBE_API_KEY}`);
        const vData = await vRes.json();
        if (vData.items) {
           const ids = vData.items.map((i: any) => i.snippet.resourceId.videoId).join(',');
           const dRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${ids}&key=${YOUTUBE_API_KEY}`);
           const dData = await dRes.json();
           if(dData.items) {
             for(const item of dData.items) {
               const url = `https://www.youtube.com/watch?v=${item.id}`;
               const { data: ex } = await supabase.from('videos').select('id').eq('url', url).single();
               if(!ex) {
                 await supabase.from('videos').insert({
                   title: item.snippet.title, url: url, duration_category: getCategory(parseDuration(item.contentDetails.duration)), mood: 'relax', is_approved: false
                 });
                 total++;
               }
             }
           }
        }
      }
    } catch (e) { console.error(e); }
  }
  return { success: true, message: `${total} video onaya gönderildi.` };
}

// Diğerleri
export async function fetchAndSaveChannelVideos(channelId: string) { return { success: true, message: 'Manuel eklendi.' }; } // Placeholder
export async function addSafeChannel(id: string, t: string) { await supabase.from('safe_channels').insert({ channel_id: id, channel_name: t }); return { success: true }; }
export async function removeSafeChannel(id: number) { await supabase.from('safe_channels').delete().eq('id', id); return { success: true }; }
export async function bulkUpdateVideos(ids: number[], u: any) { await supabase.from('videos').update(u).in('id', ids); return { success: true }; }
export async function checkVideoHealth() { return await checkAndCleanDeadLinks(); }
export async function fetchYouTubeTrends() { return await autoPopulateYouTube(); }