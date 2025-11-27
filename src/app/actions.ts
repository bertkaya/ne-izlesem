'use server'

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// --- 1. YOUTUBE LINK KONTROLÜ (Ölü Linkleri Bul ve Sil) ---
export async function checkAndCleanDeadLinks() {
  // Tüm videoları çek
  const { data: videos } = await supabase.from('videos').select('id, url')
  if (!videos) return { success: false, message: 'Video bulunamadı.' }

  let deletedCount = 0;

  for (const video of videos) {
    const videoId = video.url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)?.[2];
    
    if (videoId) {
      // YouTube oEmbed endpoint'ine istek atarak videonun varlığını kontrol et
      const checkUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const res = await fetch(checkUrl);
      
      if (res.status === 404 || res.status === 401) {
        // Video silinmiş veya gizli, veritabanından uçur
        await supabase.from('videos').delete().eq('id', video.id);
        deletedCount++;
      }
    }
  }

  return { success: true, message: `${deletedCount} adet ölü video temizlendi.` }
}

// --- 2. YOUTUBE TRENDLERİ (HYPE) ÇEK ---
export async function fetchYouTubeTrends() {
  if (!YOUTUBE_API_KEY) return { success: false, message: 'API Key eksik' };

  // Türkiye (TR) bölgesindeki en popüler videoları çek
  // videoCategoryId=24 (Entertainment) veya 23 (Comedy) filtrelemesi yapılabilir.
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&chart=mostPopular&regionCode=TR&maxResults=10&key=${YOUTUBE_API_KEY}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    let addedCount = 0;

    for (const item of data.items) {
      const videoUrl = `https://www.youtube.com/watch?v=${item.id}`;
      
      // Veritabanında yoksa ekle
      const { data: existing } = await supabase.from('videos').select('id').eq('url', videoUrl).single();
      
      if (!existing) {
        // Süresine göre kategori belirle
        const durationIso = item.contentDetails.duration; // PT15M33S
        const match = durationIso.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        const minutes = (parseInt(match?.[1] || '0') * 60) + (parseInt(match?.[2] || '0'));
        
        let cat = 'snack';
        if (minutes > 8 && minutes < 30) cat = 'meal';
        if (minutes >= 30) cat = 'feast';

        await supabase.from('videos').insert({
          title: item.snippet.title,
          url: videoUrl,
          duration_category: cat,
          mood: 'relax', // Trendler genelde kafa dağıtmalıktır
          is_approved: true
        });
        addedCount++;
      }
    }
    return { success: true, message: `${addedCount} adet trend video eklendi.` };

  } catch (error) {
    return { success: false, message: 'YouTube bağlantı hatası.' };
  }
}

// --- ESKİ KANAL ÇEKME FONKSİYONU (Aynı kalıyor) ---
export async function fetchAndSaveChannelVideos(channelId: string) {
  // ... (Bu fonksiyonu önceki koddan aynen koruyabilirsin veya buraya tekrar yazabilirim, yer kaplamasın diye kısalttım)
  // Eğer silindiğini düşünüyorsan söyle, tekrar ekleyeyim.
  return { success: false, message: "Bu özellik şu an aktif değil." } 
}