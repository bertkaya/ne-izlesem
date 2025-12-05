'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { getDiscoverBatch } from '@/lib/tmdb'
import MovieSwiper from '@/components/MovieSwiper'
import { Users, Copy, ArrowRight, Loader2, Sparkles, Film, Play } from 'lucide-react'
import Image from 'next/image'

export default function MatchPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [view, setView] = useState<'lobby' | 'swiping' | 'matched'>('lobby')
  const [roomCode, setRoomCode] = useState('')
  const [movies, setMovies] = useState<any[]>([])
  const [matchResult, setMatchResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeUsers, setActiveUsers] = useState<any[]>([])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
    }
    init()
  }, [])

  // Real-time Room Update and Presence
  useEffect(() => {
    if (!roomCode || !user) return;

    const channel = supabase.channel(`room:${roomCode}`, {
      config: {
        presence: { key: user.id }
      }
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState()
        const users = Object.values(newState).flat().map((u: any) => ({
          id: u.user_id,
          email: u.email || 'Anonim'
        }))
        // Filter unique by ID
        const unique = Array.from(new Map(users.map((item: any) => [item.id, item])).values())
        setActiveUsers(unique);
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'match_votes', filter: `room_code=eq.${roomCode}` },
        async (payload) => {
          const newVote = payload.new;
          if (newVote.vote_type === 'like') {
            const { count } = await supabase
              .from('match_votes')
              .select('*', { count: 'exact', head: true })
              .eq('room_code', roomCode)
              .eq('movie_id', newVote.movie_id)
              .eq('vote_type', 'like');

            // Checking if matches count >= activeUsers / 2 or just classic logic
            if (count && count >= 2) {
              setMatchResult({ title: newVote.movie_title, poster_path: newVote.poster_path })
              setView('matched')
            }
          }
        }
      )
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: user.id, email: user.email, online_at: new Date().toISOString() })
        }
      })

    return () => { supabase.removeChannel(channel) }
  }, [roomCode, user])

  const createRoom = async () => {
    if (!user) return;
    setLoading(true)
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    await supabase.from('match_rooms').insert({ code, created_by: user.id })
    setRoomCode(code)
    await loadMovies()
    setView('swiping')
    setLoading(false)
  }

  const joinRoom = async () => {
    if (!roomCode) return;
    setLoading(true)
    const { data } = await supabase.from('match_rooms').select('*').eq('code', roomCode).single()
    if (data) {
      await loadMovies();
      setView('swiping')
    } else {
      alert("Oda bulunamadı!")
    }
    setLoading(false)
  }

  const loadMovies = async () => {
    const randomPage = Math.floor(Math.random() * 5) + 1;
    const data = await getDiscoverBatch(randomPage)
    setMovies(data)
  }

  const handleSwipe = async (direction: 'left' | 'right', movie: any) => {
    if (!user || !roomCode) return;
    await supabase.from('match_votes').insert({
      room_code: roomCode, user_id: user.id, movie_id: movie.id,
      movie_title: movie.title || 'İsimsiz', poster_path: movie.poster_path || null,
      vote_type: direction === 'right' ? 'like' : 'dislike'
    })
  }

  const handleWatch = (movie: any) => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(movie.title)}+izle`, '_blank');
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans flex flex-col items-center justify-center p-4">
      <div className="absolute top-6 left-6 flex items-center gap-2 text-primary font-bold cursor-pointer hover:opacity-80 transition" onClick={() => router.push('/')}><ArrowRight className="rotate-180" /> Ana Sayfa</div>

      {view === 'lobby' && (
        <div className="w-full max-w-md bg-card dark:bg-gray-900 p-8 rounded-3xl border border-gray-800 text-center animate-in zoom-in duration-300 shadow-2xl">
          <div className="bg-purple-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><Users size={40} className="text-purple-400" /></div>
          <h1 className="text-4xl font-black mb-2 tracking-tight">Sinema Eşi 💘</h1>
          <p className="text-gray-400 mb-8 text-lg">Eşinle eşleş, ortak filmi bul.</p>
          <button onClick={createRoom} disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-4 rounded-xl font-bold mb-6 transition-all active:scale-95 shadow-lg relative overflow-hidden group">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : <span className="relative z-10">Oda Oluştur</span>}
          </button>
          <div className="relative mb-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700"></div></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-card dark:bg-gray-900 text-gray-500 font-bold">VEYA</span></div></div>
          <div className="flex gap-2"><input value={roomCode} onChange={(e) => setRoomCode(e.target.value)} placeholder="0000" className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center font-mono text-xl tracking-widest outline-none focus:border-purple-500 flex-1 transition-colors" maxLength={4} /><button onClick={joinRoom} disabled={loading || roomCode.length < 4} className="bg-gray-700 hover:bg-gray-600 text-white px-6 rounded-xl font-bold transition-colors">Katıl</button></div>
        </div>
      )}

      {view === 'swiping' && (
        <div className="w-full max-w-lg flex flex-col items-center animate-in fade-in">
          <div className="flex items-center gap-3 mb-8 bg-gray-800/50 px-6 py-3 rounded-full border border-gray-700 backdrop-blur-md shadow-lg">
            <span className="text-gray-400 text-sm font-bold">ODA:</span>
            <span className="text-purple-400 font-mono font-bold text-xl tracking-widest">{roomCode}</span>
            <button onClick={() => navigator.clipboard.writeText(roomCode)} className="text-gray-500 hover:text-white ml-2"><Copy size={16} /></button>
            {/* Active Users Avatars */}
            <div className="flex -space-x-2 ml-4">
              {activeUsers.map((u, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 border-2 border-gray-800 flex items-center justify-center text-xs text-white font-bold" title={u.email}>
                  {u.email[0].toUpperCase()}
                </div>
              ))}
            </div>
          </div>

          <MovieSwiper movies={movies} onSwipe={handleSwipe} onWatch={handleWatch} />
          <div className="mt-8 flex items-center gap-2 text-sm text-purple-400 animate-pulse font-bold"><Sparkles size={16} /> Eşleşme bekleniyor...</div>
        </div>
      )}

      {view === 'matched' && matchResult && (
        <div className="w-full max-w-md bg-gradient-to-br from-purple-600 to-pink-600 p-1 rounded-3xl shadow-2xl animate-in zoom-in duration-500">
          <div className="bg-[#0f1014] p-8 rounded-[22px] text-center h-full relative overflow-hidden">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">EŞLEŞME!</h2>
            <p className="text-gray-400 mb-6 text-sm">İkiniz de bunu beğendiniz:</p>
            <div className="relative aspect-[2/3] w-48 mx-auto rounded-xl overflow-hidden shadow-2xl mb-6 border-2 border-purple-500/50 bg-gray-900 flex items-center justify-center">
              {matchResult.poster_path ? (<Image src={`https://image.tmdb.org/t/p/w500${matchResult.poster_path}`} alt={matchResult.title} fill className="object-cover" />) : (<Film size={48} className="text-gray-600" />)}
            </div>
            <h3 className="text-xl font-bold text-white mb-8 px-2 line-clamp-2">{matchResult.title}</h3>
            <div className="flex gap-3">
              <button onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(matchResult.title)}+izle`, '_blank')} className="flex-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2"><Play size={20} fill="currentColor" /> Hemen İzle</button>
              <button onClick={() => { setMatchResult(null); setView('swiping') }} className="px-6 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700 transition">Devam Et</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}