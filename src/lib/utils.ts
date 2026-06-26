import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes safely. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a number with Indian thousands grouping. */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n)
}

/** Format INR currency. */
export function formatINR(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)
}

/** Initials from a name, e.g. "Rajesh Kumar" -> "RK". */
export function initials(name: string | null | undefined): string {
  if (!name) return '··'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

/** Human-friendly relative kickoff label. */
export function matchTimeLabel(kickoffISO: string, status: string, minute?: number | null): string {
  if (status === 'live') return minute ? `Live · ${minute}'` : 'Live now'
  if (status === 'finished') return 'Full time'
  if (status === 'cancelled') return 'Cancelled'

  const kickoff = new Date(kickoffISO)
  const now = new Date()
  const diffMs = kickoff.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  const time = kickoff.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })

  if (diffHours < 0) return 'Starting soon'
  if (isSameDay(kickoff, now)) return `Today · ${time}`

  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  if (isSameDay(kickoff, tomorrow)) return `Tomorrow · ${time}`

  const weekday = kickoff.toLocaleDateString('en-IN', { weekday: 'short' })
  return `${weekday} · ${time}`
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** Whether predictions are still open for a match. */
export function isPredictionOpen(match: { prediction_closes_at: string; status: string }): boolean {
  if (match.status !== 'upcoming') return false
  return new Date(match.prediction_closes_at).getTime() > Date.now()
}

/** Generate a short, unguessable code (for QR / referral). */
export function shortCode(prefix = '', len = 8): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return prefix ? `${prefix}-${s}` : s
}

/** Sleep helper for simulating async during Phase 1. */
export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}
