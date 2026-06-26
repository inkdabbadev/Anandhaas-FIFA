import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-brand px-8 text-center">
      <p className="font-serif text-6xl font-black text-gold-light">404</p>
      <h1 className="mt-2 font-serif text-2xl font-bold text-bg">Page not found</h1>
      <p className="mt-2 max-w-xs text-sm text-muted">
        This page has gone off the pitch. Let’s get you back to the action.
      </p>
      <Link
        href="/home"
        className="mt-6 flex h-12 items-center justify-center rounded-xl bg-gold px-6 font-bold text-dark"
      >
        Back to home
      </Link>
    </div>
  )
}
