import Link from 'next/link'
import { CheckCircle2, ArrowRight } from 'lucide-react'

export default function SubscribeSuccessPage() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="card max-w-md w-full p-10 text-center space-y-6">
        <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-sage-500" />
        </div>
        <div>
          <h1 className="font-serif text-3xl text-charcoal mb-2">Welcome to MindBloom 💙</h1>
          <p className="text-muted">Your trial has started. You have full access to every feature. We're glad you're here.</p>
        </div>
        <Link href="/app/chat" className="btn-primary w-full flex items-center justify-center gap-2 py-3.5">
          Go to your space <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-xs text-muted">You won't be charged for 7 days. Cancel anytime in account settings.</p>
      </div>
    </div>
  )
}
