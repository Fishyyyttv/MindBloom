'use client'

import { useState, useEffect, useRef } from 'react'
import { BREATHING_EXERCISES } from '@/types'
import { cn } from '@/lib/utils'
import { Play, Square } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function BreathePage() {
  const [selected, setSelected] = useState(BREATHING_EXERCISES[0])
  const [running, setRunning] = useState(false)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [secondsLeft, setSecondsLeft] = useState(BREATHING_EXERCISES[0].phases[0].duration)
  const [cycles, setCycles] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const phases = selected.phases
  const phase = phases[phaseIdx]

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          const nextIdx = (phaseIdx + 1) % phases.length
          setPhaseIdx(nextIdx)
          if (nextIdx === 0) setCycles(c => c + 1)
          setSecondsLeft(phases[nextIdx].duration)
          return phases[nextIdx].duration
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [running, phaseIdx, phases])

  const start = () => {
    setPhaseIdx(0)
    setSecondsLeft(phases[0].duration)
    setCycles(0)
    setRunning(true)
  }

  const stop = () => {
    setRunning(false)
    clearInterval(intervalRef.current!)
    setPhaseIdx(0)
    setSecondsLeft(phases[0].duration)
  }

  const selectExercise = (ex: typeof selected) => {
    stop()
    setSelected(ex)
    setSecondsLeft(ex.phases[0].duration)
  }

  const progress = 1 - (secondsLeft / phase.duration)
  const circumference = 2 * Math.PI * 80

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-serif text-3xl text-charcoal mb-1">Breathing <em>Exercises</em></h1>
        <p className="text-muted text-sm">Your breath is always there — let it slow you down</p>
      </div>

      {/* Exercise selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {BREATHING_EXERCISES.map(ex => (
          <button
            key={ex.id}
            onClick={() => selectExercise(ex)}
            className={cn(
              'card p-4 text-center transition-all',
              selected.id === ex.id ? 'border-sage-400 bg-sage-50 shadow-glow' : 'hover:border-sage-200'
            )}
          >
            <div className="text-2xl mb-1">{ex.emoji}</div>
            <div className={cn('text-xs font-medium', selected.id === ex.id ? 'text-sage-700' : 'text-muted')}>{ex.name}</div>
          </button>
        ))}
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-charcoal mb-1">{selected.name}</h2>
        <p className="text-sm text-muted mb-8">{selected.description}</p>

        {/* Circle breathing visual */}
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Background ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="80" fill="none" stroke="#e8f0e8" strokeWidth="8" />
              <motion.circle
                cx="100" cy="100" r="80"
                fill="none"
                stroke={running ? phase.color : '#A8C5AA'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={running ? circumference * (1 - progress) : circumference}
                transition={{ duration: 0.5 }}
              />
            </svg>

            {/* Breathing orb */}
            <motion.div
              className="w-28 h-28 rounded-full flex flex-col items-center justify-center"
              style={{ backgroundColor: running ? phase.color + '22' : '#e8f0e822', border: `2px solid ${running ? phase.color : '#A8C5AA'}` }}
              animate={running ? {
                scale: phase.label === 'Inhale' ? 1.15 : phase.label === 'Exhale' ? 0.9 : 1,
              } : { scale: 1 }}
              transition={{ duration: phase.duration * 0.8, ease: 'easeInOut' }}
            >
              <AnimatePresence mode="wait">
                <motion.div key={phaseIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                  <div className="text-2xl font-serif font-bold text-charcoal">{running ? secondsLeft : '–'}</div>
                  <div className="text-xs text-muted font-medium">{running ? phase.label : 'Ready'}</div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Phase indicators */}
          <div className="flex gap-2">
            {phases.map((p, i) => (
              <div
                key={i}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all text-xs',
                  running && i === phaseIdx ? 'bg-sage-100 text-sage-700 font-medium' : 'text-muted'
                )}
              >
                <span className="font-medium">{p.label}</span>
                <span>{p.duration}s</span>
              </div>
            ))}
          </div>

          {running && <div className="text-sm text-muted">Cycles: <strong className="text-charcoal">{cycles}</strong></div>}

          <button
            onClick={running ? stop : start}
            className={cn('flex items-center gap-2 px-8 py-3 rounded-2xl font-medium transition-all', running ? 'btn-secondary' : 'btn-primary')}
          >
            {running ? <><Square className="w-4 h-4" /> Stop</> : <><Play className="w-4 h-4" /> Start</>}
          </button>
        </div>
      </div>
    </div>
  )
}
