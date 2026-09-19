'use client'

import { useState, useEffect } from 'react'
import {
    Globe, Loader2, Play, RotateCcw, EyeOff, AlertTriangle, Repeat,
    Volume2, VolumeX, ExternalLink, Timer, Tv, Moon, Sun,
    Flame, Utensils
} from 'lucide-react'
import { useLanguage } from '@/components/LanguageContext'

const YOUTUBE_MOODS = [
    { id: 'funny', labelTr: '😂 Güldür', labelEn: '😂 Laughs' },
    { id: 'eat', labelTr: '🍔 Birlikte Ye', labelEn: '🍔 Eat Together' },
    { id: 'classic', labelTr: '📺 Klasikler', labelEn: '📺 Classics' },
    { id: 'pets', labelTr: '🐶 Evcil Dostlar', labelEn: '🐶 Cute Pets' },
    { id: 'relax', labelTr: '💆‍♂️ Rahatla', labelEn: '💆‍♂️ Chill & Relax' },
    { id: 'learn', labelTr: '🧠 Öğren', labelEn: '🧠 Learn & Doc' },
    { id: 'drama', labelTr: '🎬 Hikaye', labelEn: '🎬 Stories' },
    { id: 'travel', labelTr: '✈️ Gezi & Tatil', labelEn: '✈️ Travel & Vlog' },
    { id: 'sport', labelTr: '⚽ Spor', labelEn: '⚽ Sports' },
    { id: 'tech', labelTr: '💻 Teknoloji', labelEn: '💻 Tech & Gadgets' },
    { id: 'news', labelTr: '📰 Gündem', labelEn: '📰 Deep Dives' },
    { id: 'music', labelTr: '🎵 Müzik', labelEn: '🎵 Music & Lofi' },
    { id: 'popculture', labelTr: '✨ Magazin', labelEn: '✨ Pop Culture' }
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
    ytVideo: any;
    loading: boolean;
    duration: string;
    setDuration: (d: string) => void;
    mood: string;
    setMood: (m: string) => void;
    ytLang: 'tr' | 'all';
    setYtLang: (l: 'tr' | 'all') => void;
    fetchYoutubeVideo: () => void;
    markYoutubeWatched: () => void;
    handleReport: () => void;
    fetchSurpriseVideo?: () => void;
    fetchMoreFromChannel?: (channelId?: string) => void;
}

export default function YoutubeSection({
    ytVideo, loading, duration, setDuration, mood, setMood, ytLang, setYtLang,
    fetchYoutubeVideo, markYoutubeWatched, handleReport, fetchSurpriseVideo, fetchMoreFromChannel
}: YoutubeSectionProps) {
    const { lang, t } = useLanguage()
    const [autoPlay, setAutoPlay] = useState(true);
    const [autoNext, setAutoNext] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [cinemaMode, setCinemaMode] = useState(false);

    // Yemek Zamanlayıcısı (Meal Timer)
    const [timerRemaining, setTimerRemaining] = useState<number | null>(null);
    const [timerActive, setTimerActive] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (timerActive && timerRemaining !== null && timerRemaining > 0) {
            interval = setInterval(() => {
                setTimerRemaining((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
            }, 1000);
        } else if (timerRemaining === 0) {
            setTimerActive(false);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [timerActive, timerRemaining]);

    const startTimer = (mins: number) => {
        setTimerRemaining(mins * 60);
        setTimerActive(true);
    };

    const stopTimer = () => {
        setTimerActive(false);
        setTimerRemaining(null);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    useEffect(() => {
        if (autoNext && !ytVideo && !loading) {
            fetchYoutubeVideo();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoNext, ytVideo, loading]);

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
                        onClick={() => setYtLang(ytLang === 'tr' ? 'all' : 'tr')}
                        className="text-xs font-bold flex items-center gap-1.5 px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-gray-300 hover:text-white hover:border-gray-500 transition"
                    >
                        <Globe size={13} /> {ytLang === 'tr' ? t.youtube.langFilterTr : t.youtube.langFilterAll}
                    </button>
                </div>

                {/* SÜRE BUTONLARI */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                    <button
                        onClick={() => setDuration('snack')}
                        className={`p-3 rounded-xl text-sm font-bold border flex flex-col items-center justify-center gap-1 transition-all ${duration === 'snack' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500 shadow-lg shadow-yellow-500/10' : 'bg-gray-800/80 border-transparent text-gray-400 hover:bg-gray-800'}`}
                    >
                        <span className="flex items-center gap-1">🍿 {t.youtube.snack}</span>
                        <span className="text-[10px] opacity-70 font-normal">{t.youtube.snackSub}</span>
                    </button>
                    <button
                        onClick={() => setDuration('meal')}
                        className={`p-3 rounded-xl text-sm font-bold border flex flex-col items-center justify-center gap-1 transition-all ${duration === 'meal' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500 shadow-lg shadow-yellow-500/10' : 'bg-gray-800/80 border-transparent text-gray-400 hover:bg-gray-800'}`}
                    >
                        <span className="flex items-center gap-1">🍲 {t.youtube.meal}</span>
                        <span className="text-[10px] opacity-70 font-normal">{t.youtube.mealSub}</span>
                    </button>
                    <button
                        onClick={() => setDuration('feast')}
                        className={`p-3 rounded-xl text-sm font-bold border flex flex-col items-center justify-center gap-1 transition-all ${duration === 'feast' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500 shadow-lg shadow-yellow-500/10' : 'bg-gray-800/80 border-transparent text-gray-400 hover:bg-gray-800'}`}
                    >
                        <span className="flex items-center gap-1">🍗 {t.youtube.feast}</span>
                        <span className="text-[10px] opacity-70 font-normal">{t.youtube.feastSub}</span>
                    </button>
                </div>

                {/* MOD SEÇİMİ */}
                <div className="flex items-center justify-between mb-3">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">{t.youtube.moodTitle}</p>
                    <span className="text-[11px] text-gray-500">{t.youtube.moodSub}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-6 max-h-36 overflow-y-auto scrollbar-thin pr-1">
                    {YOUTUBE_MOODS.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setMood(m.id)}
                            className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold border transition-all ${mood === m.id ? `${MOOD_COLORS[m.id]} shadow-md` : 'bg-gray-800/80 border-transparent text-gray-400 hover:text-gray-200'}`}
                        >
                            {lang === 'en' ? m.labelEn : m.labelTr}
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
                        onClick={fetchYoutubeVideo}
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 hover:from-yellow-500 hover:to-red-500 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all text-base md:text-lg group"
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
                            onClick={fetchSurpriseVideo}
                            disabled={loading}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-6 py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all text-sm group shrink-0"
                        >
                            <Flame className="text-yellow-300 group-hover:scale-110 transition-transform" size={18} />
                            <span>{t.youtube.surpriseMe}</span>
                        </button>
                    )}
                </div>
            </div>

            {/* OYNATICI VE KART */}
            {ytVideo && (
                <div className={`w-full max-w-3xl mt-2 animate-in slide-in-from-bottom-4 transition-all ${cinemaMode ? 'z-50 scale-105 shadow-2xl' : ''}`}>
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
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
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
                                    ⏱️ {ytVideo.duration_category}
                                </span>
                            )}
                        </div>

                        {ytVideo.description && (
                            <div className="bg-gray-800/40 p-3 rounded-xl mb-4 max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600">
                                <p className="text-xs text-gray-300 whitespace-pre-wrap line-clamp-3">{ytVideo.description}</p>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-800">
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={fetchYoutubeVideo}
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
                                    onClick={fetchYoutubeVideo}
                                    className="text-[11px] text-gray-400 hover:text-yellow-400 flex items-center gap-1 py-1 px-2 hover:bg-gray-800 rounded transition"
                                >
                                    <AlertTriangle size={12} /> {t.youtube.brokenVideo}
                                </button>
                                <button
                                    onClick={handleReport}
                                    className="text-[11px] text-gray-500 hover:text-red-400 flex items-center gap-1 py-1 px-2 hover:bg-gray-800 rounded transition"
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
