import { SignUp } from '@clerk/nextjs'
import { Heart } from 'lucide-react'
import Link from 'next/link'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 py-12">
      <Link href="/" className="flex items-center gap-2 mb-10">
        <div className="w-9 h-9 bg-sage-400 rounded-xl flex items-center justify-center">
          <Heart className="w-4 h-4 text-white" />
        </div>
        <span className="font-serif text-2xl text-charcoal">MindBloom</span>
      </Link>
      <SignUp
        appearance={{
          elements: {
            rootBox: 'w-full max-w-sm',
            card: 'bg-white shadow-card border border-sage-100 rounded-2xl',
            headerTitle: 'font-serif text-charcoal',
            headerSubtitle: 'text-muted',
            formButtonPrimary: 'bg-sage-400 hover:bg-sage-500 text-white rounded-xl',
            footerActionLink: 'text-sage-600 hover:text-sage-700',
            formFieldInput: 'border-sage-100 rounded-xl focus:ring-sage-300',
          },
        }}
      />
    </div>
  )
}
