import { Puzzle } from 'lucide-react'

const campaigns = [
  { name: 'Kurtis_Festive 08 Nov | 09:12', spent: 312, limit: 300, roi: '1.4', over: true },
  { name: 'Sarees_Silk 07 Nov | 18:40', spent: 184, limit: 300, roi: '3.2', over: false },
  { name: 'Bedsheets_Cotton 08 Nov | 07:55', spent: 96, limit: 300, roi: '2.6', over: false },
]

function AdsRowsBackdrop() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3 p-5">
      <div className="h-3 w-32 rounded bg-foreground/10" />
      <div className="h-2.5 w-52 rounded bg-foreground/[0.06]" />
      <div className="mt-4 flex flex-col divide-y divide-border rounded-lg border border-border bg-card/60">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <div className="size-7 rounded bg-foreground/[0.07]" />
            <div className="h-2.5 flex-1 rounded bg-foreground/[0.07]" style={{ maxWidth: `${40 + ((i * 17) % 35)}%` }} />
            <div className="h-2.5 w-10 rounded bg-foreground/[0.07]" />
          </div>
        ))}
      </div>
    </div>
  )
}

function Popup() {
  return (
    <div className="w-[300px] max-w-[calc(100%-1.5rem)] rounded-xl border border-border bg-card p-3.5 text-[13px] shadow-[0_24px_60px_-20px_rgba(7,47,53,0.35)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="font-medium text-foreground">Shop A</span>
          <span className="font-mono text-[11px] text-muted-foreground">Account 48213</span>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-ok/10 px-2 py-0.5 text-[11px] font-medium text-ok">
          <span className="breathe size-1.5 rounded-full bg-ok" />
          Monitoring
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-border bg-background p-2.5">
          <span className="text-[11px] text-muted-foreground">Live campaigns</span>
          <b className="block font-mono text-lg font-medium text-foreground">6</b>
        </div>
        <div className="rounded-lg border border-border bg-background p-2.5">
          <span className="text-[11px] text-muted-foreground">{"Today's spend"}</span>
          <b className="block font-mono text-lg font-medium text-foreground">₹1,840</b>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        <div className="flex justify-between text-[11.5px]">
          <span className="text-muted-foreground">Next check</span>
          <span className="font-mono text-foreground">11:01 IST</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div className="fill-loop h-full w-full rounded-full bg-primary" />
        </div>
      </div>

      <ul className="mt-3 flex flex-col gap-1.5">
        {campaigns.map((c) => (
          <li
            key={c.name}
            className={
              c.over
                ? 'rounded-lg border border-destructive/30 bg-destructive/[0.06] px-2.5 py-2'
                : 'rounded-lg border border-border bg-background px-2.5 py-2'
            }
          >
            <p className="truncate font-medium text-foreground">{c.name}</p>
            <p className="mt-0.5 flex justify-between font-mono text-[11px]">
              <span className={c.over ? 'text-destructive' : 'text-muted-foreground'}>
                ₹{c.spent} / ₹{c.limit}
              </span>
              <span className="text-muted-foreground">ROI {c.roi}</span>
            </p>
          </li>
        ))}
      </ul>

      <button
        type="button"
        tabIndex={-1}
        className="mt-3 h-8 w-full rounded-md bg-primary text-[12.5px] font-medium text-primary-foreground"
      >
        Check now
      </button>
    </div>
  )
}

export function ProductWindow() {
  return (
    <div className="relative">
      <div
        role="img"
        aria-label="The extension popup open on the Meesho Supplier Panel Ads page, showing 6 live campaigns, ₹1,840 spent today and one campaign over its ₹300 limit."
        className="overflow-hidden rounded-2xl border border-border bg-muted"
      >
        <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-2.5">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
          </div>
          <div className="min-w-0 flex-1 truncate rounded-md bg-muted px-3 py-1 font-mono text-[11px] text-muted-foreground">
            supplier.meesho.com/panel/v3/new/ads/48213/advertisement
          </div>
          <div className="flex items-center gap-2" aria-hidden="true">
            <Puzzle className="size-4 text-muted-foreground" />
            <span className="relative">
              <img src="/extension-icon.png" alt="" width={20} height={20} className="rounded ring-2 ring-primary/30" />
            </span>
          </div>
        </div>
        <div className="relative min-h-[460px] md:min-h-[560px]">
          <AdsRowsBackdrop />
          <div className="absolute inset-0 bg-gradient-to-l from-muted/90 via-muted/40 to-transparent" />
          <div className="absolute right-3 top-3 md:right-5">
            <Popup />
          </div>
        </div>
      </div>

      <div className="absolute -bottom-6 left-3 w-[280px] rounded-xl border border-border bg-card p-3.5 md:-left-8 md:bottom-10">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="flex size-5 items-center justify-center rounded-full bg-[#2aa1da] font-mono text-[10px] font-medium text-white" aria-hidden="true">
            T
          </span>
          <span className="font-medium text-foreground">Ads Monitor bot</span>
          <span className="ml-auto font-mono">10:42</span>
        </div>
        <p className="mt-2 text-[13px] leading-snug text-foreground">
          <b className="font-medium">Shop A</b> | Kurtis_Festive spent <b className="font-medium text-destructive">₹312 of ₹300</b>. ROI 1.4, expected 2.0. Auto-stop paused it.
        </p>
      </div>
    </div>
  )
}
