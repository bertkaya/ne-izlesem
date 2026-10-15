import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/match`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${siteUrl}/login`, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
