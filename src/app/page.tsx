'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useLanguage } from '@/components/LanguageContext'
import { useUserData } from '@/hooks/useUserData'
import { useSwipeDeck } from '@/hooks/useSwipeDeck'
import { useYoutubePlayer } from '@/hooks/useYoutubePlayer'
import { useTmdbBrowser } from '@/hooks/useTmdbBrowser'
import { useAiSuggestions } from '@/hooks/useAiSuggestions'
import type { MediaItem } from '@/types/media'

// Components
import Navigation from '@/components/Navigation'
import ModeSelector from '@/components/ModeSelector'
import AiSection from '@/components/sections/AiSection'
import YoutubeSection from '@/components/sections/YoutubeSection'
import TmdbSection from '@/components/sections/TmdbSection'
import SwipeSection from '@/components/sections/SwipeSection'

// react-player v3: video adresi `src` prop'u ile verilir (v2'deki `url` değil)
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

type AppMode = 'youtube' | 'tmdb' | 'swipe' | 'ai'

export default function Home() {
  const { t } = useLanguage()
  const [appMode, setAppMode] = useState<AppMode>('youtube')

  const userData = useUserData()
  const yt = useYoutubePlayer(userData)
  const tmdb = useTmdbBrowser(userData)
  const ai = useAiSuggestions(userData, tmdb.selectItem)
  const swipe = useSwipeDeck(userData, tmdb.selectedGenres)

  const { user } = userData
  const { tmdbResult, trailerKey } = tmdb
  const aiSuggestions = ai.aiSuggestions

  const handleSwipeWatch = (movie: MediaItem) => {
    tmdb.selectItem({ ...movie, media_type: swipe.swipeType })
    setAppMode('tmdb')
  }

  return (
    <main className="min-h-screen text-white pb-20 relative overflow-x-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-[-1] transition-opacity duration-1000 ease-in-out">
        {(tmdbResult?.backdrop_path || aiSuggestions[0]?.backdrop_path) ? (
          <>
            <Image
              src={`https://image.tmdb.org/t/p/original${tmdbResult?.backdrop_path || aiSuggestions[0]?.backdrop_path}`}
              alt="Background"
              fill
              className="object-cover opacity-30 blur-sm scale-105"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1014] via-[#0f1014]/80 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/40 via-[#0f1014] to-[#0f1014]" />
        )}
      </div>

      <Navigation user={user} />

      {/* Trailer Modal */}
      {trailerKey && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-gray-800">
            <button onClick={tmdb.closeTrailer} className="absolute top-4 right-4 z-10 bg-black/50 p-2 rounded-full text-white hover:bg-white hover:text-black transition"><X size={24} /></button>
            <ReactPlayer src={`https://www.youtube.com/watch?v=${trailerKey}`} width="100%" height="100%" playing controls />
          </div>
        </div>
      )}

      <ModeSelector appMode={appMode} setAppMode={setAppMode} />

      {/* CONTENT SWITCHER */}
      {appMode === 'youtube' && (
        <YoutubeSection
          ytVideo={yt.ytVideo} loading={yt.ytLoading} duration={yt.duration} setDuration={yt.setDuration}
          mood={yt.mood} setMood={yt.setMood} ytLang={yt.ytLang} setYtLang={yt.setYtLang}
          fetchYoutubeVideo={yt.fetchYoutubeVideo} markYoutubeWatched={yt.markYoutubeWatched} handleReport={yt.handleReport}
          fetchSurpriseVideo={yt.fetchSurpriseYoutubeVideo} fetchMoreFromChannel={yt.fetchMoreFromChannel}
        />
      )}

      {appMode === 'ai' && (
        <AiSection
          fetchAiRecommendation={ai.fetchAiRecommendation}
          loading={ai.aiLoading}
          aiSuggestions={aiSuggestions}
          selectedMovie={tmdbResult}
          setSelectedMovie={tmdb.selectItem}
          openTrailer={tmdb.openTrailer}
          getWatchLink={tmdb.getWatchLink}
        />
      )}

      {appMode === 'tmdb' && (
        <TmdbSection
          tmdbType={tmdb.tmdbType} setTmdbType={tmdb.setTmdbType} platforms={userData.platforms} togglePlatform={userData.togglePlatform}
          searchQuery={tmdb.searchQuery} setSearchQuery={tmdb.setSearchQuery} showDropdown={tmdb.showDropdown} searchResults={tmdb.searchResults}
          handleSearchSelect={tmdb.handleSearchSelect} onlyTurkish={tmdb.onlyTurkish} setOnlyTurkish={tmdb.setOnlyTurkish}
          toggleGenre={tmdb.toggleGenre} selectedGenres={tmdb.selectedGenres} fetchTmdbContent={tmdb.fetchTmdbContent} loading={tmdb.tmdbLoading}
          tmdbResult={tmdbResult} openTrailer={tmdb.openTrailer}
          getWatchLink={tmdb.getWatchLink} markAsWatched={tmdb.markAsWatched} onTryAgain={() => { tmdb.selectItem(null); setAppMode('ai'); }}
          aiSuggestions={aiSuggestions} setTmdbResult={tmdb.selectItem}
        />
      )}

      {appMode === 'swipe' && (
        <SwipeSection
          swipeType={swipe.swipeType}
          setSwipeType={swipe.setSwipeType}
          swipeMovies={swipe.swipeMovies}
          handleSwipe={swipe.handleSwipe}
          handleSwipeWatch={handleSwipeWatch}
        />
      )}

      {/* FOOTER */}
      <footer className="w-full text-center py-8 text-gray-500 text-xs mt-12 border-t border-gray-800/50 flex flex-col items-center gap-4">
        <div className="text-center px-4">
          <p className="mb-2 uppercase font-bold tracking-widest text-gray-400">{t.footer.brand}</p>
          <p className="max-w-md mx-auto">{t.footer.desc}</p>
        </div>

        <div className="flex flex-col items-center gap-2 mt-2 opacity-70 hover:opacity-100 transition-opacity">
          <a href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">
            <Image
              src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
              alt="TMDB Logo"
              width={150}
              height={20}
              className="h-4 w-auto"
              unoptimized
            />
          </a>
          <p className="text-[10px] max-w-md mx-auto">
            {t.footer.disclaimer}
          </p>
        </div>
      </footer>

      {/* JSON-LD Structured Data for SEO */}
      {tmdbResult && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": tmdbResult.media_type === 'tv' ? "TVSeries" : "Movie",
              "name": tmdbResult.title || tmdbResult.name,
              "description": tmdbResult.overview,
              "image": `https://image.tmdb.org/t/p/original${tmdbResult.poster_path}`,
              "datePublished": tmdbResult.release_date || tmdbResult.first_air_date,
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": tmdbResult.vote_average,
                "bestRating": "10",
                "ratingCount": tmdbResult.vote_count
              }
            })
          }}
        />
      )}
    </main>
  )
}