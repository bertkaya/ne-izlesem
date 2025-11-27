import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ne İzlesem? | Yapay Zeka Destekli Film ve Dizi Önerisi',
  description: 'Karar vermekte zorlanıyor musun? AI sommelier, çiftler için eşleşme modu ve yemek süresine göre video önerileriyle Ne İzlesem yanında.',
  keywords: ['film önerisi', 'ne izlesem', 'dizi önerisi', 'film tinder', 'couple movie matcher'],
  manifest: '/manifest.json',
  openGraph: {
    title: 'Ne İzlesem? - Karar Yorgunluğuna Son',
    description: 'Yemek yerken veya akşam film ararken en iyi dostun.',
    url: 'https://ne-izlesem.vercel.app', // Kendi linkinle değiştir
    siteName: 'Ne İzlesem',
    images: [
      {
        url: 'https://ne-izlesem.vercel.app/og-image.jpg', // Public klasörüne bir resim koyabilirsin
        width: 1200,
        height: 630,
      },
    ],
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
    <html lang="tr">
      <body className={inter.className}>{children}</body>
    </html>
  )
}