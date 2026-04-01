'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

const WAVE_DURATION = 90

const COOL_DOWN_TIPS = [
  { emoji: '🧊', title: 'Cold Water', desc: 'Run cold water over your wrists or splash your face for 30 seconds. This activates the dive reflex.' },
  { emoji: '💨', title: 'Long Exhale', desc: 'Inhale for 4, exhale for 8. Extended exhales activate your parasympathetic nervous system.' },
  { emoji: '💪', title: 'Wall Push', desc: 'Press your hands against a wall and push for 30 seconds. This discharges physical tension.' },
  { emoji: '🧘', title: 'Jaw Drop', desc: 'Drop your shoulders, unclench your jaw, open your hands. Signal safety to your body.' },
]

export default function AngerPage() {
  const [seconds, setSeconds] = useState(WAVE_DURATION)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const [trigger, setTrigger] = useState('')
  const [bodyFeel, setBodyFeel] = useState('')
  const [thought, setThought] = useState('')
  const [choice, setChoice] = useState('')

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          setRunning(false)
          setDone(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [running])

  const toggle = () => {
    if (done) { setSeconds(WAVE_DURATION); setDone(false); return }
    setRunning(r => !r)
  }

  const reset = () => {
    clearInterval(intervalRef.current!)
    setRunning(false)
    setDone(false)
    setSeconds(WAVE_DURATION)
  }

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const pct = (WAVE_DURATION - seconds) / WAVE_DURATION

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-charcoal mb-1">Anger <em>Management</em></h1>
        <p className="text-muted text-sm">Cool your body down before anger takes over your choices</p>
      </div>

      {/* 90-second wave timer */}
      <div className="card p-8 text-center">
        <h2 className="font-semibold text-charcoal mb-1">90-Second Wave</h2>
        <p className="text-sm text-muted mb-6">Anger surges fast. Give your nervous system 90 seconds before you react.</p>

        <div className="relative w-40 h-40 mx-auto mb-6">
          <svg className="absolute inset-0 -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="68" fill="none" stroke="#e8f0e8" strokeWidth="8" />
            <motion.circle
              cx="80" cy="80" r="68"
              fill="none"
              stroke={done ? '#7C9A7E' : '#ef4444'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 68}
              strokeDashoffset={2 * Math.PI * 68 * (1 - pct)}
              transition={{ duration: 0.5 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-serif font-bold text-charcoal">{fmt(seconds)}</div>
            <div className="text-xs text-muted">{done ? 'Complete' : running ? 'breathe...' : 'ready'}</div>
          </div>
        </div>

        {done && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-sm text-sage-700 bg-sage-50 border border-sage-200 rounded-xl px-4 py-3 mb-4">
            🌊 The wave has passed. How do you want to respond now?
          </motion.p>
        )}

        <div className="flex gap-3 justify-center">
          <button onClick={toggle}
            className={cn('flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all', running ? 'btn-secondary' : done ? 'btn-secondary' : 'btn-primary')}>
            {running ? <><Pause className="w-4 h-4" />Pause</> : done ? 'Done ✓' : <><Play className="w-4 h-4" />Start</>}
          </button>
          <button onClick={reset} className="btn-ghost flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      </div>

      {/* Trigger to Choice Map */}
      <div className="card p-6">
        <h2 className="font-semibold text-charcoal mb-1">🧭 Trigger → Choice Map</h2>
        <p className="text-sm text-muted mb-5">Separate the trigger from your response — this is where your power is.</p>
        <div className="space-y-4">
          {[
            { label: '1. Trigger', placeholder: 'What happened in one sentence?', val: trigger, set: setTrigger },
            { label: '2. Body', placeholder: 'Where do you feel anger first? (jaw, chest, fists...)', val: bodyFeel, set: setBodyFeel },
            { label: '3. Thought', placeholder: 'What story did your brain create?', val: thought, set: setThought },
            { label: '4. Choice', placeholder: 'What response protects your goals?', val: choice, set: setChoice },
          ].map(({ label, placeholder, val, set }) => (
            <div key={label}>
              <label className="label">{label}</label>
              <textarea value={val} onChange={e => set(e.target.value)} placeholder={placeholder} rows={2} className="textarea" />
            </div>
          ))}
        </div>
      </div>

      {/* Body Cool-Down */}
      <div className="card p-6">
        <h2 className="font-semibold text-charcoal mb-4">🧊 Body Cool-Down</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {COOL_DOWN_TIPS.map(tip => (
            <div key={tip.title} className="bg-sage-50 border border-sage-100 rounded-xl p-4">
              <div className="text-2xl mb-2">{tip.emoji}</div>
              <div className="font-medium text-charcoal text-sm mb-1">{tip.title}</div>
              <div className="text-xs text-muted leading-relaxed">{tip.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Conflict repair script */}
      <div className="card p-6">
        <h2 className="font-semibold text-charcoal mb-4">🗣️ Conflict Repair Script</h2>
        <p className="text-sm text-muted mb-4">If you snapped, repair quickly and clearly:</p>
        <ul className="space-y-2">
          {[
            '"I got flooded and spoke harshly. That wasn\'t okay."',
            '"I care about this and I want to do this conversation over."',
            '"Can we take 10 minutes and try again when we\'re both calmer?"',
            '"I\'m sorry for my delivery. My concern is still real — can we talk about it?"',
          ].map((script, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-charcoal">
              <span className="text-sage-400 mt-0.5">→</span>
              <span>{script}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
