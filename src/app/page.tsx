'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { 
  getSmartRecommendation, getRandomEpisode, searchTvShow, searchTvShowsList,
  getVideoFromChannel, getDiscoverBatch, getMoviesByTitles,
  MOOD_TO_MOVIE_GENRE, MOOD_TO_TV_GENRE, PROVIDERS 
} from '@/lib/tmdb'
import { analyzePrompt } from '@/lib/smart-search'
import { checkBadges, askGemini, reportVideo } from './actions'
import { 
  Play, RotateCcw, ExternalLink, Youtube, PlusCircle, X, 
  ShoppingBag, Tv, Film, Utensils, User, LogOut, Star, Search, 
  Loader2, EyeOff, Heart, Flag, Flame, Sparkles, Video, AlertTriangle, Check, Globe
} from 'lucide-react'
import MovieSwiper from '@/components/MovieSwiper'
import dynamic from 'next/dynamic'
import Image from 'next/image'

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

const POPULAR_SHOWS = [
  { id: 4608, name: 'Gibi' }, 
  { id: 1668, name: 'Friends' }, 
  { id: 1400, name: 'Seinfeld' }, 
  { id: 2316, name: 'The Office' }, 
  { id: 456, name: 'The Simpsons' }, 
  { id: 62560, name: 'Mr. Robot' }, 
  { id: 1399, name: 'Game of Thrones' }, 
  { id: 1396, name: 'Breaking Bad' },
];

const AI_CHIPS = [
  "😭 Hüngür hüngür ağlamak istiyorum", "🤯 Beyin yakan bir film bul", "🤣 Gülmekten karnıma ağrılar girsin", 
  "👻 Gece uyutmayacak bir korku filmi", "🚀 Uzay ve bilim kurgu olsun", "🕵️‍♂️ Katil kim temalı gizem", 
  "🦁 Vahşi yaşam belgeseli", "🎥 Yeşilçam filmi öner"
];

const YOUTUBE_MOODS = [
  { id: 'funny', label: '😂 Güldür', color: 'blue' },
  { id: 'eat', label: '🍔 Birlikte Ye', color: 'orange' }, 
  { id: 'classic', label: '📺 Klasikler', color: 'purple' }, 
  { id: 'pets', label: '🐶 Evcil Dostlar', color: 'green' }, 
  { id: 'relax', label: '💆‍♂️ Rahatla', color: 'teal' },
  { id: 'learn', label: '🧠 Öğren', color: 'indigo' },
  { id: 'drama', label: '🎬 Hikaye', color: 'pink' }
];

// TÜRKÇE TÜR İSİMLERİ (Ekranda görünenler)
const GENRE_LABELS: Record<string, string> = {
  funny: 'Komedi', scary: 'Korku & Gerilim', emotional: 'Dram & Romantik', 
  action: 'Aksiyon & Macera', scifi: 'Bilim Kurgu', crime: 'Suç & Polisiye', relax: 'Belgesel'
};

const getYoutubeId = (url: string) => {
  const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return (match && match[2].length === 11) ? match[2] : null;
}
const calculateRottenScore = (tmdbScore: number) => Math.min(100, Math.round(tmdbScore * 10 + (Math.random() * 10 - 5)));

export default function Home() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [appMode, setAppMode] = useState<'youtube' | 'tmdb' | 'swipe' | 'ai'>('youtube')
  
  // Youtube
  const [ytVideo, setYtVideo] = useState<any>(null)
  const [ytLoading, setYtLoading] = useState(false)
  const [duration, setDuration] = useState('meal')
  const [mood, setMood] = useState('funny')
  const [ytLang, setYtLang] = useState<'tr' | 'all'>('tr')
  const [myChannels, setMyChannels] = useState<string[]>([])

  // TMDB
  const [tmdbResult, setTmdbResult] = useState<any>(null)
  const [tmdbLoading, setTmdbLoading] = useState(false)
  const [tmdbType, setTmdbType] = useState<'movie' | 'tv'>('movie')
  const [platforms, setPlatforms] = useState<number[]>([8]) 
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]) 
  const [tmdbMood, setTmdbMood] = useState('funny') 
  const [searchQuery, setSearchQuery] = useState('')
  const [onlyTurkish, setOnlyTurkish] = useState(false) 
  const [aiPrompt, setAiPrompt] = useState('')

  // DROPDOWN (AUTOCOMPLETE)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  // Swipe
  const [swipeMovies, setSwipeMovies] = useState<any[]>([])
  const [swipePage, setSwipePage] = useState(1)
  const [isSwipingLoading, setIsSwipingLoading] = useState(false)

  // Data
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
        const { data: history } = await supabase.from('user_history').select('tmdb_id').eq('user_id', user.id)
        if (history) setWatchedIds(history.map(h => h.tmdb_id))
        const { data: favs } = await supabase.from('favorites').select('tmdb_id').eq('user_id', user.id)
        if (favs) setFavorites(favs.map(f => f.tmdb_id))
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

  // --- SEARCH AUTOCOMPLETE ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2) {
        const results = await searchTvShowsList(searchQuery);
        setSearchResults(results);
        setShowDropdown(true);
      } else {
        setShowDropdown(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearchSelect = async (show: any) => {
    setSearchQuery(show.name);
    setShowDropdown(false);
    setTmdbLoading(true);
    // Seçilen diziyi detaylarıyla getir
    const s = await searchTvShow(show.name); // searchTvShow artık id ile de çalışabilir ama isimle devam edelim
    if(s) {
      const g = selectedGenres.length > 0 ? selectedGenres.join(',') : '35';
      const e = await getRandomEpisode(s.id, g, platforms.join('|'));
      if(e) setTmdbResult(e); else alert("Bölüm bulunamadı.");
    }
    setTmdbLoading(false);
  }

  // --- SWIPE LOGIC ---
  const loadSwipeCards = async (pageNum: number) => {
    if (isSwipingLoading) return;
    setIsSwipingLoading(true);
    try {
      const movies = await getDiscoverBatch(pageNum, selectedGenres.join(','))
      const uniqueMovies = movies.filter((m: any) => !swipeMovies.some(sm => sm.id === m.id) && !watchedIds.includes(m.id) && !blacklistedIds.includes(m.id));
      setSwipeMovies(prev => [...prev, ...uniqueMovies])
      setSwipePage(p => p + 1)
    } catch (e) { console.error(e) } finally { setIsSwipingLoading(false) }
  }
  const handleSwipe = async (direction: 'left' | 'right', movie: any) => {
    if (swipeMovies.length < 8) loadSwipeCards(swipePage); 
    if (direction === 'right' && user) {
        supabase.from('favorites').insert({ user_id: user.id, tmdb_id: movie.id, media_type: 'movie', title: movie.title, poster_path: movie.poster_path, vote_average: movie.vote_average }).then(() => setFavorites(prev => [...prev, movie.id]));
    }
  }
  const handleSwipeWatch = (movie: any) => { setTmdbResult(movie); setTmdbType('movie'); setAppMode('tmdb'); }

  // --- YOUTUBE LOGIC ---
  const fetchYoutubeVideo = async () => { 
    setYtLoading(true); setYtVideo(null); 
    if (myChannels.length > 0 && Math.random() > 0.5) { 
      const randomChannel = myChannels[Math.floor(Math.random() * myChannels.length)]; 
      const r = await getVideoFromChannel(randomChannel); 
      if(r) { setYtVideo(r); setYtLoading(false); return } 
    } 
    const { data } = await supabase.rpc('get_random_video', { chosen_duration: duration, chosen_mood: mood }); 
    if (data && data.length > 0) { 
      setYtVideo(data[0]); 
      // YouTube'u geçmişe kaydetmek opsiyonel, kullanıcı butona basarsa kaydedeceğiz
    } else alert("Video bulunamadı."); 
    setYtLoading(false) 
  }
  const handleReport = async () => { if(ytVideo && confirm("Yanlış kategori mi? Bildirilsin mi?")) { await reportVideo(ytVideo.id, 'wrong_category'); alert("Bildirildi!"); fetchYoutubeVideo(); } }
  
  // YouTube için İzledim Fonksiyonu
  const markYoutubeWatched = async () => {
    if(!ytVideo || !user) return;
    await supabase.from('user_history').insert({
        user_id: user.id, tmdb_id: 0, media_type: 'youtube', title: ytVideo.title
    });
    fetchYoutubeVideo();
  }

  // --- TMDB LOGIC ---
  const toggleGenre = (id: string) => { setSelectedGenres(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); }
  const fetchTmdbContent = async () => { 
    setTmdbLoading(true); setTmdbResult(null); const pStr = platforms.join('|'); 
    try { 
      if (tmdbType === 'movie') { 
        const g = selectedGenres.length > 0 ? selectedGenres.join(',') : (MOOD_TO_MOVIE_GENRE[tmdbMood as keyof typeof MOOD_TO_MOVIE_GENRE] || '35');
        const m = await getSmartRecommendation(g, pStr, 'movie', watchedIds, blacklistedIds, onlyTurkish); 
        if(m) setTmdbResult(m); else alert("Kriterlere uygun film bulunamadı.") 
      } else { 
        // Dizi için arama yapıldıysa onun ID'sini kullan
        let tId = null;
        if (searchQuery) {
           // Eğer dropdown'dan seçilmediyse ve direkt entera basıldıysa
           const s = await searchTvShow(searchQuery);
           if(s) tId = s.id;
           else { alert("Dizi bulunamadı"); setTmdbLoading(false); return }
        }
        const g = selectedGenres.length > 0 ? selectedGenres.join(',') : '35';
        const e = await getRandomEpisode(tId, g, pStr); 
        if(e) setTmdbResult(e); else alert("Bölüm bulunamadı.") 
      } 
    } catch(e) { console.error(e) } 
    finally { setTmdbLoading(false) } 
  }

  const fetchAiRecommendation = async (overridePrompt?: string) => {
    const promptToUse = overridePrompt || aiPrompt; if(!promptToUse) return;
    setTmdbLoading(true); setTmdbResult(null); const pStr = platforms.join('|');
    const aiRes = await askGemini(promptToUse);
    if (aiRes.success) {
      if (aiRes.recommendations?.length) {
         const enrichedMovies = await getMoviesByTitles(aiRes.recommendations);
         if(enrichedMovies.length > 0) { setSwipeMovies(enrichedMovies); setAppMode('swipe'); alert(`AI ${enrichedMovies.length} öneri buldu!`); } else alert("Veritabanında bulunamadı.");
      } else if (aiRes.params) {
         const p = aiRes.params; const safeType: 'movie' | 'tv' = (p.type === 'tv' || p.type === 'movie') ? p.type : 'movie';
         const gArray = p.genre_ids ? p.genre_ids.split(',') : [];
         const m = await getSmartRecommendation(gArray, pStr, safeType, watchedIds, blacklistedIds, false, p.year_range, p.sort_by);
         if(m) { setTmdbResult(m); setAppMode('tmdb'); setTmdbType(safeType); } else alert("Film bulunamadı.");
      }
    } else {
      const { genreIds, sort, year } = analyzePrompt(promptToUse); 
      const m = await getSmartRecommendation([genreIds], pStr, 'movie', watchedIds, blacklistedIds, false, year, sort);
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
        {user ? (
          <div className="flex items-center gap-4"><a href="/profile" className="flex items-center gap-2 text-sm font-bold text-gray-300 hover:text-white transition bg-gray-800 hover:bg-gray-700 py-2 px-4 rounded-full border border-gray-700"><User size={18} /> <span className="hidden md:inline">Profilim</span></a></div>
        ) : (
           <a href="/login" className="flex items-center gap-2 text-sm font-bold bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition"><User size={18} /> Giriş Yap</a>
        )}
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

      {/* AI MODU */}
      {appMode === 'ai' && (
        <div className="flex flex-col items-center mt-12 px-4 animate-in fade-in duration-500 w-full max-w-lg mx-auto text-center">
          <h2 className="text-3xl font-black mb-2 text-cyan-400">Film Sommelier 🤖</h2>
          <p className="text-gray-400 mb-8">Ne hissettiğini söyle, film veya dizi bulayım.</p>
          <div className="w-full relative mb-8">
            <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Örn: 90'larda geçen, beni ağlatacak bir dram..." className="w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 text-white outline-none focus:border-cyan-500 min-h-[120px] resize-none text-lg" />
            <button onClick={() => fetchAiRecommendation()} disabled={!aiPrompt || tmdbLoading} className="absolute bottom-4 right-4 bg-cyan-600 hover:bg-cyan-500 text-white p-3 rounded-xl transition-all shadow-lg shadow-cyan-900/50 disabled:opacity-50">{tmdbLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={24} />}</button>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">{AI_CHIPS.map((chip, i) => (<button key={i} onClick={() => { setAiPrompt(chip); fetchAiRecommendation(chip); }} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2 rounded-full text-sm transition-colors">{chip}</button>))}</div>
        </div>
      )}

      {/* YOUTUBE MODU */}
      {appMode === 'youtube' && (
        <div className="flex flex-col items-center mt-8 px-4 animate-in fade-in duration-500">
           <div className="bg-gray-900/80 p-6 rounded-3xl shadow-2xl w-full max-w-lg border border-gray-800">
             <div className="flex justify-between items-center mb-4">
                <p className="text-gray-400 text-xs font-bold uppercase">Süre</p>
                <button onClick={() => setYtLang(ytLang === 'tr' ? 'all' : 'tr')} className="text-xs font-bold flex items-center gap-1 text-gray-400 hover:text-white">
                  <Globe size={12}/> {ytLang === 'tr' ? 'Sadece Türkçe' : 'Tüm Diller'}
                </button>
             </div>
             <div className="grid grid-cols-3 gap-2 mb-6">{['snack', 'meal', 'feast'].map(d => <button key={d} onClick={() => setDuration(d)} className={`p-3 rounded-xl text-sm font-bold border ${duration === d ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500' : 'bg-gray-800 border-transparent text-gray-400'}`}>{d === 'snack' ? 'Atıştır' : d === 'meal' ? 'Doyur' : 'Ziyafet'}</button>)}</div>
             
             <p className="text-gray-400 mb-3 text-xs font-bold uppercase">Modun</p>
             <div className="flex flex-wrap gap-2 mb-8">
               {YOUTUBE_MOODS.map((m) => (
                 <button key={m.id} onClick={() => setMood(m.id)} className={`px-4 py-2 rounded-xl text-sm font-bold border ${mood === m.id ? `bg-${m.color}-500/20 text-${m.color}-400 border-${m.color}-500` : 'bg-gray-800 border-transparent text-gray-400'}`}>{m.label}</button>
               ))}
             </div>
             <button onClick={fetchYoutubeVideo} disabled={ytLoading} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 shadow-lg active:scale-95">{ytLoading ? <Loader2 className="animate-spin" /> : <><Play fill="currentColor" /> BUL</>}</button>
           </div>
           {ytVideo && (
             <div className="w-full max-w-lg mt-8 animate-in slide-in-from-bottom-4">
               <div className="bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-700 cursor-pointer" onClick={() => window.open(ytVideo.url, '_blank')}>
                  <div className="relative aspect-video"><img src={ytVideo.thumbnail || `https://img.youtube.com/vi/${getYoutubeId(ytVideo.url)}/hqdefault.jpg`} className="w-full h-full object-cover opacity-80"/></div>
                  <div className="p-6"><h2 className="text-lg font-bold text-white line-clamp-2">{ytVideo.title}</h2></div>
               </div>
               <div className="flex justify-center mt-4 gap-3">
                  <button onClick={fetchYoutubeVideo} className="text-xs text-gray-400 hover:text-white flex items-center gap-1 border border-gray-700 px-3 py-1 rounded-full"><RotateCcw size={12}/> Pas Geç</button>
                  <button onClick={markYoutubeWatched} className="text-xs text-gray-400 hover:text-green-400 flex items-center gap-1 border border-gray-700 px-3 py-1 rounded-full"><EyeOff size={12}/> İzledim</button>
                  <button onClick={handleReport} className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1 border border-gray-700 px-3 py-1 rounded-full"><AlertTriangle size={12}/> Raporla</button>
               </div>
             </div>
           )}
        </div>
      )}

      {/* TMDB MODU */}
      {appMode === 'tmdb' && (
        <div className="flex flex-col items-center mt-8 px-4 animate-in fade-in duration-500">
           <div className="bg-gray-900/80 p-6 rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-800">
             <div className="flex bg-black/40 p-1 rounded-xl mb-6">
               <button onClick={() => setTmdbType('movie')} className={`flex-1 py-3 rounded-lg font-bold ${tmdbType === 'movie' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}>Film</button>
               <button onClick={() => setTmdbType('tv')} className={`flex-1 py-3 rounded-lg font-bold ${tmdbType === 'tv' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}>Dizi</button>
             </div>

             <div className="mb-6 flex gap-2 flex-wrap justify-center">{PROVIDERS.map(p => <button key={p.id} onClick={() => {const n = platforms.includes(p.id)?platforms.filter(i=>i!==p.id):[...platforms,p.id]; setPlatforms(n)}} className={`px-3 py-2 rounded-lg border text-xs font-bold ${platforms.includes(p.id) ? 'bg-white text-black' : 'border-gray-700 text-gray-500'}`}>{p.name}</button>)}</div>
             
             {tmdbType === 'tv' && (
               <div className="flex flex-col gap-2 mb-6 relative">
                 <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Dizi Ara..." className="bg-gray-800 border border-gray-700 p-3 rounded-xl flex-1 text-white"/>
                 {/* AUTOCOMPLETE LISTESI */}
                 {showDropdown && searchResults.length > 0 && (
                   <ul className="absolute top-full left-0 w-full bg-gray-900 border border-gray-700 rounded-xl mt-1 z-50 shadow-2xl overflow-hidden">
                     {searchResults.map((show) => (
                       <li key={show.id} onClick={() => handleSearchSelect(show)} className="p-3 hover:bg-gray-800 cursor-pointer text-sm flex items-center gap-3">
                         {show.poster_path && <img src={`https://image.tmdb.org/t/p/w92${show.poster_path}`} className="w-8 h-12 object-cover rounded"/>}
                         <span>{show.name}</span>
                       </li>
                     ))}
                   </ul>
                 )}
               </div>
             )}

             <div className="mb-8">
               <div className="flex justify-between items-center mb-3">
                 <p className="text-xs text-gray-400 uppercase font-bold">Türler (Çoklu Seçim)</p>
                 {tmdbType === 'movie' && <button onClick={() => setOnlyTurkish(!onlyTurkish)} className={`text-xs font-bold flex items-center gap-1 border px-2 py-1 rounded ${onlyTurkish ? 'border-red-500 text-red-500' : 'border-gray-700 text-gray-500'}`}><Flag size={12}/> Yerli</button>}
               </div>
               <div className="flex flex-wrap gap-2">
                 {Object.entries(tmdbType === 'movie' ? MOOD_TO_MOVIE_GENRE : MOOD_TO_TV_GENRE).map(([key, val]) => (
                   <button key={key} onClick={() => toggleGenre(val)} className={`px-3 py-2 rounded-lg border text-sm font-bold transition-all ${selectedGenres.includes(val) ? 'bg-green-900/50 border-green-500 text-green-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                     {selectedGenres.includes(val) && <Check size={12} className="inline mr-1"/>} {GENRE_LABELS[key] || key.toUpperCase()}
                   </button>
                 ))}
               </div>
             </div>

             <button onClick={fetchTmdbContent} disabled={tmdbLoading} className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95">{tmdbLoading ? <Loader2 className="animate-spin mx-auto"/> : 'BUL'}</button>
           </div>

           {/* SONUÇ KARTI */}
           {tmdbResult && (
             <div className="w-full max-w-4xl mt-8 animate-in slide-in-from-bottom-4">
               <div className="bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-700 flex flex-col md:flex-row">
                 <div className="md:w-1/3 relative h-96 md:h-auto"><img src={`https://image.tmdb.org/t/p/w500${tmdbResult.poster_path}`} className="w-full h-full object-cover"/></div>
                 <div className="p-8 md:w-2/3 relative">
                    {tmdbResult.fromFallback && <div className="absolute top-0 left-0 w-full bg-yellow-600/20 text-yellow-500 text-xs font-bold p-2 flex items-center gap-2"><AlertTriangle size={12}/> Seçtiğin platformda yok, genel öneri.</div>}
                    
                    <h2 className="text-3xl font-black text-white mb-2">{tmdbResult.title || tmdbResult.name}</h2>
                    <p className="text-gray-400 text-sm line-clamp-6 mb-6">{tmdbResult.overview || 'Özet bilgisi bulunamadı.'}</p>
                    <div className="flex gap-3">
                      <button onClick={openTrailer} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"><Video size={18}/> Fragman</button>
                      <button onClick={() => window.open(getWatchLink(), '_blank')} className="flex-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2"><Play size={18}/> İzle</button>
                    </div>
                    <div className="flex justify-center gap-4 mt-4">
                       <button onClick={fetchTmdbContent} className="text-gray-400 hover:text-white text-sm flex gap-1"><RotateCcw size={14}/> Pas Geç</button>
                       <button onClick={markAsWatched} className="text-gray-400 hover:text-green-400 text-sm flex gap-1"><EyeOff size={14}/> İzledim</button>
                    </div>
                 </div>
               </div>
             </div>
           )}
        </div>
      )}

      {/* SWIPE MODU */}
      {appMode === 'swipe' && (
        <div className="flex flex-col items-center mt-12 px-4 animate-in fade-in">
          <h2 className="text-2xl font-black mb-6 text-purple-500">Keşfet</h2>
          <MovieSwiper movies={swipeMovies} onSwipe={handleSwipe} onWatch={handleSwipeWatch} />
          <div className="mt-8 flex gap-4">
             <button onClick={() => supabase.from('favorites').select('*').then(({data}) => console.log(data))} className="text-gray-500 text-xs hover:text-white flex items-center gap-1"><Heart size={12}/> Favorilerime Kaydet (Otomatik)</button>
          </div>
        </div>
      )}

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

      {trailerId && <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"><div className="w-full max-w-4xl aspect-video"><button onClick={() => setTrailerId(null)} className="absolute top-4 right-4 text-white"><X size={32}/></button><ReactPlayer url={`https://www.youtube.com/watch?v=${trailerId}`} width="100%" height="100%" playing controls /></div></div>}
    </div>
  )
}