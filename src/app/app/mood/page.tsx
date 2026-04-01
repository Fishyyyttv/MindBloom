'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { BarChart2, Plus, MessageCircle } from 'lucide-react'
import { EMOTIONS } from '@/types'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { toast } from 'sonner'

export default function MoodPage() {
  const { user } = useUser()
  const [selected, setSelected] = useState<string[]>([])
  const [intensity, setIntensity] = useState(5)
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)
  const [history, setHistory] = useState<Array<{ id: string; score: number; emotions: string[]; note: string | null; created_at: string }>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('mood_logs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(14)
      .then(({ data }) => { if (data) setHistory(data) })
  }, [user, saved])

  const toggle = (label: string) =>
    setSelected(prev => prev.includes(label) ? prev.filter(e => e !== label) : [...prev, label])

  const handleSave = async () => {
    if (!user || selected.length === 0) return
    setLoading(true)
    const { error } = await supabase.from('mood_logs').insert({
      user_id: user.id,
      score: intensity,
      emotions: selected,
      note: note || null,
    })
    setLoading(false)
    if (!error) {
      setSaved(true)
      toast.success('Mood logged 💙')
      setTimeout(() => setSaved(false), 2000)
      setSelected([])
      setNote('')
      setIntensity(5)
    }
  }

  const moodEmoji = (score: number) => {
    if (score <= 2) return '😢'
    if (score <= 4) return '😔'
    if (score <= 6) return '😐'
    if (score <= 8) return '🙂'
    return '😊'
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-charcoal mb-1">Mood <em>Check-In</em></h1>
        <p className="text-muted text-sm">How are you actually doing right now?</p>
      </div>

      {/* Emotion grid */}
      <div className="card p-6">
        <h2 className="font-medium text-charcoal mb-4">I feel...</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {EMOTIONS.map(e => (
            <button
              key={e.label}
              onClick={() => toggle(e.label)}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-sm',
                selected.includes(e.label)
                  ? 'border-sage-400 bg-sage-50 scale-105'
                  : 'border-transparent bg-white hover:border-sage-200'
              )}
            >
              <span className="text-2xl">{e.emoji}</span>
              <span className={cn('text-xs font-medium', selected.includes(e.label) ? 'text-sage-700' : 'text-muted')}>{e.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Intensity */}
      <div className="card p-6">
        <h2 className="font-medium text-charcoal mb-1">Intensity</h2>
        <p className="text-xs text-muted mb-4">How strongly are you feeling this?</p>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted w-20">Barely there</span>
          <input
            type="range" min={1} max={10} value={intensity}
            onChange={e => setIntensity(Number(e.target.value))}
            className="flex-1 accent-sage-400"
          />
          <span className="text-xs text-muted w-20 text-right">Overwhelming</span>
        </div>
        <div className="text-center mt-2">
          <span className="text-3xl">{moodEmoji(intensity)}</span>
          <span className="ml-2 font-medium text-charcoal">{intensity}/10</span>
        </div>
      </div>

      {/* Note */}
      <div className="card p-6">
        <label className="label">What's going on? <span className="text-muted font-normal">(optional)</span></label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Add a quick note..."
          rows={3}
          className="textarea"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link href={`/app/chat?prompt=${encodeURIComponent(`I'm feeling ${selected.join(', ')} at intensity ${intensity}/10`)}`}
          className="btn-secondary flex items-center gap-2 flex-1 justify-center">
          <MessageCircle className="w-4 h-4" /> Talk about this
        </Link>
        <button
          onClick={handleSave}
          disabled={selected.length === 0 || loading}
          className="btn-primary flex items-center gap-2 flex-1 justify-center"
        >
          <Plus className="w-4 h-4" /> {loading ? 'Saving...' : 'Log mood'}
        </button>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="w-4 h-4 text-sage-500" />
            <h2 className="font-medium text-charcoal">Recent check-ins</h2>
          </div>
          <div className="space-y-2">
            {history.slice(0, 7).map(log => (
              <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="card p-4 flex items-center gap-3">
                <span className="text-2xl">{moodEmoji(log.score)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-charcoal text-sm">{log.score}/10</span>
                    <div className="flex flex-wrap gap-1">
                      {log.emotions.slice(0, 3).map(e => (
                        <span key={e} className="text-xs bg-sage-50 text-sage-700 px-2 py-0.5 rounded-full">{e}</span>
                      ))}
                    </div>
                  </div>
                  {log.note && <p className="text-xs text-muted truncate mt-0.5">{log.note}</p>}
                </div>
                <span className="text-xs text-muted shrink-0">{formatDate(log.created_at)}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
