import { ArrowDownToLine } from 'lucide-react'
import { DOWNLOAD_URL } from '@/lib/site'
import { cn } from '@/lib/utils'

export function DownloadButton({ className, label = 'Download extension', inverted = false }: { className?: string; label?: string; inverted?: boolean }) {
  return (
    <a
      href={DOWNLOAD_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-[15px] font-medium transition-[transform,background-color] duration-200 hover:-translate-y-px active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2',
        inverted
          ? 'bg-ink-foreground text-ink hover:bg-white focus-visible:outline-ink-foreground'
          : 'bg-primary text-primary-foreground hover:bg-ink focus-visible:outline-primary',
        className,
      )}
    >
      <ArrowDownToLine className="size-4" aria-hidden="true" />
      {label}
      <span className="sr-only">(opens Google Drive in a new tab)</span>
    </a>
  )
}

export function SectionHeading({ id, eyebrow, title, intro, inverted = false }: { id: string; eyebrow: string; title: string; intro?: string; inverted?: boolean }) {
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <p className={cn('font-mono text-xs uppercase tracking-[0.14em]', inverted ? 'text-ink-foreground/70' : 'text-primary')}>{eyebrow}</p>
      <h2 id={id} className={cn('text-4xl font-medium leading-[1.05] tracking-[-0.035em] text-balance md:text-5xl', inverted ? 'text-ink-foreground' : 'text-foreground')}>
        {title}
      </h2>
      {intro && <p className={cn('text-lg leading-relaxed text-pretty', inverted ? 'text-ink-foreground/75' : 'text-muted-foreground')}>{intro}</p>}
    </div>
  )
}

export const toneDot = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-destructive',
}
