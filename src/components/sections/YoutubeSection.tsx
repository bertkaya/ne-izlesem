'use client'

import { useState, useEffect } from 'react'
import { Globe, Loader2, Play, RotateCcw, EyeOff, AlertTriangle, Repeat, Tv } from 'lucide-react'
import dynamic from 'next/dynamic'

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false }) as any

const YOUTUBE_MOODS = [
    { id: 'funny', label: '😂 Güldür', color: 'blue' },
    { id: 'eat', label: '🍔 Birlikte Ye', color: 'orange' },
    { id: 'classic', label: '📺 Klasikler', color: 'purple' },
    { id: 'pets', label: '🐶 Evcil Dostlar', color: 'green' },
    { id: 'relax', label: '💆‍♂️ Rahatla', color: 'teal' },
    { id: 'learn', label: '🧠 Öğren', color: 'indigo' },
    { id: 'drama', label: '🎬 Hikaye', color: 'pink' }
];

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
                    {['snack', 'meal', 'feast'].map(d => (
                        <button
                            key={d}
                            onClick={() => setDuration(d)}
                            className={`p-3 rounded-xl text-sm font-bold border ${duration === d ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500' : 'bg-gray-800 border-transparent text-gray-400'}`}
                        >
                            {d === 'snack' ? 'Atıştır' : d === 'meal' ? 'Doyur' : 'Ziyafet'}
                        </button>
                    ))}
                </div>

                <p className="text-gray-400 mb-3 text-xs font-bold uppercase">Modun</p>
                <div className="flex flex-wrap gap-2 mb-6">
                    {YOUTUBE_MOODS.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setMood(m.id)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold border ${mood === m.id ? `bg-${m.color}-500/20 text-${m.color}-400 border-${m.color}-500` : 'bg-gray-800 border-transparent text-gray-400'}`}
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
                    className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 shadow-lg active:scale-95"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <><Tv fill="currentColor" /> BUL & İZLE</>}
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
