import React from "react"
import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Chusky — Your virtual worker',
  description: 'Chusky handles the work behind your conversations—calls, meetings, follow-ups, research, and actions across your tools.',
  generator: 'v0.app',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'production' ? 'https://chusky-web.vercel.app' : 'http://localhost:3000')),
  openGraph: {
    title: 'Chusky — Your virtual worker',
    description: 'The call is not the job. The follow-up is. Give Chusky a task and get the outcome.',
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
    description: 'Talk to Chusky. Give it a task. Get the outcome.',
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
