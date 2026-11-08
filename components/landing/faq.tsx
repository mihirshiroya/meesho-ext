import { Plus } from 'lucide-react'
import { faqs } from '@/lib/guide-content'
import { SectionHeading } from './primitives'

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-16">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 md:px-8 md:py-32 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <SectionHeading id="faq-title" eyebrow="Troubleshooting" title="Common questions." intro="The same answers are in the extension's guide." />
        </div>
        <div className="flex flex-col border-b border-border lg:col-span-7 lg:col-start-6">
          {faqs.map((f) => (
            <details key={f.q} className="group border-t border-border">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-lg font-medium tracking-tight text-foreground focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
                {f.q}
                <Plus className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45" aria-hidden="true" />
              </summary>
              <p className="max-w-[60ch] pb-6 leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
