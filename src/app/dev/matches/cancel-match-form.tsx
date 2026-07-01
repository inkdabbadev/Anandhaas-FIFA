'use client'

import { useActionState } from 'react'
import { Ban, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { cancelMatchAction, type CancelMatchState } from './actions'

const initialState: CancelMatchState = {
  status: 'idle',
  message: '',
}

export function CancelMatchForm({
  matchId,
  status,
  processed,
}: {
  matchId: string
  status: string
  processed: boolean
}) {
  const [state, formAction, pending] = useActionState(cancelMatchAction, initialState)
  const cancelled = status === 'cancelled'
  const disabled = pending || cancelled || processed || status === 'completed'

  return (
    <form action={formAction} className="mt-2">
      <input type="hidden" name="match_id" value={matchId} />
      <Button type="submit" size="sm" variant="danger" className="w-full" disabled={disabled}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
        {cancelled ? 'Match cancelled' : pending ? 'Cancelling...' : 'Cancel match'}
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
