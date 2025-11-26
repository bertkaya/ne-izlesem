'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Loader2, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [view, setView] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (view === 'sign-up') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      })
      if (error) setError(error.message)
      else {
        // Kayıt başarılı, onboarding sayfasına yönlendir
        router.push('/onboarding')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) setError(error.message)
      else {
        // Giriş başarılı, ana sayfaya yönlendir
        router.refresh()
        router.push('/')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0f1014] flex items-center justify-center p-4 text-white">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 p-8 rounded-3xl shadow-2xl">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-2">
            NE İZLESEM?
          </h1>
          <p className="text-gray-400">Karar yorgunluğuna son ver.</p>
        </div>

        {/* Sekmeler */}
        <div className="flex bg-gray-800 p-1 rounded-xl mb-6">
          <button onClick={() => setView('sign-in')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${view === 'sign-in' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}>Giriş Yap</button>
          <button onClick={() => setView('sign-up')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${view === 'sign-up' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}>Kayıt Ol</button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-500" size={20} />
            <input 
              type="email" 
              placeholder="E-posta Adresin" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 pl-10 text-white focus:border-red-500 outline-none transition-colors"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-500" size={20} />
            <input 
              type="password" 
              placeholder="Şifren" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 pl-10 text-white focus:border-red-500 outline-none transition-colors"
              required
            />
          </div>

          {error && <div className="p-3 bg-red-900/20 border border-red-900/50 text-red-200 text-sm rounded-lg text-center">{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : (view === 'sign-in' ? 'Giriş Yap' : 'Kayıt Ol')} 
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

      </div>
    </div>
  )
}