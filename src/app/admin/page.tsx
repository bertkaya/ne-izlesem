'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  fetchAndSaveChannelVideos, resolveYouTubeChannel,
  addSafeChannel, removeSafeChannel, fetchFromSafeChannels,
  bulkUpdateVideos, checkVideoHealth, fetchYouTubeTrends, fetchVideoMetadata, fetchYouTubeByMood
} from '../actions'
import {
  ShieldCheck, Youtube, Loader2, CheckCircle, Trash2, ExternalLink,
  Ban, Plus, Eye, Link as LinkIcon, Layers, RefreshCw, Stethoscope, CheckSquare, Square, Flame
} from 'lucide-react'

const supabase = createClientComponentClient()

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'videos' | 'safe_channels' | 'blacklist' | 'user_stats'>('videos')
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  // VIDEOS TAB
  const [videos, setVideos] = useState<any[]>([])
  const [videoFilter, setVideoFilter] = useState<'all' | 'pending'>('all')
  const [selectedIds, setSelectedIds] = useState<number[]>([]) // Toplu seçim

  // SAFE CHANNELS TAB
  const [safeChannels, setSafeChannels] = useState<any[]>([])
  const [newSafeInput, setNewSafeInput] = useState('')

  // BLACKLIST TAB
  const [blacklist, setBlacklist] = useState<any[]>([])
  const [banId, setBanId] = useState(''); const [banReason, setBanReason] = useState('')

  // USER STATS TAB
  const [userStats, setUserStats] = useState<any[]>([])

  useEffect(() => {
    if (activeTab === 'videos') fetchVideos();
    if (activeTab === 'safe_channels') fetchSafeChannels();
    if (activeTab === 'blacklist') fetchBlacklist();
    if (activeTab === 'user_stats') fetchUserStats();
  }, [activeTab, videoFilter])

  // --- DATA FETCHING ---
  const fetchVideos = async () => {
    let query = supabase.from('videos').select('*').order('created_at', { ascending: false }).limit(500)
    if (videoFilter === 'pending') query = query.eq('is_approved', false)
    const { data } = await query; if (data) setVideos(data)
  }
  const fetchSafeChannels = async () => { const { data } = await supabase.from('safe_channels').select('*'); if (data) setSafeChannels(data) }
  const fetchBlacklist = async () => { const { data } = await supabase.from('blacklist').select('*'); if (data) setBlacklist(data) }

  const fetchUserStats = async () => {
    const { data: history } = await supabase.from('user_history').select('*, profiles(email)').order('created_at', { ascending: false }).limit(50);
    if (history) setUserStats(history);
  }

  // --- VIDEO İŞLEMLERİ ---
  const toggleSelect = (id: number) => selectedIds.includes(id) ? setSelectedIds(selectedIds.filter(i => i !== id)) : setSelectedIds([...selectedIds, id])
  const toggleSelectAll = () => selectedIds.length === videos.length ? setSelectedIds([]) : setSelectedIds(videos.map(v => v.id))

  const handleBulkAction = async (action: 'delete' | 'approve') => {
    if (!confirm(`Seçili ${selectedIds.length} video için işlem yapılsın mı?`)) return;
    if (action === 'delete') { await supabase.from('videos').delete().in('id', selectedIds); }
    if (action === 'approve') { await supabase.from('videos').update({ is_approved: true }).in('id', selectedIds); }
    setSelectedIds([]); fetchVideos();
  }

  const handleBulkUpdate = async (field: string, value: string) => {
    if (!confirm(`Seçili videoların ${field} değeri değişecek.`)) return;
    await bulkUpdateVideos(selectedIds, { [field]: value });
    fetchVideos(); setSelectedIds([]);
  }

  const handleSingleUpdate = async (id: number, field: string, value: string) => {
    // Optimistic update
    setVideos(videos.map(v => v.id === id ? { ...v, [field]: value } : v))
    await supabase.from('videos').update({ [field]: value }).eq('id', id)
  }

  const handleHealthCheck = async () => {
    setLoading(true); setStatusMsg("Videolar kontrol ediliyor (Bu işlem sürebilir)...");
    const res = await checkVideoHealth();
    setStatusMsg(res.message); setLoading(false); fetchVideos();
  }

  // --- MANUAL VIDEO ADD ---
  const [manualVideoUrl, setManualVideoUrl] = useState('')
  const handleManualAdd = async () => {
    if (!manualVideoUrl) return;
    setLoading(true); setStatusMsg("Video bilgileri çekiliyor (YouTube)...");

    const meta = await fetchVideoMetadata(manualVideoUrl);

    if (!meta.success || !meta.data) {
      setStatusMsg("Hata: " + meta.message);
      setLoading(false);
      return;
    }

    setStatusMsg(`Eklendi: ${meta.data.title} (${meta.data.duration_category}) - ${meta.data.language === 'tr' ? 'Türkçe 🇹🇷' : 'Yabancı 🌍'}`);

    const { error } = await supabase.from('videos').insert({
      url: manualVideoUrl,
      title: meta.data.title,
      mood: meta.data.mood,
      duration_category: meta.data.duration_category,
      language: meta.data.language, // Dil eklendi
      is_approved: true
    });

    if (error) setStatusMsg("DB Hatası: " + error.message);
    else { setManualVideoUrl(''); fetchVideos(); }
    setLoading(false);
  }

  // --- SAFE CHANNEL İŞLEMLERİ ---
  const handleAddSafe = async () => {
    if (!newSafeInput) return;
    setLoading(true); setStatusMsg("Kanal aranıyor...");
    const res = await resolveYouTubeChannel(newSafeInput);
    if (res.success && res.id) {
      await addSafeChannel(res.id, newSafeInput);
      setNewSafeInput(''); fetchSafeChannels(); setStatusMsg("Kanal güvenli listeye eklendi.");
    } else {
      setStatusMsg("Kanal bulunamadı.");
    }
    setLoading(false);
  }

  const handleFetchSafe = async () => {
    setLoading(true); setStatusMsg("Güvenli kanallar taranıyor...");
    const res = await fetchFromSafeChannels();
    setStatusMsg(res.message); setLoading(false); fetchVideos();
  }

  const handleFetchTrends = async () => {
    setLoading(true); setStatusMsg("YouTube trendleri taranıyor...");
    const res = await fetchYouTubeTrends();
    setStatusMsg(res.message); setLoading(false); fetchVideos();
  }

  // --- KATEGORİ BAZLI VIDEO ÇEK ---
  const [selectedMoodForFetch, setSelectedMoodForFetch] = useState('funny');
  const handleFetchByMood = async () => {
    setLoading(true); setStatusMsg(`"${selectedMoodForFetch}" kategorisi taranıyor...`);
    const res = await fetchYouTubeByMood(selectedMoodForFetch);
    setStatusMsg(res.message); setLoading(false); fetchVideos();
  }

  // --- BLACKLIST ---
  const handleBan = async () => { await supabase.from('blacklist').insert({ tmdb_id: parseInt(banId), reason: banReason }); fetchBlacklist(); setBanId('') }
  const handleUnban = async (id: number) => { await supabase.from('blacklist').delete().eq('id', id); fetchBlacklist() }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 font-sans flex flex-col items-center pb-24">
      <div className="max-w-7xl w-full">
        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3 text-yellow-500"><ShieldCheck size={32} /> Mutfak Kontrol</h1>

        {/* TABS */}
        <div className="flex gap-2 mb-8 border-b border-gray-700 overflow-x-auto pb-1">
          <button onClick={() => setActiveTab('videos')} className={`px-6 py-3 font-bold whitespace-nowrap ${activeTab === 'videos' ? 'bg-gray-800 text-white border-t border-x border-gray-700 rounded-t-lg' : 'text-gray-500'}`}>Videolar</button>
          <button onClick={() => setActiveTab('user_stats')} className={`px-6 py-3 font-bold whitespace-nowrap ${activeTab === 'user_stats' ? 'bg-gray-800 text-white border-t border-x border-gray-700 rounded-t-lg' : 'text-gray-500'}`}>Kullanıcı Takip</button>
          <button onClick={() => setActiveTab('safe_channels')} className={`px-6 py-3 font-bold whitespace-nowrap ${activeTab === 'safe_channels' ? 'bg-gray-800 text-white border-t border-x border-gray-700 rounded-t-lg' : 'text-gray-500'}`}>Güvenli Kanallar</button>
          <button onClick={() => setActiveTab('blacklist')} className={`px-6 py-3 font-bold whitespace-nowrap ${activeTab === 'blacklist' ? 'bg-gray-800 text-white border-t border-x border-gray-700 rounded-t-lg' : 'text-gray-500'}`}>Blacklist</button>
        </div>

        {statusMsg && <div className="bg-blue-900/30 text-blue-300 p-3 rounded-lg mb-6 border border-blue-500/30 animate-pulse">{statusMsg}</div>}

        {/* ================= VIDEOS TAB ================= */}
        {activeTab === 'videos' && (
          <div className="animate-in fade-in">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <button onClick={() => setVideoFilter('all')} className={`px-3 py-1 rounded border ${videoFilter === 'all' ? 'bg-white text-black' : 'border-gray-600'}`}>Tümü</button>
                <button onClick={() => setVideoFilter('pending')} className={`px-3 py-1 rounded border ${videoFilter === 'pending' ? 'bg-yellow-500 text-black' : 'border-gray-600'}`}>Bekleyenler</button>
              </div>
              <button onClick={handleHealthCheck} disabled={loading} className="bg-red-900/50 text-red-300 border border-red-800 px-4 py-2 rounded hover:bg-red-900 transition flex items-center gap-2">
                <Stethoscope size={16} /> Video Sağlık Kontrolü
              </button>
            </div>

            {/* Manual ADD */}
            <div className="bg-gray-800 p-4 rounded-xl mb-4 border border-gray-700 flex gap-2 items-center">
              <Plus size={20} className="text-gray-500" />
              <input value={manualVideoUrl} onChange={e => setManualVideoUrl(e.target.value)} placeholder="YouTube Video Linki Yapıştır (Hızlı Ekle)" className="bg-gray-900 border border-gray-600 p-2 rounded-lg text-white flex-1 outline-none text-sm" />
              <button onClick={handleManualAdd} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm">Hızlı Ekle</button>
            </div>

            <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-xl overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[800px]">
                <thead className="bg-gray-900/50 text-gray-400 uppercase">
                  <tr>
                    <th className="p-4 w-10"><button onClick={toggleSelectAll}>{selectedIds.length === videos.length && videos.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}</button></th>
                    <th className="p-4">Durum</th>
                    <th className="p-4">Video</th>
                    <th className="p-4">Süre</th>
                    <th className="p-4">Mood</th>
                    <th className="p-4">Dil</th>
                    <th className="p-4 text-right">Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {videos.map(v => (
                    <tr key={v.id} className={`hover:bg-gray-700/40 transition-colors ${selectedIds.includes(v.id) ? 'bg-blue-900/20' : ''}`}>
                      <td className="p-4"><button onClick={() => toggleSelect(v.id)}>{selectedIds.includes(v.id) ? <CheckSquare size={18} className="text-blue-400" /> : <Square size={18} className="text-gray-600" />}</button></td>
                      <td className="p-4">{v.is_approved ? <CheckCircle size={16} className="text-green-500" /> : <Loader2 size={16} className="text-yellow-500" />}</td>
                      <td className="p-4 max-w-xs truncate font-medium">{v.title}</td>

                      {/* INLINE EDITING */}
                      <td className="p-4">
                        <select value={v.duration_category} onChange={(e) => handleSingleUpdate(v.id, 'duration_category', e.target.value)} className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs outline-none">
                          <option value="snack">Atıştırmalık</option><option value="meal">Yemek</option><option value="feast">Ziyafet</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <select value={v.mood} onChange={(e) => handleSingleUpdate(v.id, 'mood', e.target.value)} className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs outline-none">
                          <option value="funny">Komik</option><option value="eat">Birlikte Ye</option><option value="classic">Klasik</option><option value="pets">Evcil</option>
                          <option value="relax">Rahat</option><option value="learn">Bilgi</option><option value="drama">Dram</option>
                          <option value="travel">Gezi</option><option value="sport">Spor</option><option value="tech">Tekno</option>
                          <option value="news">Haber</option><option value="music">Müzik</option><option value="popculture">Magazin</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <select value={v.language || 'en'} onChange={(e) => handleSingleUpdate(v.id, 'language', e.target.value)} className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs outline-none">
                          <option value="tr">TR 🇹🇷</option><option value="en">Global 🌍</option>
                        </select>
                      </td>

                      <td className="p-4 text-right"><a href={v.url} target="_blank" className="text-blue-400 hover:text-blue-300"><ExternalLink size={16} /></a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= USER STATS TAB ================= */}
        {activeTab === 'user_stats' && (
          <div className="animate-in fade-in">
            <h2 className="text-xl font-bold mb-4 text-purple-400 border-b border-gray-700 pb-2">Son Kullanıcı Aktiviteleri</h2>
            <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-900/50 text-gray-400">
                  <tr>
                    <th className="p-4">Kullanıcı</th>
                    <th className="p-4">İşlem</th>
                    <th className="p-4">İçerik</th>
                    <th className="p-4 text-right">Zaman</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {userStats.map((stat: any) => (
                    <tr key={stat.id} className="hover:bg-gray-700/30">
                      <td className="p-4 text-white font-medium">{(stat.profiles && stat.profiles.email) ? stat.profiles.email.split('@')[0] : 'Anonim'}</td>
                      <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${stat.media_type === 'youtube' ? 'bg-red-900/50 text-red-300' : 'bg-blue-900/50 text-blue-300'}`}>{stat.media_type}</span></td>
                      <td className="p-4 text-gray-300">{stat.title}</td>
                      <td className="p-4 text-right text-gray-500 text-xs">{new Date(stat.created_at).toLocaleString('tr-TR')}</td>
                    </tr>
                  ))}
                  {userStats.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">Henüz aktivite yok.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= SAFE CHANNELS TAB ================= */}
        {activeTab === 'safe_channels' && (
          <div className="animate-in fade-in">
            <div className="bg-gray-800 p-6 rounded-xl mb-8 border border-gray-700">
              <h2 className="text-xl font-bold mb-4 text-green-400 flex items-center gap-2"><ShieldCheck /> Güvenli Kanal Ekle</h2>
              <div className="flex gap-2">
                <input value={newSafeInput} onChange={e => setNewSafeInput(e.target.value)} placeholder="Kanal Linki veya ID" className="bg-gray-900 border border-gray-600 p-3 rounded-lg text-white flex-1 outline-none" />
                <button onClick={handleAddSafe} disabled={loading} className="bg-green-600 hover:bg-green-500 text-white px-6 rounded-lg font-bold">{loading ? '...' : 'Ekle'}</button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Bu listedeki kanallardan düzenli olarak otomatik video çekilir.</p>
            </div>

            <div className="flex flex-wrap justify-end mb-4 gap-2">
              {/* Kategori Bazlı Fetch */}
              <div className="flex gap-2 items-center bg-gray-800 p-2 rounded-lg border border-gray-700">
                <select value={selectedMoodForFetch} onChange={(e) => setSelectedMoodForFetch(e.target.value)} className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm outline-none">
                  <option value="funny">😂 Komik</option><option value="eat">🍔 Birlikte Ye</option><option value="classic">📺 Klasik</option>
                  <option value="pets">🐶 Evcil</option><option value="relax">💆 Rahat</option><option value="learn">🧠 Bilgi</option>
                  <option value="drama">🎬 Dram</option><option value="travel">✈️ Gezi</option><option value="sport">⚽ Spor</option>
                  <option value="tech">💻 Tekno</option><option value="news">📰 Haber</option><option value="music">🎵 Müzik</option>
                  <option value="popculture">✨ Magazin</option>
                </select>
                <button onClick={handleFetchByMood} disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded font-bold text-sm">Kategori Çek</button>
              </div>
              <button onClick={handleFetchTrends} disabled={loading} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                <Flame size={18} className={loading ? 'animate-spin' : ''} /> Trendleri Çek
              </button>
              <button onClick={handleFetchSafe} disabled={loading} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Kanalları Tara
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {safeChannels.map(c => (
                <div key={c.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-white">{c.channel_name || 'İsimsiz Kanal'}</div>
                    <div className="text-xs text-gray-500 font-mono">{c.channel_id}</div>
                  </div>
                  <button onClick={async () => { await removeSafeChannel(c.id); fetchSafeChannels(); }} className="text-red-500 hover:bg-red-500/10 p-2 rounded"><Trash2 size={18} /></button>
                </div>
              ))}
              {safeChannels.length === 0 && <p className="text-gray-500">Listeniz boş.</p>}
            </div>
          </div>
        )}

        {/* ================= BLACKLIST TAB ================= */}
        {activeTab === 'blacklist' && (
          <div className="animate-in fade-in">
            <div className="bg-gray-800 p-6 rounded-xl mb-8 border border-gray-700"><div className="flex gap-3"><input type="number" value={banId} onChange={e => setBanId(e.target.value)} placeholder="TMDb ID" className="bg-gray-900 border border-gray-600 p-3 rounded-lg text-white outline-none w-32" /><input type="text" value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Sebep" className="bg-gray-900 border border-gray-600 p-3 rounded-lg text-white outline-none flex-1" /><button onClick={handleBan} className="bg-red-600 hover:bg-red-700 px-6 rounded-lg font-bold">Banla</button></div></div>
            <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700"><table className="w-full text-left text-sm"><thead className="bg-gray-900/50 text-gray-400"><tr><th className="p-4">ID</th><th className="p-4">Sebep</th><th className="p-4 text-right">İşlem</th></tr></thead><tbody className="divide-y divide-gray-700">{blacklist.map(item => (<tr key={item.id} className="hover:bg-gray-700/30"><td className="p-4 font-mono text-yellow-500">{item.tmdb_id}</td><td className="p-4 text-gray-300">{item.reason || '-'}</td><td className="p-4 text-right"><button onClick={() => handleUnban(item.id)} className="text-gray-400 hover:text-green-400 border border-gray-600 px-3 py-1 rounded">Kaldır</button></td></tr>))}</tbody></table></div>
          </div>
        )}
      </div>

      {/* STICKY BULK ACTION BAR (Sadece seçim yapıldıysa görünür) */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-blue-900 text-white p-4 rounded-xl shadow-2xl flex flex-wrap items-center gap-4 border border-blue-700 animate-in slide-in-from-bottom-10 z-50 w-[90%] max-w-3xl justify-between">
          <div className="flex items-center gap-2 font-bold border-r border-blue-700 pr-4"><Layers size={20} /> <span>{selectedIds.length} Seçildi</span></div>

          <div className="flex gap-2 flex-1 justify-center">
            <select onChange={(e) => handleBulkUpdate('duration_category', e.target.value)} className="bg-blue-800 border border-blue-600 rounded px-2 py-1 text-sm outline-none" defaultValue=""><option value="" disabled>Süre...</option><option value="snack">Atıştırmalık</option><option value="meal">Yemek</option><option value="feast">Ziyafet</option></select>
            <select onChange={(e) => handleBulkUpdate('mood', e.target.value)} className="bg-blue-800 border border-blue-600 rounded px-2 py-1 text-sm outline-none" defaultValue=""><option value="" disabled>Mood...</option>
              <option value="funny">Komik</option><option value="eat">Birlikte Ye</option><option value="classic">Klasik</option><option value="pets">Evcil</option>
              <option value="relax">Rahat</option><option value="learn">Bilgi</option><option value="drama">Dram</option>
              <option value="travel">Gezi</option><option value="sport">Spor</option><option value="tech">Tekno</option>
              <option value="news">Haber</option><option value="music">Müzik</option><option value="popculture">Magazin</option>
            </select>
            <select onChange={(e) => handleBulkUpdate('language', e.target.value)} className="bg-blue-800 border border-blue-600 rounded px-2 py-1 text-sm outline-none" defaultValue=""><option value="" disabled>Dil...</option><option value="tr">TR 🇹🇷</option><option value="en">Global 🌍</option></select>
          </div>

          <div className="flex gap-2">
            <button onClick={() => handleBulkAction('approve')} className="bg-green-600 hover:bg-green-500 p-2 rounded text-white" title="Hepsini Onayla"><CheckCircle size={20} /></button>
            <button onClick={() => handleBulkAction('delete')} className="bg-red-600 hover:bg-red-500 p-2 rounded text-white" title="Hepsini Sil"><Trash2 size={20} /></button>
            <button onClick={() => setSelectedIds([])} className="text-blue-300 underline text-sm ml-2">İptal</button>
          </div>
        </div>
      )}
    </div>
  )
}