'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@/schemas'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app-store'
import { ArrowLeft, Phone } from 'lucide-react'

type Step = 'phone' | 'otp'

export function LoginFlow() {
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const router = useRouter()

  return (
    <div className="flex min-h-dvh justify-center bg-brand">
      <div className="flex min-h-dvh w-full max-w-[430px] flex-col px-7 pb-10 pt-14">
        {step === 'otp' ? (
          <button
            onClick={() => setStep('phone')}
            className="flex w-fit items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-[var(--on-dark-dim)]"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        ) : (
          <Image
            src="/Logo.png"
            alt="Anandhaas Sweets &amp; Snacks"
            width={839}
            height={191}
            priority
            className="h-auto w-[220px] max-w-full object-contain"
          />
        )}

        <div className="mt-auto pb-2 pt-12">
          {step === 'phone' ? (
            <PhoneStep
              onSent={(p) => {
                setPhone(p)
                setStep('otp')
              }}
            />
          ) : (
            <OtpStep phone={phone} onVerified={() => router.replace('/home')} />
          )}
        </div>
      </div>
    </div>
  )
}

function PhoneStep({ onSent }: { onSent: (phone: string) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })
  const pushToast = useAppStore((s) => s.pushToast)

  async function onSubmit(data: LoginInput) {
    // Phase 1: simulate OTP dispatch. Phase 2: supabase.auth.signInWithOtp({ phone })
    await new Promise((r) => setTimeout(r, 600))
    pushToast('OTP sent — use 123456 for the demo', 'info')
    onSent(data.phone)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="animate-fade-in-up">
      <h1 className="font-serif text-[28px] font-black leading-tight text-bg">
        Enter your
        <br />
        <em className="not-italic text-gold-light">mobile number</em>
      </h1>
      <p className="mt-3 text-sm text-[var(--on-dark-dim)]">We’ll text you a one-time code to sign in.</p>

      <label className="mt-8 block">
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-gold">
          Mobile number
        </span>
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.08] px-4 shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur-sm focus-within:border-gold-border">
          <Phone className="h-4 w-4 text-[var(--on-dark-dim)]" />
          <input
            {...register('phone')}
            inputMode="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            className="w-full bg-transparent py-4 text-base text-bg placeholder:text-[var(--on-dark-dim)] focus:outline-none"
          />
        </div>
        {errors.phone && <span className="mt-1.5 block text-xs text-[#d98080]">{errors.phone.message}</span>}
      </label>

      <Button type="submit" block size="lg" className="mt-8" disabled={isSubmitting}>
        {isSubmitting ? 'Sending…' : 'Send code'}
      </Button>
    </form>
  )
}

function OtpStep({ phone, onVerified }: { phone: string; onVerified: () => void }) {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  const pushToast = useAppStore((s) => s.pushToast)

  function setDigit(i: number, v: string) {
    const clean = v.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[i] = clean
    setDigits(next)
    setError('')
    if (clean && i < 5) inputs.current[i + 1]?.focus()
  }

  function onKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus()
  }

  async function verify() {
    const code = digits.join('')
    if (code.length !== 6) return
    setVerifying(true)
    // Phase 1: accept the demo code. Phase 2: supabase.auth.verifyOtp(...)
    await new Promise((r) => setTimeout(r, 700))
    if (code === '123456') {
      pushToast('Welcome back!', 'success')
      onVerified()
    } else {
      setError('Incorrect code. Try 123456 for the demo.')
      setVerifying(false)
    }
  }

  return (
    <div className="animate-fade-in-up">
      <h1 className="font-serif text-[28px] font-black leading-tight text-bg">
        Verify your
        <br />
        <em className="not-italic text-gold-light">number</em>
      </h1>
      <p className="mt-3 text-sm text-[var(--on-dark-dim)]">
        Code sent to <span className="text-bg">{phone}</span>
      </p>

      <div className="mt-8 grid grid-cols-6 gap-2">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el
            }}
            value={d}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            inputMode="numeric"
            maxLength={1}
            aria-label={`Digit ${i + 1}`}
            className="h-14 min-w-0 rounded-2xl border border-white/10 bg-white/[0.08] text-center font-serif text-2xl font-bold text-bg shadow-[0_12px_30px_rgba(0,0,0,0.12)] backdrop-blur-sm focus:border-gold-border focus:outline-none"
          />
        ))}
      </div>
      {error && <p className="mt-3 text-xs text-[#d98080]">{error}</p>}

      <Button block size="lg" className="mt-8" disabled={verifying || digits.join('').length !== 6} onClick={verify}>
        {verifying ? 'Verifying…' : 'Verify & continue'}
      </Button>
      <button onClick={() => pushToast('New code sent — use 123456', 'info')} className="mt-4 w-full text-center text-xs text-[var(--on-dark-dim)]">
        Didn’t get a code? <span className="font-semibold text-gold-light">Resend</span>
      </button>
    </div>
  )
}
