import { describe, expect, it } from 'vitest'
import { cleanDescription, detectVideoLanguage, durationCategory, formatDuration, isLiveOrUnknown, parseDurationSeconds } from './youtube-utils'

describe('parseDurationSeconds / durationCategory', () => {
  it('ISO süresini saniyeye çevirir', () => {
    expect(parseDurationSeconds('PT1H2M3S')).toBe(3723)
    expect(parseDurationSeconds('PT45S')).toBe(45)
    expect(parseDurationSeconds('PT12M')).toBe(720)
  })

  it('canlı yayın (P0D) 0 saniyedir ve Atıştır sayılmaz', () => {
    expect(parseDurationSeconds('P0D')).toBe(0)
    expect(isLiveOrUnknown({ contentDetails: { duration: 'P0D' } })).toBe(true)
    expect(isLiveOrUnknown({ contentDetails: { duration: 'PT3M' }, snippet: { liveBroadcastContent: 'live' } })).toBe(true)
    expect(isLiveOrUnknown({ contentDetails: { duration: 'PT3M' }, snippet: { liveBroadcastContent: 'none' } })).toBe(false)
  })

  it('kategoriler: <2 dk Atıştır, 2–20 dk Doyur, >20 dk Ziyafet', () => {
    expect(durationCategory(90)).toBe('snack')
    expect(durationCategory(120)).toBe('meal')
    expect(durationCategory(20 * 60)).toBe('meal')
    expect(durationCategory(20 * 60 + 1)).toBe('feast')
  })
})

describe('formatDuration', () => {
  it('dakika ve saat biçimi', () => {
    expect(formatDuration(754)).toBe('12:34')
    expect(formatDuration(65)).toBe('1:05')
    expect(formatDuration(3725)).toBe('1:02:05')
  })
})

describe('cleanDescription', () => {
  it('bağlantıları ve hashtag satırlarını temizler', () => {
    const d = 'Harika bir video!\nDinle: https://lnk.to/halloween-lofi02?si=abc\nlnk.to/foo\n#lofi #chill\nİyi seyirler'
    expect(cleanDescription(d)).toBe('Harika bir video!\nDinle:\nİyi seyirler')
  })
})

describe('detectVideoLanguage', () => {
  it('dil etiketi ya da Türkçe karakterden dil tahmini', () => {
    expect(detectVideoLanguage({ defaultAudioLanguage: 'tr-TR' })).toBe('tr')
    expect(detectVideoLanguage({ title: 'EN KOMİK KEDİLER' })).toBe('tr')
    expect(detectVideoLanguage({ title: 'Stand Up Comedy' })).toBe('en')
  })
})
