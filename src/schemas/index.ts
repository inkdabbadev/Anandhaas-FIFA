import { z } from 'zod'

export const phoneSchema = z
  .string()
  .trim()
  .refine((value) => {
    const digits = value.replace(/\D/g, '')
    const mobile = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits

    return /^[6-9]\d{9}$/.test(mobile)
  }, 'Enter a valid Indian mobile number')

export const emailSchema = z.email('Enter a valid email address').trim().toLowerCase()

export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Enter the 6-digit code')

export const loginSchema = z.object({ phone: phoneSchema, email: emailSchema })
export const verifySchema = z.object({ phone: phoneSchema, email: emailSchema, otp: otpSchema })

export const predictionSchema = z.object({
  matchId: z.string().min(1),
  winner: z.string().min(1, 'Pick a winner'),
  homeGoals: z.number().int().min(0).max(20),
  awayGoals: z.number().int().min(0).max(20),
  firstScorerTeam: z.string().nullable(),
})

export const matchSchema = z.object({
  homeTeamName: z.string().min(1),
  homeTeamFlag: z.string().min(1),
  homeTeamRanking: z.string().optional(),
  awayTeamName: z.string().min(1),
  awayTeamFlag: z.string().min(1),
  awayTeamRanking: z.string().optional(),
  competition: z.string().min(1),
  groupName: z.string().optional(),
  kickoffAt: z.string().min(1),
  tokenCost: z.coerce.number().int().min(0).max(10),
  venue: z.string().optional(),
})

export const resultSchema = z.object({
  homeScore: z.coerce.number().int().min(0).max(30),
  awayScore: z.coerce.number().int().min(0).max(30),
  firstScorerTeam: z.string().nullable(),
})

export const rewardSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().min(1),
  pointsCost: z.coerce.number().int().min(0),
  inventory: z.coerce.number().int().min(0).nullable(),
  isActive: z.boolean(),
})

export const tokenGrantSchema = z.object({
  userId: z.string().min(1),
  amount: z.coerce.number().int(),
  note: z.string().min(1),
})

export type LoginInput = z.infer<typeof loginSchema>
export type VerifyInput = z.infer<typeof verifySchema>
export type PredictionInput = z.infer<typeof predictionSchema>
export type MatchInput = z.infer<typeof matchSchema>
export type ResultInput = z.infer<typeof resultSchema>
export type RewardInput = z.infer<typeof rewardSchema>
