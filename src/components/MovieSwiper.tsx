'use client'

import { useState, useEffect } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { Star, X, Heart, Loader2, Film } from 'lucide-react'
import Image from 'next/image'

// ... (Interface ve Props aynı) ...
interface Movie { id: number; title: string; poster_path: string | null; vote_average: number; overview: string; }
interface Props { movies: Movie[]; onSwipe: (direction: 'left' | 'right', movie: Movie) => void; onWatch: (movie: Movie) => void; }

export default function MovieSwiper({ movies, onSwipe, onWatch }: Props) {
  const [cards, setCards] = useState<Movie[]>(movies)
  const [exitX, setExitX] = useState<number>(0)

  useEffect(() => { setCards(movies) }, [movies])

  // Klavye ve Buton Logic Aynı...
  const removeCard = (id: number, direction: 'left' | 'right') => {
     const movie = cards.find(c => c.id === id); 
     if (movie) onSwipe(direction, movie);
     setCards(prev => prev.filter(c => c.id !== id)); 
  }
  
  const triggerSwipe = (direction: 'left' | 'right') => {
     if (cards.length === 0) return;
     setExitX(direction === 'left' ? -1000 : 1000);
     const topCard = cards[cards.length - 1];
     // Gecikmeyi biraz artırdık ki animasyon görünsün
     setTimeout(() => removeCard(topCard.id, direction), 200); 
  }

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-sm">
      <div className="relative w-full h-[500px] flex items-center justify-center">
        <AnimatePresence custom={exitX}>
           {cards.map((movie, index) => (
             <Card key={movie.id} movie={movie} isTop={index === cards.length - 1} onRemove={() => {}} customExitX={exitX} />
           ))}
        </AnimatePresence>
        {/* Loading State Aynı */}
        {cards.length === 0 && <div className="animate-pulse text-center text-gray-500"><Loader2 size={48} className="animate-spin mb-2 mx-auto"/>Yükleniyor...</div>}
      </div>
      {/* Butonlar Aynı */}
      <div className="flex gap-6 z-10">
        <button onClick={() => triggerSwipe('left')} className="p-4 bg-gray-800 rounded-full text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-95"><X size={32}/></button>
        <button onClick={() => { if(cards.length>0) onWatch(cards[cards.length-1]) }} className="p-5 bg-white text-black rounded-full hover:scale-110 transition-transform"><Film size={28}/></button>
        <button onClick={() => triggerSwipe('right')} className="p-4 bg-gray-800 rounded-full text-green-500 border border-green-500/30 hover:bg-green-500 hover:text-white transition-all shadow-lg active:scale-95"><Heart size={32}/></button>
      </div>
    </div>
  )
}

function Card({ movie, isTop, customExitX }: { movie: Movie, isTop: boolean, onRemove: any, customExitX: number }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-15, 15]) // Dönüş açısını azalttık (Daha sakin)
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])
  
  return (
    <motion.div
      style={{ x, rotate, opacity, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      // YAVAŞLATILMIŞ ANİMASYON (duration: 0.5)
      exit={{ x: customExitX !== 0 ? customExitX : (x.get() < 0 ? -1000 : 1000), opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
      className="absolute top-0 w-full h-full bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 overflow-hidden"
    >
      <div className="relative h-3/4 bg-gray-900">
         {movie.poster_path ? <Image src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} fill className="object-cover" priority={isTop}/> : <div className="h-full flex items-center justify-center"><Film size={48}/></div>}
      </div>
      <div className="h-1/4 p-5 bg-gray-900"><h2 className="text-xl font-bold text-white line-clamp-2">{movie.title}</h2><p className="text-xs text-gray-400 line-clamp-2 mt-2">{movie.overview}</p></div>
    </motion.div>
  )
}