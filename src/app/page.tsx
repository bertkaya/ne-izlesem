'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { 
  getSmartRecommendation, getRandomEpisode, searchTvShow, 
  getVideoFromChannel, getDiscoverBatch, getMoviesByTitles,
  MOOD_TO_MOVIE_GENRE, MOOD_TO_TV_GENRE, PROVIDERS 
} from '@/lib/tmdb'
import { analyzePrompt } from '@/lib/smart-search'
import { checkBadges, askGemini } from './actions'
import { 
  Play, RotateCcw, ExternalLink, Youtube, PlusCircle, X, 
  ShoppingBag, Tv, Film, Utensils, User, LogOut, Star, Search, 
  Loader2, EyeOff, Heart, Flag, Flame, Sparkles, Video
} from 'lucide-react'
import MovieSwiper from '@/components/MovieSwiper'
import dynamic from 'next/dynamic'

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

const POPULAR_SHOWS = [
  { id: 4608, name: 'Gibi' }, { id: 1668, name: 'Friends' }, { id: 1400, name: 'Seinfeld' }, 
  { id: 2316, name: 'The Office' }, { id: 456, name: 'The Simpsons' }, { id: 62560, name: 'Mr. Robot' }, 
  { id: 1399, name: 'Game of Thrones' }, { id: 1396, name: 'Breaking Bad' },
];

const AI_CHIPS = ["😭 Hüngür hüngür ağlamak istiyorum", "🤯 Beyin yakan bir film bul", "🤣 Gülmekten karnıma ağrılar girsin", "👻 Gece uyutmayacak bir korku filmi", "🚀 Uzay ve bilim kurgu olsun", "🕵️‍♂️ Katil kim temalı gizem", "🦁 Vahşi yaşam belgeseli", "🎥 Yeşilçam filmi öner"];
const getYoutubeId = (url: string) => url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)?.[2];
const calculateRottenScore = (tmdbScore: number) => Math.min(100, Math.round(tmdbScore * 10 + (Math.random() * 10 - 5)));

export default function Home() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [appMode, setAppMode] = useState<'youtube' | 'tmdb' | 'swipe' | 'ai'>('youtube')
  
  // State
  const [ytVideo, setYtVideo] = useState<any>(null)
  const [ytLoading, setYtLoading] = useState(false)
  const [duration, setDuration] = useState('meal')
  const [mood, setMood] = useState('funny')
  const [myChannels, setMyChannels] = useState<string[]>([])

  const [tmdbResult, setTmdbResult] = useState<any>(null)
  const [tmdbLoading, setTmdbLoading] = useState(false)
  const [tmdbType, setTmdbType] = useState<'movie' | 'tv'>('movie')
  const [platforms, setPlatforms] = useState<number[]>([8]) 
  const [tmdbMood, setTmdbMood] = useState('funny') 
  const [searchQuery, setSearchQuery] = useState('')
  const [onlyTurkish, setOnlyTurkish] = useState(false) 
  const [aiPrompt, setAiPrompt] = useState('')

  const [swipeMovies, setSwipeMovies] = useState<any[]>([])
  const [swipePage, setSwipePage] = useState(1)
  const [isSwipingLoading, setIsSwipingLoading] = useState(false)

  const [watchedIds, setWatchedIds] = useState<number[]>([])
  const [blacklistedIds, setBlacklistedIds] = useState<number[]>([])
  const [favorites, setFavorites] = useState<number[]>([])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [suggestUrl, setSuggestUrl] = useState('')
  const [suggestStatus, setSuggestStatus] = useState('')
  const [trailerId, setTrailerId] = useState<string | null>(null)

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      const { data: blacklist } = await supabase.from('blacklist').select('tmdb_id'); if (blacklist) setBlacklistedIds(blacklist.map(b => b.tmdb_id))
      if (user) {
        const { data: history } = await supabase.from('user_history').select('tmdb_id').eq('user_id', user.id); if (history) setWatchedIds(history.map(h => h.tmdb_id))
        const { data: favs } = await supabase.from('favorites').select('tmdb_id').eq('user_id', user.id); if (favs) setFavorites(favs.map(f => f.tmdb_id))
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (profile) {
           if(profile.selected_platforms) setPlatforms(profile.selected_platforms.map((p: string) => parseInt(p)))
           if(profile.favorite_channels) setMyChannels(profile.favorite_channels)
        }
      }
    }
    initData()
    loadSwipeCards(1)
  }, [])

  const loadSwipeCards = async (pageNum: number) => {
    if (isSwipingLoading) return; setIsSwipingLoading(true);
    try {
      const movies = await getDiscoverBatch(pageNum)
      const uniqueMovies = movies.filter((m: any) => !swipeMovies.some(sm => sm.id === m.id) && !watchedIds.includes(m.id) && !blacklistedIds.includes(m.id));
      setSwipeMovies(prev => [...prev, ...uniqueMovies]); setSwipePage(p => p + 1)
    } catch (e) { console.error(e) } finally { setIsSwipingLoading(false) }
  }
  const handleSwipe = async (d: 'left' | 'right', m: any) => {
    if (swipeMovies.length < 8) loadSwipeCards(swipePage); 
    if (d === 'right' && user) supabase.from('favorites').insert({ user_id: user.id, tmdb_id: m.id, media_type: 'movie', title: m.title, poster_path: m.poster_path, vote_average: m.vote_average }).then(() => setFavorites(prev => [...prev, m.id]));
  }
  // Swipe ekranından izle butonu
  const handleSwipeWatch = (movie: any) => {
    setTmdbResult(movie); setTmdbType('movie'); setAppMode('tmdb');
  }

  const fetchYoutubeVideo = async () => { setYtLoading(true); setYtVideo(null); if (myChannels.length > 0 && Math.random() > 0.5) { const r = await getVideoFromChannel(myChannels[Math.floor(Math.random() * myChannels.length)]); if(r) { setYtVideo(r); setYtLoading(false); return } } const { data } = await supabase.rpc('get_random_video', { chosen_duration: duration, chosen_mood: mood }); if (data && data.length > 0) { setYtVideo(data[0]); if(user) await supabase.from('user_history').insert({ user_id: user.id, tmdb_id: 0, media_type: 'youtube', title: data[0].title }) } else alert("Video bulunamadı."); setYtLoading(false) }
  const fetchTmdbContent = async () => { setTmdbLoading(true); setTmdbResult(null); const pStr = platforms.join('|'); try { if (tmdbType === 'movie') { const g = MOOD_TO_MOVIE_GENRE[tmdbMood as keyof typeof MOOD_TO_MOVIE_GENRE] || '35'; const m = await getSmartRecommendation(g, pStr, 'movie', watchedIds, blacklistedIds, onlyTurkish); if(m) setTmdbResult(m); else alert("Film bulunamadı.") } else { let tId = null; if (searchQuery) { const s = await searchTvShow(searchQuery); if(s) tId = s.id; else { alert("Dizi bulunamadı"); setTmdbLoading(false); return } } const g = MOOD_TO_TV_GENRE[tmdbMood as keyof typeof MOOD_TO_TV_GENRE] || '35'; const e = await getRandomEpisode(tId, g, pStr); if(e) setTmdbResult(e); else alert("Bölüm bulunamadı.") } } catch(e) { console.error(e) } finally { setTmdbLoading(false) } }
  
  const fetchAiRecommendation = async (overridePrompt?: string) => {
    const promptToUse = overridePrompt || aiPrompt; if(!promptToUse) return;
    setTmdbLoading(true); setTmdbResult(null); const pStr = platforms.join('|');
    const aiRes = await askGemini(promptToUse);
    if (aiRes.success) {
      if (aiRes.recommendations?.length) {
         const enriched = await getMoviesByTitles(aiRes.recommendations);
         if(enriched.length > 0) { setSwipeMovies(enriched); setAppMode('swipe'); alert(`AI ${enriched.length} film buldu!`); } else alert("Bulunamadı.");
      } else if (aiRes.params) {
         const p = aiRes.params; const safeType = (p.type === 'tv' || p.type === 'movie') ? p.type : 'movie';
         const m = await getSmartRecommendation(p.genre_ids || '', pStr, safeType, watchedIds, blacklistedIds, false, p.year_range, p.sort_by);
         if(m) { setTmdbResult(m); setAppMode('tmdb'); setTmdbType(safeType); } else alert("Bulunamadı.");
      }
    } else {
      const { genreIds, sort, year } = analyzePrompt(promptToUse); const m = await getSmartRecommendation(genreIds, pStr, 'movie', watchedIds, blacklistedIds, false, year, sort);
      if(m) { setTmdbResult(m); setAppMode('tmdb'); setTmdbType('movie'); } else alert("Bulunamadı.");
    }
    setTmdbLoading(false); setAiPrompt('');
  }

  const openTrailer = () => { if (tmdbResult?.videos?.results) { const t = tmdbResult.videos.results.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube'); if (t) setTrailerId(t.key); else alert("Fragman yok."); } else alert("Fragman yok."); }
  const markAsWatched = async () => { if(!tmdbResult || !user) { if(!user && confirm("Giriş?")) window.location.href='/login'; return; } await supabase.from('user_history').insert({ user_id: user.id, tmdb_id: tmdbResult.id, media_type: tmdbType, title: tmdbResult.title || tmdbResult.name, poster_path: tmdbResult.poster_path, vote_average: tmdbResult.vote_average }); setWatchedIds([...watchedIds, tmdbResult.id]); fetchTmdbContent(); const { newBadges } = await checkBadges(user.id); if (newBadges?.length) alert(`🎉 Yeni Rozet: ${newBadges.join(', ')}`); }
  const toggleFavorite = async () => { if(!tmdbResult || !user) { alert("Giriş yap."); return; } if(favorites.includes(tmdbResult.id)) { await supabase.from('favorites').delete().eq('user_id', user.id).eq('tmdb_id', tmdbResult.id); setFavorites(favorites.filter(id => id !== tmdbResult.id)) } else { await supabase.from('favorites').insert({ user_id: user.id, tmdb_id: tmdbResult.id, media_type: tmdbType, title: tmdbResult.title || tmdbResult.name, poster_path: tmdbResult.poster_path, vote_average: tmdbResult.vote_average }); setFavorites([...favorites, tmdbResult.id]) } }
  const handleSuggest = async (e: React.FormEvent) => { e.preventDefault(); setSuggestStatus('sending'); const v = getYoutubeId(suggestUrl); if (!v) { setSuggestStatus('error'); return } const { error } = await supabase.from('videos').insert({ title: 'Kullanıcı Önerisi', url: suggestUrl, duration_category: 'meal', mood: 'funny', is_approved: false }); if (!error) { setSuggestStatus('success'); setTimeout(() => { setIsModalOpen(false); setSuggestStatus(''); setSuggestUrl('') }, 2000) } else { setSuggestStatus('db_error') } }
  const togglePlatform = async (id: number) => { const n = platforms.includes(id) ? platforms.filter(p => p !== id) : [...platforms, id]; setPlatforms(n); if(user) await supabase.from('profiles').update({ selected_platforms: n.map(String) }).eq('id', user.id) }
  const getWatchLink = () => { if (!tmdbResult) return '#'; if (tmdbResult['watch/providers']?.results?.TR?.link) return tmdbResult['watch/providers'].results.TR.link; const t = tmdbResult.title || tmdbResult.name; if (platforms.includes(8)) return `https://www.netflix.com/search?q=${encodeURIComponent(t)}`; if (platforms.includes(119)) return `https://www.primevideo.com/search/ref=atv_nb_sr?phrase=${encodeURIComponent(t)}`; return `https://www.google.com/search?q=${encodeURIComponent(t)}+izle`; }

  return (
    <div className="min-h-screen bg-[#0f1014] text-white font-sans pb-20 selection:bg-red-500">
      
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto border-b border-gray-800/50 backdrop-blur-md sticky top-0 z-40 bg-[#0f1014]/80">
        <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-yellow-500 cursor-pointer" onClick={() => window.location.href='/'}>NE İZLESEM?</h1>
        {user ? (<div className="flex items-center gap-4"><a href="/profile" className="flex items-center gap-2 text-sm font-bold text-gray-300 hover:text-white transition bg-gray-800 hover:bg-gray-700 py-2 px-4 rounded-full border border-gray-700"><User size={18} /> <span className="hidden md:inline">Profilim</span></a></div>) : (<a href="/login" className="flex items-center gap-2 text-sm font-bold bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition"><User size={18} /> Giriş Yap</a>)}
      </nav>

      <div className="flex justify-center mt-6 px-4">
        <div className="bg-gray-900 p-1 rounded-2xl border border-gray-800 flex flex-wrap justify-center w-full max-w-xl shadow-lg">
          <button onClick={() => setAppMode('youtube')} className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${appMode === 'youtube' ? 'bg-gray-800 text-yellow-500 shadow-lg' : 'text-gray-500 hover:text-white'}`}><Utensils size={18} /> Yemek</button>
          <button onClick={() => setAppMode('tmdb')} className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${appMode === 'tmdb' ? 'bg-gray-800 text-red-500 shadow-lg' : 'text-gray-500 hover:text-white'}`}><Film size={18} /> Gurme</button>
          <button onClick={() => setAppMode('ai')} className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${appMode === 'ai' ? 'bg-gray-800 text-cyan-400 shadow-lg' : 'text-gray-500 hover:text-white'}`}><Sparkles size={18} /> Asistan</button>
          <button onClick={() => setAppMode('swipe')} className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${appMode === 'swipe' ? 'bg-gray-800 text-purple-500 shadow-lg' : 'text-gray-500 hover:text-white'}`}><Flame size={18} /> Keşfet</button>
          <button onClick={() => router.push('/match')} className={`flex-1 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-gray-800 text-pink-500 shadow-lg hover:text-white`}><Heart size={18} /> Eşleş</button>
        </div>
      </div>

      {appMode === 'ai' && (
        <div className="flex flex-col items-center mt-12 px-4 animate-in fade-in duration-500 w-full max-w-lg mx-auto text-center">
          <h2 className="text-3xl font-black mb-2 text-cyan-400">Film Sommelier 🤖</h2>
          <p className="text-gray-400 mb-8">Ne hissettiğini söyle veya aşağıdan seç.</p>
          <div className="w-full relative mb-8">
            <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Örn: Yeşilçam filmi öner veya beni ağlatacak bir dram..." className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 text-white outline-none focus:border-cyan-500 min-h-[120px] resize-none text-lg" />
            <button onClick={() => fetchAiRecommendation()} disabled={!aiPrompt || tmdbLoading} className="absolute bottom-4 right-4 bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-xl transition-all shadow-lg shadow-cyan-900/50 disabled:opacity-50">{tmdbLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={24} />}</button>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">{AI_CHIPS.map((chip, i) => (<button key={i} onClick={() => { setAiPrompt(chip); fetchAiRecommendation(chip); }} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2 rounded-full text-sm transition-colors">{chip}</button>))}</div>
        </div>
      )}

      {appMode === 'youtube' && (
        <div className="flex flex-col items-center mt-8 px-4 animate-in fade-in duration-500">
          <div className="bg-gray-900/80 backdrop-blur-lg p-6 rounded-3xl shadow-2xl w-full max-w-lg mb-8 border border-gray-800 relative">
            <button onClick={() => setIsModalOpen(true)} className="absolute -top-3 -right-3 bg-yellow-600 text-white p-2 rounded-full shadow-lg hover:bg-yellow-500 transition-transform hover:scale-110"><PlusCircle size={24} /></button>
            <div className="mb-6"><p className="text-gray-400 mb-3 text-xs font-bold uppercase tracking-widest">Süre</p><div className="grid grid-cols-3 gap-2">{['snack', 'meal', 'feast'].map(d => <button key={d} onClick={() => setDuration(d)} className={`p-3 rounded-xl text-sm font-bold transition-all border ${duration === d ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500' : 'bg-gray-800 border-transparent text-gray-400'}`}>{d === 'snack' ? 'Atıştır' : d === 'meal' ? 'Doyur' : 'Ziyafet'}</button>)}</div></div>
            <div className="mb-8"><p className="text-gray-400 mb-3 text-xs font-bold uppercase tracking-widest">Mood</p><div className="grid grid-cols-2 gap-2">{[['funny', '😂 Güldür'], ['relax', '💆‍♂️ Rahatla'], ['learn', '🧠 Öğren'], ['drama', '🎬 Hikaye']].map(([val, label]) => <button key={val} onClick={() => setMood(val)} className={`p-3 rounded-xl text-sm font-bold transition-all border ${mood === val ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'bg-gray-800 border-transparent text-gray-400'}`}>{label}</button>)}</div></div>
            <button onClick={fetchYoutubeVideo} disabled={ytLoading} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95">{ytLoading ? <Loader2 className="animate-spin" /> : <><Play fill="currentColor" /> BUL</>}</button>
          </div>
          {ytVideo && (
            <div className="w-full max-w-lg animate-in slide-in-from-bottom-8 duration-500">
              <div className="bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-700 group cursor-pointer" onClick={() => window.open(ytVideo.url, '_blank')}>
                <div className="relative aspect-video"><img src={ytVideo.thumbnail || `https://img.youtube.com/vi/${getYoutubeId(ytVideo.url)}/hqdefault.jpg`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" /><div className="absolute inset-0 flex items-center justify-center"><div className="bg-red-600/90 text-white p-4 rounded-full shadow-lg"><Youtube size={32} /></div></div></div>
                <div className="p-6">{ytVideo.channelTitle && <p className="text-xs text-yellow-500 font-bold mb-1 uppercase tracking-widest">{ytVideo.channelTitle}</p>}<h2 className="text-lg font-bold text-white mb-2 line-clamp-2">{ytVideo.title}</h2></div>
              </div>
              <div className="mt-4 bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl p-4 flex items-center justify-between shadow-lg cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => window.open('https://www.yemeksepeti.com', '_blank')}>
                <div className="flex items-center gap-3"><div className="bg-white/20 p-2 rounded-lg"><ShoppingBag size={20} /></div><div><p className="font-bold text-white text-sm">Yemeğin Hazır mı?</p><p className="text-xs text-orange-100">Sipariş ver (Sponsor)</p></div></div><ExternalLink size={16} className="opacity-50" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TMDB MODU */}
      {appMode === 'tmdb' && (
        <div className="flex flex-col items-center mt-8 px-4 animate-in fade-in duration-500">
          <div className="bg-gray-900/80 backdrop-blur-lg p-6 rounded-3xl shadow-2xl w-full max-w-2xl mb-8 border border-gray-800">
            <div className="flex bg-black/40 p-1 rounded-xl mb-6">
              <button onClick={() => setTmdbType('movie')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${tmdbType === 'movie' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}><Film size={20} /> Film</button>
              <button onClick={() => setTmdbType('tv')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${tmdbType === 'tv' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}><Tv size={20} /> Dizi</button>
            </div>
            
            <div className="mb-6"><p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-3">Platformlar</p><div className="flex gap-2 flex-wrap">{PROVIDERS.map(p => <button key={p.id === 0 ? p.name : p.id} onClick={() => togglePlatform(p.id)} className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all ${platforms.includes(p.id) ? p.color + ' bg-opacity-20 bg-white' : 'border-gray-700 text-gray-600 grayscale'}`}>{p.name}</button>)}</div></div>
            
            {tmdbType === 'movie' && (
               <div className="mb-6 flex justify-end">
                 <button onClick={() => setOnlyTurkish(!onlyTurkish)} className={`px-4 py-2 rounded-lg border text-sm font-bold flex items-center gap-2 transition-all ${onlyTurkish ? 'bg-red-900/50 border-red-500 text-red-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}><Flag size={14} fill={onlyTurkish ? "currentColor" : "none"}/> Yerli</button>
               </div>
            )}

            {tmdbType === 'tv' && (
              <div className="mb-6 relative">
                 <p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-3">Dizi Ara</p>
                 <div className="relative mb-3"><Search className="absolute left-3 top-3 text-gray-500" size={20} /><input type="text" placeholder="Dizi adı yaz..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 text-white focus:border-red-500 outline-none" /></div>
                 <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">{POPULAR_SHOWS.map(show => <button key={show.id} onClick={() => setSearchQuery(show.name)} className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-xs whitespace-nowrap hover:bg-gray-700 hover:border-white transition">{show.name}</button>)}</div>
              </div>
            )}
            
            <div className="mb-8"><p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-3">Tür Seç</p><div className="grid grid-cols-3 gap-2">{[['funny', '😂 Komedi'], ['scary', '😱 Gerilim'], ['emotional', '😭 Dram'], ['action', '💥 Aksiyon'], ['scifi', '👽 Bilim Kurgu'], ['crime', '🕵️‍♂️ Suç']].map(([val, label]) => <button key={val} onClick={() => setTmdbMood(val)} className={`p-3 rounded-xl text-xs md:text-sm font-bold transition-all border ${tmdbMood === val ? 'bg-red-600 text-white border-red-600' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}>{label}</button>)}</div></div>
            <button onClick={fetchTmdbContent} disabled={tmdbLoading} className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95">{tmdbLoading ? <Loader2 className="animate-spin" /> : <><Play fill="currentColor" /> {tmdbType === 'movie' ? 'FİLM BUL' : 'BÖLÜM ÇEVİR'}</>}</button>
          </div>
          {tmdbResult && (
            <div className="w-full max-w-4xl animate-in slide-in-from-bottom-8 duration-700 mb-10">
              <div className="relative rounded-3xl overflow-hidden bg-gray-800 shadow-2xl border border-gray-700 md:flex">
                <div className="md:w-1/3 relative min-h-[400px] group cursor-pointer" onClick={openTrailer}>
                  <img src={`https://image.tmdb.org/t/p/w500${tmdbResult.poster_path || tmdbResult.still_path}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-all"><div className="bg-red-600 text-white p-4 rounded-full shadow-xl scale-90 group-hover:scale-110 transition-transform"><Play fill="currentColor" size={32}/></div></div>
                  <button onClick={(e) => { e.stopPropagation(); toggleFavorite() }} className="absolute top-4 right-4 bg-black/60 backdrop-blur p-3 rounded-full text-white hover:text-red-500 hover:scale-110 transition-all shadow-xl z-20"><Heart size={24} fill={favorites.includes(tmdbResult.id) ? "currentColor" : "none"} className={favorites.includes(tmdbResult.id) ? "text-red-500" : ""} /></button>
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-lg flex items-center gap-1 text-yellow-400 font-bold text-sm"><Star size={14} fill="currentColor"/> {tmdbResult.vote_average?.toFixed(1) || 'N/A'}</div>
                </div>
                <div className="p-8 md:w-2/3 flex flex-col justify-center relative">
                  <div className="flex gap-4 mb-4">
                    <div className="flex items-center gap-2 bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-lg border border-yellow-500/50 font-bold"><span className="bg-yellow-500 text-black px-1 rounded text-xs font-black">IMDb</span> {tmdbResult.vote_average?.toFixed(1) || 'N/A'}</div>
                    <div className="flex items-center gap-2 bg-red-500/20 text-red-500 px-3 py-1 rounded-lg border border-red-500/50 font-bold"><span className="text-xl">🍅</span> {calculateRottenScore(tmdbResult.vote_average)}%</div>
                  </div>
                  {tmdbType === 'tv' && <div className="text-yellow-500 font-bold tracking-widest text-xs uppercase mb-2">{tmdbResult.showName} • S{tmdbResult.season} • B{tmdbResult.episode}</div>}
                  <h2 className="text-3xl font-black mb-4 leading-tight text-white">{tmdbResult.title || tmdbResult.name}</h2>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-4">{tmdbResult.overview || 'Özet yok.'}</p>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button onClick={openTrailer} className="bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"><Video size={18}/> Fragman</button>
                    {/* DİREKT LİNK */}
                    <button onClick={() => window.open(getWatchLink(), '_blank')} className="bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2"><Play size={20} /> İzleme Sayfası</button>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={fetchTmdbContent} className="flex-1 border border-gray-600 hover:bg-gray-700 text-gray-300 py-3 rounded-xl transition flex items-center justify-center gap-2"><RotateCcw size={18} /> Pas Geç</button>
                    <button onClick={markAsWatched} className="flex-1 border border-gray-600 hover:bg-gray-700 text-gray-300 py-3 rounded-xl transition flex items-center justify-center gap-2"><EyeOff size={18} /> İzledim</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SWIPE MODU */}
      {appMode === 'swipe' && (
        <div className="flex flex-col items-center mt-12 px-4 animate-in fade-in duration-500 w-full max-w-lg mx-auto">
          <h2 className="text-2xl font-black mb-6 text-purple-500">Kendi Zevkini Keşfet</h2>
          <MovieSwiper movies={swipeMovies} onSwipe={handleSwipe} onWatch={handleSwipeWatch} /> 
          <p className="mt-8 text-gray-500 text-sm text-center">Sağa kaydır = Beğendim, Sola kaydır = İlgimi Çekmedi</p>
        </div>
      )}

      {/* MODAL: VIDEO ÖNERİ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-gray-900 p-6 rounded-2xl w-full max-w-md border border-gray-700 relative">
             <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>
             <h2 className="text-xl font-bold mb-4 text-white">Video Öner</h2>
             <form onSubmit={handleSuggest} className="space-y-4">
               <input required placeholder="YouTube Linki" value={suggestUrl} onChange={e => setSuggestUrl(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white outline-none" />
               <button disabled={suggestStatus === 'sending'} type="submit" className="w-full bg-yellow-600 text-white font-bold py-3 rounded-lg">Gönder</button>
             </form>
           </div>
        </div>
      )}

      {/* MODAL: FRAGMAN */}
      {trailerId && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 backdrop-blur-md animate-in zoom-in duration-300">
           <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
             <button onClick={() => setTrailerId(null)} className="absolute top-4 right-4 text-white bg-black/50 p-2 rounded-full hover:bg-red-600 transition z-10"><X size={24} /></button>
             <ReactPlayer url={`https://www.youtube.com/watch?v=${trailerId}`} width="100%" height="100%" playing={true} controls={true} />
           </div>
        </div>
      )}
    </div>
  )
}