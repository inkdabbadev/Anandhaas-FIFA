import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, Flag, ListChecks } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/card'
import { createAdminClient } from '@/lib/supabase/server'
import { MatchForm, type MatchTeamOption } from './match-form'

export const metadata: Metadata = {
  title: 'Admin Matches',
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type TeamRow = MatchTeamOption & {
  flag_url: string | null
}

type MatchRow = {
  id: string
  stage: string | null
  group_name: string | null
  starts_at: string
  prediction_closes_at: string
  status: string
  is_active: boolean
  is_featured: boolean
  team1: TeamRow | null
  team2: TeamRow | null
}

type RawMatchRow = Omit<MatchRow, 'team1' | 'team2'> & {
  team1: TeamRow | TeamRow[] | null
  team2: TeamRow | TeamRow[] | null
}

export default async function AdminMatchesPage() {
  const [{ teams, error: teamsError }, { matches, error: matchesError }] = await Promise.all([
    getTeams(),
    getMatches(),
  ])

  return (
    <main className="min-h-dvh bg-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="rounded-3xl bg-brand px-5 py-7 text-bg shadow-pop sm:px-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-semibold text-gold-light">
                <CalendarDays className="h-3.5 w-3.5" />
                Matches table
              </div>
              <h1 className="mt-4 font-serif text-3xl font-extrabold sm:text-4xl">Add FIFA matches</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--on-dark-dim)]">
                Create scheduled match fixtures by selecting two teams, a knockout stage, and the start time.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <AdminLink href="/admin/team" icon={Flag} label="Teams" />
              <AdminLink href="/admin/matches" active icon={CalendarDays} label="Matches" />
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
          <Card className="rounded-3xl">
            <CardBody className="p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-gold" />
                <h2 className="text-lg font-bold text-dark">Match details</h2>
              </div>

              {teamsError ? (
                <p className="rounded-xl border border-red/20 bg-red-bg px-3 py-2 text-sm text-red">{teamsError}</p>
              ) : (
                <MatchForm teams={teams} />
              )}
            </CardBody>
          </Card>

          <aside className="space-y-4">
            <Card className="rounded-3xl">
              <CardBody className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <ListChecks className="h-5 w-5 text-gold" />
                  <h2 className="text-lg font-bold text-dark">Current matches</h2>
                </div>

                {matchesError ? (
                  <p className="rounded-xl border border-red/20 bg-red-bg px-3 py-2 text-sm text-red">
                    {matchesError}
                  </p>
                ) : matches.length === 0 ? (
                  <p className="rounded-xl border border-border bg-bg px-3 py-4 text-sm text-muted">
                    No matches added yet.
                  </p>
                ) : (
                  <div className="max-h-[620px] space-y-2 overflow-auto pr-1 thin-scrollbar">
                    {matches.map((match) => (
                      <MatchListItem key={match.id} match={match} />
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </aside>
        </section>
      </div>
    </main>
  )
}

function AdminLink({
  href,
  active,
  icon: Icon,
  label,
}: {
  href: string
  active?: boolean
  icon: typeof Flag
  label: string
}) {
  return (
    <Link
      href={href}
      className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition ${
        active
          ? 'border-gold-light bg-white text-dark'
          : 'border-white/10 bg-white/[0.08] text-bg hover:bg-white/[0.14]'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  )
}

function MatchListItem({ match }: { match: MatchRow }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="truncate text-xs font-bold text-gold">{match.stage ?? 'Stage not set'}</span>
        <span className="shrink-0 rounded-full bg-gold-bg px-2 py-0.5 text-[11px] font-bold capitalize text-gold">
          {match.status}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <TeamMini team={match.team1} align="right" />
        <span className="text-xs font-bold text-muted">VS</span>
        <TeamMini team={match.team2} align="left" />
      </div>

      <div className="mt-3 space-y-1 text-xs text-muted">
        {match.group_name && <p>{match.group_name}</p>}
        <p>Starts {formatDateTime(match.starts_at)}</p>
        <p>Closes {formatDateTime(match.prediction_closes_at)}</p>
        {(match.is_featured || !match.is_active) && (
          <p>
            {match.is_featured ? 'Featured' : ''} {match.is_featured && !match.is_active ? '-' : ''}{' '}
            {!match.is_active ? 'Inactive' : ''}
          </p>
        )}
      </div>
    </div>
  )
}

function TeamMini({ team, align }: { team: TeamRow | null; align: 'left' | 'right' }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 ${align === 'right' ? 'justify-end text-right' : ''}`}>
      {align === 'left' && <FlagImage team={team} />}
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-dark">{team?.name ?? 'Unknown team'}</span>
        <span className="block truncate text-[11px] text-muted">{team?.code ?? '---'}</span>
      </span>
      {align === 'right' && <FlagImage team={team} />}
    </div>
  )
}

function FlagImage({ team }: { team: TeamRow | null }) {
  return (
    <span className="relative block h-8 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-bg">
      {team?.flag_url ? (
        <Image src={team.flag_url} alt={`${team.name} flag`} fill sizes="40px" className="object-contain p-0.5" />
      ) : (
        <Flag className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-muted" />
      )}
    </span>
  )
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

async function getTeams(): Promise<{ teams: TeamRow[]; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('teams')
      .select('id,name,code,flag_url')
      .order('name', { ascending: true })

    if (error) {
      return { teams: [], error: error.message }
    }

    return { teams: (data ?? []) as TeamRow[], error: null }
  } catch (error) {
    return {
      teams: [],
      error: error instanceof Error ? error.message : 'Could not load teams.',
    }
  }
}

async function getMatches(): Promise<{ matches: MatchRow[]; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('matches')
      .select(
        'id,stage,group_name,starts_at,prediction_closes_at,status,is_active,is_featured,team1:teams!matches_team1_id_fkey(id,name,code,flag_url),team2:teams!matches_team2_id_fkey(id,name,code,flag_url)'
      )
      .order('starts_at', { ascending: true })

    if (error) {
      return { matches: [], error: error.message }
    }

    const matches = ((data ?? []) as RawMatchRow[]).map((match) => ({
      ...match,
      team1: Array.isArray(match.team1) ? (match.team1[0] ?? null) : match.team1,
      team2: Array.isArray(match.team2) ? (match.team2[0] ?? null) : match.team2,
    }))

    return { matches, error: null }
  } catch (error) {
    return {
      matches: [],
      error: error instanceof Error ? error.message : 'Could not load matches.',
    }
  }
}
