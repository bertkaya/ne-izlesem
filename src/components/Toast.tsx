'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface ToastOptions {
  type?: ToastType
  /** Toast içinde bir eylem düğmesi (ör. "Giriş Yap", "Bildir") — confirm() yerine. */
  action?: { label: string; onClick: () => void }
  durationMs?: number
}

interface ToastItem extends Required<Pick<ToastOptions, 'type'>> {
  id: number
  message: string
  action?: ToastOptions['action']
}

interface ToastContextValue {
  toast: (message: string, options?: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const STYLES: Record<ToastType, string> = {
  success: 'border-green-500/40 bg-green-950/90 text-green-100',
  error: 'border-red-500/40 bg-red-950/90 text-red-100',
  info: 'border-gray-600 bg-gray-900/95 text-gray-100',
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} className="text-green-400 shrink-0" />,
  error: <AlertTriangle size={18} className="text-red-400 shrink-0" />,
  info: <Info size={18} className="text-cyan-400 shrink-0" />,
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => setToasts(prev => prev.filter(t => t.id !== id)), [])

  const toast = useCallback((message: string, options: ToastOptions = {}) => {
    const id = ++nextId.current
    setToasts(prev => [...prev.slice(-2), { id, message, type: options.type ?? 'info', action: options.action }])
    setTimeout(() => dismiss(id), options.durationMs ?? (options.action ? 7000 : 3500))
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 inset-x-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none" role="status" aria-live="polite">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto w-full max-w-md flex items-center gap-3 border rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-md text-sm animate-in slide-in-from-bottom-4 fade-in ${STYLES[t.type]}`}
          >
            {ICONS[t.type]}
            <span className="flex-1">{t.message}</span>
            {t.action && (
              <button
                onClick={() => { t.action!.onClick(); dismiss(t.id) }}
                className="font-bold text-xs uppercase tracking-wide bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition"
              >
                {t.action.label}
              </button>
            )}
            <button onClick={() => dismiss(t.id)} className="opacity-60 hover:opacity-100" aria-label="Kapat">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx.toast
}
