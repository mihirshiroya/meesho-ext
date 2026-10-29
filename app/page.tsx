import { BellRing, Eye, ShieldCheck } from 'lucide-react'
import { StepCard } from '@/components/guide/step-card'
import { DailyUse } from '@/components/guide/daily-use'
import { Troubleshooting } from '@/components/guide/troubleshooting'
import { installSteps, setupSteps } from '@/lib/guide-content'

const nav = [
  { href: '#install', label: 'Install' },
  { href: '#setup', label: 'Setup' },
  { href: '#daily', label: 'Daily use' },
  { href: '#help', label: 'Troubleshooting' },
]

const promises = [
  { icon: Eye, title: 'Read-only', body: 'Only reads the campaign list. It never pauses, edits or creates campaigns.' },
  { icon: ShieldCheck, title: 'No passwords', body: 'Reuses your logged-in Meesho tab. It stops completely if Meesho logs you out or blocks a request.' },
  { icon: BellRing, title: 'Desktop + Telegram', body: 'Get alerts on your phone, prefixed with the shop name, for every Meesho account.' },
]

function Section({ id, title, intro, children }: { id: string; title: string; intro: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-20 flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h2 id={`${id}-title`} className="text-2xl font-semibold tracking-tight text-foreground text-balance">
          {title}
        </h2>
        <p className="max-w-2xl leading-relaxed text-muted-foreground">{intro}</p>
      </div>
      {children}
    </section>
  )
}

export default function Page() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-3">
          <a href="#" className="flex items-center gap-2.5 font-semibold text-foreground">
            <img src="/extension-icon.png" alt="" width={28} height={28} className="rounded-md" />
            <span className="hidden sm:inline">Meesho Ads Spend Monitor</span>
          </a>
          <nav aria-label="Guide sections">
            <ul className="flex gap-1 text-sm">
              {nav.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="rounded-md px-2.5 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-16 px-5 py-12 md:py-16">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Setup &amp; user guide</p>
            <h1 className="text-4xl font-bold tracking-tight text-foreground text-balance md:text-5xl">
              Stop checking ad spend by hand. Get alerted when campaigns burn money.
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
              This Chrome extension checks your Meesho Supplier Panel every 15–25 minutes and alerts you when a campaign crosses your limits.
              The same guide is built into the extension: it opens automatically after install and ticks off each step as you finish it.
            </p>
          </div>
          <ul className="grid gap-4 md:grid-cols-3">
            {promises.map(({ icon: Icon, title, body }) => (
              <li key={title} className="rounded-xl border border-border bg-card p-5">
                <Icon className="size-5 text-primary" aria-hidden="true" />
                <h2 className="mt-3 font-semibold text-foreground">{title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </li>
            ))}
          </ul>
        </div>

        <Section id="install" title="1. Install" intro="Use Load unpacked. No Chrome Web Store, no build step, no dependencies.">
          <ol className="flex flex-col gap-4">
            {installSteps.map((s, i) => (
              <StepCard key={s.id} step={s} number={i + 1} />
            ))}
          </ol>
        </Section>

        <Section
          id="setup"
          title="2. Set up each profile"
          intro="The in-extension guide walks you through these steps with live checkmarks. It takes about 5 minutes per shop."
        >
          <ol className="flex flex-col gap-4">
            {setupSteps.map((s, i) => (
              <StepCard key={s.id} step={s} number={i + 1} />
            ))}
          </ol>
        </Section>

        <Section id="daily" title="3. Using it every day" intro="Once it's set up, you mostly just read alerts. Here's what keeps it running and what each message means.">
          <DailyUse />
        </Section>

        <Section id="help" title="4. Troubleshooting" intro="The most common issues and how to fix them. The same answers are in the extension's guide.">
          <Troubleshooting />
        </Section>
      </main>

      <footer className="border-t border-border">
        <p className="mx-auto max-w-4xl px-5 py-6 text-sm text-muted-foreground">
          Never share request headers or cookies (connect.sid, s_id, _abck). If you did, log out of Meesho and back in.
        </p>
      </footer>
    </div>
  )
}
