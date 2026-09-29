import { describe, expect, it } from 'vitest'
import { getWatchTarget } from './watch-link'
import type { MediaItem } from '@/types/media'

const provider = (id: number, name: string) => ({ provider_id: id, provider_name: name, logo_path: '' })

const show = (flatrate: ReturnType<typeof provider>[] | undefined, link = 'https://www.themoviedb.org/tv/1/watch?locale=TR'): MediaItem => ({
  id: 1, name: 'The Boys', media_type: 'tv',
  'watch/providers': { results: flatrate ? { TR: { link, flatrate } } : {} },
})

describe('getWatchTarget', () => {
  it('yapım Prime\'daysa, kullanıcı Netflix + Prime seçmiş olsa bile Prime açılır', () => {
    const t = getWatchTarget(show([provider(119, 'Amazon Prime Video')]), [8, 119])
    expect(t.provider).toBe('Prime Video')
    expect(t.url).toContain('primevideo.com')
    expect(t.onUserPlatform).toBe(true)
  })

  it('kullanıcının platformlarından ilk eşleşen seçilir', () => {
    const t = getWatchTarget(show([provider(337, 'Disney Plus'), provider(8, 'Netflix')]), [8])
    expect(t.provider).toBe('Netflix')
    expect(t.url).toBe('https://www.netflix.com/search?q=The%20Boys')
  })

  it('platform bilgisi yoksa Netflix\'e değil TMDB izleme sayfasına gider', () => {
    const t = getWatchTarget(show(undefined), [8])
    expect(t.url).toBe('https://www.themoviedb.org/tv/1/watch?locale=TR')
    expect(t.provider).toBeUndefined()
  })

  it('arama adresi bilinmeyen platformda JustWatch/TMDB bağlantısı kullanılır', () => {
    const t = getWatchTarget(show([provider(342, 'HBO Max')], 'https://justwatch.example/tr'), [342])
    expect(t.provider).toBe('HBO Max (BluTV)')
    expect(t.url).toBe('https://justwatch.example/tr')
  })
})
