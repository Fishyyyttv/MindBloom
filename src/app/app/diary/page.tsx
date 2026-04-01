'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Save, Trash2, Shuffle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDate, cn } from '@/lib/utils'
import type { DiaryEntry } from '@/types/database'
import { toast } from 'sonner'
import TextareaAutosize from 'react-textarea-autosize'

const PROMPTS = [
  "What am I grateful for today?",
  "What's draining my energy right now?",
  "What do I need that I'm not getting?",
  "What would I tell a friend in my situation?",
  "What's one small thing I can do today?",
  "What emotion am I avoiding right now?",
  "What's something I did well lately?",
  "If I could change one thing about today, what would it be?",
  "What's something that surprised me recently?",
  "What would make tomorrow feel a little better?",
]

const MOOD_EMOJIS = ['😢', '😔', '😐', '🙂', '😊']

export default function DiaryPage() {
  const { user } = useUser()
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [composing, setComposing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [prompt, setPrompt] = useState(PROMPTS[0])
  const [viewEntry, setViewEntry] = useState<DiaryEntry | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('diary_entries').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setEntries(data) })
  }, [user, saving])

  const randomPrompt = () => setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)])

  const save = async () => {
    if (!user || !content.trim()) return
    setSaving(true)
    const { error } = await supabase.from('diary_entries').insert({
      user_id: user.id,
      title: title || null,
      content: content.trim(),
      mood: mood,
      tags: [],
    })
    setSaving(false)
    if (!error) {
      toast.success('Entry saved 💙')
      setComposing(false)
      setTitle('')
      setContent('')
      setMood(null)
    }
  }

  const deleteEntry = async (id: string) => {
    await supabase.from('diary_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
    setViewEntry(null)
    toast.success('Entry deleted')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-charcoal mb-1">Your <em>Journal</em></h1>
          <p className="text-muted text-sm">Private, encrypted, just for you</p>
        </div>
        {!composing && (
          <button onClick={() => setComposing(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New entry
          </button>
        )}
      </div>

      {/* Compose */}
      <AnimatePresence>
        {composing && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="card p-6 space-y-4">
            {/* Prompt suggestion */}
            <div className="flex items-center gap-2 bg-sage-50 border border-sage-100 rounded-xl px-4 py-2.5">
              <span className="text-sm text-sage-700 italic flex-1">{prompt}</span>
              <button onClick={randomPrompt} className="text-sage-500 hover:text-sage-700 transition-colors">
                <Shuffle className="w-4 h-4" />
              </button>
            </div>

            <input value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Title (optional)" className="input" />

            <TextareaAutosize
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write freely — this is your space..."
              minRows={5}
              className="textarea"
              autoFocus
            />

            {/* Mood */}
            <div>
              <label className="label">How are you feeling? <span className="text-muted font-normal">(optional)</span></label>
              <div className="flex gap-2">
                {MOOD_EMOJIS.map((emoji, i) => (
                  <button key={i} onClick={() => setMood(mood === i + 1 ? null : i + 1)}
                    className={cn('text-2xl p-2 rounded-xl transition-all', mood === i + 1 ? 'bg-sage-100 scale-110' : 'hover:bg-sage-50')}>
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setComposing(false); setTitle(''); setContent(''); setMood(null) }}
                className="btn-secondary flex items-center gap-2">
                <X className="w-4 h-4" /> Discard
              </button>
              <button onClick={save} disabled={!content.trim() || saving}
                className="btn-primary flex items-center gap-2 flex-1 justify-center">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save entry'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Entries list */}
      {entries.length === 0 && !composing && (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">📓</div>
          <p className="text-muted text-sm">Your journal is empty — write your first entry above.</p>
        </div>
      )}

      <div className="space-y-3">
        {entries.map((entry, i) => (
          <motion.div key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
            onClick={() => setViewEntry(entry)}
            className="card p-5 cursor-pointer hover:shadow-card-hover hover:border-sage-200 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {entry.mood && <span className="text-lg">{MOOD_EMOJIS[entry.mood - 1]}</span>}
                  <h3 className="font-medium text-charcoal truncate">{entry.title || 'Untitled entry'}</h3>
                </div>
                <p className="text-sm text-muted line-clamp-2 leading-relaxed">{entry.content}</p>
              </div>
              <span className="text-xs text-muted shrink-0">{formatDate(entry.created_at)}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* View entry modal */}
      <AnimatePresence>
        {viewEntry && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-50" onClick={() => setViewEntry(null)} />
            <motion.div
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="fixed inset-x-4 bottom-0 md:inset-4 md:top-16 bg-white rounded-t-2xl md:rounded-2xl shadow-2xl z-50 flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-5 border-b border-sage-100 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    {viewEntry.mood && <span>{MOOD_EMOJIS[viewEntry.mood - 1]}</span>}
                    <h2 className="font-serif text-xl text-charcoal">{viewEntry.title || 'Untitled entry'}</h2>
                  </div>
                  <p className="text-xs text-muted">{formatDate(viewEntry.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => deleteEntry(viewEntry.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewEntry(null)} className="p-2 hover:bg-sage-50 rounded-lg">
                    <X className="w-5 h-5 text-muted" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <p className="text-charcoal leading-relaxed whitespace-pre-wrap">{viewEntry.content}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
