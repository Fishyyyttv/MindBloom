'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { Send, RefreshCw, Sparkles, AlertTriangle, X, ChevronRight, Link } from 'lucide-react'
import { cn } from '@/lib/utils'
import TextareaAutosize from 'react-textarea-autosize'
import { motion, AnimatePresence } from 'framer-motion'

interface Message { id: string; role: 'user' | 'assistant'; content: string }

const QUICK_STARTS = [
  "I've been feeling anxious lately",
  "I can't stop overthinking",
  "I need help with my anger",
  "I'm feeling really low today",
  "I want to vent about something",
  "Help me with a breathing exercise",
]

const ONBOARDING_STEPS = [
  {
    emoji: '💙',
    title: "Hey, I'm Bloom",
    desc: "Think of me as that friend who always picks up — no matter what time it is. I'm here to listen, support you, and help you work through whatever's going on.",
  },
  {
    emoji: '🧰',
    title: "Tools built for real moments",
    desc: "MindBloom has breathing exercises, grounding techniques, DBT & CBT skills, a private journal, mood tracking, and more — all in the sidebar.",
  },
  {
    emoji: '🔒',
    title: "This is your private space",
    desc: "Everything you share here is private and encrypted. No judgment, no ads, no data selling. Just you and a companion who cares.",
  },
  {
    emoji: '⚠️',
    title: "One important thing",
    desc: "I'm not a licensed therapist and can't replace professional care. If you're ever in crisis, please call or text 988 — they're available 24/7 and are really good at this.",
  },
]

function OnboardingModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const current = ONBOARDING_STEPS[step]
  const isLast = step === ONBOARDING_STEPS.length - 1

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 relative"
      >
        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-6">
          {ONBOARDING_STEPS.map((_, i) => (
            <div key={i} className={cn('h-1.5 rounded-full transition-all', i === step ? 'w-6 bg-sage-400' : 'w-1.5 bg-sage-100')} />
          ))}
        </div>

        <div className="text-center space-y-4">
          <div className="text-5xl">{current.emoji}</div>
          <h2 className="font-serif text-2xl text-charcoal">{current.title}</h2>
          <p className="text-muted text-sm leading-relaxed">{current.desc}</p>
        </div>

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1 py-2.5">
              Back
            </button>
          )}
          <button
            onClick={() => isLast ? onClose() : setStep(s => s + 1)}
            className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2"
          >
            {isLast ? "Let's go 💙" : <>Next <ChevronRight className="w-4 h-4" /></>}
          </button>
        </div>

        {step === 0 && (
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 hover:bg-sage-50 rounded-lg text-muted">
            <X className="w-4 h-4" />
          </button>
        )}
      </motion.div>
    </motion.div>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-2 h-2 bg-sage-300 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <div className="w-8 h-8 bg-sage-400 rounded-xl flex items-center justify-center text-white text-xs font-serif font-bold mr-2 mt-1 shrink-0">B</div>
      )}
      <div className={cn(isUser ? 'chat-bubble-user' : 'chat-bubble-ai')}>
        <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
      </div>
    </motion.div>
  )
}

const ONBOARDING_KEY = 'mindbloom_onboarded'

export default function ChatPage() {
  const { user } = useUser()
  const searchParams = useSearchParams()
  const isWelcome = searchParams.get('welcome') === 'true'

  const [showOnboarding, setShowOnboarding] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: isWelcome
        ? `hey ${user?.firstName || 'there'} 💙 really glad you're here. this is your space — no pressure, no judgment, no rush. what's going on for you today?`
        : `hey 👋 I'm Bloom. think of me as that friend who always picks up, no matter what time it is. what's on your mind?`,
    }
  ])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [sessionId] = useState(() => crypto.randomUUID())
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Show onboarding only on first visit
  useEffect(() => {
    const hasOnboarded = localStorage.getItem(ONBOARDING_KEY)
    if (!hasOnboarded) {
      // Slight delay so page loads first
      const t = setTimeout(() => setShowOnboarding(true), 600)
      return () => clearTimeout(t)
    }
  }, [])

  const closeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true')
    setShowOnboarding(false)
    inputRef.current?.focus()
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return
    setInput('')

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text.trim() }
    const aiMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: '' }

    setMessages(prev => [...prev, userMsg])
    setIsStreaming(true)

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, sessionId }),
      })

      if (!res.ok) throw new Error('Stream failed')

      setMessages(prev => [...prev, aiMsg])
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        const finalText = accumulated
        setMessages(prev => prev.map(m => m.id === aiMsg.id ? { ...m, content: finalText } : m))
      }
    } catch {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment. 💙"
      }])
    } finally {
      setIsStreaming(false)
      inputRef.current?.focus()
    }
  }, [messages, isStreaming, sessionId])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const reset = () => {
    setMessages([{ id: '0', role: 'assistant', content: "let's start fresh. 🌿 what would you like to talk about?" }])
    setInput('')
  }

  return (
    <>
      <AnimatePresence>
        {showOnboarding && <OnboardingModal onClose={closeOnboarding} />}
      </AnimatePresence>

      <div className="flex flex-col h-[calc(100vh-6rem)] lg:h-[calc(100vh-4rem)] max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-serif text-2xl text-charcoal">Talk to <em>Bloom</em></h1>
            <p className="text-sm text-muted">whatever's on your mind — no judgment here</p>
          </div>
          <button onClick={reset} className="btn-ghost flex items-center gap-2 text-sm">
            <RefreshCw className="w-3.5 h-3.5" /> New chat
          </button>
        </div>

        {/* Crisis notice */}
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 mb-4 text-xs text-red-700">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          Bloom is not a crisis service. If you're in danger, call or text <strong className="ml-1">988</strong>.
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4">
          <AnimatePresence initial={false}>
            {messages.map(m => <MessageBubble key={m.id} message={m} />)}
          </AnimatePresence>
          {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex justify-start">
              <div className="w-8 h-8 bg-sage-400 rounded-xl flex items-center justify-center text-white text-xs font-serif font-bold mr-2 mt-1 shrink-0">B</div>
              <div className="chat-bubble-ai"><TypingDots /></div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick starts */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {QUICK_STARTS.map(s => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs bg-sage-50 hover:bg-sage-100 border border-sage-200 text-sage-700 px-3 py-1.5 rounded-full transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex items-end gap-3 bg-white border border-sage-100 rounded-2xl p-3 shadow-card">
          <TextareaAutosize
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What's on your mind?"
            minRows={1}
            maxRows={5}
            className="flex-1 resize-none bg-transparent text-sm text-charcoal placeholder-gray-400 focus:outline-none leading-relaxed"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isStreaming}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0',
              input.trim() && !isStreaming
                ? 'bg-sage-400 hover:bg-sage-500 text-white'
                : 'bg-sage-100 text-sage-300 cursor-not-allowed'
            )}
          >
            {isStreaming ? <Sparkles className="w-4 h-4 animate-pulse" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <footer className="mt-auto px-6 py-3 text-center text-xs text-muted">
        <p>Bloom is not a crisis service. If you're in danger, call or text 988.</p>
      </footer>
    </>
  )
}
