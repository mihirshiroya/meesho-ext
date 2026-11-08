import { nav } from '@/lib/site'
import { DownloadButton } from './primitives'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 md:px-8">
        <a href="#top" className="flex items-center gap-2.5 text-[15px] font-medium tracking-tight text-foreground">
          <img src="/extension-icon.png" alt="" width={28} height={28} className="rounded-md" />
          <span>Ads Spend Monitor</span>
        </a>
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1 text-sm">
            {nav.map((n) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  className="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <DownloadButton label="Download" className="h-9 px-3.5 text-sm" />
      </div>
    </header>
  )
}
