'use client'
import { User } from '@supabase/supabase-js'
import { Moon, Sun, User as UserIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState, memo } from 'react'

interface NavigationProps {
    user: User | null
}

const Navigation = memo(function Navigation({ user }: NavigationProps) {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => setMounted(true), [])

    return (
        <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto w-full z-50 relative">
            <button
                onClick={() => window.location.href = '/'}
                className="text-4xl md:text-5xl font-black tracking-tighter cursor-pointer bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-lg hover:scale-105 transition-transform"
                aria-label="Ana sayfaya dön"
            >
                NE İZLESEM?
            </button>
            <div className="flex items-center gap-4">
                {mounted && (
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:scale-110 transition"
                        aria-label={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                )}
                {user ? (
                    <a href="/profile" className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition backdrop-blur-md border border-white/10">
                        <UserIcon size={18} /> <span className="hidden md:inline">Profilim</span>
                    </a>
                ) : (
                    <a href="/login" className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition shadow-lg">Giriş Yap</a>
                )}
            </div>
        </nav>
    )
})

export default Navigation
