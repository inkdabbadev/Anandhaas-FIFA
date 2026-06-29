'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAppStore } from '@/store/app-store'

/**
 * Development reset: keep every browser launch/reload as a fresh app.
 * Remove this when the real auth/data persistence path is ready.
 */
export function FreshAppReset() {
  const pathname = usePathname()

  useEffect(() => {
    clearBrowserStorage()
    clearBrowserCaches()
    unregisterServiceWorkers()
  }, [])

  useEffect(() => {
    if (pathname === '/welcome' || pathname === '/login') {
      useAppStore.getState().resetForFreshStart()
    }
  }, [pathname])

  return null
}

function clearBrowserStorage() {
  try {
    window.localStorage.clear()
    window.sessionStorage.clear()
  } catch {}
}

function clearBrowserCaches() {
  if (!('caches' in window)) return

  window.caches
    .keys()
    .then((keys) => Promise.all(keys.map((key) => window.caches.delete(key))))
    .catch(() => {})
}

function unregisterServiceWorkers() {
  if (!('serviceWorker' in navigator)) return

  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
    .catch(() => {})
}
