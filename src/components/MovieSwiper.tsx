'use client'

import { useState, useEffect } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { Star, X, Heart, Info } from 'lucide-react'

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  vote_average: number;
  overview: string;
}

interface Props {
  movies: Movie[];
  onSwipe: (direction: 'left' | 'right', movie: Movie) => void;
}

export default function MovieSwiper({ movies, onSwipe }: Props) {
  const [cards, setCards] = useState<Movie[]>(movies)

  // Liste biterse veya değişirse güncelle
  useEffect(() => {
    setCards(movies)
  }, [movies])

  const removeCard = (id: number, direction: 'left' | 'right') => {
    const movie = cards.find(c => c.id === id)
    if (movie) onSwipe(direction, movie)
    setCards((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="relative w-full h-[500px] flex items-center justify-center overflow-hidden">
      <AnimatePresence>
        {cards.map((movie, index) => {
          // Sadece en üstteki kart sürüklenebilir olsun
          const isTop = index === cards.length - 1
          
          return (
            <Card 
              key={movie.id} 
              movie={movie} 
              isTop={isTop}
              onRemove={removeCard} 
            />
          )
        })}
      </AnimatePresence>
      
      {cards.length === 0 && (
        <div className="text-center text-gray-500 animate-pulse">
          Daha fazla film yükleniyor...
        </div>
      )}
    </div>
  )
}

// --- TEKLİ KART BİLEŞENİ ---
function Card({ movie, isTop, onRemove }: { movie: Movie, isTop: boolean, onRemove: any }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])
  
  // Renk Değişimi (Sağa yeşil, Sola kırmızı)
  const overlayColor = useTransform(x, [-200, 0, 200], ['rgba(239, 68, 68, 0.5)', 'rgba(0,0,0,0)', 'rgba(34, 197, 94, 0.5)'])

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) {
      onRemove(movie.id, 'right')
    } else if (info.offset.x < -100) {
      onRemove(movie.id, 'left')
    }
  }

  return (
    <motion.div
      style={{ x, rotate, opacity, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ x: x.get() < 0 ? -200 : 200, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute top-0 w-full max-w-sm h-full bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 cursor-grab active:cursor-grabbing overflow-hidden"
    >
      {/* Resim */}
      <div className="relative h-3/4 pointer-events-none">
        <img 
          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
          className="w-full h-full object-cover" 
          draggable="false"
        />
        <motion.div style={{ backgroundColor: overlayColor }} className="absolute inset-0 z-10" />
        <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-lg text-yellow-400 font-bold flex items-center gap-1 z-20">
          <Star size={16} fill="currentColor"/> {movie.vote_average.toFixed(1)}
        </div>
      </div>

      {/* Bilgi */}
      <div className="h-1/4 p-5 flex flex-col justify-center bg-gray-900 pointer-events-none">
        <h2 className="text-xl font-bold text-white line-clamp-1">{movie.title}</h2>
        <p className="text-xs text-gray-400 line-clamp-2 mt-2">{movie.overview || 'Özet bulunamadı.'}</p>
      </div>

      {/* İkonlar (Sadece görsel rehber) */}
      {isTop && (
        <div className="absolute bottom-32 w-full px-8 flex justify-between pointer-events-none z-20">
          <div className="bg-red-500/80 p-3 rounded-full text-white shadow-lg"><X size={32}/></div>
          <div className="bg-green-500/80 p-3 rounded-full text-white shadow-lg"><Heart size={32} fill="currentColor"/></div>
        </div>
      )}
    </motion.div>
  )
}