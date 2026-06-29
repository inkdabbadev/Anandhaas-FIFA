import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { APP } from '@/constants'
import { Providers } from '@/providers'

// One typeface across the entire product (the Apple approach — a single family,
// expressed through weight and scale). Inter: precise, neutral, tabular numerals.
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: { default: `${APP.brand} · Predict`, template: `%s · ${APP.brand}` },
  description: APP.description,
  applicationName: APP.name,
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: APP.name,
  },
  metadataBase: new URL(`https://${APP.domain}`),
  openGraph: {
    title: APP.name,
    description: APP.description,
    type: 'website',
  },
  icons: { icon: '/icon.png', apple: '/icon.png' },
}

export const viewport: Viewport = {
  themeColor: '#0a1420',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
