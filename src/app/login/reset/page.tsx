'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Lock, Loader2 } from 'lucide-react'
import { useToast } from '@/components/Toast'

/** Şifre sıfırlama bağlantısından gelen kullanıcı yeni şifresini burada belirler. */
export default function ResetPasswordPage() {
  const [supabase] = useState(() => createClientComponentClient())
  const router = useRouter()
  const toast = useToast()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError(error.message); return }
    toast('Şifren güncellendi.', { type: 'success' })
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#0f1014] flex items-center justify-center p-4 text-white">
      <form onSubmit={submit} className="w-full max-w-md bg-gray-900 border border-gray-800 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-4">
        <h1 className="text-xl font-bold">Yeni şifre belirle</h1>
        <div>
          <label htmlFor="new-password" className="block text-sm font-semibold text-gray-300 mb-1.5">Yeni şifre</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={20} />
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby="new-password-rule"
              className="w-full bg-gray-950 border border-gray-800 rounded-xl py-3 pl-10 pr-3 text-white focus:border-red-500 outline-none"
            />
          </div>
          <p id="new-password-rule" className="text-xs text-gray-400 mt-1.5">En az 6 karakter.</p>
        </div>
        {error && <div role="alert" className="p-3 bg-red-900/20 border border-red-900/50 text-red-200 text-sm rounded-lg">{error}</div>}
        <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold py-3 rounded-xl flex items-center justify-center min-h-[48px] disabled:opacity-60">
          {loading ? <Loader2 className="animate-spin" /> : 'Şifreyi Kaydet'}
        </button>
      </form>
    </div>
  )
}
