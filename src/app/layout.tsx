import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import { siteUrl } from '@/lib/site'

// Tek aile: başlık (800) ve metin (400–600) için Plus Jakarta Sans; latin-ext Türkçe karakterler için
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '600', '700', '800'], variable: '--font-jakarta', display: 'swap' })


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
  themeColor: '#0f1014',
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
      <body className={`${jakarta.variable} font-sans antialiased text-foreground bg-[#0f1014]`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}