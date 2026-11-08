import { SiteHeader } from '@/components/landing/site-header'
import { Hero } from '@/components/landing/hero'
import { HowItWorks } from '@/components/landing/how-it-works'
import { Alerts } from '@/components/landing/alerts'
import { Setup } from '@/components/landing/setup'
import { DailyUse } from '@/components/landing/daily-use'
import { Faq } from '@/components/landing/faq'
import { Closing } from '@/components/landing/closing'

export default function Page() {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">
        <Hero />
        <HowItWorks />
        <Alerts />
        <Setup />
        <DailyUse />
        <Faq />
      </main>
      <Closing />
    </>
  )
}
