'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getRandomEpisode, getSimilarTitle, getSmartRecommendation, getTitleDetails, searchTvShow, searchTvShowsList } from '@/lib/tmdb'
import { MOOD_TO_MOVIE_GENRE } from '@/lib/constants'
import { checkBadges } from '@/app/actions'
import { useLanguage } from '@/components/LanguageContext'
import { useToast } from '@/components/Toast'
import { getWatchTarget } from '@/lib/watch-link'
import type { MediaItem, MediaType } from '@/types/media'
import type { UserData } from '@/hooks/useUserData'

const findTrailerKey = (item: MediaItem | null) =>
  item?.videos?.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube')?.key
  ?? item?.videos?.results?.find(v => v.site === 'YouTube')?.key

/** "Gurme" modu + seçili yapım (TMDB ve AI modları aynı seçimi paylaşır). */
export function useTmdbBrowser(userData: UserData) {
  const { supabase, user, watchedIds, addWatched, blacklistedIds, platforms } = userData
  const { lang, t } = useLanguage()
  const toast = useToast()
  const router = useRouter()

  const [tmdbResult, setTmdbResult] = useState<MediaItem | null>(null)
  const [tmdbType, setTmdbType] = useState<MediaType>('movie')
  const [tmdbLoading, setTmdbLoading] = useState(false)
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [onlyTurkish, setOnlyTurkish] = useState(false)
  const [searchResults, setSearchResults] = useState<MediaItem[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [trailerKey, setTrailerKey] = useState<string | null>(null)
  // Listeden seçim yapınca arama kutusu dizinin adıyla dolar; bu, listeyi yeniden açmamalı
  const skipNextSearch = useRef(false)

  /** Liste sonuçlarında (AI, küratör, Keşfet) platform ve fragman bilgisi yok; arka planda tamamla. */
  const enrich = async (item: MediaItem) => {
    const details = await getTitleDetails(item.id, item.media_type ?? 'movie', lang)
    if (!details) return
    setTmdbResult(prev => (prev && prev.id === item.id
      ? { ...prev, videos: details.videos, 'watch/providers': details['watch/providers'], genres: details.genres, runtime: details.runtime }
      : prev))
  }

  /** Bir yapımı seçer; tipini (film/dizi) yapımın kendisinden alır. */
  const selectItem = (item: MediaItem | null) => {
    setTmdbResult(item)
    if (item?.media_type) setTmdbType(item.media_type)
    if (item && !item['watch/providers'] && !item.season) enrich(item)
  }

  const toggleGenre = (id: string) => setSelectedGenres(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

  // Dizi arama otomatik tamamlama
  useEffect(() => {
    if (skipNextSearch.current) { skipNextSearch.current = false; return }
    const timer = setTimeout(async () => {
      if (searchQuery.length > 2 && tmdbType === 'tv') {
        setSearchResults(await searchTvShowsList(searchQuery))
        setShowDropdown(true)
      } else {
        setShowDropdown(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, tmdbType])

  const closeDropdown = useCallback(() => setShowDropdown(false), [])

  const handleSearchSelect = async (show: MediaItem) => {
    const name = show.name || show.title || ''
    skipNextSearch.current = true
    setSearchQuery(name); setShowDropdown(false); setTmdbLoading(true)
    try {
      // Seçilen dizinin kendisi kullanılır (adıyla yeniden aramak başka bir diziyi bulabiliyordu)
      const g = selectedGenres.length > 0 ? selectedGenres.join(',') : '35'
      const e = await getRandomEpisode(show.id, g, platforms.join('|'))
      if (e) selectItem(e); else toast(t.messages.episodeNotFound, { type: 'error' })
    } finally {
      setTmdbLoading(false)
    }
  }

  const fetchTmdbContent = async () => {
    setTmdbLoading(true); setTmdbResult(null)
    const pStr = platforms.join('|')
    try {
      if (tmdbType === 'movie') {
        const g = selectedGenres.length > 0 ? selectedGenres.join(',') : MOOD_TO_MOVIE_GENRE.funny
        const m = await getSmartRecommendation(g, pStr, 'movie', watchedIds, blacklistedIds, onlyTurkish)
        if (m) selectItem(m); else toast(t.messages.movieNotFound, { type: 'error' })
      } else {
        let tId: number | null = null
        if (searchQuery && !showDropdown) {
          const s = await searchTvShow(searchQuery)
          if (!s) { toast(t.messages.tvNotFound, { type: 'error' }); return }
          tId = s.id
        }
        const g = selectedGenres.length > 0 ? selectedGenres.join(',') : '35'
        const e = await getRandomEpisode(tId, g, pStr)
        if (e) selectItem(e); else toast(t.messages.episodeNotFound, { type: 'error' })
      }
    } catch (e) {
      console.error(e)
      toast(t.messages.genericError, { type: 'error' })
    } finally {
      setTmdbLoading(false)
    }
  }

  const openTrailer = async () => {
    if (!tmdbResult) return
    let key = findTrailerKey(tmdbResult)
    if (!key) {
      // Pencereyi hemen aç (yükleniyor); fragman aranırken tıklama boşa gitmiş gibi görünmesin
      setTrailerKey('')
      // Liste/küratör sonuçlarında fragman bilgisi yok; detayları getir
      const details = await getTitleDetails(tmdbResult.id, tmdbResult.media_type ?? tmdbType, lang)
      if (details) {
        setTmdbResult(prev => (prev && prev.id === details.id ? { ...details, ...prev, videos: details.videos, 'watch/providers': details['watch/providers'] } : prev))
        key = findTrailerKey(details)
      }
    }
    if (key) setTrailerKey(key)
    else { setTrailerKey(null); toast(t.messages.noTrailer) }
  }

  const markAsWatched = async () => {
    if (!tmdbResult) return
    if (!user) {
      toast(t.messages.loginToSave, { action: { label: t.common.login, onClick: () => router.push('/login') } })
      return
    }
    const { error } = await supabase.from('user_history').insert({
      user_id: user.id, tmdb_id: tmdbResult.id, media_type: tmdbResult.media_type ?? tmdbType,
      title: tmdbResult.title || tmdbResult.name, poster_path: tmdbResult.poster_path, vote_average: tmdbResult.vote_average
    })
    if (error) { toast(t.messages.genericError, { type: 'error' }); return }
    addWatched(tmdbResult.id)
    fetchTmdbContent()
    const { newBadges } = await checkBadges()
    if (newBadges.length) toast(`${t.messages.newBadge} ${newBadges.join(', ')}`, { type: 'success' })
  }

  /** "Benzerini Öner": aynı sekmede, seçili yapıma benzeyen başka bir yapım (önceden Asistan'a atıyordu). */
  const suggestSimilar = async () => {
    if (!tmdbResult) return
    const type = tmdbResult.media_type ?? tmdbType
    setTmdbLoading(true)
    try {
      const similar = await getSimilarTitle(tmdbResult.id, type, [...watchedIds, ...blacklistedIds], lang)
      if (similar) selectItem(similar)
      else toast(type === 'tv' ? t.messages.tvNotFound : t.messages.movieNotFound)
    } catch {
      toast(t.messages.genericError, { type: 'error' })
    } finally {
      setTmdbLoading(false)
    }
  }

  const closeTrailer = useCallback(() => setTrailerKey(null), [])

  // Yapımın gerçekten bulunduğu platform (önce kullanıcının seçtikleri); bkz. lib/watch-link.ts
  const watchTarget = tmdbResult ? getWatchTarget(tmdbResult, platforms) : null

  return {
    tmdbResult, selectItem, tmdbType, setTmdbType, tmdbLoading, setTmdbLoading,
    selectedGenres, toggleGenre, searchQuery, setSearchQuery, onlyTurkish, setOnlyTurkish,
    searchResults, showDropdown, closeDropdown, handleSearchSelect, fetchTmdbContent, suggestSimilar,
    trailerKey, closeTrailer, openTrailer, markAsWatched, watchTarget,
  }
}
