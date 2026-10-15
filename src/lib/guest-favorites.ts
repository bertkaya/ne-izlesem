// Giriş yapmamış kullanıcının Keşfet'te beğendikleri: bu cihazda saklanır, giriş yapınca hesaba aktarılır.
import type { MediaType } from '@/types/media'

export interface GuestFavorite {
  tmdb_id: number
  media_type: MediaType
  title: string
  poster_path?: string | null
  vote_average?: number
}

const KEY = 'guest_favorites'

export function readGuestFavorites(): GuestFavorite[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

/** Ekler; listede zaten varsa eklemez. İlk ekleme ise true döner (bilgilendirme göstermek için). */
export function addGuestFavorite(fav: GuestFavorite): boolean {
  const list = readGuestFavorites()
  const first = list.length === 0
  if (!list.some(f => f.tmdb_id === fav.tmdb_id && f.media_type === fav.media_type)) {
    list.push(fav)
    try { localStorage.setItem(KEY, JSON.stringify(list.slice(-200))) } catch { /* depolama kapalı */ }
  }
  return first
}

export function clearGuestFavorites() {
  try { localStorage.removeItem(KEY) } catch { /* depolama kapalı */ }
}
