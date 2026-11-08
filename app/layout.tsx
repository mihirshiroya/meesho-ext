import type { Metadata, Viewport } from 'next'
import { Familjen_Grotesk, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const sans = Familjen_Grotesk({ subsets: ['latin'], variable: '--font-familjen', display: 'swap' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono', display: 'swap' })

export const metadata: Metadata = {
  title: 'Meesho Ads Spend Monitor: ad spend alerts for Meesho sellers',
  description:
    'A free Chrome extension that checks your Meesho Supplier Panel ad spend every 15–25 minutes and alerts you on desktop and Telegram when a campaign crosses your limit.',
  generator: 'v0.app',
  icons: {
    icon: '/extension-icon.png',
    apple: '/extension-icon.png',
  },
  openGraph: {
    title: 'Meesho Ads Spend Monitor',
    description: 'Ad spend alerts on desktop and Telegram for every Meesho shop.',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f7f9f8',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`light ${sans.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
