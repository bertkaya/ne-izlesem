'use client'

import { ThemeProvider } from 'next-themes'
import { LanguageProvider } from '@/components/LanguageContext'
import { ToastProvider } from '@/components/Toast'

export function Providers({ children }: { children: React.ReactNode }) {
    // Tasarım koyu tema için yapıldı; yarım kalan açık tema okunmaz kartlar üretiyordu, bu yüzden sabit
    return (
        <ThemeProvider attribute="class" forcedTheme="dark" enableSystem={false}>
            <LanguageProvider>
                <ToastProvider>
                    {children}
                </ToastProvider>
            </LanguageProvider>
        </ThemeProvider>
    )
}
