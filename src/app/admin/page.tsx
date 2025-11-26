'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/auth-helpers-nextjs'
import { fetchAndSaveChannelVideos } from '../actions'
import { 
  ShieldCheck, Youtube, Loader2, CheckCircle, Trash2, 
  ExternalLink, Ban, Plus, Eye, Filter, Save, XCircle 
} from 'lucide-react'

const supabase = createClient()

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'videos' | 'blacklist'>('videos')
  
  // --- VIDEO STATE ---
  const [videos, setVideos] = useState<any[]>([])
  const [channelId, setChannelId] = useState('')
  const [loading, setLoading] = useState(false)
  const [videoFilter, setVideoFilter] = useState<'all' | 'pending'>('all') // Filtreleme eklendi
  
  // --- BLACKLIST STATE ---
  const [blacklist, setBlacklist] = useState<any[]>([])
  const [banId, setBanId] = useState('')
  const [banReason, setBanReason] = useState('')

  useEffect(() => {
    fetchVideos()
    fetchBlacklist()
  }, [videoFilter]) // Filtre değişince yeniden çek

  // --- VİDEOLARI ÇEK (Filtreli) ---
  const fetchVideos = async () => {
    let query = supabase.from('videos').select('*').order('created_at', { ascending: false }).limit(100)
    
    if (videoFilter === 'pending') {
      query = query.eq('is_approved', false)
    }

    const { data } = await query
    if(data) setVideos(data)
  }

  const fetchBlacklist = async () => {
    const { data } = await supabase.from('blacklist').select('*').order('created_at', { ascending: false })
    if(data) setBlacklist(data)
  }

  // --- VİDEO İŞLEMLERİ ---

  // 1. ONAYLA
  const handleApprove = async (id: number) => {
    const { error } = await supabase.from('videos').update({ is_approved: true }).eq('id', id)
    if (!error) fetchVideos()
  }

  // 2. SİL
  const deleteVideo = async (id: number) => {
    if(confirm('Bu içerik kalıcı olarak silinsin mi?')) { 
      await supabase.from('videos').delete().eq('id', id); 
      fetchVideos() 
    }
  }

  // 3. GÜNCELLE (Kategori/Mood Değiştirme)
  const handleUpdate = async (id: number, field: string, value: string) => {
    // Önce UI'da hızlıca güncelle (Hissiyat için)
    setVideos(videos.map(v => v.id === id ? { ...v, [field]: value } : v))
    // Arkada veritabanına yaz
    await supabase.from('videos').update({ [field]: value }).eq('id', id)
  }

  // 4. KANAL IMPORT
  const importChannel = async () => {
    if(!channelId) return
    setLoading(true)
    await fetchAndSaveChannelVideos(channelId)
    setLoading(false)
    fetchVideos()
    setChannelId('')
  }

  // --- BLACKLIST İŞLEMLERİ ---
  const handleBan = async () => {
    if(!banId) return;
    const { error } = await supabase.from('blacklist').insert({ tmdb_id: parseInt(banId), media_type: 'unknown', reason: banReason })
    if(!error) { fetchBlacklist(); setBanId(''); setBanReason('') } else { alert("Hata oluştu.") }
  }
  
  const handleUnban = async (id: number) => {
    await supabase.from('blacklist').delete().eq('id', id)
    fetchBlacklist()
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 font-sans flex flex-col items-center">
      <div className="max-w-6xl w-full">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3 text-yellow-500">
          <ShieldCheck size={32} /> Mutfak Kontrol Paneli
        </h1>
        
        {/* --- TAB MENÜSÜ --- */}
        <div className="flex gap-4 mb-8 border-b border-gray-700 pb-1">
          <button 
            onClick={() => setActiveTab('videos')} 
            className={`px-6 py-3 rounded-t-lg font-bold transition-colors ${activeTab === 'videos' ? 'bg-gray-800 text-white border-t border-x border-gray-700' : 'text-gray-400 hover:text-white'}`}
          >
            YouTube & Onaylar
          </button>
          <button 
            onClick={() => setActiveTab('blacklist')} 
            className={`px-6 py-3 rounded-t-lg font-bold transition-colors ${activeTab === 'blacklist' ? 'bg-red-900/30 text-red-400 border-t border-x border-red-900/50' : 'text-gray-400 hover:text-white'}`}
          >
            Yasaklı İçerik (Blacklist)
          </button>
        </div>

        {/* ================================================================================= */}
        {/* TAB 1: YOUTUBE VİDEOLARI VE ONAYLAR */}
        {/* ================================================================================= */}
        {activeTab === 'videos' && (
          <div className="animate-in fade-in duration-300">
            
            {/* Üst Araç Çubuğu: Kanal Ekleme ve Filtreler */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              
              {/* Kanal Import */}
              <div className="flex gap-2 bg-gray-800 p-2 rounded-xl flex-1 border border-gray-700">
                <div className="flex items-center pl-3 text-gray-500"><Youtube size={20}/></div>
                <input value={channelId} onChange={e => setChannelId(e.target.value)} placeholder="YouTube Kanal ID Yapıştır" className="bg-transparent border-none p-2 text-white flex-1 outline-none"/>
                <button onClick={importChannel} disabled={loading} className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 rounded-lg font-bold transition-colors flex items-center gap-2">
                  {loading ? <Loader2 className="animate-spin" size={18}/> : 'Çek'}
                </button>
              </div>

              {/* Filtre Butonları */}
              <div className="flex bg-gray-800 p-1 rounded-xl border border-gray-700">
                <button onClick={() => setVideoFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${videoFilter === 'all' ? 'bg-gray-600 text-white' : 'text-gray-400 hover:text-white'}`}>Tümü</button>
                <button onClick={() => setVideoFilter('pending')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${videoFilter === 'pending' ? 'bg-yellow-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                   <Eye size={16}/> Onay Bekleyen
                </button>
              </div>
            </div>

            {/* Video Listesi */}
            <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase">
                  <tr>
                    <th className="p-4">Durum</th>
                    <th className="p-4">Video Başlığı</th>
                    <th className="p-4">Kategori / Mood</th>
                    <th className="p-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 text-sm">
                  {videos.map(v => (
                    <tr key={v.id} className="hover:bg-gray-700/40 transition-colors group">
                      
                      {/* 1. Durum */}
                      <td className="p-4">
                        {v.is_approved ? (
                          <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded border border-green-500/20 text-xs flex w-fit items-center gap-1"><CheckCircle size={12}/> Yayında</span>
                        ) : (
                          <span className="bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded border border-yellow-500/20 text-xs flex w-fit items-center gap-1"><Loader2 size={12}/> Bekliyor</span>
                        )}
                      </td>

                      {/* 2. Başlık */}
                      <td className="p-4 max-w-md">
                        <div className="font-medium text-white truncate" title={v.title}>{v.title || 'Başlıksız Video'}</div>
                        <a href={v.url} target="_blank" className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1 mt-1 opacity-50 group-hover:opacity-100 transition-opacity">
                          <ExternalLink size={12}/> Videoyu İzle
                        </a>
                      </td>

                      {/* 3. Düzenleme (Dropdowns) */}
                      <td className="p-4">
                        <div className="flex gap-2">
                          <select 
                            value={v.duration_category} 
                            onChange={(e) => handleUpdate(v.id, 'duration_category', e.target.value)}
                            className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300 outline-none focus:border-yellow-500 cursor-pointer"
                          >
                            <option value="snack">Atıştırmalık</option>
                            <option value="meal">Yemek</option>
                            <option value="feast">Ziyafet</option>
                          </select>
                          <select 
                            value={v.mood} 
                            onChange={(e) => handleUpdate(v.id, 'mood', e.target.value)}
                            className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300 outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value="funny">Komik</option>
                            <option value="relax">Rahat</option>
                            <option value="learn">Bilgi</option>
                            <option value="drama">Dram</option>
                          </select>
                        </div>
                      </td>

                      {/* 4. Butonlar */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!v.is_approved && (
                            <button onClick={() => handleApprove(v.id)} className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg transition-colors" title="Onayla ve Yayınla">
                              <CheckCircle size={16}/>
                            </button>
                          )}
                          <button onClick={() => deleteVideo(v.id)} className="bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white p-2 rounded-lg transition-colors" title="Sil">
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {videos.length === 0 && (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-500">Kriterlere uygun video bulunamadı.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================================= */}
        {/* TAB 2: BLACKLIST (FİLM/DİZİ ENGELLEME) */}
        {/* ================================================================================= */}
        {activeTab === 'blacklist' && (
          <div className="animate-in fade-in duration-300">
            <div className="bg-gray-800 p-6 rounded-xl mb-8 border border-gray-700 shadow-lg">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-red-500"><Ban /> Film/Dizi Engelle</h2>
              <div className="flex gap-3">
                <input type="number" value={banId} onChange={e => setBanId(e.target.value)} placeholder="TMDb ID (Örn: 550)" className="bg-gray-900 border border-gray-600 p-3 rounded-lg text-white outline-none w-40 focus:border-red-500 transition-colors" />
                <input type="text" value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Sebep (Örn: Telif hakları, Düşük kalite)" className="bg-gray-900 border border-gray-600 p-3 rounded-lg text-white outline-none flex-1 focus:border-red-500 transition-colors" />
                <button onClick={handleBan} disabled={!banId} className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white px-6 rounded-lg font-bold flex items-center gap-2 transition-colors">
                  <Plus size={18}/> Listeye Ekle
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                <ShieldCheck size={12}/> Bu ID'ye sahip içerikler algoritma tarafından kullanıcılara <u>asla</u> önerilmeyecektir.
              </p>
            </div>

            <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-900/50 text-gray-400 uppercase"><tr><th className="p-4">TMDb ID</th><th className="p-4">Sebep</th><th className="p-4 text-right">İşlem</th></tr></thead>
                <tbody className="divide-y divide-gray-700">
                  {blacklist.map(item => (
                    <tr key={item.id} className="hover:bg-gray-700/30">
                      <td className="p-4 font-mono text-yellow-500 font-bold">{item.tmdb_id}</td>
                      <td className="p-4 text-gray-300">{item.reason || '-'}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleUnban(item.id)} className="text-gray-400 hover:text-green-400 text-xs font-bold border border-gray-600 hover:border-green-400 px-3 py-1 rounded transition-all">
                          Yasağı Kaldır
                        </button>
                      </td>
                    </tr>
                  ))}
                  {blacklist.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-gray-500">Yasaklı içerik listeniz boş.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}