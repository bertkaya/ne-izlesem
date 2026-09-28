'use client'

import { useEffect, useRef, useState } from 'react'
import { getDiscoverBatch } from '@/lib/tmdb'
import type { MediaItem, MediaType } from '@/types/media'
import type { UserData } from '@/hooks/useUserData'

const MIN_CARDS = 5
const REFILL_BELOW = 4

/** Keşfet (swipe) destesi: kartları yükler, kaydırılanları çıkarır, sağa kaydırılanı favoriye ekler. */
export function useSwipeDeck(userData: Pick<UserData, 'supabase' | 'user' | 'watchedIds' | 'blacklistedIds'>, preferredGenres: string[]) {
  const { supabase, user, watchedIds, blacklistedIds } = userData
  const [swipeType, setSwipeType] = useState<MediaType>('movie')
  const [swipeMovies, setSwipeMovies] = useState<MediaItem[]>([])
  const pageRef = useRef(1)
  const loadingRef = useRef(false)
  const seenRef = useRef(new Set<number>())

  const loadCards = async (type: MediaType, reset: boolean) => {
    if (loadingRef.current && !reset) return
    loadingRef.current = true
    if (reset) { pageRef.current = 1; seenRef.current = new Set() }

    try {
      const fresh: MediaItem[] = []
      // En az MIN_CARDS yeni kart bulana kadar (en fazla 5 sayfa) dene
      for (let attempts = 0; fresh.length < MIN_CARDS && attempts < 5; attempts++) {
        const batch = await getDiscoverBatch(pageRef.current++, preferredGenres.join(','), type)
        if (!batch.length) break
        for (const m of batch) {
          if (seenRef.current.has(m.id) || watchedIds.includes(m.id) || blacklistedIds.includes(m.id)) continue
          seenRef.current.add(m.id)
          fresh.push(m)
        }
      }
      setSwipeMovies(prev => (reset ? fresh : [...prev, ...fresh]))
    } catch (e) {
      console.error('Swipe error', e)
    } finally {
      loadingRef.current = false
    }
  }

  useEffect(() => {
    loadCards(swipeType, true)
    // Tür değişince deste sıfırlanır; filtre listeleri değişince mevcut deste korunur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swipeType])

  const handleSwipe = (direction: 'left' | 'right', movie: MediaItem) => {
    // Kaydırılan kart desteden çıkar; aksi halde yeni kartlar gelince geri dönüyordu.
    const remaining = swipeMovies.filter(m => m.id !== movie.id)
    setSwipeMovies(remaining)
    if (remaining.length < REFILL_BELOW) loadCards(swipeType, false)

    if (direction === 'right' && user) {
      supabase.from('favorites').insert({
        user_id: user.id, tmdb_id: movie.id, media_type: swipeType,
        title: movie.title || movie.name, poster_path: movie.poster_path, vote_average: movie.vote_average
      }).then(({ error }) => { if (error) console.error('Favorite insert error', error) })
    }
  }

  return { swipeType, setSwipeType, swipeMovies, handleSwipe }
}
