'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { Mail, Lock, Loader2, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react'

type View = 'sign-in' | 'sign-up' | 'forgot'

const MIN_PASSWORD = 6

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [view, setView] = useState<View>('sign-in')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const router = useRouter()
  const toast = useToast()
  const [supabase] = useState(() => createClientComponentClient())

  const switchView = (v: View) => { setView(v); setError(null); setInfo(null) }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInfo(null)

    try {
      if (view === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${location.origin}/auth/callback?next=/login/reset`,
        })
        if (error) setError(error.message)
        else setInfo('Şifre sıfırlama bağlantısı e-postana gönderildi. Gelen kutunu (ve spam klasörünü) kontrol et.')
      } else if (view === 'sign-up') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${location.origin}/auth/callback` },
        })
        if (error) setError(error.message)
        else {
          switchView('sign-in')
          toast('Kayıt başarılı! E-posta adresini kontrol et ve doğruladıktan sonra giriş yap.', { type: 'success', durationMs: 8000 })
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setError(error.message === 'Invalid login credentials' ? 'E-posta ya da şifre hatalı.' : error.message)
        else {
          router.refresh()
          router.push('/')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const submitLabel = view === 'sign-in' ? 'Giriş Yap' : view === 'sign-up' ? 'Kayıt Ol' : 'Sıfırlama Bağlantısı Gönder'

  return (
    <div className="min-h-screen bg-[#0f1014] flex flex-col items-center justify-center p-4 text-white">
      <div className="w-full max-w-md mb-4">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white min-h-[44px]">
          <ArrowLeft size={16} /> Ana sayfaya dön
        </Link>
      </div>

      <div className="w-full max-w-md bg-gray-900 border border-gray-800 p-6 sm:p-8 rounded-3xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent mb-2">
            NE İZLESEM?
          </h1>
          <p className="text-gray-400">Karar yorgunluğuna son ver.</p>
        </div>

        {view !== 'forgot' ? (
          <div className="flex bg-gray-800 p-1 rounded-xl mb-6" role="tablist">
            <button type="button" role="tab" aria-selected={view === 'sign-in'} onClick={() => switchView('sign-in')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${view === 'sign-in' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}>Giriş Yap</button>
            <button type="button" role="tab" aria-selected={view === 'sign-up'} onClick={() => switchView('sign-up')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${view === 'sign-up' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}>Kayıt Ol</button>
          </div>
        ) : (
          <div className="mb-6">
            <h2 className="text-lg font-bold mb-1">Şifreni mi unuttun?</h2>
            <p className="text-sm text-gray-400">E-posta adresini yaz, sana yeni şifre belirleme bağlantısı gönderelim.</p>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-300 mb-1.5">E-posta</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
              <input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="ornek@eposta.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 pl-10 pr-3 text-white focus:border-red-500 outline-none transition-colors"
                required
              />
            </div>
          </div>

          {view !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-300">Şifre</label>
                {view === 'sign-in' && (
                  <button type="button" onClick={() => switchView('forgot')} className="text-xs text-gray-400 hover:text-white underline-offset-2 hover:underline">
                    Şifremi unuttum
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={view === 'sign-up' ? 'new-password' : 'current-password'}
                  minLength={view === 'sign-up' ? MIN_PASSWORD : undefined}
                  aria-describedby={view === 'sign-up' ? 'password-rule' : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 pl-10 pr-12 text-white focus:border-red-500 outline-none transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white rounded-lg"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {view === 'sign-up' && (
                <p id="password-rule" className="text-xs text-gray-400 mt-1.5">En az {MIN_PASSWORD} karakter.</p>
              )}
            </div>
          )}

          {error && <div role="alert" className="p-3 bg-red-900/20 border border-red-900/50 text-red-200 text-sm rounded-lg text-center">{error}</div>}
          {info && <div role="status" className="p-3 bg-green-900/20 border border-green-900/50 text-green-200 text-sm rounded-lg text-center">{info}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 min-h-[48px]"
          >
            {loading ? <Loader2 className="animate-spin" /> : submitLabel}
            {!loading && <ArrowRight size={18} />}
          </button>

          {view === 'forgot' && (
            <button type="button" onClick={() => switchView('sign-in')} className="w-full text-sm text-gray-400 hover:text-white min-h-[44px]">
              Girişe dön
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
