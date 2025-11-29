'use client'

import { useState, useEffect } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { Star, X, Heart, Loader2, Check, ThumbsDown } from 'lucide-react'
import Image from 'next/image'

interface Movie { id: number; title: string; poster_path: string; vote_average: number; overview: string; }
interface Props { movies: Movie[]; onSwipe: (direction: 'left' | 'right', movie: Movie) => void; }

export default function MovieSwiper({ movies, onSwipe }: Props) {
  const [cards, setCards] = useState<Movie[]>(movies)

  useEffect(() => { setCards(movies) }, [movies])

  // Klavye Kontrolü
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (cards.length === 0) return;
      if (e.key === 'ArrowRight') manualSwipe('right');
      if (e.key === 'ArrowLeft') manualSwipe('left');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cards]);

  const removeCard = (id: number, direction: 'left' | 'right') => {
    const movie = cards.find(c => c.id === id)
    if (movie) onSwipe(direction, movie)
    setCards((prev) => prev.filter((item) => item.id !== id))
  }

  const manualSwipe = (direction: 'left' | 'right') => {
    if (cards.length === 0) return;
    const topCard = cards[cards.length - 1];
    removeCard(topCard.id, direction);
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm">
      <div className="relative w-full h-[500px] flex items-center justify-center">
        <AnimatePresence>
          {cards.map((movie, index) => (
            <Card key={movie.id} movie={movie} isTop={index === cards.length - 1} onRemove={removeCard} />
          ))}
        </AnimatePresence>
        {cards.length === 0 && (
          <div className="flex flex-col items-center justify-center text-gray-500 animate-pulse">
            <Loader2 size={48} className="animate-spin mb-4 text-purple-500"/>
            <p>Yeni filmler yükleniyor...</p>
          </div>
        )}
      </div>

      {/* BUTONLAR */}
      <div className="flex gap-6">
        <button onClick={() => manualSwipe('left')} className="p-4 bg-gray-800 rounded-full text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95">
          <X size={32} />
        </button>
        <button onClick={() => manualSwipe('right')} className="p-4 bg-gray-800 rounded-full text-green-500 border border-green-500/30 hover:bg-green-500 hover:text-white transition-all shadow-lg active:scale-95">
          <Heart size={32} fill="currentColor" />
        </button>
      </div>
    </div>
  )
}

function Card({ movie, isTop, onRemove }: { movie: Movie, isTop: boolean, onRemove: any }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])
  const overlayColor = useTransform(x, [-200, 0, 200], ['rgba(239, 68, 68, 0.5)', 'rgba(0,0,0,0)', 'rgba(34, 197, 94, 0.5)'])

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) onRemove(movie.id, 'right')
    else if (info.offset.x < -100) onRemove(movie.id, 'left')
  }

  return (
    <motion.div
      style={{ x, rotate, opacity, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ x: x.get() < 0 ? -200 : 200, opacity: 0, transition: { duration: 0.2 } }}
      className="absolute top-0 w-full h-full bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 cursor-grab active:cursor-grabbing overflow-hidden"
    >
      <div className="relative h-3/4 pointer-events-none bg-gray-900">
        <Image src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} fill className="object-cover" sizes="400px" priority={isTop} />
        <motion.div style={{ backgroundColor: overlayColor }} className="absolute inset-0 z-10" />
        <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-lg text-yellow-400 font-bold flex items-center gap-1 z-20 backdrop-blur-sm"><Star size={16} fill="currentColor"/> {movie.vote_average.toFixed(1)}</div>
      </div>
      <div className="h-1/4 p-5 flex flex-col justify-center bg-gray-900 pointer-events-none">
        <h2 className="text-xl font-bold text-white line-clamp-1">{movie.title}</h2>
        <p className="text-xs text-gray-400 line-clamp-2 mt-2">{movie.overview || 'Özet bulunamadı.'}</p>
      </div>
      {isTop && (
        <div className="absolute bottom-32 w-full px-8 flex justify-between pointer-events-none z-20">
          <motion.div style={{ opacity: useTransform(x, [-100, 0], [1, 0]) }} className="bg-red-500/80 p-3 rounded-full text-white shadow-lg backdrop-blur"><X size={32}/></motion.div>
          <motion.div style={{ opacity: useTransform(x, [0, 100], [0, 1]) }} className="bg-green-500/80 p-3 rounded-full text-white shadow-lg backdrop-blur"><Heart size={32} fill="currentColor"/></motion.div>
        </div>
      )}
    </motion.div>
  )
}