import { Utensils, Film, Sparkles, Flame, Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { memo } from 'react'

type AppMode = 'youtube' | 'tmdb' | 'swipe' | 'ai'

interface ModeSelectorProps {
    appMode: AppMode;
    setAppMode: (mode: AppMode) => void;
}

const ModeSelector = memo(function ModeSelector({ appMode, setAppMode }: ModeSelectorProps) {
    const router = useRouter()

    const modes = [
        { id: 'youtube' as const, label: 'Yemek', icon: Utensils, color: 'text-yellow-500' },
        { id: 'tmdb' as const, label: 'Gurme', icon: Film, color: 'text-red-500' },
        { id: 'ai' as const, label: 'Asistan', icon: Sparkles, color: 'text-cyan-400' },
        { id: 'swipe' as const, label: 'Keşfet', icon: Flame, color: 'text-purple-500' },
    ]

    return (
        <div className="flex justify-center mt-6 px-4">
            <div className="bg-gray-900 p-1 rounded-2xl border border-gray-800 flex flex-wrap justify-center w-full max-w-xl shadow-lg">
                {modes.map(({ id, label, icon: Icon, color }) => (
                    <button
                        key={id}
                        onClick={() => setAppMode(id)}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${appMode === id ? `bg-gray-800 ${color} shadow-lg` : 'text-gray-500 hover:text-white'
                            }`}
                    >
                        <Icon size={18} /> {label}
                    </button>
                ))}
                <button
                    onClick={() => router.push('/match')}
                    className="flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-gray-800 text-pink-500 shadow-lg hover:text-white"
                >
                    <Heart size={18} /> Eşleş
                </button>
            </div>
        </div>
    )
})

export default ModeSelector
