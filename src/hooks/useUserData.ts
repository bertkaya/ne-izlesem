'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { User } from '@supabase/supabase-js'
import { clearGuestFavorites, readGuestFavorites } from '@/lib/guest-favorites'

/** Oturum, izlenenler, kara liste, platform ve favori kanal bilgileri. */
export function useUserData() {
  const [supabase] = useState(() => createClientComponentClient())
  const [user, setUser] = useState<User | null>(null)
  const [watchedIds, setWatchedIds] = useState<number[]>([])
  const [blacklistedIds, setBlacklistedIds] = useState<number[]>([])
  const [platforms, setPlatforms] = useState<number[]>([8])
  const [myChannels, setMyChannels] = useState<string[]>([])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data: blacklist } = await supabase.from('blacklist').select('tmdb_id')
      if (blacklist) setBlacklistedIds(blacklist.map(b => b.tmdb_id))
      if (!user) return

      // Giriş yapmadan önce Keşfet'te beğenilenleri hesaba aktar
      const guestFavs = readGuestFavorites()
      if (guestFavs.length) {
        const { error } = await supabase.from('favorites').insert(guestFavs.map(f => ({ ...f, user_id: user.id })))
        if (!error) clearGuestFavorites()
      }

      const [{ data: history }, { data: profile }] = await Promise.all([
        supabase.from('user_history').select('tmdb_id').eq('user_id', user.id),
        supabase.from('profiles').select('selected_platforms, favorite_channels').eq('id', user.id).single(),
      ])
      if (history) setWatchedIds(history.map(h => h.tmdb_id))
      if (profile?.selected_platforms) setPlatforms(profile.selected_platforms.map((p: string) => parseInt(p)))
      if (profile?.favorite_channels) setMyChannels(profile.favorite_channels)
    }
    init()
  }, [supabase])

  const togglePlatform = async (id: number) => {
    const next = platforms.includes(id) ? platforms.filter(p => p !== id) : [...platforms, id]
    setPlatforms(next)
    if (user) await supabase.from('profiles').update({ selected_platforms: next.map(String) }).eq('id', user.id)
  }

  const addWatched = (id: number) => setWatchedIds(prev => (prev.includes(id) ? prev : [...prev, id]))

  return { supabase, user, watchedIds, addWatched, blacklistedIds, platforms, togglePlatform, myChannels }
}

export type UserData = ReturnType<typeof useUserData>
