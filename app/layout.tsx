import React from "react"
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Chusky AI Agent',
  description: 'Chusky is an AI agent that connects 1,000+ tools and turns requests into completed work.',
  generator: 'v0.app',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Chusky AI Agent',
    description: 'Chusky is an AI agent that connects 1,000+ tools and turns requests into completed work.',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Chusky AI Agent — Your tools, on call.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chusky AI Agent',
    description: 'Connect tools and move work forward with Chusky.',
    images: ['/twitter-card.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
