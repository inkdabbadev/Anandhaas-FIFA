'use client'

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store/app-store'
import type { User, Prediction } from '@/types'

/** Seeds the Zustand store with server-fetched data exactly once on mount. */
export function StoreHydrator({ user, predictions }: { user: User; predictions: Prediction[] }) {
  const setUser = useAppStore((s) => s.setUser)
  const hydratePredictions = useAppStore((s) => s.hydratePredictions)
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true
    setUser(user)
    hydratePredictions(predictions)
  }, [user, predictions, setUser, hydratePredictions])

  return null
}
