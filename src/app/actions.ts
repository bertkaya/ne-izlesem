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