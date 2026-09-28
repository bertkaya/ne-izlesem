'use client'

import { useState } from 'react'
import { getAiSuggestions } from '@/app/actions'
import { useLanguage } from '@/components/LanguageContext'
import { useToast } from '@/components/Toast'
import type { MediaItem } from '@/types/media'
import type { UserData } from '@/hooks/useUserData'

/** "Sommelier" modu: serbest metin → öneri listesi. İzlenenler, kara liste ve platformlar sunucuya iletilir. */
export function useAiSuggestions(
  { watchedIds, blacklistedIds, platforms }: Pick<UserData, 'watchedIds' | 'blacklistedIds' | 'platforms'>,
  selectItem: (item: MediaItem | null) => void,
) {
  const { lang, t } = useLanguage()
  const toast = useToast()
  const [aiSuggestions, setAiSuggestions] = useState<MediaItem[]>([])
  const [aiLoading, setAiLoading] = useState(false)

  const fetchAiRecommendation = async (prompt?: string) => {
    const text = prompt?.trim()
    if (!text) return
    setAiLoading(true)
    setAiSuggestions([])
    selectItem(null)
    try {
      const res = await getAiSuggestions(text, lang, { excludeIds: [...watchedIds, ...blacklistedIds], platforms })
      if (res.success && res.results.length > 0) {
        setAiSuggestions(res.results)
        selectItem(res.results[0])
      } else if (res.error === 'rate_limited') {
        toast(t.messages.rateLimited, { type: 'error' })
      } else if (res.error === 'unavailable') {
        toast(t.messages.aiUnavailable, { type: 'error' })
      } else {
        toast(t.messages.aiNoResults)
      }
    } catch (err) {
      console.error('fetchAiRecommendation error:', err)
      toast(t.messages.genericError, { type: 'error' })
    } finally {
      setAiLoading(false)
    }
  }

  return { aiSuggestions, aiLoading, fetchAiRecommendation }
}
