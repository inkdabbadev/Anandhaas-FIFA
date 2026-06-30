'use client'

import { useActionState } from 'react'
import { Loader2, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { publishMatchResultAction, type PublishResultState } from './actions'

const initialState: PublishResultState = {
  status: 'idle',
  message: '',
}

export function ResultForm({
  matchId,
  team1Name,
  team2Name,
  team1Score,
  team2Score,
  processed,
}: {
  matchId: string
  team1Name: string
  team2Name: string
  team1Score: number | null
  team2Score: number | null
  processed: boolean
}) {
  const [state, formAction, pending] = useActionState(publishMatchResultAction, initialState)

  return (
    <form action={formAction} className="mt-3 rounded-xl border border-border bg-bg p-3">
      <input type="hidden" name="match_id" value={matchId} />

      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <ScoreInput
          label={team1Name}
          name="team1_score"
          defaultValue={team1Score}
          disabled={processed || pending}
        />
        <span className="pb-3 text-xs font-bold text-muted">VS</span>
        <ScoreInput
          label={team2Name}
          name="team2_score"
          defaultValue={team2Score}
          disabled={processed || pending}
        />
      </div>

      <Button type="submit" size="sm" className="mt-3 w-full" disabled={processed || pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
        {processed ? 'Points processed' : pending ? 'Publishing...' : 'Publish result'}
      </Button>

      {state.message && (
        <p
          className={cn(
            'mt-2 rounded-lg border px-2.5 py-2 text-xs font-medium',
            state.status === 'success'
              ? 'border-green-border bg-green-bg text-green'
              : 'border-red/20 bg-red-bg text-red'
          )}
        >
          {state.message}
        </p>
      )}
    </form>
  )
}

function ScoreInput({
  label,
  name,
  defaultValue,
  disabled,
}: {
  label: string
  name: string
  defaultValue: number | null
  disabled: boolean
}) {
  return (
    <label className="min-w-0">
      <span className="mb-1 block truncate text-[11px] font-bold text-dark">{label}</span>
      <input
        name={name}
        type="number"
        min={0}
        required
        defaultValue={defaultValue ?? ''}
        disabled={disabled}
        className="h-10 w-full rounded-lg border border-border-2 bg-white px-2 text-center text-sm font-bold text-dark outline-none focus:border-gold disabled:bg-border"
      />
    </label>
  )
}
