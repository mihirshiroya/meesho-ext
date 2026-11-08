import { alertTypes, autoStopRules } from '@/lib/guide-content'
import { cn } from '@/lib/utils'
import { SectionHeading, toneDot } from './primitives'

const chat = [
  { time: '09:47', text: 'Shop B | "Ad_I 25 Oct | 09:12" spent ₹240 of ₹300 (80%), 0 orders. Rule: Budget % used, Spend with 0 orders.' },
  { time: '10:42', text: 'Shop A | Kurtis_Festive spent ₹312 of ₹300. ROI 1.4, expected 2.0. Campaign stopped.' },
  { time: '14:18', text: 'Shop C | Daily limit crossed: today’s campaigns spent ₹2,050 of ₹2,000.' },
  { time: '21:00', text: 'Shop A | Heartbeat. Monitoring is on. Today: ₹1,840 across 6 live campaigns.' },
]

function TelegramChat() {
  return (
    <div
      role="img"
      aria-label="A Telegram chat with four alerts from three shops: budget used, campaign stopped, daily limit crossed and a heartbeat."
      className="overflow-hidden rounded-2xl border border-ink-foreground/15 bg-[#0b3a41]"
    >
      <div className="flex items-center gap-3 border-b border-ink-foreground/10 px-5 py-3.5">
        <img src="/extension-icon.png" alt="" width={32} height={32} className="rounded-full" />
        <div>
          <p className="text-sm font-medium text-ink-foreground">Ads Monitor bot</p>
          <p className="font-mono text-[11px] text-ink-foreground/55">bot · 3 shops</p>
        </div>
      </div>
      <ul className="flex flex-col gap-3 p-5">
        {chat.map((m) => (
          <li key={m.time} className="max-w-[92%] rounded-2xl rounded-tl-sm bg-ink-foreground/[0.08] px-4 py-3">
            <p className="text-[14px] leading-snug text-ink-foreground">{m.text}</p>
            <p className="mt-1 text-right font-mono text-[10.5px] text-ink-foreground/50">{m.time}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Alerts() {
  return (
    <section id="alerts" aria-labelledby="alerts-title" className="scroll-mt-16 bg-ink">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-5 py-24 md:px-8 md:py-32">
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col gap-10 lg:col-span-5">
            <SectionHeading
              id="alerts-title"
              inverted
              eyebrow="Alerts"
              title="Eight alerts, each sent once."
              intro="An alert repeats only if spend rises by another ₹50. Alert memory resets at midnight IST."
            />
            <ul className="flex flex-col divide-y divide-ink-foreground/10 border-y border-ink-foreground/10">
              {alertTypes.map((a) => (
                <li key={a.name} className="flex items-start gap-3 py-3">
                  <span className={cn('mt-2 size-2 shrink-0 rounded-full', toneDot[a.tone])} aria-hidden="true" />
                  <div className="flex flex-col">
                    <span className="font-medium text-ink-foreground">{a.name}</span>
                    <span className="text-sm leading-relaxed text-ink-foreground/65">{a.when}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-6 lg:col-start-7 lg:sticky lg:top-24">
            <TelegramChat />
          </div>
        </div>

        <div className="flex flex-col gap-6 rounded-2xl border border-ink-foreground/15 p-6 md:p-8">
          <div className="flex flex-col gap-2">
            <h3 className="text-2xl font-medium tracking-tight text-ink-foreground">The Auto-stop rule</h3>
            <p className="max-w-2xl leading-relaxed text-ink-foreground/70">
              Off by default. When on, each campaign is judged on its own. Good-ROI campaigns keep running; at most 5 stops per check.
            </p>
          </div>
          <dl className="grid gap-3 md:grid-cols-4">
            {autoStopRules.map((r) => (
              <div key={r.situation} className="flex flex-col gap-3 rounded-xl bg-ink-foreground/[0.06] p-4">
                <dt className="text-sm leading-relaxed text-ink-foreground/75">{r.situation}</dt>
                <dd className="mt-auto flex items-center gap-2 font-medium text-ink-foreground">
                  <span className={cn('size-2 rounded-full', toneDot[r.tone])} aria-hidden="true" />
                  {r.action}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
