import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ne İzlesem? | Yemek ve Film Eşlikçin',
  description: 'Karar vermekte zorlananlar için film, dizi ve video öneri platformu.',
  manifest: '/manifest.json', // PWA Manifest
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Ne İzlesem?',
  },
}

export const viewport: Viewport = {
  themeColor: '#0f1014',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Uygulama hissi için zoom'u kapatıyoruz
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