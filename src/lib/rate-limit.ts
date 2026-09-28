// Basit, bellek içi sabit pencere oran sınırlayıcı.
// Not: Serverless ortamda (Vercel) her instance kendi sayacını tutar; bu yüzden
// "en iyi çaba" korumasıdır. Kesin limit gerekirse Upstash Redis vb. kullanılmalı.
import { headers } from 'next/headers'

interface Bucket { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 5000

export function checkRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
      if (buckets.size >= MAX_BUCKETS) buckets.clear()
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (bucket.count >= limit) return false
  bucket.count++
  return true
}

async function clientIp(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown'
}

/** İsteği yapan IP için `scope` kapsamında limit kontrolü. */
export async function rateLimitByIp(scope: string, limit: number, windowMs: number): Promise<boolean> {
  return checkRateLimit(`${scope}:${await clientIp()}`, limit, windowMs)
}
