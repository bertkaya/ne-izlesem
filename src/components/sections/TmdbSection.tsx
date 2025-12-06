import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
    Loader2, Play, Check, Flag, Video, RotateCcw, EyeOff, AlertTriangle, Sparkles
} from 'lucide-react'
import { PROVIDERS, MOOD_TO_MOVIE_GENRE, MOOD_TO_TV_GENRE, getTrendingTvShows } from '@/lib/tmdb'

const GENRE_LABELS: Record<string, string> = {
    funny: 'Komedi', scary: 'Korku & Gerilim', emotional: 'Dram & Romantik',
    action: 'Aksiyon & Macera', scifi: 'Bilim Kurgu', crime: 'Suç & Polisiye', relax: 'Belgesel & Yaşam',
    fantasy: 'Fantastik', history: 'Tarih', war: 'Savaş', western: 'Western', music: 'Müzikal', mystery: 'Gizem',
    soap: 'Pembe Dizi', kids: 'Çocuk', reality: 'Reality Show',
    anime: 'Anime', family: 'Aile', doc: 'Belgesel'
};

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
    onTryAgain?: () => void;
    aiSuggestions?: any[];
    setTmdbResult?: (result: any) => void;
}

export default function TmdbSection({
    tmdbType, setTmdbType, platforms, togglePlatform, searchQuery, setSearchQuery,
    showDropdown, searchResults, handleSearchSelect, onlyTurkish, setOnlyTurkish,
    toggleGenre, selectedGenres, fetchTmdbContent, loading, tmdbResult,
    openTrailer, getWatchLink, markAsWatched, onTryAgain, aiSuggestions, setTmdbResult
}: TmdbSectionProps) {
    const [trendingShows, setTrendingShows] = useState<any[]>([]);

    useEffect(() => {
        if (tmdbType === 'tv' && trendingShows.length === 0) {
            getTrendingTvShows().then(setTrendingShows);
        }
    }, [tmdbType]);

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
                            <ul className="absolute top-full left-0 w-full bg-gray-900 border border-gray-700 rounded-xl mt-1 z-50 shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
                                {searchResults.map((show) => (
                                    <li key={show.id} onClick={() => handleSearchSelect(show)} className="p-3 hover:bg-gray-800 cursor-pointer text-sm flex items-center gap-3 border-b border-gray-800 last:border-none">
                                        <div className="relative w-8 h-12 flex-shrink-0">
                                            {show.poster_path ? (
                                                <Image
                                                    src={`https://image.tmdb.org/t/p/w92${show.poster_path}`}
                                                    alt={show.name}
                                                    fill
                                                    className="object-cover rounded"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gray-800 rounded" />
                                            )}
                                        </div>
                                        <span className="text-gray-300 line-clamp-1">{show.name}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {/* Popüler (Trend) Diziler */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mt-2">
                            {trendingShows.map(show => (
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
                                className={`px-3 py-2 rounded-lg border text-sm font-bold transition-all ${selectedGenres.includes(val) ? 'bg-green-900/50 border-green-500 text-green-400' : 'border-gray-700 text-gray-400'}`}
                            >
                                {selectedGenres.includes(val) && <Check size={12} className="inline mr-1" />} {GENRE_LABELS[key]}
                            </button>
                        ))}
                    </div>
                </div>

                <button onClick={fetchTmdbContent} disabled={loading} className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black py-4 rounded-full shadow-xl active:scale-95 flex items-center justify-center gap-2 group">
                    {loading ? <Loader2 className="animate-spin mx-auto" /> : <><Play fill="currentColor" className="group-hover:scale-110 transition-transform" /> BUL</>}
                </button>
            </div>

            {/* AI LISTESİ */}
            {aiSuggestions && aiSuggestions.length > 0 && (
                <div className="w-full max-w-4xl mt-6 animate-in slide-in-from-bottom-4">
                    <p className="text-gray-400 text-sm mb-3 font-bold px-2">Gemini'nin Seçimleri:</p>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2">
                        {aiSuggestions.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setTmdbResult && setTmdbResult(m)}
                                className={`flex-shrink-0 w-24 md:w-32 group relative rounded-xl overflow-hidden transition-all ${tmdbResult?.id === m.id ? 'ring-2 ring-red-500 scale-105' : 'opacity-70 hover:opacity-100 hover:scale-105'}`}
                            >
                                <div className="relative w-full h-36 md:h-48">
                                    <Image
                                        src={`https://image.tmdb.org/t/p/w300${m.poster_path}`}
                                        alt={m.title || m.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="absolute inset-0 bg-black/60 flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white text-xs font-bold line-clamp-2">{m.title || m.name}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* SONUÇ KARTI */}
            {tmdbResult && (
                <div className="w-full max-w-4xl mt-4 animate-in slide-in-from-bottom-4">
                    <div className="bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-700 flex flex-col md:flex-row">
                        <div className="md:w-1/3 relative h-96 md:h-auto group cursor-pointer" onClick={openTrailer}>
                            <Image
                                src={`https://image.tmdb.org/t/p/w500${tmdbResult.still_path || tmdbResult.poster_path}`}
                                alt={tmdbResult.title || tmdbResult.name}
                                fill
                                className="object-cover"
                                priority
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-all">
                                <div className="bg-red-600 text-white p-4 rounded-full shadow-xl scale-90 group-hover:scale-110 transition-transform">
                                    <Play fill="currentColor" size={32} />
                                </div>
                            </div>
                        </div>
                        <div className="p-8 md:w-2/3 relative flex flex-col justify-center">
                            {tmdbResult.fromFallback && <div className="absolute top-0 left-0 w-full bg-yellow-600/20 text-yellow-500 text-xs font-bold p-2 flex items-center gap-2"><AlertTriangle size={12} /> Seçtiğin platformda yok, genel öneri.</div>}

                            {tmdbResult.reason && (
                                <div className="mb-6 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 p-4 rounded-xl flex gap-3 items-start animate-in fade-in">
                                    <Sparkles className="text-purple-400 shrink-0 mt-1" size={20} />
                                    <div>
                                        <p className="text-purple-300 text-xs font-bold uppercase mb-1">Sommelier'in Notu</p>
                                        <p className="text-white text-sm italic font-medium">"{tmdbResult.reason}"</p>
                                    </div>
                                </div>
                            )}

                            <div className="mb-4">
                                <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-2 drop-shadow-lg">{tmdbResult.title || tmdbResult.name}</h2>
                                {tmdbResult.showName && tmdbResult.showName !== tmdbResult.title && (
                                    <p className="text-purple-400 font-bold text-lg mb-1">{tmdbResult.showName}</p>
                                )}

                                <div className="flex flex-wrap items-center gap-3 mt-2">
                                    {/* IMDB */}
                                    <div className="flex items-center gap-1.5 bg-yellow-500/20 px-2 py-1 rounded-md border border-yellow-500/50">
                                        <span className="text-yellow-500 font-black text-xs tracking-wider">IMBD</span>
                                        <span className="text-yellow-400 font-bold">{tmdbResult.vote_average?.toFixed(1) || '0.0'}</span>
                                    </div>

                                    {/* ROTTEN (Simulated) */}
                                    <div className="flex items-center gap-1.5 bg-red-600/20 px-2 py-1 rounded-md border border-red-600/50">
                                        <span className="text-red-500 font-black text-xs tracking-wider">TOMATO</span>
                                        <span className="text-red-400 font-bold">{Math.round((tmdbResult.vote_average || 0) * 10)}%</span>
                                    </div>

                                    {/* JUSTWATCH LINK */}
                                    {tmdbResult['watch/providers']?.results?.TR?.link && (
                                        <a
                                            href={tmdbResult['watch/providers'].results.TR.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 bg-yellow-700/20 px-2 py-1 rounded-md border border-yellow-700/50 hover:bg-yellow-700/40 transition-colors"
                                        >
                                            <span className="text-yellow-600 font-black text-xs tracking-wider">JUSTWATCH</span>
                                        </a>
                                    )}

                                    {/* Additional Metadata */}
                                    {tmdbResult.release_date && <span className="text-gray-400 text-sm font-medium">{tmdbResult.release_date.split('-')[0]}</span>}
                                    {tmdbResult.first_air_date && <span className="text-gray-400 text-sm font-medium">{tmdbResult.first_air_date.split('-')[0]}</span>}
                                </div>

                                {tmdbResult.season && (
                                    <div className="mt-2 inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1 rounded-full shadow-lg">
                                        <span className="text-white text-xs font-bold">SEZON {tmdbResult.season}</span>
                                        <span className="w-1 h-1 bg-white rounded-full"></span>
                                        <span className="text-white text-xs font-bold">BÖLÜM {tmdbResult.episode}</span>
                                    </div>
                                )}
                            </div>

                            {/* Providers (Şurada İzle - Flatrate) */}
                            {tmdbResult['watch/providers']?.results?.TR?.flatrate && (
                                <div className="mb-4">
                                    <p className="text-[10px] text-gray-500 font-black mb-2 uppercase tracking-widest">ABONELİK İLE İZLE</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {tmdbResult['watch/providers'].results.TR.flatrate.map((p: any) => (
                                            <div key={p.provider_id} className="relative group w-10 h-10" title={p.provider_name}>
                                                <Image
                                                    src={`https://image.tmdb.org/t/p/original${p.logo_path}`}
                                                    alt={p.provider_name}
                                                    fill
                                                    className="object-cover rounded-lg shadow-md ring-1 ring-white/10"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Rent Options */}
                            {tmdbResult['watch/providers']?.results?.TR?.rent && (
                                <div className="mb-4">
                                    <p className="text-[10px] text-blue-400 font-black mb-2 uppercase tracking-widest">KİRALA</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {tmdbResult['watch/providers'].results.TR.rent.map((p: any) => (
                                            <div key={p.provider_id} className="relative group w-10 h-10" title={p.provider_name}>
                                                <Image
                                                    src={`https://image.tmdb.org/t/p/original${p.logo_path}`}
                                                    alt={p.provider_name}
                                                    fill
                                                    className="object-cover rounded-lg shadow-md ring-1 ring-blue-500/30"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Buy Options */}
                            {tmdbResult['watch/providers']?.results?.TR?.buy && (
                                <div className="mb-4">
                                    <p className="text-[10px] text-green-400 font-black mb-2 uppercase tracking-widest">SATIN AL</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {tmdbResult['watch/providers'].results.TR.buy.map((p: any) => (
                                            <div key={p.provider_id} className="relative group w-10 h-10" title={p.provider_name}>
                                                <Image
                                                    src={`https://image.tmdb.org/t/p/original${p.logo_path}`}
                                                    alt={p.provider_name}
                                                    fill
                                                    className="object-cover rounded-lg shadow-md ring-1 ring-green-500/30"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-4 md:line-clamp-6">{tmdbResult.overview || 'Özet bilgisi bulunamadı.'}</p>

                            <div className="flex gap-3 mb-4">
                                <button onClick={openTrailer} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"><Video size={18} /> Fragman</button>
                                <button onClick={() => window.open(getWatchLink(), '_blank')} className="flex-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2"><Play size={18} /> İzle</button>
                            </div>
                            <div className="flex justify-center gap-4">
                                <button onClick={fetchTmdbContent} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-full flex items-center justify-center gap-2 border border-gray-700 transition-colors"><RotateCcw size={18} /> Pas Geç</button>
                                {onTryAgain && <button onClick={onTryAgain} className="flex-1 bg-yellow-900/40 hover:bg-yellow-900/60 text-yellow-500 font-bold py-3 rounded-full flex items-center justify-center gap-2 border border-yellow-700/50 transition-colors"><RotateCcw size={18} /> Başka Öner</button>}
                                <button onClick={markAsWatched} className="flex-1 bg-green-900/40 hover:bg-green-900/60 text-green-500 font-bold py-3 rounded-full flex items-center justify-center gap-2 border border-green-700/50 transition-colors"><EyeOff size={18} /> İzledim</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
