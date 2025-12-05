'use server'

import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MOOD_TO_YOUTUBE_KEYWORDS } from '@/lib/tmdb' // Kelime havuzunu al

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

// --- HELPER ---
function parseDuration(duration: string) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  return (parseInt(match?.[1] || '0') * 60) + (parseInt(match?.[2] || '0'));
}
function getCategory(minutes: number) { return minutes < 8 ? 'snack' : minutes < 30 ? 'meal' : 'feast'; }

// --- 1. AKILLI YOUTUBE BOTU ---
export async function autoPopulateYouTube() {
  if (!YOUTUBE_API_KEY) return { success: false, message: 'API Key eksik.' };

  let totalAdded = 0;

  // Her kategori (mood) için döngü
  for (const [mood, keywords] of Object.entries(MOOD_TO_YOUTUBE_KEYWORDS)) {
    // Her kategoriden rastgele 3 anahtar kelime seçip aratalım (Hepsini ararsak kota biter)
    const shuffledKeywords = keywords.sort(() => 0.5 - Math.random()).slice(0, 3);

    for (const query of shuffledKeywords) {
      try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=id,snippet&q=${encodeURIComponent(query)}&type=video&order=relevance&maxResults=5&videoEmbeddable=true&key=${YOUTUBE_API_KEY}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.items) {
          const videoIds = data.items.map((i: any) => i.id.videoId).join(',');
          const detailsRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${YOUTUBE_API_KEY}`);
          const detailsData = await detailsRes.json();

          if (detailsData.items) {
            for (const item of detailsData.items) {
              const videoUrl = `https://www.youtube.com/watch?v=${item.id}`;
              const { data: existing } = await supabase.from('videos').select('id').eq('url', videoUrl).single();

              if (!existing) {
                const min = parseDuration(item.contentDetails.duration);
                await supabase.from('videos').insert({
                  title: item.snippet.title,
                  url: videoUrl,
                  duration_category: getCategory(min),
                  mood: mood, // Doğru kategoriye otomatik atar
                  is_approved: true // Bot eklediği için onaylı olsun
                });
                totalAdded++;
              }
            }
          }
        }
      } catch (e) { console.error(`Hata (${query}):`, e); }
    }
  }
  return { success: true, message: `Bot taramayı bitirdi. ${totalAdded} yeni video eklendi!` };
}

// --- DİĞER FONKSİYONLAR (KORUNDU) ---
export async function checkAndCleanDeadLinks() {
  const { data: videos } = await supabase.from('videos').select('id, url');
  if (!videos) return { success: false, message: 'Video yok.' };
  let deletedCount = 0; const chunkSize = 50;
  for (let i = 0; i < videos.length; i += chunkSize) {
    const chunk = videos.slice(i, i + chunkSize);
    const idsToCheck = chunk.map(v => v.url.match(/v=([^&]+)/)?.[1]).filter(Boolean).join(',');
    try {
      const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=id,status&id=${idsToCheck}&key=${YOUTUBE_API_KEY}`);
      const data = await res.json();
      const validIds = new Set(data.items?.map((v: any) => v.id));
      for (const v of chunk) {
        const vid = v.url.match(/v=([^&]+)/)?.[1];
        if (vid && !validIds.has(vid)) { await supabase.from('videos').delete().eq('id', v.id); deletedCount++; }
      }
    } catch (e) { }
  }
  return { success: true, message: `${deletedCount} ölü video temizlendi.` };
}

export async function askGemini(prompt: string) {
  if (!GEMINI_API_KEY) return { success: false, recommendations: null, params: null };
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const systemInstruction = `You are a movie and TV show expert. Analyze the user prompt: "${prompt}".
    
    SCENARIO 1: If the user asks for specific recommendations or describes a very specific plot, return a list of movies/shows.
    Format: { "recommendations": [{ "title": "Title", "type": "movie" | "tv" }, ...] }
    
    SCENARIO 2: If the user describes a mood, genre, or general preference, return TMDB discovery parameters.
    Format: { "params": { "genre_ids": "comma_separated_ids", "sort_by": "popularity.desc" | "vote_average.desc" | "primary_release_date.desc", "year_range": "YYYY-YYYY" | "2023-2025", "type": "movie" | "tv" } }
    
    Movie Genres: 28 (Action), 12 (Adventure), 16 (Animation), 35 (Comedy), 80 (Crime), 99 (Documentary), 18 (Drama), 10751 (Family), 14 (Fantasy), 36 (History), 27 (Horror), 10402 (Music), 9648 (Mystery), 10749 (Romance), 878 (Science Fiction), 10770 (TV Movie), 53 (Thriller), 10752 (War), 37 (Western).
    TV Genres: 10759 (Action & Adventure), 16 (Animation), 35 (Comedy), 80 (Crime), 99 (Documentary), 18 (Drama), 10751 (Family), 10762 (Kids), 9648 (Mystery), 10763 (News), 10764 (Reality), 10765 (Sci-Fi & Fantasy), 10766 (Soap), 10767 (Talk), 10768 (War & Politics), 37 (Western).
    
    Return ONLY valid JSON obeying this schema.`;

    const result = await model.generateContent(systemInstruction);
    const text = result.response.text();
    const data = JSON.parse(text);
    return { success: true, recommendations: data.recommendations || null, params: data.params || null };
  } catch (error) {
    console.error("Gemini Error:", error);
    return { success: false, recommendations: null, params: null };
  }
}

export async function checkBadges(userId: string) {
  const { count } = await supabase.from('user_history').select('*', { count: 'exact', head: true }).eq('user_id', userId);
  const totalWatched = count || 0;
  const { data: myBadges } = await supabase.from('user_badges').select('badge_id').eq('user_id', userId);
  const ownedIds = myBadges?.map(b => b.badge_id) || [];
  const newBadges = [];
  if (totalWatched >= 1 && !ownedIds.includes('starter')) { await supabase.from('user_badges').insert({ user_id: userId, badge_id: 'starter' }); newBadges.push('Çırak 🐣'); }
  return { newBadges };
}

export async function resolveYouTubeChannel(input: string) {
  if (!YOUTUBE_API_KEY) return { success: false, message: 'API Key eksik.' };
  if (input.startsWith('UC') && input.length === 24) return { success: true, id: input };
  let handle = input.match(/@([^\/\?]+)/)?.[1] || input;
  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(handle)}&key=${YOUTUBE_API_KEY}`);
    const data = await res.json();
    if (data.items?.[0]) return { success: true, id: data.items[0].id };
    const sRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=id&q=${encodeURIComponent(handle)}&type=channel&key=${YOUTUBE_API_KEY}`);
    const sData = await sRes.json();
    if (sData.items?.[0]) return { success: true, id: sData.items[0].id.channelId };
  } catch (e) { }
  return { success: false, message: 'Kanal bulunamadı.' };
}

export async function fetchAndSaveChannelVideos(id: string) { return { success: true, message: '-' } }
export async function addSafeChannel(id: string, t: string) { await supabase.from('safe_channels').insert({ channel_id: id, channel_name: t }); return { success: true }; }
export async function removeSafeChannel(id: number) { await supabase.from('safe_channels').delete().eq('id', id); return { success: true }; }
export async function fetchFromSafeChannels() { return { success: true, message: "Bot çalıştı." }; } // Bot artık autoPopulateYouTube içinde
export async function bulkUpdateVideos(ids: number[], u: any) { await supabase.from('videos').update(u).in('id', ids); return { success: true }; }
export async function checkVideoHealth() { return await checkAndCleanDeadLinks(); }
export async function fetchYouTubeTrends() { return await autoPopulateYouTube(); }
// Raporlama
export async function reportVideo(id: number, r: string) { await supabase.from('videos').update({ is_approved: false }).eq('id', id); return { success: true } }