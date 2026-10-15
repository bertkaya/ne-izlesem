'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
    Globe, Loader2, Play, RotateCcw, EyeOff, AlertTriangle, Repeat,
    Volume2, VolumeX, ExternalLink, Timer, Tv, Moon, Sun,
    Flame, Utensils, Youtube, Search, X,
    Laugh, PawPrint, Leaf, Brain, Clapperboard, Plane, Trophy, Cpu, Newspaper, Music, Sparkles,
    Cookie, Soup, Drumstick, type LucideIcon
} from 'lucide-react'
import { useLanguage } from '@/components/LanguageContext'
import { useMealTimer, formatTimer } from '@/hooks/useMealTimer'
import { cleanDescription, formatDuration } from '@/lib/youtube-utils'
import type { YoutubeVideo } from '@/types/media'

// Emoji yerine sitenin geri kalanıyla aynı ikon seti (lucide)
const YOUTUBE_MOODS: { id: string; labelTr: string; labelEn: string; icon: LucideIcon }[] = [
    { id: 'funny', labelTr: 'Güldür', labelEn: 'Laughs', icon: Laugh },
    { id: 'eat', labelTr: 'Birlikte Ye', labelEn: 'Eat Together', icon: Utensils },
    { id: 'classic', labelTr: 'Klasikler', labelEn: 'Classics', icon: Tv },
    { id: 'pets', labelTr: 'Evcil Dostlar', labelEn: 'Cute Pets', icon: PawPrint },
    { id: 'relax', labelTr: 'Rahatla', labelEn: 'Chill & Relax', icon: Leaf },
    { id: 'learn', labelTr: 'Öğren', labelEn: 'Learn & Doc', icon: Brain },
    { id: 'drama', labelTr: 'Hikaye', labelEn: 'Stories', icon: Clapperboard },
    { id: 'travel', labelTr: 'Gezi & Tatil', labelEn: 'Travel & Vlog', icon: Plane },
    { id: 'sport', labelTr: 'Spor', labelEn: 'Sports', icon: Trophy },
    { id: 'tech', labelTr: 'Teknoloji', labelEn: 'Tech & Gadgets', icon: Cpu },
    { id: 'news', labelTr: 'Gündem', labelEn: 'Deep Dives', icon: Newspaper },
    { id: 'music', labelTr: 'Müzik', labelEn: 'Music & Lofi', icon: Music },
    { id: 'popculture', labelTr: 'Magazin', labelEn: 'Pop Culture', icon: Sparkles }
];

const MOOD_COLORS: Record<string, string> = {
    funny: 'bg-blue-500/20 text-blue-400 border-blue-500',
    eat: 'bg-orange-500/20 text-orange-400 border-orange-500',
    classic: 'bg-purple-500/20 text-purple-400 border-purple-500',
    pets: 'bg-green-500/20 text-green-400 border-green-500',
    relax: 'bg-teal-500/20 text-teal-400 border-teal-500',
    learn: 'bg-indigo-500/20 text-indigo-400 border-indigo-500',
    drama: 'bg-pink-500/20 text-pink-400 border-pink-500',
    travel: 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
    sport: 'bg-red-500/20 text-red-400 border-red-500',
    tech: 'bg-cyan-500/20 text-cyan-400 border-cyan-500',
    news: 'bg-zinc-500/20 text-zinc-400 border-zinc-500',
    music: 'bg-rose-500/20 text-rose-400 border-rose-500',
    popculture: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500'
};

interface YoutubeSectionProps {
    ytVideo: YoutubeVideo | null;
    loading: boolean;
    duration: string;
    setDuration: (d: string) => void;
    mood: string;
    setMood: (m: string) => void;
    ytLang: 'native' | 'all';
    setYtLang: (l: 'native' | 'all') => void;
    fetchYoutubeVideo: () => void;
    markYoutubeWatched: () => void;
    handleReport: () => void;
    fetchSurpriseVideo?: () => void;
    fetchMoreFromChannel?: (channelId?: string) => void;
    // "YouTube'da ara"
    searchResults?: YoutubeVideo[];
    searching?: boolean;
    searchError?: string | null;
    searchYoutube?: (query: string) => void;
    playVideo?: (video: YoutubeVideo) => void;
    clearSearch?: () => void;
    popular?: YoutubeVideo[];
}

export default function YoutubeSection({
    ytVideo, loading, duration, setDuration, mood, setMood, ytLang, setYtLang,
    fetchYoutubeVideo, markYoutubeWatched, handleReport, fetchSurpriseVideo, fetchMoreFromChannel,
    searchResults = [], searching = false, searchError, searchYoutube, playVideo, clearSearch, popular = []
}: YoutubeSectionProps) {
    const { lang, t } = useLanguage()
    const [autoPlay, setAutoPlay] = useState(true);
    const [autoNext, setAutoNext] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [cinemaMode, setCinemaMode] = useState(false);

    // Yemek sayacı: bitiş zamanı saklanır, sekme değişince kaybolmaz (bkz. useMealTimer)
    const { remaining: timerRemaining, start: startTimer, stop: stopTimer } = useMealTimer();
    const formatTime = formatTimer;
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        if (autoNext && !ytVideo && !loading) {
            fetchYoutubeVideo();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoNext, ytVideo, loading]);

    const durationLabel: Record<string, string> = { snack: t.youtube.snack, meal: t.youtube.meal, feast: t.youtube.feast };
    const videoId = ytVideo?.videoId || (ytVideo?.url ? ytVideo.url.match(/v=([^&]+)/)?.[1] : null);
    const youtubeDirectUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : ytVideo?.url;

    return (
        <div className={`flex flex-col items-center mt-6 px-4 animate-in fade-in duration-500 w-full transition-all ${cinemaMode ? 'relative z-50' : ''}`}>
            {cinemaMode && (
                <div
                    onClick={() => setCinemaMode(false)}
                    className="fixed inset-0 bg-black/90 backdrop-blur-md z-40 cursor-pointer transition-opacity"
                    title={t.youtube.lightsOn}
                />
            )}

            {/* BAŞLIK: bu mod YouTube videoları öneriyor */}
            <div className="w-full max-w-2xl mb-4 z-10 flex items-center gap-3">
                <span className="p-2.5 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-900/40 shrink-0">
                    <Youtube size={22} />
                </span>
                <div className="min-w-0">
                    <h2 className="text-lg md:text-xl font-black text-white leading-tight">{t.youtube.sectionTitle}</h2>
                    <p className="text-xs md:text-sm text-gray-400">{t.youtube.sectionSub}</p>
                </div>
            </div>

            {/* YOUTUBE'DA ARA */}
            {searchYoutube && (
                <div className={`w-full max-w-2xl mb-4 z-10 ${cinemaMode ? 'opacity-30 pointer-events-none' : ''}`}>
                    <form
                        role="search"
                        onSubmit={(e) => { e.preventDefault(); searchYoutube(searchText) }}
                        className="flex gap-2"
                    >
                        <label htmlFor="yt-search" className="sr-only">{t.youtube.searchLabel}</label>
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            <input
                                id="yt-search"
                                type="search"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Escape') { setSearchText(''); clearSearch?.() } }}
                                placeholder={t.youtube.searchPlaceholder}
                                className="w-full bg-gray-900/90 border border-gray-700 focus:border-red-500 text-white pl-10 pr-4 py-3 rounded-2xl outline-none text-sm transition-colors placeholder:text-gray-500 min-h-[44px]"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={searching || searchText.trim().length < 2}
                            className="btn-primary font-bold px-5 rounded-2xl text-sm flex items-center gap-2 min-h-[44px] transition"
                        >
                            {searching ? <Loader2 size={16} className="animate-spin" /> : <Youtube size={16} />}
                            <span className="hidden sm:inline">{t.youtube.searchButton}</span>
                        </button>
                    </form>

                    {searchError && <p className="text-xs text-gray-400 mt-2 px-1">{searchError}</p>}

                    {searchResults.length > 0 && (
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-2 px-1">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.youtube.searchResults}</p>
                                <button onClick={() => { setSearchText(''); clearSearch?.() }} className="text-xs text-gray-400 hover:text-white flex items-center gap-1 min-h-[32px] px-2">
                                    <X size={14} /> {t.common.close}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {searchResults.map(v => (
                                    <button
                                        key={String(v.id)}
                                        onClick={() => { playVideo?.(v); window.scrollTo({ top: document.getElementById('yt-player')?.offsetTop ?? 0, behavior: 'smooth' }) }}
                                        className={`text-left bg-gray-900/80 border rounded-2xl overflow-hidden hover:border-red-500/60 transition group ${ytVideo?.id === v.id ? 'border-red-500' : 'border-gray-800'}`}
                                    >
                                        <div className="relative aspect-video bg-gray-800">
                                            {v.thumbnail && <Image src={v.thumbnail} alt="" fill sizes="(max-width: 640px) 50vw, 220px" className="object-cover" />}
                                            {v.durationSeconds ? (
                                                <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[11px] font-semibold px-1.5 py-0.5 rounded tabular-nums">{formatDuration(v.durationSeconds)}</span>
                                            ) : null}
                                        </div>
                                        <div className="p-2.5">
                                            <p className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-red-300">{v.title}</p>
                                            {v.channelTitle && <p className="text-[11px] text-gray-400 mt-1 truncate">{v.channelTitle}</p>}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* YEMEK SAYACI (MEAL TIMER) */}
            <div className="w-full max-w-2xl mb-4 z-10">
                <div className="bg-gradient-to-r from-orange-950/40 via-gray-900/80 to-purple-950/40 border border-orange-500/20 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <span className="p-2 bg-orange-500/20 text-orange-400 rounded-xl">
                            <Utensils size={18} />
                        </span>
                        <div>
                            <p className="text-xs font-bold text-gray-300">{t.youtube.mealTimerTitle}</p>
                            <p className="text-[11px] text-gray-500">
                                {timerRemaining !== null
                                    ? timerRemaining === 0
                                        ? t.youtube.mealTimerDone
                                        : `${t.youtube.mealTimerRemaining} ${formatTime(timerRemaining)}`
                                    : t.youtube.mealTimerPrompt}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                        {timerRemaining === null ? (
                            <>
                                {[10, 15, 20].map((mins) => (
                                    <button
                                        key={mins}
                                        onClick={() => startTimer(mins)}
                                        className="text-xs font-semibold px-2.5 py-1.5 bg-gray-800 hover:bg-orange-600/30 hover:text-orange-400 border border-gray-700 hover:border-orange-500/40 rounded-lg transition text-gray-300"
                                    >
                                        {mins} {t.youtube.minuteShort}
                                    </button>
                                ))}
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className={`font-mono font-bold text-sm px-3 py-1 rounded-lg border ${timerRemaining < 60 ? 'bg-red-500/20 text-red-400 border-red-500 animate-pulse' : 'bg-orange-500/20 text-orange-400 border-orange-500/40'}`}>
                                    ⏱️ {formatTime(timerRemaining)}
                                </span>
                                <button
                                    onClick={stopTimer}
                                    className="text-xs text-gray-400 hover:text-white px-2 py-1 bg-gray-800 rounded border border-gray-700"
                                >
                                    {t.youtube.reset}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* SEÇİM KARTI */}
            <div className={`bg-gray-900/80 p-6 rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-800 mb-6 transition-all ${cinemaMode ? 'opacity-30 pointer-events-none scale-95' : ''}`}>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <Timer size={14} className="text-yellow-500" />
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{t.youtube.durationTitle}</p>
                    </div>
                    <button
                        onClick={() => setYtLang(ytLang === 'native' ? 'all' : 'native')}
                        aria-pressed={ytLang === 'native'}
                        className="text-xs font-bold flex items-center gap-1.5 px-3.5 py-2 min-h-[36px] bg-gray-800 border border-gray-700 rounded-full text-gray-300 hover:text-white hover:border-gray-500 transition"
                    >
                        <Globe size={13} /> {ytLang === 'native' ? t.youtube.langFilterNative : t.youtube.langFilterAll}
                    </button>
                </div>

                {/* SÜRE BUTONLARI */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                    <button
                        onClick={() => setDuration('snack')}
                        className={`p-3 rounded-xl text-sm font-bold border flex flex-col items-center justify-center gap-1 transition-all ${duration === 'snack' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500 shadow-lg shadow-yellow-500/10' : 'bg-gray-800/80 border-transparent text-gray-400 hover:bg-gray-800'}`}
                    >
                        <span className="flex items-center gap-1.5"><Cookie size={15} /> {t.youtube.snack}</span>
                        <span className="text-[10px] opacity-70 font-normal">{t.youtube.snackSub}</span>
                    </button>
                    <button
                        onClick={() => setDuration('meal')}
                        className={`p-3 rounded-xl text-sm font-bold border flex flex-col items-center justify-center gap-1 transition-all ${duration === 'meal' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500 shadow-lg shadow-yellow-500/10' : 'bg-gray-800/80 border-transparent text-gray-400 hover:bg-gray-800'}`}
                    >
                        <span className="flex items-center gap-1.5"><Soup size={15} /> {t.youtube.meal}</span>
                        <span className="text-[10px] opacity-70 font-normal">{t.youtube.mealSub}</span>
                    </button>
                    <button
                        onClick={() => setDuration('feast')}
                        className={`p-3 rounded-xl text-sm font-bold border flex flex-col items-center justify-center gap-1 transition-all ${duration === 'feast' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500 shadow-lg shadow-yellow-500/10' : 'bg-gray-800/80 border-transparent text-gray-400 hover:bg-gray-800'}`}
                    >
                        <span className="flex items-center gap-1.5"><Drumstick size={15} /> {t.youtube.feast}</span>
                        <span className="text-[10px] opacity-70 font-normal">{t.youtube.feastSub}</span>
                    </button>
                </div>

                {/* MOD SEÇİMİ */}
                <div className="flex items-center justify-between mb-3">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{t.youtube.moodTitle}</p>
                    <span className="text-[11px] text-gray-500">{t.youtube.moodSub}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                    {YOUTUBE_MOODS.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setMood(m.id)}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl text-xs md:text-sm font-bold border transition-all ${mood === m.id ? `${MOOD_COLORS[m.id]} shadow-md` : 'bg-gray-800/80 border-transparent text-gray-400 hover:text-gray-200'}`}
                        >
                            <m.icon size={15} aria-hidden="true" /> {lang === 'en' ? m.labelEn : m.labelTr}
                        </button>
                    ))}
                </div>

                {/* AYARLAR */}
                <div className="flex gap-2 mb-6 justify-center flex-wrap">
                    <button
                        onClick={() => setAutoPlay(!autoPlay)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${autoPlay ? 'bg-green-500/20 text-green-400 border-green-500' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                    >
                        <Play size={13} /> {autoPlay ? t.youtube.autoPlay : t.youtube.autoPlayOff}
                    </button>
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${!isMuted ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                    >
                        {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />} {isMuted ? t.youtube.muteOn : t.youtube.muteOff}
                    </button>
                    <button
                        onClick={() => setAutoNext(!autoNext)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${autoNext ? 'bg-purple-500/20 text-purple-400 border-purple-500' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                    >
                        <Repeat size={13} /> {t.youtube.tvMode}
                    </button>
                </div>

                {/* BAŞLATMA BUTONLARI */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => fetchYoutubeVideo()}
                        disabled={loading}
                        className="flex-1 btn-primary font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all text-base md:text-lg group"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <>
                                <Play fill="currentColor" size={20} className="group-hover:scale-110 transition-transform" />
                                <span>{t.youtube.findAndWatch}</span>
                            </>
                        )}
                    </button>

                    {fetchSurpriseVideo && (
                        <button
                            onClick={() => fetchSurpriseVideo()}
                            disabled={loading}
                            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-bold px-6 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all text-sm group shrink-0"
                        >
                            <Flame className="text-yellow-300 group-hover:scale-110 transition-transform" size={18} />
                            <span>{t.youtube.surpriseMe}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* ŞU AN POPÜLER: ekran ilk açıldığında boş kalmasın */}
            {!ytVideo && !loading && searchResults.length === 0 && popular.length > 0 && playVideo && (
                <section className="w-full max-w-3xl mt-2" aria-labelledby="yt-popular">
                    <h3 id="yt-popular" className="text-sm font-bold text-gray-300 mb-3 px-1 flex items-center gap-2">
                        <Flame size={16} className="text-red-500" /> {t.youtube.popularTitle}
                    </h3>
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                        {popular.map(v => (
                            <button
                                key={String(v.id)}
                                onClick={() => playVideo(v)}
                                className="snap-start shrink-0 w-56 text-left bg-gray-900/80 border border-gray-800 hover:border-red-500/60 rounded-2xl overflow-hidden transition group"
                            >
                                <div className="relative aspect-video bg-gray-800">
                                    {v.thumbnail && <Image src={v.thumbnail} alt="" fill sizes="224px" className="object-cover" />}
                                    {v.durationSeconds ? (
                                        <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[11px] font-semibold px-1.5 py-0.5 rounded tabular-nums">{formatDuration(v.durationSeconds)}</span>
                                    ) : null}
                                </div>
                                <div className="p-2.5">
                                    <p className="text-xs font-bold text-white line-clamp-2 leading-snug group-hover:text-red-300">{v.title}</p>
                                    {v.channelTitle && <p className="text-[11px] text-gray-400 mt-1 truncate">{v.channelTitle}</p>}
                                </div>
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {/* VİDEO YÜKLENİRKEN İSKELET */}
            {loading && !ytVideo && (
                <div className="w-full max-w-3xl mt-2" aria-hidden="true">
                    <div className="aspect-video rounded-3xl skeleton" />
                    <div className="p-5 space-y-3">
                        <div className="h-5 w-3/4 rounded-lg skeleton" />
                        <div className="flex gap-2"><div className="h-6 w-32 rounded-lg skeleton" /><div className="h-6 w-24 rounded-lg skeleton" /></div>
                    </div>
                </div>
            )}

            {/* OYNATICI VE KART */}
            {ytVideo && (
                <div id="yt-player" className={`w-full max-w-3xl mt-2 animate-in slide-in-from-bottom-4 transition-all scroll-mt-24 ${cinemaMode ? 'z-50 scale-105 shadow-2xl' : ''}`}>
                    <div className="flex justify-between items-center mb-2 px-2">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-xs font-semibold text-gray-300">{t.youtube.companionReady}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCinemaMode(!cinemaMode)}
                                className={`text-xs font-bold px-3 py-1 rounded-lg border flex items-center gap-1.5 transition ${cinemaMode ? 'bg-yellow-500 text-black border-yellow-400' : 'bg-gray-800 text-gray-300 border-gray-700 hover:text-white'}`}
                            >
                                {cinemaMode ? <Sun size={13} /> : <Moon size={13} />}
                                {cinemaMode ? t.youtube.lightsOn : t.youtube.lightsOut}
                            </button>

                            {youtubeDirectUrl && (
                                <a
                                    href={youtubeDirectUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-bold px-3 py-1 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 rounded-lg flex items-center gap-1 transition"
                                >
                                    <span>{t.youtube.openYoutube}</span>
                                    <ExternalLink size={12} />
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="bg-black rounded-3xl overflow-hidden shadow-2xl border border-gray-800 aspect-video relative">
                        <iframe
                            key={`${videoId || 'video'}-${autoPlay}-${isMuted}`}
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=${autoPlay ? 1 : 0}&mute=${isMuted ? 1 : 0}&rel=0`}
                            title="YouTube video player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                        ></iframe>
                    </div>

                    <div className="p-5 bg-gray-900/90 rounded-b-3xl mb-4 border-x border-b border-gray-800 backdrop-blur-md">
                        <h2 className="text-lg md:text-xl font-bold text-white mb-2 leading-snug">{ytVideo.title}</h2>

                        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 items-center">
                            {ytVideo.channelTitle && (
                                <span className="text-xs bg-red-900/30 text-red-300 border border-red-700/40 px-2.5 py-1 rounded-lg font-medium whitespace-nowrap">
                                    📺 {ytVideo.channelTitle}
                                </span>
                            )}
                            {ytVideo.duration_category && (
                                <span className="text-xs bg-yellow-900/30 text-yellow-300 border border-yellow-700/40 px-2.5 py-1 rounded-lg font-medium whitespace-nowrap">
                                    ⏱️ {ytVideo.durationSeconds ? `${formatDuration(ytVideo.durationSeconds)} · ` : ''}{durationLabel[ytVideo.duration_category] ?? ytVideo.duration_category}
                                </span>
                            )}
                        </div>

                        {cleanDescription(ytVideo.description) && (
                            <div className="bg-gray-800/40 p-3 rounded-xl mb-4">
                                <p className="text-xs text-gray-300 whitespace-pre-wrap line-clamp-3">{cleanDescription(ytVideo.description)}</p>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-800">
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={() => fetchYoutubeVideo()}
                                    className="text-xs font-bold text-white bg-gray-800 hover:bg-gray-700 flex items-center gap-1.5 border border-gray-700 px-4 py-2 rounded-xl transition"
                                >
                                    <RotateCcw size={14} /> {t.youtube.skip}
                                </button>
                                <button
                                    onClick={markYoutubeWatched}
                                    className="text-xs font-bold text-white bg-green-900/40 hover:bg-green-800/60 border border-green-700/50 flex items-center gap-1.5 px-4 py-2 rounded-xl transition"
                                >
                                    <EyeOff size={14} /> {t.youtube.watched}
                                </button>

                                {fetchMoreFromChannel && (ytVideo.channelId || ytVideo.channelTitle) && (
                                    <button
                                        onClick={() => fetchMoreFromChannel(ytVideo.channelId)}
                                        className="text-xs font-bold text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-700/40 flex items-center gap-1.5 px-3 py-2 rounded-xl transition"
                                    >
                                        <Tv size={14} /> {t.youtube.moreFromChannel}
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => fetchYoutubeVideo()}
                                    className="text-xs text-gray-300 hover:text-yellow-400 flex items-center gap-1 py-2 px-2.5 min-h-[36px] hover:bg-gray-800 rounded-lg transition"
                                >
                                    <AlertTriangle size={12} /> {t.youtube.brokenVideo}
                                </button>
                                <button
                                    onClick={handleReport}
                                    className="text-xs text-gray-300 hover:text-red-400 flex items-center gap-1 py-2 px-2.5 min-h-[36px] hover:bg-gray-800 rounded-lg transition"
                                >
                                    {t.youtube.wrongCategory}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
