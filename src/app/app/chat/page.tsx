'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Send, RefreshCw, Sparkles, AlertTriangle, X, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import TextareaAutosize from 'react-textarea-autosize'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AI_CONFIG_STORAGE_KEY,
  DEFAULT_AI_CONFIG,
  normalizeAIConfig,
  type AICompanionConfig,
} from '@/lib/ai-config'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

const QUICK_STARTS = [
  "I've been feeling anxious lately",
  "I can't stop overthinking",
  'I need help with my anger',
  "I'm feeling really low today",
  'I want to vent about something',
  'Help me with a breathing exercise',
]

const ONBOARDING_STEPS = [
  {
    emoji: '💙',
    title: "Hey, I'm Bloom",
    desc: 'Think of me as that friend who always picks up - no matter what time it is. I am here to listen and support you.',
  },
  {
    emoji: '🧰',
    title: 'Tools for real moments',
    desc: 'MindBloom has breathing exercises, grounding techniques, DBT and CBT skills, journaling, mood tracking, and more.',
  },
  {
    emoji: '🔒',
    title: 'Your private space',
    desc: 'What you share here is private and encrypted. No ads, no selling your data, no judgment.',
  },
  {
    emoji: '⚠️',
    title: 'One important thing',
    desc: 'Bloom is not a licensed therapist and cannot replace professional care. In crisis, call or text 988.',
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
        <div className="flex justify-center gap-1.5 mb-6">
          {ONBOARDING_STEPS.map((_, index) => (
            <div
              key={index}
              className={cn('h-1.5 rounded-full transition-all', index === step ? 'w-6 bg-sage-400' : 'w-1.5 bg-sage-100')}
            />
          ))}
        </div>

        <div className="text-center space-y-4">
          <div className="text-5xl">{current.emoji}</div>
          <h2 className="font-serif text-2xl text-charcoal">{current.title}</h2>
          <p className="text-muted text-sm leading-relaxed">{current.desc}</p>
        </div>

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep((prev) => prev - 1)} className="btn-secondary flex-1 py-2.5">
              Back
            </button>
          )}
          <button
            onClick={() => (isLast ? onClose() : setStep((prev) => prev + 1))}
            className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2"
          >
            {isLast ? "Let's go" : <>Next <ChevronRight className="w-4 h-4" /></>}
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
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="w-2 h-2 bg-sage-300 rounded-full animate-bounce"
          style={{ animationDelay: `${index * 0.15}s` }}
        />
      ))}
    </div>
  )
}

function MessageBubble({ message, assistantName }: { message: Message; assistantName: string }) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
    >
      {!isUser && (
        <div className="w-8 h-8 bg-sage-400 rounded-xl flex items-center justify-center text-white text-xs font-serif font-bold mr-2 mt-1 shrink-0">
          {assistantName.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className={cn(isUser ? 'chat-bubble-user' : 'chat-bubble-ai')}>
        <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
      </div>
    </motion.div>
  )
}

const ONBOARDING_KEY = 'mindbloom_onboarded'

function buildPromptFromSearch(searchParams: URLSearchParams): string {
  const directPrompt = searchParams.get('prompt')?.trim()
  if (directPrompt) return directPrompt

  const source = searchParams.get('source')
  if (source !== 'mood') return ''

  const emotion = searchParams.get('emotion')?.trim() || 'not specified'
  const intensity = searchParams.get('intensity')?.trim() || 'unknown'
  const note = searchParams.get('note')?.trim()

  const parts = [
    'I just completed a mood check-in in MindBloom.',
    `Emotions: ${emotion}.`,
    `Intensity: ${intensity}/10.`,
  ]

  if (note) {
    parts.push(`Note: ${note}`)
  }

  parts.push('Can you help me process this and suggest one next step?')
  return parts.join('\n')
}

export default function ChatPage() {
  const { user } = useUser()
  const searchParams = useSearchParams()
  const isWelcome = searchParams.get('welcome') === 'true'

  const [showOnboarding, setShowOnboarding] = useState(false)
  const [assistantConfig, setAssistantConfig] = useState<AICompanionConfig>(DEFAULT_AI_CONFIG)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: isWelcome
        ? `hey ${user?.firstName || 'there'} - really glad you're here. this is your space. what is going on today?`
        : "hey, I'm Bloom. think of me as that friend who always picks up. what's on your mind?",
    },
  ])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [sessionId] = useState(() => crypto.randomUUID())

  const messagesRef = useRef<Message[]>(messages)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const prefillSentRef = useRef(false)

  const assistantName = assistantConfig.name || 'Bloom'

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AI_CONFIG_STORAGE_KEY)
      if (!raw) return
      setAssistantConfig(normalizeAIConfig(JSON.parse(raw)))
    } catch {
      setAssistantConfig(DEFAULT_AI_CONFIG)
    }
  }, [])

  useEffect(() => {
    const hasOnboarded = localStorage.getItem(ONBOARDING_KEY)
    if (!hasOnboarded) {
      const timer = setTimeout(() => setShowOnboarding(true), 600)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (messages.length !== 1 || messages[0]?.id !== '0') return

    const welcomeMessage = isWelcome
      ? `heyy ${user?.firstName || 'there'} - really glad you're here. this is your space. what is going on today?`
      : `heyy, I'm ${assistantName}! think of me as that friend who always picks up. what's on your mind?`

    if (messages[0]?.content === welcomeMessage) return
    setMessages([{ id: '0', role: 'assistant', content: welcomeMessage }])
  }, [assistantName, isWelcome, user?.firstName, messages])

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

    const nextHistory = [...messagesRef.current, userMsg]
    setMessages((prev) => [...prev, userMsg])
    setIsStreaming(true)

    try {
      const history = nextHistory.map((message) => ({ role: message.role, content: message.content }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          sessionId,
          assistantConfig,
        }),
      })

      if (!res.ok) throw new Error('Stream failed')
      if (!res.body) throw new Error('No response body')

      setMessages((prev) => [...prev, aiMsg])

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        const finalText = accumulated
        setMessages((prev) => prev.map((message) => (
          message.id === aiMsg.id ? { ...message, content: finalText } : message
        )))
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `I'm having trouble connecting right now. Please try again in a moment.`,
        },
      ])
    } finally {
      setIsStreaming(false)
      inputRef.current?.focus()
    }
  }, [assistantConfig, isStreaming, sessionId])

  useEffect(() => {
    if (prefillSentRef.current) return

    const prefill = buildPromptFromSearch(searchParams)
    if (!prefill) return

    prefillSentRef.current = true
    setInput(prefill)
    sendMessage(prefill)
  }, [searchParams, sendMessage])

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage(input)
    }
  }

  const reset = () => {
    setMessages([
      {
        id: '0',
        role: 'assistant',
        content: `let's start fresh. what would you like to talk about?`,
      },
    ])
    setInput('')
  }

  return (
    <>
      <AnimatePresence>
        {showOnboarding && <OnboardingModal onClose={closeOnboarding} />}
      </AnimatePresence>

      <div className="flex flex-col h-[calc(100vh-6rem)] lg:h-[calc(100vh-4rem)] max-w-2xl mx-auto overflow-hidden">
        <div className="flex items-center justify-between mb-3 shrink-0 gap-3">
          <div>
            <h1 className="font-serif text-2xl text-charcoal">Talk to <em>{assistantName}</em></h1>
            <p className="text-sm text-muted">Whatever is on your mind - no judgment here</p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/app/account" className="btn-ghost flex items-center gap-2 text-sm">
              <SlidersHorizontal className="w-3.5 h-3.5" /> AI settings
            </Link>
            <button onClick={reset} className="btn-ghost flex items-center gap-2 text-sm">
              <RefreshCw className="w-3.5 h-3.5" /> New chat
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-2 mb-3 text-xs text-red-700 shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Not a crisis service. In danger? Call or text <strong className="ml-1">988</strong>.
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pb-2 min-h-0">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} assistantName={assistantName} />
            ))}
          </AnimatePresence>

          {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex justify-start">
              <div className="w-8 h-8 bg-sage-400 rounded-xl flex items-center justify-center text-white text-xs font-serif font-bold mr-2 mt-1 shrink-0">
                {assistantName.slice(0, 1).toUpperCase()}
              </div>
              <div className="chat-bubble-ai"><TypingDots /></div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 py-2 shrink-0">
            {QUICK_STARTS.map((starter) => (
              <button
                key={starter}
                onClick={() => sendMessage(starter)}
                className="text-xs bg-sage-50 hover:bg-sage-100 border border-sage-200 text-sage-700 px-3 py-1.5 rounded-full transition-colors"
              >
                {starter}
              </button>
            ))}
          </div>
        )}

        <div className="shrink-0 pt-2">
          <div className="flex items-end gap-3 bg-white border border-sage-100 rounded-2xl p-3 shadow-card">
            <TextareaAutosize
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
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
          <p className="text-center text-xs text-muted mt-2 pb-1">
            {assistantName} is not a crisis service. In danger? Call or text <strong>988</strong>
          </p>
        </div>
      </div>
    </>
  )
}
