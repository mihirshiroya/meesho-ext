import { ChevronDown } from 'lucide-react'
import { faqs } from '@/lib/guide-content'

export function Troubleshooting() {
  return (
    <div className="flex flex-col gap-2">
      {faqs.map((f) => (
        <details key={f.q} className="group rounded-xl border border-border bg-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium text-foreground focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
            {f.q}
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <p className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
        </details>
      ))}
    </div>
  )
}
