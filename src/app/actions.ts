'use server'

import { createClient } from '@supabase/supabase-js'

// Supabase'e sunucu tarafında bağlanmak için client oluşturuyoruz
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// YouTube Süresini (PT1H2M10S formatını) dakikaya çeviren yardımcı fonksiyon
function parseDuration(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
  const hours = (parseInt(match?.[1] || '0')) || 0
  const minutes = (parseInt(match?.[2] || '0')) || 0
  const seconds = (parseInt(match?.[3] || '0')) || 0
  return (hours * 60) + minutes + (seconds / 60)
}

// Kategoriyi belirleyen fonksiyon (Senin kuralların burada!)
function getCategory(minutes: number) {
  if (minutes < 8) return 'snack'       // 8 dakika altı
  if (minutes >= 8 && minutes < 30) return 'meal' // 8 - 30 dakika arası
  return 'feast'                        // 30 dakika ve üstü
}

// --- ANA FONKSİYON: KANAL VIDEOLARINI ÇEK VE KAYDET ---
export async function fetchAndSaveChannelVideos(channelId: string) {
  const apiKey = process.env.YOUTUBE_API_KEY
  
  if (!apiKey) return { success: false, message: 'API Key eksik!' }

  try {
    // 1. Kanalın son 20 videosunu bul (Search API)
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet,id&order=date&maxResults=20&type=video`
    const searchRes = await fetch(searchUrl)
    const searchData = await searchRes.json()

    if (searchData.error) {
      console.error(searchData.error)
      return { success: false, message: 'YouTube Hatası: Kanal bulunamadı veya kota doldu.' }
    }

    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',')

    // 2. Videoların sürelerini öğrenmek için detaylarını çek (Videos API)
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${videoIds}&part=contentDetails,snippet`
    const videosRes = await fetch(videosUrl)
    const videosData = await videosRes.json()

    let addedCount = 0;

    // 3. Her bir videoyu işle ve veritabanına at
    for (const item of videosData.items) {
      const title = item.snippet.title
      const videoId = item.id
      const url = `https://www.youtube.com/watch?v=${videoId}`
      const durationIso = item.contentDetails.duration
      
      const durationInMinutes = parseDuration(durationIso)
      const category = getCategory(durationInMinutes)
      
      // Mood'u şimdilik varsayılan 'relax' yapıyoruz, admin panelden elle düzeltirsin sonra.
      // Veya başlığa göre basit bir mantık kurabiliriz.
      let mood = 'relax' 
      const lowerTitle = title.toLowerCase()
      if (lowerTitle.includes('komik') || lowerTitle.includes('güldür')) mood = 'funny'
      if (lowerTitle.includes('belgesel') || lowerTitle.includes('nasıl') || lowerTitle.includes('tarih')) mood = 'learn'
      if (lowerTitle.includes('film') || lowerTitle.includes('dizi')) mood = 'drama'

      // Supabase'e ekle (Eğer link zaten varsa ekleme - duplicate kontrolü)
      const { error } = await supabase
        .from('videos')
        .insert({
          title: title,
          url: url,
          duration_category: category,
          mood: mood,
          is_approved: true // Admin eklediği için direkt onaylı
        })
        
      if (!error) addedCount++
    }

    return { success: true, message: `${addedCount} yeni video başarıyla eklendi!` }

  } catch (error) {
    console.error(error)
    return { success: false, message: 'Bir şeyler ters gitti.' }
  }
}