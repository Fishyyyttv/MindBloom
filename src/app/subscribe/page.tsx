'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { CheckCircle2, Heart, ArrowRight, Loader2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

const features = [
  'Unlimited AI therapy conversations',
  'Private encrypted journal',
  'Full DBT & CBT skill library',
  'Guided breathing exercises',
  'Grounding techniques',
  'Interactive worksheets',
  'Mood tracking & insights',
  'Anger management toolkit',
]

export default function SubscribePage() {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [showAgeError, setShowAgeError] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

  const handleSubscribe = async () => {
    if (!ageConfirmed) {
      setShowAgeError(true)
      return
    }
    setShowAgeError(false)
    setCheckoutError('')
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.emailAddresses[0]?.emailAddress }),
      })
      const contentType = res.headers.get('content-type') ?? ''
      const payload = contentType.includes('application/json')
        ? await res.json()
        : { error: await res.text() }

      if (!res.ok) {
        const message = typeof payload?.error === 'string' && payload.error.trim().length > 0
          ? payload.error.trim()
          : 'Unable to start checkout. Please try again.'
        throw new Error(message)
      }

      const { url } = payload
      if (url) window.location.href = url
      else throw new Error('Checkout URL was not returned.')
    } catch (err) {
      console.error(err)
      setCheckoutError(err instanceof Error ? err.message : 'Unable to start checkout. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-16">
      <Link href="/" className="flex items-center gap-2 mb-12">
        <div className="w-9 h-9 bg-sage-400 rounded-xl flex items-center justify-center">
          <Heart className="w-4 h-4 text-white" />
        </div>
        <span className="font-serif text-2xl text-charcoal">MindBloom</span>
      </Link>

      <div className="card max-w-md w-full p-8 md:p-10">
        <div className="text-center mb-8">
          <div className="inline-block bg-sage-50 text-sage-700 text-sm font-medium px-3 py-1 rounded-full border border-sage-200 mb-4">
            7 days free, then $9.99/month
          </div>
          <h1 className="font-serif text-3xl text-charcoal mb-2">Start your free trial</h1>
          <p className="text-muted text-sm">
            Hi {user?.firstName || 'there'} 👋 — you're one step away from your wellness companion.
          </p>
        </div>

        <ul className="space-y-2.5 mb-6">
          {features.map(f => (
            <li key={f} className="flex items-start gap-3 text-sm text-charcoal">
              <CheckCircle2 className="w-4 h-4 text-sage-500 mt-0.5 shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5 text-xs text-amber-800 leading-relaxed">
          <strong>Important:</strong> MindBloom is a wellness companion, not a licensed therapy service. It does not provide medical advice or treatment. If you are in crisis, call or text <strong>988</strong>.
        </div>

        {/* Age confirmation */}
        <div className="mb-5">
          <label className={`flex items-start gap-3 cursor-pointer group ${showAgeError ? 'text-red-600' : 'text-charcoal'}`}>
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={e => {
                setAgeConfirmed(e.target.checked)
                if (e.target.checked) setShowAgeError(false)
              }}
              className="mt-0.5 w-4 h-4 accent-sage-500 cursor-pointer shrink-0"
            />
            <span className="text-sm leading-relaxed">
              I confirm that I am at least<strong>18 years of age or have parental consent</strong> and I have read and agree to the{' '}
              <Link href="/terms" target="_blank" className="underline hover:text-sage-600">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" target="_blank" className="underline hover:text-sage-600">Privacy Policy</Link>.
            </span>
          </label>
          {showAgeError && (
            <p className="text-red-500 text-xs mt-2 ml-7">
              You must confirm you are 18 or older to continue.
            </p>
          )}
        </div>

        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 text-base"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Setting up...</>
          ) : (
            <>Start 7-day free trial <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
        {checkoutError && <p className="mt-3 text-sm text-red-600">{checkoutError}</p>}

        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted">
          <ShieldCheck className="w-3.5 h-3.5 text-sage-400" />
          No charge for 7 days · Cancel anytime · Secure payment via Stripe
        </div>
      </div>

      <p className="mt-8 text-sm text-muted">
        Already subscribed?{' '}
        <Link href="/app/chat" className="text-sage-600 hover:underline">Go to app →</Link>
      </p>
    </div>
  )
}
