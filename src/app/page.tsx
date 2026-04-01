'use client'

import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  MessageCircle, BookOpen, Wind, Zap, Shield, Heart,
  Star, ArrowRight, CheckCircle2, Brain, Smile, Moon
} from 'lucide-react'

const features = [
  { icon: MessageCircle, title: 'AI Therapy Chat', desc: 'Talk to a compassionate AI trained in CBT, DBT & ACT — anytime, no waitlist.', color: 'bg-sage-50 text-sage-600' },
  { icon: BookOpen, title: 'Private Journal', desc: 'Encrypted diary entries with mood tagging and guided prompts.', color: 'bg-blush-100 text-blush-500' },
  { icon: Wind, title: 'Breathing Exercises', desc: 'Box breathing, 4-7-8, and more — with animated visual guides.', color: 'bg-sky-50 text-sky-500' },
  { icon: Brain, title: 'DBT & CBT Skills', desc: 'Full skill library including TIPP, DEAR MAN, Thought Records, and more.', color: 'bg-purple-50 text-purple-500' },
  { icon: Smile, title: 'Mood Tracking', desc: 'Daily check-ins with charts to spot patterns over time.', color: 'bg-yellow-50 text-yellow-600' },
  { icon: Shield, title: 'Grounding Techniques', desc: '5-4-3-2-1, body scan, safe place visualization — for when anxiety spikes.', color: 'bg-teal-50 text-teal-600' },
  { icon: Zap, title: 'Coping Toolkit', desc: 'Quick-access cards for moments when you need help right now.', color: 'bg-orange-50 text-orange-500' },
  { icon: Moon, title: 'Anger Management', desc: '90-second wave timer, trigger mapping, and cool-down tools.', color: 'bg-indigo-50 text-indigo-500' },
]

const testimonials = [
  { name: 'Maya R.', text: 'MindBloom feels like having a therapist friend in my pocket. The DBT skills section alone is worth it.', rating: 5 },
  { name: 'James T.', text: 'I use the breathing exercises every morning. The AI chat helped me get through a really rough week.', rating: 5 },
  { name: 'Sofia L.', text: 'Finally a mental health app that doesn\'t feel clinical and cold. It\'s warm, beautiful, and actually helpful.', rating: 5 },
]

const faqs = [
  { q: 'Is MindBloom a replacement for therapy?', a: 'No — and we\'re upfront about that. MindBloom is a wellness companion, not a licensed therapist. We encourage professional therapy alongside using MindBloom.' },
  { q: 'Is my data private?', a: 'Yes. Your journal entries and conversations are encrypted. We never sell your data or use it for advertising.' },
  { q: 'What AI model powers the chat?', a: 'We use Meta\'s Llama 3.3 70B, a state-of-the-art open model, fine-tuned with therapeutic conversation guidelines.' },
  { q: 'Can I cancel anytime?', a: 'Absolutely. Cancel in one click from your account settings. No fees, no questions.' },
  { q: 'Is there a free trial?', a: 'Yes — 7 days free when you sign up. No charge until the trial ends.' },
]

export default function LandingPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && user) {
      router.replace('/app/chat')
    }
  }, [isLoaded, user, router])

  // Don't flash the landing page for logged-in users
  if (!isLoaded || user) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <span key={i} className="w-2.5 h-2.5 bg-sage-300 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-cream/80 backdrop-blur-md border-b border-sage-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sage-400 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif text-xl text-charcoal">MindBloom</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted">
            <a href="#features" className="hover:text-sage-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-sage-600 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-sage-600 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="text-sm text-muted hover:text-charcoal transition-colors">Sign in</Link>
            <Link href="/sign-up" className="btn-primary text-sm py-2 px-4">Start free trial</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-20 px-6 text-center max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center gap-2 bg-sage-50 border border-sage-200 rounded-full px-4 py-1.5 text-sage-700 text-sm mb-8">
            <span className="w-2 h-2 bg-sage-400 rounded-full animate-pulse" />
            7-day free trial · $9.99/month after
          </div>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl text-charcoal leading-tight mb-6">
            A wellness companion
            <br />
            <em className="text-sage-500">that actually listens</em>
          </h1>
          <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            MindBloom combines AI therapy chat, journaling, DBT & CBT skills, breathing exercises, mood tracking, and grounding tools — all in one calm, beautiful space.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up" className="btn-primary flex items-center justify-center gap-2 text-base py-3.5 px-8">
              Start your free trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="#features" className="btn-secondary text-base py-3.5 px-8">
              See what's inside
            </Link>
          </div>
          <p className="mt-4 text-sm text-muted">No credit card required to start · Cancel anytime</p>
        </motion.div>

        {/* Hero visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 relative"
        >
          <div className="bg-white border border-sage-100 rounded-3xl shadow-card-hover p-6 max-w-lg mx-auto text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-sage-400 rounded-xl flex items-center justify-center text-white text-sm font-serif font-bold">M</div>
              <div>
                <div className="font-medium text-charcoal text-sm">MindBloom</div>
                <div className="text-xs text-muted">Your wellness companion</div>
              </div>
              <div className="ml-auto w-2 h-2 bg-green-400 rounded-full" />
            </div>
            <div className="space-y-3">
              <div className="chat-bubble-ai text-sm">
                Hey, I'm glad you're here. 💙 What's going on for you today?
              </div>
              <div className="chat-bubble-user text-sm">
                I've been really anxious lately and can't stop overthinking
              </div>
              <div className="chat-bubble-ai text-sm">
                That sounds exhausting — when your mind won't quiet down, even resting feels impossible.
                <br /><br />
                Can you tell me a little more about when the overthinking tends to hit hardest? Is it at night, or throughout the day?
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {['Mostly at night', 'All day long', 'When I\'m alone'].map(s => (
                  <span key={s} className="text-xs bg-sage-50 border border-sage-200 text-sage-700 rounded-full px-3 py-1 cursor-pointer hover:bg-sage-100 transition-colors">{s}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute -right-4 top-8 hidden lg:block">
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity }} className="bg-white border border-sage-100 rounded-2xl p-3 shadow-card text-sm">
              <div className="text-2xl mb-1">😌</div>
              <div className="font-medium text-charcoal text-xs">Mood logged</div>
              <div className="text-muted text-xs">Feeling calmer today</div>
            </motion.div>
          </div>
          <div className="absolute -left-4 bottom-8 hidden lg:block">
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 5, repeat: Infinity }} className="bg-white border border-sage-100 rounded-2xl p-3 shadow-card text-sm">
              <div className="text-2xl mb-1">🌿</div>
              <div className="font-medium text-charcoal text-xs">5-4-3-2-1 complete</div>
              <div className="text-muted text-xs">Grounded in 3 min</div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Crisis banner */}
      <div className="bg-red-50 border-y border-red-100 py-3 px-6 text-center text-sm text-red-700">
        If you're in crisis, please call or text <a href="tel:988" className="font-bold underline">988</a> (Suicide & Crisis Lifeline) — available 24/7. MindBloom is not a crisis service.
      </div>

      {/* Features */}
      <section id="features" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl text-charcoal mb-4">Everything you need to feel better</h2>
          <p className="text-muted text-lg max-w-xl mx-auto">Evidence-based tools, beautifully designed, available any time you need them.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="card p-5 hover:shadow-card-hover transition-shadow duration-300"
            >
              <div className={`w-10 h-10 ${f.color} rounded-xl flex items-center justify-center mb-4`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-charcoal mb-2">{f.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section className="py-20 px-6 bg-sage-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-serif text-3xl text-center text-charcoal mb-12">People are finding their calm</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card p-6"
              >
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-charcoal leading-relaxed mb-4">"{t.text}"</p>
                <p className="text-sm text-muted font-medium">{t.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 max-w-4xl mx-auto text-center">
        <h2 className="font-serif text-4xl md:text-5xl text-charcoal mb-4">Simple, honest pricing</h2>
        <p className="text-muted text-lg mb-12">Everything included. No hidden fees. Cancel anytime.</p>
        <div className="card p-8 md:p-12 max-w-md mx-auto border-sage-200 relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-sage-400 text-white text-xs font-medium px-3 py-1 rounded-full">7 days free</div>
          <div className="text-5xl font-serif text-charcoal mb-1">$9.99</div>
          <div className="text-muted mb-8">per month · billed monthly</div>
          <ul className="space-y-3 text-left mb-8">
            {[
              'Unlimited AI therapy conversations',
              'Private encrypted journal',
              'Full DBT & CBT skill library',
              'Guided breathing exercises (4 types)',
              'Grounding techniques library',
              'Interactive worksheets',
              'Mood tracking & insights',
              'Anger management toolkit',
              'Coping skill cards',
            ].map(f => (
              <li key={f} className="flex items-start gap-3 text-sm text-charcoal">
                <CheckCircle2 className="w-4 h-4 text-sage-500 mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Link href="/sign-up" className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3.5">
            Start free trial <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-muted mt-4">No charge for 7 days. Cancel before trial ends and pay nothing.</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6 max-w-2xl mx-auto">
        <h2 className="font-serif text-3xl text-center text-charcoal mb-12">Questions answered</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.details
              key={i}
              className="card p-5 group cursor-pointer"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <summary className="font-medium text-charcoal list-none flex justify-between items-center">
                {faq.q}
                <span className="text-sage-400 group-open:rotate-45 transition-transform text-xl">+</span>
              </summary>
              <p className="mt-3 text-sm text-muted leading-relaxed">{faq.a}</p>
            </motion.details>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 px-6 text-center bg-sage-400">
        <h2 className="font-serif text-4xl text-white mb-4">Ready to feel better?</h2>
        <p className="text-sage-100 mb-8 max-w-md mx-auto">Join thousands using MindBloom to manage anxiety, process emotions, and build resilience.</p>
        <Link href="/sign-up" className="inline-flex items-center gap-2 bg-white text-sage-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-sage-50 transition-colors">
          Start your 7-day free trial <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-sage-100 text-center text-sm text-muted">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 bg-sage-400 rounded-md flex items-center justify-center">
            <Heart className="w-3 h-3 text-white" />
          </div>
          <span className="font-serif text-charcoal">MindBloom</span>
        </div>
        <p>MindBloom is not a licensed therapy service. If you're in crisis, call or text <strong>988</strong>.</p>
        <div className="flex justify-center gap-6 mt-3">
          <Link href="/privacy" className="hover:text-charcoal transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-charcoal transition-colors">Terms</Link>
          <a href="mailto:hello@mindbloom.app" className="hover:text-charcoal transition-colors">Contact</a>
        </div>
        <p className="mt-3">© {new Date().getFullYear()} MindBloom. All rights reserved.</p>
      </footer>
    </div>
  )
}