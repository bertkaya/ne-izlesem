import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Nunito } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import { siteUrl } from '@/lib/site'

// Marka B (Akşam Sofrası): başlıkta Bricolage Grotesque, metinde Nunito; latin-ext Türkçe karakterler için
const bricolage = Bricolage_Grotesque({ subsets: ['latin', 'latin-ext'], weight: ['600', '700', '800'], variable: '--font-bricolage', display: 'swap' })
const nunito = Nunito({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600', '700', '800'], variable: '--font-nunito', display: 'swap' })


export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Ne İzlesem? | Yapay Zeka Destekli Film ve Dizi Önerisi',
  description: 'Karar vermekte zorlanıyor musun? AI sommelier, çiftler için eşleşme modu ve yemek süresine göre video önerileriyle Ne İzlesem yanında.',
  keywords: ['film önerisi', 'ne izlesem', 'dizi önerisi', 'film tinder', 'couple movie matcher'],
  manifest: '/manifest.json',
  openGraph: {
    title: 'Ne İzlesem? - Karar Yorgunluğuna Son',
    description: 'Yemek yerken veya akşam film ararken en iyi dostun.',
    url: '/',
    siteName: 'Ne İzlesem',
    // og-image.jpg public/ klasöründe yok; eklenince images: [{ url: '/og-image.jpg', width: 1200, height: 630 }]
    locale: 'tr_TR',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a0a12',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={`${bricolage.variable} ${nunito.variable} font-sans antialiased text-foreground bg-[#1a0a12]`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}