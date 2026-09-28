'use client'

import { useState, useEffect } from 'react'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { Star, X, Heart, Loader2, Film, Play, Calendar } from 'lucide-react'
import Image from 'next/image'
import { useLanguage } from '@/components/LanguageContext'
import { displayTitle, releaseYear as getReleaseYear, type MediaItem as Movie } from '@/types/media'

interface Props {
  movies: Movie[];
  onSwipe: (direction: 'left' | 'right', movie: Movie) => void;
  onWatch: (movie: Movie) => void;
}

export default function MovieSwiper({ movies, onSwipe, onWatch }: Props) {
  const { t } = useLanguage()
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
      setExitX(0);
    }, 200);
  }

  const handleDragEnd = (offset: number, id: number) => {
    if (offset > 90) {
      removeCard(id, 'right');
    } else if (offset < -90) {
      removeCard(id, 'left');
    }
  }

  const triggerSwipe = (direction: 'left' | 'right') => {
    if (cards.length === 0) return;
    const topCard = cards[cards.length - 1];
    removeCard(topCard.id, direction);
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm px-2">
      {/* KART DECK */}
      <div className="relative w-full h-[520px] md:h-[560px] flex items-center justify-center perspective-1000">
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
          <div className="text-center text-gray-400 flex flex-col items-center justify-center p-8 bg-gray-900/60 rounded-3xl border border-gray-800 backdrop-blur-md w-full h-full shadow-2xl">
            <Loader2 size={48} className="animate-spin mb-4 text-purple-500" />
            <p className="font-bold text-white text-lg mb-1">{t.swipe.loading}</p>
            <p className="text-xs text-gray-500">{t.swipe.loadingSub}</p>
          </div>
        )}
      </div>

      {/* SWIPE KONTROL BUTONLARI */}
      <div className="flex items-center gap-6 z-10 mt-2">
        <button
          onClick={() => triggerSwipe('left')}
          title={t.swipe.passTitle}
          className="p-4 bg-gray-900/90 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white rounded-full transition-all shadow-xl hover:shadow-red-500/20 active:scale-90 group"
        >
          <X size={28} className="group-hover:scale-110 transition-transform" />
        </button>

        <button
          onClick={() => { if (cards.length > 0) onWatch(cards[cards.length - 1]) }}
          title={t.swipe.detailsTitle}
          className="p-5 bg-gradient-to-tr from-purple-600 to-pink-600 text-white rounded-full hover:scale-110 transition-all shadow-2xl hover:shadow-purple-500/40 active:scale-95 group"
        >
          <Play fill="currentColor" size={24} className="group-hover:scale-110 transition-transform ml-0.5" />
        </button>

        <button
          onClick={() => triggerSwipe('right')}
          title={t.swipe.likeTitle}
          className="p-4 bg-gray-900/90 text-green-500 border border-green-500/30 hover:bg-green-500 hover:text-white rounded-full transition-all shadow-xl hover:shadow-green-500/20 active:scale-90 group"
        >
          <Heart fill="currentColor" size={28} className="group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  )
}

function Card({ movie, isTop, onDragEnd, customExitX }: { movie: Movie, isTop: boolean, onDragEnd: (offset: number) => void, customExitX: number }) {
  const { t } = useLanguage()
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-20, 20])
  const opacity = useTransform(x, [-200, -120, 0, 120, 200], [0.3, 1, 1, 1, 0.3])
  const scale = useTransform(x, [-200, 0, 200], [0.92, 1, 0.92])

  const likeOpacity = useTransform(x, [10, 80], [0, 1]);
  const nopeOpacity = useTransform(x, [-80, -10], [1, 0]);

  const title = displayTitle(movie) || t.common.untitled;
  const releaseYear = getReleaseYear(movie);

  return (
    <motion.div
      style={{ x, rotate, opacity, scale, zIndex: isTop ? 10 : 0 }}
      drag={isTop ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(_, info) => {
        if (isTop) onDragEnd(info.offset.x)
      }}
      initial={{ scale: 0.92, opacity: 0, y: 15 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ x: customExitX || (x.get() < 0 ? -1000 : 1000), opacity: 0, transition: { duration: 0.35 } }}
      className="absolute top-0 w-full h-full rounded-3xl shadow-2xl border border-gray-700/60 overflow-hidden cursor-grab active:cursor-grabbing bg-gray-950 select-none"
    >
      {/* BEĞEN GÖSTERGESİ */}
      {isTop && (
        <>
          <motion.div
            style={{ opacity: likeOpacity }}
            className="absolute top-6 right-6 z-30 border-4 border-green-500 text-green-400 font-black text-3xl px-4 py-1.5 rounded-2xl transform rotate-12 bg-black/60 backdrop-blur-md shadow-2xl pointer-events-none"
          >
            {t.swipe.like}
          </motion.div>
          <motion.div
            style={{ opacity: nopeOpacity }}
            className="absolute top-6 left-6 z-30 border-4 border-red-500 text-red-400 font-black text-3xl px-4 py-1.5 rounded-2xl transform -rotate-12 bg-black/60 backdrop-blur-md shadow-2xl pointer-events-none"
          >
            {t.swipe.pass}
          </motion.div>
        </>
      )}

      {/* FULL-BLEED POSTER GÖRSELİ */}
      <div className="absolute inset-0 w-full h-full bg-gray-900">
        {movie.poster_path ? (
          <Image
            src={`https://image.tmdb.org/t/p/w780${movie.poster_path}`}
            alt={title}
            fill
            className="object-cover pointer-events-none"
            priority={isTop}
            sizes="(max-width: 640px) 100vw, 400px"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-gray-600 gap-2">
            <Film size={54} />
            <span className="text-xs">{t.common.noImage}</span>
          </div>
        )}
      </div>

      {/* ÜST VIGNETTE */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black/70 via-black/20 to-transparent pointer-events-none z-10" />

      {/* ALT SİNEMATİK KARARTMA & BİLGİ ALANI */}
      <div className="absolute bottom-0 left-0 w-full h-80 bg-gradient-to-t from-black via-black/85 via-45% to-transparent p-6 flex flex-col justify-end z-20 pointer-events-none">
        {/* ROZETLER */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-1 bg-yellow-500/20 backdrop-blur-md border border-yellow-500/50 px-2 py-0.5 rounded-md">
            <Star size={13} className="text-yellow-400 fill-yellow-400" />
            <span className="text-yellow-300 font-bold text-xs">{movie.vote_average?.toFixed(1) || '0.0'}</span>
          </div>

          {releaseYear && (
            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md border border-white/20 px-2 py-0.5 rounded-md text-xs font-semibold text-gray-200">
              <Calendar size={12} />
              <span>{releaseYear}</span>
            </div>
          )}
        </div>

        {/* BAŞLIK (KRİSTAL NETLİKTE, BÜYÜK VE ASLA KESİLMEYEN) */}
        <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2 drop-shadow-lg line-clamp-2">
          {title}
        </h2>

        {/* ÖZET */}
        <p className="text-xs md:text-sm text-gray-300 line-clamp-3 leading-relaxed drop-shadow">
          {movie.overview || t.common.noOverview}
        </p>
      </div>
    </motion.div>
  )
}