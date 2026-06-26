'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/app-store'
import { Sheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { getMatches } from '@/services/data-service'
import { cn } from '@/lib/utils'
import { Lock, Minus, Plus } from 'lucide-react'
import type { Match, Prediction } from '@/types'

export function PredictionSheet() {
  const matchId = useAppStore((s) => s.activeSheetMatchId)
  const draft = useAppStore((s) => s.draft)
  const closeSheet = useAppStore((s) => s.closeSheet)
  const updateDraft = useAppStore((s) => s.updateDraft)
  const tokenBalance = useAppStore((s) => s.tokenBalance)
  const spendTokens = useAppStore((s) => s.spendTokens)
  const addPrediction = useAppStore((s) => s.addPrediction)
  const incrementStreak = useAppStore((s) => s.incrementStreak)
  const pushToast = useAppStore((s) => s.pushToast)

  const [matches, setMatches] = useState<Match[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getMatches().then(setMatches).catch(() => setMatches([]))
  }, [])

  const match = matches.find((m) => m.id === matchId) ?? null
  const open = !!matchId && !!draft && !!match

  if (!open || !match || !draft) {
    return <Sheet open={false} onClose={closeSheet}>{null}</Sheet>
  }

  const teams = [
    { key: match.home_team.name, label: `${match.home_team.flag} ${match.home_team.name}` },
    { key: 'Draw', label: '🤝 Draw' },
    { key: match.away_team.name, label: `${match.away_team.flag} ${match.away_team.name}` },
  ]
  const canLock = !!draft.winner
  const enoughTokens = tokenBalance >= match.token_cost

  async function submit() {
    if (!canLock || !match || !draft) return
    if (!enoughTokens) {
      pushToast('Not enough tokens', 'error')
      return
    }
    setSubmitting(true)
    const prediction: Prediction = {
      id: `prd_${Date.now()}`,
      user_id: 'usr_rajesh',
      match_id: match.id,
      campaign_id: match.campaign_id,
      winner: draft.winner!,
      home_goals: draft.homeGoals,
      away_goals: draft.awayGoals,
      first_scorer_team: draft.firstScorerTeam,
      tokens_spent: match.token_cost,
      status: 'pending',
      points_earned: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    // optimistic update
    spendTokens(match.token_cost)
    addPrediction(prediction)
    incrementStreak()
    closeSheet()
    pushToast(`Locked! ${match.home_team.name} ${draft.homeGoals}–${draft.awayGoals} ${match.away_team.name}`)
    setSubmitting(false)
  }

  return (
    <Sheet open={open} onClose={closeSheet} labelledBy="sheet-title">
      <h2 id="sheet-title" className="sr-only">
        Predict {match.home_team.name} versus {match.away_team.name}
      </h2>

      {/* Match banner */}
      <div className="mb-4 flex items-center justify-center gap-5 rounded-xl bg-dark p-3">
        <div className="text-center">
          <div className="text-3xl">{match.home_team.flag}</div>
          <div className="mt-1 text-[11px] font-semibold text-bg">{match.home_team.name}</div>
        </div>
        <span className="text-[10px] font-bold text-[var(--on-dark-dim)]">VS</span>
        <div className="text-center">
          <div className="text-3xl">{match.away_team.flag}</div>
          <div className="mt-1 text-[11px] font-semibold text-bg">{match.away_team.name}</div>
        </div>
      </div>

      {/* Winner */}
      <Field label="Who wins?">
        <div className="flex flex-wrap gap-1.5">
          {teams.map((t) => (
            <Option key={t.key} selected={draft.winner === t.key} onClick={() => updateDraft({ winner: t.key })}>
              {t.label}
            </Option>
          ))}
        </div>
      </Field>

      {/* Score */}
      <Field label="Predict the score (bonus points)">
        <div className="flex items-center gap-3">
          <Stepper
            label={match.home_team.name}
            value={draft.homeGoals}
            onChange={(v) => updateDraft({ homeGoals: v })}
          />
          <span className="text-xl text-border-2">—</span>
          <Stepper
            label={match.away_team.name}
            value={draft.awayGoals}
            onChange={(v) => updateDraft({ awayGoals: v })}
          />
        </div>
      </Field>

      {/* First scorer */}
      <Field label="First scoring team?">
        <div className="flex flex-wrap gap-1.5">
          <Option
            selected={draft.firstScorerTeam === match.home_team.name}
            onClick={() => updateDraft({ firstScorerTeam: match.home_team.name })}
          >
            {match.home_team.flag} {match.home_team.name}
          </Option>
          <Option
            selected={draft.firstScorerTeam === match.away_team.name}
            onClick={() => updateDraft({ firstScorerTeam: match.away_team.name })}
          >
            {match.away_team.flag} {match.away_team.name}
          </Option>
          <Option
            selected={draft.firstScorerTeam === 'Goalless'}
            onClick={() => updateDraft({ firstScorerTeam: 'Goalless' })}
          >
            0–0 Goalless
          </Option>
        </div>
      </Field>

      {/* Cost */}
      <div className="mb-4 flex items-center justify-between rounded-2xl bg-gold-bg px-4 py-3.5">
        <span className="text-sm text-mid">Cost to predict</span>
        <span className="text-sm font-semibold text-gold">
          {match.token_cost} token{match.token_cost > 1 ? 's' : ''} · {tokenBalance} left
        </span>
      </div>

      <Button block size="lg" disabled={!canLock || submitting} onClick={submit}>
        {canLock ? (
          <>
            <Lock className="h-4 w-4" /> Lock in prediction
          </>
        ) : (
          'Select a winner to continue'
        )}
      </Button>
    </Sheet>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="mb-2.5 text-[15px] font-semibold text-dark">{label}</div>
      {children}
    </div>
  )
}

function Option({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-all active:scale-[0.96]',
        selected
          ? 'border-gold bg-gold font-semibold text-dark'
          : 'border-border-2 bg-card text-mid'
      )}
    >
      {children}
    </button>
  )
}

function Stepper({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex-1 text-center">
      <div className="mb-2 text-[13px] font-medium text-muted">{label}</div>
      <div className="flex items-center justify-center gap-2.5">
        <StepperBtn onClick={() => onChange(Math.max(0, value - 1))} aria-label={`Decrease ${label} goals`}>
          <Minus className="h-4 w-4" />
        </StepperBtn>
        <span className="min-w-[30px] text-center font-serif text-[28px] font-bold text-dark">{value}</span>
        <StepperBtn onClick={() => onChange(Math.min(20, value + 1))} aria-label={`Increase ${label} goals`}>
          <Plus className="h-4 w-4" />
        </StepperBtn>
      </div>
    </div>
  )
}

function StepperBtn({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-border-2 bg-card text-gold transition-colors active:bg-gold active:text-dark"
      {...props}
    >
      {children}
    </button>
  )
}
