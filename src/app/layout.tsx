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

export const metadata: Metadata = {
  metadataBase: new URL('https://mindbloomtherapy.netlify.app'),

  title: 'MindBloom — AI Wellness Companion',
  description: 'Your compassionate AI wellness companion. CBT, DBT, journaling, breathing, and more.',

  openGraph: {
    title: 'MindBloom — AI Wellness Companion',
    description: 'A wellness companion that actually listens.',
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
