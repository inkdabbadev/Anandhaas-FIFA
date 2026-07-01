'use client'

import { useActionState, useState } from 'react'
import { Loader2, RotateCcw, Trophy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  publishMatchResultAction,
  revokeMatchResultAction,
  type PublishResultState,
  type RevokeResultState,
} from './actions'

const initialState: PublishResultState = {
  status: 'idle',
  message: '',
}

const initialRevokeState: RevokeResultState = {
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
  const [publishState, publishAction, publishPending] = useActionState(publishMatchResultAction, initialState)
  const [revokeState, revokeAction, revokePending] = useActionState(revokeMatchResultAction, initialRevokeState)
  const [team1Value, setTeam1Value] = useState(team1Score?.toString() ?? '')
  const [team2Value, setTeam2Value] = useState(team2Score?.toString() ?? '')
  const pending = publishPending || revokePending
  const tiedScore =
    team1Value.trim() !== '' &&
    team2Value.trim() !== '' &&
    Number(team1Value) === Number(team2Value)

  return (
    <form action={publishAction} className="mt-3 rounded-xl border border-border bg-bg p-3">
      <input type="hidden" name="match_id" value={matchId} />

      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <ScoreInput
          label={team1Name}
          name="team1_score"
          value={team1Value}
          onChange={setTeam1Value}
          disabled={processed || pending}
        />
        <span className="pb-3 text-xs font-bold text-muted">VS</span>
        <ScoreInput
          label={team2Name}
          name="team2_score"
          value={team2Value}
          onChange={setTeam2Value}
          disabled={processed || pending}
        />
      </div>

      {tiedScore && (
        <label className="mt-3 block">
          <span className="mb-1 block text-[11px] font-bold text-dark">Tie-break winner</span>
          <select
            name="winning_pick"
            required
            disabled={processed || pending}
            defaultValue=""
            suppressHydrationWarning
            className="h-10 w-full rounded-lg border border-border-2 bg-white px-2 text-sm font-bold text-dark outline-none focus:border-gold disabled:bg-border"
          >
            <option value="" disabled>
              Select winner
            </option>
            <option value="team1">{team1Name} won</option>
            <option value="team2">{team2Name} won</option>
          </select>
          <span className="mt-1 block text-[11px] leading-snug text-muted">
            Use this when the goals are level but the match was decided by penalties or another tie-break.
          </span>
        </label>
      )}

      <Button type="submit" size="sm" className="mt-3 w-full" disabled={processed || pending}>
        {publishPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
        {processed ? 'Points processed' : publishPending ? 'Publishing...' : 'Publish result'}
      </Button>

      {processed && (
        <Button
          type="submit"
          size="sm"
          variant="danger"
          className="mt-2 w-full"
          disabled={pending}
          formAction={revokeAction}
        >
          {revokePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
          {revokePending ? 'Revoking...' : 'Revoke result'}
        </Button>
      )}

      {publishState.message && (
        <StatusMessage status={publishState.status} message={publishState.message} />
      )}

      {revokeState.message && (
        <StatusMessage status={revokeState.status} message={revokeState.message} />
      )}
    </form>
  )
}

function StatusMessage({
  status,
  message,
}: {
  status: PublishResultState['status']
  message: string
}) {
  return (
    <p
      className={cn(
        'mt-2 rounded-lg border px-2.5 py-2 text-xs font-medium',
        status === 'success'
          ? 'border-green-border bg-green-bg text-green'
          : 'border-red/20 bg-red-bg text-red'
      )}
    >
      {message}
    </p>
  )
}

function ScoreInput({
  label,
  name,
  value,
  onChange,
  disabled,
}: {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
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
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        suppressHydrationWarning
        className="h-10 w-full rounded-lg border border-border-2 bg-white px-2 text-center text-sm font-bold text-dark outline-none focus:border-gold disabled:bg-border"
      />
    </label>
  )
}
