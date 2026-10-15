'use client'

import { useState } from 'react'
import { getAiSuggestions } from '@/app/actions'
import { useLanguage } from '@/components/LanguageContext'
import type { MediaItem } from '@/types/media'
import type { UserData } from '@/hooks/useUserData'

/** "Sommelier" modu: serbest metin → öneri listesi. İzlenenler, kara liste ve platformlar sunucuya iletilir. */
export function useAiSuggestions(
  { watchedIds, blacklistedIds, platforms }: Pick<UserData, 'watchedIds' | 'blacklistedIds' | 'platforms'>,
  selectItem: (item: MediaItem | null) => void,
) {
  const { lang, t } = useLanguage()
  const [aiSuggestions, setAiSuggestions] = useState<MediaItem[]>([])
  const [aiLoading, setAiLoading] = useState(false)
  // Hata ekranda kalır (toast kaybolup gidiyordu) ve son istek "Tekrar dene" ile yinelenir
  const [aiError, setAiError] = useState<string | null>(null)
  const [lastPrompt, setLastPrompt] = useState('')

  const fetchAiRecommendation = async (prompt?: string) => {
    const text = prompt?.trim()
    if (!text) return
    setAiLoading(true)
    setAiError(null)
    setLastPrompt(text)
    setAiSuggestions([])
    selectItem(null)
    try {
      const res = await getAiSuggestions(text, lang, { excludeIds: [...watchedIds, ...blacklistedIds], platforms })
      if (res.success && res.results.length > 0) {
        setAiSuggestions(res.results)
        selectItem(res.results[0])
      } else if (res.error === 'rate_limited') {
        setAiError(t.messages.rateLimited)
      } else if (res.error === 'unavailable') {
        setAiError(t.messages.aiUnavailable)
      } else {
        setAiError(t.messages.aiNoResults)
      }
    } catch (err) {
      console.error('fetchAiRecommendation error:', err)
      setAiError(t.messages.genericError)
    } finally {
      setAiLoading(false)
    }
  }

  return {
    aiSuggestions, aiLoading, aiError, fetchAiRecommendation,
    retry: () => fetchAiRecommendation(lastPrompt),
  }
}
