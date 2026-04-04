'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import {
  MessageCircle, BookOpen, Wind, Brain, Smile,
  Shield, Zap, Flame, Heart, Menu, X, ExternalLink, Bug
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/app/chat',        label: 'AI Chat',         icon: MessageCircle, color: 'text-sage-600' },
  { href: '/app/mood',        label: 'Mood Check-In',   icon: Smile,         color: 'text-yellow-600' },
  { href: '/app/grounding',   label: 'Grounding',       icon: Shield,        color: 'text-teal-600' },
  { href: '/app/breathe',     label: 'Breathing',       icon: Wind,          color: 'text-sky-600' },
  { href: '/app/anger',       label: 'Anger Management',icon: Flame,         color: 'text-red-500' },
  { href: '/app/worksheets',  label: 'Worksheets',      icon: BookOpen,      color: 'text-purple-600' },
  { href: '/app/skills',      label: 'DBT/CBT Skills',  icon: Brain,         color: 'text-indigo-600' },
  { href: '/app/coping',      label: 'Coping Toolkit',  icon: Zap,           color: 'text-orange-500' },
  { href: '/app/diary',       label: 'Journal',         icon: BookOpen,      color: 'text-blush-500' },
  { href: '/app/report-bug',  label: 'Feedback',        icon: Bug,           color: 'text-rose-500' },
  { href: '/app/account',     label: 'Account',         icon: Heart,         color: 'text-sage-600' },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 bg-white border-r border-sage-100 z-40 flex flex-col transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="p-5 border-b border-sage-100 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sage-400 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif text-lg text-charcoal">MindBloom</span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-lg hover:bg-sage-50">
            <X className="w-4 h-4 text-muted" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {nav.map(item => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
                  active
                    ? 'bg-sage-50 text-sage-700 font-medium'
                    : 'text-muted hover:bg-sage-50 hover:text-charcoal'
                )}
              >
                <item.icon className={cn('w-4 h-4', active ? item.color : 'text-muted')} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Crisis banner */}
        <div className="p-4 border-t border-sage-100">
          <a
            href="https://988lifeline.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium px-3 py-2.5 rounded-xl transition-colors"
          >
            <span className="w-2 h-2 bg-red-500 rounded-full" />
            Need immediate help? Call/text 988
            <ExternalLink className="w-3 h-3 ml-auto" />
          </a>
        </div>

        {/* User */}
        <div className="p-4 border-t border-sage-100 flex items-center gap-3">
          <UserButton afterSignOutUrl="/" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-charcoal truncate">My Account</p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile topbar */}
        <div className="lg:hidden sticky top-0 z-20 bg-cream/80 backdrop-blur-md border-b border-sage-100 px-4 h-14 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-sage-50">
            <Menu className="w-5 h-5 text-charcoal" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-sage-400 rounded-lg flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-serif text-lg text-charcoal">MindBloom</span>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>

        <main className="flex-1 p-4 md:p-8 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
