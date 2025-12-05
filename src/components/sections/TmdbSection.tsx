import {
    Loader2, Play, Check, Flag, Video, RotateCcw, EyeOff, AlertTriangle
} from 'lucide-react'
import { PROVIDERS, MOOD_TO_MOVIE_GENRE, MOOD_TO_TV_GENRE } from '@/lib/tmdb'

const GENRE_LABELS: Record<string, string> = {
    funny: 'Komedi', scary: 'Korku & Gerilim', emotional: 'Dram & Romantik',
    action: 'Aksiyon & Macera', scifi: 'Bilim Kurgu', crime: 'Suç & Polisiye', relax: 'Belgesel & Yaşam'
};

const POPULAR_SHOWS = [
    { id: 4608, name: 'Gibi' }, { id: 1668, name: 'Friends' }, { id: 1400, name: 'Seinfeld' },
    { id: 2316, name: 'The Office' }, { id: 456, name: 'The Simpsons' }, { id: 62560, name: 'Mr. Robot' },
    { id: 1399, name: 'Game of Thrones' }, { id: 1396, name: 'Breaking Bad' },
];

interface TmdbSectionProps {
    tmdbType: 'movie' | 'tv';
    setTmdbType: (t: 'movie' | 'tv') => void;
    platforms: number[];
    togglePlatform: (id: number) => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    showDropdown: boolean;
    searchResults: any[];
    handleSearchSelect: (show: any) => void;
    onlyTurkish: boolean;
    setOnlyTurkish: (v: boolean) => void;
    toggleGenre: (id: string) => void;
    selectedGenres: string[];
    fetchTmdbContent: () => void;
    loading: boolean;
    tmdbResult: any;
    openTrailer: () => void;
    getWatchLink: () => string;
    markAsWatched: () => void;
    // toggleFavorite: () => void; // Not used in the UI provided in page.tsx except logic, but let's check. 
    // In page.tsx: toggleFavorite is defined but NOT USED in the JSX for TmdbSection? 
    // Let me re-read page.tsx JSX for TmdbSection...
    // It has "Pas Geç" and "İzledim". No favorite button in the Result Card logic in page.tsx lines 386-389.
    // Wait, line 241 defines toggleFavorite, but is it used?
    // Searching page.tsx content...
    // It seems it wasn't used in the main TMDB card in the provided snippet?
    // Let's check the JSX again. 
    // Lines 386-389: RotateCcw (Pas Geç), EyeOff (İzledim). 
    // So toggleFavorite is maybe unused or I missed it.
    // I will skip adding it to props if it's not used.
}

export default function TmdbSection({
    tmdbType, setTmdbType, platforms, togglePlatform, searchQuery, setSearchQuery,
    showDropdown, searchResults, handleSearchSelect, onlyTurkish, setOnlyTurkish,
    toggleGenre, selectedGenres, fetchTmdbContent, loading, tmdbResult,
    openTrailer, getWatchLink, markAsWatched
}: TmdbSectionProps) {
    return (
        <div className="flex flex-col items-center mt-8 px-4 animate-in fade-in duration-500">
            <div className="bg-gray-900/80 p-6 rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-800">
                <div className="flex bg-black/40 p-1 rounded-xl mb-6">
                    <button onClick={() => setTmdbType('movie')} className={`flex-1 py-3 rounded-lg font-bold ${tmdbType === 'movie' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}>Film</button>
                    <button onClick={() => setTmdbType('tv')} className={`flex-1 py-3 rounded-lg font-bold ${tmdbType === 'tv' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}>Dizi</button>
                </div>

                {/* PLATFORM BUTONLARI */}
                <div className="mb-6 flex gap-2 flex-wrap justify-center">
                    {PROVIDERS.map(p => (
                        <button
                            key={p.id}
                            onClick={() => togglePlatform(p.id)}
                            className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all ${platforms.includes(p.id) ? `border-transparent text-white ${p.color}` : 'border-gray-700 text-gray-500 grayscale'}`}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>

                {/* DİZİ ARAMA (AUTOCOMPLETE) */}
                {tmdbType === 'tv' && (
                    <div className="flex flex-col gap-2 mb-6 relative">
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Dizi Ara..."
                            className="bg-gray-800 border border-gray-700 p-3 rounded-xl flex-1 text-white outline-none"
                        />
                        {showDropdown && searchResults.length > 0 && (
                            <ul className="absolute top-full left-0 w-full bg-gray-900 border border-gray-700 rounded-xl mt-1 z-50 shadow-2xl overflow-hidden">
                                {searchResults.map((show) => (
                                    <li key={show.id} onClick={() => handleSearchSelect(show)} className="p-3 hover:bg-gray-800 cursor-pointer text-sm flex items-center gap-3 border-b border-gray-800 last:border-none">
                                        {show.poster_path ? <img src={`https://image.tmdb.org/t/p/w92${show.poster_path}`} className="w-8 h-12 object-cover rounded" /> : <div className="w-8 h-12 bg-gray-800 rounded" />}
                                        <span className="text-gray-300">{show.name}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {/* Popüler Diziler */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mt-2">
                            {POPULAR_SHOWS.map(show => (
                                <button
                                    key={show.id}
                                    onClick={() => handleSearchSelect(show)}
                                    className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-xs whitespace-nowrap hover:bg-gray-700 hover:border-white transition text-gray-400 hover:text-white"
                                >
                                    {show.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mb-8">
                    <div className="flex justify-between items-center mb-3">
                        <p className="text-xs text-gray-400 uppercase font-bold">Türler (Çoklu Seçim)</p>
                        {tmdbType === 'movie' && <button onClick={() => setOnlyTurkish(!onlyTurkish)} className={`text-xs font-bold flex items-center gap-1 border px-2 py-1 rounded ${onlyTurkish ? 'bg-red-900/50 border-red-500 text-red-400' : 'border-gray-700 text-gray-500'}`}><Flag size={12} /> Yerli</button>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(tmdbType === 'movie' ? MOOD_TO_MOVIE_GENRE : MOOD_TO_TV_GENRE).map(([key, val]) => (
                            <button
                                key={key}
                                onClick={() => toggleGenre(val)}
                                className={`px-3 py-2 rounded-lg border text-sm font-bold transition-all ${selectedGenres.includes(val) ? 'bg-green-900/50 border-green-500 text-green-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                            >
                                {selectedGenres.includes(val) && <Check size={12} className="inline mr-1" />} {GENRE_LABELS[key]}
                            </button>
                        ))}
                    </div>
                </div>

                <button onClick={fetchTmdbContent} disabled={loading} className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95">
                    {loading ? <Loader2 className="animate-spin mx-auto" /> : 'BUL'}
                </button>
            </div>

            {/* SONUÇ KARTI */}
            {tmdbResult && (
                <div className="w-full max-w-4xl mt-8 animate-in slide-in-from-bottom-4">
                    <div className="bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-700 flex flex-col md:flex-row">
                        <div className="md:w-1/3 relative h-96 md:h-auto group cursor-pointer" onClick={openTrailer}>
                            <img src={`https://image.tmdb.org/t/p/w500${tmdbResult.poster_path}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-all">
                                <div className="bg-red-600 text-white p-4 rounded-full shadow-xl scale-90 group-hover:scale-110 transition-transform">
                                    <Play fill="currentColor" size={32} />
                                </div>
                            </div>
                        </div>
                        <div className="p-8 md:w-2/3 relative flex flex-col justify-center">
                            {tmdbResult.fromFallback && <div className="absolute top-0 left-0 w-full bg-yellow-600/20 text-yellow-500 text-xs font-bold p-2 flex items-center gap-2"><AlertTriangle size={12} /> Seçtiğin platformda yok, genel öneri.</div>}

                            <h2 className="text-3xl font-black text-white mb-2">{tmdbResult.title || tmdbResult.name}</h2>
                            {/* AÇIKLAMA HER ZAMAN GÖRÜNÜR */}
                            <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-4 md:line-clamp-6">{tmdbResult.overview || 'Özet bilgisi bulunamadı.'}</p>

                            <div className="flex gap-3 mb-4">
                                <button onClick={openTrailer} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"><Video size={18} /> Fragman</button>
                                <button onClick={() => window.open(getWatchLink(), '_blank')} className="flex-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2"><Play size={18} /> İzle</button>
                            </div>
                            <div className="flex justify-center gap-4">
                                <button onClick={fetchTmdbContent} className="text-gray-400 hover:text-white text-sm flex gap-1"><RotateCcw size={14} /> Pas Geç</button>
                                <button onClick={markAsWatched} className="text-gray-400 hover:text-green-400 text-sm flex gap-1"><EyeOff size={14} /> İzledim</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
