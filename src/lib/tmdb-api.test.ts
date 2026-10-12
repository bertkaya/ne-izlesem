import { afterEach, describe, expect, it, vi } from 'vitest'

// Boş sonuç geldiğinde kullanıcıya "bulunamadı" mı yoksa "servis çalışmıyor" mu diyeceğimizi bu durum belirler.
async function load(key: string | undefined) {
  vi.resetModules()
  if (key) process.env.TMDB_API_KEY = key; else delete process.env.TMDB_API_KEY
  delete process.env.NEXT_PUBLIC_TMDB_API_KEY
  return import('./tmdb-api')
}
const res = (status: number, body: unknown = {}) => ({ ok: status >= 200 && status < 300, status, json: async () => body }) as unknown as Response

describe('tmdb-api durum takibi', () => {
  afterEach(() => vi.restoreAllMocks())

  it('anahtar yoksa durum auth', async () => {
    const m = await load(undefined)
    expect(await m.fetchTMDB('/x')).toEqual({})
    expect(m.tmdbLastStatus()).toBe('auth')
  })

  it('401 → auth, 500 → down, 200 → ok', async () => {
    const m = await load('k')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const f = vi.spyOn(globalThis, 'fetch')
    f.mockResolvedValueOnce(res(401))
    await m.fetchTMDB('/a')
    expect(m.tmdbLastStatus()).toBe('auth')
    f.mockResolvedValueOnce(res(500)).mockResolvedValueOnce(res(503))
    expect(await m.fetchTMDB('/b')).toEqual({})
    expect(m.tmdbLastStatus()).toBe('down')
    f.mockResolvedValueOnce(res(200, { results: [1] }))
    expect(await m.fetchTMDB('/c')).toEqual({ results: [1] })
    expect(m.tmdbLastStatus()).toBe('ok')
  })
})
