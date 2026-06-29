import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SectionHeaderProps {
  title: React.ReactNode
  linkLabel?: string
  linkHref?: string
  onLinkClick?: () => void
  className?: string
}

export function SectionHeader({ title, linkLabel, linkHref, onLinkClick, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between px-4 pb-2.5 pt-5', className)}>
      <h2 className="flex items-center gap-2 text-[15px] font-semibold text-dark">{title}</h2>
      {linkLabel &&
        (linkHref ? (
          <Link href={linkHref} className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-gold">
            {linkLabel}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <button onClick={onLinkClick} className="inline-flex items-center gap-0.5 text-[13px] font-semibold text-gold">
            {linkLabel}
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        ))}
    </div>
  )
}
