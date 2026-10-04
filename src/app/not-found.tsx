'use client'

import Link from 'next/link'
import { Film } from 'lucide-react'
import { useLanguage } from '@/components/LanguageContext'

export default function NotFound() {
  const { t } = useLanguage()
  return (
    <main className="min-h-screen bg-[#0f1014] text-white flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <p className="text-7xl font-black bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">404</p>
        <h1 className="text-2xl font-bold mb-3">{t.messages.notFoundTitle}</h1>
        <p className="text-gray-400 mb-8">{t.messages.notFoundText}</p>
        <Link href="/" className="bg-white text-black font-bold px-6 py-3 rounded-xl hover:bg-gray-200 transition inline-flex items-center justify-center gap-2 min-h-[48px]">
          <Film size={18} /> {t.messages.backHome}
        </Link>
      </div>
    </main>
  )
}
