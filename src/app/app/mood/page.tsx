'use client'

import { useEffect, useMemo, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { BarChart2, Plus, MessageCircle } from 'lucide-react'
import { EMOTIONS } from '@/types'
import { cn, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { toast } from 'sonner'

type MoodLogHistory = {
  id: string
  score: number
  emotions: string[]
  note: string | null
  created_at: string
}

function scoreToEmoji(score: number): string {
  if (score <= 2) return '😢'
  if (score <= 4) return '😕'
  if (score <= 6) return '😐'
  if (score <= 8) return '🙂'
  return '😊'
}

export default function MoodPage() {
  const { user, isLoaded } = useUser()

  const [selected, setSelected] = useState<string[]>([])
  const [intensity, setIntensity] = useState(5)
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  const [history, setHistory] = useState<MoodLogHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const emotionLookup = useMemo(
    () => new Map(EMOTIONS.map((emotion) => [emotion.label, emotion])),
    []
  )

  const selectedPrimaryEmotion = selected.length > 0
    ? emotionLookup.get(selected[selected.length - 1])
    : undefined

  const currentMoodEmoji = selectedPrimaryEmotion?.emoji ?? scoreToEmoji(intensity)

  useEffect(() => {
    if (!user) return

    const loadHistory = async () => {
      setLoadingHistory(true)
      try {
        const res = await fetch('/api/mood', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load mood history')
        const payload = await res.json()
        setHistory(Array.isArray(payload.logs) ? payload.logs : [])
      } catch {
        toast.error('Could not load mood history right now')
      } finally {
        setLoadingHistory(false)
      }
    }

    loadHistory()
  }, [user, refreshKey])

  const toggle = (label: string) => {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((emotion) => emotion !== label) : [...prev, label]
    )
  }

  const buildMoodPrompt = () => {
    const emotionText = selected.join(', ')
    const parts = [
      'I just completed a mood check-in in MindBloom.',
      `Emotions: ${emotionText || 'none selected'}.`,
      `Intensity: ${intensity}/10.`,
    ]

    if (note.trim()) {
      parts.push(`Note: ${note.trim()}`)
    }

    parts.push('Can you help me process this and suggest one helpful next step?')
    return parts.join('\n')
  }

  const talkHref = useMemo(() => {
    const params = new URLSearchParams({
      source: 'mood',
      prompt: buildMoodPrompt(),
      emotion: selected.join(', '),
      intensity: String(intensity),
    })

    const trimmedNote = note.trim()
    if (trimmedNote) {
      params.set('note', trimmedNote)
    }

    return `/app/chat?${params.toString()}`
  }, [selected, intensity, note])

  const handleSave = async () => {
    if (!user || selected.length === 0) return

    setLoading(true)
    try {
      const res = await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: intensity,
          emotions: selected,
          note: note.trim() || null,
        }),
      })

      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to save mood log')
      }

      setSaved(true)
      setSelected([])
      setNote('')
      setIntensity(5)
      setRefreshKey((prev) => prev + 1)
      toast.success('Mood logged')
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save mood log'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  if (isLoaded && !user) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-charcoal mb-1">Mood <em>Check-In</em></h1>
        <p className="text-muted text-sm">How are you actually doing right now?</p>
      </div>

      <div className="card p-6">
        <h2 className="font-medium text-charcoal mb-4">I feel...</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {EMOTIONS.map((emotion) => (
            <button
              key={emotion.label}
              onClick={() => toggle(emotion.label)}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-sm',
                selected.includes(emotion.label)
                  ? 'border-sage-400 bg-sage-50 scale-105'
                  : 'border-transparent bg-white hover:border-sage-200'
              )}
            >
              <span className="text-2xl">{emotion.emoji}</span>
              <span
                className={cn(
                  'text-xs font-medium',
                  selected.includes(emotion.label) ? 'text-sage-700' : 'text-muted'
                )}
              >
                {emotion.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-medium text-charcoal mb-1">Intensity</h2>
        <p className="text-xs text-muted mb-4">How strongly are you feeling this?</p>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted w-20">Barely there</span>
          <input
            type="range"
            min={1}
            max={10}
            value={intensity}
            onChange={(event) => setIntensity(Number(event.target.value))}
            className="flex-1 accent-sage-400"
          />
          <span className="text-xs text-muted w-20 text-right">Overwhelming</span>
        </div>

        <div className="text-center mt-2">
          <span className="text-3xl">{currentMoodEmoji}</span>
          <span className="ml-2 font-medium text-charcoal">{intensity}/10</span>
          {selectedPrimaryEmotion && (
            <p className="text-xs text-muted mt-1">Current emotion: {selectedPrimaryEmotion.label}</p>
          )}
        </div>
      </div>

      <div className="card p-6">
        <label className="label">What's going on? <span className="text-muted font-normal">(optional)</span></label>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Add a quick note..."
          rows={3}
          className="textarea"
        />
      </div>

      <div className="flex gap-3">
        <Link
          href={talkHref}
          aria-disabled={selected.length === 0}
          className={cn(
            'btn-secondary flex items-center gap-2 flex-1 justify-center',
            selected.length === 0 && 'pointer-events-none opacity-50'
          )}
        >
          <MessageCircle className="w-4 h-4" /> Talk to AI about this
        </Link>

        <button
          onClick={handleSave}
          disabled={selected.length === 0 || loading}
          className="btn-primary flex items-center gap-2 flex-1 justify-center"
        >
          <Plus className="w-4 h-4" /> {loading ? 'Saving...' : 'Log mood'}
        </button>
      </div>

      {history.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="w-4 h-4 text-sage-500" />
            <h2 className="font-medium text-charcoal">Recent check-ins</h2>
          </div>

          {loadingHistory && (
            <p className="text-xs text-muted mb-2">Refreshing...</p>
          )}

          <div className="space-y-2">
            {history.slice(0, 7).map((log) => {
              const emotionEmoji = log.emotions?.[0] ? emotionLookup.get(log.emotions[0])?.emoji : null
              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card p-4 flex items-center gap-3"
                >
                  <span className="text-2xl">{emotionEmoji ?? scoreToEmoji(log.score)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-charcoal text-sm">{log.score}/10</span>
                      <div className="flex flex-wrap gap-1">
                        {(log.emotions ?? []).slice(0, 3).map((emotion) => (
                          <span key={emotion} className="text-xs bg-sage-50 text-sage-700 px-2 py-0.5 rounded-full">
                            {emotion}
                          </span>
                        ))}
                      </div>
                    </div>
                    {log.note && <p className="text-xs text-muted truncate mt-0.5">{log.note}</p>}
                  </div>
                  <span className="text-xs text-muted shrink-0">{formatDate(log.created_at)}</span>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {saved && <p className="text-sm text-sage-700">Saved your check-in.</p>}
    </div>
  )
}
