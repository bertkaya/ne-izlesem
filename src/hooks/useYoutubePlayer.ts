'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getVideoFromChannel } from '@/lib/tmdb'
import { getLiveYoutubeRecommendation, getSurpriseYoutubeVideo, reportVideo } from '@/app/actions'
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
  const [ytLang, setYtLang] = useState<'tr' | 'all'>('tr')

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

      const effectiveLang = lang === 'en' ? 'en' : ytLang
      if (effectiveLang === 'tr') query = query.or('language.eq.tr,language.is.null')
      else if (effectiveLang === 'en') query = query.eq('language', 'en')

      const { data } = await query
      if (data && data.length > 0) {
        setYtVideo(data[Math.floor(Math.random() * data.length)])
        return
      }

      // 3. Veritabanında yoksa YouTube'dan canlı çek, o da olmazsa sürpriz video
      const liveRes = await getLiveYoutubeRecommendation(targetMood, targetDuration, effectiveLang)
      if (liveRes.success && liveRes.video) { setYtVideo(liveRes.video); return }
      if (liveRes.message === 'rate_limited') { toast(t.messages.rateLimited, { type: 'error' }); return }

      const surpriseRes = await getSurpriseYoutubeVideo(lang)
      if (surpriseRes.success && surpriseRes.video) setYtVideo(surpriseRes.video)
    } finally {
      setYtLoading(false)
    }
  }

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
    if (!ytVideo || !user) return
    await supabase.from('user_history').insert({ user_id: user.id, tmdb_id: 0, media_type: 'youtube', title: ytVideo.title })
    fetchYoutubeVideo()
  }

  return {
    ytVideo, ytLoading, duration, setDuration, mood, setMood, ytLang, setYtLang,
    fetchYoutubeVideo, fetchSurpriseYoutubeVideo, fetchMoreFromChannel, handleReport, markYoutubeWatched,
  }
}
