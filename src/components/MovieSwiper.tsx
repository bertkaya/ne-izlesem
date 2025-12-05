'use client'

import { useState, useEffect } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { Star, X, Heart, Loader2, Film } from 'lucide-react'
import Image from 'next/image'

interface Movie {
  id: number;
  title: string;
  name?: string; // For TV shows
  poster_path: string | null;
  vote_average: number;
  overview: string;
}

interface Props {
  movies: Movie[];
  onSwipe: (direction: 'left' | 'right', movie: Movie) => void;
  onWatch: (movie: Movie) => void;
}

export default function MovieSwiper({ movies, onSwipe, onWatch }: Props) {
  const [cards, setCards] = useState<Movie[]>(movies)
  const [exitX, setExitX] = useState<number>(0)

  useEffect(() => {
    setCards(movies)
  }, [movies])

  const removeCard = (id: number, direction: 'left' | 'right') => {
    const movie = cards.find(c => c.id === id);
    if (movie) {
      onSwipe(direction, movie);
    }
    setExitX(direction === 'left' ? -1000 : 1000);
    setTimeout(() => {
      setCards(prev => prev.filter(c => c.id !== id));
      setExitX(0); // Reset
    }, 200);
  }

  const handleDragEnd = (offset: number, id: number) => {
    if (offset > 100) {
      removeCard(id, 'right');
    } else if (offset < -100) {
      removeCard(id, 'left');
    }
  }

  const triggerSwipe = (direction: 'left' | 'right') => {
    if (cards.length === 0) return;
    const topCard = cards[cards.length - 1];
    removeCard(topCard.id, direction);
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm">
      <div className="relative w-full h-[500px] flex items-center justify-center perspective-1000">
        <AnimatePresence>
          {cards.map((movie, index) => (
            <Card
              key={movie.id}
              movie={movie}
              isTop={index === cards.length - 1}
              onDragEnd={(offset) => handleDragEnd(offset, movie.id)}
              customExitX={exitX}
            />
          ))}
        </AnimatePresence>

        {cards.length === 0 && (
          <div className="animate-pulse text-center text-gray-500 flex flex-col items-center">
            <Loader2 size={48} className="animate-spin mb-2" />
            <p>Yeni içerikler yükleniyor...</p>
          </div>
        )}
      </div>

      <div className="flex gap-6 z-10">
        <button onClick={() => triggerSwipe('left')} className="p-4 bg-gray-800 rounded-full text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95 group">
          <X size={32} className="group-hover:scale-110 transition-transform" />
        </button>
        <button onClick={() => { if (cards.length > 0) onWatch(cards[cards.length - 1]) }} className="p-5 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-xl hover:shadow-2xl active:scale-95">
          <Film size={28} />
        </button>
        <button onClick={() => triggerSwipe('right')} className="p-4 bg-gray-800 rounded-full text-green-500 border border-green-500/30 hover:bg-green-500 hover:text-white transition-all shadow-lg active:scale-95 group">
          <Heart size={32} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  )
}

function Card({ movie, isTop, onDragEnd, customExitX }: { movie: Movie, isTop: boolean, onDragEnd: (offset: number) => void, customExitX: number }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])
  const scale = useTransform(x, [-200, 0, 200], [0.8, 1, 0.8])

  // Visual indicators for swipe
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  return (
    <motion.div
      style={{ x, rotate, opacity, scale, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info) => {
        if (isTop) onDragEnd(info.offset.x)
      }}
      initial={{ scale: 0.9, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ x: customExitX || (x.get() < 0 ? -1000 : 1000), opacity: 0, transition: { duration: 0.4 } }}
      className="absolute top-0 w-full h-full bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 overflow-hidden cursor-grab active:cursor-grabbing"
    >
      {/* Swipe Indicators */}
      {isTop && (
        <>
          <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 right-8 z-20 border-4 border-green-500 text-green-500 font-bold text-4xl px-4 py-2 rounded-xl transform rotate-12 bg-black/20 backdrop-blur-sm">
            BEĞEN
          </motion.div>
          <motion.div style={{ opacity: nopeOpacity }} className="absolute top-8 left-8 z-20 border-4 border-red-500 text-red-500 font-bold text-4xl px-4 py-2 rounded-xl transform -rotate-12 bg-black/20 backdrop-blur-sm">
            GEÇ
          </motion.div>
        </>
      )}

      <div className="relative h-3/4 bg-gray-900">
        {movie.poster_path ? (
          <Image
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={movie.title || movie.name || 'Film'}
            fill
            className="object-cover pointer-events-none"
            priority={isTop}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-gray-800">
            <Film size={64} className="text-gray-600" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-gray-900 to-transparent" />
      </div>
      <div className="h-1/4 p-6 bg-gray-900 flex flex-col justify-center relative z-10">
        <h2 className="text-lg font-black text-white line-clamp-1 mb-1">{movie.title || movie.name}</h2>
        <div className="flex items-center gap-4 mb-2">
          {/* IMDB / TMDB Score */}
          <div className="flex items-center gap-1">
            <Star size={16} className="text-yellow-400 fill-yellow-400" />
            <span className="text-yellow-400 font-bold text-lg">{movie.vote_average?.toFixed(1) || '0.0'}</span>
          </div>

          {/* Rotten Tomatoes / Match Score (Simulated) */}
          <div className="flex items-center gap-1">
            <div className="bg-red-600 text-white text-[10px] font-bold px-1 rounded">TOMATO</div>
            <span className="text-white font-bold text-lg">{Math.round((movie.vote_average || 0) * 10)}%</span>
          </div>
        </div>
        <p className="text-sm text-gray-400 line-clamp-2">{movie.overview || 'Özet bilgisi bulunmuyor.'}</p>
      </div>
    </motion.div>
  )
}