// Sunucu tarafı oturum ve yetki kontrolleri. Yalnızca server action'lardan çağrılır.
import { cookies } from 'next/headers'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import type { User } from '@supabase/supabase-js'

/**
 * İsteği yapan kullanıcının oturumuyla (cookie) çalışan Supabase istemcisi.
 * Bu istemciyle yapılan sorgular Supabase RLS'de o kullanıcı olarak değerlendirilir.
 */
export async function getServerSupabase() {
  // Next 16'da cookies() Promise döndürüyor; auth-helpers ise senkron bir store bekliyor.
  const store = await cookies()
  return createServerActionClient({ cookies: (() => store) as unknown as () => ReturnType<typeof cookies> })
}

export async function getSessionUser(): Promise<User | null> {
  const supabase = await getServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/** ADMIN_EMAILS: virgülle ayrılmış e-posta listesi (.env.local / Vercel ortam değişkeni). */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const admins = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  return admins.includes(email.toLowerCase())
}

export class AuthError extends Error {
  constructor(public code: 'unauthenticated' | 'forbidden') {
    super(code)
  }
}

export async function requireUser(): Promise<User> {
  const user = await getSessionUser()
  if (!user) throw new AuthError('unauthenticated')
  return user
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser()
  if (!isAdminEmail(user.email)) throw new AuthError('forbidden')
  return user
}
