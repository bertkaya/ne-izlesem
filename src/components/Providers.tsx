'use client'

import { ThemeProvider } from 'next-themes'
import { LanguageProvider } from '@/components/LanguageContext'
import { ToastProvider } from '@/components/Toast'

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <LanguageProvider>
                <ToastProvider>
                    {children}
                </ToastProvider>
            </LanguageProvider>
        </ThemeProvider>
    )
}
