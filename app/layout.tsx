import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Meesho Ads Spend Monitor: Setup & User Guide',
  description:
    'Install, set up and use the Meesho Ads Spend Monitor Chrome extension: read-only ad spend alerts on desktop and Telegram for every Meesho supplier account.',
  generator: 'v0.app',
  icons: {
    icon: '/extension-icon.png',
    apple: '/extension-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#6d28d9',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="light">
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
