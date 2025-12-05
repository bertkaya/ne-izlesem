import { Utensils, Film, Sparkles, Flame, Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ModeSelectorProps {
    appMode: 'youtube' | 'tmdb' | 'swipe' | 'ai';
    setAppMode: (mode: 'youtube' | 'tmdb' | 'swipe' | 'ai') => void;
}

export default function ModeSelector({ appMode, setAppMode }: ModeSelectorProps) {
    const router = useRouter()

    return (
        <div className="flex justify-center mt-6 px-4">
            <div className="bg-gray-900 p-1 rounded-2xl border border-gray-800 flex flex-wrap justify-center w-full max-w-xl shadow-lg">
                <button onClick={() => setAppMode('youtube')} className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${appMode === 'youtube' ? 'bg-gray-800 text-yellow-500 shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                    <Utensils size={18} /> Yemek
                </button>
                <button onClick={() => setAppMode('tmdb')} className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${appMode === 'tmdb' ? 'bg-gray-800 text-red-500 shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                    <Film size={18} /> Gurme
                </button>
                <button onClick={() => setAppMode('ai')} className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${appMode === 'ai' ? 'bg-gray-800 text-cyan-400 shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                    <Sparkles size={18} /> Asistan
                </button>
                <button onClick={() => setAppMode('swipe')} className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${appMode === 'swipe' ? 'bg-gray-800 text-purple-500 shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                    <Flame size={18} /> Keşfet
                </button>
                <button onClick={() => router.push('/match')} className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-gray-800 text-pink-500 shadow-lg hover:text-white`}>
                    <Heart size={18} /> Eşleş
                </button>
            </div>
        </div>
    )
}
