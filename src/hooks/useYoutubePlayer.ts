'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getVideoFromChannel } from '@/lib/tmdb'
import { getLiveYoutubeRecommendation, getPopularYoutubeVideos, getSurpriseYoutubeVideo, reportVideo, searchYoutubeVideos } from '@/app/actions'
import { useLanguage } from '@/components/LanguageContext'
import { useToast } from '@/components/Toast'
import type { YoutubeVideo } from '@/types/media'
import type { UserData } from '@/hooks/useUserData'

/** "Yemek" modu: süre + mood'a göre video bulma, bildirme, izlendi işaretleme. */
export function useYoutubePlayer({ supabase, user, myChannels }: Pick<UserData, 'supabase' | 'user' | 'myChannels'>) {
  const { lang, t } = useLanguage()
  const toast = useToast()
  const router = useRouter()
  const [ytVideo, setYtVideo] = useState<YoutubeVideo | null>(null)
  const [ytLoading, setYtLoading] = useState(false)
  const [duration, setDuration] = useState('meal')
  const [mood, setMood] = useState('funny')
  // 'native' = arayüz dilindeki videolar (TR → Türkçe, EN → İngilizce), 'all' = dil filtresi yok
  const [ytLang, setYtLang] = useState<'native' | 'all'>('native')
  // "YouTube'da ara" kutusu
  const [searchResults, setSearchResults] = useState<YoutubeVideo[]>([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [popular, setPopular] = useState<YoutubeVideo[]>([])

  // "Şu an popüler" şeridi: arayüz diline göre (TR → Türkiye, EN → ABD)
  useEffect(() => {
    let cancelled = false
    getPopularYoutubeVideos(lang).then(v => { if (!cancelled) setPopular(v) }).catch(() => {})
    return () => { cancelled = true }
  }, [lang])

  const fetchYoutubeVideo = async (overrideMood?: string, overrideDuration?: string) => {
    setYtLoading(true); setYtVideo(null)
    const targetMood = overrideMood || mood
    const targetDuration = overrideDuration || duration
    try {
      // 1. Kullanıcının favori kanalı varsa %40 ihtimalle oradan çek
      if (myChannels.length > 0 && Math.random() > 0.6) {
        const r = await getVideoFromChannel(myChannels[Math.floor(Math.random() * myChannels.length)])
        if (r) { setYtVideo(r); return }
      }

      // 2. Önce yerel veritabanına bak
      let query = supabase
        .from('videos')
        .select('*')
        .eq('is_approved', true)
        .eq('duration_category', targetDuration)
        .eq('mood', targetMood)

      // Dil filtresi kesin: dili bilinmeyen (null) videolar "Sadece Türkçe"de gösterilmez
      const effectiveLang = ytLang === 'all' ? 'all' : lang
      if (effectiveLang !== 'all') query = query.eq('language', effectiveLang)

      const { data } = await query
      if (data && data.length > 0) {
        setYtVideo(data[Math.floor(Math.random() * data.length)])
        return
      }

      // 3. Veritabanında yoksa YouTube'dan canlı çek. Bulunamazsa başka mood/süreye
      //    sessizce geçmek yerine kullanıcıya söyle (önceden "sürpriz" video seçimi bozuyordu).
      const liveRes = await getLiveYoutubeRecommendation(targetMood, targetDuration, effectiveLang)
      if (liveRes.success && liveRes.video) { setYtVideo(liveRes.video); return }
      if (liveRes.message === 'rate_limited') toast(t.messages.rateLimited, { type: 'error' })
      else toast(t.youtube.noMatch)
    } catch (e) {
      console.error('fetchYoutubeVideo error', e)
      toast(t.messages.genericError, { type: 'error' })
    } finally {
      setYtLoading(false)
    }
  }

  // Arayüz dili değişince açık video da yeni dilde yenilenir
  const prevLang = useRef(lang)
  useEffect(() => {
    if (prevLang.current === lang) return
    prevLang.current = lang
    if (ytVideo && ytLang === 'native') fetchYoutubeVideo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  const fetchSurpriseYoutubeVideo = async () => {
    setYtLoading(true); setYtVideo(null)
    const res = await getSurpriseYoutubeVideo(lang)
    if (res.success && res.video) {
      setYtVideo(res.video)
      if (res.video.mood) setMood(res.video.mood)
      if (res.video.duration_category) setDuration(res.video.duration_category)
    } else if (res.message === 'rate_limited') {
      toast(t.messages.rateLimited, { type: 'error' })
    }
    setYtLoading(false)
  }

  const fetchMoreFromChannel = async (channelId?: string) => {
    if (!channelId) { fetchYoutubeVideo(); return }
    setYtLoading(true)
    const res = await getVideoFromChannel(channelId)
    setYtLoading(false)
    if (res) setYtVideo(res)
    else fetchYoutubeVideo()
  }

  const handleReport = () => {
    if (!ytVideo) return
    if (!user) {
      toast(t.messages.loginToReport, { action: { label: t.common.login, onClick: () => router.push('/login') } })
      return
    }
    // Yalnızca veritabanındaki videolar (sayısal id) bildirilebilir; canlı videolar zaten onay kuyruğunda.
    if (typeof ytVideo.id !== 'number' || ytVideo.id <= 0) { fetchYoutubeVideo(); return }
    const videoId = ytVideo.id
    toast(t.messages.reportConfirm, {
      action: {
        label: t.messages.reportAction,
        onClick: async () => {
          const res = await reportVideo(videoId)
          if (res.success) toast(t.messages.reported, { type: 'success' })
          else toast(res.message === 'rate_limited' ? t.messages.rateLimited : t.messages.genericError, { type: 'error' })
          fetchYoutubeVideo()
        }
      }
    })
  }

  const markYoutubeWatched = async () => {
    if (!ytVideo) return
    if (!user) {
      toast(t.messages.loginToSave, { action: { label: t.common.login, onClick: () => router.push('/login') } })
      return
    }
    await supabase.from('user_history').insert({ user_id: user.id, tmdb_id: 0, media_type: 'youtube', title: ytVideo.title })
    fetchYoutubeVideo()
  }

  const searchYoutube = async (query: string) => {
    if (query.trim().length < 2) return
    setSearching(true); setSearchError(null)
    try {
      const res = await searchYoutubeVideos(query, ytLang === 'all' ? 'all' : lang)
      setSearchResults(res.videos)
      if (!res.success) setSearchError(res.message === 'rate_limited' ? t.messages.rateLimited : t.messages.genericError)
      else if (res.videos.length === 0) setSearchError(t.youtube.searchEmpty)
    } catch {
      setSearchError(t.messages.genericError)
    } finally {
      setSearching(false)
    }
  }

  return {
    ytVideo, ytLoading, duration, setDuration, mood, setMood, ytLang, setYtLang,
    fetchYoutubeVideo, fetchSurpriseYoutubeVideo, fetchMoreFromChannel, handleReport, markYoutubeWatched,
    searchResults, searching, searchError, searchYoutube, playVideo: setYtVideo, popular,
    clearSearch: () => { setSearchResults([]); setSearchError(null) },
  }
}
