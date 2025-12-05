import type { Metadata, Viewport } from 'next'
import { Inter, Bebas_Neue } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas' })

export const metadata: Metadata = {
  title: 'Ne İzlesem? | Yapay Zeka Destekli Film ve Dizi Önerisi',
  description: 'Karar vermekte zorlanıyor musun? AI sommelier, çiftler için eşleşme modu ve yemek süresine göre video önerileriyle Ne İzlesem yanında.',
  keywords: ['film önerisi', 'ne izlesem', 'dizi önerisi', 'film tinder', 'couple movie matcher'],
  manifest: '/manifest.json',
  openGraph: {
    title: 'Ne İzlesem? - Karar Yorgunluğuna Son',
    description: 'Yemek yerken veya akşam film ararken en iyi dostun.',
    url: 'https://ne-izlesem.vercel.app',
    siteName: 'Ne İzlesem',
    images: [
      {
        url: 'https://ne-izlesem.vercel.app/og-image.jpg',
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
    <html lang="tr" suppressHydrationWarning>
      <body className={`${inter.variable} ${bebas.variable} font-sans antialiased text-foreground bg-gray-50 dark:bg-[#0f1014] transition-colors duration-300`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}