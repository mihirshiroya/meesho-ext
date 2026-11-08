import { VERSION } from '@/lib/site'
import { DownloadButton } from './primitives'
import { ProductWindow } from './product-window'

export function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title" className="mx-auto max-w-6xl px-5 pb-20 pt-12 md:px-8 md:pb-28 md:pt-16">
      <div className="grid items-start gap-14 lg:grid-cols-12 lg:gap-8">
        <div className="enter flex min-w-0 flex-col lg:col-span-5 lg:pt-6">
          <p className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <span className="rounded-full border border-border bg-card px-2 py-0.5 text-foreground">v{VERSION}</span>
            Free Chrome extension
          </p>
          <h1 id="hero-title" className="mt-5 text-5xl font-medium leading-[1.02] tracking-[-0.045em] text-foreground text-balance md:text-7xl">
            Ad spend alerts for every Meesho shop.
          </h1>
          <p className="mt-6 max-w-[42ch] text-lg leading-relaxed text-muted-foreground md:text-xl">
            It checks your Supplier Panel every 15–25 minutes and messages you on desktop and Telegram the moment a campaign crosses your limit.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <DownloadButton />
            <a
              href="#setup"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-5 text-[15px] font-medium text-foreground transition-[transform,background-color] duration-200 hover:-translate-y-px hover:bg-muted active:translate-y-px"
            >
              See the 5-minute setup
            </a>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">No password. No Web Store. Load it unpacked in Chrome.</p>
        </div>

        <div className="enter min-w-0 lg:col-span-7" style={{ animationDelay: '150ms' }}>
          <ProductWindow />
        </div>
      </div>
    </section>
  )
}
