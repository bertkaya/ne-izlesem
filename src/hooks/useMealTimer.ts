'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'

// Sayaç bitiş zamanını saklar; sekme değişince, video açılınca ya da sayfa yenilenince kaybolmaz.
const KEY = 'meal_timer_end'
// Süresi biten sayaç bu kadar süre sonra kendiliğinden silinir (sonsuza dek "0:00" kalmasın)
const EXPIRE_AFTER_MS = 10 * 60_000
const listeners = new Set<() => void>()

function readEnd(): number | null {
  try {
    const v = Number(localStorage.getItem(KEY))
    if (!Number.isFinite(v) || v <= 0) return null
    if (Date.now() - v > EXPIRE_AFTER_MS) { localStorage.removeItem(KEY); return null }
    return v
  } catch {
    return null
  }
}

function writeEnd(end: number | null) {
  try {
    if (end) localStorage.setItem(KEY, String(end))
    else localStorage.removeItem(KEY)
  } catch { /* depolama kapalı olabilir; sayaç bu oturumda yine çalışır */ }
  memoryEnd = end
  listeners.forEach(l => l())
}

let memoryEnd: number | null = null
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l) }
const getSnapshot = () => readEnd() ?? (memoryEnd && Date.now() - memoryEnd <= EXPIRE_AFTER_MS ? memoryEnd : null)
const getServerSnapshot = () => null

export function useMealTimer() {
  const endAt = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!endAt) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [endAt])

  // null = sayaç yok, 0 = süre doldu
  const remaining = endAt ? Math.max(0, Math.ceil((endAt - now) / 1000)) : null

  return {
    remaining,
    start: (minutes: number) => { setNow(Date.now()); writeEnd(Date.now() + minutes * 60_000) },
    stop: () => writeEnd(null),
  }
}

export const formatTimer = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
