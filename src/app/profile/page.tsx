'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { User, Settings, History, Trash2, Save, Loader2, ArrowLeft, LogOut, Tv, Youtube, Plus, Link as LinkIcon, Search } from 'lucide-react'
import { PROVIDERS } from '@/lib/tmdb'
import { resolveYouTubeChannel } from '../actions' // Action import
import Image from 'next/image'

export default function ProfilePage() {
  const supabase = createClientComponentClient()
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'settings' | 'channels' | 'history'>('settings')
  const [loading, setLoading] = useState(true)

  // State
  const [myPlatforms, setMyPlatforms] = useState<number[]>([])
  const [myChannels, setMyChannels] = useState<string[]>([])
  const [newChannelInput, setNewChannelInput] = useState('')
  const [addingChannel, setAddingChannel] = useState(false)
  const [saving, setSaving] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const [badges, setBadges] = useState<any[]>([]) // Rozetler

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }
        setUser(user)

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (profile) {
          if (Array.isArray(profile.selected_platforms)) setMyPlatforms(profile.selected_platforms.map((p: string) => parseInt(p)))
          if (Array.isArray(profile.favorite_channels)) setMyChannels(profile.favorite_channels)
        }

        const { data: historyData } = await supabase.from('user_history').select('*').order('watched_at', { ascending: false }).limit(50)
        if (historyData) setHistory(historyData)

        // Rozetleri Çek
        const { data: userBadges } = await supabase.from('user_badges').select('badge_id, created_at, badges(name, icon, description)').eq('user_id', user.id)
        if (userBadges) setBadges(userBadges)

      } catch (error) { console.error(error) }
      finally { setLoading(false) }
    }
    fetchData()
  }, [])

  const saveAll = async () => {
    setSaving(true)
    const { error } = await supabase.from('profiles').update({ selected_platforms: myPlatforms.map(String), favorite_channels: myChannels }).eq('id', user.id)
    if (!error) alert("Kaydedildi! ✅")
    else alert("Hata oluştu.")
    setSaving(false)
  }

  // --- KANAL BUL VE EKLE ---
  const handleAddChannel = async () => {
    if (!newChannelInput) return;
    setAddingChannel(true);
    const result = await resolveYouTubeChannel(newChannelInput);
    if (result.success && result.id) {
      if (!myChannels.includes(result.id)) { setMyChannels([...myChannels, result.id]); setNewChannelInput(''); }
      else { alert("Bu kanal zaten var."); }
    } else { alert(result.message || "Kanal bulunamadı."); }
    setAddingChannel(false);
  }

  const removeChannel = (id: string) => setMyChannels(myChannels.filter(c => c !== id))
  const togglePlatform = (id: number) => myPlatforms.includes(id) ? setMyPlatforms(myPlatforms.filter(p => p !== id)) : setMyPlatforms([...myPlatforms, id])
  const deleteHistoryItem = async (id: number) => { await supabase.from('user_history').delete().eq('id', id); setHistory(history.filter(h => h.id !== id)) }
  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/') }

  if (loading) return <div className="min-h-screen bg-[#0f1014] flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>

  return (
    <div className="min-h-screen bg-[#0f1014] text-white font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/')} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition"><ArrowLeft /></button>
            <div><h1 className="text-2xl font-bold flex items-center gap-2"><User className="text-yellow-500" /> Profilim</h1><p className="text-gray-400 text-sm">{user?.email}</p></div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-lg transition"><LogOut size={18} /> Çıkış</button>
        </div>

        <div className="flex gap-4 mb-8 border-b border-gray-800 overflow-x-auto">
          <button onClick={() => setActiveTab('settings')} className={`pb-4 px-4 font-bold whitespace-nowrap ${activeTab === 'settings' ? 'text-yellow-500 border-b-2 border-yellow-500' : 'text-gray-400'}`}>Genel Ayarlar</button>
          <button onClick={() => setActiveTab('channels')} className={`pb-4 px-4 font-bold whitespace-nowrap ${activeTab === 'channels' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400'}`}>YouTube Kanallarım</button>
          <button onClick={() => setActiveTab('history')} className={`pb-4 px-4 font-bold whitespace-nowrap ${activeTab === 'history' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400'}`}>İzleme Geçmişi</button>
        </div>

        {/* TAB 1: AYARLAR VE ROZETLER */}
        {activeTab === 'settings' && (
          <div className="animate-in fade-in">
            {/* ROZETLER */}
            <div className="bg-gradient-to-r from-yellow-900/20 to-purple-900/20 p-6 rounded-2xl border border-yellow-500/20 mb-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">🏆 Rozet Koleksiyonun</h2>
              {badges.length > 0 ? (
                <div className="flex gap-4 flex-wrap">
                  {badges.map((b: any) => (
                    <div key={b.badge_id} className="bg-gray-900 p-3 rounded-xl border border-gray-700 flex flex-col items-center text-center w-24" title={b.badges.description}>
                      <div className="text-3xl mb-2">{b.badges.icon}</div>
                      <div className="text-xs font-bold text-gray-300">{b.badges.name}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Henüz rozetin yok. İzlemeye başla!</p>
              )}
            </div>

            <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800 mb-6">
              <h2 className="text-xl font-bold mb-4">Üyeliklerin</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                {PROVIDERS.filter(p => p.id !== 0).map(p => (
                  <button key={p.id} onClick={() => togglePlatform(p.id)} className={`p-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all ${myPlatforms.includes(p.id) ? `${p.color} bg-opacity-20 border-current` : 'bg-gray-800 border-gray-700 text-gray-500 grayscale'}`}>{p.name}</button>
                ))}
              </div>
              <button onClick={saveAll} disabled={saving} className="bg-yellow-600 hover:bg-yellow-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">{saving ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Kaydet</>}</button>
            </div>
          </div>
        )}

        {/* TAB 2: YOUTUBE KANALLARI */}
        {activeTab === 'channels' && (
          <div className="animate-in fade-in">
            <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Youtube className="text-red-600" /> Favori Kanalların</h2>
              <div className="flex gap-2 mb-6">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-3 text-gray-500" size={20} />
                  <input value={newChannelInput} onChange={e => setNewChannelInput(e.target.value)} placeholder="Örn: youtube.com/@BarisOzcan" className="bg-gray-800 border border-gray-700 p-3 pl-10 rounded-lg w-full outline-none focus:border-red-500 text-white" />
                </div>
                <button onClick={handleAddChannel} disabled={addingChannel || !newChannelInput} className="bg-red-600 hover:bg-red-500 disabled:bg-gray-700 text-white px-4 rounded-lg font-bold flex items-center gap-2">
                  {addingChannel ? <Loader2 className="animate-spin" /> : <><Search size={18} /> Bul & Ekle</>}
                </button>
              </div>
              <div className="space-y-2 mb-6">
                {myChannels.map(id => (
                  <div key={id} className="flex justify-between items-center bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <span className="font-mono text-sm text-gray-300">{id}</span>
                    <button onClick={() => removeChannel(id)} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
              <button onClick={saveAll} disabled={saving} className="bg-yellow-600 hover:bg-yellow-500 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2">{saving ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Kaydet</>}</button>
            </div>
          </div>
        )}

        {/* TAB 3: GEÇMİŞ */}
        {activeTab === 'history' && (
          <div className="animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map(item => (
                <div key={item.id} className="bg-gray-900 border border-gray-800 p-3 rounded-xl flex items-center gap-4 group">
                  <div className="w-16 h-24 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                    {item.poster_path ? <Image src={`https://image.tmdb.org/t/p/w200${item.poster_path}`} alt={item.title || 'Poster'} fill className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-600"><Tv size={20} /></div>}
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