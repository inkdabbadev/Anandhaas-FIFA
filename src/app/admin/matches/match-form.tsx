'use client'

import { useActionState, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { CalendarDays, CalendarPlus, Check, Clock, Flag, Loader2, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createMatchAction, type CreateMatchState } from './actions'

export type MatchTeamOption = {
  id: string
  name: string
  code: string
  flag_url?: string | null
}

const initialState: CreateMatchState = {
  status: 'idle',
  message: '',
}

const stages = [
  'Round of 32',
  'Round of 16',
  'Quater-finals',
  'Semi-finals',
  'Third place play-off',
  'Final',
]

const hours = Array.from({ length: 24 }, (_, hour) => hour.toString().padStart(2, '0'))
const minutes = ['00', '30']

export function MatchForm({ teams }: { teams: MatchTeamOption[] }) {
  const [state, formAction, pending] = useActionState(createMatchAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const hasEnoughTeams = teams.length >= 2
  const [team1Id, setTeam1Id] = useState('')
  const [team2Id, setTeam2Id] = useState('')
  const [date, setDate] = useState('')
  const [hour, setHour] = useState('')
  const [minute, setMinute] = useState('')

  const time = hour && minute ? `${hour}:${minute}` : ''
  const startsAt = date && time ? `${date}T${time}` : ''
  const predictionClosesAt = useMemo(() => {
    if (!startsAt) return ''

    const start = new Date(startsAt)
    if (Number.isNaN(start.getTime())) return ''

    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(start.getTime() - 24 * 60 * 60 * 1000))
  }, [startsAt])

  useEffect(() => {
    if (state.status !== 'success') return

    queueMicrotask(() => {
      formRef.current?.reset()
      setTeam1Id('')
      setTeam2Id('')
      setDate('')
      setHour('')
      setMinute('')
    })
  }, [state.status, state.message])

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <input type="hidden" name="team1_id" value={team1Id} />
      <input type="hidden" name="team2_id" value={team2Id} />
      <input type="hidden" name="starts_at" value={startsAt} />

      <div className="grid gap-4 sm:grid-cols-2">
        <TeamPicker
          label="Team 1"
          teams={teams}
          selectedId={team1Id}
          otherSelectedId={team2Id}
          onSelect={setTeam1Id}
          disabled={!hasEnoughTeams}
        />

        <TeamPicker
          label="Team 2"
          teams={teams}
          selectedId={team2Id}
          otherSelectedId={team1Id}
          onSelect={setTeam2Id}
          disabled={!hasEnoughTeams}
        />

        <Select label="Stage" name="stage" required defaultValue="Round of 32">
          {stages.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </Select>

        <Field label="Group name" name="group_name" placeholder="Optional, e.g. Group A" autoComplete="off" />
      </div>

      <div className="rounded-2xl border border-border-2 bg-white p-4">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-gold" />
          <h3 className="text-sm font-bold text-dark">Match start</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_0.8fr]">
          <Field
            label="Date"
            name="starts_date"
            type="date"
            required
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />

          <div>
            <span className="mb-2 block text-sm font-semibold text-dark">Time</span>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <select
                name="starts_hour"
                required
                value={hour}
                onChange={(event) => setHour(event.target.value)}
                className="h-12 w-full rounded-xl border border-border-2 bg-white px-3.5 text-sm text-dark outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/15"
              >
                <option value="">HH</option>
                {hours.map((nextHour) => (
                  <option key={nextHour} value={nextHour}>
                    {nextHour}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-1 rounded-xl border border-border-2 bg-bg p-1">
                {minutes.map((nextMinute) => (
                  <button
                    key={nextMinute}
                    type="button"
                    onClick={() => setMinute(nextMinute)}
                    className={cn(
                      'h-10 rounded-lg px-3 text-sm font-bold transition',
                      minute === nextMinute ? 'bg-gold text-white' : 'text-mid hover:bg-gold-bg'
                    )}
                  >
                    :{nextMinute}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-bg px-3 py-2 text-sm text-mid">
          <Clock className="h-4 w-4 text-gold" />
          {time ? `Selected time ${time}` : 'Select any hour with either :00 or :30'}
        </div>

        <div className="mt-4 rounded-xl border border-gold-border bg-gold-bg px-3 py-2 text-sm text-mid">
          <span className="font-semibold text-gold">Prediction closes:</span>{' '}
          {predictionClosesAt || 'Select match date and time'}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Toggle name="is_active" label="Active" defaultChecked />
        <Toggle name="is_featured" label="Featured" />
      </div>

      {!hasEnoughTeams && (
        <div className="rounded-xl border border-red/20 bg-red-bg px-4 py-3 text-sm text-red">
          Add at least two teams before creating matches.
        </div>
      )}

      {state.message && (
        <div
          className={cn(
            'flex items-start gap-2 rounded-xl border px-4 py-3 text-sm',
            state.status === 'success'
              ? 'border-green-border bg-green-bg text-green'
              : 'border-red/20 bg-red-bg text-red'
          )}
        >
          {state.status === 'error' && <X className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{state.message}</span>
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={pending || !hasEnoughTeams || !team1Id || !team2Id || !startsAt}
        className="w-full sm:w-auto"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
        {pending ? 'Saving match...' : 'Add scheduled match'}
      </Button>
    </form>
  )
}

function TeamPicker({
  label,
  teams,
  selectedId,
  otherSelectedId,
  onSelect,
  disabled,
}: {
  label: string
  teams: MatchTeamOption[]
  selectedId: string
  otherSelectedId: string
  onSelect: (id: string) => void
  disabled?: boolean
}) {
  const [query, setQuery] = useState('')
  const selected = teams.find((team) => team.id === selectedId) ?? null
  const filtered = useMemo(() => {
    const clean = query.trim().toLowerCase()
    const available = teams.filter((team) => team.id !== otherSelectedId)

    if (!clean) return available.slice(0, 8)

    return available
      .filter((team) => `${team.name} ${team.code}`.toLowerCase().includes(clean))
      .slice(0, 8)
  }, [otherSelectedId, query, teams])

  return (
    <div>
      <span className="mb-2 block text-sm font-semibold text-dark">{label}</span>
      <div className={cn('rounded-2xl border border-border-2 bg-white p-2', disabled && 'opacity-60')}>
        <div className="flex h-10 items-center gap-2 rounded-xl bg-bg px-3">
          <Search className="h-4 w-4 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            disabled={disabled}
            placeholder={selected ? `${selected.name} (${selected.code})` : 'Search team'}
            className="min-w-0 flex-1 bg-transparent text-sm text-dark outline-none placeholder:text-muted disabled:cursor-not-allowed"
          />
        </div>

        {selected && (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-xl border border-gold-border bg-gold-bg px-3 py-2">
            <span className="flex min-w-0 items-center gap-2">
              <TeamFlag team={selected} />
              <span className="min-w-0 truncate text-sm font-bold text-gold">
                {selected.name} ({selected.code})
              </span>
            </span>
            <button
              type="button"
              onClick={() => onSelect('')}
              className="shrink-0 text-xs font-semibold text-mid"
            >
              Clear
            </button>
          </div>
        )}

        <div className="mt-2 max-h-52 space-y-1 overflow-auto pr-1 thin-scrollbar">
          {filtered.length > 0 ? (
            filtered.map((team) => {
              const active = team.id === selectedId
              return (
                <button
                  key={team.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onSelect(team.id)
                    setQuery('')
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition',
                    active ? 'bg-gold text-white' : 'hover:bg-gold-bg'
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <TeamFlag team={team} active={active} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{team.name}</span>
                      <span className={cn('block text-xs', active ? 'text-white/80' : 'text-muted')}>{team.code}</span>
                    </span>
                  </span>
                  {active && <Check className="h-4 w-4 shrink-0" />}
                </button>
              )
            })
          ) : (
            <p className="px-3 py-3 text-sm text-muted">No teams found.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function TeamFlag({ team, active }: { team: MatchTeamOption; active?: boolean }) {
  return (
    <span
      className={cn(
        'relative block h-8 w-10 shrink-0 overflow-hidden rounded-md border bg-white',
        active ? 'border-white/40' : 'border-border'
      )}
    >
      {team.flag_url ? (
        <Image src={team.flag_url} alt={`${team.name} flag`} fill sizes="40px" className="object-contain p-0.5" />
      ) : (
        <Flag className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-muted" />
      )}
    </span>
  )
}

function Field({
  label,
  name,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  name: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-dark">{label}</span>
      <input
        name={name}
        className="h-12 w-full rounded-xl border border-border-2 bg-white px-3.5 text-sm text-dark outline-none transition placeholder:text-muted focus:border-gold focus:ring-2 focus:ring-gold/15"
        {...props}
      />
    </label>
  )
}

function Select({
  label,
  name,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  name: string
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-dark">{label}</span>
      <select
        name={name}
        className="h-12 w-full rounded-xl border border-border-2 bg-white px-3.5 text-sm text-dark outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/15 disabled:cursor-not-allowed disabled:bg-border"
        {...props}
      >
        {children}
      </select>
    </label>
  )
}

function Toggle({
  name,
  label,
  defaultChecked,
}: {
  name: string
  label: string
  defaultChecked?: boolean
}) {
  return (
    <label className="flex h-12 items-center gap-3 rounded-xl border border-border-2 bg-white px-3.5">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-4 w-4 accent-gold"
      />
      <span className="text-sm font-semibold text-dark">{label}</span>
    </label>
  )
}
