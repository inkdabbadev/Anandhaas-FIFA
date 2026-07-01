import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, Database, Flag, Globe2 } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/card'
import { createAdminClient } from '@/lib/supabase/server'
import { TeamForm } from './team-form'

export const metadata: Metadata = {
  title: 'Dev Teams',
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type TeamRow = {
  id: string
  name: string
  code: string
  country: string
  flag_url: string | null
  flag_api: string | null
  created_at: string
}

export default async function AdminTeamPage() {
  const { teams, error } = await getTeams()

  return (
    <main className="min-h-dvh bg-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="rounded-3xl bg-brand px-5 py-7 text-bg shadow-pop sm:px-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.08] px-3 py-1 text-xs font-semibold text-gold-light">
                <Database className="h-3.5 w-3.5" />
                Teams table
              </div>
              <h1 className="mt-4 font-serif text-3xl font-extrabold sm:text-4xl">Add FIFA teams</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--on-dark-dim)]">
                Save a team record to Supabase and store the uploaded flag at the public path generated from the team
                code.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <AdminLink href="/dev/team" active icon={Flag} label="Teams" />
              <AdminLink href="/dev/matches" icon={CalendarDays} label="Matches" />
            </div>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
          <Card className="rounded-3xl">
            <CardBody className="p-5 sm:p-6">
              <div className="mb-5 flex items-center gap-2">
                <Flag className="h-5 w-5 text-gold" />
                <h2 className="text-lg font-bold text-dark">Team details</h2>
              </div>
              <TeamForm />
            </CardBody>
          </Card>

          <aside className="space-y-4">
            <Card className="rounded-3xl">
              <CardBody className="p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Globe2 className="h-5 w-5 text-gold" />
                  <h2 className="text-lg font-bold text-dark">Current teams</h2>
                </div>

                {error ? (
                  <p className="rounded-xl border border-red/20 bg-red-bg px-3 py-2 text-sm text-red">{error}</p>
                ) : teams.length === 0 ? (
                  <p className="rounded-xl border border-border bg-bg px-3 py-4 text-sm text-muted">
                    No teams added yet.
                  </p>
                ) : (
                  <div className="max-h-[520px] space-y-2 overflow-auto pr-1 thin-scrollbar">
                    {teams.map((team) => (
                      <TeamListItem key={team.id} team={team} />
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

function TeamListItem({ team }: { team: TeamRow }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-white p-3">
      <div className="relative h-11 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-bg">
        {team.flag_url ? (
          <Image src={team.flag_url} alt={`${team.name} flag`} fill sizes="56px" className="object-contain p-1" />
        ) : (
          <Flag className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 text-muted" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-bold text-dark">{team.name}</span>
          <span className="shrink-0 rounded-full bg-gold-bg px-2 py-0.5 text-[11px] font-bold text-gold">
            {team.code}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted">{team.country}</p>
      </div>
    </div>
  )
}

async function getTeams(): Promise<{ teams: TeamRow[]; error: string | null }> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('teams')
      .select('id,name,code,country,flag_url,flag_api,created_at')
      .order('created_at', { ascending: false })

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
