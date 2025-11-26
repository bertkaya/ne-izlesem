'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Check, CheckCircle2 } from 'lucide-react'

// TMDb Tür ID'leri
const GENRES = [
  { id: 28, name: 'Aksiyon' },
  { id: 12, name: 'Macera' },
  { id: 35, name: 'Komedi' },
  { id: 80, name: 'Suç' },
  { id: 99, name: 'Belgesel' },
  { id: 18, name: 'Dram' },
  { id: 14, name: 'Fantastik' },
  { id: 27, name: 'Korku' },
  { id: 9648, name: 'Gizem' },
  { id: 10749, name: 'Romantik' },
  { id: 878, name: 'Bilim Kurgu' },
  { id: 53, name: 'Gerilim' },
]

// TMDb Platform ID'leri
const PLATFORMS = [
  { id: 8, name: 'Netflix', color: 'bg-red-600' },
  { id: 119, name: 'Prime Video', color: 'bg-blue-500' },
  { id: 337, name: 'Disney+', color: 'bg-indigo-600' },
  { id: 342, name: 'BluTV', color: 'bg-teal-500' },
  { id: 0, name: 'Gain', color: 'bg-pink-600' } // Gain TMDb'de yoksa manuel yöneteceğiz
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [selectedGenres, setSelectedGenres] = useState<number[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([])
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClientComponentClient()

  // Seçim Fonksiyonları
  const toggleGenre = (id: number) => {
    selectedGenres.includes(id) 
      ? setSelectedGenres(selectedGenres.filter(g => g !== id))
      : setSelectedGenres([...selectedGenres, id])
  }

  const togglePlatform = (id: number) => {
    selectedPlatforms.includes(id)
      ? setSelectedPlatforms(selectedPlatforms.filter(p => p !== id))
      : setSelectedPlatforms([...selectedPlatforms, id])
  }

  // Kaydet ve Bitir
  const handleFinish = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Profil tablosunu güncelle
      const { error } = await supabase
        .from('profiles')
        .update({
          preferred_genres: selectedGenres,
          selected_platforms: selectedPlatforms.map(String), // DB text array tutuyorsa string yapalım
          onboarding_completed: true
        })
        .eq('id', user.id)

      if (!error) {
        router.push('/') // Ana sayfaya postala
      } else {
        alert("Bir hata oluştu!")
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0f1014] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        
        {/* İlerleme Çubuğu */}
        <div className="flex items-center gap-2 mb-8">
          <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-red-500' : 'bg-gray-800'}`} />
          <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-red-500' : 'bg-gray-800'}`} />
        </div>

        {/* --- ADIM 1: TÜRLER --- */}
        {step === 1 && (
          <div className="animate-in slide-in-from-right duration-500">
            <h1 className="text-3xl font-bold mb-2">Hangi türleri seversin?</h1>
            <p className="text-gray-400 mb-6">Sana uygun öneriler yapabilmemiz için en az 3 tane seç.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {GENRES.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => toggleGenre(genre.id)}
                  className={`p-4 rounded-xl border font-semibold transition-all ${selectedGenres.includes(genre.id) ? 'bg-white text-black border-white' : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-600'}`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setStep(2)}
              disabled={selectedGenres.length < 1}
              className="w-full bg-red-600 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-4 rounded-xl transition-all"
            >
              Devam Et
            </button>
          </div>
        )}

        {/* --- ADIM 2: PLATFORMLAR --- */}
        {step === 2 && (
          <div className="animate-in slide-in-from-right duration-500">
            <h1 className="text-3xl font-bold mb-2">Üyeliğin nerede var?</h1>
            <p className="text-gray-400 mb-6">Sadece izleyebileceğin şeyleri önereceğiz.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={`p-6 rounded-xl border flex items-center justify-between transition-all ${selectedPlatforms.includes(platform.id) ? `border-transparent ring-2 ring-white ${platform.color}` : 'bg-gray-900 border-gray-800 hover:bg-gray-800'}`}
                >
                  <span className="font-bold text-lg">{platform.name}</span>
                  {selectedPlatforms.includes(platform.id) && <CheckCircle2 size={24} />}
                </button>
              ))}
            </div>

            <button 
              onClick={handleFinish}
              disabled={loading}
              className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-all"
            >
              {loading ? 'Kaydediliyor...' : 'Bitir ve Başla 🚀'}
            </button>
            <button onClick={() => setStep(1)} className="w-full mt-4 text-gray-500 text-sm hover:text-white">Geri Dön</button>
          </div>
        )}

      </div>
    </div>
  )
}