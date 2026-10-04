'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Loader2, X } from 'lucide-react'
import { useLanguage } from '@/components/LanguageContext'

// react-player v3: video adresi `src` prop'u ile verilir (v2'deki `url` değil)
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false })

/** Fragman penceresi: Esc ve arka plana tıklama ile kapanır; ✕ oynatıcının kontrollerinin üstünde değil, dışında. */
export default function TrailerModal({ videoKey, onClose }: { videoKey: string; onClose: () => void }) {
  const { t } = useLanguage()
  const [ready, setReady] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.tmdb.trailer}
      onClick={onClose}
      className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in"
    >
      <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label={t.common.close}
          className="absolute -top-12 right-0 flex items-center gap-1.5 bg-white/10 hover:bg-white hover:text-black text-white px-3 py-2 rounded-full text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          <X size={18} /> <span>{t.common.close}</span>
          <kbd className="hidden md:inline text-[10px] font-mono opacity-60 ml-1">Esc</kbd>
        </button>
        <div className="relative aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-gray-800">
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 size={40} className="animate-spin text-gray-500" />
            </div>
          )}
          <ReactPlayer
            src={`https://www.youtube.com/watch?v=${videoKey}`}
            width="100%"
            height="100%"
            playing
            controls
            onReady={() => setReady(true)}
          />
        </div>
      </div>
    </div>
  )
}
