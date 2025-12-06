'use server'

import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from "@google/generative-ai";

import { MOOD_TO_YOUTUBE_KEYWORDS, getMoviesByTitles, MOOD_TO_MOVIE_GENRE } from '@/lib/tmdb' // Kelime havuzunu al

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;

// --- HELPER ---
function parseDuration(duration: string) {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  return (parseInt(match?.[1] || '0') * 60) + (parseInt(match?.[2] || '0'));
}
function getCategory(minutes: number) { return minutes < 2 ? 'snack' : minutes <= 20 ? 'meal' : 'feast'; }

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
                  is_approved: false // Onay Beklemeli (Güvenlik Önlemi)
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
  const chunkSize = 50;
  let deletedCount = 0;
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

    const systemInstruction = `You are 'Film Sommelier', an expert AI movie consultant. Analyze the user prompt: "${prompt}".

    OBJECTIVE: Provide 10 perfect recommendations based on specific mood, plot, or vague feelings. If the user describes a general category without nuance, fall back to discovery parameters.

    OUTPUT FORMAT (JSON ONLY):
    {
      "recommendations": [
        { "title": "Exact Query Title", "type": "movie" | "tv", "year": "YYYY" }
      ],
      "params": {
        "genre_ids": "comma_separated_ids",
        "sort_by": "popularity.desc" | "vote_average.desc",
        "year_range": "YYYY-YYYY",
        "type": "movie" | "tv"
      }
    }

    RULES:
    1. PRIORITIZE "recommendations" if the user gives ANY specific context (e.g., "sad love story", "mind-bending", "like Matrix").
    2. USE "params" ONLY for very generic queries (e.g., "comedy movies", "action films").
    3. For "Yeşilçam", strictly recommend Turkish classics (1960-1990).
    4. For "title", prefer the English/International title for non-Turkish content to ensure TMDB match. For Turkish content, use Turkish title.
    5. PROVIDE "year" if possible to resolve ambiguity (e.g. "Avatar" 2009 vs 2005).

    Genres Mapping: ${JSON.stringify(MOOD_TO_MOVIE_GENRE)} (Approximate)
    Return ONLY valid JSON.`;

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
export async function fetchFromSafeChannels() {
  if (!YOUTUBE_API_KEY) return { success: false, message: 'API Key eksik.' };

  const { data: channels } = await supabase.from('safe_channels').select('channel_id');
  if (!channels || channels.length === 0) return { success: false, message: 'Güvenli kanal listeniz boş.' };

  let totalAdded = 0;

  for (const channel of channels) {
    try {
      // Kanalın son videolarını çek
      const url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${channel.channel_id}&part=snippet,id&order=date&maxResults=3&type=video`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.items) {
        const videoIds = data.items.map((i: any) => i.id.videoId).join(',');
        // Detayları (süre vb) çek
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
                mood: 'relax', // Varsayılan mood (Admin panelden değiştirilebilir)
                is_approved: false // Onay Beklemeli
              });
              totalAdded++;
            }
          }
        }
      }
    } catch (e) { console.error(`Safe Channel Fetch Error (${channel.channel_id}):`, e); }
  }

  return { success: true, message: `Tarama bitti. safe_channels listesinden ${totalAdded} yeni video eklendi.` };
}

export async function bulkUpdateVideos(ids: number[], u: any) { await supabase.from('videos').update(u).in('id', ids); return { success: true }; }
export async function checkVideoHealth() { return await checkAndCleanDeadLinks(); }

export async function fetchYouTubeTrends() {
  if (!YOUTUBE_API_KEY) return { success: false, message: 'API Key eksik.' };

  try {
    // TR için popüler videoları çek (Video Category 24 = Entertainment, 23 = Comedy, 22 = People & Blogs, 10 = Music vs. - Kategori belirtmezsek genel trendler gelir)
    // RegionCode=TR. Chart=mostPopular.
    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&chart=mostPopular&regionCode=TR&maxResults=10&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    let totalAdded = 0;

    if (data.items) {
      for (const item of data.items) {
        const videoUrl = `https://www.youtube.com/watch?v=${item.id}`;
        const { data: existing } = await supabase.from('videos').select('id').eq('url', videoUrl).single();

        if (!existing) {
          const min = parseDuration(item.contentDetails.duration);
          // Çok kısa (shorts vb) veya çok uzun videoları elemek isteyebiliriz ama şimdilik hepsini alıyoruz.

          await supabase.from('videos').insert({
            title: item.snippet.title,
            url: videoUrl,
            duration_category: getCategory(min),
            mood: 'funny', // Trendler genellikle eğlencelidir, varsayılan funny.
            is_approved: false
          });
          totalAdded++;
        }
      }
    }
    return { success: true, message: `Trendlerden ${totalAdded} yeni video eklendi.` };

  } catch (e) {
    console.error("Trends Fetch Error:", e);
    return { success: false, message: 'Hata oluştu.' };
  }
}
// Raporlama
export async function reportVideo(id: number, r: string) { await supabase.from('videos').update({ is_approved: false }).eq('id', id); return { success: true } }

export async function getAiSuggestions(prompt: string) {
  const { success, recommendations } = await askGemini(prompt);
  if (success && recommendations && recommendations.length > 0) {
    const movies = await getMoviesByTitles(recommendations);
    return { success: true, results: movies };
  }
  return { success: false, results: [] };
}

export async function fetchVideoMetadata(url: string) {
  if (!YOUTUBE_API_KEY) return { success: false, message: 'API Key eksik.' };

  const videoId = url.match(/v=([^&]+)/)?.[1] || url.match(/youtu\.be\/([^?]+)/)?.[1];
  if (!videoId) return { success: false, message: 'Geçersiz URL' };

  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`);
    const data = await res.json();
    const item = data.items?.[0];

    if (!item) return { success: false, message: 'Video bulunamadı' };

    const min = parseDuration(item.contentDetails.duration);
    const category = getCategory(min);

    // Dil Tespiti (defaultAudioLanguage veya defaultLanguage veya title/description analizi)
    let lang = item.snippet.defaultAudioLanguage || item.snippet.defaultLanguage;
    if (!lang) {
      // Fallback: Başlık veya açıklamada Türkçe karakter kontrolü
      const trChars = /[ğüşıöçĞÜŞİÖÇ]/;
      if (trChars.test(item.snippet.title) || trChars.test(item.snippet.description)) {
        lang = 'tr';
      } else {
        lang = 'en'; // Varsayılan
      }
    }

    return {
      success: true,
      data: {
        title: item.snippet.title,
        description: item.snippet.description,
        duration_category: category,
        mood: 'funny', // Varsayılan, admin değiştirebilir
        language: lang.startsWith('tr') ? 'tr' : 'en',
        thumbnail: item.snippet.thumbnails?.high?.url
      }
    };
  } catch (e) {
    return { success: false, message: 'YouTube API Hatası' };
  }
}