import { nav, VERSION } from '@/lib/site'
import { DownloadButton } from './primitives'

export function Closing() {
  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 pb-12 pt-24 md:px-8 md:pt-32">
        <h2 className="max-w-4xl text-5xl font-medium leading-[1] tracking-[-0.045em] text-balance md:text-8xl">
          Stop checking ad spend by hand.
        </h2>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
          <DownloadButton inverted />
          <p className="text-sm text-ink-foreground/65">Free · Chrome · v{VERSION} · No build step</p>
        </div>

        <div className="mt-16 flex flex-col gap-6 border-t border-ink-foreground/15 pt-8 md:flex-row md:items-center md:justify-between">
          <a href="#top" className="flex items-center gap-2.5 font-medium">
            <img src="/extension-icon.png" alt="" width={24} height={24} className="rounded" />
            Meesho Ads Spend Monitor
          </a>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-foreground/70">
              {nav.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="transition-colors hover:text-ink-foreground">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <p className="max-w-3xl text-sm leading-relaxed text-ink-foreground/55">
          Never share request headers or cookies (connect.sid, s_id, _abck). If you did, log out of Meesho and back in. Not affiliated with Meesho.
        </p>
      </div>
    </footer>
  )
}
