import React from "react"
import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, JetBrains_Mono, Outfit } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-display'
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  weight: ['400', '500', '600'],
  variable: '--font-mono'
});

const outfit = Outfit({ 
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-os'
});

export const metadata: Metadata = {
  title: 'All The Vibes Community 2025',
  description: 'The biggest vibe coding event in the world - September 11-12, 2025 • San Francisco, CA',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.variable} ${jetbrainsMono.variable} ${outfit.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
