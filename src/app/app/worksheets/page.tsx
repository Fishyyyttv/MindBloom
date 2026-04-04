'use client'

import { useState } from 'react'
import { WORKSHEETS } from '@/types'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Search, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

const WORKSHEET_QUESTIONS: Record<string, Array<{ label: string; placeholder: string; rows?: number }>> = {
  'thought-record': [
    { label: 'Situation', placeholder: 'What happened? Where were you, who was there?', rows: 2 },
    { label: 'Automatic Thought', placeholder: 'What went through your mind? What does this mean to you?', rows: 2 },
    { label: 'Emotion(s)', placeholder: 'What emotions did you feel? Rate 0-100%', rows: 1 },
    { label: 'Evidence For the Thought', placeholder: 'What supports this thought being true?', rows: 3 },
    { label: 'Evidence Against the Thought', placeholder: 'What contradicts or challenges this thought?', rows: 3 },
    { label: 'Balanced Thought', placeholder: "What's a more balanced, realistic way to see this?", rows: 2 },
    { label: 'Outcome', placeholder: 'How do you feel now (0-100%)? What will you do differently?', rows: 2 },
  ],
  'emotion-checkin': [
    { label: 'Primary Emotion', placeholder: "What is the main emotion you're feeling?" },
    { label: 'Intensity (1-10)', placeholder: '1 = barely there, 10 = overwhelming' },
    { label: 'Where in Your Body?', placeholder: 'Chest, throat, stomach, jaw...?' },
    { label: 'What Triggered This?', placeholder: 'What happened just before you felt this?', rows: 2 },
    { label: 'What Does This Emotion Need?', placeholder: 'Rest, connection, movement, expression...?', rows: 2 },
    { label: 'One Small Action', placeholder: "What's one thing you can do right now to honor this emotion?", rows: 2 },
  ],
  'safety-plan': [
    { label: 'Warning Signs', placeholder: 'What thoughts, feelings, or situations signal a crisis is coming?', rows: 3 },
    { label: 'Internal Coping Strategies', placeholder: 'Things I can do alone to distract or soothe myself', rows: 3 },
    { label: 'People & Places That Help', placeholder: 'Social settings or people who take my mind off things', rows: 2 },
    { label: 'People I Can Ask for Help', placeholder: 'Name and contact info for trusted people', rows: 2 },
    { label: 'Professionals I Can Contact', placeholder: 'Therapist, crisis line, doctor - name and number', rows: 2 },
    { label: 'Making My Environment Safer', placeholder: 'What can I remove or change to reduce risk?', rows: 2 },
    { label: 'Reasons for Living', placeholder: 'What keeps you going? Who or what matters to you?', rows: 3 },
  ],
  values: [
    { label: 'What matters most to me in life?', placeholder: 'List 5-10 things (relationships, creativity, health, freedom...)', rows: 3 },
    { label: 'When do I feel most like myself?', placeholder: 'Describe moments when you feel alive and authentic', rows: 3 },
    { label: 'What would I regret NOT doing?', placeholder: 'Looking back from age 90, what would hurt to have missed?', rows: 2 },
    { label: 'My top 3 core values', placeholder: 'From the above, distill your 3 deepest values', rows: 2 },
    { label: 'Am I living them?', placeholder: 'Where does your life currently align? Where does it not?', rows: 3 },
    { label: 'One concrete change', placeholder: "What's one small step this week toward living your values?", rows: 2 },
  ],
  'anger-chain': [
    { label: 'The Situation', placeholder: 'What happened? Be specific and factual.', rows: 2 },
    { label: 'Body Cues', placeholder: 'What did you feel physically? (heart rate, jaw, chest...)' },
    { label: 'The Trigger Thought', placeholder: 'What was the thought or interpretation that sparked anger?' },
    { label: 'The Behavior', placeholder: 'What did you do? What did you say?' },
    { label: 'The Consequence', placeholder: 'What happened after? How did others respond?' },
    { label: 'Earlier in the Chain', placeholder: 'What could you have done differently at each step?', rows: 3 },
    { label: 'Next Time', placeholder: "One specific thing you'll do differently next time", rows: 2 },
  ],
  'stress-bucket': [
    { label: "What's filling my bucket right now?", placeholder: 'List all current stressors - big and small', rows: 4 },
    { label: "What's draining from my bucket?", placeholder: 'What activities, people, or habits reduce your stress?', rows: 3 },
    { label: 'Is my bucket overflowing?', placeholder: 'Rate 1-10 and describe what that feels like' },
    { label: 'What can I remove or reduce?', placeholder: 'Which stressors can be reduced or eliminated?', rows: 2 },
    { label: 'What can I add more of?', placeholder: 'Which draining activities can you do more of this week?', rows: 2 },
  ],
  'behavioral-activation': [
    { label: 'Current mood (1-10)', placeholder: '1 = very low, 10 = excellent' },
    { label: 'Activities I used to enjoy', placeholder: 'List 5+ activities that used to bring pleasure or meaning', rows: 3 },
    { label: "Activities I've been avoiding", placeholder: 'What have you stopped doing since feeling low?', rows: 2 },
    { label: 'Schedule for this week', placeholder: 'Pick 2-3 activities and schedule specific times for them', rows: 3 },
    { label: 'Predicted mood during activity (1-10)', placeholder: "Before doing it, rate how good you think you'll feel" },
    { label: 'Actual mood after (1-10)', placeholder: 'Fill this in after completing the activity' },
  ],
  gratitude: [
    { label: "3 things I'm grateful for today", placeholder: '1.\n2.\n3.', rows: 4 },
    { label: 'One person I appreciate', placeholder: 'Who and why?', rows: 2 },
    { label: 'Something my body did for me today', placeholder: 'Even something small - breathing, healing, moving', rows: 2 },
    { label: "A challenge I'm grateful for", placeholder: 'Something hard that taught you something', rows: 2 },
    { label: "What I'm looking forward to", placeholder: 'Even something small - a meal, a moment, a person', rows: 2 },
  ],
}

export default function WorksheetsPage() {
  const [search, setSearch] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const filtered = WORKSHEETS.filter((worksheet) =>
    worksheet.name.toLowerCase().includes(search.toLowerCase()) ||
    worksheet.category.toLowerCase().includes(search.toLowerCase())
  )

  const activeWorksheet = WORKSHEETS.find((worksheet) => worksheet.id === activeId)
  const questions = activeId ? WORKSHEET_QUESTIONS[activeId] ?? [] : []

  const worksheetPrompt = (() => {
    if (!activeWorksheet || !activeId) return '/app/chat'

    const summary = Object.entries(responses)
      .filter(([, value]) => value.trim())
      .slice(0, 8)
      .map(([question, answer]) => `${question}: ${answer.trim()}`)
      .join('\n')

    const prompt = [
      `I just worked on the ${activeWorksheet.name} worksheet.`,
      summary || 'I have not filled many fields yet.',
      'Can you help me reflect on this and suggest one practical next step?',
    ].join('\n')

    const params = new URLSearchParams({
      source: 'worksheet',
      worksheet: activeId,
      prompt,
    })

    return `/app/chat?${params.toString()}`
  })()

  const save = async () => {
    if (!activeId) return

    setSaving(true)
    try {
      const res = await fetch('/api/worksheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worksheetType: activeId,
          responses,
        }),
      })

      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to save worksheet')
      }

      toast.success('Worksheet saved')
      setActiveId(null)
      setResponses({})
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save worksheet'
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-charcoal mb-1">Coping <em>Worksheets</em></h1>
        <p className="text-muted text-sm">Guided reflection to help you make sense of what you are feeling</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search worksheets..."
          className="input pl-9"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map((worksheet, index) => (
          <motion.button
            key={worksheet.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => {
              setActiveId(worksheet.id)
              setResponses({})
            }}
            className="card p-5 text-left hover:shadow-card-hover hover:border-sage-200 transition-all group"
          >
            <div className="text-3xl mb-2">{worksheet.emoji}</div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-charcoal group-hover:text-sage-700 transition-colors">{worksheet.name}</h3>
              <span className="badge bg-sage-50 text-sage-700 border border-sage-100 shrink-0 text-xs">{worksheet.category}</span>
            </div>
            <p className="text-sm text-muted mt-1 leading-relaxed">{worksheet.description}</p>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {activeId && activeWorksheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-50"
              onClick={() => setActiveId(null)}
            />

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="fixed inset-x-4 bottom-0 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:top-8 md:bottom-8 bg-white rounded-t-2xl md:rounded-2xl shadow-2xl z-50 w-full md:max-w-xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-5 border-b border-sage-100 shrink-0">
                <div>
                  <h2 className="font-serif text-xl text-charcoal">{activeWorksheet.emoji} {activeWorksheet.name}</h2>
                  <p className="text-xs text-muted">{activeWorksheet.description}</p>
                </div>
                <button onClick={() => setActiveId(null)} className="p-1.5 hover:bg-sage-50 rounded-lg">
                  <X className="w-5 h-5 text-muted" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {questions.map((question) => (
                  <div key={question.label}>
                    <label className="label">{question.label}</label>
                    <textarea
                      value={responses[question.label] ?? ''}
                      onChange={(event) => setResponses((prev) => ({ ...prev, [question.label]: event.target.value }))}
                      placeholder={question.placeholder}
                      rows={question.rows ?? 2}
                      className="textarea"
                    />
                  </div>
                ))}
              </div>

              <div className="p-5 border-t border-sage-100 shrink-0 flex gap-3">
                <Link href={worksheetPrompt} className="btn-secondary flex items-center justify-center gap-2">
                  <MessageCircle className="w-4 h-4" /> Talk to AI
                </Link>
                <button onClick={() => setActiveId(null)} className="btn-secondary flex-1">Discard</button>
                <button onClick={save} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save worksheet'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
