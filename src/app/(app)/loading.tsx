import { MatchCardSkeleton } from '@/components/ui/skeleton'

export default function AppLoading() {
  return (
    <div>
      <div className="h-44 bg-brand" />
      <div className="mt-4 flex flex-col gap-2.5 px-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <MatchCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
