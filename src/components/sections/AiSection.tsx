import { useState } from 'react'
import Image from 'next/image'
import {
    Loader2, Zap, Smile, Brain, Trophy, Sparkles, Play, Video,
    Star, Calendar, Info, AlertTriangle
} from 'lucide-react'
import { useLanguage } from '@/components/LanguageContext'
import { displayTitle, releaseYear, type MediaItem } from '@/types/media'
import type { WatchTarget } from '@/lib/watch-link'

interface AiSectionProps {
    fetchAiRecommendation: (overridePrompt?: string) => void;
    loading: boolean;
    aiSuggestions?: MediaItem[];
    selectedMovie?: MediaItem | null;
    setSelectedMovie?: (movie: MediaItem) => void;
    openTrailer?: () => void;
    watchTarget?: WatchTarget | null;
}

const CATEGORY_ICONS = [
    <Smile key="smile" size={18} className="text-yellow-400" />,
    <Zap key="zap" size={18} className="text-blue-400" />,
    <Trophy key="trophy" size={18} className="text-purple-400" />,
    <Brain key="brain" size={18} className="text-green-400" />
];

export default function AiSection({
    fetchAiRecommendation, loading, aiSuggestions = [],
    selectedMovie, setSelectedMovie, openTrailer, watchTarget
}: AiSectionProps) {
    const { t } = useLanguage()
    const [inputValue, setInputValue] = useState('')

    const handleSearch = () => {
        if (inputValue.trim()) {
            fetchAiRecommendation(inputValue.trim());
            setInputValue('');
        }
    };

    const activeMovie = selectedMovie || (aiSuggestions.length > 0 ? aiSuggestions[0] : null);
    const activeYear = activeMovie ? releaseYear(activeMovie) : undefined;
    const isAiReason = activeMovie?.reasonSource !== 'curator';

    return (
        <div className="flex flex-col items-center mt-6 px-4 animate-in fade-in duration-500 w-full max-w-5xl mx-auto pb-24">
            {/* BAŞLIK */}
            <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold mb-3 shadow-sm">
                    <Sparkles size={14} className="text-cyan-300" />
                    <span>{t.ai.badge}</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black mb-2 bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent drop-shadow-lg">
                    {t.ai.title}
                </h2>
                <p className="text-gray-400 text-sm md:text-base max-w-md mx-auto">
                    {t.ai.subtitle}
                </p>
            </div>

            {/* ARAMA ÇUBUĞU */}
            <div className="w-full max-w-xl mx-auto mb-8 flex gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder={t.ai.placeholder}
                    className="flex-1 bg-gray-900/90 border border-gray-700 text-white px-4 py-3.5 rounded-2xl outline-none focus:border-cyan-500 transition-colors placeholder:text-gray-500 text-sm shadow-xl"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearch();
                    }}
                    disabled={loading}
                />
                <button
                    onClick={handleSearch}
                    disabled={loading || !inputValue.trim()}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-6 py-3.5 rounded-2xl transition-all active:scale-95 text-sm shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <span>{t.ai.askButton}</span>}
                </button>
            </div>

            {/* YÜKLENİYOR DURUMU (ŞIK VE ASLA DONMAYAN INLINE KART) */}
            {loading && (
                <div className="w-full max-w-2xl bg-gradient-to-r from-cyan-950/40 via-gray-900 to-blue-950/40 border border-cyan-500/30 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-md mb-8 animate-in fade-in">
                    <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 animate-ping"></div>
                        <Loader2 size={40} className="text-cyan-400 animate-spin" />
                    </div>
                    <h3 className="text-white font-bold text-lg mb-1">{t.ai.thinking}</h3>
                    <p className="text-xs text-gray-400">
                        {t.ai.analyzing}
                    </p>
                </div>
            )}

            {/* SOMMELIER ÖNERİ LİSTESİ (VARSA DOĞRUDAN BURADA GÖSTERİLİR) */}
            {!loading && aiSuggestions.length > 0 && activeMovie && (
                <div className="w-full max-w-4xl mb-12 animate-in slide-in-from-bottom-6">
                    <div className="flex justify-between items-center mb-4 px-2">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">🍷</span>
                            <h3 className="text-lg md:text-xl font-bold text-white">
                                {t.ai.curatedTitle}
                            </h3>
                        </div>
                        <span className="text-xs text-cyan-400 font-semibold bg-cyan-950/60 border border-cyan-700/40 px-3 py-1 rounded-full">
                            {aiSuggestions.length} {t.ai.picks}
                        </span>
                    </div>

                    {/* VİTRİN FİLM KARTI */}
                    <div className="bg-gradient-to-br from-gray-900 via-gray-900/90 to-black rounded-3xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col md:flex-row mb-6">
                        <div className="md:w-1/3 relative min-h-[360px] md:min-h-[460px] bg-gray-950">
                            {activeMovie.poster_path ? (
                                <Image
                                    src={`https://image.tmdb.org/t/p/w500${activeMovie.poster_path}`}
                                    alt={displayTitle(activeMovie)}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    priority
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">{t.common.noImage}</div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent md:hidden" />
                        </div>

                        <div className="p-6 md:p-8 md:w-2/3 flex flex-col justify-center">
                            {activeMovie.fromFallback && (
                                <div className="mb-3 text-yellow-500 text-xs font-bold flex items-center gap-2">
                                    <AlertTriangle size={12} /> {t.tmdb.fallbackNotice}
                                </div>
                            )}

                            {/* GEREKÇE: AI notu (italik alıntı) ya da TMDB verisinden üretilmiş açıklama */}
                            {activeMovie.reason && (
                                <div className={`mb-4 p-4 rounded-2xl flex gap-3 items-start shadow-lg border ${isAiReason ? 'bg-gradient-to-r from-purple-950/60 to-blue-950/60 border-purple-500/40' : 'bg-gray-900/80 border-cyan-700/40'}`}>
                                    {isAiReason
                                        ? <Sparkles className="text-purple-400 shrink-0 mt-0.5" size={20} />
                                        : <Info className="text-cyan-400 shrink-0 mt-0.5" size={20} />}
                                    <div>
                                        <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isAiReason ? 'text-purple-300' : 'text-cyan-300'}`}>
                                            {isAiReason ? t.ai.tastingNote : t.ai.dataNote}
                                        </p>
                                        <p className={`text-white text-sm font-medium leading-relaxed ${isAiReason ? 'italic' : ''}`}>
                                            {isAiReason ? <>&ldquo;{activeMovie.reason}&rdquo;</> : activeMovie.reason}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <h3 className="text-2xl md:text-4xl font-black text-white leading-tight mb-2 drop-shadow-md">
                                {displayTitle(activeMovie)}
                            </h3>

                            <div className="flex items-center gap-3 mb-4 flex-wrap">
                                <div className="flex items-center gap-1.5 bg-yellow-500/20 px-2.5 py-1 rounded-lg border border-yellow-500/40">
                                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                    <span className="text-yellow-300 font-bold text-xs">{activeMovie.vote_average?.toFixed(1) || '0.0'}</span>
                                </div>

                                {activeYear && (
                                    <div className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg border border-white/15 text-xs text-gray-300 font-medium">
                                        <Calendar size={13} />
                                        <span>{activeYear}</span>
                                    </div>
                                )}
                            </div>

                            <p className="text-gray-300 text-xs md:text-sm leading-relaxed mb-6 line-clamp-3 md:line-clamp-4">
                                {activeMovie.overview || t.common.noOverview}
                            </p>

                            <div className="flex gap-3 flex-wrap">
                                {openTrailer && (
                                    <button
                                        onClick={openTrailer}
                                        className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 border border-gray-700 transition text-sm shadow-md"
                                    >
                                        <Video size={16} className="text-red-400" />
                                        <span>{t.tmdb.trailer}</span>
                                    </button>
                                )}

                                {watchTarget && (
                                    <a
                                        href={watchTarget.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 bg-white hover:bg-gray-200 text-black font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition text-sm shadow-lg"
                                    >
                                        <Play size={16} fill="currentColor" />
                                        <span>{watchTarget.provider ? t.tmdb.watchOn.replace('{provider}', watchTarget.provider) : t.tmdb.watch}</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* DİĞER ÖNERİLER ÇUBUĞU / GALERİ */}
                    <p className="text-xs text-gray-400 uppercase font-bold px-1 mb-3">
                        {t.ai.allPicks}
                    </p>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {aiSuggestions.map((m, idx) => {
                            const isSelected = activeMovie?.id === m.id;
                            return (
                                <button
                                    key={m.id || idx}
                                    onClick={() => setSelectedMovie && setSelectedMovie(m)}
                                    className={`shrink-0 w-28 text-left rounded-2xl overflow-hidden border transition-all p-1.5 ${isSelected ? 'bg-cyan-950/60 border-cyan-400 shadow-lg shadow-cyan-500/20 scale-105' : 'bg-gray-900/80 border-gray-800 hover:border-gray-700 opacity-80 hover:opacity-100'}`}
                                >
                                    <div className="w-full h-36 relative rounded-xl overflow-hidden mb-1.5 bg-gray-800">
                                        {m.poster_path ? (
                                            <Image
                                                src={`https://image.tmdb.org/t/p/w185${m.poster_path}`}
                                                alt={displayTitle(m)}
                                                fill
                                                sizes="112px"
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500 text-center p-1">{t.common.noImage}</div>
                                        )}
                                    </div>
                                    <p className="text-[11px] font-bold text-white line-clamp-1">{displayTitle(m)}</p>
                                    <p className="text-[10px] text-yellow-400">⭐ {m.vote_average?.toFixed(1) || '0.0'}</p>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* MOOD CHIPS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                {t.ai.moodCategories.map((category, idx) => (
                    <div key={idx} className="bg-gray-900/60 p-5 rounded-3xl border border-gray-800 backdrop-blur-sm shadow-xl">
                        <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
                            {CATEGORY_ICONS[idx % CATEGORY_ICONS.length]}
                            <h3 className="text-white font-bold text-base md:text-lg">{category.title}</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                            {category.chips.map((chip, i) => (
                                <button
                                    key={i}
                                    onClick={() => fetchAiRecommendation(chip)}
                                    disabled={loading}
                                    className="bg-gray-800/90 hover:bg-cyan-950/40 hover:border-cyan-500/50 hover:text-cyan-300 active:scale-95 border border-gray-700/80 px-3 py-3 rounded-2xl text-xs md:text-sm font-medium transition-all text-gray-300 shadow-sm text-center"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
