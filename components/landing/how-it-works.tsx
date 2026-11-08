import { BellRing, Eye, MonitorSmartphone, Send, ShieldCheck, Square } from 'lucide-react'
import { SectionHeading } from './primitives'

const lanes = [
  { icon: MonitorSmartphone, label: 'Desktop pop-up' },
  { icon: Send, label: 'Telegram message' },
  { icon: Square, label: 'Auto-stop (optional)' },
]

const promises = [
  { icon: Eye, title: 'You stay in control', body: 'It reads the campaign list. It pauses a campaign only if you turn on Auto-stop, and never edits or creates one.' },
  { icon: ShieldCheck, title: 'No passwords', body: 'It reuses your logged-in Meesho tab and stops completely if Meesho logs you out or blocks a request.' },
  { icon: BellRing, title: 'Every shop, one chat', body: 'Run it in each Chrome profile. Every alert starts with the shop name, so one Telegram chat covers them all.' },
]

function Node({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return (
    <div
      className={
        strong
          ? 'relative z-10 shrink-0 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground'
          : 'relative z-10 shrink-0 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground'
      }
    >
      {children}
    </div>
  )
}

function Wire({ delay = 0 }: { delay?: number }) {
  return (
    <div className="relative h-px min-w-6 flex-1 bg-border" aria-hidden="true">
      <span className="pulse-dot absolute -top-[3px] size-[7px] -translate-x-1/2 rounded-full bg-primary" style={{ animationDelay: `${delay}ms` }} />
    </div>
  )
}

function FlowDiagram() {
  return (
    <figure aria-label="How a check runs: the Meesho Ads tab is read, compared to your limits, then sent to desktop, Telegram and Auto-stop." className="rounded-2xl border border-border bg-muted/60 p-6 md:p-10">
      <div className="flex flex-col items-stretch gap-6 md:flex-row md:items-center md:gap-0">
        <Node>
          <span className="block font-mono text-[11px] font-normal text-muted-foreground">Every 15–25 min</span>
          Meesho Ads tab
        </Node>
        <div className="hidden md:flex md:flex-1">
          <Wire />
        </div>
        <Node strong>
          <span className="block font-mono text-[11px] font-normal text-primary-foreground/70">Compared to</span>
          Your ₹ limits &amp; ROI
        </Node>
        <div className="hidden md:block md:w-10">
          <Wire delay={900} />
        </div>
        <ul className="flex flex-col gap-3 md:w-56">
          {lanes.map(({ icon: Icon, label }, i) => (
            <li key={label} className="flex items-center gap-3">
              <div className="hidden w-8 md:block">
                <Wire delay={1400 + i * 250} />
              </div>
              <div className="flex flex-1 items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground">
                <Icon className="size-4 text-primary" aria-hidden="true" />
                {label}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </figure>
  )
}

export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title" className="scroll-mt-16 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-5 py-24 md:px-8 md:py-32">
        <SectionHeading
          id="how-title"
          eyebrow="How it works"
          title="A quiet check in the background, a loud alert when money burns."
          intro="Checks run only during your active hours (08:00–23:00 IST by default) with random timing, so it behaves like a person looking at the page."
        />
        <FlowDiagram />
        <ul className="grid gap-x-8 gap-y-10 md:grid-cols-3">
          {promises.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex flex-col gap-3 border-t border-foreground/15 pt-5">
              <Icon className="size-5 text-primary" aria-hidden="true" />
              <h3 className="text-lg font-medium tracking-tight text-foreground">{title}</h3>
              <p className="leading-relaxed text-muted-foreground">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
