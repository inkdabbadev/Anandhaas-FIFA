export const metadata = { title: 'Offline' }

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-brand px-8 text-center">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold font-serif text-3xl font-black text-white">
        A
      </span>
      <h1 className="font-serif text-2xl font-bold text-bg">You’re offline</h1>
      <p className="mt-2 max-w-xs text-sm text-muted">
        Anandhaas Predict needs a connection for live matches and predictions. We’ll reconnect
        automatically when you’re back online.
      </p>
    </div>
  )
}
