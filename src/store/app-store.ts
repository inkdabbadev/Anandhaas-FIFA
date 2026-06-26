'use client'

import { create } from 'zustand'
import type { User, Prediction, PredictionDraft, ToastData } from '@/types'

interface AppState {
  // session
  user: User | null
  setUser: (u: User | null) => void

  // optimistic local state (Phase 1)
  predictions: Record<string, Prediction>
  hydratePredictions: (list: Prediction[]) => void
  addPrediction: (p: Prediction) => void

  tokenBalance: number
  setTokenBalance: (n: number) => void
  spendTokens: (n: number) => void

  streak: number
  setStreak: (n: number) => void
  incrementStreak: () => void

  // prediction sheet
  activeSheetMatchId: string | null
  draft: PredictionDraft | null
  openSheet: (matchId: string) => void
  closeSheet: () => void
  updateDraft: (patch: Partial<PredictionDraft>) => void

  // toasts
  toasts: ToastData[]
  pushToast: (message: string, type?: ToastData['type']) => void
  dismissToast: (id: string) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  setUser: (user) =>
    set({
      user,
      tokenBalance: user?.token_balance ?? 0,
      streak: user?.streak_count ?? 0,
    }),

  predictions: {},
  hydratePredictions: (list) =>
    set({ predictions: Object.fromEntries(list.map((p) => [p.match_id, p])) }),
  addPrediction: (p) =>
    set((s) => ({ predictions: { ...s.predictions, [p.match_id]: p } })),

  tokenBalance: 0,
  setTokenBalance: (tokenBalance) => set({ tokenBalance }),
  spendTokens: (n) => set((s) => ({ tokenBalance: Math.max(0, s.tokenBalance - n) })),

  streak: 0,
  setStreak: (streak) => set({ streak }),
  incrementStreak: () => set((s) => ({ streak: Math.min(7, s.streak + 1) })),

  activeSheetMatchId: null,
  draft: null,
  openSheet: (matchId) =>
    set({
      activeSheetMatchId: matchId,
      draft: { matchId, winner: null, homeGoals: 0, awayGoals: 0, firstScorerTeam: null },
    }),
  closeSheet: () => set({ activeSheetMatchId: null, draft: null }),
  updateDraft: (patch) =>
    set((s) => (s.draft ? { draft: { ...s.draft, ...patch } } : s)),

  toasts: [],
  pushToast: (message, type = 'success') => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => get().dismissToast(id), 2800)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
