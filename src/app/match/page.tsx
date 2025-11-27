'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { getDiscoverBatch } from '@/lib/tmdb'
import MovieSwiper from '@/components/MovieSwiper'
import { Users, Copy, CheckCircle, ArrowRight, Loader2, Heart, Share2 } from 'lucide-react'

export default function MatchPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  
  // State
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

  // --- REALTIME DİNLEME ---
  useEffect(() => {
    if (!roomCode) return;

    // Odadaki hareketleri dinle
    const channel = supabase
      .channel('room-updates')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'match_votes', filter: `room_code=eq.${roomCode}` },
        async (payload) => {
          // Biri oy verdiğinde kontrol et: Eşleşme var mı?
          const newVote = payload.new;
          if (newVote.vote_type === 'like') {
            // Bu film için bu odada kaç tane 'like' var?
            const { count } = await supabase
              .from('match_votes')
              .select('*', { count: 'exact', head: true })
              .eq('room_code', roomCode)
              .eq('movie_id', newVote.movie_id)
              .eq('vote_type', 'like');
            
            // Eğer 2 kişi de beğendiyse EŞLEŞME!
            if (count && count >= 2) {
              setMatchResult({
                title: newVote.movie_title,
                poster_path: newVote.poster_path
              })
              setView('matched')
            }
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [roomCode])

  // --- ODA İŞLEMLERİ ---
  const createRoom = async () => {
    setLoading(true)
    const code = Math.floor(1000 + Math.random() * 9000).toString(); // 4 haneli kod
    await supabase.from('match_rooms').insert({ code, created_by: user.id })
    setRoomCode(code)
    await loadMovies()
    setView('swiping')
    setLoading(false)
  }

  const joinRoom = async () => {
    if(!roomCode) return;
    setLoading(true)
    // Oda var mı kontrol et
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
    // Rastgele bir sayfa seçip ikisine de aynı filmleri gösterelim
    // Not: Gerçek senaryoda bu sayfa numarasını DB'de odanın içine kaydetmek gerekir ki ikisi de aynı görsün.
    // Şimdilik basit tutmak için 1. sayfadan başlatıyoruz.
    const data = await getDiscoverBatch(1) 
    setMovies(data)
  }

  // --- SWIPE İŞLEMİ ---
  const handleSwipe = async (direction: 'left' | 'right', movie: any) => {
    if (!user || !roomCode) return;

    await supabase.from('match_votes').insert({
      room_code: roomCode,
      user_id: user.id,
      movie_id: movie.id,
      movie_title: movie.title,
      poster_path: movie.poster_path,
      vote_type: direction === 'right' ? 'like' : 'dislike'
    })
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0f1014] text-white font-sans flex flex-col items-center justify-center p-4">
      
      {/* HEADER */}
      <div className="absolute top-6 left-6 flex items-center gap-2 text-purple-500 font-bold cursor-pointer" onClick={() => router.push('/')}>
        <ArrowRight className="rotate-180"/> Ana Sayfa
      </div>

      {/* --- 1. LOBİ EKRANI --- */}
      {view === 'lobby' && (
        <div className="w-full max-w-md bg-gray-900 p-8 rounded-3xl border border-gray-800 text-center animate-in zoom-in duration-300">
          <div className="bg-purple-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users size={40} className="text-purple-400" />
          </div>
          <h1 className="text-3xl font-black mb-2">Çift Modu 🔥</h1>
          <p className="text-gray-400 mb-8">Eşinle veya arkadaşınla eşleş, ortak filmi bulun.</p>

          <button onClick={createRoom} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-xl font-bold mb-4 transition-all active:scale-95">
            {loading ? <Loader2 className="animate-spin mx-auto"/> : 'Oda Oluştur'}
          </button>
          
          <div className="flex items-center gap-4 my-4">
            <div className="h-[1px] bg-gray-700 flex-1"></div>
            <span className="text-gray-500 text-sm">VEYA</span>
            <div className="h-[1px] bg-gray-700 flex-1"></div>
          </div>

          <div className="flex gap-2">
            <input 
              value={roomCode} 
              onChange={(e) => setRoomCode(e.target.value)} 
              placeholder="Oda Kodu (1234)" 
              className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center font-mono text-xl tracking-widest outline-none focus:border-purple-500 flex-1"
              maxLength={4}
            />
            <button onClick={joinRoom} disabled={loading || roomCode.length < 4} className="bg-gray-700 hover:bg-gray-600 text-white px-6 rounded-xl font-bold">
              Katıl
            </button>
          </div>
        </div>
      )}

      {/* --- 2. SWIPE EKRANI --- */}
      {view === 'swiping' && (
        <div className="w-full max-w-lg flex flex-col items-center animate-in fade-in">
          <div className="flex items-center gap-3 mb-6 bg-gray-800 px-4 py-2 rounded-full border border-gray-700">
            <span className="text-gray-400 text-sm">Oda Kodu:</span>
            <span className="text-purple-400 font-mono font-bold text-xl">{roomCode}</span>
            <button onClick={() => navigator.clipboard.writeText(roomCode)} className="text-gray-500 hover:text-white"><Copy size={16}/></button>
          </div>
          
          <h2 className="text-2xl font-bold mb-4 text-center">Birlikte Seçiyorsunuz...</h2>
          <MovieSwiper movies={movies} onSwipe={handleSwipe} />
          
          <p className="mt-8 text-sm text-gray-500 text-center animate-pulse">
            Eşleşme bekleniyor...
          </p>
        </div>
      )}

      {/* --- 3. EŞLEŞME EKRANI (MATCH) --- */}
      {view === 'matched' && matchResult && (
        <div className="w-full max-w-md bg-gradient-to-br from-purple-900 to-indigo-900 p-1 rounded-3xl shadow-2xl animate-in zoom-in duration-500">
          <div className="bg-[#0f1014] p-8 rounded-[22px] text-center h-full">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">EŞLEŞME!</h2>
            <p className="text-gray-300 mb-6">İkiniz de bunu beğendiniz:</p>
            
            <div className="relative aspect-[2/3] w-48 mx-auto rounded-xl overflow-hidden shadow-lg mb-6 border-2 border-purple-500/50">
              <img src={`https://image.tmdb.org/t/p/w500${matchResult.poster_path}`} className="w-full h-full object-cover" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-8">{matchResult.title}</h3>
            
            <div className="flex gap-3">
                <button onClick={() => window.open(`https://www.google.com/search?q=${matchResult.title}+izle`, '_blank')} className="flex-1 bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition">Hemen İzle</button>
                <button onClick={() => { setMatchResult(null); setView('swiping') }} className="px-6 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700">Devam Et</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}