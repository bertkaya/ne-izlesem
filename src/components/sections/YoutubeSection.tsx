'use client'

import { useState, useEffect } from 'react'
import { Globe, Loader2, Play, RotateCcw, EyeOff, AlertTriangle, Repeat, Tv } from 'lucide-react'
import dynamic from 'next/dynamic'

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false }) as any

const YOUTUBE_MOODS = [
    { id: 'funny', label: '😂 Güldür' },
    { id: 'eat', label: '🍔 Birlikte Ye' },
    { id: 'classic', label: '📺 Klasikler' },
    { id: 'pets', label: '🐶 Evcil Dostlar' },
    { id: 'relax', label: '💆‍♂️ Rahatla' },
    { id: 'learn', label: '🧠 Öğren' },
    { id: 'drama', label: '🎬 Hikaye' },
    { id: 'travel', label: '✈️ Gezi & Tatil' },
    { id: 'sport', label: '⚽ Spor' },
    { id: 'tech', label: '💻 Teknoloji' },
    { id: 'news', label: '📰 Gündem' },
    { id: 'music', label: '🎵 Müzik' },
    { id: 'popculture', label: '✨ Magazin' }
];

// Tailwind CSS dinamik class'ları desteklemediği için sabit mapping kullanıyoruz
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
}

export default function YoutubeSection({
    ytVideo, loading, duration, setDuration, mood, setMood, ytLang, setYtLang,
    fetchYoutubeVideo, markYoutubeWatched, handleReport
}: YoutubeSectionProps) {
    const [autoPlay, setAutoPlay] = useState(true);
    const [autoNext, setAutoNext] = useState(false);
    const [isMuted, setIsMuted] = useState(true);

    useEffect(() => {
        if (autoNext && !ytVideo && !loading) {
            fetchYoutubeVideo();
        }
    }, [autoNext, ytVideo, loading, fetchYoutubeVideo]);

    return (
        <div className="flex flex-col items-center mt-8 px-4 animate-in fade-in duration-500 w-full">
            <div className="bg-gray-900/80 p-6 rounded-3xl shadow-2xl w-full max-w-lg border border-gray-800 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-400 text-xs font-bold uppercase">Süre</p>
                    <button onClick={() => setYtLang(ytLang === 'tr' ? 'all' : 'tr')} className="text-xs font-bold flex items-center gap-1 text-gray-400 hover:text-white">
                        <Globe size={12} /> {ytLang === 'tr' ? 'Sadece Türkçe' : 'Tüm Diller'}
                    </button>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-6">
                    <button
                        onClick={() => setDuration('snack')}
                        className={`p-3 rounded-xl text-sm font-bold border flex flex-col items-center justify-center gap-1 transition-all ${duration === 'snack' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500' : 'bg-gray-800 border-transparent text-gray-400 hover:bg-gray-750'}`}
                    >
                        <span>Atıştır</span>
                        <span className="text-[10px] opacity-70 font-normal">(0-2 dk)</span>
                    </button>
                    <button
                        onClick={() => setDuration('meal')}
                        className={`p-3 rounded-xl text-sm font-bold border flex flex-col items-center justify-center gap-1 transition-all ${duration === 'meal' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500' : 'bg-gray-800 border-transparent text-gray-400 hover:bg-gray-750'}`}
                    >
                        <span>Doyur</span>
                        <span className="text-[10px] opacity-70 font-normal">(2-20 dk)</span>
                    </button>
                    <button
                        onClick={() => setDuration('feast')}
                        className={`p-3 rounded-xl text-sm font-bold border flex flex-col items-center justify-center gap-1 transition-all ${duration === 'feast' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500' : 'bg-gray-800 border-transparent text-gray-400 hover:bg-gray-750'}`}
                    >
                        <span>Ziyafet</span>
                        <span className="text-[10px] opacity-70 font-normal">(20+ dk)</span>
                    </button>
                </div>

                <p className="text-gray-400 mb-3 text-xs font-bold uppercase">Modun</p>
                <div className="flex flex-wrap gap-2 mb-6">
                    {YOUTUBE_MOODS.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setMood(m.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border ${mood === m.id ? MOOD_COLORS[m.id] : 'bg-gray-800 border-transparent text-gray-400'}`}
                        >
                            {m.label}
                        </button>
                    ))}
                </div>

                <div className="flex gap-4 mb-6 justify-center">
                    <button
                        onClick={() => setAutoPlay(!autoPlay)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${autoPlay ? 'bg-green-500/20 text-green-400 border-green-500' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                    >
                        <Play size={14} /> Otomatik Oynat
                    </button>
                    <button
                        onClick={() => setAutoNext(!autoNext)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${autoNext ? 'bg-purple-500/20 text-purple-400 border-purple-500' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                    >
                        <Repeat size={14} /> Otomatik Geç (TV Modu)
                    </button>
                </div>

                <button
                    onClick={fetchYoutubeVideo}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 text-white font-black py-4 rounded-full flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all text-lg group"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <><Play fill="currentColor" size={24} className="group-hover:scale-110 transition-transform" /> BUL & İZLE</>}
                </button>
            </div>

            {ytVideo && (
                <div className="w-full max-w-2xl mt-4 animate-in slide-in-from-bottom-4">
                    <div className="bg-black rounded-3xl overflow-hidden shadow-2xl border border-gray-800 aspect-video relative">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${ytVideo.videoId || ytVideo.url.split('v=')[1]}?autoplay=${autoPlay ? 1 : 0}&mute=${isMuted ? 1 : 0}`}
                            title="YouTube video player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="w-full h-full"
                        ></iframe>
                    </div>
                    <div className="p-5 bg-gray-900/50 rounded-b-3xl mb-4 border-x border-b border-gray-800">
                        <h2 className="text-xl font-bold text-white mb-2 leading-tight">{ytVideo.title}</h2>
                        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                            <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300 whitespace-nowrap">{ytVideo.channelTitle}</span>
                            {ytVideo.duration_category && <span className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300 whitespace-nowrap">{ytVideo.duration_category}</span>}
                        </div>

                        {ytVideo.description && (
                            <div className="bg-gray-800/50 p-3 rounded-xl mb-4 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                                <p className="text-sm text-gray-300 whitespace-pre-wrap">{ytVideo.description}</p>
                            </div>
                        )}

                        <div className="flex justify-center gap-3 mt-4">
                            <button onClick={fetchYoutubeVideo} className="text-xs font-bold text-white bg-gray-700 hover:bg-gray-600 flex items-center gap-2 border border-gray-600 px-4 py-2 rounded-full transition-all"><RotateCcw size={14} /> Pas Geç</button>
                            <button onClick={markYoutubeWatched} className="text-xs font-bold text-white bg-green-900/50 hover:bg-green-800 flex items-center gap-2 border border-green-700 px-4 py-2 rounded-full transition-all"><EyeOff size={14} /> İzledim</button>
                            <button onClick={handleReport} className="text-xs font-bold text-white bg-red-900/50 hover:bg-red-800 flex items-center gap-2 border border-red-700 px-4 py-2 rounded-full transition-all"><AlertTriangle size={14} /> Raporla</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
