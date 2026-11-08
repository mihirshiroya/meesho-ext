import { TriangleAlert } from 'lucide-react'
import type { GuideStep } from '@/lib/guide-content'

export function StepCard({ step, number }: { step: GuideStep; number: number }) {
  return (
    <li id={step.id} className="scroll-mt-24 rounded-xl border border-border bg-card p-5 md:p-6">
      <div className="flex gap-4">
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
        >
          {number}
        </span>
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-semibold text-foreground">
              <span className="sr-only">Step {number}: </span>
              {step.title}
            </h3>
            <p className="text-sm text-muted-foreground">{step.summary}</p>
          </div>
          <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-relaxed text-foreground marker:text-muted-foreground">
            {step.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          {step.warning && (
            <p className="flex gap-2 rounded-lg border-l-4 border-destructive bg-destructive/10 px-3 py-2 text-sm text-foreground">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
              <span>{step.warning}</span>
            </p>
          )}
        </div>
      </div>
    </li>
  )
}
