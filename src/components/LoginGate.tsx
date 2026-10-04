'use client'

import Link from 'next/link'
import { Lock, ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/components/LanguageContext'

/** Giriş gerektiren sayfalarda açıklamasız yönlendirme yerine gösterilen ekran. */
export default function LoginGate({ description }: { description: string }) {
  const { t } = useLanguage()
  return (
    <div className="min-h-screen bg-[#0f1014] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-8 text-center shadow-2xl">
        <span className="inline-flex p-3 rounded-2xl bg-pink-500/15 text-pink-400 mb-4"><Lock size={24} /></span>
        <h1 className="text-xl font-bold mb-2">{t.messages.loginRequiredTitle}</h1>
        <p className="text-sm text-gray-300 mb-6 leading-relaxed">{description}</p>
        <div className="flex flex-col gap-2">
          <a href="/login" className="bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition min-h-[48px] flex items-center justify-center">
            {t.common.login}
          </a>
          <Link href="/" className="text-sm text-gray-400 hover:text-white min-h-[44px] flex items-center justify-center gap-1.5">
            <ArrowLeft size={16} /> {t.messages.backHome}
          </Link>
        </div>
      </div>
    </div>
  )
}
