'use client'

import { useEffect } from 'react'

/** Legacy no-op while development needs every app start to be fresh. */
export function PWARegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch(() => {})
  }, [])
  return null
}
