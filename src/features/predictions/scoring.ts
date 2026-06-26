import type { Match, Prediction } from '@/types'
import { getActiveCampaign } from '@/config/campaign'

export interface ScoreBreakdown {
  winner: number
  exactScore: number
  firstScorer: number
  perfect: number
  total: number
}

/**
 * Pure, server-authoritative scoring. Given a settled match and a prediction,
 * compute the points earned. Mirrors the campaign rules so the same logic can
 * run in a Supabase edge function during settlement.
 */
export function scorePrediction(match: Match, prediction: Prediction): ScoreBreakdown {
  const rules = getActiveCampaign().rules
  const empty: ScoreBreakdown = { winner: 0, exactScore: 0, firstScorer: 0, perfect: 0, total: 0 }

  if (match.status !== 'finished' || match.home_score == null || match.away_score == null) {
    return empty
  }

  const actualWinner =
    match.home_score > match.away_score
      ? match.home_team.name
      : match.away_score > match.home_score
        ? match.away_team.name
        : 'Draw'

  const winnerCorrect = prediction.winner === actualWinner
  const exactCorrect =
    prediction.home_goals === match.home_score && prediction.away_goals === match.away_score
  const firstScorerCorrect =
    !!prediction.first_scorer_team && prediction.first_scorer_team === match.first_scorer_team

  // Perfect match = winner + exact score + first scorer all correct → flat bonus.
  if (winnerCorrect && exactCorrect && firstScorerCorrect) {
    return {
      winner: 0,
      exactScore: 0,
      firstScorer: 0,
      perfect: rules.points_perfect,
      total: rules.points_perfect,
    }
  }

  const breakdown: ScoreBreakdown = {
    winner: winnerCorrect ? rules.points_winner : 0,
    exactScore: exactCorrect ? rules.points_exact_score : 0,
    firstScorer: firstScorerCorrect ? rules.points_first_scorer : 0,
    perfect: 0,
    total: 0,
  }
  breakdown.total = breakdown.winner + breakdown.exactScore + breakdown.firstScorer
  return breakdown
}
