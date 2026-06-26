'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app-store'
import type { Match } from '@/types'

/** Interactive result-entry card that simulates settlement (Phase 1). */
export function ResultEntryCard({ match }: { match: Match }) {
  const [home, setHome] = useState(match.home_score ?? 0)
  const [away, setAway] = useState(match.away_score ?? 0)
  const [firstScorer, setFirstScorer] = useState<string | null>(match.first_scorer_team)
  const [settled, setSettled] = useState(false)
  const pushToast = useAppStore((s) => s.pushToast)

  function settle() {
    setSettled(true)
    pushToast(`Settled ${match.home_team.name} ${home}–${away} ${match.away_team.name}`, 'success')
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs text-muted">
        {match.competition} · {match.group_name}
      </p>
      <p className="mt-1 text-sm font-semibold text-dark">
        {match.home_team.flag} {match.home_team.name} vs {match.away_team.flag} {match.away_team.name}
      </p>

      <div className="mt-4 flex items-center justify-center gap-3">
        <ScoreInput label={match.home_team.name} value={home} onChange={setHome} />
        <span className="text-xl text-border-2">—</span>
        <ScoreInput label={match.away_team.name} value={away} onChange={setAway} />
      </div>

      <p className="mb-1.5 mt-4 text-xs font-medium text-mid">First scoring team</p>
      <div className="flex flex-wrap gap-1.5">
        {[match.home_team.name, match.away_team.name, 'Goalless'].map((t) => (
          <button
            key={t}
            onClick={() => setFirstScorer(t)}
            className={`rounded-lg border px-2.5 py-1.5 text-xs ${
              firstScorer === t ? 'border-gold bg-gold text-dark' : 'border-border-2 text-mid'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <Button block size="sm" className="mt-4" variant={settled ? 'outline' : 'primary'} disabled={settled} onClick={settle}>
        {settled ? '✓ Settled' : 'Enter result & settle'}
      </Button>
    </div>
  )
}

function ScoreInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="text-center">
      <p className="mb-1 text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <input
        type="number"
        min={0}
        max={30}
        value={value}
        onChange={(e) => onChange(Math.max(0, Math.min(30, Number(e.target.value))))}
        className="h-14 w-16 rounded-xl border border-border-2 bg-bg text-center font-serif text-2xl font-bold text-dark focus:border-gold-border focus:outline-none"
      />
    </div>
  )
}
