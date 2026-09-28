import { describe, expect, it } from 'vitest'
import { checkRateLimit } from './rate-limit'
import { mapWithConcurrency } from './concurrency'

describe('checkRateLimit', () => {
  it('pencere içinde limiti aşınca reddeder, pencere dolunca sıfırlar', () => {
    const t0 = 1_000_000
    expect(checkRateLimit('test:a', 2, 1000, t0)).toBe(true)
    expect(checkRateLimit('test:a', 2, 1000, t0 + 10)).toBe(true)
    expect(checkRateLimit('test:a', 2, 1000, t0 + 20)).toBe(false)
    expect(checkRateLimit('test:b', 2, 1000, t0 + 20)).toBe(true) // farklı anahtar
    expect(checkRateLimit('test:a', 2, 1000, t0 + 1001)).toBe(true)
  })
})

describe('mapWithConcurrency', () => {
  it('sırayı korur ve eşzamanlılığı sınırlar', async () => {
    let active = 0
    let maxActive = 0
    const result = await mapWithConcurrency([1, 2, 3, 4, 5, 6], 2, async (n) => {
      active++; maxActive = Math.max(maxActive, active)
      await new Promise(r => setTimeout(r, 5))
      active--
      return n * 10
    })
    expect(result).toEqual([10, 20, 30, 40, 50, 60])
    expect(maxActive).toBe(2)
  })
})
