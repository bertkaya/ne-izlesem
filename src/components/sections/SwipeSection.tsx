import { Heart } from 'lucide-react'
import MovieSwiper from '@/components/MovieSwiper'

interface SwipeSectionProps {
    swipeType: 'movie' | 'tv';
    setSwipeType: (t: 'movie' | 'tv') => void;
    swipeMovies: any[];
    handleSwipe: (direction: 'left' | 'right', movie: any) => void;
    handleSwipeWatch: (movie: any) => void;
    supabase: any; // Or specific type if available
}

export default function SwipeSection({
    swipeType, setSwipeType, swipeMovies, handleSwipe, handleSwipeWatch, supabase
}: SwipeSectionProps) {
    return (
        <div className="flex flex-col items-center mt-12 px-4 animate-in fade-in">
            <div className="flex bg-black/40 p-1 rounded-xl mb-6">
                <button onClick={() => setSwipeType('movie')} className={`px-6 py-2 rounded-lg font-bold text-sm ${swipeType === 'movie' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}>Film</button>
                <button onClick={() => setSwipeType('tv')} className={`px-6 py-2 rounded-lg font-bold text-sm ${swipeType === 'tv' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}>Dizi</button>
            </div>
            <h2 className="text-2xl font-black mb-6 text-purple-500">Keşfet</h2>
            <MovieSwiper movies={swipeMovies} onSwipe={handleSwipe} onWatch={handleSwipeWatch} />
            <div className="mt-8 flex gap-4">
                <p className="text-gray-400 text-xs flex items-center gap-1"><Heart size={12} /> Beğendiklerin otomatik favorilere ekleniyor</p>
            </div>
        </div>
    )
}
