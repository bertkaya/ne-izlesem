'use client'
import { User } from '@supabase/supabase-js'
import { User as UserIcon, Globe } from 'lucide-react'
import { memo } from 'react'
import { useLanguage } from '@/components/LanguageContext'

interface NavigationProps {
    user: User | null
}

const Navigation = memo(function Navigation({ user }: NavigationProps) {
    const { lang, toggleLang, t } = useLanguage()

    return (
        <nav className="flex justify-between items-center gap-3 px-4 py-4 md:p-6 max-w-7xl mx-auto w-full z-50 relative">
            <button
                onClick={() => window.location.href = '/'}
                className="text-xl min-[400px]:text-2xl sm:text-3xl md:text-5xl font-black tracking-tighter whitespace-nowrap cursor-pointer bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-lg hover:scale-105 transition-transform text-left min-w-0"
                aria-label={t.nav.brand}
            >
                {t.nav.brand}
            </button>
            <div className="flex items-center gap-2 md:gap-4 shrink-0">
                {/* DİL DEĞİŞTİRİCİ (TR / EN) */}
                <button
                    onClick={toggleLang}
                    className="flex items-center gap-1 px-2.5 sm:px-3 py-2 min-h-[40px] rounded-full bg-gray-200 dark:bg-gray-800/90 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:scale-105 transition text-xs font-bold shadow-sm"
                    title={t.nav.switchLang}
                    aria-label={t.nav.switchLang}
                >
                    <Globe size={14} className="text-purple-400" />
                    <span>{lang === 'tr' ? 'EN' : 'TR'}</span>
                </button>

                {user ? (
                    <a href="/profile" aria-label={t.nav.profile} className="flex items-center gap-2 bg-white/10 px-3 md:px-4 py-2.5 rounded-full hover:bg-white/20 transition backdrop-blur-md border border-white/10 text-sm font-semibold">
                        <UserIcon size={16} /> <span className="hidden md:inline">{t.nav.profile}</span>
                    </a>
                ) : (
                    <a href="/login" className="bg-white text-black px-4 md:px-5 py-2.5 rounded-full font-bold hover:bg-gray-200 transition shadow-lg text-sm whitespace-nowrap">
                        {t.nav.login}
                    </a>
                )}
            </div>
        </nav>
    )
})

export default Navigation
