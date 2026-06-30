'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowLeft, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app-store'
import {
  loginWithMpin,
  registerUser,
  resetMpin,
  sendForgotMpinOtp,
  sendSignupOtp,
  verifySignupOtp,
  type AuthUser,
} from './actions'

type Step =
  | 'choice'
  | 'signup-contact'
  | 'signup-otp'
  | 'signup-profile'
  | 'signup-mpin'
  | 'login-id'
  | 'login-mpin'
  | 'forgot-otp'
  | 'reset-mpin'

export function LoginFlow() {
  const router = useRouter()
  const setAuthenticatedUser = useAppStore((s) => s.setAuthenticatedUser)
  const pushToast = useAppStore((s) => s.pushToast)
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<Step>('choice')
  const [error, setError] = useState('')
  const [signupAccountExists, setSignupAccountExists] = useState(false)
  const [devOtp, setDevOtp] = useState('')
  const [resetOtp, setResetOtp] = useState('')
  const [loginAccountMissing, setLoginAccountMissing] = useState(false)

  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [mpin, setMpin] = useState('')
  const [confirmMpin, setConfirmMpin] = useState('')
  const [wrongMpinCount, setWrongMpinCount] = useState(0)

  function go(nextStep: Step) {
    setError('')
    setSignupAccountExists(false)
    setLoginAccountMissing(false)
    setStep(nextStep)
  }

  function finish(user: AuthUser, message: string) {
    setAuthenticatedUser({
      id: user.id,
      phone: user.phone,
      email: user.email,
      name: user.name,
      age: user.age,
      points: user.points,
      predictionsCount: user.predictionsCount,
      correctCount: user.correctCount,
      createdAt: user.createdAt,
    })
    pushToast(message, 'success')
    router.replace('/home')
  }

  function submitSignupContact() {
    setError('')
    setSignupAccountExists(false)
    startTransition(async () => {
      const result = await sendSignupOtp(phone, email)
      if (!result.ok) {
        setError(result.message)
        setSignupAccountExists(Boolean(result.accountExists))
        return
      }
      setEmail(result.email ?? email)
      setDevOtp(result.devOtp ?? '')
      go('signup-otp')
    })
  }

  function submitSignupOtp(otp: string) {
    setError('')
    startTransition(async () => {
      const result = await verifySignupOtp(email, otp)
      if (!result.ok) {
        setError(result.message)
        return
      }
      go('signup-profile')
    })
  }

  function submitRegistration() {
    setError('')
    startTransition(async () => {
      const result = await registerUser({ phone, email, name, age, mpin, confirmMpin })
      if (!result.ok || !result.user) {
        setError(result.message)
        return
      }
      finish(result.user, 'Account created')
    })
  }

  function submitLoginMpin() {
    setError('')
    setLoginAccountMissing(false)
    startTransition(async () => {
      const result = await loginWithMpin(identifier, mpin)
      if (!result.ok || !result.user) {
        const accountMissing = result.message.toLowerCase().includes('no account found')
        setLoginAccountMissing(accountMissing)
        setWrongMpinCount((count) => (accountMissing ? count : count + 1))
        setError(result.message)
        return
      }
      setWrongMpinCount(0)
      finish(result.user, 'Welcome back')
    })
  }

  function submitForgotOtpRequest() {
    setError('')
    startTransition(async () => {
      const result = await sendForgotMpinOtp(identifier)
      if (!result.ok) {
        setError(result.message)
        return
      }
      setEmail(result.email ?? '')
      setDevOtp(result.devOtp ?? '')
      go('forgot-otp')
    })
  }

  function submitResetMpin(otp: string) {
    setError('')
    startTransition(async () => {
      const result = await resetMpin({ email, otp, mpin, confirmMpin })
      if (!result.ok || !result.user) {
        setError(result.message)
        return
      }
      finish(result.user, 'MPIN reset')
    })
  }

  return (
    <div className="flex min-h-svh justify-center overflow-y-auto bg-brand">
      <div className="flex min-h-svh w-full max-w-[430px] flex-col px-5 pb-10 pt-10 sm:px-7 sm:pt-14">
        <Header
          showBack={step !== 'choice'}
          onBack={() => {
            if (step === 'login-mpin') go('login-id')
            else if (step === 'forgot-otp' || step === 'reset-mpin') go('login-mpin')
            else if (step === 'signup-otp') go('signup-contact')
            else if (step === 'signup-profile') go('signup-otp')
            else if (step === 'signup-mpin') go('signup-profile')
            else go('choice')
          }}
        />

        <div className="mt-auto pb-2 pt-12">
          {step === 'choice' && (
            <ChoiceStep onSignup={() => go('signup-contact')} onLogin={() => go('login-id')} />
          )}

          {step === 'signup-contact' && (
            <SignupContactStep
              phone={phone}
              email={email}
              setPhone={setPhone}
              setEmail={setEmail}
              onSubmit={submitSignupContact}
              pending={isPending}
              error={error}
              accountExists={signupAccountExists}
              onLogin={() => {
                setIdentifier(phone || email)
                go('login-id')
              }}
            />
          )}

          {step === 'signup-otp' && (
            <OtpStep
              title="Verify email"
              description={`Code sent to ${email}`}
              devOtp={devOtp}
              pending={isPending}
              error={error}
              onSubmit={submitSignupOtp}
            />
          )}

          {step === 'signup-profile' && (
            <ProfileStep
              name={name}
              age={age}
              setName={setName}
              setAge={setAge}
              onSubmit={() => go('signup-mpin')}
              error={error}
            />
          )}

          {step === 'signup-mpin' && (
            <MpinSetupStep
              title="Set your MPIN"
              mpin={mpin}
              confirmMpin={confirmMpin}
              setMpin={setMpin}
              setConfirmMpin={setConfirmMpin}
              onSubmit={submitRegistration}
              pending={isPending}
              error={error}
            />
          )}

          {step === 'login-id' && (
            <LoginIdentifierStep
              identifier={identifier}
              setIdentifier={setIdentifier}
              onSubmit={() => go('login-mpin')}
            />
          )}

          {step === 'login-mpin' && (
            <MpinLoginStep
              identifier={identifier}
              mpin={mpin}
              setMpin={setMpin}
              onSubmit={submitLoginMpin}
              onForgot={submitForgotOtpRequest}
              showForgot={wrongMpinCount > 0 && !loginAccountMissing}
              showSignup={loginAccountMissing}
              onSignup={() => {
                setPhone(identifier)
                setEmail(identifier.includes('@') ? identifier : '')
                go('signup-contact')
              }}
              pending={isPending}
              error={error}
            />
          )}

          {step === 'forgot-otp' && (
            <OtpStep
              title="Reset MPIN"
              description="If this is a registered account, an OTP has been sent to the registered email id."
              devOtp={devOtp}
              pending={isPending}
              error={error}
              onSubmit={(otp) => {
                setMpin('')
                setConfirmMpin('')
                setResetOtp(otp)
                go('reset-mpin')
              }}
            />
          )}

          {step === 'reset-mpin' && (
            <MpinSetupStep
              title="Create new MPIN"
              mpin={mpin}
              confirmMpin={confirmMpin}
              setMpin={setMpin}
              setConfirmMpin={setConfirmMpin}
              onSubmit={() => submitResetMpin(resetOtp)}
              pending={isPending}
              error={error}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function Header({ showBack, onBack }: { showBack: boolean; onBack: () => void }) {
  if (showBack) {
    return (
      <button
        onClick={onBack}
        className="flex w-fit items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-sm text-[var(--on-dark-dim)]"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
    )
  }

  return (
    <Image
      src="/Logo.png"
      alt="Anandhaas Sweets & Snacks"
      width={839}
      height={191}
      priority
      className="h-9 w-auto object-contain"
    />
  )
}

function ChoiceStep({ onSignup, onLogin }: { onSignup: () => void; onLogin: () => void }) {
  return (
    <div>
      <h1 className="font-serif text-3xl font-extrabold leading-tight text-bg">
        Welcome to
        <br />
        <span className="text-gold-light">Predict</span>
      </h1>
      <p className="mt-3 text-sm text-[var(--on-dark-dim)]">Create an account or log in with your MPIN.</p>
      <div className="mt-8 space-y-3">
        <Button block size="lg" onClick={onSignup}>
          Sign up
        </Button>
        <Button block size="lg" variant="outline" onClick={onLogin}>
          Login
        </Button>
      </div>
    </div>
  )
}

function SignupContactStep({
  phone,
  email,
  setPhone,
  setEmail,
  onSubmit,
  pending,
  error,
  accountExists,
  onLogin,
}: {
  phone: string
  email: string
  setPhone: (value: string) => void
  setEmail: (value: string) => void
  onSubmit: () => void
  pending: boolean
  error: string
  accountExists: boolean
  onLogin: () => void
}) {
  return (
    <StepShell title="Create account" highlight="Verify email" description="Enter your phone and email. We will send a 6-digit OTP to your email.">
      <DarkInput icon={Phone} label="Phone number" value={phone} onChange={setPhone} placeholder="+91 98765 43210" inputMode="tel" />
      <DarkInput icon={Mail} label="Email address" value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
      {error && <p className="mt-3 text-xs text-[#f4a8a8]">{error}</p>}
      <Button block size="lg" className="mt-8" disabled={pending} onClick={onSubmit}>
        {pending ? 'Sending OTP...' : 'Send OTP'}
      </Button>
      {accountExists && (
        <Button block size="lg" variant="outline" onClick={onLogin}>
          Login
        </Button>
      )}
    </StepShell>
  )
}

function LoginIdentifierStep({
  identifier,
  setIdentifier,
  onSubmit,
}: {
  identifier: string
  setIdentifier: (value: string) => void
  onSubmit: () => void
}) {
  return (
    <StepShell title="Login" highlight="Phone or email" description="Use either your registered phone number or email address.">
      <DarkInput icon={UserRound} label="Phone or email" value={identifier} onChange={setIdentifier} placeholder="98765 43210 or you@example.com" />
      <Button block size="lg" className="mt-8" disabled={!identifier.trim()} onClick={onSubmit}>
        Continue
      </Button>
    </StepShell>
  )
}

function ProfileStep({
  name,
  age,
  setName,
  setAge,
  onSubmit,
  error,
}: {
  name: string
  age: string
  setName: (value: string) => void
  setAge: (value: string) => void
  onSubmit: () => void
  error: string
}) {
  return (
    <StepShell title="Your details" highlight="Almost done" description="Tell us who is playing.">
      <DarkInput icon={UserRound} label="Name" value={name} onChange={setName} placeholder="Priya Sundaram" />
      <DarkInput icon={UserRound} label="Age" value={age} onChange={(value) => setAge(value.replace(/\D/g, '').slice(0, 3))} placeholder="27" inputMode="numeric" />
      {error && <p className="mt-3 text-xs text-[#f4a8a8]">{error}</p>}
      <Button block size="lg" className="mt-8" disabled={name.trim().length < 2 || !age} onClick={onSubmit}>
        Continue
      </Button>
    </StepShell>
  )
}

function MpinLoginStep({
  identifier,
  mpin,
  setMpin,
  onSubmit,
  onForgot,
  onSignup,
  showForgot,
  showSignup,
  pending,
  error,
}: {
  identifier: string
  mpin: string
  setMpin: (value: string) => void
  onSubmit: () => void
  onForgot: () => void
  onSignup: () => void
  showForgot: boolean
  showSignup: boolean
  pending: boolean
  error: string
}) {
  return (
    <StepShell title="Enter MPIN" highlight="6 digits" description={identifier}>
      <DarkInput icon={LockKeyhole} label="MPIN" value={mpin} onChange={(value) => setMpin(digits(value))} placeholder="••••••" inputMode="numeric" maxLength={6} type="password" />
      {error && <p className="mt-3 text-xs text-[#f4a8a8]">{error}</p>}
      <Button block size="lg" className="mt-8" disabled={pending || mpin.length !== 6} onClick={onSubmit}>
        {pending ? 'Checking...' : 'Login'}
      </Button>
      {showForgot && (
        <button onClick={onForgot} className="mt-4 w-full text-center text-sm font-semibold text-gold-light">
          Forgot MPIN?
        </button>
      )}
      {showSignup && (
        <Button block size="lg" variant="outline" className="mt-4" onClick={onSignup}>
          Sign up
        </Button>
      )}
    </StepShell>
  )
}

function MpinSetupStep({
  title,
  mpin,
  confirmMpin,
  setMpin,
  setConfirmMpin,
  onSubmit,
  pending,
  error,
}: {
  title: string
  mpin: string
  confirmMpin: string
  setMpin: (value: string) => void
  setConfirmMpin: (value: string) => void
  onSubmit: () => void
  pending: boolean
  error: string
}) {
  return (
    <StepShell title={title} highlight="6 digits" description="Use this MPIN for future logins.">
      <DarkInput icon={LockKeyhole} label="Set MPIN" value={mpin} onChange={(value) => setMpin(digits(value))} placeholder="••••••" inputMode="numeric" maxLength={6} type="password" />
      <DarkInput icon={LockKeyhole} label="Confirm MPIN" value={confirmMpin} onChange={(value) => setConfirmMpin(digits(value))} placeholder="••••••" inputMode="numeric" maxLength={6} type="password" />
      {error && <p className="mt-3 text-xs text-[#f4a8a8]">{error}</p>}
      <Button block size="lg" className="mt-8" disabled={pending || mpin.length !== 6 || confirmMpin.length !== 6} onClick={onSubmit}>
        {pending ? 'Saving...' : 'Continue'}
      </Button>
    </StepShell>
  )
}

function OtpStep({
  title,
  description,
  devOtp,
  pending,
  error,
  onSubmit,
}: {
  title: string
  description: string
  devOtp: string
  pending: boolean
  error: string
  onSubmit: (otp: string) => void
}) {
  const [otp, setOtp] = useState('')

  return (
    <StepShell title={title} highlight="6-digit OTP" description={description}>
      <DarkInput icon={Mail} label="OTP" value={otp} onChange={(value) => setOtp(digits(value))} placeholder="123456" inputMode="numeric" maxLength={6} />
      {devOtp && <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-gold-light">Dev OTP: {devOtp}</p>}
      {error && <p className="mt-3 text-xs text-[#f4a8a8]">{error}</p>}
      <Button block size="lg" className="mt-8" disabled={pending || otp.length !== 6} onClick={() => onSubmit(otp)}>
        {pending ? 'Verifying...' : 'Verify OTP'}
      </Button>
    </StepShell>
  )
}

function StepShell({
  title,
  highlight,
  description,
  children,
}: {
  title: string
  highlight: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h1 className="font-serif text-3xl font-extrabold leading-tight text-bg">
        {title}
        <br />
        <span className="text-gold-light">{highlight}</span>
      </h1>
      <p className="mt-3 text-sm text-[var(--on-dark-dim)]">{description}</p>
      <div className="mt-8 space-y-4">{children}</div>
    </div>
  )
}

function DarkInput({
  icon: Icon,
  label,
  value,
  onChange,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  icon: typeof Phone
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-[var(--on-dark-dim)]">{label}</span>
      <span className="flex items-center gap-2 rounded-xl border border-dark-3 bg-dark-2 px-3.5 focus-within:border-gold-border">
        <Icon className="h-4 w-4 text-[var(--on-dark-dim)]" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="auth-dark-input min-w-0 w-full appearance-none bg-dark-2 py-3.5 text-base text-bg caret-bg placeholder:text-[var(--on-dark-dim)] placeholder:opacity-30 focus:outline-none"
          {...props}
        />
      </span>
    </label>
  )
}

function digits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 6)
}
