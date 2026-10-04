import { Youtube, Film, Sparkles, Flame, Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { memo } from 'react'
import { useLanguage } from '@/components/LanguageContext'

type AppMode = 'youtube' | 'tmdb' | 'swipe' | 'ai'

interface ModeSelectorProps {
    appMode: AppMode;
    setAppMode: (mode: AppMode) => void;
}

const ModeSelector = memo(function ModeSelector({ appMode, setAppMode }: ModeSelectorProps) {
    const router = useRouter()
    const { t } = useLanguage()

    const modes = [
        { id: 'youtube' as const, label: t.modes.youtube, icon: Youtube, color: 'text-red-500' },
        { id: 'tmdb' as const, label: t.modes.tmdb, icon: Film, color: 'text-red-500' },
        { id: 'ai' as const, label: t.modes.ai, icon: Sparkles, color: 'text-cyan-400' },
        { id: 'swipe' as const, label: t.modes.swipe, icon: Flame, color: 'text-purple-500' },
    ]

    return (
        <div className="sticky top-4 z-50 flex justify-center mt-6 px-4 pointer-events-none">
            {/* Telefonda tek satır, yatay kaydırılabilir (önceden "Eşleş" alt satıra düşüyordu) */}
            <div className="bg-gray-900/90 backdrop-blur-md p-1 rounded-2xl border border-gray-800 flex flex-nowrap overflow-x-auto scrollbar-hide sm:justify-center w-full max-w-xl shadow-2xl pointer-events-auto" role="tablist">
                {modes.map(({ id, label, icon: Icon, color }) => (
                    <button
                        key={id}
                        onClick={() => setAppMode(id)}
                        role="tab"
                        aria-selected={appMode === id}
                        className={`shrink-0 sm:flex-1 py-3 px-3 md:px-4 rounded-xl font-bold flex items-center justify-center gap-1.5 md:gap-2 transition-all text-xs md:text-sm whitespace-nowrap min-h-[44px] ${appMode === id ? `bg-gray-800 ${color} shadow-lg` : 'text-gray-500 hover:text-white'
                            }`}
                    >
                        <Icon size={16} /> {label}
                    </button>
                ))}
                <button
                    onClick={() => router.push('/match')}
                    className="shrink-0 sm:flex-1 py-3 px-3 md:px-4 rounded-xl font-bold flex items-center justify-center gap-1.5 md:gap-2 transition-all text-xs md:text-sm text-pink-500 hover:bg-gray-800 hover:shadow-lg whitespace-nowrap min-h-[44px]"
                >
                    <Heart size={16} /> {t.modes.match}
                </button>
            </div>
        </div>
    )
})

export default ModeSelector
