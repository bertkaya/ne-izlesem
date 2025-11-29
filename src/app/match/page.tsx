'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { getDiscoverBatch } from '@/lib/tmdb'
import MovieSwiper from '@/components/MovieSwiper'
import { Users, Copy, ArrowRight, Loader2, Sparkles, Film, Play } from 'lucide-react'
import Image from 'next/image' // Hız ve Hata Önleme İçin

export default function MatchPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  
  const [user, setUser] = useState<any>(null)
  const [view, setView] = useState<'lobby' | 'swiping' | 'matched'>('lobby')
  const [roomCode, setRoomCode] = useState('')
  const [movies, setMovies] = useState<any[]>([])
  const [matchResult, setMatchResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
    }
    init()
  }, [])

  // REALTIME EŞLEŞME DİNLEYİCİSİ
  useEffect(() => {
    if (!roomCode) return;

    const channel = supabase
      .channel('room-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'match_votes', filter: `room_code=eq.${roomCode}` },
        async (payload) => {
          const newVote = payload.new;
          if (newVote.vote_type === 'like') {
            // Eşleşme kontrolü: Bu film için 2. like geldi mi?
            const { count } = await supabase
              .from('match_votes')
              .select('*', { count: 'exact', head: true })
              .eq('room_code', roomCode)
              .eq('movie_id', newVote.movie_id)
              .eq('vote_type', 'like');
            
            if (count && count >= 2) {
              setMatchResult({
                title: newVote.movie_title,
                poster_path: newVote.poster_path // Null olabilir, aşağıda kontrol edeceğiz
              })
              setView('matched')
            }
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [roomCode])

  const createRoom = async () => {
    setLoading(true)
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    await supabase.from('match_rooms').insert({ code, created_by: user.id })
    setRoomCode(code)
    await loadMovies()
    setView('swiping')
    setLoading(false)
  }

  const joinRoom = async () => {
    if(!roomCode) return;
    setLoading(true)
    const { data } = await supabase.from('match_rooms').select('*').eq('code', roomCode).single()
    if (data) {
      await loadMovies()
      setView('swiping')
    } else {
      alert("Oda bulunamadı!")
    }
    setLoading(false)
  }

  const loadMovies = async () => {
    // Rastgelelik için 1-5 arası bir sayfa seçelim
    const randomPage = Math.floor(Math.random() * 5) + 1;
    const data = await getDiscoverBatch(randomPage) 
    setMovies(data)
  }

  const handleSwipe = async (direction: 'left' | 'right', movie: any) => {
    if (!user || !roomCode) return;
    
    // Hata önleyici: Veritabanına yazarken null kontrolü
    await supabase.from('match_votes').insert({
      room_code: roomCode,
      user_id: user.id,
      movie_id: movie.id,
      movie_title: movie.title || 'İsimsiz Film',
      poster_path: movie.poster_path || null,
      vote_type: direction === 'right' ? 'like' : 'dislike'
    })
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0f1014] text-white font-sans flex flex-col items-center justify-center p-4">
      
      <div className="absolute top-6 left-6 flex items-center gap-2 text-purple-500 font-bold cursor-pointer hover:text-white transition" onClick={() => router.push('/')}>
        <ArrowRight className="rotate-180"/> Ana Sayfa
      </div>

      {/* --- LOBİ --- */}
      {view === 'lobby' && (
        <div className="w-full max-w-md bg-gray-900 p-8 rounded-3xl border border-gray-800 text-center animate-in zoom-in duration-300">
          <div className="bg-purple-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users size={40} className="text-purple-400" />
          </div>
          <h1 className="text-3xl font-black mb-2">Sinema Eşi 💘</h1>
          <p className="text-gray-400 mb-8">Eşinle veya arkadaşınla eşleş, ortak filmi bulun.</p>

          <button onClick={createRoom} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-xl font-bold mb-6 transition-all active:scale-95 shadow-lg shadow-purple-900/20">
            {loading ? <Loader2 className="animate-spin mx-auto"/> : 'Oda Oluştur'}
          </button>
          
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-gray-900 text-gray-500">VEYA</span></div>
          </div>

          <div className="flex gap-2">
            <input 
              value={roomCode} 
              onChange={(e) => setRoomCode(e.target.value)} 
              placeholder="Oda Kodu (1234)" 
              className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center font-mono text-xl tracking-widest outline-none focus:border-purple-500 flex-1 transition-colors"
              maxLength={4}
            />
            <button onClick={joinRoom} disabled={loading || roomCode.length < 4} className="bg-gray-700 hover:bg-gray-600 text-white px-6 rounded-xl font-bold transition-colors">
              Katıl
            </button>
          </div>
        </div>
      )}

      {/* --- SWIPE --- */}
      {view === 'swiping' && (
        <div className="w-full max-w-lg flex flex-col items-center animate-in fade-in">
          <div className="flex items-center gap-3 mb-8 bg-gray-800/50 px-6 py-3 rounded-full border border-gray-700 backdrop-blur-md">
            <span className="text-gray-400 text-sm">Oda Kodu:</span>
            <span className="text-purple-400 font-mono font-bold text-xl tracking-widest">{roomCode}</span>
            <button onClick={() => navigator.clipboard.writeText(roomCode)} className="text-gray-500 hover:text-white ml-2"><Copy size={16}/></button>
          </div>
          
          {/* MovieSwiper Bileşeni Güvenli Şekilde Çağrılıyor */}
          <MovieSwiper movies={movies} onSwipe={handleSwipe} />
          
          <div className="mt-8 flex items-center gap-2 text-sm text-purple-400 animate-pulse">
            <Sparkles size={16} /> Eşleşme bekleniyor...
          </div>
        </div>
      )}

      {/* --- MATCHED (SONUÇ) --- */}
      {view === 'matched' && matchResult && (
        <div className="w-full max-w-md bg-gradient-to-br from-purple-600 to-pink-600 p-1 rounded-3xl shadow-2xl animate-in zoom-in duration-500">
          <div className="bg-[#0f1014] p-8 rounded-[22px] text-center h-full relative overflow-hidden">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">EŞLEŞME!</h2>
            <p className="text-gray-400 mb-6 text-sm">İkiniz de bunu beğendiniz:</p>
            
            <div className="relative aspect-[2/3] w-48 mx-auto rounded-xl overflow-hidden shadow-2xl mb-6 border-2 border-purple-500/50 bg-gray-900 flex items-center justify-center">
              {/* HATA ÇÖZÜMÜ: Image bileşeni ile güvenli gösterim */}
              {matchResult.poster_path ? (
                <Image 
                  src={`https://image.tmdb.org/t/p/w500${matchResult.poster_path}`} 
                  alt={matchResult.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <Film size={48} className="text-gray-600" />
              )}
            </div>
            
            <h3 className="text-xl font-bold text-white mb-8 px-2 line-clamp-2">{matchResult.title}</h3>
            
            <div className="flex gap-3">
                <button onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(matchResult.title)}+izle`, '_blank')} className="flex-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition flex items-center justify-center gap-2">
                  <Play size={20} fill="currentColor"/> Hemen İzle
                </button>
                <button onClick={() => { setMatchResult(null); setView('swiping') }} className="px-6 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700 transition">Devam Et</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}