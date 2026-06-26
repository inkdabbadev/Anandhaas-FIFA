import { cn } from '@/lib/utils'

interface PageHeroProps {
  eyebrow?: string
  title: React.ReactNode
  subtitle?: string
  titleClassName?: string
}

/** Shared brand header used across secondary screens. */
export function PageHero({ eyebrow, title, subtitle, titleClassName }: PageHeroProps) {
  return (
    <section className="bg-brand px-5 pb-7 pt-6">
      {eyebrow && <p className="mb-3 text-[13px] font-medium text-white/70">{eyebrow}</p>}
      <h1 className={cn('font-serif text-[27px] font-extrabold leading-[1.08] text-bg', titleClassName)}>
        {title}
      </h1>
      {subtitle && <p className="mt-2 text-[13px] leading-relaxed text-[var(--on-dark-dim)]">{subtitle}</p>}
    </section>
  )
}
