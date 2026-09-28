import { describe, expect, it } from 'vitest'
import { analyzePrompt, buildCuratorReason, buildDiscoverParams, normalizePrompt } from './smart-search'
import type { MediaItem } from '@/types/media'

const NOW = new Date('2026-06-01')
const analyze = (text: string) => analyzePrompt(text, NOW)

describe('analyzePrompt — kelime sınırları', () => {
  it('"award-winning" savaş türü seçmez', () => {
    const a = analyze('award-winning comedy')
    expect(a.genreKey).toBe('comedy')
    expect(a.sort).toBe('vote_average.desc')
  })

  it('"software" ve "warm" içindeki "war" eşleşmez', () => {
    expect(analyze('a movie about software engineers').genreKey).not.toBe('war')
    expect(analyze('warm and wholesome').genreKey).toBe('feelgood')
  })

  it('"reminds me" belgesel/rahatlama tetiklemez', () => {
    expect(analyze('something that reminds me of home').genreKey).toBeNull()
  })

  it('gerçek "war" kelimesi savaş türünü seçer', () => {
    expect(analyze('a gritty war movie').genreKey).toBe('war')
    expect(analyze('Epik Savaş').genreKey).toBe('war')
  })

  it('Türkçe ekli kelimeler kök ile eşleşir', () => {
    expect(analyze('korkunç bir gece').genreKey).toBe('horror')
    expect(analyze('Hüngür Hüngür Ağlat').genreKey).toBe('drama')
    expect(analyze('Gülmekten Karnım Ağrısın').genreKey).toBe('comedy')
  })

  it('"Büyük Soygun" fantastik değil suç', () => {
    expect(analyze('💰 Büyük Soygun').genreKey).toBe('crime')
  })
})

describe('analyzePrompt — büyük harf / Türkçe karakter', () => {
  it('"KOMİK" komedi olarak algılanır', () => {
    expect(analyze('KOMİK BİR ŞEY').genreKey).toBe('comedy')
  })

  it('"SCI-FI" (İngilizce büyük harf) bilim kurgu olarak algılanır', () => {
    expect(analyze('SCI-FI THRILLER IN SPACE').genreKey).toBe('scifi')
  })

  it('normalizePrompt iki küçük harf varyantını da içerir', () => {
    const n = normalizePrompt('SCI-FI')
    expect(n).toContain('sci-fi')
    expect(n).toContain('scı-fı')
  })
})

describe('analyzePrompt — dönem, kalite, dil, tip', () => {
  it.each([
    ["90'lar Klasikleri", '1990-1999'],
    ['80ler nostaljisi', '1980-1989'],
    ['80s Retro Nostalgia', '1980-1989'],
    ["2000'ler komedi", '2000-2009'],
  ])('%s → %s', (text, year) => {
    expect(analyze(text).year).toBe(year)
  })

  it('"yeni" son 3 yılı seçer', () => {
    expect(analyze('yeni çıkan korku filmleri').year).toBe('2024-2026')
  })

  it('"top 250" dönem sanılmaz, kalite filtresi açılır', () => {
    const a = analyze('🐐 IMDb Top 250')
    expect(a.year).toBe('')
    expect(a.minVoteAverage).toBe(7.5)
  })

  it('Kore / Yeşilçam orijinal dil filtresi', () => {
    expect(analyze('🇰🇷 Kore Sineması').originalLanguage).toBe('ko')
    const y = analyze('🇹🇷 Yeşilçam Efsaneleri')
    expect(y.originalLanguage).toBe('tr')
    expect(y.year).toBe('1950-1989')
  })

  it('dizi isteği tv tipini ve tv tür ID lerini seçer', () => {
    const a = analyze('komik bir dizi')
    expect(a.mediaType).toBe('tv')
    expect(a.genreIds).toBe('35')
    expect(analyze('aksiyon dizisi').genreIds).toBe('10759')
  })

  it('kısa film isteği süre sınırı koyar', () => {
    expect(analyze('Kısa ve Çarpıcı (<90dk)').maxRuntime).toBe(90)
  })

  it('tür anlaşılmazsa tür filtresi yok, sevilen yapımlar', () => {
    const a = analyze('bu akşam ne izlesem')
    expect(a.genreIds).toBe('')
    expect(a.minVoteAverage).toBe(7)
  })
})

describe('buildDiscoverParams', () => {
  it('tv için first_air_date, platformlar için provider filtresi', () => {
    const p = buildDiscoverParams(analyze("90'lar komedi dizisi"), { platforms: [8, 119] })
    expect(p['first_air_date.gte']).toBe('1990-01-01')
    expect(p['first_air_date.lte']).toBe('1999-12-31')
    expect(p.with_watch_providers).toBe('8|119')
    expect(p.watch_region).toBe('TR')
  })
})

describe('buildCuratorReason', () => {
  const movie: MediaItem = {
    id: 1, title: 'Scream', release_date: '1996-12-20', genre_ids: [27, 9648],
    vote_average: 7.4, vote_count: 7200,
  }

  it('gerçek veriden (tür, yıl, puan) Türkçe gerekçe üretir', () => {
    const r = buildCuratorReason(movie, analyze("90'lar korku"), 'tr', NOW)
    expect(r).toContain('"korku" isteğine uygun')
    expect(r).toContain('1996 yapımı')
    expect(r).toContain('korku / gizem filmi')
    expect(r).toContain('TMDB puanı 7.4 (7,2 bin oy)')
  })

  it('İngilizce gerekçe', () => {
    const r = buildCuratorReason(movie, analyze('90s horror'), 'en', NOW)
    expect(r).toContain('Matches your "horror" craving')
    expect(r).toContain('7.2K votes')
  })

  it('yüksek puanlı yapım için vurgu ekler', () => {
    const r = buildCuratorReason({ ...movie, vote_average: 8.5, vote_count: 20000 }, analyze('korku'), 'tr', NOW)
    expect(r).toContain('türünün en yüksek puanlılarından')
  })
})
