// E-posta doğrulama ve şifre sıfırlama bağlantılarının döndüğü adres.
// Supabase ?code= ile döner; kod oturuma çevrilip kullanıcı yönlendirilir.
import { NextResponse, type NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next')
  // Yalnızca site içi yönlendirmeye izin ver (açık yönlendirme açığı olmasın)
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/'

  if (code) {
    // Next 16'da cookies() Promise döndürüyor; auth-helpers senkron store bekliyor (bkz. lib/auth-server.ts)
    const store = await cookies()
    const supabase = createRouteHandlerClient({ cookies: (() => store) as unknown as () => ReturnType<typeof cookies> })
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return NextResponse.redirect(new URL('/login?error=link', url.origin))
  }

  return NextResponse.redirect(new URL(safeNext, url.origin))
}
