'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import {
  getSmartRecommendation, getRandomEpisode, searchTvShow, searchTvShowsList,
  getVideoFromChannel, getDiscoverBatch, getMoviesByTitles,
  MOOD_TO_MOVIE_GENRE, MOOD_TO_TV_GENRE
} from '@/lib/tmdb'
import { analyzePrompt } from '@/lib/smart-search'
import { checkBadges, askGemini, reportVideo, getAiSuggestions } from './actions'
import { X } from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'

// Components
import Navigation from '@/components/Navigation'
import ModeSelector from '@/components/ModeSelector'
import AiSection from '@/components/sections/AiSection'
import YoutubeSection from '@/components/sections/YoutubeSection'
import TmdbSection from '@/components/sections/TmdbSection'
import SwipeSection from '@/components/sections/SwipeSection'

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;

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
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([])
  const [tmdbLoading, setTmdbLoading] = useState(false)
  const [tmdbType, setTmdbType] = useState<'movie' | 'tv'>('movie')
  const [platforms, setPlatforms] = useState<number[]>([8])
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [tmdbMood, setTmdbMood] = useState('funny')
  const [searchQuery, setSearchQuery] = useState('')
  const [onlyTurkish, setOnlyTurkish] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')

  // Dropdown
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

  // Swipe (Keşfet)
  const [swipeMovies, setSwipeMovies] = useState<any[]>([])
  const [swipePage, setSwipePage] = useState(1)
  const [isSwipingLoading, setIsSwipingLoading] = useState(false)
  const [swipeType, setSwipeType] = useState<'movie' | 'tv'>('movie')

  // Data
  const [watchedIds, setWatchedIds] = useState<number[]>([])
  const [blacklistedIds, setBlacklistedIds] = useState<number[]>([])
  const [favorites, setFavorites] = useState<number[]>([])

  // Modals
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
          if (profile.selected_platforms) setPlatforms(profile.selected_platforms.map((p: string) => parseInt(p)))
          if (profile.favorite_channels) setMyChannels(profile.favorite_channels)
        }
      }
    }
    initData()
    loadSwipeCards(1)
  }, [])

  // --- SWIPE LOGIC ---
  useEffect(() => {
    setSwipeMovies([]);
    setSwipePage(1);
    loadSwipeCards(1);
  }, [swipeType]);

  const loadSwipeCards = async (pageNum: number) => {
    if (isSwipingLoading) return;
    setIsSwipingLoading(true);

    try {
      let currentMovies: any[] = [];
      let attempts = 0;
      let currentPage = pageNum;

      // Keep fetching until we have at least 5 new movies or we tried 5 times
      while (currentMovies.length < 5 && attempts < 5) {
        const movies = await getDiscoverBatch(currentPage, selectedGenres.join(','), swipeType)

        if (!movies || movies.length === 0) {
          break; // End of list
        }

        const uniqueMovies = movies.filter((m: any) =>
          !swipeMovies.some(sm => sm.id === m.id) &&
          !watchedIds.includes(m.id) &&
          !blacklistedIds.includes(m.id) &&
          !currentMovies.some(cm => cm.id === m.id)
        );

        currentMovies = [...currentMovies, ...uniqueMovies];
        currentPage++;
        attempts++;
      }

      setSwipeMovies(prev => [...prev, ...currentMovies])
      setSwipePage(currentPage) // Update global page counter
    } catch (e) { console.error("Swipe error", e) } finally { setIsSwipingLoading(false) }
  }

  const handleSwipe = async (direction: 'left' | 'right', movie: any) => {
    if (swipeMovies.length < 8) loadSwipeCards(swipePage);
    if (direction === 'right' && user) {
      supabase.from('favorites').insert({
        user_id: user.id, tmdb_id: movie.id, media_type: swipeType,
        title: movie.title, poster_path: movie.poster_path, vote_average: movie.vote_average
      }).then(() => setFavorites(prev => [...prev, movie.id]));
    }
  }
  const handleSwipeWatch = (movie: any) => { setTmdbResult(movie); setTmdbType(swipeType); setAppMode('tmdb'); }

  // --- YOUTUBE LOGIC ---
  const fetchYoutubeVideo = async () => {
    setYtLoading(true); setYtVideo(null);
    if (myChannels.length > 0 && Math.random() > 0.5) {
      const r = await getVideoFromChannel(myChannels[Math.floor(Math.random() * myChannels.length)]);
      if (r) { setYtVideo(r); setYtLoading(false); return }
    }
    const { data } = await supabase.rpc('get_random_video', { chosen_duration: duration, chosen_mood: mood });
    if (data && data.length > 0) setYtVideo(data[0]); else alert("Video bulunamadı.");
    setYtLoading(false)
  }
  const handleReport = async () => { if (ytVideo && confirm("Yanlış kategori mi? Bildirilsin mi?")) { await reportVideo(ytVideo.id, 'wrong_category'); alert("Bildirildi!"); fetchYoutubeVideo(); } }
  const markYoutubeWatched = async () => { if (!ytVideo || !user) return; await supabase.from('user_history').insert({ user_id: user.id, tmdb_id: 0, media_type: 'youtube', title: ytVideo.title }); fetchYoutubeVideo(); }

  // --- TMDB LOGIC ---
  const toggleGenre = (id: string) => { setSelectedGenres(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); }

  // Search Autocomplete
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length > 2 && tmdbType === 'tv') {
        const results = await searchTvShowsList(searchQuery);
        setSearchResults(results); setShowDropdown(true);
      } else { setShowDropdown(false); }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, tmdbType]);

  const handleSearchSelect = async (show: any) => {
    setSearchQuery(show.name || show.title); setShowDropdown(false); setTmdbLoading(true);
    const s = await searchTvShow(show.name || show.title);
    if (s) {
      const g = selectedGenres.length > 0 ? selectedGenres.join(',') : '35';
      const e = await getRandomEpisode(s.id, g, platforms.join('|'));
      if (e) setTmdbResult(e); else alert("Bölüm bulunamadı.");
    }
    setTmdbLoading(false);
  }

  const fetchTmdbContent = async () => {
    setTmdbLoading(true); setTmdbResult(null); const pStr = platforms.join('|');
    try {
      if (tmdbType === 'movie') {
        const g = selectedGenres.length > 0 ? selectedGenres.join(',') : (MOOD_TO_MOVIE_GENRE[tmdbMood as keyof typeof MOOD_TO_MOVIE_GENRE] || '35');
        const m = await getSmartRecommendation(g, pStr, 'movie', watchedIds, blacklistedIds, onlyTurkish);
        if (m) setTmdbResult(m); else alert("Film bulunamadı.")
      } else {
        let tId = null;
        if (searchQuery && !showDropdown) {
          const s = await searchTvShow(searchQuery);
          if (s) tId = s.id; else { alert("Dizi bulunamadı"); setTmdbLoading(false); return }
        }
        const g = selectedGenres.length > 0 ? selectedGenres.join(',') : '35';
        const e = await getRandomEpisode(tId, g, pStr);
        if (e) setTmdbResult(e); else alert("Bölüm bulunamadı.")
      }
    } catch (e) { console.error(e) } finally { setTmdbLoading(false) }
  }

  const fetchAiRecommendation = async (promptOverride?: string) => {
    setTmdbLoading(true);
    setTmdbResult(null);
    setAiSuggestions([]);

    const promptToUse = promptOverride || aiPrompt;
    if (!promptToUse) { alert("Bir şeyler yaz."); setTmdbLoading(false); return }

    // 1. Yeni AI Modu (Liste Döndürür)
    const { success, results } = await getAiSuggestions(promptToUse);

    if (success && results && results.length > 0) {
      setAiSuggestions(results);
      setTmdbResult(results[0]); // İlkini göster
      setAppMode('tmdb');
      setTmdbLoading(false);
      setAiPrompt('');
      return;
    }

    // 2. Fallback: Eski mantık (eğer AI listesi boşsa)
    const { genreIds, sort, year } = analyzePrompt(promptToUse);
    const m = await getSmartRecommendation(genreIds, platforms.join('|'), 'movie', watchedIds, blacklistedIds, false, year, sort);
    if (m) {
      setTmdbResult(m);
      setAppMode('tmdb');
      setTmdbType('movie');
    } else {
      alert("Bulunamadı.");
    }
    setTmdbLoading(false);
    setAiPrompt('');
  }

  const openTrailer = () => { if (tmdbResult?.videos?.results) { const t = tmdbResult.videos.results.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube'); if (t) setTrailerId(t.key); else alert("Fragman yok."); } else alert("Fragman yok."); }
  const markAsWatched = async () => { if (!tmdbResult || !user) { if (!user && confirm("Giriş?")) window.location.href = '/login'; return; } await supabase.from('user_history').insert({ user_id: user.id, tmdb_id: tmdbResult.id, media_type: tmdbType, title: tmdbResult.title || tmdbResult.name, poster_path: tmdbResult.poster_path, vote_average: tmdbResult.vote_average }); setWatchedIds([...watchedIds, tmdbResult.id]); fetchTmdbContent(); const { newBadges } = await checkBadges(user.id); if (newBadges?.length) alert(`🎉 Yeni Rozet: ${newBadges.join(', ')}`); }
  const toggleFavorite = async () => { if (!tmdbResult || !user) { alert("Giriş yap."); return; } if (favorites.includes(tmdbResult.id)) { await supabase.from('favorites').delete().eq('user_id', user.id).eq('tmdb_id', tmdbResult.id); setFavorites(favorites.filter(id => id !== tmdbResult.id)) } else { await supabase.from('favorites').insert({ user_id: user.id, tmdb_id: tmdbResult.id, media_type: tmdbType, title: tmdbResult.title || tmdbResult.name, poster_path: tmdbResult.poster_path, vote_average: tmdbResult.vote_average }); setFavorites([...favorites, tmdbResult.id]) } }
  const handleSuggest = async (e: React.FormEvent) => { e.preventDefault(); setSuggestStatus('sending'); const v = getYoutubeId(suggestUrl); if (!v) { setSuggestStatus('error'); return } const { error } = await supabase.from('videos').insert({ title: 'Kullanıcı Önerisi', url: suggestUrl, duration_category: 'meal', mood: 'funny', is_approved: false }); if (!error) { setSuggestStatus('success'); setTimeout(() => { setIsModalOpen(false); setSuggestStatus(''); setSuggestUrl('') }, 2000) } else { setSuggestStatus('db_error') } }
  const togglePlatform = async (id: number) => { const n = platforms.includes(id) ? platforms.filter(p => p !== id) : [...platforms, id]; setPlatforms(n); if (user) await supabase.from('profiles').update({ selected_platforms: n.map(String) }).eq('id', user.id) }
  const getWatchLink = () => {
    if (!tmdbResult) return '#';
    const t = tmdbResult.title || tmdbResult.name;
    const q = encodeURIComponent(t);

    // 1. Netflix (Özel Durum)
    if (platforms.includes(8)) return `https://www.netflix.com/search?q=${q}`;

    // 2. Diğer Her Şey -> TMDB
    // Eğer TMDB sonuçlarında direct link varsa onu kullan, yoksa TMDB ana sayfasına yönlendir
    const tmdbLink = tmdbResult['watch/providers']?.results?.TR?.link;
    if (tmdbLink) return tmdbLink;

    // TMDB Movie/TV Page
    const type = tmdbResult.name ? 'tv' : 'movie';
    // Türkçe arayüzü zorlamak için TR ekleyebiliriz ama varsayılan iyidir.
    return `https://www.themoviedb.org/${type}/${tmdbResult.id}/watch`;
  }

  // Helper for YouTube ID
  const getYoutubeId = (url: string) => { const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/); return (match && match[2].length === 11) ? match[2] : null; }

  // --- TRAILER AUTO FETCH ---
  useEffect(() => {
    if (tmdbResult) {
      if (tmdbResult.videos?.results) {
        const t = tmdbResult.videos.results.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube');
        if (t) setTrailerId(t.key); else setTrailerId(null);
      } else {
        setTrailerId(null);
      }
    }
  }, [tmdbResult]);

  return (
    <main className="min-h-screen text-white pb-20 relative overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-[-1] transition-opacity duration-1000 ease-in-out">
        {(tmdbResult?.backdrop_path || aiSuggestions[0]?.backdrop_path) ? (
          <>
            <Image
              src={`https://image.tmdb.org/t/p/original${tmdbResult?.backdrop_path || aiSuggestions[0]?.backdrop_path}`}
              alt="Background"
              fill
              className="object-cover opacity-30 blur-sm scale-105"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1014] via-[#0f1014]/80 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/40 via-[#0f1014] to-[#0f1014]" />
        )}
      </div>

      <Navigation user={user} />

      {/* Trailer Modal (Auto or Manual) */}
      {isModalOpen && trailerId && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-gray-800">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 z-10 bg-black/50 p-2 rounded-full text-white hover:bg-white hover:text-black transition"><X size={24} /></button>
            <ReactPlayer url={`https://www.youtube.com/watch?v=${trailerId}`} width="100%" height="100%" playing controls />
          </div>
        </div>
      )}

      {!tmdbResult && !ytVideo && appMode !== 'swipe' && (
        <ModeSelector appMode={appMode} setAppMode={setAppMode} />
      )}

      {/* CONTENT SWITCHER */}
      {appMode === 'youtube' && (
        <YoutubeSection
          ytVideo={ytVideo} loading={ytLoading} duration={duration} setDuration={setDuration}
          mood={mood} setMood={setMood} ytLang={ytLang} setYtLang={setYtLang}
          fetchYoutubeVideo={fetchYoutubeVideo} markYoutubeWatched={markYoutubeWatched} handleReport={handleReport}
        />
      )}

      {appMode === 'ai' && (
        <AiSection
          fetchAiRecommendation={fetchAiRecommendation}
          loading={tmdbLoading}
        />
      )}

      {appMode === 'tmdb' && (
        <TmdbSection
          tmdbType={tmdbType} setTmdbType={setTmdbType} platforms={platforms} togglePlatform={togglePlatform}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery} showDropdown={showDropdown} searchResults={searchResults}
          handleSearchSelect={handleSearchSelect} onlyTurkish={onlyTurkish} setOnlyTurkish={setOnlyTurkish}
          toggleGenre={toggleGenre} selectedGenres={selectedGenres} fetchTmdbContent={fetchTmdbContent} loading={tmdbLoading}
          tmdbResult={tmdbResult} openTrailer={() => { if (trailerId) setIsModalOpen(true); else openTrailer(); }}
          getWatchLink={getWatchLink} markAsWatched={markAsWatched} onTryAgain={() => { setTmdbResult(null); setAppMode('ai'); }}
          aiSuggestions={aiSuggestions} setTmdbResult={(m) => { setTmdbResult(m); if (m.media_type) setTmdbType(m.media_type); }}
        />
      )}

      {appMode === 'swipe' && (
        <SwipeSection
          swipeType={swipeType}
          setSwipeType={setSwipeType}
          swipeMovies={swipeMovies}
          handleSwipe={handleSwipe}
          handleSwipeWatch={handleSwipeWatch}
          supabase={supabase}
        />
      )}
    </main>
  )
}