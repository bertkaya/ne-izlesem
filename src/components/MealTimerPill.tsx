'use client'

import { Timer, X } from 'lucide-react'
import { useLanguage } from '@/components/LanguageContext'
import { useMealTimer, formatTimer } from '@/hooks/useMealTimer'

/** Yemek sayacı çalışırken diğer sekmelerde de görünen küçük rozet. */
export default function MealTimerPill({ onOpen }: { onOpen: () => void }) {
  const { t } = useLanguage()
  const { remaining, stop } = useMealTimer()
  if (remaining === null) return null

  const done = remaining === 0
  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-1 bg-gray-900/95 border border-orange-500/40 rounded-full shadow-2xl backdrop-blur-md pl-1 pr-1 py-1">
      <button
        onClick={onOpen}
        aria-label={t.youtube.timerPill}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold tabular-nums ${done ? 'text-green-400' : remaining < 60 ? 'text-red-400 animate-pulse' : 'text-orange-300'}`}
      >
        <Timer size={15} /> {done ? '✓' : formatTimer(remaining)}
      </button>
      <button onClick={stop} aria-label={t.youtube.reset} className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-gray-800">
        <X size={14} />
      </button>
    </div>
  )
}
