import React from "react"
import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Chusky — Your virtual worker',
  description: 'Give Chusky the goal and get the work back. It can research, work across your apps, handle calls and meetings, and keep longer tasks moving.',
  generator: 'v0.app',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'production' ? 'https://chusky-web.vercel.app' : 'http://localhost:3000')),
  openGraph: {
    title: 'Chusky — Your virtual worker',
    description: 'Give Chusky the goal and get the work back. Research, apps, calls, meetings, and longer tasks—with your approval when it matters.',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'A business owner handling a call while reviewing the next steps.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chusky — Your virtual worker',
    description: 'Give Chusky the goal. Get the work back.',
    images: ['/twitter-card.png'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="chusky-theme">
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
