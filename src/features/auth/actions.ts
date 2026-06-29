'use server'

import { pbkdf2Sync, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import nodemailer from 'nodemailer'
import { createAdminClient } from '@/lib/supabase/server'
import { env } from '@/config/env'

type Purpose = 'signup' | 'forgot_mpin'

type OtpRecord = {
  otp: string
  expiresAt: number
  phone?: string
  email: string
  profileId?: string
}

type AuthProfile = {
  id: string
  phone: string
  email: string
  name: string
  age: number | null
  points_balance: number
  predictions_count: number
  correct_predictions_count: number
  registered_at: string
  mpin_hash?: string | null
}

export type AuthUser = {
  id: string
  phone: string
  email: string
  name: string
  age: number
  points: number
  predictionsCount: number
  correctCount: number
  createdAt: string
}

export type AuthResult = {
  ok: boolean
  message: string
  user?: AuthUser
  email?: string
  devOtp?: string
  accountExists?: boolean
}

const otpStore = new Map<string, OtpRecord>()
const verifiedSignupStore = new Map<string, OtpRecord>()
const OTP_TTL_MS = 10 * 60 * 1000

export async function sendSignupOtp(phoneInput: string, emailInput: string): Promise<AuthResult> {
  const phone = normalizePhone(phoneInput)
  const email = normalizeEmail(emailInput)

  if (!phone) return { ok: false, message: 'Enter a valid 10-digit phone number.' }
  if (!email) return { ok: false, message: 'Enter a valid email address.' }

  const admin = createAdminClient()
  const { data: phoneUser, error: phoneError } = await admin
    .from('user_profiles')
    .select('id')
    .eq('phone', phone)
    .maybeSingle()

  if (phoneError) return { ok: false, message: phoneError.message }
  if (phoneUser) return accountExistsResult()

  const { data: emailUser, error: emailError } = await admin
    .from('user_profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (emailError) return { ok: false, message: emailError.message }
  if (emailUser) return accountExistsResult()

  const otp = createOtp()
  otpStore.set(otpKey('signup', email), {
    otp,
    phone,
    email,
    expiresAt: Date.now() + OTP_TTL_MS,
  })

  const emailResult = await sendOtpEmail(email, otp, 'Your Anandhaas signup OTP')
  if (!emailResult.ok) {
    otpStore.delete(otpKey('signup', email))
    return { ok: false, message: emailResult.message }
  }

  return {
    ok: true,
    message: 'OTP sent to your email.',
    email,
    devOtp: isSmtpConfigured() ? undefined : otp,
  }
}

export async function verifySignupOtp(emailInput: string, otpInput: string): Promise<AuthResult> {
  const email = normalizeEmail(emailInput)
  const record = consumeOtp('signup', email, otpInput)

  if (!record) return { ok: false, message: 'Invalid or expired OTP.' }
  verifiedSignupStore.set(otpKey('signup', email), record)
  return { ok: true, message: 'Email verified.', email }
}

export async function registerUser(input: {
  phone: string
  email: string
  name: string
  age: string
  mpin: string
  confirmMpin: string
}): Promise<AuthResult> {
  const phone = normalizePhone(input.phone)
  const email = normalizeEmail(input.email)
  const name = input.name.trim()
  const age = Number(input.age)

  if (!phone) return { ok: false, message: 'Enter a valid phone number.' }
  if (!email) return { ok: false, message: 'Enter a valid email address.' }
  if (name.length < 2) return { ok: false, message: 'Enter your name.' }
  if (!Number.isInteger(age) || age < 1 || age > 120) return { ok: false, message: 'Enter a valid age.' }
  if (!isSixDigit(input.mpin)) return { ok: false, message: 'MPIN must be 6 digits.' }
  if (input.mpin !== input.confirmMpin) return { ok: false, message: 'MPINs do not match.' }

  const verified = verifiedSignupStore.get(otpKey('signup', email))
  if (!verified || verified.expiresAt < Date.now() || verified.phone !== phone) {
    return { ok: false, message: 'Please verify your email OTP again.' }
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('user_profiles')
    .insert({
      phone,
      email,
      name,
      age,
      mpin_hash: hashMpin(input.mpin),
      last_login_at: new Date().toISOString(),
    })
    .select(
      'id,phone,email,name,age,points_balance,predictions_count,correct_predictions_count,registered_at'
    )
    .single()

  if (error) return { ok: false, message: error.message }

  verifiedSignupStore.delete(otpKey('signup', email))

  return { ok: true, message: 'Registered successfully.', user: toAuthUser(data as AuthProfile) }
}

export async function loginWithMpin(identifierInput: string, mpin: string): Promise<AuthResult> {
  const profile = await findProfile(identifierInput, true)

  if (!profile) return { ok: false, message: 'No account found for this phone or email.' }
  if (!profile.is_active) return { ok: false, message: 'This account is inactive.' }
  if (!profile.mpin_hash) return { ok: false, message: 'MPIN is not set for this account.' }
  if (!isSixDigit(mpin)) return { ok: false, message: 'MPIN must be 6 digits.' }
  if (!verifyMpin(mpin, profile.mpin_hash)) return { ok: false, message: 'Wrong MPIN.' }

  const admin = createAdminClient()
  await admin.from('user_profiles').update({ last_login_at: new Date().toISOString() }).eq('id', profile.id)

  return { ok: true, message: 'Logged in.', user: toAuthUser(profile) }
}

export async function sendForgotMpinOtp(identifierInput: string): Promise<AuthResult> {
  const profile = await findProfile(identifierInput, true)

  if (!profile) return { ok: false, message: 'No account found for this phone or email.' }
  if (!profile.email) return { ok: false, message: 'This account has no email address.' }

  const otp = createOtp()
  const email = normalizeEmail(profile.email)
  otpStore.set(otpKey('forgot_mpin', email), {
    otp,
    email,
    phone: profile.phone,
    profileId: profile.id,
    expiresAt: Date.now() + OTP_TTL_MS,
  })

  const emailResult = await sendOtpEmail(email, otp, 'Your Anandhaas MPIN reset OTP')
  if (!emailResult.ok) {
    otpStore.delete(otpKey('forgot_mpin', email))
    return { ok: false, message: emailResult.message }
  }

  return {
    ok: true,
    message: 'OTP sent to your registered email.',
    email,
    devOtp: isSmtpConfigured() ? undefined : otp,
  }
}

export async function resetMpin(input: {
  email: string
  otp: string
  mpin: string
  confirmMpin: string
}): Promise<AuthResult> {
  const email = normalizeEmail(input.email)
  const record = consumeOtp('forgot_mpin', email, input.otp)

  if (!record?.profileId) return { ok: false, message: 'Invalid or expired OTP.' }
  if (!isSixDigit(input.mpin)) return { ok: false, message: 'MPIN must be 6 digits.' }
  if (input.mpin !== input.confirmMpin) return { ok: false, message: 'MPINs do not match.' }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('user_profiles')
    .update({
      mpin_hash: hashMpin(input.mpin),
      last_login_at: new Date().toISOString(),
    })
    .eq('id', record.profileId)
    .select(
      'id,phone,email,name,age,points_balance,predictions_count,correct_predictions_count,registered_at'
    )
    .single()

  if (error) return { ok: false, message: error.message }

  return { ok: true, message: 'MPIN reset successfully.', user: toAuthUser(data as AuthProfile) }
}

async function findProfile(identifierInput: string, includeHash = false): Promise<(AuthProfile & { is_active: boolean }) | null> {
  const identifier = identifierInput.trim()
  if (!identifier) return null

  const admin = createAdminClient()
  void includeHash

  const query = admin.from('user_profiles').select('*')

  const cleanEmail = normalizeEmail(identifier)
  const cleanPhone = normalizePhone(identifier)
  const { data, error } = cleanEmail
    ? await query.eq('email', cleanEmail).maybeSingle()
    : await query.eq('phone', cleanPhone).maybeSingle()

  if (error || !data) return null
  return data as unknown as AuthProfile & { is_active: boolean }
}

function consumeOtp(purpose: Purpose, email: string, otpInput: string): OtpRecord | null {
  const cleanOtp = otpInput.replace(/\D/g, '')
  const key = otpKey(purpose, email)
  const record = otpStore.get(key)

  if (!record || record.expiresAt < Date.now() || record.otp !== cleanOtp) return null

  otpStore.delete(key)
  return record
}

async function sendOtpEmail(
  email: string,
  otp: string,
  subject: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isSmtpConfigured()) {
    console.info(`[DEV OTP] ${email}: ${otp}`)
    return { ok: true }
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.mailUser,
      pass: env.mailPass.replace(/\s/g, ''),
    },
  })

  try {
    const info = await transporter.sendMail({
      from: env.mailUser,
      to: email,
      subject,
      text: createOtpText(otp),
      html: createOtpHtml(otp),
    })

    console.info(`[OTP MAIL SENT] ${email}: ${info.messageId}`)
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not send OTP email.'
    return {
      ok: false,
      message: `Could not send OTP email. Check MAIL_USER and MAIL_PASS. Gmail says: ${message}`,
    }
  }
}

function isSmtpConfigured(): boolean {
  return Boolean(env.mailUser && env.mailPass)
}

function accountExistsResult(): AuthResult {
  return {
    ok: false,
    accountExists: true,
    message: 'There is already an account with these credentials. Please login instead.',
  }
}

function createOtpText(otp: string): string {
  return [
    'Anandhaas Predict',
    '',
    `Your OTP is ${otp}.`,
    'It expires in 10 minutes.',
    '',
    'If you did not request this code, you can ignore this email.',
  ].join('\n')
}

function createOtpHtml(otp: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Anandhaas Predict OTP</title>
  </head>
  <body style="margin:0;background:#f3f6f2;padding:0;font-family:Inter,Arial,sans-serif;color:#0b1f1a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6f2;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;overflow:hidden;border-radius:24px;background:#ffffff;border:1px solid #e6ece7;box-shadow:0 18px 44px rgba(8,26,22,0.12);">
            <tr>
              <td style="background:#0b1f1a;background-image:linear-gradient(150deg,#0a1a32 0%,#07201a 100%);padding:32px 28px 26px;">
                <div style="display:inline-block;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.08);border-radius:999px;padding:7px 11px;color:#93c5fd;font-size:12px;font-weight:700;letter-spacing:0.02em;">
                  FIFA World Cup 2026
                </div>
                <h1 style="margin:18px 0 0;font-size:30px;line-height:1.05;color:#f3f6f2;font-weight:900;">
                  Anandhaas Predict
                </h1>
                <p style="margin:10px 0 0;color:#8fb6ad;font-size:14px;line-height:1.55;">
                  Use this one-time code to continue securely.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 28px 12px;text-align:center;">
                <p style="margin:0;color:#44605a;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;">
                  Your OTP
                </p>
                <div style="margin:14px auto 0;display:inline-block;border-radius:18px;background:#eaf1fe;border:1px solid #c2d6fb;padding:16px 22px;">
                  <span style="font-size:38px;line-height:1;letter-spacing:8px;color:#2563eb;font-weight:900;font-family:Arial,sans-serif;">
                    ${otp}
                  </span>
                </div>
                <p style="margin:18px 0 0;color:#44605a;font-size:15px;line-height:1.6;">
                  This code expires in <strong style="color:#0b1f1a;">10 minutes</strong>.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 30px;">
                <div style="border-radius:16px;background:#f3f6f2;border:1px solid #e6ece7;padding:14px 16px;color:#76918a;font-size:13px;line-height:1.55;">
                  If you did not request this code, you can safely ignore this email. Never share this OTP or your MPIN with anyone.
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px 22px;border-top:1px solid #e6ece7;text-align:center;">
                <p style="margin:0;color:#76918a;font-size:12px;">
                  Anandhaas Sweets & Snacks · Predict and win sweet rewards
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function createOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0')
}

function hashMpin(mpin: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = pbkdf2Sync(mpin, salt, 120_000, 32, 'sha256').toString('hex')
  return `pbkdf2_sha256$120000$${salt}$${hash}`
}

function verifyMpin(mpin: string, stored: string): boolean {
  const [algorithm, iterationsText, salt, expectedHash] = stored.split('$')
  if (algorithm !== 'pbkdf2_sha256' || !iterationsText || !salt || !expectedHash) return false

  const iterations = Number(iterationsText)
  if (!Number.isFinite(iterations)) return false

  const actual = pbkdf2Sync(mpin, salt, iterations, 32, 'sha256')
  const expected = Buffer.from(expectedHash, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

function toAuthUser(profile: AuthProfile): AuthUser {
  return {
    id: profile.id,
    phone: profile.phone,
    email: profile.email,
    name: profile.name,
    age: profile.age ?? 0,
    points: profile.points_balance,
    predictionsCount: profile.predictions_count,
    correctCount: profile.correct_predictions_count,
    createdAt: profile.registered_at,
  }
}

function otpKey(purpose: Purpose, email: string) {
  return `${purpose}:${email}`
}

function isSixDigit(value: string): boolean {
  return /^\d{6}$/.test(value)
}

function normalizeEmail(value: string): string {
  const clean = value.trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean) ? clean : ''
}

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  const mobile = digits.startsWith('91') && digits.length === 12 ? digits.slice(2) : digits.slice(-10)
  return /^[6-9]\d{9}$/.test(mobile) ? mobile : ''
}
