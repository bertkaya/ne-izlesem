'use client'
import { User } from '@supabase/supabase-js'
import { Moon, Sun, User as UserIcon, Globe } from 'lucide-react'
import { useTheme } from 'next-themes'
import { memo, useSyncExternalStore } from 'react'
import { useLanguage } from '@/components/LanguageContext'

const emptySubscribe = () => () => {}

interface NavigationProps {
    user: User | null
}

const Navigation = memo(function Navigation({ user }: NavigationProps) {
    const { theme, setTheme } = useTheme()
    const { lang, toggleLang, t } = useLanguage()
    const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

    return (
        <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto w-full z-50 relative">
            <button
                onClick={() => window.location.href = '/'}
                className="text-3xl md:text-5xl font-black tracking-tighter cursor-pointer bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-lg hover:scale-105 transition-transform text-left"
                aria-label="Home"
            >
                {t.nav.brand}
            </button>
            <div className="flex items-center gap-3 md:gap-4">
                {/* DİL DEĞİŞTİRİCİ (TR / EN) */}
                <button
                    onClick={toggleLang}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-200 dark:bg-gray-800/90 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:scale-105 transition text-xs font-bold shadow-sm"
                    title={t.nav.switchLang}
                    aria-label={t.nav.switchLang}
                >
                    <Globe size={14} className="text-purple-400" />
                    <span>{lang === 'tr' ? 'EN 🇬🇧' : 'TR 🇹🇷'}</span>
                </button>

                {mounted && (
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:scale-110 transition border border-gray-300 dark:border-gray-700"
                        aria-label={t.nav.switchTheme}
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                )}

                {user ? (
                    <a href="/profile" className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition backdrop-blur-md border border-white/10 text-sm font-semibold">
                        <UserIcon size={16} /> <span className="hidden md:inline">{t.nav.profile}</span>
                    </a>
                ) : (
                    <a href="/login" className="bg-white text-black px-5 py-2 rounded-full font-bold hover:bg-gray-200 transition shadow-lg text-sm">
                        {t.nav.login}
                    </a>
                )}
            </div>
        </nav>
    )
})

export default Navigation
