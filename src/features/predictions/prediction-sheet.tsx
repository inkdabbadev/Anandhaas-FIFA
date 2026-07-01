'use client'

import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useAppStore, type Pick, pickLabel } from '@/store/app-store'
import { Sheet } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Lock } from 'lucide-react'
import { savePrediction } from '@/features/matches/actions'

type Celebration = {
  matchId: string
  pick: Pick
  round: number
  label: string
}

type PredictionOption = {
  key: Pick
  flag: string
  fallback?: string | null
  name: string
}

const CONFETTI = [
  { x: -112, y: -48, r: -34, c: 'bg-gold-light' },
  { x: -86, y: 18, r: 26, c: 'bg-white' },
  { x: -54, y: -76, r: 48, c: 'bg-green' },
  { x: -24, y: -36, r: -18, c: 'bg-fifa-light' },
  { x: 24, y: -70, r: 28, c: 'bg-white' },
  { x: 58, y: -20, r: -42, c: 'bg-gold-light' },
  { x: 88, y: 12, r: 32, c: 'bg-green' },
  { x: 116, y: -54, r: -24, c: 'bg-fifa-light' },
]

export function PredictionSheet() {
  const matchId = useAppStore((s) => s.activeSheetMatchId)
  const draftPick = useAppStore((s) => s.draftPick)
  const setDraftPick = useAppStore((s) => s.setDraftPick)
  const closeSheet = useAppStore((s) => s.closeSheet)
  const recordSavedPrediction = useAppStore((s) => s.recordSavedPrediction)
  const pushToast = useAppStore((s) => s.pushToast)
  const user = useAppStore((s) => (s.currentPhone ? s.users[s.currentPhone] : null))
  const reduceMotion = useReducedMotion()

  const matches = useAppStore((s) => s.matches)
  const goalRef = useRef<HTMLDivElement | null>(null)
  const [activeDrag, setActiveDrag] = useState<Pick | null>(null)
  const [celebration, setCelebration] = useState<Celebration | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const match = matches.find((m) => m.id === matchId) ?? null
  const open = !!matchId && !!match

  const options = useMemo(() => {
    if (!match) return []
    return [
      {
        key: 'home' as const,
        flag: match.home_team.flag,
        fallback: match.home_team.flagFallback,
        name: match.home_team.name,
      },
      {
        key: 'away' as const,
        flag: match.away_team.flag,
        fallback: match.away_team.flagFallback,
        name: match.away_team.name,
      },
    ]
  }, [match])

  if (!open || !match) {
    return (
      <Sheet open={false} onClose={handleClose}>
        {null}
      </Sheet>
    )
  }

  function resetLocalSheetState() {
    setActiveDrag(null)
    setCelebration(null)
    setSubmitting(false)
  }

  function handleClose() {
    resetLocalSheetState()
    closeSheet()
  }

  function scorePick(pick: Pick) {
    if (!match) return
    setDraftPick(pick)
    setCelebration({
      matchId: match.id,
      pick,
      round: Date.now(),
      label: pick === 'draw' ? 'DRAW!' : 'GOAL!',
    })
  }

  async function submit() {
    if (!draftPick || !match) return
    setSubmitting(true)
    const result = await savePrediction({
      userId: user?.id,
      matchId: match.id,
      pick: draftPick,
    })

    if (!result.ok) {
      setSubmitting(false)
      pushToast(result.message, 'error')
      return
    }

    recordSavedPrediction(match, draftPick, result.pointsAwarded ?? 0, result.stats)
    handleClose()
    pushToast(`Prediction locked: ${pickLabel(match, draftPick)}`, 'success')
  }

  const selectedName = draftPick ? pickLabel(match, draftPick) : null
  const currentCelebration = celebration?.matchId === match.id ? celebration : null
  const instruction = draftPick
    ? `${selectedName} is in the net. Lock it when you are ready.`
    : 'Drag a player token up into the goal.'

  return (
    <Sheet open={open} onClose={handleClose} labelledBy="sheet-title">
      <h2 id="sheet-title" className="sr-only">
        Predict {match.home_team.name} versus {match.away_team.name}
      </h2>

      <div className="mb-4 min-w-0">
        <p className="text-xs font-semibold text-gold">{match.competition}</p>
        <h3 className="mt-1 truncate font-serif text-xl font-extrabold text-dark">
          {match.home_team.name} vs {match.away_team.name}
        </h3>
      </div>

      <div className="relative mb-4 overflow-hidden rounded-[22px] bg-dark p-4 shadow-pop">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(147,197,253,0.24),transparent_42%)]" />
        <div
          ref={goalRef}
          className={cn(
            'goal-net relative mx-auto h-[148px] max-w-[310px] rounded-b-none transition-all duration-200',
            activeDrag && 'scale-[1.015] ring-2 ring-gold-light/70',
            currentCelebration && 'net-shake'
          )}
        >
          <div className="absolute inset-x-7 bottom-3 h-7 rounded-[50%] bg-black/20 blur-sm" />
          <AnimatePresence mode="popLayout">
            {currentCelebration && (
              <motion.div
                key={currentCelebration.round}
                className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={reduceMotion ? undefined : { opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
              >
                <motion.div
                  className={cn(
                    'absolute grid h-16 w-24 place-items-center overflow-hidden rounded-xl text-4xl shadow-[0_18px_35px_rgba(0,0,0,0.26)]',
                    currentCelebration.pick === 'draw' ? 'bg-white text-dark' : 'bg-gold text-white'
                  )}
                  initial={reduceMotion ? false : { y: 54, scale: 0.58, rotate: -12 }}
                  animate={reduceMotion ? undefined : { y: 0, scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 430, damping: 24 }}
                >
                  <FlagContent
                    key={`${currentCelebration.pick}-${match.home_team.flag}-${match.away_team.flag}`}
                    flag={
                      currentCelebration.pick === 'home'
                        ? match.home_team.flag
                        : currentCelebration.pick === 'away'
                          ? match.away_team.flag
                          : 'DRAW'
                    }
                    fallback={
                      currentCelebration.pick === 'home'
                        ? match.home_team.flagFallback
                        : currentCelebration.pick === 'away'
                          ? match.away_team.flagFallback
                          : null
                    }
                    name={currentCelebration.pick === 'draw' ? 'Draw' : currentCelebration.pick}
                  />
                </motion.div>

                {currentCelebration.pick === 'draw' ? (
                  <motion.div
                    className="absolute h-28 w-28 rounded-full border-4 border-white/80"
                    initial={reduceMotion ? false : { scale: 0.45, opacity: 0.9 }}
                    animate={reduceMotion ? undefined : { scale: 1.45, opacity: 0 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                  />
                ) : (
                  CONFETTI.map((piece, i) => (
                    <motion.span
                      key={`${currentCelebration.round}-${i}`}
                      className={cn('absolute h-2.5 w-1.5 rounded-[2px]', piece.c)}
                      initial={reduceMotion ? false : { x: 0, y: 0, rotate: 0, opacity: 1 }}
                      animate={
                        reduceMotion
                          ? undefined
                          : { x: piece.x, y: piece.y, rotate: piece.r, opacity: 0 }
                      }
                      transition={{ duration: 0.8, delay: i * 0.015, ease: 'easeOut' }}
                    />
                  ))
                )}

                <motion.span
                  className="absolute right-4 top-3 text-sm font-extrabold tracking-wide text-gold-light"
                  initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
                  animate={reduceMotion ? undefined : { scale: 1, opacity: 1 }}
                  transition={{ delay: 0.08, duration: 0.24, ease: 'easeOut' }}
                >
                  {currentCelebration.label}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {!currentCelebration && (
            <div className="absolute inset-x-4 bottom-5 text-center text-xs font-semibold text-[var(--on-dark-dim)]">
              Drop here
            </div>
          )}
        </div>
      </div>

      <p className="mb-4 text-center text-sm font-medium text-mid">{instruction}</p>

      <div className="mb-5 grid grid-cols-2 gap-2.5">
        {options.map((option) => {
          const selected = draftPick === option.key
          return (
            <PredictionPuck
              key={option.key}
              option={option}
              selected={selected}
              onScore={scorePick}
              goalRef={goalRef}
              onDragStart={() => setActiveDrag(option.key)}
              onDragEnd={() => setActiveDrag(null)}
            />
          )
        })}
      </div>

      <Button block size="lg" disabled={!draftPick || submitting} onClick={submit}>
        {draftPick ? (
          <>
            <Lock className="h-4 w-4" /> {submitting ? 'Saving...' : `Lock ${selectedName}`}
          </>
        ) : (
          'Drag a player into the goal'
        )}
      </Button>
    </Sheet>
  )
}

function PredictionPuck({
  option,
  selected,
  goalRef,
  onScore,
  onDragStart,
  onDragEnd,
}: {
  option: PredictionOption
  selected: boolean
  goalRef: React.RefObject<HTMLDivElement | null>
  onScore: (pick: Pick) => void
  onDragStart: () => void
  onDragEnd: () => void
}) {
  const didDragRef = useRef(false)

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: { point: { x: number; y: number } }) {
    const rect = goalRef.current?.getBoundingClientRect()
    onDragEnd()
    if (!rect) return

    const inGoal =
      info.point.x >= rect.left &&
      info.point.x <= rect.right &&
      info.point.y >= rect.top &&
      info.point.y <= rect.bottom

    if (inGoal) onScore(option.key)
    window.setTimeout(() => {
      didDragRef.current = false
    }, 0)
  }

  function handleClick() {
    if (didDragRef.current) {
      didDragRef.current = false
      return
    }
    onScore(option.key)
  }

  return (
    <motion.button
      type="button"
      drag
      dragSnapToOrigin
      dragElastic={0.12}
      dragMomentum={false}
      whileDrag={{ scale: 1.1, zIndex: 40, filter: 'drop-shadow(0 18px 22px rgba(8,26,22,0.22))' }}
      whileTap={{ scale: 0.97 }}
      onClick={handleClick}
      onDragStart={() => {
        didDragRef.current = true
        onDragStart()
      }}
      onDragEnd={handleDragEnd}
      aria-label={`Drag ${option.name} into the goal`}
      aria-pressed={selected}
      className={cn(
        'relative flex min-h-[124px] touch-none select-none flex-col items-center justify-start gap-2 rounded-2xl px-1 py-2 text-center outline-none transition-transform focus-visible:ring-2 focus-visible:ring-gold/40',
        selected && 'scale-[1.03]'
      )}
    >
      <span
        className={cn(
          'relative grid h-[58px] w-[82px] place-items-center overflow-hidden rounded-xl border-[3px] text-[24px] shadow-[0_12px_26px_rgba(8,26,22,0.16)] transition-colors',
          selected ? 'border-gold-light bg-gold text-white' : 'border-white bg-dark text-white'
        )}
      >
        <FlagContent
          key={`${option.flag}-${option.fallback ?? ''}`}
          flag={option.flag}
          fallback={option.fallback}
          name={option.name}
        />
      </span>
      <span className="line-clamp-2 min-h-[32px] text-[13px] font-extrabold leading-tight text-dark">
        {option.name}
      </span>
    </motion.button>
  )
}

function FlagContent({ flag, fallback, name }: { flag: string; fallback?: string | null; name: string }) {
  const [failedPrimary, setFailedPrimary] = useState(false)
  const src = failedPrimary && fallback ? fallback : flag

  if (isImageFlag(src)) {
    return (
      <span className="absolute inset-0 grid place-items-center overflow-hidden bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`${name} flag`}
          className="h-full w-full object-contain"
          onError={() => {
            if (fallback && src !== fallback) setFailedPrimary(true)
          }}
        />
      </span>
    )
  }

  if (src === 'DRAW') {
    return <span className="text-sm font-black tracking-wide">DRAW</span>
  }

  return <>{src}</>
}

function isImageFlag(value: string): boolean {
  return value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://')
}
