import { TriangleAlert } from 'lucide-react'
import { installSteps, setupSteps } from '@/lib/guide-content'
import { DownloadButton, SectionHeading } from './primitives'

const steps = [...installSteps, ...setupSteps]

export function Setup() {
  return (
    <section id="setup" aria-labelledby="setup-title" className="scroll-mt-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-5 py-24 md:px-8 md:py-32">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <SectionHeading
            id="setup-title"
            eyebrow="Setup"
            title="Seven steps, about five minutes a shop."
            intro="The same guide opens inside the extension after install and ticks off each step as you finish it."
          />
          <DownloadButton className="self-start md:self-auto" />
        </div>

        <ol className="grid gap-4 md:grid-cols-2">
          {steps.map((s, i) => (
            <li
              key={s.id}
              id={`step-${s.id}`}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 transition-transform duration-200 hover:-translate-y-0.5 md:p-7"
            >
              <div className="flex items-baseline gap-4">
                <span className="font-mono text-sm text-primary" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-medium tracking-tight text-foreground">
                    <span className="sr-only">Step {i + 1}: </span>
                    {s.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{s.summary}</p>
                </div>
              </div>
              <ul className="flex flex-col gap-2 pl-9 text-[15px] leading-relaxed text-foreground">
                {s.items.map((item) => (
                  <li key={item} className="relative before:absolute before:-left-4 before:top-[0.7em] before:size-1 before:rounded-full before:bg-foreground/30">
                    {item}
                  </li>
                ))}
              </ul>
              {s.warning && (
                <p className="ml-9 flex gap-2 rounded-lg bg-destructive/[0.07] px-3 py-2.5 text-sm leading-relaxed text-foreground">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                  <span>{s.warning}</span>
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
