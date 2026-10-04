import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
    Loader2, Play, Check, Flag, Video, RotateCcw, EyeOff, AlertTriangle, Sparkles
} from 'lucide-react'
import { PROVIDERS, MOOD_TO_MOVIE_GENRE, MOOD_TO_TV_GENRE } from '@/lib/constants'
import { getTrendingTvShows } from '@/lib/tmdb'
import { useLanguage } from '@/components/LanguageContext'
import { displayTitle, releaseYear, type MediaItem, type MediaType } from '@/types/media'
import { getRegion } from '@/lib/regions'
import type { WatchTarget } from '@/lib/watch-link'

const GENRE_LABELS_TR: Record<string, string> = {
    funny: 'Komedi', scary: 'Korku & Gerilim', emotional: 'Dram & Romantik',
    action: 'Aksiyon & Macera', scifi: 'Bilim Kurgu', crime: 'Suç & Polisiye', relax: 'Belgesel & Yaşam',
    fantasy: 'Fantastik', history: 'Tarih', war: 'Savaş', western: 'Western', music: 'Müzikal', mystery: 'Gizem',
    soap: 'Pembe Dizi', kids: 'Çocuk', reality: 'Reality Show',
    anime: 'Anime', family: 'Aile', doc: 'Belgesel',
    travel: 'Gezi & Doğa', sport: 'Spor', tech: 'Teknoloji', news: 'Gündem', popculture: 'Magazin'
};

const GENRE_LABELS_EN: Record<string, string> = {
    funny: 'Comedy', scary: 'Horror & Thriller', emotional: 'Drama & Romance',
    action: 'Action & Adventure', scifi: 'Sci-Fi', crime: 'Crime & Detective', relax: 'Documentary & Nature',
    fantasy: 'Fantasy', history: 'History', war: 'War', western: 'Western', music: 'Musical', mystery: 'Mystery',
    soap: 'Soap Opera', kids: 'Kids', reality: 'Reality TV',
    anime: 'Anime', family: 'Family', doc: 'Documentary',
    travel: 'Travel & Nature', sport: 'Sports', tech: 'Technology', news: 'Current Affairs', popculture: 'Pop Culture'
};

// YouTube modlarından kalan ya da başka bir türü tekrarlayan anahtarlar Gurme'de gösterilmez
const HIDDEN_GENRES = new Set(['travel', 'sport', 'tech', 'news', 'popculture', 'doc']);

interface TmdbSectionProps {
    tmdbType: MediaType;
    setTmdbType: (t: MediaType) => void;
    platforms: number[];
    togglePlatform: (id: number) => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    showDropdown: boolean;
    searchResults: MediaItem[];
    handleSearchSelect: (show: MediaItem) => void;
    onlyTurkish: boolean;
    setOnlyTurkish: (v: boolean) => void;
    toggleGenre: (id: string) => void;
    selectedGenres: string[];
    fetchTmdbContent: () => void;
    loading: boolean;
    tmdbResult: MediaItem | null;
    openTrailer: () => void;
    watchTarget: WatchTarget | null;
    markAsWatched: () => void;
    onSimilar?: () => void;
    closeDropdown?: () => void;
    aiSuggestions?: MediaItem[];
    setTmdbResult?: (result: MediaItem) => void;
}

export default function TmdbSection({
    tmdbType, setTmdbType, platforms, togglePlatform, searchQuery, setSearchQuery,
    showDropdown, searchResults, handleSearchSelect, onlyTurkish, setOnlyTurkish,
    toggleGenre, selectedGenres, fetchTmdbContent, loading, tmdbResult,
    openTrailer, watchTarget, markAsWatched, onSimilar, closeDropdown, aiSuggestions, setTmdbResult
}: TmdbSectionProps) {
    const { lang, t } = useLanguage()
    const region = getRegion()
    const [trendingShows, setTrendingShows] = useState<MediaItem[]>([]);
    const [activeIndex, setActiveIndex] = useState(-1);
    const searchBoxRef = useRef<HTMLDivElement>(null);
    const resultRef = useRef<HTMLDivElement>(null);

    // Otomatik tamamlama: dışarı tıklayınca kapanır
    useEffect(() => {
        if (!showDropdown) return;
        const onDown = (e: MouseEvent) => {
            if (!searchBoxRef.current?.contains(e.target as Node)) closeDropdown?.();
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [showDropdown, closeDropdown]);

    // Yeni sonuç gelince karta kaydır (önceden ekranın altında kalıp fark edilmiyordu)
    useEffect(() => {
        if (tmdbResult?.id) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [tmdbResult?.id]);

    const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showDropdown || searchResults.length === 0) return;
        if (e.key === 'Escape') { e.preventDefault(); closeDropdown?.(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, searchResults.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
        else if (e.key === 'Enter' && activeIndex >= 0) { e.preventDefault(); handleSearchSelect(searchResults[activeIndex]); }
    };

    useEffect(() => {
        if (tmdbType === 'tv' && trendingShows.length === 0) {
            getTrendingTvShows().then(setTrendingShows);
        }
    }, [tmdbType, trendingShows.length]);

    const genreLabels = lang === 'en' ? GENRE_LABELS_EN : GENRE_LABELS_TR;
    // Platform bilgisi arayüz diline değil bölgeye bağlı (bkz. lib/regions.ts)
    const providerResults = tmdbResult?.['watch/providers']?.results?.[region.tmdbRegion];

    return (
        <div className="flex flex-col items-center mt-8 px-4 animate-in fade-in duration-500">
            <div className="bg-gray-900/80 p-6 rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-800">
                <div className="flex bg-black/40 p-1 rounded-xl mb-6">
                    <button onClick={() => setTmdbType('movie')} className={`flex-1 py-3 rounded-lg font-bold ${tmdbType === 'movie' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}>{t.tmdb.movie}</button>
                    <button onClick={() => setTmdbType('tv')} className={`flex-1 py-3 rounded-lg font-bold ${tmdbType === 'tv' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}>{t.tmdb.tv}</button>
                </div>

                {/* PLATFORM BUTONLARI */}
                <div className="mb-6 flex gap-2 flex-wrap justify-center">
                    {PROVIDERS.map(p => (
                        <button
                            key={p.id}
                            onClick={() => togglePlatform(p.id)}
                            aria-pressed={platforms.includes(p.id)}
                            className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 ${platforms.includes(p.id) ? `${p.color} ring-1 ring-current` : 'border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-500'}`}
                        >
                            {platforms.includes(p.id) && <Check size={12} />}
                            {p.name}
                        </button>
                    ))}
                </div>

                {/* DİZİ ARAMA KUTUSU */}
                {tmdbType === 'tv' && (
                    <div className="mb-6 relative" ref={searchBoxRef}>
                        <input
                            type="text"
                            role="combobox"
                            aria-expanded={showDropdown}
                            aria-controls="tv-suggestions"
                            aria-label={t.tmdb.searchTvPlaceholder}
                            autoComplete="off"
                            placeholder={t.tmdb.searchTvPlaceholder}
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setActiveIndex(-1); }}
                            onKeyDown={onSearchKeyDown}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-red-500 transition-colors text-sm"
                        />
                        {showDropdown && searchResults.length > 0 && (
                            <div id="tv-suggestions" role="listbox" className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden z-20 max-h-60 overflow-y-auto shadow-2xl">
                                {searchResults.map((show, i) => (
                                    <button
                                        key={show.id}
                                        role="option"
                                        aria-selected={i === activeIndex}
                                        onClick={() => handleSearchSelect(show)}
                                        className={`w-full text-left px-4 py-3 hover:bg-gray-700 flex items-center gap-3 transition-colors border-b border-gray-700/50 last:border-0 ${i === activeIndex ? 'bg-gray-700' : ''}`}
                                    >
                                        <div className="w-8 h-12 relative shrink-0 bg-gray-900 rounded overflow-hidden">
                                            {show.poster_path && (
                                                <Image
                                                    src={`https://image.tmdb.org/t/p/w92${show.poster_path}`}
                                                    alt={displayTitle(show)}
                                                    fill
                                                    sizes="32px"
                                                    className="object-cover"
                                                />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-white">{show.name}</p>
                                            <p className="text-xs text-gray-400">{releaseYear(show)}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* TRENDING DİZİLER */}
                {tmdbType === 'tv' && trendingShows.length > 0 && (
                    <div className="mb-6">
                        <p className="text-xs text-gray-400 uppercase font-bold mb-3">{t.tmdb.popularShows}</p>
                        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                            {trendingShows.map((show) => (
                                <button
                                    key={show.id}
                                    onClick={() => handleSearchSelect(show)}
                                    className="shrink-0 flex flex-col items-center w-20 group text-left"
                                >
                                    <div className="w-20 h-28 relative rounded-lg overflow-hidden mb-1 border border-gray-700 group-hover:border-red-500 transition-colors">
                                        {show.poster_path ? (
                                            <Image
                                                src={`https://image.tmdb.org/t/p/w185${show.poster_path}`}
                                                alt={displayTitle(show)}
                                                fill
                                                sizes="80px"
                                                className="object-cover group-hover:scale-105 transition-transform"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-800 flex items-center justify-center text-[10px] text-gray-500 p-1 text-center">{t.common.noImage}</div>
                                        )}
                                    </div>
                                    <p className="text-[11px] font-medium text-gray-300 line-clamp-1 w-full text-center group-hover:text-red-400">{show.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mb-8">
                    <div className="flex justify-between items-center mb-3">
                        <p className="text-xs text-gray-400 uppercase font-bold">{t.tmdb.genresTitle}</p>
                        {tmdbType === 'movie' && (
                            <button
                                onClick={() => setOnlyTurkish(!onlyTurkish)}
                                className={`text-xs font-bold flex items-center gap-1 border px-2 py-1 rounded transition ${onlyTurkish ? 'bg-red-900/50 border-red-500 text-red-400' : 'border-gray-700 text-gray-500'}`}
                            >
                                <Flag size={12} /> {t.tmdb.onlyTurkish}
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(tmdbType === 'movie' ? MOOD_TO_MOVIE_GENRE : MOOD_TO_TV_GENRE).filter(([key]) => !HIDDEN_GENRES.has(key)).map(([key, val]) => (
                            <button
                                key={key}
                                onClick={() => toggleGenre(val)}
                                className={`px-3 py-2 rounded-lg border text-xs md:text-sm font-bold transition-all ${selectedGenres.includes(val) ? 'bg-green-900/50 border-green-500 text-green-400' : 'border-gray-700 text-gray-400'}`}
                            >
                                {selectedGenres.includes(val) && <Check size={12} className="inline mr-1" />} {genreLabels[key] || key}
                            </button>
                        ))}
                    </div>
                </div>

                <button onClick={fetchTmdbContent} disabled={loading} className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black py-4 rounded-full shadow-xl active:scale-95 flex items-center justify-center gap-2 group text-base md:text-lg">
                    {loading ? <Loader2 className="animate-spin mx-auto" /> : <><Play fill="currentColor" className="group-hover:scale-110 transition-transform" /> {t.tmdb.find}</>}
                </button>
            </div>

            {/* AI LISTESİ */}
            {aiSuggestions && aiSuggestions.length > 0 && (
                <div className="w-full max-w-4xl mt-6 animate-in slide-in-from-bottom-4">
                    <p className="text-gray-400 text-sm mb-3 font-bold px-2">{t.tmdb.geminiPicks}</p>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2">
                        {aiSuggestions.map((m) => (
                            <div
                                key={m.id}
                                onClick={() => setTmdbResult && setTmdbResult(m)}
                                className="w-36 shrink-0 bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden cursor-pointer hover:border-purple-500 hover:scale-105 transition-all shadow-lg group"
                            >
                                <div className="h-48 relative bg-gray-800">
                                    {m.poster_path ? (
                                        <Image
                                            src={`https://image.tmdb.org/t/p/w342${m.poster_path}`}
                                            alt={displayTitle(m)}
                                            fill
                                            sizes="144px"
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 text-center p-2">{t.common.noImage}</div>
                                    )}
                                </div>
                                <div className="p-3">
                                    <h4 className="font-bold text-white text-xs truncate group-hover:text-purple-400">{displayTitle(m)}</h4>
                                    <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">⭐ {m.vote_average?.toFixed(1) || '0.0'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TMDB KART (SONUÇ) */}
            {tmdbResult && (
                <div ref={resultRef} className="w-full max-w-4xl mt-8 animate-in slide-in-from-bottom-8 scroll-mt-24">
                    <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col md:flex-row">
                        <div className="md:w-1/3 relative min-h-[350px] md:min-h-[450px] group cursor-pointer" onClick={openTrailer}>
                            {tmdbResult.poster_path ? (
                                <Image
                                    src={`https://image.tmdb.org/t/p/w500${tmdbResult.poster_path}`}
                                    alt={displayTitle(tmdbResult)}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    className="object-cover"
                                    priority
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gray-900" />
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-all">
                                <div className="bg-red-600 text-white p-4 rounded-full shadow-xl scale-90 group-hover:scale-110 transition-transform">
                                    <Play fill="currentColor" size={32} />
                                </div>
                            </div>
                        </div>
                        <div className="p-8 md:w-2/3 relative flex flex-col justify-center">
                            {tmdbResult.fromFallback && <div className="absolute top-0 left-0 w-full bg-yellow-600/20 text-yellow-500 text-xs font-bold p-2 flex items-center gap-2"><AlertTriangle size={12} /> {t.tmdb.fallbackNotice}</div>}

                            {tmdbResult.reason && (
                                <div className="mb-6 bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 p-4 rounded-xl flex gap-3 items-start animate-in fade-in">
                                    <Sparkles className="text-purple-400 shrink-0 mt-1" size={20} />
                                    <div>
                                        <p className="text-purple-300 text-xs font-bold uppercase mb-1">{tmdbResult.reasonSource === 'curator' ? t.ai.dataNote : t.tmdb.sommelierNote}</p>
                                        <p className="text-white text-sm italic font-medium">&quot;{tmdbResult.reason}&quot;</p>
                                    </div>
                                </div>
                            )}

                            <div className="mb-4">
                                <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-2 drop-shadow-lg">{tmdbResult.showName || displayTitle(tmdbResult)}</h2>
                                {tmdbResult.showName && tmdbResult.title && tmdbResult.title !== tmdbResult.showName && (
                                    <p className="text-purple-300 font-semibold text-base md:text-lg mb-1">“{tmdbResult.title}”</p>
                                )}

                                <div className="flex flex-wrap items-center gap-3 mt-2">
                                    <div className="flex items-center gap-1.5 bg-yellow-500/20 px-2 py-1 rounded-md border border-yellow-500/50">
                                        <span className="text-yellow-500 font-black text-xs tracking-wider">TMDB</span>
                                        <span className="text-yellow-400 font-bold">{tmdbResult.vote_average?.toFixed(1) || '0.0'}</span>
                                    </div>

                                    {providerResults?.link && (
                                        <a
                                            href={providerResults.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 bg-yellow-700/20 px-2 py-1 rounded-md border border-yellow-700/50 hover:bg-yellow-700/40 transition-colors"
                                        >
                                            <span className="text-yellow-600 font-black text-xs tracking-wider">JUSTWATCH</span>
                                        </a>
                                    )}

                                    {releaseYear(tmdbResult) && <span className="text-gray-400 text-sm font-medium">{releaseYear(tmdbResult)}</span>}
                                </div>

                                {tmdbResult.season && (
                                    <div className="mt-2 inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1 rounded-full shadow-lg">
                                        <span className="text-white text-xs font-bold">{t.tmdb.season} {tmdbResult.season}</span>
                                        <span className="w-1 h-1 bg-white rounded-full"></span>
                                        <span className="text-white text-xs font-bold">{t.tmdb.episode} {tmdbResult.episode}</span>
                                    </div>
                                )}
                            </div>

                            {/* Providers (Flatrate) */}
                            {providerResults?.flatrate && (
                                <div className="mb-4">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-2 tracking-wider">{t.tmdb.watchOnProvider}</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {providerResults.flatrate.map(p => (
                                            <div key={p.provider_id} className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-700 shadow" title={p.provider_name}>
                                                <Image src={`https://image.tmdb.org/t/p/w92${p.logo_path}`} alt={p.provider_name} fill sizes="32px" className="object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-4 md:line-clamp-6">{tmdbResult.overview || t.common.noOverview}</p>

                            <div className="flex gap-3 mb-4">
                                <button onClick={openTrailer} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"><Video size={18} /> {t.tmdb.trailer}</button>
                                {watchTarget && <a href={watchTarget.url} target="_blank" rel="noopener noreferrer" className="flex-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2"><Play size={18} /> {watchTarget.provider ? t.tmdb.watchOn.replace('{provider}', watchTarget.provider) : t.tmdb.watch}</a>}
                            </div>
                            <div className="flex justify-center gap-4">
                                <button onClick={fetchTmdbContent} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-full flex items-center justify-center gap-2 border border-gray-700 transition-colors"><RotateCcw size={18} /> {t.tmdb.pass}</button>
                                {onSimilar && <button onClick={onSimilar} disabled={loading} className="flex-1 bg-yellow-900/40 hover:bg-yellow-900/60 text-yellow-500 font-bold py-3 rounded-full flex items-center justify-center gap-2 border border-yellow-700/50 transition-colors"><Sparkles size={18} /> {t.tmdb.suggestAnother}</button>}
                                <button onClick={markAsWatched} className="flex-1 bg-green-900/40 hover:bg-green-900/60 text-green-500 font-bold py-3 rounded-full flex items-center justify-center gap-2 border border-green-700/50 transition-colors"><EyeOff size={18} /> {t.tmdb.watched}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
