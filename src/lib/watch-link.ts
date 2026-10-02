// "İzle" düğmesinin gideceği adres: yapımın gerçekten bulunduğu platform.
import { getRegion, type RegionConfig } from '@/lib/regions'
import type { MediaItem } from '@/types/media'

export interface WatchTarget {
  url: string
  /** Açılacak platformun adı (biliniyorsa), ör. "Prime Video" */
  provider?: string
  /** Yapım kullanıcının seçtiği platformlardan birinde mi? */
  onUserPlatform: boolean
}

/**
 * Öncelik:
 *  1. Yapımın abonelikle bulunduğu ve kullanıcının seçtiği ilk platform
 *  2. Yapımın abonelikle bulunduğu herhangi bir platform
 *  3. TMDB/JustWatch izleme sayfası (tüm seçenekleri listeler)
 * Platform bilgisi yoksa asla varsayılan olarak Netflix'e gönderilmez.
 */
export function getWatchTarget(item: MediaItem, userPlatforms: number[], region: RegionConfig = getRegion()): WatchTarget {
  const query = item.showName || item.title || item.name || ''
  const isTv = item.media_type === 'tv' || !!(item.showName || item.season)
  const tmdbPage = `https://www.themoviedb.org/${isTv ? 'tv' : 'movie'}/${item.id}/watch?locale=${region.tmdbRegion}`

  const regionInfo = item['watch/providers']?.results?.[region.tmdbRegion]
  const fallbackUrl = regionInfo?.link || tmdbPage
  const flatrate = regionInfo?.flatrate ?? []

  const toTarget = (providerId: number, providerName: string, onUserPlatform: boolean): WatchTarget => {
    const known = region.providers.find(p => p.id === providerId)
    return { url: known?.searchUrl ? known.searchUrl(query) : fallbackUrl, provider: known?.name ?? providerName, onUserPlatform }
  }

  const mine = flatrate.find(p => userPlatforms.includes(p.provider_id))
  if (mine) return toTarget(mine.provider_id, mine.provider_name, true)

  if (flatrate.length) {
    const withSearch = flatrate.find(p => region.providers.some(r => r.id === p.provider_id && r.searchUrl)) ?? flatrate[0]
    return toTarget(withSearch.provider_id, withSearch.provider_name, false)
  }

  return { url: fallbackUrl, onUserPlatform: false }
}
