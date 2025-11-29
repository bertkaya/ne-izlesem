'use client'

import { useState, useEffect } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { Star, X, Heart, Loader2, Film } from 'lucide-react'
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
}

export default function MovieSwiper({ movies, onSwipe }: Props) {
  const [cards, setCards] = useState<Movie[]>(movies)
  const [exitX, setExitX] = useState<number>(0) // Kartın uçacağı yön (Animasyon için)

  useEffect(() => {
    setCards(movies)
  }, [movies])

  // Klavye Kontrolü
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (cards.length === 0) return;
      if (e.key === 'ArrowRight') triggerSwipe('right');
      if (e.key === 'ArrowLeft') triggerSwipe('left');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cards]); // Cards değişince listener güncellensin

  const triggerSwipe = (direction: 'left' | 'right') => {
    if (cards.length === 0) return;
    
    // 1. Animasyon yönünü belirle (-1000 sol, +1000 sağ)
    setExitX(direction === 'left' ? -1000 : 1000);
    
    // 2. En üstteki kartı al
    const topCard = cards[cards.length - 1];
    
    // 3. State güncellemesini bir sonraki döngüye bırak ki animasyon yönü (exitX) algılansın
    setTimeout(() => {
      onSwipe(direction, topCard);
      setCards((prev) => prev.filter((c) => c.id !== topCard.id));
    }, 50);
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm">
      <div className="relative w-full h-[500px] flex items-center justify-center">
        <AnimatePresence custom={exitX}>
          {cards.map((movie, index) => (
            <Card 
              key={movie.id} 
              movie={movie} 
              isTop={index === cards.length - 1} 
              onRemove={(dir) => triggerSwipe(dir)} // Drag bitince tetiklenir
              customExitX={exitX}
            />
          ))}
        </AnimatePresence>
        
        {cards.length === 0 && (
          <div className="flex flex-col items-center justify-center text-gray-500 animate-pulse text-center">
            <Loader2 size={48} className="animate-spin mb-4 text-purple-500"/>
            <p>Yeni filmler yükleniyor...</p>
          </div>
        )}
      </div>

      {/* BUTONLAR */}
      <div className="flex gap-6 z-10">
        <button onClick={() => triggerSwipe('left')} className="p-4 bg-gray-800 rounded-full text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95 group">
           <X size={32} className="group-hover:scale-110 transition-transform"/>
        </button>
        <button onClick={() => triggerSwipe('right')} className="p-4 bg-gray-800 rounded-full text-green-500 border border-green-500/30 hover:bg-green-500 hover:text-white transition-all shadow-lg active:scale-95 group">
           <Heart size={32} fill="currentColor" className="group-hover:scale-110 transition-transform"/>
        </button>
      </div>
      
      <p className="text-gray-600 text-xs mt-2">Klavye ok tuşlarını kullanabilirsiniz ⬅️ ➡️</p>
    </div>
  )
}

function Card({ movie, isTop, onRemove, customExitX }: { movie: Movie, isTop: boolean, onRemove: (dir: 'left'|'right') => void, customExitX: number }) {
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
      // EXIT MANTIĞI: Eğer sürükleniyorsa (x.get() != 0) sürüklenen yöne git, butona basıldıysa customExitX'e git
      exit={{ 
        x: customExitX !== 0 ? customExitX : (x.get() < 0 ? -1000 : 1000), 
        opacity: 0, 
        transition: { duration: 0.3 } 
      }}
      className="absolute top-0 w-full h-full bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 cursor-grab active:cursor-grabbing overflow-hidden"
    >
      <div className="relative h-3/4 pointer-events-none bg-gray-900 flex items-center justify-center">
        {movie.poster_path ? (
          <Image 
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} 
            alt={movie.title} 
            fill 
            className="object-cover" 
            sizes="(max-width: 768px) 100vw, 400px"
            priority={isTop} 
          />
        ) : (
          <div className="flex flex-col items-center text-gray-600 gap-2">
            <Film size={48} />
            <span className="text-xs">Poster Yok</span>
          </div>
        )}
        
        <motion.div style={{ backgroundColor: overlayColor }} className="absolute inset-0 z-10" />
        <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-lg text-yellow-400 font-bold flex items-center gap-1 z-20 backdrop-blur-sm">
          <Star size={16} fill="currentColor"/> {movie.vote_average.toFixed(1)}
        </div>
      </div>

      <div className="h-1/4 p-5 flex flex-col justify-center bg-gray-900 pointer-events-none">
        <h2 className="text-xl font-bold text-white line-clamp-1">{movie.title}</h2>
        <p className="text-xs text-gray-400 line-clamp-2 mt-2">{movie.overview || 'Özet bulunamadı.'}</p>
      </div>
    </motion.div>
  )
}