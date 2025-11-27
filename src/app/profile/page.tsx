'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
// DÜZELTME BURADA: 'Tv' ikonunu import listesine ekledik
import { User, Settings, History, Trash2, Save, Loader2, ArrowLeft, LogOut, Tv } from 'lucide-react'
import { PROVIDERS } from '@/lib/tmdb'

export default function ProfilePage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings')
  const [loading, setLoading] = useState(true)

  // Settings State
  const [myPlatforms, setMyPlatforms] = useState<number[]>([])
  const [saving, setSaving] = useState(false)

  // History State
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      // 1. Profil Ayarlarını Çek
      const { data: profile } = await supabase.from('profiles').select('selected_platforms').eq('id', user.id).single()
      if (profile?.selected_platforms) {
        setMyPlatforms(profile.selected_platforms.map((p: string) => parseInt(p)))
      }

      // 2. İzleme Geçmişini Çek
      const { data: historyData } = await supabase
        .from('user_history')
        .select('*')
        .order('watched_at', { ascending: false })
        .limit(50) // Son 50 izlenen
      
      if (historyData) setHistory(historyData)
      
      setLoading(false)
    }
    fetchData()
  }, [])

  // --- PLATFORM GÜNCELLEME ---
  const togglePlatform = (id: number) => {
    myPlatforms.includes(id) 
      ? setMyPlatforms(myPlatforms.filter(p => p !== id)) 
      : setMyPlatforms([...myPlatforms, id])
  }

  const saveSettings = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      selected_platforms: myPlatforms.map(String)
    }).eq('id', user.id)
    
    if (!error) alert("Tercihlerin güncellendi! ✅")
    else alert("Hata oluştu ❌")
    setSaving(false)
  }

  // --- GEÇMİŞTEN SİLME ---
  const deleteHistoryItem = async (id: number) => {
    if(!confirm("Bu filmi geçmişinden silmek istiyor musun? Tekrar önerilerde çıkabilir.")) return;
    
    await supabase.from('user_history').delete().eq('id', id)
    setHistory(history.filter(h => h.id !== id))
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return <div className="min-h-screen bg-[#0f1014] flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>

  return (
    <div className="min-h-screen bg-[#0f1014] text-white font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition"><ArrowLeft /></button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2"><User className="text-yellow-500"/> Profilim</h1>
              <p className="text-gray-400 text-sm">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-lg transition"><LogOut size={18} /> Çıkış</button>
        </div>

        {/* TABS */}
        <div className="flex gap-4 mb-8 border-b border-gray-800">
          <button onClick={() => setActiveTab('settings')} className={`pb-4 px-4 font-bold transition ${activeTab === 'settings' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-400 hover:text-white'}`}>
            <span className="flex items-center gap-2"><Settings size={18} /> Platform Ayarları</span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`pb-4 px-4 font-bold transition ${activeTab === 'history' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-400 hover:text-white'}`}>
            <span className="flex items-center gap-2"><History size={18} /> İzleme Geçmişi</span>
          </button>
        </div>

        {/* --- TAB 1: AYARLAR --- */}
        {activeTab === 'settings' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
              <h2 className="text-xl font-bold mb-4">Hangi Platformlara Üyesin?</h2>
              <p className="text-gray-400 mb-6 text-sm">Sana sadece seçtiğin platformlardan içerik önereceğiz.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                {PROVIDERS.filter(p => p.id !== 0).map(p => (
                   <button 
                     key={p.id} 
                     onClick={() => togglePlatform(p.id)}
                     className={`p-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${myPlatforms.includes(p.id) ? `${p.color} bg-opacity-20 border-current shadow-[0_0_15px_rgba(0,0,0,0.3)]` : 'bg-gray-800 border-gray-700 text-gray-500 grayscale hover:grayscale-0'}`}
                   >
                     {p.name}
                   </button>
                ))}
              </div>

              <button 
                onClick={saveSettings} 
                disabled={saving}
                className="w-full md:w-auto bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-700 text-white px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                {saving ? <Loader2 className="animate-spin" /> : <><Save size={18}/> Değişiklikleri Kaydet</>}
              </button>
            </div>
          </div>
        )}

        {/* --- TAB 2: GEÇMİŞ --- */}
        {activeTab === 'history' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map(item => (
                <div key={item.id} className="bg-gray-900 border border-gray-800 p-3 rounded-xl flex items-center gap-4 group hover:border-gray-700 transition">
                  {/* Poster */}
                  <div className="w-16 h-24 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                    {item.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w200${item.poster_path}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600"><Tv size={20}/></div>
                    )}
                  </div>
                  
                  {/* Bilgi */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">{item.title || 'İsimsiz İçerik'}</h3>
                    <p className="text-xs text-gray-500 uppercase font-bold mt-1">{item.media_type === 'movie' ? 'Film' : item.media_type === 'tv' ? 'Dizi' : 'YouTube'}</p>
                    {item.vote_average && <div className="text-yellow-500 text-xs font-bold mt-1 flex items-center gap-1"><User size={10}/> {item.vote_average} Puan</div>}
                  </div>

                  {/* Sil Butonu */}
                  <button 
                    onClick={() => deleteHistoryItem(item.id)}
                    className="p-3 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
                    title="Geçmişten Sil"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            {history.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                <History size={48} className="mx-auto mb-4 opacity-20" />
                <p>Henüz hiçbir şeyi "İzledim" olarak işaretlemedin.</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}