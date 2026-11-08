import { alertTypes, badges, keepRunning } from '@/lib/guide-content'
import { cn } from '@/lib/utils'

const toneClass = {
  ok: 'bg-emerald-100 text-emerald-800',
  warn: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
}

export function DailyUse() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        {keepRunning.map((item) => (
          <div key={item.title} className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground">{item.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="font-semibold text-foreground">Reading the toolbar icon</h3>
        <ul className="mt-3 flex flex-col gap-2">
          {badges.map((b) => (
            <li key={b.badge} className="flex items-center gap-3 text-sm">
              <span className={cn('min-w-20 rounded-full px-2.5 py-0.5 text-center text-xs font-bold', toneClass[b.tone])}>
                {b.badge}
              </span>
              <span className="text-foreground">{b.meaning}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="p-5 pb-3">
          <h3 className="font-semibold text-foreground">What each alert means</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Each alert is sent once. It repeats only if spend rises by another ₹50 (configurable). Alert memory resets at midnight IST.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-y border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-2.5 font-semibold">Alert</th>
                <th scope="col" className="px-5 py-2.5 font-semibold">Fires when</th>
                <th scope="col" className="px-5 py-2.5 font-semibold">What to do</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {alertTypes.map((a) => (
                <tr key={a.name}>
                  <td className="whitespace-nowrap px-5 py-3 font-medium text-foreground">
                    <span aria-hidden="true">{a.icon} </span>
                    {a.name}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{a.when}</td>
                  <td className="px-5 py-3 text-foreground">{a.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <figure className="rounded-xl border border-border bg-card p-5">
        <figcaption className="text-sm font-semibold text-foreground">Example Telegram alert</figcaption>
        <p className="mt-3 rounded-lg bg-muted px-4 py-3 font-mono text-sm leading-relaxed text-foreground">
          {'⚠️ Shop B | "Ad_I 25 Oct 2026 | 09:12" spent ₹240 of ₹300 (80%), 0 orders. Rule: Budget % used, Spend with 0 orders. Today total: ₹410.'}
        </p>
      </figure>
    </div>
  )
}
