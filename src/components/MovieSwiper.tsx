'use client'

import { useState, useEffect } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { Star, X, Heart, Loader2, Film, Play } from 'lucide-react'
import Image from 'next/image'

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  overview: string;
}

interface Props {
  movies: Movie[];
  onSwipe: (direction: 'left' | 'right', movie: Movie) => void;
  onWatch: (movie: Movie) => void; // YENİ: İzleme fonksiyonu
}

export default function MovieSwiper({ movies, onSwipe, onWatch }: Props) {
  const [cards, setCards] = useState<Movie[]>(movies)
  const [exitX, setExitX] = useState<number>(0)

  useEffect(() => { setCards(movies) }, [movies])

  // Klavye Kontrolü
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (cards.length === 0) return;
      if (e.key === 'ArrowRight') triggerSwipe('right');
      if (e.key === 'ArrowLeft') triggerSwipe('left');
      if (e.key === 'Enter') onWatch(cards[cards.length - 1]); // Enter ile izle
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cards]);

  const triggerSwipe = (direction: 'left' | 'right') => {
    if (cards.length === 0) return;
    setExitX(direction === 'left' ? -1000 : 1000);
    const topCard = cards[cards.length - 1];
    setTimeout(() => {
      onSwipe(direction, topCard);
      setCards((prev) => prev.filter((c) => c.id !== topCard.id));
    }, 50);
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <div className="relative w-full h-[500px] flex items-center justify-center">
        <AnimatePresence custom={exitX}>
          {cards.map((movie, index) => (
            <Card 
              key={movie.id} movie={movie} isTop={index === cards.length - 1} 
              onRemove={(dir) => triggerSwipe(dir)} customExitX={exitX} onWatch={() => onWatch(movie)}
            />
          ))}
        </AnimatePresence>
        
        {cards.length === 0 && (
          <div className="flex flex-col items-center justify-center text-gray-500 animate-pulse text-center">
            <Loader2 size={48} className="animate-spin mb-4 text-purple-500"/>
            <p>Sana özel filmler hazırlanıyor...</p>
          </div>
        )}
      </div>

      {/* ALT BUTONLAR */}
      <div className="flex items-center gap-8 z-10">
        <button onClick={() => triggerSwipe('left')} className="p-4 bg-gray-900 rounded-full text-red-500 border border-red-500/30 hover:bg-red-600 hover:text-white transition-all shadow-lg active:scale-95"><X size={28} /></button>
        
        {/* ORTA: İZLE BUTONU (YENİ) */}
        <button onClick={() => { if(cards.length>0) onWatch(cards[cards.length-1]) }} className="p-5 bg-white text-black rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:scale-110 transition-transform active:scale-95">
            <Play size={32} fill="currentColor" className="ml-1"/>
        </button>

        <button onClick={() => triggerSwipe('right')} className="p-4 bg-gray-900 rounded-full text-green-500 border border-green-500/30 hover:bg-green-600 hover:text-white transition-all shadow-lg active:scale-95"><Heart size={28} fill="currentColor" /></button>
      </div>
    </div>
  )
}

function Card({ movie, isTop, onRemove, customExitX, onWatch }: { movie: Movie, isTop: boolean, onRemove: (dir: 'left'|'right') => void, customExitX: number, onWatch: () => void }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])
  const overlayColor = useTransform(x, [-200, 0, 200], ['rgba(239, 68, 68, 0.5)', 'rgba(0,0,0,0)', 'rgba(34, 197, 94, 0.5)'])

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) onRemove('right')
    else if (info.offset.x < -100) onRemove('left')
  }

  return (
    <motion.div
      style={{ x, rotate, opacity, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ x: customExitX !== 0 ? customExitX : (x.get() < 0 ? -1000 : 1000), opacity: 0, transition: { duration: 0.3 } }}
      className="absolute top-0 w-full h-full bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 cursor-grab active:cursor-grabbing overflow-hidden group"
    >
      {/* Tıklayınca da izlemesi için onClick ekledik */}
      <div className="relative h-3/4 pointer-events-none bg-gray-900 flex items-center justify-center">
        {movie.poster_path ? <Image src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} fill className="object-cover" priority={isTop} /> : <div className="flex flex-col items-center text-gray-600 gap-2"><Film size={48} /><span className="text-xs">Poster Yok</span></div>}
        <motion.div style={{ backgroundColor: overlayColor }} className="absolute inset-0 z-10" />
        
        {/* Bilgi Kartı */}
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pt-12 z-20">
            <h2 className="text-2xl font-bold text-white leading-tight drop-shadow-md">{movie.title}</h2>
            <div className="flex items-center gap-2 mt-2">
                <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded flex items-center gap-1"><Star size={12} fill="currentColor"/> {movie.vote_average.toFixed(1)}</span>
            </div>
        </div>
      </div>

      <div className="h-1/4 p-5 bg-gray-900 flex flex-col justify-between pointer-events-none">
        <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">{movie.overview || 'Bu film için Türkçe özet bulunamadı.'}</p>
        <div className="text-xs text-gray-600 text-center mt-2">Detaylar ve izlemek için butona bas</div>
      </div>
    </motion.div>
  )
}