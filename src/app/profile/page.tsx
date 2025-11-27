'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { User, Settings, History, Trash2, Save, Loader2, ArrowLeft, LogOut, Tv, Youtube, Plus } from 'lucide-react'
import { PROVIDERS } from '@/lib/tmdb'

export default function ProfilePage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'settings' | 'channels' | 'history'>('settings') // Channels Eklendi
  const [loading, setLoading] = useState(true)

  // Settings State
  const [myPlatforms, setMyPlatforms] = useState<number[]>([])
  const [myChannels, setMyChannels] = useState<string[]>([]) // Kanal ID Listesi
  const [newChannel, setNewChannel] = useState('')
  const [saving, setSaving] = useState(false)

  // History State
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      // Profil Verileri
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (profile) {
        if(profile.selected_platforms) setMyPlatforms(profile.selected_platforms.map((p: string) => parseInt(p)))
        if(profile.favorite_channels) setMyChannels(profile.favorite_channels)
      }

      // Geçmiş
      const { data: historyData } = await supabase.from('user_history').select('*').order('watched_at', { ascending: false }).limit(50)
      if (historyData) setHistory(historyData)
      
      setLoading(false)
    }
    fetchData()
  }, [])

  // --- KAYDETME ---
  const saveAll = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      selected_platforms: myPlatforms.map(String),
      favorite_channels: myChannels
    }).eq('id', user.id)
    if (!error) alert("Kaydedildi! ✅")
    setSaving(false)
  }

  // --- KANAL YÖNETİMİ ---
  const addChannel = () => {
    if(newChannel.startsWith('UC') && newChannel.length > 10) {
      setMyChannels([...myChannels, newChannel])
      setNewChannel('')
    } else {
      alert("Geçerli bir Kanal ID girin (UC ile başlar).")
    }
  }

  const removeChannel = (id: string) => setMyChannels(myChannels.filter(c => c !== id))
  const togglePlatform = (id: number) => myPlatforms.includes(id) ? setMyPlatforms(myPlatforms.filter(p => p !== id)) : setMyPlatforms([...myPlatforms, id])
  const deleteHistoryItem = async (id: number) => { await supabase.from('user_history').delete().eq('id', id); setHistory(history.filter(h => h.id !== id)) }
  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/') }

  if (loading) return <div className="min-h-screen bg-[#0f1014] flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>

  return (
    <div className="min-h-screen bg-[#0f1014] text-white font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition"><ArrowLeft /></button>
            <div><h1 className="text-2xl font-bold flex items-center gap-2"><User className="text-yellow-500"/> Profilim</h1><p className="text-gray-400 text-sm">{user?.email}</p></div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-lg transition"><LogOut size={18} /> Çıkış</button>
        </div>

        {/* TABS */}
        <div className="flex gap-4 mb-8 border-b border-gray-800 overflow-x-auto">
          <button onClick={() => setActiveTab('settings')} className={`pb-4 px-4 font-bold whitespace-nowrap ${activeTab === 'settings' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-400'}`}>Platformlar</button>
          <button onClick={() => setActiveTab('channels')} className={`pb-4 px-4 font-bold whitespace-nowrap ${activeTab === 'channels' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400'}`}>YouTube Kanallarım</button>
          <button onClick={() => setActiveTab('history')} className={`pb-4 px-4 font-bold whitespace-nowrap ${activeTab === 'history' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}>İzleme Geçmişi</button>
        </div>

        {/* --- TAB 1: PLATFORMLAR --- */}
        {activeTab === 'settings' && (
          <div className="animate-in fade-in">
            <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 mb-6">
              <h2 className="text-xl font-bold mb-4">Üyeliklerin</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {PROVIDERS.filter(p => p.id !== 0).map(p => (
                   <button key={p.id} onClick={() => togglePlatform(p.id)} className={`p-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${myPlatforms.includes(p.id) ? `${p.color} bg-opacity-20 border-current` : 'bg-gray-800 border-gray-700 text-gray-500 grayscale'}`}>{p.name}</button>
                ))}
              </div>
              <button onClick={saveAll} disabled={saving} className="bg-yellow-600 hover:bg-yellow-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">{saving ? <Loader2 className="animate-spin" /> : <><Save size={18}/> Kaydet</>}</button>
            </div>
          </div>
        )}

        {/* --- TAB 2: YOUTUBE KANALLARI --- */}
        {activeTab === 'channels' && (
          <div className="animate-in fade-in">
            <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Youtube className="text-red-600"/> Favori Kanalların</h2>
              <p className="text-gray-400 text-sm mb-6">Buraya eklediğin kanallardan rastgele video önereceğiz.</p>
              
              <div className="flex gap-2 mb-6">
                <input value={newChannel} onChange={e => setNewChannel(e.target.value)} placeholder="Kanal ID (Örn: UCkX...)" className="bg-gray-800 border border-gray-700 p-3 rounded-lg flex-1 outline-none focus:border-red-500 text-white"/>
                <button onClick={addChannel} className="bg-red-600 hover:bg-red-500 px-4 rounded-lg font-bold"><Plus/></button>
              </div>

              <div className="space-y-2 mb-6">
                {myChannels.map(id => (
                  <div key={id} className="flex justify-between items-center bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <span className="font-mono text-sm text-gray-300">{id}</span>
                    <button onClick={() => removeChannel(id)} className="text-red-500 hover:text-red-400"><Trash2 size={16}/></button>
                  </div>
                ))}
                {myChannels.length === 0 && <p className="text-gray-500 text-sm italic">Henüz kanal eklemedin.</p>}
              </div>
              
              <button onClick={saveAll} disabled={saving} className="bg-yellow-600 hover:bg-yellow-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">{saving ? <Loader2 className="animate-spin" /> : <><Save size={18}/> Kaydet</>}</button>
              
              <div className="mt-6 bg-blue-900/20 p-4 rounded-lg border border-blue-900/50 text-xs text-blue-200">
                <strong>İpucu:</strong> YouTube kanal sayfasına gidip linke bak. `channel/UC...` kısmındaki `UC` ile başlayan kodu buraya yapıştır.
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 3: GEÇMİŞ --- */}
        {activeTab === 'history' && (
          <div className="animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map(item => (
                <div key={item.id} className="bg-gray-900 border border-gray-800 p-3 rounded-xl flex items-center gap-4 group">
                  <div className="w-16 h-24 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                    {item.poster_path ? <img src={`https://image.tmdb.org/t/p/w200${item.poster_path}`} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-600"><Tv size={20}/></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">{item.title || 'İsimsiz'}</h3>
                    <p className="text-xs text-gray-500">{item.media_type}</p>
                  </div>
                  <button onClick={() => deleteHistoryItem(item.id)} className="p-3 text-gray-600 hover:text-red-500"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}