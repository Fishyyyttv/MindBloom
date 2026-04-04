import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const APP_URL = 'https://mymindbloom.app'
const APP_URL_WWW = 'https://www.mymindbloom.app'

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: 'MindBloom - AI Wellness Companion',
  description: 'Your compassionate AI wellness companion. CBT, DBT, journaling, breathing, and more.',
  alternates: {
    canonical: APP_URL,
    languages: {
      'x-default': APP_URL,
      'en-US': APP_URL_WWW,
    },
  },
  openGraph: {
    title: 'MindBloom - AI Wellness Companion',
    description: 'A wellness companion that actually listens.',
    url: APP_URL,
    siteName: 'MindBloom',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
        <body className="bg-cream font-sans antialiased">
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: { fontFamily: 'var(--font-sans)', background: '#FFFDF9', border: '1px solid rgba(124,154,126,0.2)' },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  )
}
