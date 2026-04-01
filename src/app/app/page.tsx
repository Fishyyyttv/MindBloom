'use client'

import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  MessageCircle, BookOpen, Wind, Brain, Smile,
  Shield, Zap, Flame
} from 'lucide-react'

const tiles = [
  { href: '/app/chat',       label: 'AI Chat',          icon: MessageCircle, emoji: '💬', color: 'bg-sage-50   border-sage-200',   desc: 'Talk it out' },
  { href: '/app/mood',       label: 'Mood Check-In',    icon: Smile,         emoji: '🌡️', color: 'bg-yellow-50 border-yellow-200', desc: 'Log how you feel' },
  { href: '/app/grounding',  label: 'Grounding',        icon: Shield,        emoji: '🌿', color: 'bg-teal-50   border-teal-200',   desc: '5-4-3-2-1 & more' },
  { href: '/app/breathe',    label: 'Breathing',        icon: Wind,          emoji: '🌬️', color: 'bg-sky-50    border-sky-200',    desc: 'Slow down' },
  { href: '/app/anger',      label: 'Anger Management', icon: Flame,         emoji: '🔥', color: 'bg-red-50    border-red-200',    desc: 'Cool down fast' },
  { href: '/app/worksheets', label: 'Worksheets',       icon: BookOpen,      emoji: '📋', color: 'bg-purple-50 border-purple-200', desc: 'Guided reflection' },
  { href: '/app/skills',     label: 'DBT/CBT Skills',   icon: Brain,         emoji: '📚', color: 'bg-indigo-50 border-indigo-200', desc: 'Evidence-based tools' },
  { href: '/app/coping',     label: 'Coping Toolkit',   icon: Zap,           emoji: '🧰', color: 'bg-orange-50 border-orange-200', desc: 'Right now tools' },
  { href: '/app/diary',      label: 'Journal',          icon: BookOpen,      emoji: '📓', color: 'bg-blush-100 border-blush-300',  desc: 'Private writing' },
]

export default function AppHome() {
  const { user } = useUser()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-3xl text-charcoal mb-1">
          {greeting}, <em>{user?.firstName || 'friend'}</em> 🌱
        </h1>
        <p className="text-muted">What do you need today?</p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {tiles.map((tile, i) => (
          <motion.div
            key={tile.href}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              href={tile.href}
              className={`card p-5 flex flex-col gap-2 hover:shadow-card-hover hover:scale-[1.02] transition-all border ${tile.color} group`}
            >
              <span className="text-2xl">{tile.emoji}</span>
              <div>
                <div className="font-semibold text-charcoal text-sm group-hover:text-sage-700 transition-colors">{tile.label}</div>
                <div className="text-xs text-muted">{tile.desc}</div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Crisis footer */}
      <div className="text-center pt-4 border-t border-sage-100">
        <p className="text-xs text-muted">
          In a crisis? Call or text <a href="tel:988" className="font-bold text-red-600 hover:underline">988</a> — free, confidential, 24/7
        </p>
      </div>
    </div>
  )
}
