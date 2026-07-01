'use client'

import { create } from 'zustand'
import type { Match, Reward, MatchStatus, Team } from '@/types'
import { DEFAULT_CAMPAIGN } from '@/config/campaign'
import { MOCK_MATCHES, MOCK_REWARDS } from '@/lib/mock/data'

// ─── Domain ───────────────────────────────────────────────────────────────────

export type Pick = 'home' | 'draw' | 'away'

/** Points in the open campaign (no tokens — predictions are free).
 *  A correct prediction (win OR draw) earns CORRECT points; a wrong one earns 0.
 *  Points are only assigned once the match is settled with a final result. */
export const POINTS = {
  CORRECT: 50,
}

export interface StoredUser {
  id?: string
  phone: string
  email: string
  name: string
  age: number
  points: number
  predictionsCount: number
  correctCount: number
  createdAt: string
}

export interface PickRecord {
  matchId: string
  pick: Pick
  label: string
  status: 'pending' | 'won' | 'lost'
  pointsEarned: number
  createdAt: string
}

export interface Claim {
  id: string
  phone: string
  offerId: string
  offerTitle: string
  pointsCost: number
  status: 'pending' | 'redeemed'
  createdAt: string
  redeemedAt?: string
}

export interface ToastData {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

const SESSION_USER_KEY = 'fifa-app:session-user'

/** Admin input for creating/editing a match. */
export interface MatchInput {
  competition: string
  group_name: string
  home_team: Team
  away_team: Team
  kickoff_at: string
  prediction_closes_at: string
  venue?: string | null
  status?: MatchStatus
}

/** Admin input for creating/editing an offer. */
export interface OfferInput {
  title: string
  description: string
  icon: string
  points_cost: number
  inventory: number | null
  is_active: boolean
}

export function resultOf(match: Match): Pick | null {
  if (match.status !== 'finished' || match.home_score == null || match.away_score == null) return null
  if (match.home_score > match.away_score) return 'home'
  if (match.away_score > match.home_score) return 'away'
  return 'draw'
}

export function pickLabel(match: Match, pick: Pick): string {
  if (pick === 'home') return match.home_team.name
  if (pick === 'away') return match.away_team.name
  return 'Draw'
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface AppState {
  // persisted data
  users: Record<string, StoredUser>
  allPredictions: Record<string, Record<string, PickRecord>>
  claims: Claim[]
  currentPhone: string | null
  matches: Match[]
  offers: Reward[]
  seeded: boolean

  // current-user mirror
  predictions: Record<string, PickRecord>

  // ephemeral UI
  activeSheetMatchId: string | null
  draftPick: Pick | null
  toasts: ToastData[]
  sessionChecked: boolean

  // ── seeding ──
  ensureSeeded: () => void
  resetForFreshStart: () => void

  // ── auth ──
  isRegistered: (phone: string) => boolean
  getUser: (phone: string) => StoredUser | null
  currentUser: () => StoredUser | null
  validateLoginIdentity: (input: { phone: string; email: string }) => string | null
  register: (input: { phone: string; email: string; name: string; age: number }) => void
  login: (input: { phone: string; email: string }) => void
  setAuthenticatedUser: (user: StoredUser) => void
  updateCurrentUserStats: (stats: { points: number; predictionsCount: number; correctCount: number }) => void
  restoreSessionUser: () => boolean
  logout: () => void

  // ── predictions ──
  predict: (match: Match, pick: Pick) => void
  hydrateMatchFeed: (matches: Match[], predictions: Record<string, PickRecord>) => void
  recordSavedPrediction: (
    match: Match,
    pick: Pick,
    pointsAwarded: number,
    stats?: { points: number; predictionsCount: number; correctCount: number }
  ) => void

  // ── admin: matches ──
  createMatch: (input: MatchInput) => void
  updateMatch: (id: string, input: MatchInput) => void
  setMatchStatus: (id: string, status: MatchStatus) => void
  deleteMatch: (id: string) => void
  settleMatch: (match: Match, homeScore: number, awayScore: number) => void

  // ── admin: offers ──
  createOffer: (input: OfferInput) => void
  updateOffer: (id: string, input: OfferInput) => void
  deleteOffer: (id: string) => void

  // ── offers (customer) ──
  claimOffer: (offer: Reward) => boolean
  pendingClaims: () => Claim[]

  // ── admin redemption ──
  claimsForPhone: (phone: string) => Claim[]
  redeemClaim: (claimId: string) => void

  // ── sheet ──
  openSheet: (matchId: string) => void
  closeSheet: () => void
  setDraftPick: (pick: Pick) => void

  // ── toasts ──
  pushToast: (message: string, type?: ToastData['type']) => void
  dismissToast: (id: string) => void
}

export const useAppStore = create<AppState>()(
    (set, get) => ({
      users: {},
      allPredictions: {},
      claims: [],
      currentPhone: null,
      matches: [...MOCK_MATCHES],
      offers: [...MOCK_REWARDS],
      seeded: true,
      predictions: {},

      activeSheetMatchId: null,
      draftPick: null,
      toasts: [],
      sessionChecked: false,

      ensureSeeded: () => {
        if (get().seeded && get().matches.length > 0) return
        set({ matches: [...MOCK_MATCHES], offers: [...MOCK_REWARDS], seeded: true })
      },

      resetForFreshStart: () => {
        set({
          users: {},
          allPredictions: {},
          claims: [],
          currentPhone: null,
          matches: [...MOCK_MATCHES],
          offers: [...MOCK_REWARDS],
          seeded: true,
          predictions: {},
          activeSheetMatchId: null,
          draftPick: null,
          toasts: [],
          sessionChecked: false,
        })
      },

      isRegistered: (phone) => Boolean(get().users[normalize(phone)]),
      getUser: (phone) => get().users[normalize(phone)] ?? null,
      currentUser: () => {
        const p = get().currentPhone
        return p ? (get().users[p] ?? null) : null
      },

      validateLoginIdentity: ({ phone, email }) => {
        const key = normalize(phone)
        const cleanEmail = normalizeEmail(email)
        const phoneOwner = get().users[key]

        if (phoneOwner && phoneOwner.email !== cleanEmail) {
          return 'This mobile number is already linked to another email.'
        }

        const emailOwner = Object.values(get().users).find(
          (user) => user.email === cleanEmail && user.phone !== key
        )
        if (emailOwner) {
          return 'This email is already linked to another mobile number.'
        }

        return null
      },

      register: ({ phone, email, name, age }) => {
        if (get().validateLoginIdentity({ phone, email })) return
        const key = normalize(phone)
        if (get().users[key]) return
        const user: StoredUser = {
          phone: key,
          email: normalizeEmail(email),
          name: name.trim(),
          age,
          points: 0,
          predictionsCount: 0,
          correctCount: 0,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({
          users: { ...s.users, [key]: user },
          currentPhone: key,
          predictions: s.allPredictions[key] ?? {},
        }))
      },

      login: ({ phone, email }) => {
        if (get().validateLoginIdentity({ phone, email })) return
        const key = normalize(phone)
        if (!get().users[key]) return
        set((s) => ({ currentPhone: key, predictions: s.allPredictions[key] ?? {} }))
      },

      setAuthenticatedUser: (user) => {
        const key = normalize(user.phone)
        const cleanUser = { ...user, phone: key, email: normalizeEmail(user.email) }
        saveSessionUser(cleanUser)
        set((s) => ({
          users: { ...s.users, [key]: cleanUser },
          currentPhone: key,
          predictions: s.allPredictions[key] ?? {},
          sessionChecked: true,
        }))
      },

      updateCurrentUserStats: (stats) => {
        const key = get().currentPhone
        if (!key) return

        set((s) => {
          const user = s.users[key]
          if (!user) return s

          const updatedUser = { ...user, ...stats }
          saveSessionUser(updatedUser)
          return { users: { ...s.users, [key]: updatedUser } }
        })
      },

      restoreSessionUser: () => {
        const user = readSessionUser()
        if (!user) {
          set({ sessionChecked: true })
          return false
        }

        const key = normalize(user.phone)
        const cleanUser = { ...user, phone: key, email: normalizeEmail(user.email) }
        set((s) => ({
          users: { ...s.users, [key]: cleanUser },
          currentPhone: key,
          predictions: s.allPredictions[key] ?? {},
          sessionChecked: true,
        }))
        return true
      },

      logout: () => {
        clearSessionUser()
        set({ currentPhone: null, predictions: {}, sessionChecked: true })
      },

      predict: (match, pick) => {
        const key = get().currentPhone
        if (!key) return
        if (get().allPredictions[key]?.[match.id]) return // one locked pick per match

        const settled = resultOf(match)
        const correct = settled != null && settled === pick
        const earned = correct ? POINTS.CORRECT : 0

        const record: PickRecord = {
          matchId: match.id,
          pick,
          label: pickLabel(match, pick),
          status: settled == null ? 'pending' : correct ? 'won' : 'lost',
          pointsEarned: earned,
          createdAt: new Date().toISOString(),
        }

        set((s) => {
          const user = s.users[key]
          const updatedUser: StoredUser = user
            ? {
                ...user,
                points: user.points + earned,
                predictionsCount: user.predictionsCount + 1,
                correctCount: user.correctCount + (correct ? 1 : 0),
              }
            : user
          const userPreds = { ...(s.allPredictions[key] ?? {}), [match.id]: record }
          if (updatedUser) saveSessionUser(updatedUser)
          return {
            users: user ? { ...s.users, [key]: updatedUser } : s.users,
            allPredictions: { ...s.allPredictions, [key]: userPreds },
            predictions: userPreds,
          }
        })
      },

      // ── admin: matches ──
      hydrateMatchFeed: (matches, predictions) => {
        set((s) => {
          const key = s.currentPhone
          return {
            matches,
            predictions,
            allPredictions: key ? { ...s.allPredictions, [key]: predictions } : s.allPredictions,
          }
        })
      },

      recordSavedPrediction: (match, pick, pointsAwarded, stats) => {
        const key = get().currentPhone
        if (!key) return

        const record: PickRecord = {
          matchId: match.id,
          pick,
          label: pickLabel(match, pick),
          status: 'pending',
          pointsEarned: pointsAwarded,
          createdAt: new Date().toISOString(),
        }

        set((s) => {
          const user = s.users[key]
          const updatedUser: StoredUser = user
            ? {
                ...user,
                points: stats?.points ?? user.points + pointsAwarded,
                predictionsCount: stats?.predictionsCount ?? user.predictionsCount + 1,
                correctCount: stats?.correctCount ?? user.correctCount,
              }
            : user
          const userPreds = { ...(s.allPredictions[key] ?? {}), [match.id]: record }
          if (updatedUser) saveSessionUser(updatedUser)
          return {
            users: updatedUser ? { ...s.users, [key]: updatedUser } : s.users,
            allPredictions: { ...s.allPredictions, [key]: userPreds },
            predictions: userPreds,
          }
        })
      },

      createMatch: (input) => {
        const match: Match = {
          id: `mat_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          campaign_id: DEFAULT_CAMPAIGN.id,
          home_team: input.home_team,
          away_team: input.away_team,
          competition: input.competition,
          group_name: input.group_name || null,
          kickoff_at: input.kickoff_at,
          prediction_closes_at: input.prediction_closes_at,
          token_cost: 0,
          status: input.status ?? 'upcoming',
          home_score: null,
          away_score: null,
          first_scorer_team: null,
          venue: input.venue ?? null,
          created_at: new Date().toISOString(),
        }
        set((s) => ({ matches: [match, ...s.matches] }))
      },

      updateMatch: (id, input) => {
        set((s) => ({
          matches: s.matches.map((m) =>
            m.id === id
              ? {
                  ...m,
                  home_team: input.home_team,
                  away_team: input.away_team,
                  competition: input.competition,
                  group_name: input.group_name || null,
                  kickoff_at: input.kickoff_at,
                  prediction_closes_at: input.prediction_closes_at,
                  venue: input.venue ?? null,
                  status: input.status ?? m.status,
                }
              : m
          ),
        }))
      },

      setMatchStatus: (id, status) => {
        set((s) => ({ matches: s.matches.map((m) => (m.id === id ? { ...m, status } : m)) }))
      },

      deleteMatch: (id) => {
        set((s) => ({ matches: s.matches.filter((m) => m.id !== id) }))
      },

      settleMatch: (match, homeScore, awayScore) => {
        const result: Pick =
          homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : 'draw'

        set((s) => {
          const users = { ...s.users }
          const allPredictions = { ...s.allPredictions }

          for (const [phone, preds] of Object.entries(s.allPredictions)) {
            const rec = preds[match.id]
            if (!rec || rec.status !== 'pending') continue

            const correct = rec.pick === result
            const earned = correct ? POINTS.CORRECT : 0
            allPredictions[phone] = {
              ...preds,
              [match.id]: { ...rec, status: correct ? 'won' : 'lost', pointsEarned: earned },
            }
            const u = users[phone]
            if (u) {
              users[phone] = {
                ...u,
                points: u.points + earned,
                correctCount: u.correctCount + (correct ? 1 : 0),
              }
            }
          }

          const key = s.currentPhone
          if (key && users[key]) saveSessionUser(users[key])
          return {
            users,
            allPredictions,
            predictions: key ? allPredictions[key] ?? {} : s.predictions,
            matches: s.matches.map((m) =>
              m.id === match.id
                ? { ...m, home_score: homeScore, away_score: awayScore, status: 'finished' as MatchStatus }
                : m
            ),
          }
        })
      },

      // ── admin: offers ──
      createOffer: (input) => {
        const offer: Reward = {
          id: `rwd_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          campaign_id: DEFAULT_CAMPAIGN.id,
          title: input.title,
          description: input.description,
          icon: input.icon,
          points_cost: input.points_cost,
          inventory: input.inventory,
          is_active: input.is_active,
          expires_at: null,
          created_at: new Date().toISOString(),
        }
        set((s) => ({ offers: [offer, ...s.offers] }))
      },

      updateOffer: (id, input) => {
        set((s) => ({
          offers: s.offers.map((o) =>
            o.id === id
              ? {
                  ...o,
                  title: input.title,
                  description: input.description,
                  icon: input.icon,
                  points_cost: input.points_cost,
                  inventory: input.inventory,
                  is_active: input.is_active,
                }
              : o
          ),
        }))
      },

      deleteOffer: (id) => {
        set((s) => ({ offers: s.offers.filter((o) => o.id !== id) }))
      },

      claimOffer: (offer) => {
        const key = get().currentPhone
        const user = key ? get().users[key] : null
        if (!key || !user) return false
        if (user.points < offer.points_cost) return false
        if (get().claims.some((c) => c.phone === key && c.offerId === offer.id && c.status === 'pending')) {
          return false
        }
        const claim: Claim = {
          id: `clm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          phone: key,
          offerId: offer.id,
          offerTitle: offer.title,
          pointsCost: offer.points_cost,
          status: 'pending',
          createdAt: new Date().toISOString(),
        }
        set((s) => {
          const updatedUser = { ...user, points: Math.max(0, user.points - offer.points_cost) }
          saveSessionUser(updatedUser)
          return {
            users: { ...s.users, [key]: updatedUser },
            claims: [claim, ...s.claims],
          }
        })
        return true
      },

      pendingClaims: () => {
        const key = get().currentPhone
        if (!key) return []
        return get().claims.filter((c) => c.phone === key)
      },

      claimsForPhone: (phone) => {
        const key = normalize(phone)
        return get().claims.filter((c) => c.phone === key)
      },

      redeemClaim: (claimId) => {
        set((s) => {
          const claim = s.claims.find((c) => c.id === claimId)
          if (!claim || claim.status === 'redeemed') return s
          const user = s.users[claim.phone]
          const updatedUser = user
          if (updatedUser && s.currentPhone === claim.phone) saveSessionUser(updatedUser)
          return {
            users: user ? { ...s.users, [claim.phone]: updatedUser } : s.users,
            claims: s.claims.map((c) =>
              c.id === claimId ? { ...c, status: 'redeemed', redeemedAt: new Date().toISOString() } : c
            ),
            predictions:
              s.currentPhone === claim.phone && updatedUser ? s.predictions : s.predictions,
          }
        })
      },

      openSheet: (matchId) => set({ activeSheetMatchId: matchId, draftPick: null }),
      closeSheet: () => set({ activeSheetMatchId: null, draftPick: null }),
      setDraftPick: (pick) => set({ draftPick: pick }),

      pushToast: (message, type = 'success') => {
        const id = Math.random().toString(36).slice(2)
        set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
        setTimeout(() => get().dismissToast(id), 3000)
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    })
)

/** Normalise a phone to a stable key (digits only, last 10). */
function normalize(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits.slice(-10)
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function saveSessionUser(user: StoredUser) {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user))
    window.sessionStorage.removeItem(SESSION_USER_KEY)
  } catch {}
}

function readSessionUser(): StoredUser | null {
  if (typeof window === 'undefined') return null

  try {
    const raw =
      window.localStorage.getItem(SESSION_USER_KEY) ??
      window.sessionStorage.getItem(SESSION_USER_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<StoredUser>
    if (!parsed.phone || !parsed.email || !parsed.name) return null

    const user = {
      id: typeof parsed.id === 'string' ? parsed.id : undefined,
      phone: parsed.phone,
      email: parsed.email,
      name: parsed.name,
      age: Number(parsed.age ?? 0),
      points: Number(parsed.points ?? 0),
      predictionsCount: Number(parsed.predictionsCount ?? 0),
      correctCount: Number(parsed.correctCount ?? 0),
      createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : new Date().toISOString(),
    }
    saveSessionUser(user)
    return user
  } catch {
    clearSessionUser()
    return null
  }
}

function clearSessionUser() {
  if (typeof window === 'undefined') return

  try {
    window.localStorage.removeItem(SESSION_USER_KEY)
    window.sessionStorage.removeItem(SESSION_USER_KEY)
  } catch {}
}
