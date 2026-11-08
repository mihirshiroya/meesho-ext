import { badges, keepRunning } from '@/lib/guide-content'
import { cn } from '@/lib/utils'
import { SectionHeading } from './primitives'

const badgeTone = {
  ok: 'bg-card text-muted-foreground border border-border',
  warn: 'bg-warn text-white',
  danger: 'bg-destructive text-white',
}

export function DailyUse() {
  return (
    <section aria-labelledby="daily-title" className="border-y border-border bg-muted/60">
      <div className="mx-auto grid max-w-6xl gap-14 px-5 py-24 md:px-8 md:py-32 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col gap-10 lg:col-span-5">
          <SectionHeading
            id="daily-title"
            eyebrow="Every day"
            title="Three things keep it running."
            intro="After setup you mostly just read alerts. A heartbeat at 21:00 IST tells you it is alive."
          />
        </div>
        <div className="flex flex-col gap-10 lg:col-span-6 lg:col-start-7">
          <ol className="flex flex-col">
            {keepRunning.map((k, i) => (
              <li key={k.title} className="flex gap-5 border-t border-foreground/15 py-5">
                <span className="font-mono text-sm text-primary" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-medium tracking-tight text-foreground">{k.title}</h3>
                  <p className="leading-relaxed text-muted-foreground">{k.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
            <h3 className="font-medium text-foreground">Reading the toolbar icon</h3>
            <ul className="flex flex-col gap-3">
              {badges.map((b) => (
                <li key={b.badge} className="flex items-center gap-4 text-[15px]">
                  <span className="relative shrink-0">
                    <img src="/extension-icon.png" alt="" width={28} height={28} className="rounded-md" />
                    {b.tone !== 'ok' && (
                      <span className={cn('absolute -bottom-1.5 -right-2.5 rounded px-1 font-mono text-[10px] font-medium leading-4', badgeTone[b.tone])}>
                        {b.badge}
                      </span>
                    )}
                  </span>
                  <span className="text-foreground">
                    <span className="sr-only">{b.badge}: </span>
                    {b.meaning}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
