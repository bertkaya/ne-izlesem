'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  getSmartRecommendation, getRandomEpisode, searchTvShow, 
  MOOD_TO_MOVIE_GENRE, MOOD_TO_TV_GENRE, PROVIDERS 
} from '@/lib/tmdb'
import { 
  Play, RotateCcw, ExternalLink, Youtube, PlusCircle, X, 
  ShoppingBag, Tv, Film, Utensils, User, LogOut, Star, Search, Loader2, EyeOff 
} from 'lucide-react'

// --- YARDIMCI FONKSİYONLAR ---

// YouTube ID'sini URL'den ayıklar
const getYoutubeId = (url: string) => {
  const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Rotten Tomatoes Puan Simülasyonu (TMDb puanına göre tahmini)
const calculateRottenScore = (tmdbScore: number) => Math.min(100, Math.round(tmdbScore * 10 + (Math.random() * 10 - 5)));

export default function Home() {
  const supabase = createClientComponentClient()
  const [user, setUser] = useState<any>(null)
  
  // --- ANA STATE ---
  const [appMode, setAppMode] = useState<'youtube' | 'tmdb'>('youtube') // Ana Mod Seçimi
  
  // --- YOUTUBE STATE ---
  const [ytVideo, setYtVideo] = useState<any>(null)
  const [ytLoading, setYtLoading] = useState(false)
  const [duration, setDuration] = useState('meal')
  const [mood, setMood] = useState('funny')

  // --- TMDB (FİLM/DİZİ) STATE ---
  const [tmdbResult, setTmdbResult] = useState<any>(null)
  const [tmdbLoading, setTmdbLoading] = useState(false)
  const [tmdbType, setTmdbType] = useState<'movie' | 'tv'>('movie')
  const [platforms, setPlatforms] = useState<number[]>([8]) // Varsayılan Netflix
  const [tmdbMood, setTmdbMood] = useState('funny') 
  const [searchQuery, setSearchQuery] = useState('')

  // --- ALGORİTMA HAFIZASI ---
  const [watchedIds, setWatchedIds] = useState<number[]>([]) // İzlenenler listesi (Local Cache)
  const [blacklistedIds, setBlacklistedIds] = useState<number[]>([]) // Yasaklı listesi

  // --- MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [suggestUrl, setSuggestUrl] = useState('')
  const [suggestDuration, setSuggestDuration] = useState('meal')
  const [suggestMood, setSuggestMood] = useState('funny')
  const [suggestStatus, setSuggestStatus] = useState('')

  // --- BAŞLANGIÇ (INIT) ---
  useEffect(() => {
    const initData = async () => {
      // 1. Kullanıcı Kontrolü
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // 2. Admin Kara Listesini Çek
      const { data: blacklist } = await supabase.from('blacklist').select('tmdb_id')
      if (blacklist) setBlacklistedIds(blacklist.map(b => b.tmdb_id))

      if (user) {
        // 3. Kullanıcının İzleme Geçmişini Çek
        const { data: history } = await supabase.from('user_history').select('tmdb_id').eq('user_id', user.id)
        if (history) setWatchedIds(history.map(h => h.tmdb_id))

        // 4. Kullanıcının Platform Tercihlerini Çek
        const { data: profile } = await supabase.from('profiles').select('selected_platforms').eq('id', user.id).single()
        if (profile?.selected_platforms) {
           const userPlatforms = profile.selected_platforms.map((p: string) => parseInt(p))
           if(userPlatforms.length > 0) setPlatforms(userPlatforms)
        }
      }
    }
    initData()
  }, [])

  // ==========================
  // 1. YOUTUBE MANTIĞI
  // ==========================
  const fetchYoutubeVideo = async () => {
    setYtLoading(true); setYtVideo(null)
    const { data } = await supabase.rpc('get_random_video', { chosen_duration: duration, chosen_mood: mood })
    
    if (data && data.length > 0) {
      setYtVideo(data[0])
      // YouTube videosunu geçmişe kaydet (Sadece ID 0 olarak, detay tutmuyoruz şimdilik)
      if(user) await supabase.from('user_history').insert({ user_id: user.id, tmdb_id: 0, media_type: 'youtube', title: data[0].title })
    } else {
      alert("Bu kategoride video kalmamış! Başka bir seçim yap.")
    }
    setYtLoading(false)
  }

  // ==========================
  // 2. TMDB (GURME) MANTIĞI
  // ==========================
  const fetchTmdbContent = async () => {
    setTmdbLoading(true); setTmdbResult(null)
    const providersStr = platforms.join('|')
    
    try {
      if (tmdbType === 'movie') {
        // --- FİLM BULMA ---
        const genreIds = MOOD_TO_MOVIE_GENRE[tmdbMood as keyof typeof MOOD_TO_MOVIE_GENRE] || '35'
        // İzlenenleri ve yasaklıları fonksiyona paslıyoruz
        const movie = await getSmartRecommendation(genreIds, providersStr, 'movie', watchedIds, blacklistedIds)
        
        if (movie) setTmdbResult(movie)
        else alert("Kriterlere uygun yeni film bulunamadı. Platform eklemeyi dene.")

      } else {
        // --- DİZİ BULMA ---
        let targetId = null;
        if (searchQuery) {
          // Arama varsa önce ID'yi bul
          const searchResult = await searchTvShow(searchQuery)
          if (searchResult) targetId = searchResult.id
          else { alert("Aradığın dizi bulunamadı!"); setTmdbLoading(false); return; }
        }
        
        const genreIds = MOOD_TO_TV_GENRE[tmdbMood as keyof typeof MOOD_TO_TV_GENRE] || '35'
        const episode = await getRandomEpisode(targetId, genreIds, providersStr) 
        
        if (episode) setTmdbResult(episode)
        else alert("Bölüm bulunamadı.")
      }
    } catch (error) { console.error(error); alert("Bir hata oluştu.") } 
    finally { setTmdbLoading(false) }
  }

  // --- İZLEDİM BUTONU (Geçmişe Kaydet) ---
  const markAsWatched = async () => {
    if(!tmdbResult) return;
    if(!user) { 
      if(confirm("Geçmişini kaydetmek için giriş yapmalısın. Giriş sayfasına git?")) window.location.href = '/login';
      return; 
    }

    // Veritabanına detaylı kaydet
    await supabase.from('user_history').insert({ 
      user_id: user.id, 
      tmdb_id: tmdbResult.id, 
      media_type: tmdbType,
      title: tmdbResult.title || tmdbResult.name,
      poster_path: tmdbResult.poster_path || tmdbResult.still_path,
      vote_average: tmdbResult.vote_average
    })

    setWatchedIds([...watchedIds, tmdbResult.id]) // Local listeye ekle (Hemen filtrelemesi için)
    fetchTmdbContent() // Otomatik yeni getir
  }

  // --- PLATFORM DEĞİŞTİRME ---
  const togglePlatform = async (id: number) => {
    const newPlatforms = platforms.includes(id) ? platforms.filter(p => p !== id) : [...platforms, id]
    setPlatforms(newPlatforms)
    if(user) {
       // Veritabanını güncelle
       await supabase.from('profiles').update({ selected_platforms: newPlatforms.map(String) }).eq('id', user.id)
    }
  }

  // --- ÖNERİ GÖNDERME ---
  const handleSuggest = async (e: React.FormEvent) => { 
    e.preventDefault(); setSuggestStatus('sending'); 
    const videoId = getYoutubeId(suggestUrl); 
    if (!videoId) { setSuggestStatus('error'); return } 
    const { error } = await supabase.from('videos').insert({ title: 'Kullanıcı Önerisi', url: suggestUrl, duration_category: suggestDuration, mood: suggestMood, is_approved: false }); 
    if (!error) { setSuggestStatus('success'); setTimeout(() => { setIsModalOpen(false); setSuggestStatus(''); setSuggestUrl('') }, 2000) } else { setSuggestStatus('db_error') } 
  }

  return (
    <div className="min-h-screen bg-[#0f1014] text-white font-sans pb-20 selection:bg-red-500">
      
      {/* NAVBAR */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto border-b border-gray-800/50 backdrop-blur-md sticky top-0 z-40 bg-[#0f1014]/80">
        <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-yellow-500 cursor-pointer" onClick={() => window.location.href='/'}>
          NE İZLESEM?
        </h1>
        {user ? (
          <div className="flex items-center gap-4">
             <a href="/profile" className="flex items-center gap-2 text-sm font-bold text-gray-300 hover:text-white transition bg-gray-800 hover:bg-gray-700 py-2 px-4 rounded-full border border-gray-700">
                <User size={18} /> <span className="hidden md:inline">Profilim</span>
             </a>
          </div>
        ) : (
           <a href="/login" className="flex items-center gap-2 text-sm font-bold bg-white text-black px-4 py-2 rounded-full hover:bg-gray-200 transition"><User size={18} /> Giriş Yap</a>
        )}
      </nav>

      {/* MOD SEÇİCİ */}
      <div className="flex justify-center mt-6 px-4">
        <div className="bg-gray-900 p-1 rounded-2xl border border-gray-800 flex w-full max-w-md shadow-lg">
          <button onClick={() => setAppMode('youtube')} className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${appMode === 'youtube' ? 'bg-gray-800 text-yellow-500 shadow-lg' : 'text-gray-500 hover:text-white'}`}><Utensils size={18} /> Yemek</button>
          <button onClick={() => setAppMode('tmdb')} className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${appMode === 'tmdb' ? 'bg-gray-800 text-red-500 shadow-lg' : 'text-gray-500 hover:text-white'}`}><Film size={18} /> Gurme</button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* YOUTUBE MODU */}
      {/* ========================================================= */}
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
                <div className="relative aspect-video"><img src={`https://img.youtube.com/vi/${getYoutubeId(ytVideo.url)}/hqdefault.jpg`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" /><div className="absolute inset-0 flex items-center justify-center"><div className="bg-red-600/90 text-white p-4 rounded-full shadow-lg"><Youtube size={32} /></div></div></div>
                <div className="p-6"><h2 className="text-lg font-bold text-white mb-2 line-clamp-2">{ytVideo.title}</h2></div>
              </div>
              <div className="mt-4 bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl p-4 flex items-center justify-between shadow-lg cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => window.open('https://www.yemeksepeti.com', '_blank')}>
                <div className="flex items-center gap-3"><div className="bg-white/20 p-2 rounded-lg"><ShoppingBag size={20} /></div><div><p className="font-bold text-white text-sm">Yemeğin Hazır mı?</p><p className="text-xs text-orange-100">Sipariş ver (Sponsor)</p></div></div><ExternalLink size={16} className="opacity-50" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TMDB (GURME) MODU */}
      {/* ========================================================= */}
      {appMode === 'tmdb' && (
        <div className="flex flex-col items-center mt-8 px-4 animate-in fade-in duration-500">
          <div className="bg-gray-900/80 backdrop-blur-lg p-6 rounded-3xl shadow-2xl w-full max-w-2xl mb-8 border border-gray-800">
            
            {/* Film / Dizi Toggle */}
            <div className="flex bg-black/40 p-1 rounded-xl mb-6">
              <button onClick={() => setTmdbType('movie')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${tmdbType === 'movie' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}><Film size={20} /> Film</button>
              <button onClick={() => setTmdbType('tv')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all ${tmdbType === 'tv' ? 'bg-gray-800 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}><Tv size={20} /> Dizi</button>
            </div>

            {/* Platformlar */}
            <div className="mb-6"><p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-3">Platformlar</p><div className="flex gap-2 flex-wrap">{PROVIDERS.map(p => <button key={p.id === 0 ? p.name : p.id} onClick={() => togglePlatform(p.id)} className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all ${platforms.includes(p.id) ? p.color + ' bg-opacity-20 bg-white' : 'border-gray-700 text-gray-600 grayscale'}`}>{p.name}</button>)}</div></div>
            
            {/* Dizi Arama Çubuğu */}
            {tmdbType === 'tv' && <div className="mb-6 relative"><p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-3">Spesifik Dizi Ara</p><div className="relative"><Search className="absolute left-3 top-3 text-gray-500" size={20} /><input type="text" placeholder="Örn: Gibi, Prens" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-10 text-white focus:border-red-500 outline-none" /></div></div>}
            
            {/* Tür Seçimi */}
            <div className="mb-8"><p className="text-xs text-gray-400 uppercase font-bold tracking-widest mb-3">Tür Seç</p><div className="grid grid-cols-3 gap-2">{[['funny', '😂 Komedi'], ['scary', '😱 Gerilim'], ['emotional', '😭 Dram'], ['action', '💥 Aksiyon'], ['scifi', '👽 Bilim Kurgu'], ['crime', '🕵️‍♂️ Suç']].map(([val, label]) => <button key={val} onClick={() => setTmdbMood(val)} className={`p-3 rounded-xl text-xs md:text-sm font-bold transition-all border ${tmdbMood === val ? 'bg-red-600 text-white border-red-600' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}>{label}</button>)}</div></div>
            
            {/* Bul Butonu */}
            <button onClick={fetchTmdbContent} disabled={tmdbLoading} className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95">{tmdbLoading ? <Loader2 className="animate-spin" /> : <><Play fill="currentColor" /> {tmdbType === 'movie' ? 'FİLM BUL' : 'BÖLÜM ÇEVİR'}</>}</button>
          </div>

          {/* SONUÇ KARTI (DETAYLI) */}
          {tmdbResult && (
            <div className="w-full max-w-4xl animate-in slide-in-from-bottom-8 duration-700 mb-10">
              <div className="relative rounded-3xl overflow-hidden bg-gray-800 shadow-2xl border border-gray-700 md:flex">
                <div className="md:w-1/3 relative min-h-[400px]">
                  <img src={`https://image.tmdb.org/t/p/w500${tmdbResult.poster_path || tmdbResult.still_path}`} className="w-full h-full object-cover" />
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-gray-900 via-transparent to-transparent md:hidden"></div>
                </div>
                <div className="p-8 md:w-2/3 flex flex-col justify-center relative">
                  
                  {/* PUANLAR */}
                  <div className="flex gap-4 mb-4">
                    <div className="flex items-center gap-2 bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-lg border border-yellow-500/50 font-bold" title="IMDb Puanı">
                      <span className="bg-yellow-500 text-black px-1 rounded text-xs font-black">IMDb</span>
                      {tmdbResult.vote_average?.toFixed(1) || 'N/A'}
                    </div>
                    <div className="flex items-center gap-2 bg-red-500/20 text-red-500 px-3 py-1 rounded-lg border border-red-500/50 font-bold" title="Rotten Tomatoes (Tahmini)">
                      <span className="text-xl">🍅</span>
                      {calculateRottenScore(tmdbResult.vote_average)}%
                    </div>
                  </div>

                  {tmdbType === 'tv' && <div className="text-yellow-500 font-bold tracking-widest text-xs uppercase mb-2">{tmdbResult.showName} • S{tmdbResult.season} • B{tmdbResult.episode}</div>}
                  <h2 className="text-3xl font-black mb-4 leading-tight text-white">{tmdbResult.title || tmdbResult.name}</h2>
                  <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-4 md:line-clamp-none">{tmdbResult.overview || 'Bu içerik için Türkçe özet henüz eklenmemiş. Ama puanı yüksek, şans ver!'}</p>
                  
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <button onClick={() => window.open(tmdbResult.external_ids?.imdb_id ? `https://www.imdb.com/title/${tmdbResult.external_ids.imdb_id}` : `https://www.google.com/search?q=${tmdbResult.title || tmdbResult.name}+imdb`, '_blank')} className="bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"><ExternalLink size={18}/> IMDb'de Gör</button>
                    <button onClick={() => window.open(`https://www.google.com/search?q=${tmdbResult.title || tmdbResult.name}+izle`, '_blank')} className="bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2"><Play size={20} /> Hemen İzle</button>
                  </div>

                  <div className="flex gap-3">
                    <button onClick={fetchTmdbContent} className="flex-1 border border-gray-600 hover:bg-gray-700 text-gray-300 py-3 rounded-xl transition flex items-center justify-center gap-2"><RotateCcw size={18} /> Pas Geç</button>
                    <button onClick={markAsWatched} className="flex-1 border border-gray-600 hover:bg-gray-700 text-gray-300 py-3 rounded-xl transition flex items-center justify-center gap-2" title="Geçmişe kaydet ve bir daha gösterme"><EyeOff size={18} /> İzledim</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- VİDEO ÖNERME MODALI --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-gray-900 p-6 rounded-2xl w-full max-w-md border border-gray-700 relative">
             <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>
             <h2 className="text-xl font-bold mb-4 text-white">Video Öner</h2>
             <form onSubmit={handleSuggest} className="space-y-4">
               <input required placeholder="YouTube Linki" value={suggestUrl} onChange={e => setSuggestUrl(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white outline-none" />
               <div className="grid grid-cols-2 gap-4"><select value={suggestDuration} onChange={e => setSuggestDuration(e.target.value)} className="bg-gray-800 border border-gray-700 text-white rounded-lg p-3 outline-none"><option value="snack">Atıştırmalık</option><option value="meal">Yemek</option><option value="feast">Ziyafet</option></select><select value={suggestMood} onChange={e => setSuggestMood(e.target.value)} className="bg-gray-800 border border-gray-700 text-white rounded-lg p-3 outline-none"><option value="funny">Komik</option><option value="relax">Rahat</option><option value="learn">Bilgi</option><option value="drama">Dram</option></select></div>
               <button disabled={suggestStatus === 'sending'} type="submit" className="w-full bg-yellow-600 text-white font-bold py-3 rounded-lg">Gönder</button>
             </form>
           </div>
        </div>
      )}
    </div>
  )
}