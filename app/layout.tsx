import type { Metadata, Viewport } from 'next'
import { SessionProvider } from "next-auth/react"
import { SessionLogger } from "@/components/session-logger"
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthSessionProvider } from '@/components/auth/session-provider'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#f5f7ff',
}

export const metadata: Metadata = {
  title: 'FitBook - Sport Booking App',
  description: 'Book your favorite fitness classes',
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



export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {/* 🔥 INSERT THIS HERE: Listens to all tab openings globally */}
          <SessionLogger /> 
          
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
